import { IMAGE_LIMITS } from "./chat.constants.js";
import { ROLE_VALUES } from "./auth.constants.js";

// Фотогалерея профілю (Профіль → Фотогалерея). Формат і розмір файлу
// ті самі, що й у вкладень чату (IMAGE_LIMITS): JPEG/PNG/WebP, після
// стиснення на клієнті не більше 1 МБ. Сервер, як і для чату, не довіряє
// клієнту й перевіряє тип за магічними байтами (ImageProvider.normalize).
export const GALLERY_LIMITS = Object.freeze({
  MAX_PHOTOS: 10,
  MAX_BYTES: IMAGE_LIMITS.MAX_BYTES,
  ALLOWED_MIME: IMAGE_LIMITS.ALLOWED_MIME,
  // Мініатюра для сітки (клієнт робить ~320px WebP/JPEG, зазвичай 10–40 КБ).
  MAX_THUMB_BYTES: 256 * 1024,
  // Фото і мініатюра йдуть одним JSON-запитом у base64:
  // (1 МБ + 256 КБ) * 4/3 ≈ 1.75 МБ — з запасом на JSON-обгортку.
  MAX_BODY: "2mb",
  // Окремий ліміт частоти завантажень (по userId, не по IP — за nginx
  // усі користувачі мають спільний IP).
  UPLOAD_RATE_WINDOW_MS: 10 * 60_000,
  UPLOAD_RATE_MAX: 20,
});

export const GALLERY_ERRORS = Object.freeze({
  LIMIT_REACHED: "У галереї вже максимум фото (10). Видаліть одне, щоб додати нове",
  NOT_FOUND: "Фото не знайдено",
  INVALID_BODY: "Некоректні дані фото",
  TOO_LARGE: "Фото завелике (максимум 1 МБ після стиснення)",
  REVIEW_FORBIDDEN: "У вас немає права перевіряти фото",
});

// Статуси фото: нове завжди 'pending' (бачать лише власник і ті, хто
// перевіряє), після схвалення — 'approved' (видно всім у загальній галереї).
export const PHOTO_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
});

// Пагінація загальної галереї / черги перевірки (за id, найновіші першими).
export const GALLERY_PAGE = Object.freeze({
  DEFAULT: 30,
  MAX: 60,
});

/**
 * canReviewPhotos — чи може користувач перевіряти фото (бачити непройдені,
 * схвалювати, видаляти чужі). admin/superadmin — завжди; moderator — лише
 * з прапорцем can_review_photos (видається в "Керуванні роллю").
 * Приймає рядок користувача з БД (role, can_review_photos).
 */
export const canReviewPhotos = (user) =>
  Boolean(user) &&
  (user.role === ROLE_VALUES.ADMIN ||
    user.role === ROLE_VALUES.SUPERADMIN ||
    (user.role === ROLE_VALUES.MODERATOR && user.can_review_photos === true));
