import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authGuard } from "../guards/auth.guard.js";
import { refreshCookieGuard } from "../guards/refreshCookie.guard.js";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { RateLimitProvider } from "../providers/rateLimit.provider.js";

const router = Router();

router.post("/login", RateLimitProvider.login, AuthController.login);
router.post("/register", RateLimitProvider.register, AuthController.register);
router.post(
  "/forgot-password",
  RateLimitProvider.forgotPassword,
  AuthController.forgotPassword,
);
router.post(
  "/verify-otp",
  RateLimitProvider.verifyOtp,
  AuthController.verifyOtp,
);
router.post(
  "/reset-password",
  RateLimitProvider.resetPassword,
  AuthController.resetPassword,
);
// refreshToken больше не приходит в теле запроса — он читается из
// httpOnly cookie (refreshCookieGuard), а csrfProtection проверяет
// double-submit CSRF-токен, чтобы cookie нельзя было "заставить"
// отправиться со стороннего сайта.
router.post(
  "/refresh",
  RateLimitProvider.refresh,
  refreshCookieGuard,
  csrfProtection,
  AuthController.refresh,
);
router.post("/logout", authGuard, csrfProtection, AuthController.logout);
router.get("/me", authGuard, AuthController.me);

export default router;