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
    // Новый код — новый лимит попыток, иначе можно было бы "сжечь"
    // попытки чужим forgot-password и заблокировать пользователю OTP.
    await OtpRepository.deleteAttempts(userId);
    return otp;
  },

  /**
   * Проверяет OTP и ограничивает число попыток подбора (brute-force).
   * express-rate-limit на роуте ограничивает запросы по IP, но не мешает
   * перебору 6-значного кода с разных IP в пределах TTL — поэтому лимит
   * попыток должен считаться отдельно, per-user, в Redis.
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