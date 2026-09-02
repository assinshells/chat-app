import { AuthService } from "../services/auth.service.js";
import {
  toLoginRequestDto,
  toRegisterRequestDto,
  toForgotPasswordDto,
  toVerifyOtpDto,
  toResetPasswordDto,
  toUpdateGenderDto,
  toUpdateColorDto,
} from "../dto/auth.dto.js";
import {
  validateLoginRequest,
  validateRegisterRequest,
  validateForgotPasswordRequest,
  validateVerifyOtpRequest,
  validateResetPasswordRequest,
  validateUpdateGenderRequest,
  validateUpdateColorRequest,
} from "../validators/auth.validator.js";
import { CookieProvider } from "../providers/cookie.provider.js";
import { HTTP_STATUS, COOKIE_NAMES } from "../constants/auth.constants.js";

/**
 * AuthController — лише routing-логіка:
 * отримати запит → викликати сервіс → повернути відповідь.
 * Жодної бізнес-логіки. Усі помилки передаються в next(err).
 *
 * login/refresh встановлюють refreshToken як httpOnly cookie і csrfToken
 * як доступну для читання cookie (CookieProvider); у JSON-тілі назовні
 * йде лише accessToken (+ csrfToken, для зручності клієнта — те саме
 * значення, що й у cookie). refreshToken у тілі відповіді ніколи не повертається.
 */
export const AuthController = {
  login: async (req, res, next) => {
    try {
      validateLoginRequest(req.body);
      const dto = toLoginRequestDto(req.body);
      const { accessToken, refreshToken, csrfToken } =
        await AuthService.login(dto);
      CookieProvider.setAuthCookies(res, { refreshToken, csrfToken });
      res.status(HTTP_STATUS.OK).json({ success: true, accessToken, csrfToken });
    } catch (err) {
      next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      validateRegisterRequest(req.body);
      const dto = toRegisterRequestDto(req.body);
      const result = await AuthService.register(dto);
      res.status(HTTP_STATUS.CREATED).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      validateForgotPasswordRequest(req.body);
      const dto = toForgotPasswordDto(req.body);
      const result = await AuthService.forgotPassword(dto);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      validateVerifyOtpRequest(req.body);
      const dto = toVerifyOtpDto(req.body);
      const result = await AuthService.verifyOtp(dto);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      validateResetPasswordRequest(req.body);
      const dto = toResetPasswordDto(req.body);
      const result = await AuthService.resetPassword(dto);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req, res, next) => {
    try {
      // req.refreshToken — з httpOnly cookie, див. refreshCookieGuard.
      const { accessToken, refreshToken, csrfToken } =
        await AuthService.refreshTokens({ refreshToken: req.refreshToken });
      CookieProvider.setAuthCookies(res, { refreshToken, csrfToken });
      res.status(HTTP_STATUS.OK).json({ success: true, accessToken, csrfToken });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      // Читаємо напряму з cookie (не через guard) — logout має
      // залишатися ідемпотентним навіть за відсутності cookie (сесія вже минула).
      const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];
      const result = await AuthService.logout({ refreshToken });
      CookieProvider.clearAuthCookies(res);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
  updateGender: async (req, res, next) => {
  try {
    validateUpdateGenderRequest(req.body);
    const dto = toUpdateGenderDto(req.body);
    const result = await AuthService.updateGender({
      userId: req.userId,
      gender: dto.gender,
    });
    res.status(HTTP_STATUS.OK).json({ success: true, gender: result.gender });
  } catch (err) {
    next(err);
  }
},
  updateColor: async (req, res, next) => {
    try {
      validateUpdateColorRequest(req.body);
      const dto = toUpdateColorDto(req.body);
      const result = await AuthService.updateColor({
        userId: req.userId,
        color: dto.color,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, color: result.color });
    } catch (err) {
      next(err);
    }
  },
};
