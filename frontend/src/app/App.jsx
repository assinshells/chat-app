import { useEffect, useState } from "react";
import { AUTH_SCREENS, APP_NAME } from "@shared/constants/auth.constants.js";
import { Storage } from "@shared/lib/storage.js";
import { refreshAccessToken } from "@shared/api/axios.js";
import { useLogoutStore } from "@features/auth/logout/model/useLogoutStore.js";
import { DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";

import { LoginPage } from "@pages/LoginPage.jsx";
import { RegisterPage } from "@pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "@pages/ForgotPasswordPage.jsx";
import { VerifyOtpPage } from "@pages/VerifyOtpPage.jsx";
import { ResetPasswordPage } from "@pages/ResetPasswordPage.jsx";
import { ChatPage } from "@pages/ChatPage.jsx";

import "@app/styles/index.css";

const USER_KEY = "userLogin";
const ROOM_KEY = "userRoom";

export default function App() {
  // accessToken живе лише в пам'яті (AuthSession) і не переживає
  // перезавантаження сторінки — тому при монтуванні робимо "тихий"
  // refresh: якщо у браузера є дійсна httpOnly refreshToken-cookie,
  // сесія відновиться сама, без повторного логіну.
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState(AUTH_SCREENS.LOGIN);
  const [screenParams, setScreenParams] = useState({});
  const logout = useLogoutStore((state) => state.logout);

  useEffect(() => {
    let cancelled = false;

    refreshAccessToken()
      .then(() => {
        if (!cancelled) setScreen(AUTH_SCREENS.APP);
      })
      .catch(() => {
        // Немає дійсної cookie-сесії — залишаємося на екрані логіну.
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = (newScreen, params = {}) => {
    setScreen(newScreen);
    setScreenParams(params);
  };

  const handleLoginSuccess = (login, room) => {
    Storage.set(USER_KEY, login);
    Storage.set(ROOM_KEY, room || DEFAULT_ROOM);
    navigate(AUTH_SCREENS.APP);
  };

  const handleLogout = () => {
    // logout() сам надсилає /api/auth/logout і чистить AuthSession (access-токен
    // у пам'яті), навіть якщо сесія вже минула — див. useLogoutStore.
    logout(() => {
      Storage.remove(USER_KEY);
      navigate(AUTH_SCREENS.LOGIN);
    });
  };

  const currentLogin = Storage.get(USER_KEY) ?? "anonymous";
  const currentRoom = Storage.get(ROOM_KEY) ?? DEFAULT_ROOM;

  if (booting) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <span className="text-muted">{APP_NAME}…</span>
      </div>
    );
  }

  switch (screen) {
    case AUTH_SCREENS.REGISTER:
      return <RegisterPage onNavigate={navigate} />;

    case AUTH_SCREENS.FORGOT:
      return <ForgotPasswordPage onNavigate={navigate} />;

    case AUTH_SCREENS.OTP:
      return (
        <VerifyOtpPage onNavigate={navigate} email={screenParams.email ?? ""} />
      );

    case AUTH_SCREENS.RESET:
      return (
        <ResetPasswordPage
          onNavigate={navigate}
          verifiedToken={screenParams.verifiedToken}
        />
      );

    case AUTH_SCREENS.APP:
      return (
        <ChatPage
          login={currentLogin}
          initialRoom={currentRoom}
          onLogout={handleLogout}
        />
      );

    default:
      return (
        <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
      );
  }
}