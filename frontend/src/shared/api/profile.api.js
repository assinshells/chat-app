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

/**
 * updateAbout — редагування поля "Про себе" (textarea) в аккордеоні
 * "Personal Info".
 *
 * @param {string} about - порожній рядок дозволений (очищає поле)
 * @returns {Promise<{ success: boolean, about: string|null }>}
 */
export const updateAbout = (about) =>
  apiClient.patch("/api/auth/about", { about }).then((r) => r.data);

/**
 * updateMaritalStatus — сімейний стан (код зі списку
 * MARITAL_STATUS_OPTIONS).
 *
 * @param {string} maritalStatus - порожній рядок дозволений (очищає поле)
 * @returns {Promise<{ success: boolean, maritalStatus: string|null }>}
 */
export const updateMaritalStatus = (maritalStatus) =>
  apiClient
    .patch("/api/auth/marital-status", { maritalStatus })
    .then((r) => r.data);

/**
 * updateColor — колір тексту повідомлень (REST-варіант; у чаті
 * використовується сокет-подія color:update, див. useChatSocket.js,
 * бо вона ще й оновлює колір вже відкритого сокета).
 *
 * @param {string} color - одне з COLOR_OPTIONS
 * @returns {Promise<{ success: boolean, color: string }>}
 */
export const updateColor = (color) =>
  apiClient.patch("/api/auth/color", { color }).then((r) => r.data);

/**
 * updateTextStyle — жирний/курсивний текст повідомлень (REST-варіант,
 * див. updateColor вище). Кожне поле необов'язкове.
 *
 * @param {{ bold?: boolean, italic?: boolean }} style
 * @returns {Promise<{ success: boolean, bold: boolean, italic: boolean }>}
 */
export const updateTextStyle = (style) =>
  apiClient.patch("/api/auth/text-style", style).then((r) => r.data);
