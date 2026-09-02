import { MessageService } from "../services/message.service.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * MessageController — наразі лише читання історії.
 * Надсилання повідомлень відбувається через Socket.IO (див. sockets/chat.socket.js),
 * а не через REST — повідомлення має миттєво долетіти до всіх
 * підключених клієнтів, звичайний запит/відповідь для цього не підходить.
 */
export const MessageController = {
  getHistory: async (req, res, next) => {
    try {
      const { limit, room } = req.query;
      const messages = await MessageService.getHistory({ limit, room });
      res.status(HTTP_STATUS.OK).json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  },
};