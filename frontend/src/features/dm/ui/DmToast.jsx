import { useEffect, useState } from "react";

import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { useDmStore } from "../model/useDmStore.js";

// Скільки плашка висить на екрані, якщо по ній не клікнули.
const TOAST_VISIBLE_MS = 5000;

/**
 * DmToast — коротка плашка "Ім'я: текст" поверх чату, коли приходить
 * особисте повідомлення, а цей діалог зараз не відкритий (без неї
 * повідомлення легко пропустити — інакше сигнал лише бейдж у шапці).
 * Клік відкриває цей діалог у модалці особистих повідомлень.
 *
 * Тост спрацьовує, лише якщо після першого syncList зросло значення
 * unreadCount конкретного діалогу — тож початкове завантаження списку,
 * власні повідомлення та перепідключення тостів не породжують.
 */
export function DmToast() {
  const [toast, setToast] = useState(null);
  const isDarkTheme = useIsDarkTheme();

  useEffect(() => {
    const unsubscribe = useDmStore.subscribe((state, prev) => {
      if (!prev.listLoaded) return;

      for (const login of state.order) {
        // Діалог, який зараз відкритий, тостом не дублюємо.
        if (state.panelLogin === login) continue;
        const convo = state.conversations[login];
        const before = prev.conversations[login]?.unreadCount ?? 0;
        if (!convo || convo.unreadCount <= before) continue;

        setToast({
          id: `${login}:${convo.lastMessage?.timestamp ?? Date.now()}`,
          login,
          color: convo.color,
          text: convo.lastMessage?.text || (convo.lastMessage?.hasImage ? "[зображення]" : ""),
        });
        return;
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const handleOpen = () => {
    useDmStore.getState().openConversation(toast.login, toast.color);
    setToast(null);
  };

  return (
    <button
      key={toast.id}
      type="button"
      className="dm-toast"
      onClick={handleOpen}
      role="status"
      aria-live="polite"
    >
      <span
        className="dm-toast-name"
        style={{ color: getEffectiveColorHex(toast.color, isDarkTheme) }}
      >
        {toast.login}
      </span>
      <span className="dm-toast-text">{toast.text}</span>
    </button>
  );
}
