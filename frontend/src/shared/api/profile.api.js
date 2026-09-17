import { apiClient } from "@shared/api/axios.js";

/**
 * updateEmail / updateCity — точкове редагування полів "Personal
 * Info" в аккордеоні сайдбара (ChatLeftSidebar, таб "Налаштування").
 * Той самий патерн PATCH-запитів, що й gender/color/status
 * (features/.../model), але без окремого стору — виклик іде прямо з
 * EditableProfileField, а результат кладеться в useCurrentUserStore.
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, email: string }>}
 */
export const updateEmail = (email) =>
  apiClient.patch("/api/auth/email", { email }).then((r) => r.data);

/**
 * @param {string} city - порожній рядок дозволений (очищає поле)
 * @returns {Promise<{ success: boolean, city: string|null }>}
 */
export const updateCity = (city) =>
  apiClient.patch("/api/auth/city", { city }).then((r) => r.data);

/**
 * updateDisplayName — редагування поля "Name" (напр. "Erik
 * Thompson"), не плутати з логіном/ніком (login незмінний,
 * використовується для входу й скрізь у чаті).
 *
 * @param {string} displayName - порожній рядок дозволений (очищає поле)
 * @returns {Promise<{ success: boolean, displayName: string|null }>}
 */
export const updateDisplayName = (displayName) =>
  apiClient
    .patch("/api/auth/display-name", { displayName })
    .then((r) => r.data);
