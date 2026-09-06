import { UserRepository } from "../repositories/user.repository.js";
import { ModeratorRoomRepository } from "../repositories/moderatorRoom.repository.js";
import {
  ROLE_VALUES,
  ASSIGNABLE_ROLES,
  AUTH_ERRORS,
} from "../constants/auth.constants.js";
import { ROOM_IDS, isValidRoom } from "../constants/chat.constants.js";
import {
  NotFoundException,
  ValidationException,
  RoleForbiddenException,
} from "../exceptions/auth.exceptions.js";

/**
 * Лише 'superadmin' може призначати/знімати роль 'admin' — інакше один
 * адмін міг би безконтрольно наплодити інших адмінів. Роль 'moderator'
 * можуть видавати і admin, і superadmin (узгоджено з тим, що admin і так
 * модерує всі кімнати — це "молодша" за нього роль).
 */
function assertCanGrantRole(actorRole, role) {
  if (role === ROLE_VALUES.ADMIN && actorRole !== ROLE_VALUES.SUPERADMIN) {
    throw new RoleForbiddenException(AUTH_ERRORS.ROLE_ADMIN_ONLY_SUPERADMIN);
  }
}

/**
 * Захист цілі: не можна змінювати власну роль через цей API (щоб
 * випадково не позбавити себе прав), не можна чіпати суперадміна
 * (роль лише одна, керується через SUPERADMIN_* env, не через UI),
 * і роль 'admin' може змінювати лише superadmin — навіть на пониження.
 */
function assertCanTargetUser({ actorId, actorRole, target }) {
  if (target.id === actorId) {
    throw new RoleForbiddenException(AUTH_ERRORS.ROLE_CANNOT_TARGET_SELF);
  }
  if (target.role === ROLE_VALUES.SUPERADMIN) {
    throw new RoleForbiddenException(AUTH_ERRORS.ROLE_CANNOT_TARGET_SUPERADMIN);
  }
  if (target.role === ROLE_VALUES.ADMIN && actorRole !== ROLE_VALUES.SUPERADMIN) {
    throw new RoleForbiddenException(AUTH_ERRORS.ROLE_ADMIN_ONLY_SUPERADMIN);
  }
}

export const RoleService = {
  /**
   * getRoleInfo — поточна роль користувача + перелік кімнат, якщо він
   * модератор. Використовується фронтом для попереднього заповнення
   * модалки керування роллю при відкритті (див. features/roles).
   */
  async getRoleInfo({ login }) {
    const user = await UserRepository.findByLogin(login);
    if (!user) throw new NotFoundException();

    const rooms =
      user.role === ROLE_VALUES.MODERATOR
        ? await ModeratorRoomRepository.listByUserId(user.id)
        : [];

    return { login: user.login, role: user.role, rooms };
  },

  async assignRole({ actorId, actorRole, targetLogin, role, rooms = [] }) {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new ValidationException(AUTH_ERRORS.ROLE_INVALID);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    assertCanTargetUser({ actorId, actorRole, target });
    assertCanGrantRole(actorRole, role);

    // 'admin' модерує всі кімнати одразу — явний перелік не потрібен.
    // 'moderator' без жодної обраної кімнати нічого не модерував би,
    // тому це вважається помилкою вводу, а не валідним "порожнім" станом.
    let safeRooms = [];
    if (role === ROLE_VALUES.MODERATOR) {
      safeRooms = Array.from(new Set(rooms));
      if (safeRooms.length === 0) {
        throw new ValidationException(AUTH_ERRORS.ROLE_ROOMS_REQUIRED);
      }
      if (!safeRooms.every(isValidRoom)) {
        throw new ValidationException(AUTH_ERRORS.ROLE_ROOMS_INVALID);
      }
    }

    const updated = await UserRepository.updateRole(target.id, role);
    if (!updated) throw new NotFoundException();

    if (role === ROLE_VALUES.MODERATOR) {
      await ModeratorRoomRepository.replaceForUser(target.id, safeRooms);
    } else {
      await ModeratorRoomRepository.clearForUser(target.id);
    }

    return { login: updated.login, role: updated.role, rooms: safeRooms };
  },

  async removeRole({ actorId, actorRole, targetLogin }) {
    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) throw new NotFoundException();

    assertCanTargetUser({ actorId, actorRole, target });

    if (target.role === ROLE_VALUES.USER) {
      // Уже без ролі — ідемпотентний no-op, а не помилка.
      return { login: target.login, role: ROLE_VALUES.USER, rooms: [] };
    }

    const updated = await UserRepository.updateRole(
      target.id,
      ROLE_VALUES.USER,
    );
    await ModeratorRoomRepository.clearForUser(target.id);

    return { login: updated.login, role: updated.role, rooms: [] };
  },

  /**
   * getModeratedRooms — перелік кімнат, які користувач може модерувати
   * з огляду на роль. Не використовується жодним HTTP-роутом наразі
   * (у застосунку поки немає самих дій модерації типу "видалити
   * повідомлення"/"замутити") — підготовлено для майбутньої модерації,
   * щоб не дублювати цю логіку в кожному місці, де вона знадобиться.
   */
  async getModeratedRooms(user) {
    if (user.role === ROLE_VALUES.ADMIN || user.role === ROLE_VALUES.SUPERADMIN) {
      return ROOM_IDS;
    }
    if (user.role === ROLE_VALUES.MODERATOR) {
      return ModeratorRoomRepository.listByUserId(user.id);
    }
    return [];
  },
};
