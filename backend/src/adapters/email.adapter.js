import logger from "../config/logger.js";

/**
 * EmailAdapter — адаптер відправки email.
 * DEV MODE: реальна відправка не виконується, OTP виводиться в лог.
 */
export const EmailAdapter = {
  async sendOtp(email, otp) {
    logger.info(`OTP для відновлення пароля:\nemail=${email}\notp=${otp}`);
    // TODO: замінити на реального провайдера email (nodemailer, SendGrid тощо)
  },
};
