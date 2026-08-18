import { Storage } from "@shared/lib/storage.js";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@shared/constants/auth.constants.js";

/**
 * TokenStorage — единая точка чтения/записи пары JWT-токенов.
 * Оба токена меняются вместе (login, refresh-ротация, logout),
 * поэтому хранение их в одном модуле исключает рассинхронизацию.
 */
export const TokenStorage = {
  getAccessToken() {
    return Storage.get(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return Storage.get(REFRESH_TOKEN_KEY);
  },

  setTokens({ accessToken, refreshToken }) {
    Storage.set(ACCESS_TOKEN_KEY, accessToken);
    Storage.set(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens() {
    Storage.remove(ACCESS_TOKEN_KEY);
    Storage.remove(REFRESH_TOKEN_KEY);
  },

  hasSession() {
    return Boolean(this.getAccessToken());
  },
};