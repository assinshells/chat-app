import { useEffect } from "react";
import { SocketClient } from "@shared/lib/socket.js";
import { useMessagesStore } from "@entities/message";
import { SOCKET_EVENTS } from "@shared/constants/socket.constants.js";

/**
 * useChatSession — держит Socket.IO подписанным на активную комнату:
 * подключает сокет, join при монтировании/смене roomId, leave при
 * размонтировании/смене, подписка на message:new пишет входящие
 * сообщения в useMessagesStore. Эффект зависит только от roomId, так
 * что один слушатель на комнату — не по одному на каждый ре-рендер.
 */
export function useChatSession(roomId) {
  const addMessage = useMessagesStore((s) => s.addMessage);
  const loadHistory = useMessagesStore((s) => s.loadHistory);

  useEffect(() => {
    if (!roomId) return undefined;

    const socket = SocketClient.connect();
    loadHistory(roomId);
    socket.emit(SOCKET_EVENTS.ROOM_JOIN, roomId);

    const handleNewMessage = (message) => {
      if (message.roomId === roomId) addMessage(message);
    };
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE, roomId);
    };
  }, [roomId, addMessage, loadHistory]);

  const sendMessage = (content) => {
    const trimmed = content.trim();
    if (!roomId || !trimmed) return;
    SocketClient.get().emit(SOCKET_EVENTS.MESSAGE_SEND, { roomId, content: trimmed });
  };

  return { sendMessage };
}
