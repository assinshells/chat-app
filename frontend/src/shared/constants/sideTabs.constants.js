import { Mail, MessageSquare, Settings, User, Users } from "lucide-react";

/**
 * SIDE_TABS — єдине джерело вкладок лівої іконкової "рейки"
 * (@widgets/side-menu) і панелей з їхнім вмістом
 * (@widgets/chat-leftsidebar).
 *
 * defaultActive — вкладка, відкрита при завантаженні (рівно одна).
 * badge — ключ лічильника, який рейка малює поверх іконки; зараз
 * єдиний: непрочитані особисті повідомлення.
 */
export const SIDE_TAB_BADGES = Object.freeze({
  DM_UNREAD: "dmUnread",
});

export const SIDE_TABS = Object.freeze([
  { id: "user", title: "Профіль", icon: User },
  { id: "chat", title: "Чати", icon: MessageSquare },
  {
    id: "private",
    title: "Приватні повідомлення",
    icon: Mail,
    badge: SIDE_TAB_BADGES.DM_UNREAD,
  },
  { id: "users", title: "Користувачі", icon: Users, defaultActive: true },
  { id: "setting", title: "Налаштування", icon: Settings },
]);

// id вкладки приватних повідомлень + id її pill-кнопки в DOM:
// потрібні там, де таб треба відкрити програмно (див. DmTriggerButton —
// пункт "Написати особисте повідомлення" біля ніка).
export const PRIVATE_TAB_ID = "private";
export const PRIVATE_TAB_BUTTON_ID = `pills-${PRIVATE_TAB_ID}-tab`;
