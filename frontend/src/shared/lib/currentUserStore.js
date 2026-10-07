import { create } from "zustand";

/**
 * useCurrentUserStore — профіль поточного залогіненого користувача,
 * одержаний з GET /api/auth/me (див. shared/api/me.api.js). Потрібен,
 * щоб UI знав власну роль — access-токен навмисно не несе роль (вона
 * може змінитися до сплину токена, див. backend guards/role.guard.js),
 * тому це єдине джерело правди на фронті.
 *
 * Заповнюється в App.jsx одразу після успішного login/refresh,
 * очищується при logout. Singleton-стор на рівні модуля (як useDmStore) —
 * компоненти на кшталт DmTriggerButton читають його напряму, без
 * прокидання пропсів через увесь ланцюжок ChatLayout -> Sidebar.
 */
export const useCurrentUserStore = create((set) => ({
  id: null,
  login: null,
  role: null,
  status: null,
  color: null,
  bold: false,
  italic: false,
  email: null,
  city: null,
  displayName: null,
  about: null,
  maritalStatus: null,
  moderatorRooms: [],
  // Право перевіряти фото галереї: admin/superadmin завжди, moderator — лише
  // з виданим адміном прапорцем (приходить з GET /api/auth/me). Це лише
  // підказка для UI, реальна перевірка — на бекенді, наживо.
  canReviewPhotos: false,

  setUser: (user) =>
    set({
      id: user.id,
      login: user.login,
      role: user.role,
      status: user.status,
      color: user.color ?? null,
      bold: Boolean(user.bold),
      italic: Boolean(user.italic),
      email: user.email ?? null,
      city: user.city ?? null,
      displayName: user.displayName ?? null,
      about: user.about ?? null,
      maritalStatus: user.maritalStatus ?? null,
      moderatorRooms: user.moderatorRooms ?? [],
      canReviewPhotos: Boolean(user.canReviewPhotos),
    }),

  // Оптимістичне оновлення одразу після успішного status:update (див.
  // useChatSocket.js) — не чекаємо наступного getMe, щоб таб "Профіль"
  // відреагував миттєво.
  setStatus: (status) => set({ status }),

  // Оптимістичне оновлення кольору тексту після успішного color:update.
  setColor: (color) => set({ color }),

  // Жирний/курсивний текст; undefined-поле лишає поточне значення.
  setTextStyle: ({ bold, italic }) =>
    set((state) => ({
      bold: bold ?? state.bold,
      italic: italic ?? state.italic,
    })),

  // Точкове оновлення email/city/displayName після успішного
  // PATCH-запиту з EditableProfileField (аккордеон "Personal Info" в
  // ChatLeftSidebar, таб "Профіль") — так само без повторного getMe.
  setEmail: (email) => set({ email }),
  setCity: (city) => set({ city }),
  setDisplayName: (displayName) => set({ displayName }),
  setAbout: (about) => set({ about }),
  setMaritalStatus: (maritalStatus) => set({ maritalStatus }),

  clear: () =>
    set({
      id: null,
      login: null,
      role: null,
      status: null,
      color: null,
      bold: false,
      italic: false,
      email: null,
      city: null,
      displayName: null,
      about: null,
      maritalStatus: null,
      moderatorRooms: [],
      canReviewPhotos: false,
    }),
}));
