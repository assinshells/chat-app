import { normalizeForModeration } from "./textNormalize.js";
import { BAD_WORD_ROOTS, SAFE_EXCEPTIONS } from "./badWords.data.js";
import { moderationConfig } from "../config/moderation.config.js";

// Собираем один regex вместо N отдельных .includes() — быстрее для
// длинных сообщений и легче расширять список корней.
const PROFANITY_PATTERN = new RegExp(
  BAD_WORD_ROOTS.map((root) => root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

const NORMALIZED_SAFE_EXCEPTIONS = SAFE_EXCEPTIONS.map((word) => normalizeForModeration(word));

/**
 * stripSafeExceptions — вырезает из нормализованного текста слова,
 * НАЧИНАЮЩИЕСЯ с одного из исключений (см. badWords.data.js), ДО
 * прогона через PROFANITY_PATTERN — иначе, например, "хереса" ловилось
 * бы через короткий корень "хер", хотя это обычное слово. startsWith,
 * а не точное совпадение — чтобы одно исключение закрывало сразу все
 * словоформы (падежи/суффиксы).
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
   * isProfane — true, если в тексте (после нормализации и вычитания
   * безопасных исключений) находится хотя бы один из корней словаря.
   */
  isProfane(text) {
    if (!moderationConfig.profanity.enabled) return false;

    const normalized = stripSafeExceptions(normalizeForModeration(text));
    return PROFANITY_PATTERN.test(normalized);
  },
};
