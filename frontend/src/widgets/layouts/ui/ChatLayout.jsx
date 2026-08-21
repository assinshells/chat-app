import { cloneElement, isValidElement } from "react";
import { X } from "lucide-react";

/**
 * ChatLayout — структурный каркас страницы чата: раскладывает три готовых
 * виджета по сетке (layout-wrapper) и рисует панель комнат
 * (user-profile-sidebar — класс из исходной вёрстки, содержимое теперь —
 * список комнат, а не профиль). Открыт/закрыт-состояние панели живёт
 * снаружи (в pages/ChatPage.jsx), т.к. его нужно менять не только кнопкой
 * внутри chatWindow, но и при выборе комнаты в самом списке — а он
 * управляется на уровне ChatPage. ChatLayout поэтому — контролируемый
 * компонент: открытость приходит через isRoomsOpen, открытие/закрытие —
 * через onOpenRooms/onCloseRooms.
 *
 * sideNav      — @widgets/side-nav (лого + иконочная навигация + профиль)
 * sidebar      — @widgets/chat-sidebar (список: юзеры/приватные чаты)
 * chatWindow   — @widgets/chat-window (лента сообщений + инпут отправки).
 *                Получает проп onOpenRooms через cloneElement — кнопка
 *                "Кімнати", открывающая user-profile-sidebar, рисуется
 *                в его шапке.
 * roomsContent — содержимое user-profile-sidebar (список комнат,
 *                @widgets/room-list).
 */
export function ChatLayout({
  sideNav,
  sidebar,
  chatWindow,
  isRoomsOpen,
  onOpenRooms,
  onCloseRooms,
  roomsContent,
}) {
  const chatWindowWithRoomsToggle = isValidElement(chatWindow)
    ? cloneElement(chatWindow, { onOpenRooms })
    : chatWindow;

  return (
    <div className="layout-wrapper d-lg-flex">
      {sideNav}
      {sidebar}
      {chatWindowWithRoomsToggle}
      <div className={`user-profile-sidebar${isRoomsOpen ? " show" : ""}`}>
        <div className="px-3 px-lg-4 pt-3 pt-lg-4">
          <div className="user-chat-nav text-end">
            <button
              type="button"
              className="btn nav-btn"
              id="user-profile-hide"
              onClick={onCloseRooms}
              aria-label="Закрити кімнати"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        {roomsContent}
      </div>
      {isRoomsOpen && (
        <div
          className="user-profile-sidebar-overlay d-xl-none"
          onClick={onCloseRooms}
        />
      )}
    </div>
  );
}