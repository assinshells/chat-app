import { MessageService } from "../services/message.service.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * MessageController — на данный момент только чтение истории.
 * Отправка сообщений идёт через Socket.IO (см. sockets/chat.socket.js),
 * а не через REST — сообщение должно мгновенно долететь до всех
 * подключённых клиентов, обычный запрос/ответ для этого не подходит.
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