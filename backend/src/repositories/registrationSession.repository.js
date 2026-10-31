import crypto from "crypto";
import { redisClient } from "../config/redis.js";
import { REDIS_KEYS } from "../constants/auth.constants.js";

const LOCK_TTL_SECONDS = 30;

// Ключі в Redis будуються від sha256(id із cookie): id із cookie —
// "ключ від сесії", і в самому Redis його в чистому вигляді немає.
const hashId = (id) => crypto.createHash("sha256").update(id).digest("hex");

/**
 * RegistrationSessionRepository — тимчасові реєстраційні сесії в Redis.
 *
 * У сесії лежить лише логін і scrypt-хеш пароля (прораховані на кроці
 * "Увійти"). Пароль у чистому вигляді на сервері не зберігається ніколи.
 * Користувача в БД на цьому етапі ще немає — він створюється тільки на
 * "В чат" (AuthFlowService.completeRegistration).
 */
export const RegistrationSessionRepository = {
  newId() {
    return crypto.randomBytes(32).toString("base64url");
  },

  async create(id, data, ttlSeconds) {
    await redisClient.set(
      REDIS_KEYS.regSession(hashId(id)),
      JSON.stringify(data),
      { EX: ttlSeconds },
    );
  },

  /** @returns {Promise<{ data: object, ttlSeconds: number } | null>} */
  async get(id) {
    if (typeof id !== "string" || id.length < 20 || id.length > 128) return null;
    const key = REDIS_KEYS.regSession(hashId(id));
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      const ttl = await redisClient.ttl(key);
      return { data: JSON.parse(raw), ttlSeconds: Math.max(ttl, 0) };
    } catch {
      return null;
    }
  },

  async delete(id) {
    if (typeof id !== "string" || !id) return;
    const h = hashId(id);
    await redisClient.del([REDIS_KEYS.regSession(h), REDIS_KEYS.regLock(h)]);
  },

  /**
   * Взаємне виключення на час завершення реєстрації: другий паралельний
   * запит із тією ж сесією (подвійний клік, повтор) отримує false.
   * TTL захищає від "вічного" замка, якщо процес впав посередині.
   */
  async acquireLock(id) {
    const res = await redisClient.set(REDIS_KEYS.regLock(hashId(id)), "1", {
      NX: true,
      EX: LOCK_TTL_SECONDS,
    });
    return res === "OK";
  },

  async releaseLock(id) {
    await redisClient.del(REDIS_KEYS.regLock(hashId(id)));
  },
};
