import { useEffect, useState } from "react";
import { AUTH_SCREENS, APP_NAME } from "@shared/constants/auth.constants.js";
import { refreshAccessToken } from "@shared/api/axios.js";
import { SocketClient } from "@shared/lib/socket.js";
import { useSessionStore } from "@features/auth/session";
import { useRoomsStore } from "@entities/room";
import { useMessagesStore } from "@entities/message";

import { LoginPage } from "@pages/LoginPage.jsx";
import { RegisterPage } from "@pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "@pages/ForgotPasswordPage.jsx";
import { VerifyOtpPage } from "@pages/VerifyOtpPage.jsx";
import { ResetPasswordPage } from "@pages/ResetPasswordPage.jsx";
import { ChatPage } from "@pages/ChatPage.jsx";

import "@app/styles/index.css";

export default function App() {
  // accessToken живёт только в памяти (AuthSession) и не переживает
  // перезагрузку страницы — поэтому при монтировании делаем "тихий"
  // refresh: если у браузера есть валидная httpOnly refreshToken-cookie,
  // сессия восстановится сама, без повторного логина. После успешного
  // refresh подтягиваем профиль (/api/auth/me) — он нужен чату для
  // currentUserId.
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState(AUTH_SCREENS.LOGIN);
  const [screenParams, setScreenParams] = useState({});

  const user = useSessionStore((s) => s.user);
  const loadCurrentUser = useSessionStore((s) => s.loadCurrentUser);
  const clearSession = useSessionStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    refreshAccessToken()
      .then(() => loadCurrentUser())
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
  }, [loadCurrentUser]);

  const navigate = (newScreen, params = {}) => {
    setScreen(newScreen);
    setScreenParams(params);
  };

  const handleLoginSuccess = async () => {
    await loadCurrentUser();
    navigate(AUTH_SCREENS.APP);
  };

  const handleLogout = () => {
    // LogoutButton (см. widgets/side-nav) уже отправил запрос на
    // /api/auth/logout и очистил AuthSession к моменту этого вызова —
    // здесь только локальный клиентский стейт: сессия, кэш чата и
    // Socket.IO-соединение не должны пережить смену пользователя.
    SocketClient.disconnect();
    useRoomsStore.getState().reset();
    useMessagesStore.getState().reset();
    clearSession();
    navigate(AUTH_SCREENS.LOGIN);
  };

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
      // user может на мгновение быть null между "screen переключился"
      // и "loadCurrentUser резолвнулся" — обе точки входа сюда всегда
      // await'ят loadCurrentUser перед навигацией, но подстраховываемся.
      return user ? <ChatPage user={user} onLogout={handleLogout} /> : null;

    default:
      return (
        <LoginPage onNavigate={navigate} onLoginSuccess={handleLoginSuccess} />
      );
  }
}
