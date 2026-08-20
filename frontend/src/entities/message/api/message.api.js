import { apiClient } from "@shared/api/axios.js";

/** @returns {Promise<Array<{id:number,roomId:number,authorId:number,authorLogin:string,content:string,createdAt:string}>>} */
export const fetchMessages = (roomId, { beforeId } = {}) =>
  apiClient
    .get(`/api/rooms/${roomId}/messages`, {
      params: beforeId ? { before: beforeId } : undefined,
    })
    .then((r) => r.data.messages);
