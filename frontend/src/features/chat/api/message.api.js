import { apiClient } from "@shared/api/axios.js";

/**
 * fetchMessageHistory — REST fallback для получения истории сообщений
 * комнаты. useChatSocket больше не вызывает эту функцию в обычном
 * потоке (снапшот истории приходит в ack на room:join через сокет —
 * это тот же round-trip, который всё равно нужен серверу для presence),
 * но функция остаётся доступной как явный REST-эндпоинт.
 *
 * @param {string} [room] - id комнаты; без параметра бэкенд вернёт
 *   историю комнаты по умолчанию.
 * @returns {Promise<Array<{id: string, author: string, text: string, timestamp: number, room: string}>>}
 */
export const fetchMessageHistory = (room) =>
  apiClient
    .get("/api/messages", { params: room ? { room } : undefined })
    .then((r) => r.data.messages);