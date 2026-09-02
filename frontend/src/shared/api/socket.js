import { io } from "socket.io-client";
import { AuthSession } from "@shared/lib/authSession.js";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error("[socket] VITE_API_URL не задано. З'єднання в реальному часі не працюватиме.");
}

// autoConnect: false — з'єднання піднімається явно (див. useChatSocket),
// коли вже точно є дійсний accessToken.
// auth як функція, а не статичний об'єкт: socket.io-client викликає
// її заново на КОЖНУ (пере)спробу підключення, тому після silent
// refresh (див. shared/api/axios.js) реконект понесе актуальний токен,
// а не застарілий з моменту створення сокета.
export const chatSocket = io(apiUrl, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => cb({ token: AuthSession.getAccessToken() }),
});