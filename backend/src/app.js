import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import logger from "./config/logger.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import imageRoutes from "./routes/image.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import roleRoutes from "./routes/role.routes.js";
import moderationActionRoutes from "./routes/moderationAction.routes.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { globalExceptionHandler } from "./middlewares/globalException.middleware.js";

const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  logger.warn("CLIENT_URL не задано — CORS блокуватиме всі запити з браузера");
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
app.use(cookieParser());
// Галерея підключається ДО глобального express.json(): фото йде JSON-ом
// у base64 (до ~2 МБ), а глобальний парсер має ліміт 100 КБ і відхилив би
// запит раніше. Власний парсер із потрібним лімітом — у gallery.routes.js.
app.use("/api/gallery", galleryRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/moderation", moderationActionRoutes);

app.use(notFoundHandler);
app.use(globalExceptionHandler);

export default app;
