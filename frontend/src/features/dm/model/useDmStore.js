import { create } from "zustand";
import { chatSocket } from "@shared/api/socket.js";

// Те же строки, что и в backend/src/constants/chat.constants.js —
// фронтенд и бэкенд разные приложения, общего файла констант нет (см.
// аналогичный локальный дубль в useChatSocket.js).
const DM_OPEN = "dm:open";
const DM_LIST = "dm:list";
const DM_SEND = "dm:send";
const DM_NEW = "dm:new";

/**
 * emitWithAck — Socket.IO emit с ack, обёрнутый в Promise. Если сокет не
 * подключён (например, вкладку открыли до восстановления сессии),
 * сообщаем об этом как об обычной неудаче, а не подвисаем без ответа.
 */
function emitWithAck(event, payload) {
  return new Promise((resolve) => {
    if (!chatSocket.connected) {
      resolve({ success: false, message: "Немає з'єднання" });
      return;
    }
    chatSocket.emit(event, payload, (result) => resolve(result));
  });
}

/**
 * useDmStore — состояние модалки личных сообщений, теперь с реальной
 * доставкой через персональный сокет-канал пользователя (см. backend
 * sockets/dm.socket.js): dm:open — история с конкретным собеседником,
 * dm:list — сводка по всем диалогам, dm:send — отправка. Входящие
 * сообщения (dm:new) слушаются один раз на уровне модуля (см. низ
 * файла) — это персональный канал, приходит независимо от того, какая
 * комната чата сейчас открыта и открыта ли вообще модалка.
 *
 * conversations — map login -> { login, color, messages, lastMessage,
 *   loading, loaded }. order — логины, последний активный диалог первым.
 */
