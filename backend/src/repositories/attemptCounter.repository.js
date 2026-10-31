import crypto from "crypto";
import { redisClient } from "../config/redis.js";
import { REDIS_KEYS } from "../constants/auth.constants.js";

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

/**
 * AttemptCounterRepository — лічильники спроб у Redis із ковзним TTL
 * "від першої спроби" (фіксоване вікно).
 */
const increment = async (key, windowSeconds) => {
  const count = await redisClient.incr(key);
  // Якщо процес впав між INCR і EXPIRE, ключ лишився б без TTL і
  // блокував би назавжди — тому TTL перевіряється, а не лише count === 1.
  if (count === 1 || (await redisClient.ttl(key)) === -1) {
    await redisClient.expire(key, windowSeconds);
  }
  return count;
};

const read = async (key) => Number((await redisClient.get(key)) ?? 0);

export const AttemptCounterRepository = {
  loginFailKey: (login) => REDIS_KEYS.loginFail(sha(login.toLowerCase())),
  regStartKey: (ip) => REDIS_KEYS.regStartIp(String(ip ?? "unknown")),
  increment,
  read,
  async reset(key) {
    await redisClient.del(key);
  },
};
