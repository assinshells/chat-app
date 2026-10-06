import crypto from "crypto";
import { UserRepository } from "../repositories/user.repository.js";
import { PasswordProvider } from "../providers/password.provider.js";
import { GENDER_VALUES } from "../constants/auth.constants.js";
import { QUIZ_BOT_LOGIN, QUIZ_BOT_COLOR } from "../constants/quiz.constants.js";
import logger from "../config/logger.js";

let botUser = null;

/**
 * ensureQuizBot — гарантує, що в БД існує користувач-бот "Вікторина"
 * (потрібен, бо messages.author_id — FK на users, а повідомлення бота
 * зберігаються в історії кімнати нарівні зі звичайними). Пароль —
 * випадковий і ніде не зберігається у відкритому вигляді: увійти під
 * ботом неможливо. Викликається один раз при старті (server.js).
 */
export async function ensureQuizBot() {
  let user = await UserRepository.findByLogin(QUIZ_BOT_LOGIN);

  if (!user) {
    const passwordHash = await PasswordProvider.hash(crypto.randomBytes(32).toString("hex"));
    await UserRepository.create({
      login: QUIZ_BOT_LOGIN,
      passwordHash,
      gender: GENDER_VALUES.UNKNOWN,
      color: QUIZ_BOT_COLOR,
    });
    user = await UserRepository.findByLogin(QUIZ_BOT_LOGIN);
    logger.info(`Заведено бота вікторини "${QUIZ_BOT_LOGIN}"`);
  }

  botUser = { id: user.id, login: user.login, color: user.color };
  return botUser;
}

export const getQuizBot = () => botUser;
