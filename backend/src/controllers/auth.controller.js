import { AuthService } from "../services/auth.service.js";
import {
  toLoginRequestDto,
  toRegisterRequestDto,
  toForgotPasswordDto,
  toVerifyOtpDto,
  toResetPasswordDto,
} from "../dto/auth.dto.js";
import {
  validateLoginRequest,
  validateRegisterRequest,
  validateForgotPasswordRequest,
  validateVerifyOtpRequest,
  validateResetPasswordRequest,
} from "../validators/auth.validator.js";
import { CookieProvider } from "../providers/cookie.provider.js";
import { HTTP_STATUS, COOKIE_NAMES } from "../constants/auth.constants.js";

/**
 * AuthController — только routing-логика:
 * получить запрос → вызвать сервис → вернуть ответ.
 * Никакой бизнес-логики. Все ошибки передаются в next(err).
 *
 * login/refresh выставляют refreshToken как httpOnly cookie и csrfToken
 * как читаемую cookie (CookieProvider); в JSON-теле наружу уходит только
 * accessToken (+ csrfToken, для удобства клиента — то же значение, что и
 * в cookie). refreshToken в теле ответа никогда не возвращается.
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
      // req.refreshToken — из httpOnly cookie, см. refreshCookieGuard.
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
      // Читаем напрямую из cookie (не через guard) — logout должен
      // оставаться идемпотентным и в отсутствие cookie (сессия уже истекла).
      const refreshToken = req.cookies?.[COOKIE_NAMES.refreshToken];
      const result = await AuthService.logout({ refreshToken });
      CookieProvider.clearAuthCookies(res);
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
