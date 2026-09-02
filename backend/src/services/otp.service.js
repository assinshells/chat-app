import { OtpRepository } from "../repositories/otp.repository.js";
import { OtpProvider } from "../providers/otp.provider.js";
import { authConfig } from "../config/auth.config.js";
import {
  OtpExpiredException,
  OtpInvalidException,
} from "../exceptions/auth.exceptions.js";

export const OtpService = {
  async generateOtp(userId) {
    const otp = OtpProvider.generate();
    await OtpRepository.saveOtp(userId, otp);
    // Новий код — новий ліміт спроб, інакше можна було б "спалити"
    // спроби чужим forgot-password і заблокувати користувачу OTP.
    await OtpRepository.deleteAttempts(userId);
    return otp;
  },

  /**
   * Перевіряє OTP і обмежує кількість спроб підбору (brute-force).
   * express-rate-limit на маршруті обмежує запити за IP, але не заважає
   * перебору 6-значного коду з різних IP у межах TTL — тому ліміт
   * спроб має рахуватися окремо, per-user, у Redis.
   */
  async validateOtp(userId, otpCode) {
    const attempts = await OtpRepository.incrementAttempts(userId);
    if (attempts > authConfig.otp.maxAttempts) {
      await this.invalidateOtp(userId);
      throw new OtpExpiredException();
    }

    const stored = await OtpRepository.getOtp(userId);
    if (!stored) throw new OtpExpiredException();
    if (stored !== otpCode) throw new OtpInvalidException();
    return true;
  },

  async invalidateOtp(userId) {
    await OtpRepository.deleteOtp(userId);
    await OtpRepository.deleteAttempts(userId);
  },

  async createVerifiedToken(userId) {
    const token = OtpProvider.generateVerifiedToken();
    await OtpRepository.saveVerifiedToken(token, userId);
    return token;
  },

  async consumeVerifiedToken(token) {
    const userId = await OtpRepository.getVerifiedToken(token);
    if (!userId) return null;
    await OtpRepository.deleteVerifiedToken(token);
    return userId;
  },
};