import { Router } from "express";
import { RoomController } from "../controllers/room.controller.js";
import { MessageController } from "../controllers/message.controller.js";
import { authGuard } from "../guards/auth.guard.js";

const router = Router();

// Весь чат доступен только авторизованным пользователям.
router.use(authGuard);

router.get("/", RoomController.list);
router.get("/:roomId/messages", MessageController.history);

export default router;
