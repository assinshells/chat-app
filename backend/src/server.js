import "dotenv/config";
import http from "http";
import app from "./app.js";
import logger from "./config/logger.js";
import { env, assertRequiredEnv } from "./config/env.js";
import { connectDatabase, pool } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { createSocketServer } from "./config/socket.js";
import { initSockets } from "./sockets/index.js";

try {
  assertRequiredEnv();
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const PORT = env.port;

const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);
initSockets(io);

const shutdown = async (signal) => {
  logger.info(`Отримано ${signal}. Починаємо штатне завершення роботи...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Час на штатне завершення вичерпано. Примусовий вихід.");
    process.exit(1);
  }, 15000);

  forceExitTimer.unref();

  try {
    await new Promise((resolve) => io.close(resolve));
    logger.info("Сервер Socket.IO зупинено");

    await new Promise((resolve) => httpServer.close(resolve));
    logger.info("HTTP-сервер зупинено");

    await pool.end();
    logger.info("Пул PostgreSQL закрито");

    await disconnectRedis();
    logger.info("З'єднання з Redis закрито");

    logger.info("Штатне завершення роботи завершено");
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error(`Помилка під час завершення роботи: ${err.message}`);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Необроблене відхилення: ${String(reason)}`);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`Необроблений виняток: ${err.message}`, { stack: err.stack });
  shutdown("uncaughtException");
});

const start = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    httpServer.listen(PORT, () => {
      logger.info(`Сервер запущено на порту ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error(`Не вдалося запустити сервер: ${err.message}`);
    process.exit(1);
  }
};

start();
