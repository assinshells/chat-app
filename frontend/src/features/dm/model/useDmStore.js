import { create } from "zustand";
import { chatSocket } from "@shared/api/socket.js";

// Ті самі рядки, що й у backend/src/constants/chat.constants.js —
// фронтенд і бекенд різні застосунки, спільного файлу констант немає
// (див. аналогічний локальний дубль у useChatSocket.js).
const DM_OPEN = "dm:open";
const DM_LIST = "dm:list";
const DM_SEND = "dm:send";
const DM_NEW = "dm:new";
const DM_READ = "dm:read";
// "Мене (не)заблокував співрозмовник" — жива подія в персональний
// канал (див. backend sockets/block.socket.js) — оновлює прапорець
// blocked уже відкритого діалогу, не чекаючи наступного dm:open.
const DM_BLOCKED_CHANGED = "dm:blocked_changed";

/**
 * emitRead — фонове "прочитано" без ack: dm:open на бекенді сам
 * позначає прочитаним усе, що прийшло історією, але для live-повідомлення,
 * яке прилетіло, поки діалог уже відкритий (dm:open вдруге не
 * викликається — див. openConversation), потрібен окремий сигнал.
 * Мовчки ігнорує відсутність з'єднання — це best-effort синхронізація,
 * а не критична дія: наступний dm:open однаково підчистить хвіст.
 */
function emitRead(login) {
  if (!chatSocket.connected) return;
  chatSocket.emit(DM_READ, { login });
}

/**
 * emitWithAck — Socket.IO emit з ack, обгорнутий у Promise. Якщо сокет
 * не підключений (наприклад, вкладку відкрили до відновлення сесії),
 * повідомляємо про це як про звичайну невдачу, а не зависаємо без відповіді.
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
 * useDmStore — стан особистих повідомлень, з реальною доставкою через
 * персональний сокет-канал користувача (див. backend sockets/dm.socket.js):
 * dm:open — історія з конкретним співрозмовником, dm:list — зведення по
 * всіх діалогах, dm:send — відправлення. Вхідні повідомлення (dm:new)
 * слухаються один раз на рівні модуля (див. низ файлу) — це персональний
 * канал, він приходить незалежно від того, яка кімната зараз відкрита і
 * чи дивиться користувач узагалі на приватні діалоги.
 *
 * conversations — map login -> { login, color, messages, lastMessage,
 *   loading, loaded, unreadCount, blocked }. order — логіни, останній
 *   активний діалог першим (джерело списку в табі "Приватні
 *   повідомлення", див. ChatLeftSidebar).
 *
 * panelLogin — діалог, розгорнутий зараз в ОСНОВНІЙ області чату замість
 *   стрічки кімнати (@widgets/private-chat). Єдина точка показу
 *   листування: окремої модалки більше немає, тому немає й
 *   activeLogin/modalOpen/mobileView, які були потрібні лише їй.
 */
