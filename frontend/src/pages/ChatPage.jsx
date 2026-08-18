import { LogoutButton } from "@features/auth/logout/ui/LogoutButton.jsx";

/**
 * HomePage — заглушка защищённой страницы, куда пользователь попадает
 * после успешного логина. В исходном проекте это был ChatPage (чат),
 * но чат — не часть модуля аутентификации, поэтому здесь оставлена
 * только демонстрация того, где и как используется кнопка "Log out".
 */
export function ChatPage({ login, onLogout }) {
  return (
    <>
      {/*  Start ChatLayout */}
      <div className="layout-wrapper d-lg-flex">
        {/*  Start left sidebar-menu */}
        <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
          left sidebar-menu
        </div>
        {/*  End left sidebar-menu */}
        {/*  Start chat-leftsidebar */}
        <div className="chat-leftsidebar me-lg-1 ms-lg-0">
          chat-leftsidebar Вы вошли как {login}
          <LogoutButton onLoggedOut={onLogout} />
        </div>
        {/*  End chat-leftsidebar */}
        {/*  Start User chat */}
        <div className="user-chat w-100 overflow-hidden">
          <div className="d-lg-flex">User chat</div>
        </div>
        {/*  End User chat */}
      </div>
      {/*  End ChatLayout */}
    </>
  );
}
