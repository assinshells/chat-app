import { apiClient } from "@shared/api/axios.js";

// Кеші objectURL: id -> Promise<url>. Окремо для мініатюр (сітка) і
// повних фото (лайтбокс). Зберігається Promise, а не готовий URL, щоб
// два швидкі запити одного й того самого id не породили два завантаження.
// <img src> не може передати Authorization, тому тягнемо як blob —
// той самий підхід, що й для зображень чату (image.api.js).
const thumbCache = new Map();
const fullCache = new Map();

function fetchBlobUrl(cache, id, suffix = "") {
  if (!cache.has(id)) {
    const request = apiClient
      .get(`/api/gallery/${encodeURIComponent(id)}${suffix}`, {
        responseType: "blob",
        timeout: 30000,
      })
      .then((response) => URL.createObjectURL(response.data))
      .catch((error) => {
        // Невдалий запит не кешуємо — наступна спроба піде знову.
        cache.delete(id);
        throw error;
      });
    cache.set(id, request);
  }
  return cache.get(id);
}

export const fetchGalleryThumbUrl = (id) => fetchBlobUrl(thumbCache, id, "/thumb");

export const fetchGalleryPhotoUrl = (id) => fetchBlobUrl(fullCache, id);

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(blob);
  });
}

/**
 * @returns {Promise<{ success: boolean, photos: Array<{ id: string, size: number, createdAt: string }>, limit: number }>}
 */
export const fetchGallery = () =>
  apiClient.get("/api/gallery").then((r) => r.data);

/**
 * uploadGalleryPhoto — фото і мініатюра йдуть одним JSON-запитом (base64).
 *
 * @param {{ image: Blob, thumb: Blob }} files
 * @returns {Promise<{ success: boolean, photo: { id: string, size: number, createdAt: string } }>}
 */
export const uploadGalleryPhoto = async ({ image, thumb }) => {
  const [imageB64, thumbB64] = await Promise.all([
    blobToBase64(image),
    blobToBase64(thumb),
  ]);
  return apiClient
    .post("/api/gallery", { image: imageB64, thumb: thumbB64 }, { timeout: 60000 })
    .then((r) => r.data);
};

/**
 * Загальна галерея: схвалені фото ВСІХ користувачів, нові першими.
 * Сторінки за id: before — id останнього отриманого фото.
 * query — пошук за частиною ніка автора (без урахування регістру).
 *
 * @returns {Promise<{ photos: Array<{ id: string, status: string, createdAt: string, owner: { login: string, color: string } }>, hasMore: boolean }>}
 */
export const fetchPublicGallery = ({ before, query } = {}) =>
  apiClient
    .get("/api/gallery/public", { params: { before, limit: 30, q: query || undefined } })
    .then((r) => r.data);

/**
 * Черга перевірки (лише admin/superadmin і модератори з правом): непроверені
 * фото всіх користувачів. pendingCount — скільки всього чекає перевірки.
 */
export const fetchReviewGallery = ({ before, limit = 30, query } = {}) =>
  apiClient
    .get("/api/gallery/review", { params: { before, limit, q: query || undefined } })
    .then((r) => r.data);

export const approveGalleryPhoto = (id) =>
  apiClient.post(`/api/gallery/${encodeURIComponent(id)}/approve`).then((r) => r.data);

function dropFromCache(cache, id) {
  const request = cache.get(id);
  cache.delete(id);
  request?.then((url) => URL.revokeObjectURL(url)).catch(() => {});
}

export const deleteGalleryPhoto = (id) =>
  apiClient.delete(`/api/gallery/${encodeURIComponent(id)}`).then((r) => {
    dropFromCache(thumbCache, id);
    dropFromCache(fullCache, id);
    return r.data;
  });

/** clearGalleryCache — викликати при виході з акаунта (чужі фото не лишаються в пам'яті). */
export function clearGalleryCache() {
  for (const cache of [thumbCache, fullCache]) {
    for (const request of cache.values()) {
      request.then((url) => URL.revokeObjectURL(url)).catch(() => {});
    }
    cache.clear();
  }
}
