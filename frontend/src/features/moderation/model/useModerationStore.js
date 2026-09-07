import { create } from "zustand";
import {
  kickRequest,
  kickChatRequest,
  banRequest,
  banRoomRequest,
  unbanRequest,
  releaseConfinementRequest,
  listActiveBansRequest,
} from "@features/moderation/api/moderation.api.js";
import { DEFAULT_MODERATOR_DURATION_MS } from "@shared/constants/moderationAction.constants.js";

/**
 * useModerationStore — стан двох модалок кіку й бану (KickModal,
 * BanModal — обидві рендеряться один раз у ChatLayout, як і
 * useRolesStore/useDmStore). openFor(login, color, room) відкриває
 * будь-яку з них і одразу підвантажує активні бани (тепер може бути
 * КІЛЬКА рядків — "бан кімнати" банить одразу в усіх кімнатах, де
 * актор модерує) і поточне кік-обмеження ("в беспредел").
 *
 * Чотири незалежні дії:
 *  - kickToBespredel — замкнення в bespredel (без переходів по кімнатах);
 *  - kickFromChat — тимчасове повне вилучення з чату;
 *  - banRoom — бан у ВСІХ кімнатах актора + перенесення в bespredel
 *    (звідти можна переходити куди завгодно, окрім забанених кімнат);
 *  - banChat — постійний/тривалий бан усього чату (може бути "назавжди").
 *
 * *Ms-поля (kickBespredelMs/kickChatMs/banRoomMs/banChatMs) —
 * ВИКЛЮЧНО для адмінів/суперадмінів (див. canSetCustomDuration):
 * модератор кнопки викликає без жодного поля вводу, і сервіс на
 * бекенді все одно форсує дефолт 10 хв незалежно від того, що прийшло
 * б у тілі запиту.
 */
