import { create } from "zustand";
import {
  updateGenderRequest,
  updateColorRequest,
} from "@features/settings/api/settings.api.js";
import { Storage } from "@shared/lib/storage.js";
import { DEFAULT_COLOR } from "@shared/constants/color.constants.js";

const GENDER_KEY = "userGender";
const COLOR_KEY = "userColor";

export const useSettingsStore = create((set) => ({
  loading: false,
  error: null,
  success: false,
  gender: Storage.get(GENDER_KEY) ?? "",
  // Колір своїх повідомлень/ніка (див. налаштування → "Колір"). 'black' —
  // значення за замовчуванням, збігається з DEFAULT у БД для нових користувачів.
  color: Storage.get(COLOR_KEY) ?? DEFAULT_COLOR,

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

  updateColor: async (color) => {
    set({ loading: true, error: null, success: false });
    try {
      const result = await updateColorRequest(color);
      Storage.set(COLOR_KEY, result.color);
      set({ loading: false, success: true, color: result.color });
    } catch (err) {
      set({ loading: false, error: err.message || "Не вдалося зберегти" });
    }
  },
}));