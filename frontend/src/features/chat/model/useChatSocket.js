import { useCallback, useEffect, useRef, useState } from "react";
import { chatSocket } from "@shared/api/socket.js";
import { DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";

const MESSAGE_NEW = "message:new";
const MESSAGE_SEND = "message:send";
const ROOM_JOIN = "room:join";
const ROOM_USERS = "room:users";
const ROOMS_STATE = "rooms:state";
const SYSTEM_EVENT = "system:event";

/**
 * useChatSocket — держит живое Socket.IO-соединение и текущую активную
 * комнату. История сообщений и список онлайн-пользователей комнаты
 * приходят не через отдельный REST-запрос, а прямо в ack на room:join —
 * сервер всё равно должен обработать join через сокет (чтобы посчитать
 * presence), так что отдавать снапшот в том же round-trip дешевле, чем
 * дублировать его отдельным HTTP-запросом.
 *
 * roomCounts — счётчики участников по ВСЕМ комнатам (обновляются живьём
 * через rooms:state), нужны для списка комнат в сайдбаре, даже для тех,
 * в которых пользователь сейчас не находится.
 * roomUsers — участники ТОЛЬКО активной комнаты (с гендером), нужны для
 * вкладки "Користувачі" в сайдбаре.
 *
 * Системные сообщения (вхід/перехід/вихід, event: 'join'|'switch'|'leave')
 * приходят отдельным глобальным событием (system:event, см. backend) и
 * подмешиваются в тот же массив messages, что и обычные сообщения чата —
 * ChatConversation различает их по полю message.type === 'system'.
 */
export function useChatSocket({ enabled, initialRoom }) {
  const startRoom = initialRoom || DEFAULT_ROOM;
  const [activeRoom, setActiveRoom] = useState(startRoom);
  const activeRoomRef = useRef(startRoom);

  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(chatSocket.connected);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [roomCounts, setRoomCounts] = useState({});
  const [roomUsers, setRoomUsers] = useState([]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const applySnapshot = (snapshot) => {
      if (cancelled || !snapshot) return;

      setMessages(snapshot.messages ?? []);
      setRoomUsers(snapshot.users ?? []);

      if (snapshot.room && typeof snapshot.count === "number") {
        setRoomCounts((prev) => ({ ...prev, [snapshot.room]: snapshot.count }));
      }

      setHistoryLoaded(true);
    };

    const handleConnect = () => {
      setConnected(true);

      // При (пере)подключении явно (пере)заходим в текущую комнату —
      // presence на сервере привязан к socket.id, после реконнекта нужен
      // новый join, чтобы нас снова посчитали "онлайн", плюс это даёт
      // свежую историю сообщений на случай, если она успела измениться.
      chatSocket.emit(ROOM_JOIN, { room: activeRoomRef.current }, (result) => {
        if (result?.success) applySnapshot(result);
      });
    };

    const handleDisconnect = () => setConnected(false);

    const handleMessageNew = (message) => {
      // Сообщение приходит только тем, кто состоит в Socket.IO room этой
      // комнаты (io.to(room).emit на бэкенде) — на клиенте достаточно
      // просто добавить его, доп. фильтрация по room не нужна.
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    // Системные сообщения (вхід/перехід/вихід) приходят ГЛОБАЛЬНО, всем
    // подключённым сокетам, независимо от активной комнаты (см. backend
    // sockets/chat.socket.js: io.emit, а не io.to(room).emit) — поэтому,
    // в отличие от handleMessageNew, здесь нет и не нужно проверки "моя
    // ли это комната": подмешиваем в ленту текущей открытой комнаты как
    // живую строку активности, чтобы название чужой комнаты в ней можно
    // было кликнуть и перейти туда даже не находясь в ней сейчас.
    const handleSystemEvent = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const handleRoomUsers = (payload) => {
      setRoomCounts((prev) => ({ ...prev, [payload.room]: payload.count }));

      if (payload.room === activeRoomRef.current) {
        setRoomUsers(payload.users ?? []);
      }
    };

    const handleRoomsState = (counts) => {
      setRoomCounts((prev) => ({ ...prev, ...counts }));
    };

    chatSocket.on("connect", handleConnect);
    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on(MESSAGE_NEW, handleMessageNew);
    chatSocket.on(SYSTEM_EVENT, handleSystemEvent);
    chatSocket.on(ROOM_USERS, handleRoomUsers);
    chatSocket.on(ROOMS_STATE, handleRoomsState);

    chatSocket.connect();

    return () => {
      cancelled = true;
      chatSocket.off("connect", handleConnect);
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off(MESSAGE_NEW, handleMessageNew);
      chatSocket.off(SYSTEM_EVENT, handleSystemEvent);
      chatSocket.off(ROOM_USERS, handleRoomUsers);
      chatSocket.off(ROOMS_STATE, handleRoomsState);
      chatSocket.disconnect();
    };
  }, [enabled]);

  /**
   * switchRoom — переключает активную комнату: сразу обновляет UI-стейт
   * (без ожидания сети — плавнее для пользователя), затем просит сервер
   * перевести сокет в новую Socket.IO room и подтягивает актуальный
   * снапшот (историю + участников) из ack.
   */
  const switchRoom = useCallback((room) => {
    if (!room || room === activeRoomRef.current) return;

    activeRoomRef.current = room;
    setActiveRoom(room);
    setMessages([]);
    setRoomUsers([]);
    setHistoryLoaded(false);

    if (!chatSocket.connected) return;

    chatSocket.emit(ROOM_JOIN, { room }, (result) => {
      // Пользователь мог успеть переключиться на другую комнату, пока
      // шёл этот запрос — применяем ответ, только если он всё ещё
      // относится к комнате, которая активна прямо сейчас.
      if (result?.success && result.room === activeRoomRef.current) {
        setMessages(result.messages ?? []);
        setRoomUsers(result.users ?? []);
        setRoomCounts((prev) => ({ ...prev, [result.room]: result.count }));
      }
      setHistoryLoaded(true);
    });
  }, []);

  const sendMessage = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!chatSocket.connected) {
        reject(new Error("No connection to server"));
        return;
      }

      chatSocket.emit(
        MESSAGE_SEND,
        { text, room: activeRoomRef.current },
        (result) => {
          if (result?.success) {
            resolve();
          } else {
            reject(new Error(result?.message || "Failed to send message"));
          }
        },
      );
    });
  }, []);

  return {
    activeRoom,
    switchRoom,
    messages,
    connected,
    historyLoaded,
    roomCounts,
    roomUsers,
    sendMessage,
  };
}