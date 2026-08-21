/**
 * ChatLayout — структурный каркас страницы чата: просто раскладывает три
 * готовых виджета по сетке (layout-wrapper) и ничего не знает об их
 * внутреннем содержимом (лого, вкладки, сообщения). Композицию собирает
 * pages/ChatPage.jsx — сам ChatLayout только про разметку/сетку.
 *
 * sideNav      — @widgets/side-nav (лого + иконочная навигация + профиль)
 * sidebar      — @widgets/chat-sidebar (список: юзеры/комнаты/приватные чаты)
 * chatWindow   — @widgets/chat-window (лента сообщений + инпут отправки)
 */
export function ChatLayout({ sideNav, sidebar, chatWindow }) {
  return (
    <div className="layout-wrapper d-lg-flex">
      {sideNav}
      {sidebar}
      {chatWindow}
      <div className="user-profile-sidebar">
                        <div className="px-3 px-lg-4 pt-3 pt-lg-4">
                            <div className="user-chat-nav text-end">
                                <button type="button" className="btn nav-btn" id="user-profile-hide">
                                    <i className="ri-close-line">X</i>
                                </button>
                            </div>
                        </div>
                        user-profile-sidebar
                        </div>
    </div>
  );
}