export const useDmStore = create((set, get) => ({
  currentUser: null,
  conversations: {},
  order: [],
  activeLogin: null,
  listLoading: false,
  listLoaded: false,
  sendError: null,

  /**
   * setCurrentUser — вызывается один раз из ChatLayout (см. проп login):
   * нужно знать свой логин, чтобы по входящему dm:new {sender, recipient}
   * понять, КТО тут "собеседник", а не "я".
   */
  setCurrentUser: (login) => set({ currentUser: login }),

  /**
   * openConversation — открывает вкладку с конкретным собеседником и,
   * если история ещё не подгружалась в этой сессии, запрашивает её
   * через dm:open. color — цвет собеседника (передаётся с места клика,
   * см. DmTriggerButton), используется, пока история не пришла и/или
   * если диалог совсем новый (сообщений ещё не было ни в одну сторону).
   */
  openConversation: async (login, color) => {
    const { conversations, order } = get();
    const existing = conversations[login];

    set({
      conversations: {
        ...conversations,
        [login]: existing
          ? { ...existing, loading: !existing.loaded }
          : { login, color, messages: [], loading: true, loaded: false },
      },
      order: order.includes(login) ? order : [login, ...order],
      activeLogin: login,
      sendError: null,
    });

    if (existing?.loaded) return;

    const result = await emitWithAck(DM_OPEN, { login });

    set((state) => {
      const current = state.conversations[login];
      if (!result?.success) {
        return {
          conversations: { ...state.conversations, [login]: { ...current, loading: false } },
        };
      }

      // Пока грузилась история, могло успеть прийти live-сообщение
      // (dm:new) — не теряем его, домешиваем то, чего нет в истории по id.
      const historyIds = new Set(result.messages.map((m) => m.id));
      const liveOnly = (current?.messages ?? []).filter((m) => !historyIds.has(m.id));

      return {
        conversations: {
          ...state.conversations,
          [login]: {
            login,
            color: current?.color ?? color,
            messages: [...result.messages, ...liveOnly],
            lastMessage: current?.lastMessage,
            loading: false,
            loaded: true,
          },
        },
      };
    });
  },

  /**
   * openInbox — открывает модалку "как есть" (иконка в шапке, без
   * конкретного адресата): всегда перезапрашивает свежий список
   * диалогов через dm:list, чтобы вкладки не были устаревшими, если
   * пришли новые диалоги, начатые с других устройств/вкладок.
   */
  openInbox: async () => {
    set({ listLoading: true });
    const result = await emitWithAck(DM_LIST, {});

    set((state) => {
      if (!result?.success) return { listLoading: false };

      const conversations = { ...state.conversations };
      const order = [];

      for (const summary of result.conversations) {
        order.push(summary.login);
        const existing = conversations[summary.login];
        conversations[summary.login] = {
          login: summary.login,
          color: summary.color,
          messages: existing?.messages ?? [],
          lastMessage: summary.lastMessage,
          loading: existing?.loading ?? false,
          loaded: existing?.loaded ?? false,
        };
      }

      // Диалоги, уже открытые локально в этой сессии (клик "Написати
      // особисте повідомлення"), но в которых ещё ни одного сообщения
      // не сохранилось на сервере — dm:list их не вернёт, но терять из
      // списка вкладок не нужно, дописываем в конец.
      for (const login of state.order) {
        if (!order.includes(login)) order.push(login);
      }

      return {
        conversations,
        order,
        listLoading: false,
        listLoaded: true,
        activeLogin: state.activeLogin ?? order[0] ?? null,
      };
    });
  },

  /**
   * selectConversation — переключение вкладки внутри уже открытой
   * модалки (не открывает саму модалку). Догружает историю, если эта
   * вкладка ещё не была открыта в текущей сессии.
   */
  selectConversation: (login) => {
    set({ activeLogin: login, sendError: null });
    const convo = get().conversations[login];
    if (convo && !convo.loaded && !convo.loading) {
      get().openConversation(login, convo.color);
    }
  },

  /**
   * sendMessage — отправка через dm:send. Сообщение в состояние НЕ
   * добавляется здесь напрямую (без оптимистичного рендера) — сервер
   * рассылает dm:new в личный канал ОБЕИХ сторон, включая отправителя
   * (см. backend sockets/dm.socket.js), поэтому оно и так придёт через
   * module-level подписку ниже — единый источник истины, без риска
   * задвоения. Возвращает {success, message?} — вызывающий код (модалка)
   * сам решает, что делать с ошибкой (например, показать её текст).
   */
  sendMessage: async (login, text) => {
    const result = await emitWithAck(DM_SEND, { to: login, text });
    if (!result?.success) {
      set({ sendError: result?.message ?? "Не вдалося надіслати" });
    }
    return result;
  },

  clearSendError: () => set({ sendError: null }),

  // Вызывается из module-level подписки на dm:new ниже — не экспортируется
  // отдельно, наружу используется только сам факт подписки.
  _handleIncoming: (message) => {
    const { currentUser, conversations, order } = get();
    if (!currentUser) return;

    const isOwn = message.sender === currentUser;
    const otherLogin = isOwn ? message.recipient : message.sender;
    const existing = conversations[otherLogin];

    // Дедуп на случай повторной доставки (переподключение и т.п.) — тот
    // же принцип, что и в useChatSocket.js для message:new/system:event.
    if (existing?.messages.some((m) => m.id === message.id)) return;

    set({
      conversations: {
        ...conversations,
        [otherLogin]: {
          login: otherLogin,
          // Цвет собеседника берём из сообщения ТОЛЬКО если ещё не знаем
          // его (новый диалог) — иначе эхо СВОЕГО же сообщения (color =
          // цвет отправителя, то есть в этом случае мой) затёрло бы уже
          // известный цвет собеседника.
          color: existing?.color ?? message.color,
          messages: [...(existing?.messages ?? []), message],
          lastMessage: { text: message.text, timestamp: message.timestamp, own: isOwn },
          loading: existing?.loading ?? false,
          loaded: existing?.loaded ?? false,
        },
      },
      order: [otherLogin, ...order.filter((l) => l !== otherLogin)],
    });
  },
}));

// Персональный канал слушается ровно один раз за жизнь вкладки (модуль
// импортируется единожды) — независимо от того, смонтирована ли сейчас
// DirectMessagesModal, чтобы счётчики/превью в списке диалогов оставались
// живыми, даже пока модалка закрыта.
chatSocket.on(DM_NEW, (message) => {
  useDmStore.getState()._handleIncoming(message);
});
