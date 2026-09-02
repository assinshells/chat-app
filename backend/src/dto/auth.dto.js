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
 * @typedef {Object} RegisterRequestDto
 * @property {string} login
 * @property {string} password
 * @property {string|undefined} email
 * @property {"male"|"female"} gender
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

export const toRegisterRequestDto = (body) => ({
  login: body.login,
  password: body.password,
  email: body.email || undefined,
  gender: body.gender,
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
export const toUpdateGenderDto = (body) => ({
  gender: body.gender,
});

/**
 * @typedef {Object} UpdateColorDto
 * @property {"black"|"blue"|"green"|"purple"|"orange"} color
 */
export const toUpdateColorDto = (body) => ({
  color: body.color,
});