import { UserRepository } from "../repositories/user.repository.js";
import { ModeratorRoomRepository } from "../repositories/moderatorRoom.repository.js";
import { BanRepository } from "../repositories/ban.repository.js";
import { ConfinementRepository } from "../repositories/confinement.repository.js";
import { ModerationLogRepository } from "../repositories/moderationLog.repository.js";
import {
  forceLeaveRoom,
  forceDisconnectUser,
  enforceKickConfinement,
  enforceRoomBanRelocate,
  ModerationEvents,
} from "../sockets/moderationEnforcement.js";
import { ROLE_VALUES } from "../constants/auth.constants.js";
import {
  MODERATION_ACTIONS,
  MODERATION_ERRORS,
  DEFAULT_MODERATOR_DURATION_MS,
} from "../constants/moderationAction.constants.js";
import { ROOM_IDS, isValidRoom, KICK_CONFINEMENT_ROOM } from "../constants/chat.constants.js";
import {
  NotFoundException,
  ValidationException,
  AuthorizationException,
} from "../exceptions/auth.exceptions.js";

/**
 * resolveDurationMs — центральне місце, де тривалість дії
 * ПЕРЕЗАПИСУЄТЬСЯ для модератора: незалежно від того, що прийшло від
 * клієнта (навіть якщо запит підроблений напряму через API, в обхід
 * UI), для actorRole === 'moderator' завжди застосовується фіксований
 * DEFAULT_MODERATOR_DURATION_MS (10 хв) — "для адмінів можливість
 * встановлювати час" означає, що САМЕ ЦЯ можливість недоступна
 * модератору, а не лише прихована в інтерфейсі.
 *
 * allowPermanent — чи можна передати durationMs === null/undefined,
 * щоб отримати "назавжди" (лише для BAN/BAN_ROOM, коли актор —
 * admin/superadmin; кік і "з чату" завжди тимчасові).
 */
function resolveDurationMs({ actorRole, requestedDurationMs, allowPermanent = false }) {
  if (actorRole === ROLE_VALUES.MODERATOR) {
    return DEFAULT_MODERATOR_DURATION_MS;
  }

  if (requestedDurationMs === null || requestedDurationMs === undefined) {
    if (allowPermanent) return null;
    return DEFAULT_MODERATOR_DURATION_MS;
  }

  return requestedDurationMs;
}

/**
 * resolveActorRooms — кімнати, у яких actor має право модерувати "весь
 * список одразу" (потрібно для BAN_ROOM): для moderator — це рівно
 * moderatorRooms; для admin/superadmin — усі кімнати чату, ОКРІМ
 * KICK_CONFINEMENT_ROOM (bespredel навмисно лишається відкритою —
 * саме туди жертву переносить сама дія, замикати її й там немає сенсу).
 */
