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
// refreshToken більше не приходить у тілі запиту — він читається з
// httpOnly cookie (refreshCookieGuard), а csrfProtection перевіряє
// double-submit CSRF-токен, щоб cookie не можна було "змусити"
// відправитися зі стороннього сайту.
router.post(
  "/refresh",
  RateLimitProvider.refresh,
  refreshCookieGuard,
  csrfProtection,
  AuthController.refresh,
);
router.post("/logout", authGuard, csrfProtection, AuthController.logout);
router.patch(
  "/gender",
  authGuard,
  csrfProtection,
  AuthController.updateGender,
);
router.patch(
  "/color",
  authGuard,
  csrfProtection,
  AuthController.updateColor,
);

export default router;