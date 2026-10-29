import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import { env } from "../config/env.js";
import { authConfig } from "../config/auth.config.js";

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    });
  }
  return transporter;
}

/**
 * EmailAdapter — відправка email через nodemailer (SMTP).
 *
 * Якщо SMTP_HOST не заданий і застосунок працює не в production,
 * лист не надсилається, а OTP виводиться в лог (зручно для розробки).
 * У production без SMTP_HOST кидається помилка.
 */
export const EmailAdapter = {
  async sendOtp(email, otp) {
    const minutes = Math.round(authConfig.otp.ttlSeconds / 60);
    const transport = getTransporter();

    if (!transport) {
      if (env.isProduction) {
        throw new Error("SMTP не налаштований (SMTP_HOST порожній)");
      }
      logger.info(`[DEV] OTP для ${email}: ${otp} (діє ${minutes} хв)`);
      return;
    }

    await transport.sendMail({
      from: env.smtp.from,
      to: email,
      subject: "Код підтвердження",
      text: `Ваш код підтвердження: ${otp}\nКод діє ${minutes} хв. Якщо ви його не запитували — просто проігноруйте цей лист.`,
      html: `<p>Ваш код підтвердження:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:8px 0">${otp}</p>
<p>Код діє ${minutes} хв. Якщо ви його не запитували — просто проігноруйте цей лист.</p>`,
    });
  },
};
