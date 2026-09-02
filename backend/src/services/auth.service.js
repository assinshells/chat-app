import { UserRepository } from "../repositories/user.repository.js";
import { TokenService } from "./token.service.js";
import { OtpService } from "./otp.service.js";
import { PasswordProvider } from "../providers/password.provider.js";
import { EmailAdapter } from "../adapters/email.adapter.js";
import {
  AuthenticationException,
  ConflictException,
  NotFoundException,
  AuthorizationException,
} from "../exceptions/auth.exceptions.js";
import { AUTH_ERRORS } from "../constants/auth.constants.js";

export const AuthService = {
  async login({ login, password }) {
    const user = await UserRepository.findByLogin(login);
    if (!user) throw new AuthenticationException();

    const valid = await PasswordProvider.verify(password, user.password_hash);
    if (!valid) throw new AuthenticationException();

    return TokenService.issueTokenPair(user.id);
  },

  async register({ login, password, email, gender }) {
    const existingLogin = await UserRepository.findByLogin(login);
    if (existingLogin) throw new ConflictException(AUTH_ERRORS.LOGIN_TAKEN);

    if (email) {
      const existingEmail = await UserRepository.findByEmail(email);
      if (existingEmail) throw new ConflictException(AUTH_ERRORS.EMAIL_TAKEN);
    }

    const passwordHash = await PasswordProvider.hash(password);
    const created = await UserRepository.create({
      login,
      passwordHash,
      email,
      gender,
    });

    if (!created) throw new ConflictException(AUTH_ERRORS.LOGIN_TAKEN);

    return { success: true };
  },

  async forgotPassword({ email }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) return { success: true };

    const otp = await OtpService.generateOtp(user.id);
    await EmailAdapter.sendOtp(email, otp);
    return { success: true };
  },

  async verifyOtp({ email, otpCode }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new NotFoundException();

    await OtpService.validateOtp(user.id, otpCode);
    await OtpService.invalidateOtp(user.id);

    const verifiedToken = await OtpService.createVerifiedToken(user.id);
    return { verifiedToken };
  },

  async resetPassword({ verifiedToken, password }) {
    const userId = await OtpService.consumeVerifiedToken(verifiedToken);
    if (!userId)
      throw new AuthorizationException(AUTH_ERRORS.RESET_TOKEN_INVALID);

    const passwordHash = await PasswordProvider.hash(password);
    await UserRepository.updatePassword(userId, passwordHash);
    return { success: true };
  },

  async refreshTokens({ refreshToken }) {
    return TokenService.rotateRefreshToken(refreshToken);
  },

  async logout({ refreshToken }) {
    await TokenService.revokeRefreshToken(refreshToken);
    return { success: true };
  },
  async updateGender({ userId, gender }) {
    const updated = await UserRepository.updateGender(userId, gender);
    if (!updated) throw new NotFoundException();
    return { success: true, gender: updated.gender };
  },
  async updateColor({ userId, color }) {
    const updated = await UserRepository.updateColor(userId, color);
    if (!updated) throw new NotFoundException();
    return { success: true, color: updated.color };
  },
};