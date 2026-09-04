import { useCallback, useEffect, useRef, useState } from "react";
import { chatSocket } from "@shared/api/socket.js";
import { DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";
import { registerSend } from "@features/chat/model/messageRateLimiter.js";
import { useMessageCooldown } from "@features/chat/model/useMessageCooldown.js";
import { Storage } from "@shared/lib/storage.js";

const MESSAGE_NEW = "message:new";
const MESSAGE_SEND = "message:send";
const ROOM_KEY = "userRoom";
const ROOM_JOIN = "room:join";
const ROOM_USERS = "room:users";
const ROOMS_STATE = "rooms:state";
const SYSTEM_EVENT = "system:event";

/**
 * useChatSocket — тримає живе Socket.IO-з'єднання і поточну активну
 * кімнату. Історія повідомлень і список онлайн-користувачів кімнати
 * приходять не через окремий REST-запит, а прямо в ack на room:join —
 * сервер все одно повинен обробити join через сокет (щоб порахувати
 * presence), тож віддавати знімок у тому самому round-trip дешевше, ніж
 * дублювати його окремим HTTP-запитом.
 *
 * roomCounts — лічильники учасників по УСІХ кімнатах (оновлюються
 * наживо через rooms:state), потрібні для списку кімнат у сайдбарі,
 * навіть для тих, в яких користувач зараз не перебуває.
 * roomUsers — учасники ЛИШЕ активної кімнати (зі статтю), потрібні для
 * вкладки "Користувачі" в сайдбарі.
 *
 * Системні повідомлення (event: 'join'|'switch'|'leave') приходять як
 * окрема подія (system:event, див. backend) і підмішуються в той самий
 * масив messages, що й звичайні повідомлення чату — ChatConversation
 * розрізняє їх за полем message.type === 'system'. На відміну від
 * звичайних повідомлень це НЕ глобальна розсилка: сервер надсилає їх
 * лише учасникам конкретної Socket.IO room (io.to(room).emit) —
 * "Ласкаво просимо" бачать лише ті, хто зараз у кімнаті, куди хтось
 * увійшов; "переходить у кімнату X" — лише ті, хто залишився в
 * СТАРІЙ кімнаті.
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
    Storage.set(ROOM_KEY, activeRoom);
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

      // При (пере)підключенні явно (пере)заходимо в поточну кімнату —
      // presence на сервері прив'язаний до socket.id, після реконекту
      // потрібен новий join, щоб нас знову порахували "онлайн", плюс
      // це дає свіжу історію повідомлень на випадок, якщо вона встигла змінитися.
      chatSocket.emit(ROOM_JOIN, { room: activeRoomRef.current }, (result) => {
        if (result?.success) applySnapshot(result);
      });
    };

    const handleDisconnect = () => setConnected(false);

    const handleMessageNew = (message) => {
      // Повідомлення приходить лише тим, хто перебуває в Socket.IO room
      // цієї кімнати (io.to(room).emit на бекенді) — на клієнті достатньо
      // просто додати його, дод. фільтрація за room не потрібна.
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    // Системні повідомлення (вхід/перехід/вихід) приходять так само, як
    // message:new — лише учасникам конкретної Socket.IO room
    // (io.to(room).emit на бекенді, див. sockets/chat.socket.js), тому
    // дод. фільтрація за room не потрібна: якщо ця подія дійшла до нас,
    // значить вона про нашу поточну кімнату.
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
   * switchRoom — перемикає активну кімнату: одразу оновлює UI-стан
   * (без очікування мережі — плавніше для користувача), потім просить
   * сервер перевести сокет у нову Socket.IO room і підтягує актуальний
   * знімок (історію + учасників) з ack.
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
      // Користувач міг встигнути перемкнутися на іншу кімнату, поки
      // йшов цей запит — застосовуємо відповідь лише якщо вона все ще
      // стосується кімнати, яка активна прямо зараз.
      if (result?.success && result.room === activeRoomRef.current) {
        setMessages(result.messages ?? []);
        setRoomUsers(result.users ?? []);
        setRoomCounts((prev) => ({ ...prev, [result.room]: result.count }));
      }
      setHistoryLoaded(true);
    });
  }, []);

  const { remainingMs: cooldownMs, startCooldown } = useMessageCooldown();

  const sendMessage = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!chatSocket.connected) {
        reject(new Error("Немає з'єднання з сервером"));
        return;
      }

      // Локальний rate-limit ДО походу на сервер (дзеркалить серверний
      // ліміт, див. messageRateLimiter.js): якщо користувач уже
      // вичерпав вікно, сервер все одно відхилить запит — немає сенсу
      // витрачати round-trip, і користувач миттєво бачить причину і
      // зворотний відлік, а не мовчазне "повідомлення не пішло".
      const localRetryAfterMs = registerSend();
      if (localRetryAfterMs) {
        startCooldown(localRetryAfterMs);
        const err = new Error("Забагато повідомлень");
        err.code = "RATE_LIMITED";
        err.details = { retryAfterMs: localRetryAfterMs };
        reject(err);
        return;
      }

      chatSocket.emit(
        MESSAGE_SEND,
        { text, room: activeRoomRef.current },
        (result) => {
          if (result?.success) {
            resolve();
            return;
          }

          // RATE_LIMITED/MUTED від сервера — джерело істини по факту
          // (локальний лімітер міг розійтися: кілька вкладок,
          // реконект після сну ноутбука, реальний мут автомодератора,
          // про який локальний лічильник взагалі не знає). Кулдаун
          // синхронізується з реальним retryAfterMs від сервера.
          if (result?.details?.retryAfterMs) {
            startCooldown(result.details.retryAfterMs);
          }

          const err = new Error(result?.message || "Не вдалося надіслати повідомлення");
          err.code = result?.code;
          err.details = result?.details;
          reject(err);
        },
      );
    });
  }, [startCooldown]);

  return {
    activeRoom,
    switchRoom,
    messages,
    connected,
    historyLoaded,
    roomCounts,
    roomUsers,
    sendMessage,
    cooldownMs,
  };
}
