import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 10) {
        logger.error('Досягнуто максимум спроб перепідключення Redis. Припиняємо.');
        return new Error('Досягнуто максимум спроб перепідключення Redis');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Перепідключення до Redis через ${delay}мс (спроба ${retries + 1})`);
      return delay;
    },
  },
});

redisClient.on('error', (err) => {
  logger.error(`Помилка клієнта Redis: ${err.message}`);
});

redisClient.on('reconnecting', () => {
  logger.warn('Перепідключення клієнта Redis...');
});

redisClient.on('ready', () => {
  logger.info('Клієнт Redis готовий');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis успішно підключено');
  } catch (err) {
    logger.error(`Не вдалося підключитися до Redis: ${err.message}`);
    throw err;
  }
};

const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    logger.info("З'єднання з Redis закрито");
  } catch (err) {
    logger.error(`Помилка відключення Redis: ${err.message}`);
  }
};

export { redisClient, connectRedis, disconnectRedis };
