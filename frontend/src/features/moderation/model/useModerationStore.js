import { create } from "zustand";
import {
  kickRequest,
  banRequest,
  unbanRequest,
  listActiveBansRequest,
} from "@features/moderation/api/moderation.api.js";
import { BAN_DURATION_PRESETS } from "@shared/constants/moderationAction.constants.js";

/**
 * useModerationStore — стан єдиної на застосунок модалки кіку/бану
 * (ModerationModal, рендериться один раз у ChatLayout — та сама схема,
 * що й useRolesStore/useDmStore: openFor(login, color, room) виставляє
 * ціль і кімнату, з якої відкрили меню, і одразу підвантажує активні
 * бани цієї людини, щоб показати список і кнопки "Зняти".
 */
export const useModerationStore = create((set, get) => ({
  targetLogin: null,
  targetColor: undefined,
  room: null, // кімната, з меню якої відкрили модалку — контекст для кіку і room-бану

  activeBans: [],
  loadingBans: false,

  banScope: "room", // "room" | "global"
  durationPreset: BAN_DURATION_PRESETS[0].value,
  reason: "",

  kicking: false,
  banning: false,
  unbanningId: null,
  error: null,
  success: null,

  openFor: async (login, color, room) => {
    set({
      targetLogin: login,
      targetColor: color,
      room,
      loadingBans: true,
      kicking: false,
      banning: false,
      unbanningId: null,
      error: null,
      success: null,
      banScope: "room",
      durationPreset: BAN_DURATION_PRESETS[0].value,
      reason: "",
    });

    try {
      const { bans } = await listActiveBansRequest(login);
      if (get().targetLogin !== login) return;
      set({ loadingBans: false, activeBans: bans ?? [] });
    } catch (err) {
      if (get().targetLogin !== login) return;
      set({
        loadingBans: false,
        error: err.message || "Не вдалося отримати список банів",
      });
    }
  },

  setBanScope: (scope) => set({ banScope: scope, error: null, success: null }),
  setDurationPreset: (preset) => set({ durationPreset: preset, error: null, success: null }),
  setReason: (reason) => set({ reason, error: null, success: null }),
  clearStatus: () => set({ error: null, success: null }),

  kick: async () => {
    const { targetLogin, room, reason, kicking } = get();
    if (!targetLogin || !room || kicking) return;

    set({ kicking: true, error: null, success: null });
    try {
      await kickRequest({ login: targetLogin, room, reason: reason || undefined });
      set({ kicking: false, success: "Користувача кикнуто з кімнати" });
    } catch (err) {
      set({ kicking: false, error: err.message || "Не вдалося кикнути користувача" });
    }
  },

  ban: async () => {
    const { targetLogin, room, banScope, durationPreset, reason, banning } = get();
    if (!targetLogin || banning) return;

    const preset = BAN_DURATION_PRESETS.find((p) => p.value === durationPreset);
    const durationMs = preset?.ms ?? null;

    set({ banning: true, error: null, success: null });
    try {
      const result = await banRequest({
        login: targetLogin,
        scope: banScope,
        room: banScope === "room" ? room : undefined,
        durationMs,
        reason: reason || undefined,
      });
      set((state) => ({
        banning: false,
        success: "Бан видано",
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
      set({ banning: false, error: err.message || "Не вдалося видати бан" });
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
}));