export const useDmStore = create((set, get) => ({
  currentUser: null,
  conversations: {},
  order: [],
  panelLogin: null,
  listLoading: false,
  listLoaded: false,
  sendError: null,

  /**
   * setCurrentUser — викликається з ChatLayout (див. проп login): потрібно
   * знати свій логін, щоб за вхідним dm:new {sender, recipient} зрозуміти,
   * ХТО тут "співрозмовник", а не "я".
   *
   * useDmStore — singleton-стор на рівні модуля (переживає
   * mount/unmount ChatLayout), тому просто перезаписати currentUser
   * НЕДОСТАТНЬО: якщо в цій самій вкладці відбувся logout -> login
   * (навіть під ІНШИМ акаунтом, без перезавантаження сторінки),
   * conversations/order від попередньої сесії лишалися б висіти в сторі
   * і змішувалися б із діалогами нового користувача — саме це виглядало
   * як "діалоги/лічильники плутаються між собою". Тому при РЕАЛЬНІЙ
   * зміні логіна (не при першому виклику з null) стан повністю скидається.
   */
  setCurrentUser: (login) => {
    const { currentUser } = get();
    if (currentUser !== null && currentUser !== login) {
      get().reset();
    }
    set({ currentUser: login });
  },

  /**
   * reset — повне очищення стану особистих повідомлень. Викликається
   * явно при logout (див. useLogoutStore) і захисно при зміні
   * currentUser (див. setCurrentUser вище) — два незалежні запобіжники
   * від одного й того самого класу бага (витік стану між сесіями в тій
   * самій вкладці).
   */
  reset: () =>
    set({
      conversations: {},
      order: [],
      panelLogin: null,
      listLoading: false,
      listLoaded: false,
      sendError: null,
    }),

  /**
   * markAsRead — обнуляє лічильник непрочитаних конкретного діалогу.
   * Викликається при його реальному відкритті (openConversation).
   */
  markAsRead: (login) => {
    const { conversations } = get();
    const convo = conversations[login];
    if (!convo) return;

    // Сигналимо серверу незалежно від того, чи був локальний unreadCount
    // > 0: сервер міг накопичити непрочитані, про які ця вкладка ще
    // навіть не знає (наприклад, повідомлення прийшло, поки сокет був
    // офлайн, і dm:list із них ще не підвантажувався). Виклик ідемпотентний.
    emitRead(login);

    if (!convo.unreadCount) return;

    set({
      conversations: {
        ...conversations,
        [login]: { ...convo, unreadCount: 0 },
      },
    });
  },

  /**
   * openConversation — відкриває діалог в основній області чату
   * (panelLogin) і, якщо історія ще не підвантажувалась у цій сесії,
   * запитує її через dm:open.
   *
   * Два входи, обидва ведуть сюди: вибір діалогу в табі "Приватні
   * повідомлення" лівого сайдбара і пункт "Написати особисте
   * повідомлення" у меню біля ніка (DmTriggerButton). color —
   * колір співрозмовника з місця кліку: потрібен, поки історія не
   * прийшла і/або якщо діалог зовсім новий (повідомлень ще не було в
   * жодну сторону).
   */
  openConversation: async (login, color) => {
    const { conversations, order } = get();
    const existing = conversations[login];

    set({
      conversations: {
        ...conversations,
        [login]: existing
          ? { ...existing, loading: !existing.loaded }
          : { login, color, messages: [], loading: true, loaded: false, unreadCount: 0 },
      },
      order: order.includes(login) ? order : [login, ...order],
      panelLogin: login,
      sendError: null,
    });
    get().markAsRead(login);

    if (existing?.loaded) return;

    await get()._loadHistory(login, color);
  },

  /**
   * closeConversation — повернення основної області до публічної
   * кімнати (кнопка "Назад" у шапці приватного чату, вибір кімнати в
   * табі "Чати"). Історію не скидає — при повторному відкритті вона вже
   * буде в conversations.
   */
  closeConversation: () => set({ panelLogin: null, sendError: null }),

  /**
   * _loadHistory — фактичний запит повної історії листування через
   * dm:open і запис результату в conversations[login].
   */
  _loadHistory: async (login, color) => {
    const result = await emitWithAck(DM_OPEN, { login });

    set((state) => {
      const current = state.conversations[login];
      if (!result?.success) {
        return {
          conversations: { ...state.conversations, [login]: { ...current, loading: false } },
        };
      }

      // Поки завантажувалась історія, могло встигнути прийти
      // live-повідомлення (dm:new) — не втрачаємо його, домішуємо те,
      // чого немає в історії за id.
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
            unreadCount: 0,
            // blocked — заблокована відправка в цьому діалозі (в один
            // із двох боків, див. backend privateMessage.service.js):
            // PrivateChat показує замість форми відправлення
            // пояснення "Не можна надіслати повідомлення".
            blocked: Boolean(result.blocked),
          },
        },
      };
    });
  },

  /**
   * _handleBlockedChanged — жива реакція на dm:blocked_changed (див.
   * підписку на модуль-рівні внизу файлу): оновлює прапорець blocked
   * ЛИШЕ якщо діалог з цією людиною вже підвантажений локально —
   * якщо його ще не було, наступний dm:open і так принесе актуальний
   * стан.
   */
  _handleBlockedChanged: ({ by, blocked }) => {
    const { conversations } = get();
    const existing = conversations[by];
    if (!existing) return;

    set({
      conversations: {
        ...conversations,
        [by]: { ...existing, blocked },
      },
    });
  },

  /**
   * syncList — синхронізація зведення діалогів (dm:list). Викликається
   * одразу після встановлення/відновлення з'єднання (див. ChatLayout),
   * і цього достатньо: далі список підтримують живі dm:new. Саме через
   * неї таб "Приватні повідомлення" і бейдж непрочитаних у рейці
   * показують реальну картину одразу після входу, а не порожньо до
   * першого кліку.
   *
   * dm:list повертає лише ЗВЕДЕННЯ (превью останнього повідомлення) —
   * повну історію конкретного діалогу підвантажує окремо dm:open
   * (див. openConversation/_loadHistory).
   */
  syncList: async () => {
    set({ listLoading: true });
    const result = await emitWithAck(DM_LIST, {});
    if (!result?.success) {
      set({ listLoading: false });
      return;
    }

    set((state) => {
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
          // existing.unreadCount пріоритетний: якщо в межах ЦІЄЇ сесії
          // вже накопичився локальний лічильник (живі dm:new), не
          // затираємо його застарілим серверним значенням. Якщо existing
          // ще немає — беремо реальне значення з БД.
          unreadCount: existing?.unreadCount ?? summary.unreadCount ?? 0,
          // dm:list не перевіряє блокування (це лише зведення прев'ю) —
          // зберігаємо вже відоме локально значення, якщо є; свіже
          // прийде при відкритті діалогу (dm:open) або живою подією
          // dm:blocked_changed.
          blocked: existing?.blocked ?? false,
        };
      }

      // Діалоги, вже відкриті локально в цій сесії, але яких ще немає
      // на сервері (жодного збереженого повідомлення) — не втрачаємо.
      for (const login of state.order) {
        if (!order.includes(login)) order.push(login);
      }

      return { conversations, order, listLoading: false, listLoaded: true };
    });
  },

  /**
   * sendMessage — відправлення через dm:send. Повідомлення у стан НЕ
   * додається тут напряму (без оптимістичного рендеру) — сервер
   * розсилає dm:new в особистий канал ОБОХ сторін, включно з
   * відправником (див. backend sockets/dm.socket.js), тому воно і так
   * прийде через module-level підписку нижче — єдине джерело істини,
   * без ризику задвоєння.
   */
  sendMessage: async (login, text) => {
    // Клієнтська підстраховка перед запитом (реальна заборона все одно
    // на бекенді, див. privateMessage.service.js): діалог міг стати
    // заблокованим ПІСЛЯ рендеру поточного кадру (жива подія
    // dm:blocked_changed) — не витрачаємо round-trip даремно.
    if (get().conversations[login]?.blocked) {
      set({ sendError: "Не можна надіслати повідомлення цьому користувачу" });
      return { success: false, message: "Не можна надіслати повідомлення цьому користувачу" };
    }

    const result = await emitWithAck(DM_SEND, { to: login, text });
    if (!result?.success) {
      set({ sendError: result?.message ?? "Не вдалося надіслати" });
    }
    return result;
  },

  clearSendError: () => set({ sendError: null }),

  // Викликається з module-level підписки на dm:new нижче — не
  // експортується окремо, назовні використовується лише сам факт підписки.
  _handleIncoming: (message) => {
    const { currentUser, conversations, order, panelLogin } = get();
    if (!currentUser) return;

    const isOwn = message.sender === currentUser;
    const otherLogin = isOwn ? message.recipient : message.sender;
    const existing = conversations[otherLogin];

    // Дедуп на випадок повторної доставки (перепідключення тощо) — той
    // самий принцип, що й у useChatSocket.js для message:new/system:event.
    if (existing?.messages.some((m) => m.id === message.id)) return;

    // Не рахуємо непрочитаним: своє ж повідомлення (луна) і повідомлення
    // в діалог, розгорнутий прямо зараз в основній області чату.
    const isBeingViewed = panelLogin === otherLogin;
    const unreadCount =
      isOwn || isBeingViewed ? existing?.unreadCount ?? 0 : (existing?.unreadCount ?? 0) + 1;

    // Людина бачить це повідомлення в реальному часі — на бекенді воно
    // все одно лишилося б read_at IS NULL назавжди, бо dm:open вдруге
    // для вже завантаженого діалогу не викликається (див.
    // openConversation). Без цього рядка те саме повідомлення виглядало
    // б непрочитаним при вході з іншого пристрою/після relogin.
    if (!isOwn && isBeingViewed) emitRead(otherLogin);

    set({
      conversations: {
        ...conversations,
        [otherLogin]: {
          login: otherLogin,
          // Колір співрозмовника беремо з повідомлення ЛИШЕ якщо ще не
          // знаємо його (новий діалог) — інакше луна ВЛАСНОГО ж
          // повідомлення (color = колір відправника, тобто в цьому
          // випадку мій) затерла б уже відомий колір співрозмовника.
          color: existing?.color ?? message.color,
          messages: [...(existing?.messages ?? []), message],
          lastMessage: { text: message.text, timestamp: message.timestamp, own: isOwn },
          loading: existing?.loading ?? false,
          loaded: existing?.loaded ?? false,
          unreadCount,
          blocked: existing?.blocked ?? false,
        },
      },
      order: [otherLogin, ...order.filter((l) => l !== otherLogin)],
    });
  },
}));

