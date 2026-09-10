import { create } from "zustand";
import { chatSocket } from "@shared/api/socket.js";

// Ті самі рядки, що й у backend/src/constants/chat.constants.js — той
// самий принцип, що й у useDmStore.js (окремі застосунки, спільного
// файлу констант немає).
const BLOCK_LIST = "block:list";
const BLOCK_ADD = "block:add";
const BLOCK_REMOVE = "block:remove";
const BLOCK_UPDATED = "block:updated";

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
 * useBlockStore — персональний список заблокованих користувачів
 * (пункт "Заблокувати" в дропдавні ніка, див. features/dm/ui/DmTriggerButton.jsx).
 * Односторонньо: заблокований користувач зникає з чату/списку
 * користувачів ЛИШЕ для того, хто заблокував (фільтрація нижче —
 * blockedLoginsSet, застосовується в ChatLayout до roomUsers/messages),
 * і більше не може писати особисті повідомлення (реальна заборона —
 * на бекенді, див. backend services/privateMessage.service.js).
 *
 * blockedLogins — Set логінів, для швидкої перевірки includes() на
 * кожному повідомленні/учаснику кімнати без .find() по масиву.
 * blocked — той самий список, але повний DTO (login/color/blockedAt),
 * потрібен для рендеру вкладки "Заблоковані" в сайдбарі.
 *
 * Синхронізується так само, як useDmStore.syncList: одразу після
 * конекту (див. ChatLayout) — без цього перелік заблокованих був би
 * порожнім аж до першого відкриття відповідної вкладки сайдбара.
 */
export const useBlockStore = create((set, get) => ({
  blocked: [],
  blockedLogins: new Set(),
  loaded: false,
  loading: false,
  actionError: null,

  reset: () => set({ blocked: [], blockedLogins: new Set(), loaded: false, loading: false, actionError: null }),

  _applyList: (blocked) =>
    set({
      blocked,
      blockedLogins: new Set(blocked.map((u) => u.login)),
      loaded: true,
      loading: false,
    }),

  syncList: async () => {
    if (get().loading) return;
    set({ loading: true });
    const result = await emitWithAck(BLOCK_LIST, {});
    if (!result?.success) {
      set({ loading: false });
      return;
    }
    get()._applyList(result.blocked);
  },

  isBlocked: (login) => get().blockedLogins.has(login),

  /**
   * blockUser — миттєва дія без модалки підтвердження (на відміну від
   * кіку/бану модерації) — просто пункт "Заблокувати" в дропдавні.
   * Повертає {success, message?}, щоб виклик (DmTriggerButton) міг
   * показати помилку, якщо вона трапилась (наприклад, гонка запитів).
   */
  blockUser: async (login) => {
    set({ actionError: null });
    const result = await emitWithAck(BLOCK_ADD, { login });
    if (!result?.success) {
      set({ actionError: result?.message ?? "Не вдалося заблокувати користувача" });
      return result;
    }
    get()._applyList(result.blocked);
    return result;
  },

  unblockUser: async (login) => {
    set({ actionError: null });
    const result = await emitWithAck(BLOCK_REMOVE, { login });
    if (!result?.success) {
      set({ actionError: result?.message ?? "Не вдалося розблокувати користувача" });
      return result;
    }
    get()._applyList(result.blocked);
    return result;
  },

  clearActionError: () => set({ actionError: null }),
}));

// Синхронізація між вкладками того самого акаунта (див.
// SOCKET_EVENTS.BLOCK_UPDATED на бекенді, block.socket.js) — той самий
// захист від подвійної підписки при HMR, що й у useDmStore.js.
if (chatSocket.__blockUpdatedHandler) {
  chatSocket.off(BLOCK_UPDATED, chatSocket.__blockUpdatedHandler);
}
chatSocket.__blockUpdatedHandler = ({ blocked }) => {
  useBlockStore.getState()._applyList(blocked);
};
chatSocket.on(BLOCK_UPDATED, chatSocket.__blockUpdatedHandler);
