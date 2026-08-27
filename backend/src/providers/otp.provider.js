import crypto from "crypto";
import { authConfig } from "../config/auth.config.js";

export const OtpProvider = {
  generate() {
    return String(
      crypto.randomInt(0, Math.pow(10, authConfig.otp.length)),
    ).padStart(authConfig.otp.length, "0");
  },

  // Opaque одноразовый токен для короткоживущего "verified" состояния
  // после успешной проверки OTP (используется reset-password флоу).
  // Не JWT и не связан с access/refresh токенами — это отдельный,
  // непрозрачный идентификатор записи в Redis.
  generateVerifiedToken() {
    return crypto.randomBytes(32).toString("hex");
  },
};