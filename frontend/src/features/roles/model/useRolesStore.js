import { create } from "zustand";
import {
  getRoleInfoRequest,
  assignRoleRequest,
  removeRoleRequest,
} from "@features/roles/api/roles.api.js";
import { ROLE_VALUES } from "@shared/constants/role.constants.js";

/**
 * useRolesStore — стан єдиної на застосунок модалки керування роллю
 * (RoleManageModal, рендериться один раз у ChatLayout — так само, як
 * PrivateChat). openFor(login, color) викликається
 * з пункту меню "Керувати роллю" біля чужого ніка (DmTriggerButton),
 * за аналогією з useDmStore.openConversation.
 *
 * targetLogin — ідентифікатор цілі: бекенд керує ролями за логіном
 * (не за id), оскільки id відомий не всюди, де є цей пункт меню
 * (наприклад, автор повідомлення в ChatConversation — лише логін).
 */
export const useRolesStore = create((set, get) => ({
  targetLogin: null,
  targetColor: undefined,
  currentRole: ROLE_VALUES.USER,
  selectedRole: ROLE_VALUES.MODERATOR,
  selectedRooms: [],
  // Право модератора перевіряти фото галереї (чекбокс в RoleManageModal).
  canReviewPhotos: false,
  loading: false,
  saving: false,
  error: null,
  success: null,

  openFor: async (login, color) => {
    set({
      targetLogin: login,
      targetColor: color,
      loading: true,
      saving: false,
      error: null,
      success: null,
      currentRole: ROLE_VALUES.USER,
      selectedRole: ROLE_VALUES.MODERATOR,
      selectedRooms: [],
      canReviewPhotos: false,
    });

    try {
      const info = await getRoleInfoRequest(login);
      // Поки запит летів, могли відкрити модалку для іншої людини —
      // застосовуємо результат лише якщо ціль не змінилася відтоді.
      if (get().targetLogin !== login) return;

      set({
        loading: false,
        currentRole: info.role,
        selectedRole:
          info.role === ROLE_VALUES.ADMIN
            ? ROLE_VALUES.ADMIN
            : ROLE_VALUES.MODERATOR,
        selectedRooms: info.rooms ?? [],
        // Для admin бекенд віддає true (вони перевіряють завжди) — але як
        // налаштування чекбокс має сенс лише для модератора.
        canReviewPhotos:
          info.role === ROLE_VALUES.MODERATOR && Boolean(info.canReviewPhotos),
      });
    } catch (err) {
      if (get().targetLogin !== login) return;
      set({
        loading: false,
        error: err.message || "Не вдалося отримати роль користувача",
      });
    }
  },

  setSelectedRole: (role) =>
    set({ selectedRole: role, error: null, success: null }),

  toggleRoom: (room) =>
    set((state) => ({
      selectedRooms: state.selectedRooms.includes(room)
        ? state.selectedRooms.filter((r) => r !== room)
        : [...state.selectedRooms, room],
      error: null,
      success: null,
    })),

  toggleCanReviewPhotos: () =>
    set((state) => ({
      canReviewPhotos: !state.canReviewPhotos,
      error: null,
      success: null,
    })),

  clearStatus: () => set({ error: null, success: null }),

  submitAssign: async () => {
    const { targetLogin, selectedRole, selectedRooms, canReviewPhotos, saving } = get();
    if (!targetLogin || saving) return;

    set({ saving: true, error: null, success: null });
    try {
      const result = await assignRoleRequest({
        login: targetLogin,
        role: selectedRole,
        rooms: selectedRole === ROLE_VALUES.MODERATOR ? selectedRooms : [],
        canReviewPhotos:
          selectedRole === ROLE_VALUES.MODERATOR && canReviewPhotos,
      });
      set({
        saving: false,
        success: "Роль збережено",
        currentRole: result.role,
        selectedRooms: result.rooms ?? [],
        canReviewPhotos:
          result.role === ROLE_VALUES.MODERATOR && Boolean(result.canReviewPhotos),
      });
    } catch (err) {
      set({ saving: false, error: err.message || "Не вдалося зберегти роль" });
    }
  },

  submitRemove: async () => {
    const { targetLogin, saving } = get();
    if (!targetLogin || saving) return;

    set({ saving: true, error: null, success: null });
    try {
      const result = await removeRoleRequest(targetLogin);
      set({
        saving: false,
        success: "Роль знято",
        currentRole: result.role,
        selectedRooms: [],
        canReviewPhotos: false,
      });
    } catch (err) {
      set({ saving: false, error: err.message || "Не вдалося зняти роль" });
    }
  },
}));
