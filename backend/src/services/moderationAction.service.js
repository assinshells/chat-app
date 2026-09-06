import { UserRepository } from "../repositories/user.repository.js";
import { ModeratorRoomRepository } from "../repositories/moderatorRoom.repository.js";
import { BanRepository } from "../repositories/ban.repository.js";
import { ModerationLogRepository } from "../repositories/moderationLog.repository.js";
import {
  forceLeaveRoom,
  forceDisconnectUser,
  ModerationEvents,
} from "../sockets/moderationEnforcement.js";
import { ROLE_VALUES } from "../constants/auth.constants.js";
import {
  MODERATION_ACTIONS,
  MODERATION_ERRORS,
} from "../constants/moderationAction.constants.js";
import { isValidRoom } from "../constants/chat.constants.js";
import {
  NotFoundException,
  ValidationException,
  AuthorizationException,
} from "../exceptions/auth.exceptions.js";

/**
 * assertCanAct — спільні перевірки прав для кіку/бану/розбану:
 *  - не можна карати самого себе;
 *  - суперадмін недоторканний ні для кого;
 *  - адміна може карати лише суперадмін;
 *  - модератор діє лише в межах СВОЇХ moderatorRooms (див.
 *    features/roles) і не може видавати дії з room === null
 *    (глобальний бан) взагалі — це прерогатива admin/superadmin.
 */
async function assertCanAct({ actorId, actorRole, target, room }) {
  if (target.id === actorId) {
    throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SELF);
  }
  if (target.role === ROLE_VALUES.SUPERADMIN) {
    throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SUPERADMIN);
  }
  if (target.role === ROLE_VALUES.ADMIN && actorRole !== ROLE_VALUES.SUPERADMIN) {
    throw new AuthorizationException(MODERATION_ERRORS.ADMIN_ONLY_SUPERADMIN);
  }

  if (actorRole === ROLE_VALUES.MODERATOR) {
    if (!room) {
      throw new AuthorizationException(
        MODERATION_ERRORS.GLOBAL_FORBIDDEN_FOR_MODERATOR,
      );
    }
    const moderatorRooms = await ModeratorRoomRepository.listByUserId(actorId);
    if (!moderatorRooms.includes(room)) {
      throw new AuthorizationException(MODERATION_ERRORS.NOT_MODERATED_ROOM);
    }
  }
}

export const ModerationActionService = {
  /**
   * kick — миттєве, безстанове видалення з КОНКРЕТНОЇ кімнати. Не
   * створює запис у bans (нічого не "діє в часі") — лише запис в
   * аудит-журналі та примусовий socket.leave на вже підключених сокетах.
   */
  async kick({ io, actorId, actorRole, targetLogin, room, reason }) {
    if (!isValidRoom(room)) {
      throw new ValidationException(MODERATION_ERRORS.ROOM_INVALID);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    await assertCanAct({ actorId, actorRole, target, room });

    await ModerationLogRepository.record({
      action: MODERATION_ACTIONS.KICK,
      targetUserId: target.id,
      room,
      actorId,
      reason,
    });

    await forceLeaveRoom(io, target.id, room, {
      event: ModerationEvents.KICKED,
      reason,
    });

    return { login: target.login, room };
  },

  /**
   * ban — створює запис у bans (стан, що діє в часі) і, якщо жертва
   * зараз онлайн, одразу застосовує його: room-бан виштовхує лише з
   * цієї кімнати (forceLeaveRoom), глобальний — рве з'єднання повністю
   * (forceDisconnectUser), оскільки блокує чат цілком, а не одну кімнату.
   */
  async ban({ io, actorId, actorRole, targetLogin, scope, room, durationMs, reason }) {
    const isGlobal = scope === "global";

    if (!isGlobal && !isValidRoom(room)) {
      throw new ValidationException(MODERATION_ERRORS.ROOM_INVALID);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    await assertCanAct({ actorId, actorRole, target, room: isGlobal ? null : room });

    const banRoom = isGlobal ? null : room;
    const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

    const ban = await BanRepository.create({
      targetUserId: target.id,
      room: banRoom,
      issuedBy: actorId,
      reason,
      expiresAt,
    });

    await ModerationLogRepository.record({
      action: MODERATION_ACTIONS.BAN,
      targetUserId: target.id,
      room: banRoom,
      actorId,
      reason,
      expiresAt,
    });

    if (isGlobal) {
      await forceDisconnectUser(io, target.id, {
        event: ModerationEvents.BANNED,
        scope: "global",
        reason,
        expiresAt,
      });
    } else {
      await forceLeaveRoom(io, target.id, banRoom, {
        event: ModerationEvents.BANNED,
        scope: "room",
        reason,
        expiresAt,
      });
    }

    return {
      id: ban.id,
      login: target.login,
      scope: isGlobal ? "global" : "room",
      room: banRoom,
      reason: ban.reason,
      expiresAt: ban.expires_at,
    };
  },

  /**
   * unban — знімає конкретний бан за його id (не за login: у
   * користувача одночасно може діяти декілька банів — наприклад,
   * глобальний і ще один на конкретну кімнату з минулого разу — тому
   * "зняти бан по login" було б неоднозначним). Ідемпотентний: якщо
   * бан уже неактивний (сплив/знятий раніше), просто повертає успіх.
   */
  async unban({ actorId, actorRole, banId }) {
    const ban = await BanRepository.findById(banId);
    if (!ban) throw new NotFoundException(MODERATION_ERRORS.BAN_NOT_FOUND);

    const target = await UserRepository.findById(ban.target_user_id);
    if (!target) throw new NotFoundException();

    await assertCanAct({ actorId, actorRole, target, room: ban.room });

    const revoked = await BanRepository.revoke(banId, actorId);
    if (revoked) {
      await ModerationLogRepository.record({
        action: MODERATION_ACTIONS.UNBAN,
        targetUserId: target.id,
        room: ban.room,
        actorId,
        reason: null,
      });
    }
    // revoked === null означає, що бан уже був знятий/сплив між SELECT
    // і UPDATE (гонка) або раніше — в обох випадках результат для
    // виклику той самий: бан наразі не активний, це не помилка.

    return { id: banId, login: target.login, revoked: true };
  },

  /** listActiveBans — активні бани користувача (для модалки керування банами). */
  async listActiveBans({ login }) {
    const user = await UserRepository.findByLogin(login);
    if (!user) throw new NotFoundException();
    return BanRepository.listActiveForUser(user.id);
  },
};
