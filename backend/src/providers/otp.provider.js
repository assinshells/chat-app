import crypto from "crypto";
import { authConfig } from "../config/auth.config.js";

export const OtpProvider = {
  generate() {
    return String(
      crypto.randomInt(0, Math.pow(10, authConfig.otp.length)),
    ).padStart(authConfig.otp.length, "0");
  },

  // Opaque одноразовий токен для короткоживучого стану "verified"
  // після успішної перевірки OTP (використовується в reset-password флоу).
  // Не JWT і не пов'язаний з access/refresh токенами — це окремий,
  // непрозорий ідентифікатор запису в Redis.
  generateVerifiedToken() {
    return crypto.randomBytes(32).toString("hex");
  },
};
