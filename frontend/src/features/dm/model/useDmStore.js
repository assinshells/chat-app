import { create } from "zustand";
import { chatSocket } from "@shared/api/socket.js";

// Ті самі рядки, що й у backend/src/constants/chat.constants.js —
// фронтенд і бекенд різні застосунки, спільного файлу констант немає
// (див. аналогічний локальний дубль у useChatSocket.js).
const DM_OPEN = "dm:open";
const DM_LIST = "dm:list";
const DM_SEND = "dm:send";
const DM_NEW = "dm:new";

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
 * useDmStore — стан модалки особистих повідомлень, з реальною
 * доставкою через персональний сокет-канал користувача (див. backend
 * sockets/dm.socket.js): dm:open — історія з конкретним співрозмовником,
 * dm:list — зведення по всіх діалогах, dm:send — відправлення. Вхідні
 * повідомлення (dm:new) слухаються один раз на рівні модуля (див. низ
 * файлу) — це персональний канал, приходить незалежно від того, яка
 * кімната чату зараз відкрита і чи відкрита взагалі модалка.
 *
 * conversations — map login -> { login, color, messages, lastMessage,
 *   loading, loaded, unreadCount }. order — логіни, останній активний
 *   діалог першим. modalOpen — чи реально зараз видно DirectMessagesModal
 *   на екрані (див. shown.bs.modal/hidden.bs.modal у самому компоненті) —
 *   потрібно, щоб не рахувати непрочитаним те, що людина бачить наживо.
 *
 * mobileView — 'list' | 'conversation', має значення ЛИШЕ на вузьких
 * екранах (див. CSS-медіазапит в app.css: на десктопі список діалогів
 * і листування показуються одночасно поруч, цей прапорець там ні на
 * що не впливає). На мобільному ж екран один, і точка входу визначає,
 * що показати одразу:
 *  - відкриття з шапки (openInbox) — список діалогів ('list');
 *  - "Написати особисте повідомлення" біля конкретного ніка
 *    (openConversation) — одразу листування з цією людиною
 *    ('conversation'), без потреби шукати її в списку;
 *  - вибір діалогу зі списку руками (selectConversation) — теж
 *    перемикає на листування;
 *  - кнопка "Назад" у шапці листування (див. DirectMessagesModal.jsx) —
 *    єдиний спосіб повернутися до 'list', не закриваючи модалку.
 */
