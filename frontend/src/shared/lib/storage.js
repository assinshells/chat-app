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
      // localStorage unavailable (private mode, quota exceeded)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
  },
};