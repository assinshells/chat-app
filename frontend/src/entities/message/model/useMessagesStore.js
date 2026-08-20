import { create } from "zustand";
import { fetchMessages } from "@entities/message/api/message.api.js";

/**
 * useMessagesStore — сообщения, кэшированные по roomId. Переключение
 * между вкладками Rooms не бьёт REST заново, если история для этой
 * комнаты уже загружена; новые сообщения приходят через Socket.IO
 * (см. widgets/chat-window/model/useChatSession.js) и добавляются в
 * тот же кэш через addMessage.
 */
export const useMessagesStore = create((set, get) => ({
  messagesByRoom: {},
  loadingRoomId: null,
  error: null,

  loadHistory: async (roomId) => {
    if (get().messagesByRoom[roomId]) return; // уже загружено
    set({ loadingRoomId: roomId, error: null });
    try {
      const messages = await fetchMessages(roomId);
      set((state) => {
        // Пока шёл REST-запрос истории, addMessage мог уже создать
        // запись для этой комнаты (сообщение по Socket.IO пришло
        // раньше ответа) — сливаем по id, чтобы не потерять и не
        // задублировать его.
        const arrived = state.messagesByRoom[roomId] ?? [];
        const arrivedIds = new Set(arrived.map((m) => m.id));
        const merged = [...messages.filter((m) => !arrivedIds.has(m.id)), ...arrived].sort(
          (a, b) => a.id - b.id,
        );
        return { messagesByRoom: { ...state.messagesByRoom, [roomId]: merged } };
      });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loadingRoomId: null });
    }
  },

  addMessage: (message) =>
    set((state) => {
      const existing = state.messagesByRoom[message.roomId] ?? [];
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messagesByRoom: {
          ...state.messagesByRoom,
          [message.roomId]: [...existing, message],
        },
      };
    }),

  reset: () => set({ messagesByRoom: {}, loadingRoomId: null, error: null }),
}));
