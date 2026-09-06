import { Router } from "express";
import { RoleController } from "../controllers/role.controller.js";
import { authGuard } from "../guards/auth.guard.js";
import { requireRole } from "../guards/role.guard.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { ROLE_MANAGER_ROLES } from "../constants/auth.constants.js";

const router = Router();

// Усі роути керування ролями доступні лише admin/superadmin (requireRole
// читає роль напряму з БД — див. коментар у guards/role.guard.js).
router.use(authGuard, requireRole(ROLE_MANAGER_ROLES));

router.get("/:login", RoleController.getRole);
router.post("/assign", csrfProtection, RoleController.assign);
router.post("/remove", csrfProtection, RoleController.remove);

export default router;