export const useModerationStore = create((set, get) => ({
  targetLogin: null,
  targetColor: undefined,
  room: null, // кімната, з меню якої відкрили модалку (потрібна лише для kickToBespredel)

  activeBans: [],
  confinement: null, // {confinedRoom, sourceRoom, reason, expiresAt} | null
  loadingStatus: false,

  reason: "",

  kickBespredelMs: DEFAULT_MODERATOR_DURATION_MS,
  kickChatMs: DEFAULT_MODERATOR_DURATION_MS,
  banRoomMs: DEFAULT_MODERATOR_DURATION_MS,
  banChatMs: DEFAULT_MODERATOR_DURATION_MS,
  banRoomPermanent: false,
  banChatPermanent: false,

  kickingBespredel: false,
  kickingChat: false,
  banningRoom: false,
  banningChat: false,
  unbanningId: null,
  releasing: false,
  error: null,
  success: null,

  openFor: async (login, color, room) => {
    set({
      targetLogin: login,
      targetColor: color,
      room,
      loadingStatus: true,
      kickingBespredel: false,
      kickingChat: false,
      banningRoom: false,
      banningChat: false,
      unbanningId: null,
      releasing: false,
      error: null,
      success: null,
      reason: "",
      kickBespredelMs: DEFAULT_MODERATOR_DURATION_MS,
      kickChatMs: DEFAULT_MODERATOR_DURATION_MS,
      banRoomMs: DEFAULT_MODERATOR_DURATION_MS,
      banChatMs: DEFAULT_MODERATOR_DURATION_MS,
      banRoomPermanent: false,
      banChatPermanent: false,
    });

    try {
      const { bans, confinement } = await listActiveBansRequest(login);
      if (get().targetLogin !== login) return;
      set({ loadingStatus: false, activeBans: bans ?? [], confinement: confinement ?? null });
    } catch (err) {
      if (get().targetLogin !== login) return;
      set({
        loadingStatus: false,
        error: err.message || "Не вдалося отримати статус користувача",
      });
    }
  },

  setReason: (reason) => set({ reason, error: null, success: null }),
  setKickBespredelMs: (ms) => set({ kickBespredelMs: ms }),
  setKickChatMs: (ms) => set({ kickChatMs: ms }),
  setBanRoomMs: (ms) => set({ banRoomMs: ms }),
  setBanChatMs: (ms) => set({ banChatMs: ms }),
  setBanRoomPermanent: (permanent) => set({ banRoomPermanent: permanent }),
  setBanChatPermanent: (permanent) => set({ banChatPermanent: permanent }),
  clearStatus: () => set({ error: null, success: null }),

  /** kickToBespredel — "Кикнути" > "В беспредел". */
  kickToBespredel: async (customDurationMs) => {
    const { targetLogin, room, kickBespredelMs, reason, kickingBespredel } = get();
    if (!targetLogin || !room || kickingBespredel) return;

    set({ kickingBespredel: true, error: null, success: null });
    try {
      const result = await kickRequest({
        login: targetLogin,
        room,
        durationMs: customDurationMs ?? kickBespredelMs,
        reason: reason || undefined,
      });
      set({
        kickingBespredel: false,
        success: "Користувача переведено в «Бєспрєдєл»",
        confinement: {
          confinedRoom: result.confinedRoom,
          sourceRoom: result.room,
          reason: reason || null,
          expiresAt: result.expiresAt,
        },
      });
    } catch (err) {
      set({ kickingBespredel: false, error: err.message || "Не вдалося кикнути користувача" });
    }
  },

  /** kickFromChat — "Кикнути" > "Із чату". */
  kickFromChat: async (customDurationMs) => {
    const { targetLogin, kickChatMs, reason, kickingChat } = get();
    if (!targetLogin || kickingChat) return;

    set({ kickingChat: true, error: null, success: null });
    try {
      await kickChatRequest({
        login: targetLogin,
        durationMs: customDurationMs ?? kickChatMs,
        reason: reason || undefined,
      });
      set({ kickingChat: false, success: "Користувача тимчасово вилучено з чату" });
    } catch (err) {
      set({ kickingChat: false, error: err.message || "Не вдалося кикнути користувача з чату" });
    }
  },

  /** banRoom — "Бан" > "Бан кімнати". */
  banRoom: async (customDurationMs) => {
    const { targetLogin, banRoomMs, banRoomPermanent, reason, banningRoom } = get();
    if (!targetLogin || banningRoom) return;

    const durationMs = banRoomPermanent ? null : customDurationMs ?? banRoomMs;

    set({ banningRoom: true, error: null, success: null });
    try {
      const result = await banRoomRequest({
        login: targetLogin,
        durationMs,
        reason: reason || undefined,
      });
      set((state) => ({
        banningRoom: false,
        success: `Користувача забанено у кімнатах: ${result.rooms.join(", ")}`,
        activeBans: [
          ...result.rooms.map((room, i) => ({
            id: result.banIds?.[i],
            room,
            scope: "room",
            reason: reason || null,
            expiresAt: result.expiresAt,
          })),
          ...state.activeBans,
        ],
      }));
    } catch (err) {
      set({ banningRoom: false, error: err.message || "Не вдалося забанити кімнати" });
    }
  },

  /** banChat — "Бан" > "Бан чату". */
  banChat: async (customDurationMs) => {
    const { targetLogin, banChatMs, banChatPermanent, reason, banningChat } = get();
    if (!targetLogin || banningChat) return;

    const durationMs = banChatPermanent ? null : customDurationMs ?? banChatMs;

    set({ banningChat: true, error: null, success: null });
    try {
      const result = await banRequest({
        login: targetLogin,
        scope: "global",
        durationMs,
        reason: reason || undefined,
      });
      set((state) => ({
        banningChat: false,
        success: "Бан чату видано",
        activeBans: [
          {
            id: result.id,
            room: result.room,
            scope: result.scope,
            reason: result.reason,
            expiresAt: result.expiresAt,
          },
          ...state.activeBans,
        ],
      }));
    } catch (err) {
      set({ banningChat: false, error: err.message || "Не вдалося забанити чат" });
    }
  },

  unban: async (banId) => {
    if (get().unbanningId) return;

    set({ unbanningId: banId, error: null, success: null });
    try {
      await unbanRequest(banId);
      set((state) => ({
        unbanningId: null,
        success: "Бан знято",
        activeBans: state.activeBans.filter((b) => b.id !== banId),
      }));
    } catch (err) {
      set({ unbanningId: null, error: err.message || "Не вдалося зняти бан" });
    }
  },

  releaseConfinement: async () => {
    const { targetLogin, releasing } = get();
    if (!targetLogin || releasing) return;

    set({ releasing: true, error: null, success: null });
    try {
      await releaseConfinementRequest(targetLogin);
      set({ releasing: false, success: "Обмеження знято", confinement: null });
    } catch (err) {
      set({ releasing: false, error: err.message || "Не вдалося зняти обмеження" });
    }
  },
}));
