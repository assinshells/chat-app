import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import logger from "./config/logger.js";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { globalExceptionHandler } from "./middlewares/globalException.middleware.js";

const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  logger.warn("CLIENT_URL is not set — CORS will block all browser requests");
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL || false,
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use(notFoundHandler);
app.use(globalExceptionHandler);

export default app;