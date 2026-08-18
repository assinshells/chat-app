import { HTTP_STATUS } from "../constants/auth.constants.js";

/**
 * notFoundHandler — catches requests that don't match any route.
 * Must be registered after all routes and before globalExceptionHandler.
 */
export const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};
