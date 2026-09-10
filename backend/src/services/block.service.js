import { BlockRepository } from "../repositories/block.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toBlockedUserDto } from "../dto/block.dto.js";
import { BlockValidationException } from "../exceptions/chat.exceptions.js";
import { BLOCK_ERRORS } from "../constants/chat.constants.js";

/**
 * BlockService — персональне блокування користувачів ("Заблокувати" в
 * дропдавні ніка, доступно будь-якому користувачу). На відміну від
 * ModerationActionService (bans/kicks), тут немає перевірки ролі —
 * кожен керує лише ВЛАСНИМ списком блокувань.
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
