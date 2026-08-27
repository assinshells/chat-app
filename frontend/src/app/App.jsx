import { useEffect, useState } from "react";
import { AUTH_SCREENS, APP_NAME } from "@shared/constants/auth.constants.js";
import { Storage } from "@shared/lib/storage.js";
import { refreshAccessToken } from "@shared/api/axios.js";
import { useLogoutStore } from "@features/auth/logout/model/useLogoutStore.js";

import { LoginPage } from "@pages/LoginPage.jsx";
import { RegisterPage } from "@pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "@pages/ForgotPasswordPage.jsx";
import { VerifyOtpPage } from "@pages/VerifyOtpPage.jsx";
import { ResetPasswordPage } from "@pages/ResetPasswordPage.jsx";
import { ChatPage } from "@pages/ChatPage.jsx";

import "@app/styles/index.css";

const USER_KEY = "userLogin";

export default function App() {
  // accessToken живёt только в памяти (AuthSession) и не переживает
  // перезагрузку страницы — поэтому при монтировании делаем "тихий"
  // refresh: если у браузера есть валидная httpOnly refreshToken-cookie,
  // сессия восстановится сама, без повторного логина.
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
        // Нет валидной cookie-сессии — остаёмся на экране логина.
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

  const handleLoginSuccess = (login) => {
    Storage.set(USER_KEY, login);
    navigate(AUTH_SCREENS.APP);
  };

  const handleLogout = () => {
    // logout() сам шлёт /api/auth/logout и чистит AuthSession (access-токен
    // в памяти), даже если сессия уже истекла — см. useLogoutStore.
    logout(() => {
      Storage.remove(USER_KEY);
      navigate(AUTH_SCREENS.LOGIN);
    });
  };

  const currentLogin = Storage.get(USER_KEY) ?? "anonymous";

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
      return <ChatPage login={currentLogin} onLogout={handleLogout} />;

    default:
      return (
        <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
      );
  }
}