import { cloneElement, isValidElement, useState } from "react";
import { X } from "lucide-react";

/**
 * ChatLayout — структурный каркас страницы чата: раскладывает три готовых
 * виджета по сетке (layout-wrapper) и владеет открыт/закрыт-состоянием
 * панели профиля (user-profile-sidebar), потому что кнопка открытия живёт
 * внутри chatWindow, а сама панель рисуется тут же, в layout. Композицию
 * виджетов собирает pages/ChatPage.jsx — сам ChatLayout только про
 * разметку/сетку и это одно небольшое состояние.
 *
 * sideNav      — @widgets/side-nav (лого + иконочная навигация + профиль)
 * sidebar      — @widgets/chat-sidebar (список: юзеры/комнаты/приватные чаты)
 * chatWindow   — @widgets/chat-window (лента сообщений + инпут отправки).
 *                Получает проп onOpenProfile через cloneElement — сама
 *                кнопка "show user-profile-sidebar" рисуется внутри него.
 */
export function ChatLayout({ sideNav, sidebar, chatWindow }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const chatWindowWithProfileToggle = isValidElement(chatWindow)
    ? cloneElement(chatWindow, { onOpenProfile: () => setIsProfileOpen(true) })
    : chatWindow;

  return (
    <div className="layout-wrapper d-lg-flex">
      {sideNav}
      {sidebar}
      {chatWindowWithProfileToggle}
      <div className={`user-profile-sidebar${isProfileOpen ? " show" : ""}`}>
        <div className="px-3 px-lg-4 pt-3 pt-lg-4">
          <div className="user-chat-nav text-end">
            <button
              type="button"
              className="btn nav-btn"
              id="user-profile-hide"
              onClick={() => setIsProfileOpen(false)}
              aria-label="Закрити профіль"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        user-profile-sidebar
      </div>
      {isProfileOpen && (
        <div
          className="user-profile-sidebar-overlay d-xl-none"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
}