import { MessageService } from "../services/message.service.js";
import { validateHistoryQuery } from "../validators/chat.validator.js";
import { HTTP_STATUS } from "../constants/http.constants.js";

export const MessageController = {
  /**
   * GET /api/rooms/:roomId/messages?before=<messageId>
   * Отправка новых сообщений идёт через Socket.IO (message.socket.js);
   * этот REST-эндпоинт — только для начальной/подгружаемой истории.
   */
  history: async (req, res, next) => {
    try {
      validateHistoryQuery(req.query);
      const roomId = req.params.roomId;
      const beforeId = req.query.before ? Number(req.query.before) : undefined;
      const messages = await MessageService.getHistory(roomId, { beforeId });
      res.status(HTTP_STATUS.OK).json({ success: true, messages });
    } catch (err) {
      next(err);
    }
  },
};
