import { UserRepository } from "../repositories/user.repository.js";
import { RegistrationSessionRepository } from "../repositories/registrationSession.repository.js";
import { AttemptCounterRepository } from "../repositories/attemptCounter.repository.js";
import { PasswordProvider } from "../providers/password.provider.js";
import { CaptchaProvider } from "../providers/captcha.provider.js";
import { TokenService } from "./token.service.js";
import { authConfig } from "../config/auth.config.js";
import logger from "../config/logger.js";
import {
  AuthenticationException,
  ConflictException,
  RateLimitException,
  RegistrationSessionExpiredException,
} from "../exceptions/auth.exceptions.js";
import {
  AUTH_ERRORS,
  LOGIN_STATUS,
  NEW_USER_DEFAULTS,
} from "../constants/auth.constants.js";
import { validateNewAccountCredentials } from "../validators/auth.validator.js";

/**
 * AuthFlowService — єдиний потік "вхід -> (за потреби) завершення реєстрації".
 *
 *  1. loginOrStartRegistration(login, password)
 *       логін є, пароль вірний   -> видає токени (вхід);
 *       логін є, пароль хибний   -> 401, акаунт/пароль не змінюються;
 *       логіна немає             -> створює тимчасову реєстраційну сесію
 *                                   (БЕЗ запису в users).
 *  2. completeRegistration(sessionId, email, captchaToken)
 *       перевіряє капчу й унікальність, створює користувача, видає токени.
 *
 * Результат кроку 1 визначає лише сервер; клієнт не може його підмінити.
 * Залежності передаються фабрикою — так сервіс тестується без Redis/PG.
 */
export const createAuthFlowService = ({
  users = UserRepository,
  sessions = RegistrationSessionRepository,
  counters = AttemptCounterRepository,
  passwords = PasswordProvider,
  tokens = TokenService,
  captcha = CaptchaProvider,
  config = authConfig,
  log = logger,
} = {}) => {
  const loginGuard = config.loginGuard;
  const registration = config.registration;

  async function loginOrStartRegistration({
    login,
    password,
    ip,
    previousSessionId,
  }) {
    // Ліміт невдалих спроб саме по логіну: IP-лімітер на роуті не зупиняє
    // розподілений підбір пароля з багатьох адрес.
    const failKey = counters.loginFailKey(login);
    if ((await counters.read(failKey)) >= loginGuard.maxFailures) {
      throw new RateLimitException(AUTH_ERRORS.LOGIN_ATTEMPTS_EXCEEDED);
    }

    const user = await users.findByLogin(login);

    if (user) {
      const valid = await passwords.verify(password, user.password_hash);
      if (!valid) {
        await counters.increment(failKey, loginGuard.windowSeconds);
        // Нічого не створюємо, пароль не змінюємо, на реєстрацію не відправляємо.
        throw new AuthenticationException(AUTH_ERRORS.LOGIN_TAKEN_WRONG_PASSWORD);
      }
      await counters.reset(failKey);
      const pair = await tokens.issueTokenPair(user.id);
      return { status: LOGIN_STATUS.AUTHENTICATED, ...pair };
    }

    // Логіна немає — готуємо реєстрацію. Спершу валідація правил нового
    // акаунта, потім ліміт стартів по IP, і лише тоді дорогий хеш.
    validateNewAccountCredentials({ login, password });

    const startCount = await counters.increment(
      counters.regStartKey(ip),
      registration.startWindowSeconds,
    );
    if (startCount > registration.startMaxPerIp) {
      throw new RateLimitException();
    }

    // Пароль хешується одразу й у чистому вигляді ніде не зберігається.
    const passwordHash = await passwords.hash(password);
    const sessionId = sessions.newId();
    await sessions.create(
      sessionId,
      { login, passwordHash },
      registration.sessionTtlSeconds,
    );

    // Нова спроба замінює попередню незавершену реєстрацію цього браузера.
    if (previousSessionId) await sessions.delete(previousSessionId);

    return {
      status: LOGIN_STATUS.REGISTRATION_REQUIRED,
      registrationSessionId: sessionId,
      expiresInSeconds: registration.sessionTtlSeconds,
    };
  }

  async function getRegistrationSession({ sessionId }) {
    const session = sessionId ? await sessions.get(sessionId) : null;
    if (!session) throw new RegistrationSessionExpiredException();
    return {
      login: session.data.login,
      expiresInSeconds: session.ttlSeconds,
    };
  }

  async function cancelRegistration({ sessionId }) {
    if (sessionId) await sessions.delete(sessionId);
  }

  async function completeRegistration({ sessionId, email, captchaToken, ip }) {
    const session = sessionId ? await sessions.get(sessionId) : null;
    if (!session) throw new RegistrationSessionExpiredException();

    // Подвійний клік / повторний запит / гонка: лише один запит із цією
    // сесією проходить далі, решта отримують 409 і нічого не створюють.
    if (!(await sessions.acquireLock(sessionId))) {
      throw new ConflictException(
        AUTH_ERRORS.REGISTRATION_IN_PROGRESS,
        "REGISTRATION_IN_PROGRESS",
      );
    }

    try {
      const { login, passwordHash } = session.data;

      await captcha.verify(captchaToken, ip);

      // Повторна перевірка унікальності: логін міг бути зайнятий, поки
      // користувач заповнював форму.
      if (await users.findByLogin(login)) {
        await sessions.delete(sessionId);
        throw new ConflictException(AUTH_ERRORS.LOGIN_TAKEN, "LOGIN_TAKEN");
      }
      if (email && (await users.findByEmail(email))) {
        throw new ConflictException(AUTH_ERRORS.EMAIL_TAKEN, "EMAIL_TAKEN");
      }

      // Транзакція всередині репозиторію; UNIQUE-обмеження БД —
      // останній рубіж проти гонки (див. UserRepository.create).
      const created = await users.create({
        login,
        passwordHash,
        email: email ?? null,
        gender: NEW_USER_DEFAULTS.gender,
        color: NEW_USER_DEFAULTS.color,
      });

      if (!created) {
        if (await users.findByLogin(login)) {
          await sessions.delete(sessionId);
          throw new ConflictException(AUTH_ERRORS.LOGIN_TAKEN, "LOGIN_TAKEN");
        }
        throw new ConflictException(AUTH_ERRORS.EMAIL_TAKEN, "EMAIL_TAKEN");
      }

      // Акаунт створено — сесія більше не потрібна (повторно її
      // використати не можна). Токени видаємо вже після цього.
      await sessions.delete(sessionId);
      log.info(`Зареєстровано нового користувача id=${created.id}`);

      const pair = await tokens.issueTokenPair(created.id);
      return { status: LOGIN_STATUS.AUTHENTICATED, login, ...pair };
    } finally {
      await sessions.releaseLock(sessionId).catch(() => {});
    }
  }

  return {
    loginOrStartRegistration,
    getRegistrationSession,
    cancelRegistration,
    completeRegistration,
  };
};

export const AuthFlowService = createAuthFlowService();
