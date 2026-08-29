import { ValidationException } from "../exceptions/auth.exceptions.js";
import { GENDER_OPTIONS, COLOR_OPTIONS } from "../constants/auth.constants.js";

const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidPassword = (val) => typeof val === "string" && val.length >= 6;
const isValidGender = (val) =>
  typeof val === "string" && GENDER_OPTIONS.includes(val);
const isValidColor = (val) =>
  typeof val === "string" && COLOR_OPTIONS.includes(val);

export const validateLoginRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("login is required");
  if (!isValidPassword(body.password))
    errors.push("password must be at least 6 characters");
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateRegisterRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("login is required");
  if (!isValidPassword(body.password))
    errors.push("password must be at least 6 characters");
  if (body.email && !isValidEmail(body.email)) errors.push("email is invalid");
  if (!isValidGender(body.gender))
    errors.push(`gender is required and must be one of: ${GENDER_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateForgotPasswordRequest = (body) => {
  const errors = [];
  if (!body.email || !isValidEmail(body.email))
    errors.push("valid email is required");
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateVerifyOtpRequest = (body) => {
  const errors = [];
  if (!body.email || !isValidEmail(body.email))
    errors.push("valid email is required");
  if (!isNonEmptyString(body.otpCode)) errors.push("otpCode is required");
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateResetPasswordRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.verifiedToken))
    errors.push("verifiedToken is required");
  if (!isValidPassword(body.password))
    errors.push("password must be at least 6 characters");
  if (!isNonEmptyString(body.confirmPassword))
    errors.push("confirmPassword is required");
  if (body.password !== body.confirmPassword)
    errors.push("Passwords do not match");
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateUpdateGenderRequest = (body) => {
  const errors = [];
  if (!isValidGender(body.gender))
    errors.push(`gender is required and must be one of: ${GENDER_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Validation failed", errors);
};

export const validateUpdateColorRequest = (body) => {
  const errors = [];
  if (!isValidColor(body.color))
    errors.push(`color is required and must be one of: ${COLOR_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Validation failed", errors);
};
