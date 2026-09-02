import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * notFoundHandler — перехоплює запити, що не збігаються з жодним маршрутом.
 * Має бути зареєстрований після всіх маршрутів і перед globalExceptionHandler.
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Маршрут ${req.method} ${req.originalUrl} не знайдено`,
    },
  });
};
