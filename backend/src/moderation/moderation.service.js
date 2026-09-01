import { profanityFilter } from "./profanity.filter.js";
import { capsFilter } from "./caps.filter.js";
import { spamFilter } from "./spam.filter.js";
import { moderationConfig } from "../config/moderation.config.js";
import {
  ProfanityException,
  CapsLockException,
  SpamException,
  MutedException,
} from "../exceptions/chat.exceptions.js";

/**
 * userState — состояние автомодератора по userId, в оперативной памяти
 * процесса (по аналогии с rate-limit в chat.socket.js). Живёт дольше
 * одного сокет-соединения (ключ — userId, не socket.id), поэтому
 * реконнект/обновление страницы не сбрасывает счётчик нарушений и не
 * снимает временный мут — иначе мут обходился бы простым F5.
 *
 *   violations — {ts}[] нарушений (мат/капс/спам) за последнее окно;
 *   recent     — {text, ts}[] последних сообщений, нужен spam.filter.js
 *                для проверки на повтор одного и того же текста подряд;
 *   muteUntil  — unix ms, до которого все сообщения отклоняются без
 *                проверки содержимого.
 *
 * При масштабировании на несколько backend-инстансов это состояние
 * нужно перенести в Redis (как и rate-limit) — сейчас, как и там, это
 * осознанно отложено до появления реальной потребности.
 */
const userState = new Map();

function getState(userId) {
  let state = userState.get(userId);
  if (!state) {
    state = { violations: [], recent: [], muteUntil: 0 };
    userState.set(userId, state);
  }
  return state;
}

function pruneOld(list, windowMs, now) {
  return list.filter((item) => now - item.ts < windowMs);
}

/**
 * registerViolation — фиксирует нарушение и, если их накопилось
 * moderationConfig.mute.violationsThreshold за окно, включает мут и
 * обнуляет счётчик (чтобы после окончания мута отсчёт начался заново,
 * а не сработал мгновенно повторно на первом же следующем нарушении).
 */
function registerViolation(state, now) {
  state.violations = pruneOld(state.violations, moderationConfig.mute.violationWindowMs, now);
  state.violations.push({ ts: now });

  if (state.violations.length >= moderationConfig.mute.violationsThreshold) {
    state.muteUntil = now + moderationConfig.mute.muteDurationMs;
    state.violations = [];
  }
}

export const ModerationService = {
  /**
   * assertNotMuted — бросает MutedException, если пользователь сейчас
   * под временным мутом. Вызывается ДО любых проверок содержимого:
   * замученному пользователю не нужно объяснять, мат у него или капс —
   * ему нужно только оставшееся время.
   */
  assertNotMuted(userId) {
    const state = getState(userId);
    const now = Date.now();

    if (state.muteUntil > now) {
      throw new MutedException(state.muteUntil - now);
    }
  },

  /**
   * check — прогоняет text через фильтры в порядке от "дешёвого и
   * самого однозначного" к более затратному: мат -> капс -> спам.
   * При первом сработавшем — фиксирует нарушение (может включить мут)
   * и бросает соответствующее исключение; message.service.js ловит его
   * и превращает в ack с кодом ошибки для клиента.
   *
   * Если сообщение прошло все проверки — оно добавляется в recent, это
   * ОБЯЗАТЕЛЬНЫЙ побочный эффект: без него spam.filter.js не сможет
   * поймать повтор именно этого текста в следующий раз.
   */
  check({ userId, text }) {
    this.assertNotMuted(userId);

    const state = getState(userId);
    const now = Date.now();

    if (profanityFilter.isProfane(text)) {
      registerViolation(state, now);
      throw new ProfanityException();
    }

    if (capsFilter.isShouting(text)) {
      registerViolation(state, now);
      throw new CapsLockException();
    }

    const spamResult = spamFilter.check(state, text, now);
    if (spamResult.isSpam) {
      registerViolation(state, now);
      throw new SpamException(spamResult.reason);
    }

    state.recent.push({ text, ts: now });
    state.recent = pruneOld(state.recent, moderationConfig.spam.duplicateWindowMs, now);
  },

  /**
   * forget — очищает состояние пользователя. Не вызывается автоматически
   * нигде в текущем потоке (мут должен переживать реконнект, см. выше),
   * но полезен как явная точка расширения — например, для будущей
   * админ-команды "снять мут" или юнит-тестов.
   */
  forget(userId) {
    userState.delete(userId);
  },
};
