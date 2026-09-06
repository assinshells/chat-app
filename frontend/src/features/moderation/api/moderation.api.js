import { apiClient } from "@shared/api/axios.js";

export const kickRequest = ({ login, room, reason }) =>
  apiClient.post("/api/moderation/kick", { login, room, reason }).then((r) => r.data);

export const banRequest = ({ login, scope, room, durationMs, reason }) =>
  apiClient
    .post("/api/moderation/ban", { login, scope, room, durationMs, reason })
    .then((r) => r.data);

export const unbanRequest = (banId) =>
  apiClient.post("/api/moderation/unban", { banId }).then((r) => r.data);

export const listActiveBansRequest = (login) =>
  apiClient
    .get(`/api/moderation/bans/${encodeURIComponent(login)}`)
    .then((r) => r.data);
