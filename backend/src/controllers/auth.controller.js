import { AuthService } from "../services/auth.service.js";
import {
  toLoginRequestDto,
  toCompleteRegistrationDto,
  toForgotPasswordDto,
  toVerifyOtpDto,
  toResetPasswordDto,
  toUpdateGenderDto,
  toUpdateColorDto,
  toConfirmPasswordChangeDto,
  toUpdateTextStyleDto,
  toUpdateStatusDto,
  toUpdateEmailDto,
  toUpdateCityDto,
  toUpdateDisplayNameDto,
  toUpdateAboutDto,
  toUpdateMaritalStatusDto,
} from "../dto/auth.dto.js";
import {
  validateLoginRequest,
  validateCompleteRegistrationRequest,
  validateForgotPasswordRequest,
  validateVerifyOtpRequest,
  validateResetPasswordRequest,
  validateUpdateGenderRequest,
  validateUpdateColorRequest,
  validateConfirmPasswordChangeRequest,
  validateUpdateTextStyleRequest,
  validateUpdateStatusRequest,
  validateUpdateEmailRequest,
  validateUpdateCityRequest,
  validateUpdateDisplayNameRequest,
  validateUpdateAboutRequest,
  validateUpdateMaritalStatusRequest,
  validateProfileLoginParam,
} from "../validators/auth.validator.js";
import { CookieProvider } from "../providers/cookie.provider.js";
import {
  HTTP_STATUS,
  COOKIE_NAMES,
  LOGIN_STATUS,
} from "../constants/auth.constants.js";

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
  // Єдина точка входу: або авторизує існуючого користувача, або (для
  // нового логіна) починає тимчасову реєстраційну сесію — див.
  // AuthFlowService.loginOrStartRegistration. Рішення приймає сервер.
  login: async (req, res, next) => {
    try {
      validateLoginRequest(req.body);
      const dto = toLoginRequestDto(req.body);
      const result = await AuthService.login({
        ...dto,
        ip: req.ip,
        previousSessionId: req.cookies?.[COOKIE_NAMES.regSession],
      });

      if (result.status === LOGIN_STATUS.REGISTRATION_REQUIRED) {
        CookieProvider.setRegistrationCookie(
          res,
          result.registrationSessionId,
          result.expiresInSeconds,
        );
        // id сесії йде лише в httpOnly cookie, у тілі його немає.
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          status: result.status,
          expiresInSeconds: result.expiresInSeconds,
        });
      }

      const { accessToken, refreshToken, csrfToken } = result;
      CookieProvider.setAuthCookies(res, { refreshToken, csrfToken });
      CookieProvider.clearRegistrationCookie(res);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        status: result.status,
        accessToken,
        csrfToken,
      });
    } catch (err) {
      next(err);
    }
  },

  // Завершення реєстрації ("В чат"): створює користувача й одразу
  // авторизує його (ті самі cookie/токени, що й при звичайному вході).
  register: async (req, res, next) => {
    try {
      validateCompleteRegistrationRequest(req.body);
      const dto = toCompleteRegistrationDto(req.body);
      const { accessToken, refreshToken, csrfToken, status, login } =
        await AuthService.register({
          ...dto,
          sessionId: req.cookies?.[COOKIE_NAMES.regSession],
          ip: req.ip,
        });
      CookieProvider.setAuthCookies(res, { refreshToken, csrfToken });
      CookieProvider.clearRegistrationCookie(res);
      res
        .status(HTTP_STATUS.CREATED)
        .json({ success: true, status, login, accessToken, csrfToken });
    } catch (err) {
      next(err);
    }
  },

  // Логін для сторінки завершення реєстрації береться із серверної
  // сесії, а не з клієнтського стану — клієнт не може його підмінити.
  getRegistrationSession: async (req, res, next) => {
    try {
      const result = await AuthService.getRegistrationSession({
        sessionId: req.cookies?.[COOKIE_NAMES.regSession],
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // "Назад до входу": скасовує незавершену реєстрацію (ідемпотентно).
  cancelRegistration: async (req, res, next) => {
    try {
      await AuthService.cancelRegistration({
        sessionId: req.cookies?.[COOKIE_NAMES.regSession],
      });
      CookieProvider.clearRegistrationCookie(res);
      res.status(HTTP_STATUS.OK).json({ success: true });
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

  // Зміна пароля з налаштувань (Безпека): OTP на email поточного
  // користувача, потім підтвердження кодом + новий пароль.
  requestPasswordChange: async (req, res, next) => {
    try {
      const result = await AuthService.requestPasswordChange({
        userId: req.userId,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  confirmPasswordChange: async (req, res, next) => {
    try {
      validateConfirmPasswordChangeRequest(req.body);
      const dto = toConfirmPasswordChangeDto(req.body);
      const result = await AuthService.confirmPasswordChange({
        userId: req.userId,
        otpCode: dto.otpCode,
        password: dto.password,
      });
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
  updateTextStyle: async (req, res, next) => {
    try {
      validateUpdateTextStyleRequest(req.body);
      const dto = toUpdateTextStyleDto(req.body);
      const result = await AuthService.updateTextStyle({
        userId: req.userId,
        bold: dto.bold,
        italic: dto.italic,
      });
      res
        .status(HTTP_STATUS.OK)
        .json({ success: true, bold: result.bold, italic: result.italic });
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
  updateStatus: async (req, res, next) => {
    try {
      validateUpdateStatusRequest(req.body);
      const dto = toUpdateStatusDto(req.body);
      const result = await AuthService.updateStatus({
        userId: req.userId,
        status: dto.status,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, status: result.status });
    } catch (err) {
      next(err);
    }
  },
  updateEmail: async (req, res, next) => {
    try {
      validateUpdateEmailRequest(req.body);
      const dto = toUpdateEmailDto(req.body);
      const result = await AuthService.updateEmail({
        userId: req.userId,
        email: dto.email,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, email: result.email });
    } catch (err) {
      next(err);
    }
  },
  updateCity: async (req, res, next) => {
    try {
      validateUpdateCityRequest(req.body);
      const dto = toUpdateCityDto(req.body);
      const result = await AuthService.updateCity({
        userId: req.userId,
        city: dto.city,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, city: result.city });
    } catch (err) {
      next(err);
    }
  },
  updateDisplayName: async (req, res, next) => {
    try {
      validateUpdateDisplayNameRequest(req.body);
      const dto = toUpdateDisplayNameDto(req.body);
      const result = await AuthService.updateDisplayName({
        userId: req.userId,
        displayName: dto.displayName,
      });
      res
        .status(HTTP_STATUS.OK)
        .json({ success: true, displayName: result.displayName });
    } catch (err) {
      next(err);
    }
  },
  updateMaritalStatus: async (req, res, next) => {
    try {
      validateUpdateMaritalStatusRequest(req.body);
      const dto = toUpdateMaritalStatusDto(req.body);
      const result = await AuthService.updateMaritalStatus({
        userId: req.userId,
        maritalStatus: dto.maritalStatus,
      });
      res
        .status(HTTP_STATUS.OK)
        .json({ success: true, maritalStatus: result.maritalStatus });
    } catch (err) {
      next(err);
    }
  },
  updateAbout: async (req, res, next) => {
    try {
      validateUpdateAboutRequest(req.body);
      const dto = toUpdateAboutDto(req.body);
      const result = await AuthService.updateAbout({
        userId: req.userId,
        about: dto.about,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, about: result.about });
    } catch (err) {
      next(err);
    }
  },
  getPublicProfile: async (req, res, next) => {
    try {
      validateProfileLoginParam(req.params.login);
      const result = await AuthService.getPublicProfile({
        login: req.params.login,
      });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
  getMe: async (req, res, next) => {
    try {
      const result = await AuthService.getMe({ userId: req.userId });
      res.status(HTTP_STATUS.OK).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
