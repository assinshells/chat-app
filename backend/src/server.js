import "dotenv/config";
import http from "http";
import app from "./app.js";
import logger from "./config/logger.js";
import { env, assertRequiredEnv } from "./config/env.js";
import { connectDatabase, pool } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { createSocketServer } from "./config/socket.js";

try {
  assertRequiredEnv();
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const PORT = env.port;

const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);

const shutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 15000);

  forceExitTimer.unref();

  try {
    await new Promise((resolve) => io.close(resolve));
    logger.info("Socket.IO server closed");

    await new Promise((resolve) => httpServer.close(resolve));
    logger.info("HTTP server closed");

    await pool.end();
    logger.info("PostgreSQL pool closed");

    await disconnectRedis();
    logger.info("Redis connection closed");

    logger.info("Graceful shutdown complete");
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${String(reason)}`);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  shutdown("uncaughtException");
});

const start = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

start();