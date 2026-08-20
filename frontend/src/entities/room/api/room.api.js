import { apiClient } from "@shared/api/axios.js";

/** @returns {Promise<Array<{id:string,name:string}>>} */
export const fetchRooms = () =>
  apiClient.get("/api/rooms").then((r) => r.data.rooms);
