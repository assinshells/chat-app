import logger from "../config/logger.js";

/**
 * EmailAdapter — адаптер отправки email.
 * DEV MODE: реальная отправка не производится, OTP выводится в лог.
 */
export const EmailAdapter = {
  async sendOtp(email, otp) {
    logger.info(`Forgot Password OTP:\nemail=${email}\notp=${otp}`);
    // TODO: replace with real email provider (nodemailer, SendGrid, etc.)
  },
};