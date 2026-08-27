import crypto from "crypto";

const HASH_KEYLEN = 64;
const SALT_LENGTH = 16;

const hashRaw = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, HASH_KEYLEN, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });

export const PasswordProvider = {
  async hash(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
    const hash = await hashRaw(password, salt);
    return `${salt}:${hash}`;
  },

  async verify(password, stored) {
    const parts = stored.split(":");
    if (parts.length !== 2) return false;

    const [salt, hash] = parts;
    if (!salt || !hash || hash.length !== HASH_KEYLEN * 2) return false;

    const candidate = await hashRaw(password, salt);
    return crypto.timingSafeEqual(
      Buffer.from(candidate, "hex"),
      Buffer.from(hash, "hex"),
    );
  },
};