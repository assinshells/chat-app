import { Router } from "express";
import { ModerationActionController } from "../controllers/moderationAction.controller.js";
import { authGuard } from "../guards/auth.guard.js";
import { requireRole } from "../guards/role.guard.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { MODERATION_ACTOR_ROLES } from "../constants/moderationAction.constants.js";

const router = Router();

// На відміну від role.routes.js (лише admin/superadmin), сюди
// допущені й модератори — саме requireRole тут визначає, ХТО взагалі
// може достукатися до цих роутів; ЩО саме конкретному актору дозволено
// (яка кімната, чи можна глобально) — вирішує вже
// ModerationActionService (перевіряє moderatorRooms для 'moderator').
router.use(authGuard, requireRole(MODERATION_ACTOR_ROLES));

router.get("/bans/:login", ModerationActionController.listActiveBans);
router.post("/kick", csrfProtection, ModerationActionController.kick);
router.post("/kick-chat", csrfProtection, ModerationActionController.kickChat);
router.post("/ban", csrfProtection, ModerationActionController.ban);
router.post("/ban-room", csrfProtection, ModerationActionController.banRoom);
router.post("/unban", csrfProtection, ModerationActionController.unban);
router.post(
  "/release-confinement",
  csrfProtection,
  ModerationActionController.releaseConfinement,
);

export default router;
