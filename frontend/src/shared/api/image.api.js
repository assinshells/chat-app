import { apiClient } from "@shared/api/axios.js";

// id -> Promise<objectURL>. Картинка завантажується лише за кліком на
// "[показати зображення]" (не одразу з історією — чат лишається
// легким), а повторний показ тієї самої не робить нового запиту.
// Зберігається Promise, а не готовий URL, щоб два швидкі кліки не
// породили два паралельні запити.
const cache = new Map();

/**
 * fetchImageUrl — завантажує зображення з бекенда (Authorization
 * додає apiClient: <img src> заголовка передати не може, тому
 * тягнемо як blob і показуємо через objectURL).
 */
export function fetchImageUrl(id) {
  if (!cache.has(id)) {
    const request = apiClient
      .get(`/api/images/${encodeURIComponent(id)}`, {
        responseType: "blob",
        timeout: 30000,
      })
      .then((response) => URL.createObjectURL(response.data))
      .catch((error) => {
        // Невдалий запит не кешуємо — наступний клік спробує знову.
        cache.delete(id);
        throw error;
      });
    cache.set(id, request);
  }
  return cache.get(id);
}

/** clearImageCache — викликати при виході з акаунта (чужі картинки не лишаються в пам'яті). */
export function clearImageCache() {
  for (const request of cache.values()) {
    request.then((url) => URL.revokeObjectURL(url)).catch(() => {});
  }
  cache.clear();
}
