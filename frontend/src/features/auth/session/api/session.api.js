import { apiClient } from "@shared/api/axios.js";

/** @returns {Promise<{id:number, login:string, email:string|null, gender:string}>} */
export const fetchCurrentUser = () =>
  apiClient.get("/api/auth/me").then((r) => r.data.user);
