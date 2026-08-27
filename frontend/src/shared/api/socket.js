import { io } from "socket.io-client";
import { AuthSession } from "@shared/lib/authSession.js";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error("[socket] VITE_API_URL is not set. Realtime connection will fail.");
}

// autoConnect: false — соединение поднимается явно (см. useChatSocket),
// когда уже точно есть валидный accessToken.
// auth как функция, а не статический объект: socket.io-client вызывает
// её заново на КАЖДУЮ (пере)попытку подключения, поэтому после silent
// refresh (см. shared/api/axios.js) реконнект унесёт актуальный токен,
// а не протухший с момента создания сокета.
export const chatSocket = io(apiUrl, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => cb({ token: AuthSession.getAccessToken() }),
});