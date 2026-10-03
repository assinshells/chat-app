import { MessageSquare, Settings, User, Users } from "lucide-react";

/**
 * SIDE_TABS — єдине джерело вкладок лівої іконкової "рейки"
 * (@widgets/side-menu) і панелей з їхнім вмістом
 * (@widgets/chat-leftsidebar).
 *
 * defaultActive — вкладка, відкрита при завантаженні (рівно одна).
 *
 * Приватні повідомлення тут більше немає: вони живуть у модалці,
 * яку відкриває іконка "message-circle" у навбарі
 * (див. privateModal.constants.js).
 */

export const SIDE_TABS = Object.freeze([
  { id: "user", title: "Профіль", icon: User },
  { id: "chat", title: "Чати", icon: MessageSquare },
  { id: "users", title: "Користувачі", icon: Users, defaultActive: true },
  { id: "setting", title: "Налаштування", icon: Settings },
]);