// Персональний канал слухається рівно один раз за життя вкладки —
// незалежно від того, чи відкритий зараз якийсь приватний діалог, щоб
// лічильники/превью у списку діалогів залишалися живими, навіть поки
// модалка закрита.
//
// ВАЖЛИВО: у dev-режимі (Vite HMR) цей модуль може переоцінюватися
// повторно (наприклад, при редагуванні самого useDmStore.js), а
// chatSocket — імпортований singleton, який HMR не перестворює. Без
// захисту нижче кожен такий "гарячий" реімпорт додавав би ЩЕ ОДИН
// обробник dm:new поверх старого (замість заміни) — кожне вхідне
// повідомлення оброблялося б N разів, unreadCount ріс би не на 1, а
// на N (звідси "лічильник рахує неправильно" навіть у межах ОДНІЄЇ
// сесії, без жодного relogin). Прибираємо попередній обробник з тим
// самим маркером ПЕРЕД тим, як вішати новий.
if (chatSocket.__dmNewHandler) {
  chatSocket.off(DM_NEW, chatSocket.__dmNewHandler);
}
chatSocket.__dmNewHandler = (message) => {
  useDmStore.getState()._handleIncoming(message);
};
chatSocket.on(DM_NEW, chatSocket.__dmNewHandler);

if (chatSocket.__dmBlockedChangedHandler) {
  chatSocket.off(DM_BLOCKED_CHANGED, chatSocket.__dmBlockedChangedHandler);
}
chatSocket.__dmBlockedChangedHandler = (payload) => {
  useDmStore.getState()._handleBlockedChanged(payload);
};
chatSocket.on(DM_BLOCKED_CHANGED, chatSocket.__dmBlockedChangedHandler);
