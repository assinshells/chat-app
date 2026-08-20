import { RoomService } from "../services/room.service.js";
import { HTTP_STATUS } from "../constants/http.constants.js";

/**
 * RoomController — список комнат статический (constants/rooms.data.js),
 * создания/редактирования нет, поэтому контроллер — один эндпоинт.
 */
export const RoomController = {
  list: async (_req, res, next) => {
    try {
      const rooms = RoomService.listRooms();
      res.status(HTTP_STATUS.OK).json({ success: true, rooms });
    } catch (err) {
      next(err);
    }
  },
};
