import { create } from "zustand";

/**
 * useDmStore — состояние модалки личных сообщений.
 *
 * ВАЖНО: реальной доставки сообщений собеседнику пока нет (нет ни
 * сокет-событий, ни таблицы в БД под личку — см. обсуждение архитектуры).
 * Это UI-каркас: "написанные" сообщения просто добавляются локально в
 * conversations и видны только тебе, чтобы можно было собрать и обкатать
 * интерфейс (модалка, вкладки, отправка) до того, как будет готов
 * бэкенд. Модалка честно предупреждает об этом (см. DirectMessagesModal).
 *
 * conversations — map login -> { login, color, messages: [] }.
 * order — логины в порядке "последний открытый — первый" (для вкладок).
 * activeLogin — какая вкладка сейчас открыта внутри модалки.
 */
export const useDmStore = create((set, get) => ({
  conversations: {},
  order: [],
  activeLogin: null,

  /**
   * openConversation — открывает модалку сразу на диалоге с конкретным
   * пользователем (вызывается из пункта "Написати особисте повідомлення"
   * у ніка в сайдбарі/чаті). Если диалога с ним ещё не было — создаёт
   * пустой. color — цвет, который этот пользователь выбрал в настройках
   * (передаётся с места клика, чтобы не делать отдельный запрос).
   */
  openConversation: (login, color) => {
    const { conversations, order } = get();
    const exists = conversations[login];

    set({
      conversations: exists
        ? conversations
        : { ...conversations, [login]: { login, color, messages: [] } },
      order: exists ? order : [login, ...order],
      activeLogin: login,
    });
  },

  /**
   * openInbox — открывает модалку "просто так" (иконка в шапке), без
   * конкретного адресата: показывает список уже начатых диалогов,
   * оставляя активным тот, что был открыт последним (или ничего, если
   * диалогов ещё не было — тогда справа плейсхолдер-подсказка).
   */
  openInbox: () => {
    const { activeLogin, order } = get();
    if (activeLogin) return;
    set({ activeLogin: order[0] ?? null });
  },

  selectConversation: (login) => set({ activeLogin: login }),

  /**
   * sendLocalMessage — "отправка" внутри демо-каркаса: добавляет
   * сообщение в локальный список текущего диалога с пометкой own: true
   * (собеседнику ничего не уходит, см. предупреждение в шапке модалки).
   */
  sendLocalMessage: (login, text) => {
    const { conversations } = get();
    const convo = conversations[login];
    if (!convo) return;

    const message = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      own: true,
      text,
      timestamp: Date.now(),
    };

    set({
      conversations: {
        ...conversations,
        [login]: { ...convo, messages: [...convo.messages, message] },
      },
    });
  },
}));
