import { BlockRepository } from "../repositories/block.repository.js";
import { FriendRepository } from "../repositories/friend.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toBlockedUserDto } from "../dto/block.dto.js";
import { BlockValidationException } from "../exceptions/chat.exceptions.js";
import { BLOCK_ERRORS } from "../constants/chat.constants.js";

/**
 * BlockService — персональне блокування користувачів ("Заблокувати" в
 * дропдавні ніка, доступно будь-якому користувачу). На відміну від
 * ModerationActionService (bans/kicks), тут немає перевірки ролі —
 * кожен керує лише ВЛАСНИМ списком блокувань.
 *
 * Друзі і блокування — взаємовиключні стани (див. коментар у
 * FriendService.addFriend): блокування когось зі своїх друзів
 * автоматично прибирає його з друзів, а не лишає обидва статуси
 * одночасно.
 */
export const BlockService = {
  async blockUser({ blockerId, blockerLogin, targetLogin }) {
    if (targetLogin === blockerLogin) {
      throw new BlockValidationException(BLOCK_ERRORS.CANNOT_BLOCK_SELF);
    }

    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) {
      throw new BlockValidationException(BLOCK_ERRORS.USER_NOT_FOUND);
    }

    const created = await BlockRepository.create(blockerId, target.id);
    if (!created) {
      throw new BlockValidationException(BLOCK_ERRORS.ALREADY_BLOCKED);
    }

    // Блокування скасовує дружбу в цьому ж напрямку (owner_id = blockerId,
    // friend_id = target.id) — без цього користувач міг би лишитися
    // одночасно і в друзях, і заблокованим. Тихо (DO NOTHING всередині
    // FriendRepository.remove, якщо дружби й не було) — не впливає на
    // результат самого блокування.
    await FriendRepository.remove(blockerId, target.id);

    return { targetId: target.id, targetLogin: target.login };
  },

  async unblockUser({ blockerId, targetLogin }) {
    const target = await UserRepository.findByLogin(targetLogin);
    if (!target) {
      throw new BlockValidationException(BLOCK_ERRORS.USER_NOT_FOUND);
    }

    const removed = await BlockRepository.remove(blockerId, target.id);
    if (!removed) {
      throw new BlockValidationException(BLOCK_ERRORS.NOT_BLOCKED);
    }

    return { targetId: target.id, targetLogin: target.login };
  },

  async listBlocked({ blockerId }) {
    const rows = await BlockRepository.listByBlocker(blockerId);
    return rows.map(toBlockedUserDto);
  },
};