export const useDmStore = create((set, get) => ({
  currentUser: null,
  conversations: {},
  order: [],
  activeLogin: null,
  listLoading: false,
  listLoaded: false,
  sendError: null,
  modalOpen: false,
  mobileView: "list",

  /**
   * setCurrentUser — викликається з ChatLayout (див. проп login): потрібно
   * знати свій логін, щоб за вхідним dm:new {sender, recipient} зрозуміти,
   * ХТО тут "співрозмовник", а не "я".
   *
   * useDmStore — singleton-стор на рівні модуля (переживає
   * mount/unmount ChatLayout), тому просто перезаписати currentUser
   * НЕДОСТАТНЬО: якщо в цій самій вкладці відбувся logout -> login
   * (навіть під ІНШИМ акаунтом, без перезавантаження сторінки),
   * conversations/order/activeLogin від попередньої сесії лишалися б
   * висіти в сторі і змішувалися б із діалогами нового користувача —
   * саме це виглядало як "діалоги/лічильники плутаються між собою".
   * Тому при РЕАЛЬНІЙ зміні логіна (не при першому виклику з null)
   * стан особистих повідомлень повністю скидається.
   */
  setCurrentUser: (login) => {
    const { currentUser } = get();
    if (currentUser !== null && currentUser !== login) {
      get().reset();
    }
    set({ currentUser: login });
  },

  /**
   * reset — повне очищення стану модалки особистих повідомлень.
   * Викликається явно при logout (див. useLogoutStore) і захисно при
   * зміні currentUser (див. setCurrentUser вище) — два незалежні
   * запобіжники від одного й того самого класу бага (витік стану між
   * сесіями в тій самій вкладці).
   */
  reset: () =>
    set({
      conversations: {},
      order: [],
      activeLogin: null,
      listLoading: false,
      listLoaded: false,
      sendError: null,
      modalOpen: false,
      mobileView: "list",
    }),

  /**
   * setModalOpen — викликається з DirectMessagesModal за нативними
   * подіями Bootstrap shown.bs.modal/hidden.bs.modal (див. компонент) —
   * модалка рендериться завжди (портал у document.body), видимість
   * перемикає сам Bootstrap через CSS, React про це інакше не дізнався б.
   */
  setModalOpen: (open) => set({ modalOpen: open }),

  /**
   * markAsRead — обнуляє лічильник непрочитаних конкретного діалогу.
   * Викликається при його реальному відкритті (openConversation/
   * selectConversation) і при показі модалки, якщо діалог вже був активний.
   */
  markAsRead: (login) => {
    const { conversations } = get();
    const convo = conversations[login];
    if (!convo || !convo.unreadCount) return;

    set({
      conversations: {
        ...conversations,
        [login]: { ...convo, unreadCount: 0 },
      },
    });
  },

  /**
   * showConversationList — повертає мобільний вигляд модалки до списку
   * діалогів (кнопка "Назад" у шапці листування, див.
   * DirectMessagesModal.jsx). На десктопі ні на що не впливає — там обидві
   * панелі видно одночасно незалежно від mobileView.
   */
  showConversationList: () => set({ mobileView: "list" }),

  /**
   * openConversation — відкриває вкладку з конкретним співрозмовником і,
   * якщо історія ще не підвантажувалась у цій сесії, запитує її
   * через dm:open. color — колір співрозмовника (передається з місця
   * кліку, див. DmTriggerButton), використовується, поки історія не
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
      activeLogin: login,
      sendError: null,
      // Явний запит листування з конкретною людиною (клік у ніка) —
      // на мобільному одразу показуємо його, а не список діалогів.
      mobileView: "conversation",
    });
    get().markAsRead(login);

    if (existing?.loaded) return;

    await get()._loadHistory(login, color);
  },

  /**
   * _loadHistory — фактичний запит повної історії листування через
   * dm:open і запис результату в conversations[login]. Винесено з
   * openConversation окремо, щоб той самий код можна було використати і
   * з openInbox (див. нижче) — там теж потрібно довантажити історію
   * автоматично обраного за замовчуванням діалогу, але БЕЗ побічних
   * ефектів openConversation типу зміни activeLogin/order/mobileView
   * (openInbox сам вирішує ці поля — на мобільному, наприклад, відкриття
   * з шапки завжди повинно показувати список, а не листування, навіть
   * якщо якийсь діалог обрано активним "під капотом").
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
          },
        },
      };
    });
  },

  /**
   * openInbox — відкриває модалку "як є" (іконка в шапці, без
   * конкретного адресата): завжди повторно запитує свіжий список
   * діалогів через dm:list, щоб вкладки не були застарілими, якщо
   * прийшли нові діалоги, розпочаті з інших пристроїв/вкладок.
   *
   * dm:list повертає лише ЗВЕДЕННЯ по діалогах (превью останнього
   * повідомлення), а не повний список повідомлень — його підвантажує
   * окремо dm:open (див. openConversation/_loadHistory). Якщо при
   * першому відкритті модалки за сесію діалог обирається активним
   * автоматично (нижче — коли ще немає state.activeLogin), його повну
   * історію теж треба підвантажити явно, інакше показувалась би пуста
   * заглушка "Повідомлень ще немає. Напишіть перше!" замість реальної
   * переписки — саме так і виглядав баг, який тут виправлено.
   *
   * mobileView скидається на 'list' безумовно: це вхід "хочу
   * подивитися всі діалоги", навіть якщо до цього на мобільному було
   * відкрито конкретне листування (через openConversation) — відкриття
   * з шапки повинно показати список, а не продовжити з того місця,
   * де зупинилися (див. вимогу в задачі).
   */
  openInbox: async () => {
    set({ listLoading: true, mobileView: "list" });
    const result = await emitWithAck(DM_LIST, {});

    // Заповнюється нижче, лише якщо активний діалог щойно обрано
    // автоматично (раніше activeLogin був null) — саме цей випадок і
    // потребує довантаження повної історії.
    let autoSelectedLogin = null;

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
          unreadCount: existing?.unreadCount ?? 0,
        };
      }

      // Діалоги, вже відкриті локально в цій сесії (клік "Написати
      // особисте повідомлення"), але в яких ще жодного повідомлення
      // не збереглося на сервері — dm:list їх не поверне, але втрачати
      // зі списку вкладок не потрібно, дописуємо в кінець.
      for (const login of state.order) {
        if (!order.includes(login)) order.push(login);
      }

      const activeLogin = state.activeLogin ?? order[0] ?? null;
      if (!state.activeLogin && activeLogin) autoSelectedLogin = activeLogin;

      return {
        conversations,
        order,
        listLoading: false,
        listLoaded: true,
        activeLogin,
      };
    });

    // Якщо після оновлення списку є активна вкладка (щойно обрана за
    // замовчуванням або вже була) — вважаємо її прочитаною, модалка
    // от-от з'явиться на екрані (див. handleShown у компоненті, який
    // дублює те саме на випадок, якщо activeLogin зміниться вже ПІСЛЯ
    // показу модалки).
    const { activeLogin } = get();
    if (activeLogin) get().markAsRead(activeLogin);

    // Довантажуємо повну історію автоматично обраного діалогу (див.
    // коментар до функції вище) — рівно тими ж кроками, що й ручний
    // вибір вкладки (selectConversation), але не чіпаючи mobileView.
    if (autoSelectedLogin) {
      const convo = get().conversations[autoSelectedLogin];
      if (convo && !convo.loaded && !convo.loading) {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [autoSelectedLogin]: { ...state.conversations[autoSelectedLogin], loading: true },
          },
        }));
        await get()._loadHistory(autoSelectedLogin, convo.color);
      }
    }
  },

  /**
   * selectConversation — перемикання вкладки всередині вже відкритої
   * модалки (не відкриває саму модалку). Довантажує історію, якщо ця
   * вкладка ще не була відкрита в поточній сесії. На мобільному це і
   * є вибір діалогу зі списку — одразу перемикаємо вигляд на листування.
   */
  selectConversation: (login) => {
    set({ activeLogin: login, sendError: null, mobileView: "conversation" });
    get().markAsRead(login);

    const convo = get().conversations[login];
    if (convo && !convo.loaded && !convo.loading) {
      get().openConversation(login, convo.color);
    }
  },

  /**
   * sendMessage — відправлення через dm:send. Повідомлення у стан НЕ
   * додається тут напряму (без оптимістичного рендеру) — сервер
   * розсилає dm:new в особистий канал ОБОХ сторін, включно з
   * відправником (див. backend sockets/dm.socket.js), тому воно і так
   * прийде через module-level підписку нижче — єдине джерело істини,
   * без ризику задвоєння. Повертає {success, message?} — код, що
   * викликає (модалка), сам вирішує, що робити з помилкою (наприклад,
   * показати її текст).
   */
  sendMessage: async (login, text) => {
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
    const { currentUser, conversations, order, modalOpen, activeLogin } = get();
    if (!currentUser) return;

    const isOwn = message.sender === currentUser;
    const otherLogin = isOwn ? message.recipient : message.sender;
    const existing = conversations[otherLogin];

    // Дедуп на випадок повторної доставки (перепідключення тощо) — той
    // самий принцип, що й у useChatSocket.js для message:new/system:event.
    if (existing?.messages.some((m) => m.id === message.id)) return;

    // Не рахуємо непрочитаним: своє ж повідомлення (луна) і повідомлення
    // в діалог, який людина прямо зараз бачить на екрані (модалка
    // відкрита і активна саме ця вкладка).
    const isBeingViewed = modalOpen && activeLogin === otherLogin;
    const unreadCount =
      isOwn || isBeingViewed ? existing?.unreadCount ?? 0 : (existing?.unreadCount ?? 0) + 1;

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
        },
      },
      order: [otherLogin, ...order.filter((l) => l !== otherLogin)],
    });
  },
}));

// Персональний канал слухається рівно один раз за життя вкладки —
// незалежно від того, чи змонтована зараз DirectMessagesModal, щоб
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
