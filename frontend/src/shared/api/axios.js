import axios from "axios";
import { AuthSession } from "@shared/lib/authSession.js";
import { getCsrfToken } from "@shared/lib/csrf.js";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error("[axios] VITE_API_URL is not set. API calls will fail.");
}

// withCredentials — обязателен: refreshToken/csrfToken живут в cookie,
// без этого флага браузер не отправит и не примет их на кросс-origin
// запросах (frontend и backend на разных портах в dev).
export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Отдельный инстанс без интерсепторов — иначе запрос на /refresh,
// получивший 401, сам попадёт в обработчик ниже и зациклится.
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
    // Безвредно отправлять всегда: backend проверяет заголовок только
    // если у запроса есть csrfToken cookie (см. csrf.middleware.js).
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
    "Request failed";

  const code = error.response?.data?.error?.code || "UNKNOWN_ERROR";
  const status = error.response?.status ?? 0;

  const normalized = new Error(message);
  normalized.code = code;
  normalized.status = status;
  return normalized;
};

// Пока идёт обновление access-токена, все параллельные 401-запросы
// ждут один и тот же промис вместо того, чтобы каждый бил в /refresh
// своим собственным запросом.
let refreshPromise = null;

const AUTH_ENDPOINTS_WITHOUT_RETRY = ["/api/auth/login", "/api/auth/refresh"];

/**
 * refreshAccessToken — вызывает /api/auth/refresh (refreshToken уходит
 * автоматически как httpOnly cookie, тело запроса не нужно) и кладёт
 * новый accessToken в AuthSession. Используется как интерцептором 401
 * ниже, так и App.jsx при монтировании — для восстановления сессии
 * после полной перезагрузки страницы (accessToken в памяти не переживает
 * reload, в отличие от refreshToken-cookie).
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
      // Refresh-cookie тоже недействителен — сессия завершена окончательно.
      AuthSession.clear();
      window.location.reload();
      return Promise.reject(refreshError);
    }
  },
);
