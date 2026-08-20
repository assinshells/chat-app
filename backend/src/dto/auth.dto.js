/**
 * DTO — Data Transfer Objects.
 * Используются для явного описания входящих и исходящих данных.
 * Все поля типизированы через JSDoc.
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
 * @property {"male"|"female"|"unknown"} gender
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
 * Note: refreshToken is intentionally NOT part of the response body —
 * it's set as an httpOnly cookie by CookieProvider and never exposed to JS.
 */

/**
 * @typedef {Object} ErrorResponseDto
 * @property {boolean} success
 * @property {{ code: string, message: string, details?: string[] }} error
 */

/**
 * @typedef {Object} UserResponseDto
 * @property {number} id
 * @property {string} login
 * @property {string|null} email
 * @property {"male"|"female"|"unknown"} gender
 */

export const toUserResponseDto = (row) => ({
  id: row.id,
  login: row.login,
  email: row.email,
  gender: row.gender,
});

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