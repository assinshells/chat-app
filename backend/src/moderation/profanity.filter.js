import { normalizeForModeration } from "./textNormalize.js";
import { BAD_WORD_ROOTS, SAFE_EXCEPTIONS } from "./badWords.data.js";
import { moderationConfig } from "../config/moderation.config.js";

// Збираємо один regex замість N окремих .includes() — швидше для
// довгих повідомлень і легше розширювати список корнів.
const PROFANITY_PATTERN = new RegExp(
  BAD_WORD_ROOTS.map((root) => root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

const NORMALIZED_SAFE_EXCEPTIONS = SAFE_EXCEPTIONS.map((word) => normalizeForModeration(word));

/**
 * stripSafeExceptions — вирізає з нормалізованого тексту слова, що
 * ПОЧИНАЮТЬСЯ з одного з винятків (див. badWords.data.js), ДО
 * прогону через PROFANITY_PATTERN — інакше, наприклад, "хереса"
 * ловилося б через короткий корінь "хер", хоча це звичайне слово.
 * startsWith, а не точний збіг — щоб один корінь-виняток закривав
 * одразу всі словоформи (відмінки/суфікси).
 */
function stripSafeExceptions(normalizedText) {
  if (NORMALIZED_SAFE_EXCEPTIONS.length === 0) return normalizedText;

  return normalizedText
    .split(/\s+/)
    .filter((word) => !NORMALIZED_SAFE_EXCEPTIONS.some((exception) => word.startsWith(exception)))
    .join(" ");
}

export const profanityFilter = {
  /**
   * isProfane — true, якщо в тексті (після нормалізації і вирахування
   * безпечних винятків) знаходиться хоча б один із корнів словника.
   */
  isProfane(text) {
    if (!moderationConfig.profanity.enabled) return false;

    const normalized = stripSafeExceptions(normalizeForModeration(text));
    return PROFANITY_PATTERN.test(normalized);
  },
};
