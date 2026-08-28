import { create } from "zustand";
import { updateGenderRequest } from "@features/settings/api/settings.api.js";
import { Storage } from "@shared/lib/storage.js";

const GENDER_KEY = "userGender";

export const useSettingsStore = create((set) => ({
  loading: false,
  error: null,
  success: false,
  gender: Storage.get(GENDER_KEY) ?? "",

  clearStatus: () => set({ error: null, success: false }),

  updateGender: async (gender) => {
    set({ loading: true, error: null, success: false });
    try {
      const result = await updateGenderRequest(gender);
      Storage.set(GENDER_KEY, result.gender);
      set({ loading: false, success: true, gender: result.gender });
    } catch (err) {
      set({ loading: false, error: err.message || "Не вдалося зберегти" });
    }
  },
}));