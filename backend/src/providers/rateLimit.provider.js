import rateLimit from "express-rate-limit";
import { authConfig } from "../config/auth.config.js";
import { AUTH_ERRORS } from "../constants/auth.constants.js";

const makeRateLimiter = (maxRequests) =>
  rateLimit({
    windowMs: authConfig.rateLimit.windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: AUTH_ERRORS.RATE_LIMIT_EXCEEDED,
        },
      });
    },
  });

export const RateLimitProvider = {
  login: makeRateLimiter(authConfig.rateLimit.login.max),
  register: makeRateLimiter(authConfig.rateLimit.register.max),
  forgotPassword: makeRateLimiter(authConfig.rateLimit.forgotPassword.max),
  verifyOtp: makeRateLimiter(authConfig.rateLimit.verifyOtp.max),
  resetPassword: makeRateLimiter(authConfig.rateLimit.resetPassword.max),
  refresh: makeRateLimiter(authConfig.rateLimit.refresh.max),
};