async function resolveActorRooms({ actorId, actorRole }) {
  if (actorRole === ROLE_VALUES.MODERATOR) {
    return ModeratorRoomRepository.listByUserId(actorId);
  }
  return ROOM_IDS.filter((room) => room !== KICK_CONFINEMENT_ROOM);
}

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
   * kick — на відміну від "виштовхнути і одразу можна повернутися",
   * тепер це ТИМЧАСОВЕ ОБМЕЖЕННЯ (room_confinements): жертву переводить
   * у KICK_CONFINEMENT_ROOM ("bespredel") і на durationMs забороняє
   * переходити в БУДЬ-ЯКУ іншу кімнату (перевіряється в room:join, див.
   * sockets/chat.socket.js) — інакше кік нічим не відрізнявся б від
   * "нічого не сталося", бо кікнутий міг би одразу зайти назад.
   */
  async kick({ io, actorId, actorRole, targetLogin, room, durationMs, reason }) {
    if (!isValidRoom(room)) {
      throw new ValidationException(MODERATION_ERRORS.ROOM_INVALID);
    }

    const effectiveDurationMs = resolveDurationMs({
      actorRole,
      requestedDurationMs: durationMs,
    });
    if (!effectiveDurationMs || effectiveDurationMs <= 0) {
      throw new ValidationException(MODERATION_ERRORS.DURATION_REQUIRED);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    await assertCanAct({ actorId, actorRole, target, room });

    const expiresAt = new Date(Date.now() + effectiveDurationMs);

    await ConfinementRepository.upsert({
      userId: target.id,
      confinedRoom: KICK_CONFINEMENT_ROOM,
      sourceRoom: room,
      issuedBy: actorId,
      reason,
      expiresAt,
    });

    await ModerationLogRepository.record({
      action: MODERATION_ACTIONS.KICK,
      targetUserId: target.id,
      room,
      actorId,
      reason,
      expiresAt,
    });

    await enforceKickConfinement(io, target.id, {
      sourceRoom: room,
      confinedRoom: KICK_CONFINEMENT_ROOM,
      reason,
      expiresAt,
    });

    return { login: target.login, room, confinedRoom: KICK_CONFINEMENT_ROOM, expiresAt };
  },

  /**
   * kickChat — "кикнути з чату": на відміну від kick() (замкнення в
   * bespredel, можна лишатись у чаті), тут жертва одразу повністю
   * втрачає доступ до чату на durationMs — не може зайти в ЖОДНУ
   * кімнату, поки бан не спливе (технічно це global-бан із room=null,
   * як і BAN зі scope="global", але завжди ТИМЧАСОВИЙ — durationMs
   * ніколи не буває null/"назавжди", на відміну від повноцінного бану;
   * для постійного вилучення з чату є саме BAN). Room тут не
   * потрібен — це не прив'язана до конкретної кімнати дія, тому
   * проходить без room-перевірки moderatorRooms (кожен модератор
   * модерує принаймні одну кімнату, і "викинути з чату" стосується
   * людини в цілому, а не конкретної кімнати).
   */
  async kickChat({ io, actorId, actorRole, targetLogin, durationMs, reason }) {
    const effectiveDurationMs = resolveDurationMs({ actorRole, requestedDurationMs: durationMs });
    if (!effectiveDurationMs || effectiveDurationMs <= 0) {
      throw new ValidationException(MODERATION_ERRORS.DURATION_REQUIRED);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    // room: null — це не "глобальна дія модератора" в сенсі
    // GLOBAL_FORBIDDEN_FOR_MODERATOR (та заборона стосується
    // повноцінного БАНУ на весь чат назавжди/надовго), а разова
    // тимчасова дія в межах прав, які модератор і так має — тому
    // перевіряються лише self/superadmin/admin-обмеження, без виклику
    // assertCanAct(room: null), яка кинула б GLOBAL_FORBIDDEN_FOR_MODERATOR.
    if (target.id === actorId) {
      throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SELF);
    }
    if (target.role === ROLE_VALUES.SUPERADMIN) {
      throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SUPERADMIN);
    }
    if (target.role === ROLE_VALUES.ADMIN && actorRole !== ROLE_VALUES.SUPERADMIN) {
      throw new AuthorizationException(MODERATION_ERRORS.ADMIN_ONLY_SUPERADMIN);
    }

    const expiresAt = new Date(Date.now() + effectiveDurationMs);

    const ban = await BanRepository.create({
      targetUserId: target.id,
      room: null,
      issuedBy: actorId,
      reason,
      expiresAt,
    });

    await ModerationLogRepository.record({
      action: MODERATION_ACTIONS.KICK_CHAT,
      targetUserId: target.id,
      room: null,
      actorId,
      reason,
      expiresAt,
    });

    await forceDisconnectUser(io, target.id, {
      event: ModerationEvents.BANNED,
      scope: "global",
      reason,
      expiresAt,
    });

    return { id: ban.id, login: target.login, expiresAt };
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
    const effectiveDurationMs = resolveDurationMs({
      actorRole,
      requestedDurationMs: durationMs,
      allowPermanent: true,
    });
    const expiresAt = effectiveDurationMs ? new Date(Date.now() + effectiveDurationMs) : null;

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
   * banRoom — "бан кімнати": на відміну від ban({scope:"room"}) (одна
   * конкретна кімната), тут одразу банить жертву у ВСІХ кімнатах, де
   * ПРАВА МАЄ САМЕ ЦЕЙ АКТОР (moderatorRooms для модератора, усі
   * кімнати чату для admin/superadmin), і одноразово переносить її в
   * bespredel — але, на відміну від kick(), БЕЗ персистентного
   * замкнення: жертва може одразу переходити в будь-яку ІНШУ кімнату,
   * якщо там немає активного бану (перевіряється звичайним room-бан
   * механізмом). Саме тому це не record у room_confinements, а просто
   * пакет room-банів + одноразовий redirect (enforceRoomBanRelocate).
   */
  async banRoom({ io, actorId, actorRole, targetLogin, durationMs, reason }) {
    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    // Як і в kickChat — це дія в межах кімнат, де актор і так має
    // права, а не "глобальна" дія в сенсі GLOBAL_FORBIDDEN_FOR_MODERATOR,
    // тому перевіряються лише self/superadmin/admin-обмеження.
    if (target.id === actorId) {
      throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SELF);
    }
    if (target.role === ROLE_VALUES.SUPERADMIN) {
      throw new AuthorizationException(MODERATION_ERRORS.CANNOT_TARGET_SUPERADMIN);
    }
    if (target.role === ROLE_VALUES.ADMIN && actorRole !== ROLE_VALUES.SUPERADMIN) {
      throw new AuthorizationException(MODERATION_ERRORS.ADMIN_ONLY_SUPERADMIN);
    }

    const rooms = await resolveActorRooms({ actorId, actorRole });
    if (rooms.length === 0) {
      // Модератор без жодної кімнати — стан, що не мав би трапитись
      // (роль призначається лише з непорожнім переліком, див.
      // RoleService.assignRole), але про всяк випадок не мовчимо.
      throw new AuthorizationException(MODERATION_ERRORS.NOT_MODERATED_ROOM);
    }

    const effectiveDurationMs = resolveDurationMs({
      actorRole,
      requestedDurationMs: durationMs,
      allowPermanent: true,
    });
    const expiresAt = effectiveDurationMs ? new Date(Date.now() + effectiveDurationMs) : null;

    const bans = [];
    for (const room of rooms) {
       
      // відкривати `rooms.length` одночасних з'єднань із пулу на один запит.
      const ban = await BanRepository.create({
        targetUserId: target.id,
        room,
        issuedBy: actorId,
        reason,
        expiresAt,
      });
      bans.push(ban);

       
      await ModerationLogRepository.record({
        action: MODERATION_ACTIONS.BAN_ROOM,
        targetUserId: target.id,
        room,
        actorId,
        reason,
        expiresAt,
      });
    }

    await enforceRoomBanRelocate(io, target.id, {
      bannedRooms: rooms,
      redirectRoom: KICK_CONFINEMENT_ROOM,
      reason,
      expiresAt,
    });

    return {
      login: target.login,
      rooms,
      redirectRoom: KICK_CONFINEMENT_ROOM,
      reason,
      expiresAt,
      banIds: bans.map((b) => b.id),
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

  /** getActiveConfinement — поточне кік-обмеження користувача, якщо є (для тієї ж модалки). */
  async getActiveConfinement({ login }) {
    const user = await UserRepository.findByLogin(login);
    if (!user) throw new NotFoundException();
    return ConfinementRepository.findActive(user.id);
  },

  /**
   * releaseConfinement — дострокове зняття кік-обмеження (не чекати
   * expires_at). Права перевіряються за source_room (кімната, ЗВІДКИ
   * кикнули) — саме вона визначає, чи міг би модератор взагалі видати
   * цей кік, а не room=null (це означало б "глобальна дія", якою кік
   * ніколи не є).
   */
  async releaseConfinement({ actorId, actorRole, targetLogin }) {
    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    const confinement = await ConfinementRepository.findActive(target.id);
    if (!confinement) {
      return { login: target.login, released: true };
    }

    await assertCanAct({ actorId, actorRole, target, room: confinement.source_room });

    await ConfinementRepository.revoke(target.id, actorId);
    return { login: target.login, released: true };
  },
};
