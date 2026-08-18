import { LogoutButton } from "@features/auth/logout/ui/LogoutButton.jsx";
import logo from "@shared/assets/logo/logo.svg";
import {
  User,
  Users,
  Repeat,
  Menu,
  LogOut,
  Settings,
  MessagesSquare,
} from "lucide-react";

export function ChatPage({ login, onLogout }) {
  return (
    <>
      {/*  Start ChatLayout */}
      <div className="layout-wrapper d-lg-flex">
        {/*  Start left sidebar-menu */}
        <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
          {/*  Start Logo */}
          <div className="navbar-brand-box">
            <a href="/" className="logo logo-dark">
              <span className="logo-sm">
                <img src={logo} alt="Logo" height="30" />
              </span>
            </a>
            <a href="/" className="logo logo-light">
              <span className="logo-sm">
                <img src={logo} alt="Logo" height="30" />
              </span>
            </a>
          </div>
          {/*  End Logo */}
          {/*  Start side-menu nav */}
          <div className="flex-lg-column my-auto">
            <ul
              className="nav nav-pills side-menu-nav justify-content-center"
              role="tablist"
            >
              <li className="nav-item" title="Users">
                <a
                  className="nav-link"
                  id="pills-users-tab"
                  data-bs-toggle="pill"
                  href="#pills-users"
                  role="tab"
                >
                  <Users />
                </a>
              </li>
              <li className="nav-item" title="Rooms">
                <a
                  className="nav-link active"
                  id="pills-rooms-tab"
                  data-bs-toggle="pill"
                  href="#pills-rooms"
                  role="tab"
                >
                  <Repeat />
                </a>
              </li>
              <li className="nav-item" title="Private Chats">
                <a
                  className="nav-link"
                  id="pills-private-chat-tab"
                  data-bs-toggle="pill"
                  href="#pills-private-chat"
                  role="tab"
                >
                  <MessagesSquare />
                </a>
              </li>
              <li className="nav-item dropdown profile-user-dropdown d-inline-block d-lg-none">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <Menu />
                </a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="#">
                    Profile
                    <User
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                  <a className="dropdown-item" href="#">
                    Setting
                    <Settings
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#">
                    Log out
                    <LogOut
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                </div>
              </li>
            </ul>
          </div>
          {/*  End side-menu nav */}
          <div className="flex-lg-column d-none d-lg-block">
            <ul className="nav side-menu-nav justify-content-center">
              <li className="nav-item btn-group dropup profile-user-dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <Menu />
                </a>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="#">
                    Profile
                    <User
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                  <a className="dropdown-item" href="#">
                    Setting
                    <Settings
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="auth-login.html">
                    Log out
                    <LogOut
                      className="float-end text-muted"
                      size={20}
                      strokeWidth={2}
                    />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        {/*  End left sidebar-menu */}
        {/*  Start chat-leftsidebar */}
        <div className="chat-leftsidebar me-lg-1 ms-lg-0">
          <div className="tab-content">
            <div
              className="tab-pane"
              id="pills-users"
              role="tabpanel"
              aria-labelledby="pills-users-tab"
            >
              Вы вошли как {login}
              <LogoutButton onLoggedOut={onLogout} />
            </div>

            <div
              className="tab-pane active"
              id="pills-rooms"
              role="tabpanel"
              aria-labelledby="pills-rooms-tab"
            >
              Rooms
            </div>
            <div
              className="tab-pane"
              id="pills-private-chat"
              role="tabpanel"
              aria-labelledby="pills-private-chat-tab"
            >
              PrivateChat
            </div>
          </div>
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
