import { apiClient } from "@shared/api/axios.js";

/**
 * fetchMessageHistory — REST fallback для отримання історії повідомлень
 * кімнати. useChatSocket більше не викликає цю функцію у звичайному
 * потоці (знімок історії приходить в ack на room:join через сокет —
 * це той самий round-trip, який все одно потрібен серверу для presence),
 * але функція залишається доступною як явний REST-ендпоінт.
 *
 * @param {string} [room] - id кімнати; без параметра бекенд поверне
 *   історію кімнати за замовчуванням.
 * @returns {Promise<Array<{id: string, author: string, text: string, timestamp: number, room: string}>>}
 */
export const fetchMessageHistory = (room) =>
  apiClient
    .get("/api/messages", { params: room ? { room } : undefined })
    .then((r) => r.data.messages);
