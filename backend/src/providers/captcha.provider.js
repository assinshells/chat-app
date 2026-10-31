import { authConfig } from "../config/auth.config.js";
import logger from "../config/logger.js";
import { AUTH_ERRORS } from "../constants/auth.constants.js";
import {
  ValidationException,
  CaptchaUnavailableException,
} from "../exceptions/auth.exceptions.js";

const MAX_TOKEN_LENGTH = 2048; // Turnstile-токени до ~2 КБ

/**
 * CaptchaProvider — серверна перевірка Cloudflare Turnstile.
 *
 * Секретний ключ живе лише тут (змінна TURNSTILE_SECRET_KEY) і ніколи не
 * потрапляє у фронтенд. Токен одноразовий: повторна перевірка того ж
 * токена Turnstile відхиляє. При недоступності сервісу працюємо "fail
 * closed" — реєстрація без перевірки не проходить.
 *
 * Токен капчі НЕ логується.
 */
export const createCaptchaProvider = ({
  config = authConfig.captcha,
  fetchImpl = globalThis.fetch,
  log = logger,
} = {}) => ({
  isEnabled: () => Boolean(config.enabled),

  async verify(token, remoteIp) {
    if (!config.enabled) return true;

    if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) {
      throw new ValidationException(AUTH_ERRORS.CAPTCHA_REQUIRED);
    }

    const body = new URLSearchParams({ secret: config.secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    let response;
    try {
      response = await fetchImpl(config.verifyUrl, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (err) {
      log.error(`CAPTCHA: сервіс перевірки недоступний (${err.name})`);
      throw new CaptchaUnavailableException();
    }

    if (!response.ok) {
      log.error(`CAPTCHA: сервіс перевірки відповів ${response.status}`);
      throw new CaptchaUnavailableException();
    }

    const result = await response.json().catch(() => null);
    if (!result?.success) {
      log.warn(`CAPTCHA відхилено: ${(result?.["error-codes"] ?? []).join(",")}`);
      throw new ValidationException(AUTH_ERRORS.CAPTCHA_FAILED);
    }

    if (config.expectedHostname && result.hostname !== config.expectedHostname) {
      log.warn("CAPTCHA відхилено: hostname не збігається");
      throw new ValidationException(AUTH_ERRORS.CAPTCHA_FAILED);
    }
    return true;
  },
});

export const CaptchaProvider = createCaptchaProvider();
