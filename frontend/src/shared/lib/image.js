/**
 * Підготовка зображення-вкладення до відправлення.
 *
 * Обмеження (дзеркалять backend IMAGE_LIMITS, але сервер перевіряє
 * самостійно — клієнту не довіряють):
 *  - формати: JPEG, PNG, WebP;
 *  - вхідний файл не більше 10 МБ (більше навіть не декодуємо);
 *  - результат після стиснення не більше 1 МБ.
 *
 * Картинка завжди перекодовується через canvas: зменшується до
 * MAX_DIMENSION по більшій стороні, стискається в WebP (JPEG, якщо
 * браузер не вміє кодувати WebP), а заодно втрачає EXIF — зокрема
 * GPS-координати, які користувач міг не хотіти розкривати.
 */

export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_ALLOWED_TYPES.join(",");
export const IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_OUTPUT_BYTES = 1024 * 1024;

const MAX_DIMENSION = 1600;
const QUALITY_STEPS = [0.85, 0.72, 0.58, 0.45];

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function render(bitmap, scale, fillWhite) {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (fillWhite) {
    // JPEG не має прозорості — без підкладки прозорі місця PNG стали б чорними.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

/**
 * encode — пробує стиснути з поступово гіршою якістю, а якщо й це не
 * вкладається в ліміт — ще й зменшує розміри. Повертає Blob або null.
 */
async function encode(bitmap) {
  const longest = Math.max(bitmap.width, bitmap.height);
  let scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;

  for (let round = 0; round < 3; round += 1) {
    // Спершу WebP (зберігає прозорість). Safari старих версій
    // мовчки віддає PNG замість WebP — тоді переходимо на JPEG.
    let { canvas, width, height } = render(bitmap, scale, false);
    const probe = await canvasToBlob(canvas, "image/webp", QUALITY_STEPS[0]);
    const useWebp = probe?.type === "image/webp";

    if (!useWebp) {
      ({ canvas, width, height } = render(bitmap, scale, true));
    }
    const type = useWebp ? "image/webp" : "image/jpeg";

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, type, quality);
      if (blob && blob.size <= IMAGE_MAX_OUTPUT_BYTES) {
        return { blob, width, height };
      }
    }

    scale *= 0.75;
  }

  return null;
}

/**
 * prepareImage — валідує файл і готує його до відправлення.
 * Кидає Error з текстом для користувача (мовою інтерфейсу).
 *
 * @param {File} file
 * @returns {Promise<{blob: Blob, previewUrl: string, width: number, height: number}>}
 */
export async function prepareImage(file) {
  if (!file || !IMAGE_ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Дозволені лише зображення JPEG, PNG або WebP");
  }
  if (file.size > IMAGE_MAX_INPUT_BYTES) {
    throw new Error("Файл завеликий (максимум 10 МБ)");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не вдалося прочитати зображення");
  }

  try {
    const result = await encode(bitmap);
    if (!result) {
      throw new Error("Не вдалося стиснути зображення до 1 МБ");
    }
    return { ...result, previewUrl: URL.createObjectURL(result.blob) };
  } finally {
    bitmap.close?.();
  }
}

// Мініатюра для сітки галереї: коротша сторона ~256px (щоб object-fit:
// cover у плитці лишався різким), довша — не більше 512px (панорами).
const THUMB_SHORT_SIDE = 256;
const THUMB_MAX_SIDE = 512;

/**
 * createThumbnail — робить маленьку копію вже підготовленого зображення
 * (результат prepareImage) для сітки прев'ю. WebP, а якщо браузер його не
 * кодує — JPEG. Зазвичай виходить 10–40 КБ.
 *
 * @param {Blob} blob
 * @returns {Promise<Blob>}
 */
export async function createThumbnail(blob) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("Не вдалося прочитати зображення");
  }

  try {
    const shortest = Math.min(bitmap.width, bitmap.height);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, THUMB_SHORT_SIDE / shortest, THUMB_MAX_SIDE / longest);

    let { canvas } = render(bitmap, scale, false);
    let thumb = await canvasToBlob(canvas, "image/webp", 0.7);

    if (thumb?.type !== "image/webp") {
      ({ canvas } = render(bitmap, scale, true));
      thumb = await canvasToBlob(canvas, "image/jpeg", 0.75);
    }
    if (!thumb) throw new Error("Не вдалося створити мініатюру");
    return thumb;
  } finally {
    bitmap.close?.();
  }
}

/** revokePreview — звільняє objectURL прев'ю, коли воно більше не потрібне. */
export function revokePreview(image) {
  if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
}
