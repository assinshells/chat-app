import axios from "axios";
import { AuthSession } from "@shared/lib/authSession.js";
import { getCsrfToken } from "@shared/lib/csrf.js";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error("[axios] VITE_API_URL не задано. Запити до API не працюватимуть.");
}

// withCredentials — обов'язковий: refreshToken/csrfToken живуть у cookie,
// без цього прапорця браузер не надішле і не прийме їх у кросс-origin
// запитах (frontend і backend на різних портах у dev).
export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Окремий інстанс без інтерсепторів — інакше запит на /refresh,
// що отримав 401, сам потрапить в обробник нижче і зациклиться.
const refreshClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = AuthSession.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // Безпечно надсилати завжди: backend перевіряє заголовок лише
    // якщо у запиту є csrfToken cookie (див. csrf.middleware.js).
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const normalizeError = (error) => {
  const message =
    error.response?.data?.error?.message ||
    (typeof error.response?.data?.error === "string"
      ? error.response.data.error
      : null) ||
    error.message ||
    "Запит не вдався";

  const code = error.response?.data?.error?.code || "UNKNOWN_ERROR";
  const status = error.response?.status ?? 0;

  const normalized = new Error(message);
  normalized.code = code;
  normalized.status = status;
  return normalized;
};

// Поки триває оновлення access-токена, всі паралельні 401-запити
// чекають той самий проміс замість того, щоб кожен бив у /refresh
// власним окремим запитом.
let refreshPromise = null;

const AUTH_ENDPOINTS_WITHOUT_RETRY = ["/api/auth/login", "/api/auth/refresh"];

/**
 * refreshAccessToken — викликає /api/auth/refresh (refreshToken йде
 * автоматично як httpOnly cookie, тіло запиту не потрібне) і кладе
 * новий accessToken в AuthSession. Використовується як інтерсептором 401
 * нижче, так і App.jsx при монтуванні — для відновлення сесії
 * після повного перезавантаження сторінки (accessToken у пам'яті не
 * переживає reload, на відміну від refreshToken-cookie).
 */
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(
        "/api/auth/refresh",
        {},
        {
          headers: {
            "X-CSRF-Token": getCsrfToken(),
          },
        },
      )
      .then(({ data }) => {
        AuthSession.setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        throw normalizeError(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_RETRY.some((path) =>
      config?.url?.includes(path),
    );

    const canRetry =
      response?.status === 401 && !config._retried && !isAuthEndpoint;

    if (!canRetry) {
      return Promise.reject(normalizeError(error));
    }

    config._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(config);
    } catch (refreshError) {
      // Refresh-cookie теж недійсна — сесія завершена остаточно.
      AuthSession.clear();
      window.location.reload();
      return Promise.reject(refreshError);
    }
  },
);
