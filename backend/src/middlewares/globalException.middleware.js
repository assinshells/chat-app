import logger from "../config/logger.js";
import { BaseException } from "../exceptions/base.exception.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * GlobalExceptionHandler — єдиний обробник усіх помилок Express.
 * Усі контролери викликають next(err) замість try/catch.
 */
export const globalExceptionHandler = (err, _req, res, _next) => {
  if (err instanceof BaseException) {
    logger.warn(`[${err.code}] ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  logger.error(`Необроблена помилка: ${err.message}`, { stack: err.stack });
  return res.status(HTTP_STATUS.INTERNAL).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Внутрішня помилка сервера"
          : err.message,
    },
  });
};