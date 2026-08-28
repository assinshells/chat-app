import { apiClient } from "@shared/api/axios.js";

export const updateGenderRequest = (gender) =>
  apiClient.patch("/api/auth/gender", { gender }).then((r) => r.data);