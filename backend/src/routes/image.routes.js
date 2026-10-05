import { Router } from "express";
import { ImageController } from "../controllers/image.controller.js";
import { authGuard } from "../guards/auth.guard.js";

const router = Router();

router.get("/:id", authGuard, ImageController.get);

export default router;
