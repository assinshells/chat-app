import { Router } from "express";
import { RoomController } from "../controllers/room.controller.js";
import { MessageController } from "../controllers/message.controller.js";
import { authGuard } from "../guards/auth.guard.js";

const router = Router();

// Список комнат — статический и не содержит приватных данных
// (см. RoomController.list), поэтому доступен и до логина: LoginForm
// подгружает его для селектора комнаты на форме входа. История же
// сообщений остаётся только для авторизованных.
router.get("/", RoomController.list);
router.get("/:roomId/messages", authGuard, MessageController.history);

export default router;