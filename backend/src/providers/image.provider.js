import { IMAGE_ERRORS, IMAGE_LIMITS } from "../constants/chat.constants.js";
import { ImageValidationException } from "../exceptions/chat.exceptions.js";

/**
 * sniffMime — визначає тип зображення за магічними байтами файлу.
 * Заявлений клієнтом тип (File.type / Content-Type) ніколи не
 * використовується: його можна підробити, а віддавати браузеру ми будемо
 * саме той mime, що збережено в БД.
 */
function sniffMime(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// Рейт-ліміт картинок по userId (не по сокету — інакше обходиться
// відкриттям кількох вкладок). In-memory, як і решта лімітерів проєкту.
const imageSends = new Map();

export const ImageProvider = {
  /**
   * normalize — приймає те, що прийшло в payload.image (Socket.IO
   * віддає бінарні дані як Buffer), повертає null, якщо картинки немає,
   * або { data, mime, size }; кидає ImageValidationException.
   */
  normalize(raw) {
    if (raw === undefined || raw === null) return null;

    const data = Buffer.isBuffer(raw)
      ? raw
      : raw instanceof ArrayBuffer
        ? Buffer.from(raw)
        : ArrayBuffer.isView(raw)
          ? Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength)
          : null;

    if (!data || data.length === 0) {
      throw new ImageValidationException("IMAGE_INVALID_TYPE", IMAGE_ERRORS.INVALID_TYPE);
    }
    if (data.length > IMAGE_LIMITS.MAX_BYTES) {
      throw new ImageValidationException("IMAGE_TOO_LARGE", IMAGE_ERRORS.TOO_LARGE);
    }

    const mime = sniffMime(data);
    if (!mime || !IMAGE_LIMITS.ALLOWED_MIME.includes(mime)) {
      throw new ImageValidationException("IMAGE_INVALID_TYPE", IMAGE_ERRORS.INVALID_TYPE);
    }

    return { data, mime, size: data.length };
  },

  /**
   * assertRateLimit — не більше IMAGE_LIMITS.RATE_MAX картинок за
   * IMAGE_LIMITS.RATE_WINDOW_MS на користувача. Викликається лише коли
   * картинка реально є в запиті, і лише ПІСЛЯ успішної валідації
   * (відхилений файл не витрачає ліміт).
   */
  assertRateLimit(userId) {
    const now = Date.now();
    const list = (imageSends.get(userId) ?? []).filter(
      (t) => now - t < IMAGE_LIMITS.RATE_WINDOW_MS,
    );

    if (list.length >= IMAGE_LIMITS.RATE_MAX) {
      imageSends.set(userId, list);
      throw new ImageValidationException("IMAGE_RATE_LIMITED", IMAGE_ERRORS.RATE_LIMITED);
    }

    list.push(now);
    imageSends.set(userId, list);
  },
};
