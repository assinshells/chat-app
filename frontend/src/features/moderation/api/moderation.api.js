import { apiClient } from "@shared/api/axios.js";

// durationMs тут БУЛО пропущено в тілі запиту (kick завжди йшов без
// тривалості, хоча бекенд її вимагав) — виправлено разом із рештою
// модерації "кикнути"/"бан".
export const kickRequest = ({ login, room, durationMs, reason }) =>
  apiClient
    .post("/api/moderation/kick", { login, room, durationMs, reason })
    .then((r) => r.data);

/**
 * kickChatRequest — "Кикнути" > "Із чату": тимчасово повністю
 * виключає з чату (не може зайти в жодну кімнату). durationMs можна
 * не передавати (undefined) — тоді бекенд підставить дефолт 10 хв;
 * модератор саме так і викликає цю дію (без поля вводу на фронті).
 */
export const kickChatRequest = ({ login, durationMs, reason }) =>
  apiClient
    .post("/api/moderation/kick-chat", { login, durationMs, reason })
    .then((r) => r.data);

export const banRequest = ({ login, scope, room, durationMs, reason }) =>
  apiClient
    .post("/api/moderation/ban", { login, scope, room, durationMs, reason })
    .then((r) => r.data);

/**
 * banRoomRequest — "Бан" > "Бан кімнати": банить у ВСІХ кімнатах, де
 * права має актор, і переносить жертву в bespredel. room НЕ
 * передається — бекенд сам визначає перелік кімнат за правами актора.
 * durationMs === null означає "назавжди" (лише для admin/superadmin).
 */
export const banRoomRequest = ({ login, durationMs, reason }) =>
  apiClient
    .post("/api/moderation/ban-room", { login, durationMs, reason })
    .then((r) => r.data);

export const unbanRequest = (banId) =>
  apiClient.post("/api/moderation/unban", { banId }).then((r) => r.data);

export const releaseConfinementRequest = (login) =>
  apiClient
    .post("/api/moderation/release-confinement", { login })
    .then((r) => r.data);

export const listActiveBansRequest = (login) =>
  apiClient
    .get(`/api/moderation/bans/${encodeURIComponent(login)}`)
    .then((r) => r.data);
