import { Router } from "express";
import { MessageController } from "../controllers/message.controller.js";
import { authGuard } from "../guards/auth.guard.js";

const router = Router();

router.get("/", authGuard, MessageController.getHistory);

export default router;