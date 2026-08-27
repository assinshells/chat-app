import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 10) {
        logger.error('Redis max reconnection attempts reached. Giving up.');
        return new Error('Redis max reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries + 1})`);
      return delay;
    },
  },
});

redisClient.on('error', (err) => {
  logger.error(`Redis client error: ${err.message}`);
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message}`);
    throw err;
  }
};

const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error(`Redis disconnect error: ${err.message}`);
  }
};

export { redisClient, connectRedis, disconnectRedis };