import { create } from "zustand";
import { chatSocket } from "@shared/api/socket.js";

// Ті самі рядки, що й у backend/src/constants/chat.constants.js — той
// самий принцип, що й у useBlockStore.js (окремі застосунки, спільного
// файлу констант немає).
const FRIEND_LIST = "friend:list";
const FRIEND_ADD = "friend:add";
const FRIEND_REMOVE = "friend:remove";
const FRIEND_UPDATED = "friend:updated";

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
 * useFriendStore — персональний список друзів (пункт "Додати до
 * друзів" в дропдавні ніка, див. features/dm/ui/DmTriggerButton.jsx).
 * Той самий принцип, що й useBlockStore.js: односторонньо, без
 * підтвердження з боку іншої сторони, видно лише самому власнику
 * списку (вкладка "Друзі" в сайдбарі).
 *
 * friendLogins — Set логінів, для швидкої перевірки includes() без
 * .find() по масиву. friends — той самий список, але повний DTO
 * (login/color/friendedAt), потрібен для рендеру вкладки "Друзі".
 *
 * Синхронізується так само, як useBlockStore.syncList: одразу після
 * конекту (див. ChatLayout) — без цього перелік друзів був би
 * порожнім аж до першого відкриття відповідної вкладки сайдбара.
 */
export const useFriendStore = create((set, get) => ({
  friends: [],
  friendLogins: new Set(),
  loaded: false,
  loading: false,
  actionError: null,

  reset: () => set({ friends: [], friendLogins: new Set(), loaded: false, loading: false, actionError: null }),

  _applyList: (friends) =>
    set({
      friends,
      friendLogins: new Set(friends.map((u) => u.login)),
      loaded: true,
      loading: false,
    }),

  syncList: async () => {
    if (get().loading) return;
    set({ loading: true });
    const result = await emitWithAck(FRIEND_LIST, {});
    if (!result?.success) {
      set({ loading: false });
      return;
    }
    get()._applyList(result.friends);
  },

  isFriend: (login) => get().friendLogins.has(login),

  /**
   * addFriend — миттєва дія без модалки підтвердження, просто пункт
   * "Додати до друзів" у дропдавні. Повертає {success, message?}, щоб
   * виклик (DmTriggerButton) міг показати помилку, якщо вона трапилась
   * (наприклад, гонка запитів).
   */
  addFriend: async (login) => {
    set({ actionError: null });
    const result = await emitWithAck(FRIEND_ADD, { login });
    if (!result?.success) {
      set({ actionError: result?.message ?? "Не вдалося додати до друзів" });
      return result;
    }
    get()._applyList(result.friends);
    return result;
  },

  removeFriend: async (login) => {
    set({ actionError: null });
    const result = await emitWithAck(FRIEND_REMOVE, { login });
    if (!result?.success) {
      set({ actionError: result?.message ?? "Не вдалося видалити з друзів" });
      return result;
    }
    get()._applyList(result.friends);
    return result;
  },

  clearActionError: () => set({ actionError: null }),
}));

// Синхронізація між вкладками того самого акаунта (див.
// SOCKET_EVENTS.FRIEND_UPDATED на бекенді, friend.socket.js) — той
// самий захист від подвійної підписки при HMR, що й у useBlockStore.js.
if (chatSocket.__friendUpdatedHandler) {
  chatSocket.off(FRIEND_UPDATED, chatSocket.__friendUpdatedHandler);
}
chatSocket.__friendUpdatedHandler = ({ friends }) => {
  useFriendStore.getState()._applyList(friends);
};
chatSocket.on(FRIEND_UPDATED, chatSocket.__friendUpdatedHandler);
