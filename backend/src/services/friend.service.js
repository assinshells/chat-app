import { FriendRepository } from "../repositories/friend.repository.js";
import { BlockRepository } from "../repositories/block.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toFriendUserDto } from "../dto/friend.dto.js";
import { FriendValidationException } from "../exceptions/chat.exceptions.js";
import { FRIEND_ERRORS } from "../constants/chat.constants.js";

/**
 * FriendService — персональний список друзів ("Додати до друзів" в
 * дропдавні ніка, доступно будь-якому користувачу). Як і
 * BlockService — жодної перевірки ролі, кожен керує лише ВЛАСНИМ
 * списком друзів.
 *
 * Друзі і блокування — взаємовиключні стани (не можна одночасно бути
 * і в друзях, і заблокованим для того самого власника списку):
 * addFriend тут відмовляє, якщо ціль уже заблокована, а
 * BlockService.blockUser, навпаки, автоматично прибирає ціль з друзів
 * при блокуванні (див. коментар там).
 */
export const FriendService = {
  async addFriend({ ownerId, ownerLogin, targetLogin }) {
    if (targetLogin === ownerLogin) {
      throw new FriendValidationException(FRIEND_ERRORS.CANNOT_FRIEND_SELF);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) {
      throw new FriendValidationException(FRIEND_ERRORS.USER_NOT_FOUND);
    }

    const alreadyBlocked = await BlockRepository.isBlocked(ownerId, target.id);
    if (alreadyBlocked) {
      throw new FriendValidationException(FRIEND_ERRORS.CANNOT_FRIEND_BLOCKED);
    }

    const created = await FriendRepository.create(ownerId, target.id);
    if (!created) {
      throw new FriendValidationException(FRIEND_ERRORS.ALREADY_FRIEND);
    }

    return { targetId: target.id, targetLogin: target.login };
  },

  async removeFriend({ ownerId, targetLogin }) {
    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) {
      throw new FriendValidationException(FRIEND_ERRORS.USER_NOT_FOUND);
    }

    const removed = await FriendRepository.remove(ownerId, target.id);
    if (!removed) {
      throw new FriendValidationException(FRIEND_ERRORS.NOT_FRIEND);
    }

    return { targetId: target.id, targetLogin: target.login };
  },

  async listFriends({ ownerId }) {
    const rows = await FriendRepository.listByOwner(ownerId);
    return rows.map(toFriendUserDto);
  },
};
