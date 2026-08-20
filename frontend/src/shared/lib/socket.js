import { io } from "socket.io-client";
import { AuthSession } from "@shared/lib/authSession.js";

const SOCKET_URL = import.meta.env.VITE_API_URL;

let socket = null;

/**
 * auth как функция (не объект) — socket.io-client вызывает её заново
 * при каждом (пере)подключении, так что после ротации accessToken
 * (см. shared/api/axios.js refresh-интерцептор) реконнект подхватит
 * актуальный токен сам, без ручной пересборки сокета.
 */
const createSocket = () =>
  io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: AuthSession.getAccessToken() }),
  });

/**
 * SocketClient — единственное на вкладку Socket.IO-соединение.
 * Создаётся лениво при первом обращении (после логина, когда уже есть
 * accessToken) и переиспользуется всеми фичами чата — join/leave
 * разных комнат идут по одному и тому же сокету вместо создания
 * нового соединения на каждую комнату.
 */
export const SocketClient = {
  get() {
    if (!socket) socket = createSocket();
    return socket;
  },

  connect() {
    const s = this.get();
    if (!s.connected) s.connect();
    return s;
  },

  disconnect() {
    socket?.disconnect();
  },
};
