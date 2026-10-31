/**
 * DTO — Data Transfer Objects.
 * Використовуються для явного опису вхідних і вихідних даних.
 * Усі поля типізовані через JSDoc.
 */

/**
 * @typedef {Object} LoginRequestDto
 * @property {string} login
 * @property {string} password
 */

/**
 * @typedef {Object} CompleteRegistrationDto
 * @property {string|null} email - null, якщо користувач відмовився від пошти
 * @property {string|undefined} captchaToken
 *
 * Логін і пароль у цьому DTO відсутні свідомо — вони беруться з
 * серверної реєстраційної сесії (див. services/authFlow.service.js).
 * Стать і колір виставляються за замовчуванням (NEW_USER_DEFAULTS).
 */

/**
 * @typedef {Object} ForgotPasswordDto
 * @property {string} email
 */

/**
 * @typedef {Object} VerifyOtpDto
 * @property {string} email
 * @property {string} otpCode
 */

/**
 * @typedef {Object} ResetPasswordDto
 * @property {string} verifiedToken
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} AuthResponseDto
 * @property {boolean} success
 * @property {"authenticated"|"registration_required"|undefined} status
 *   - POST /login: "authenticated" (є accessToken) або "registration_required"
 *     (логіна немає — id реєстраційної сесії лише в httpOnly cookie regSession)
 * @property {string|undefined} accessToken
 * @property {string|undefined} csrfToken
 * @property {string|undefined} verifiedToken
 *
 * Примітка: refreshToken навмисно НЕ входить у тіло відповіді —
 * він встановлюється як httpOnly cookie через CookieProvider і ніколи не потрапляє в JS.
 */

/**
 * @typedef {Object} ErrorResponseDto
 * @property {boolean} success
 * @property {{ code: string, message: string, details?: string[] }} error
 */

export const toLoginRequestDto = (body) => ({
  login: body.login,
  password: body.password,
});

export const toCompleteRegistrationDto = (body) => ({
  email: body.noEmail === true ? null : body.email.trim(),
  captchaToken: body.captchaToken,
});

export const toForgotPasswordDto = (body) => ({
  email: body.email,
});

export const toVerifyOtpDto = (body) => ({
  email: body.email,
  otpCode: body.otpCode,
});

export const toResetPasswordDto = (body) => ({
  verifiedToken: body.verifiedToken,
  password: body.password,
  confirmPassword: body.confirmPassword,
});
export const toConfirmPasswordChangeDto = (body) => ({
  otpCode: body.otpCode,
  password: body.password,
  confirmPassword: body.confirmPassword,
});
export const toUpdateGenderDto = (body) => ({
  gender: body.gender,
});

/**
 * @typedef {Object} UpdateTextStyleDto
 * @property {boolean|undefined} bold
 * @property {boolean|undefined} italic
 */
export const toUpdateTextStyleDto = (body) => ({
  bold: body.bold,
  italic: body.italic,
});

/**
 * @typedef {Object} UpdateColorDto
 * @property {string} color - одне з COLOR_OPTIONS (constants/auth.constants.js —
 *   повний спектр з 20 відтінків)
 */
export const toUpdateColorDto = (body) => ({
  color: body.color,
});

/**
 * @typedef {Object} UpdateStatusDto
 * @property {string} status - одне з STATUS_OPTIONS (constants/auth.constants.js)
 */
export const toUpdateStatusDto = (body) => ({
  status: body.status,
});

/**
 * @typedef {Object} UpdateEmailDto
 * @property {string} email
 */
export const toUpdateEmailDto = (body) => ({
  email: body.email.trim(),
});

/**
 * @typedef {Object} UpdateCityDto
 * @property {string|null} city - порожній рядок нормалізується в null
 *   (означає "не вказано"), пробіли по краях обрізаються.
 */
export const toUpdateCityDto = (body) => ({
  city: body.city.trim() === "" ? null : body.city.trim(),
});

/**
 * @typedef {Object} UpdateDisplayNameDto
 * @property {string|null} displayName - порожній рядок нормалізується
 *   в null ("не вказано"), пробіли по краях обрізаються.
 */
export const toUpdateDisplayNameDto = (body) => ({
  displayName:
    body.displayName.trim() === "" ? null : body.displayName.trim(),
});

/**
 * @typedef {Object} UpdateAboutDto
 * @property {string|null} about - порожній рядок нормалізується в null
 *   ("не вказано"), пробіли по краях обрізаються.
 */
export const toUpdateAboutDto = (body) => ({
  about: body.about.trim() === "" ? null : body.about.trim(),
});
/**
 * @typedef {Object} UpdateMaritalStatusDto
 * @property {string|null} maritalStatus - порожній рядок нормалізується
 *   в null ("не вказано").
 */
export const toUpdateMaritalStatusDto = (body) => ({
  maritalStatus: body.maritalStatus === "" ? null : body.maritalStatus,
});
