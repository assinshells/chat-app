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
 * userState — стан автомодератора за userId, в оперативній пам'яті
 * процесу (за аналогією з rate-limit у chat.socket.js). Живе довше
 * одного сокет-з'єднання (ключ — userId, не socket.id), тому
 * реконект/оновлення сторінки не скидає лічильник порушень і не знімає
 * тимчасовий мут — інакше мут обходився б простим F5.
 *
 *   violations — {ts}[] порушень (мат/капс/спам) за останнє вікно;
 *   recent     — {text, ts}[] останніх повідомлень, потрібен spam.filter.js
 *                для перевірки на повтор одного й того ж тексту поспіль;
 *   muteUntil  — unix ms, до якого всі повідомлення відхиляються без
 *                перевірки вмісту.
 *
 * При масштабуванні на декілька backend-інстансів цей стан потрібно
 * перенести в Redis (як і rate-limit) — зараз, як і там, це свідомо
 * відкладено до появи реальної потреби.
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
 * registerViolation — фіксує порушення і, якщо їх накопичилося
 * moderationConfig.mute.violationsThreshold за вікно, вмикає мут і
 * обнуляє лічильник (щоб після закінчення мута відлік почався заново,
 * а не спрацював миттєво повторно на першому ж наступному порушенні).
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
   * assertNotMuted — кидає MutedException, якщо користувач зараз
   * під тимчасовим мутом. Викликається ДО будь-яких перевірок вмісту:
   * замученому користувачу не потрібно пояснювати, мат у нього чи
   * капс — йому потрібен лише час, що залишився.
   */
  assertNotMuted(userId) {
    const state = getState(userId);
    const now = Date.now();

    if (state.muteUntil > now) {
      throw new MutedException(state.muteUntil - now);
    }
  },

  /**
   * check — проганяє text через фільтри в порядку від "дешевого і
   * найоднозначнішого" до складнішого: мат -> капс -> спам.
   * При першому спрацюванні — фіксує порушення (може ввімкнути мут)
   * і кидає відповідний виняток; message.service.js ловить його
   * і перетворює в ack з кодом помилки для клієнта.
   *
   * Якщо повідомлення пройшло всі перевірки — воно додається в recent,
   * це ОБОВ'ЯЗКОВИЙ побічний ефект: без нього spam.filter.js не зможе
   * впіймати повтор саме цього тексту наступного разу.
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
   * forget — очищає стан користувача. Не викликається автоматично
   * ніде в поточному потоці (мут має переживати реконект, див. вище),
   * але корисний як явна точка розширення — наприклад, для майбутньої
   * адмін-команди "зняти мут" або юніт-тестів.
   */
  forget(userId) {
    userState.delete(userId);
  },
};
