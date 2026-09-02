export const Storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage недоступний (приватний режим, вичерпано квоту)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage недоступний
    }
  },
};
