import rateLimit from "express-rate-limit";
import { authConfig } from "../config/auth.config.js";
import { AUTH_ERRORS } from "../constants/auth.constants.js";
import { GALLERY_LIMITS } from "../constants/gallery.constants.js";

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

// Завантаження в фотогалерею — рахується по userId (роут стоїть після
// authGuard), а не по IP: за nginx усі користувачі мають спільний IP.
const galleryUploadLimiter = rateLimit({
  windowMs: GALLERY_LIMITS.UPLOAD_RATE_WINDOW_MS,
  max: GALLERY_LIMITS.UPLOAD_RATE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `gallery:${req.userId}`,
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
  galleryUpload: galleryUploadLimiter,
};
