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
const MODERATION_KICKED = "moderation:kicked";
const MODERATION_BANNED = "moderation:banned";

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
 * розрізняє їх за полем message.type === 'system'.
 *
 * === Модерація (кік/бан) ===
 * roomBan — активний бан САМЕ на поточну activeRoom: composer має бути
 * заблокований (disabled), а НЕ мовчки перенаправляти кудись ще —
 * інакше повідомлення, набране до того, як користувач помітив
 * перемикання, "полетіло б" не туди, куди він думав.
 * confinement — активне кік-обмеження ("замкнено" в одній конкретній
 * кімнаті, зазвичай bespredel): на відміну від бану, тут користувача
 * ДІЙСНО переводить сервер (одразу зі знімком історії нової кімнати в
 * тій самій події) — бо кік має реальний ефект лише якщо повернутися
 * назад неможливо, а не просто "перекинули і одразу відпустили".
 * banInfo — активний ГЛОБАЛЬНИЙ бан, замінює весь чат на BannedScreen.
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

  // roomBan — бан САМЕ на activeRoom (не інші кімнати — про них ми
  // просто не знаємо, поки не спробуємо туди зайти). null означає
  // "у поточній кімнаті писати можна". Скидається при будь-якому
  // успішному вступі в кімнату (applySnapshot).
  const [roomBan, setRoomBan] = useState(null);
  const roomBanRef = useRef(null);

  // confinement — активне кік-обмеження: {confinedRoom, sourceRoom,
  // reason, expiresAt} або null. Поки воно активне, перехід у БУДЬ-ЯКУ
  // кімнату, окрім confinedRoom, безглуздий (сервер все одно відхилить) —
  // switchRoom перевіряє це заздалегідь, щоб не було зайвого "стрибка"
  // activeRoom туди-назад.
  const [confinement, setConfinement] = useState(null);
  const confinementRef = useRef(null);

  // banInfo — активний ГЛОБАЛЬНИЙ бан: або з'ясувалось одразу при
  // спробі підключення (connect_error), або прийшло живою подією, поки
  // сокет уже був підключений. Заміняє весь чат на BannedScreen (див.
  // ChatLayout).
  const [banInfo, setBanInfo] = useState(null);

  // joinError — явна відмова СЕРВЕРА на конкретний room:join, яка не є
  // ані room-баном (для нього є roomBan), ані кік-обмеженням (для
  // нього — confinement): наприклад, спроба перейти в невідому кімнату.
  const [joinError, setJoinError] = useState(null);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    roomBanRef.current = roomBan;
  }, [roomBan]);

  useEffect(() => {
    confinementRef.current = confinement;
  }, [confinement]);

  useEffect(() => {
    Storage.set(ROOM_KEY, activeRoom);
  }, [activeRoom]);

  // Автознімання roomBan/confinement по спливанню expiresAt — без
  // цього довелося б чекати на наступну спробу переходу в кімнату,
  // щоб клієнт "дізнався", що обмеження вже не діє.
  useEffect(() => {
    if (!roomBan?.expiresAt) return undefined;
    const delay = new Date(roomBan.expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      setRoomBan(null);
      return undefined;
    }
    const timer = setTimeout(() => setRoomBan(null), delay);
    return () => clearTimeout(timer);
  }, [roomBan]);

  useEffect(() => {
    if (!confinement?.expiresAt) return undefined;
    const delay = new Date(confinement.expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      setConfinement(null);
      return undefined;
    }
    const timer = setTimeout(() => setConfinement(null), delay);
    return () => clearTimeout(timer);
  }, [confinement]);

  /**
   * applyJoinOutcome — єдина точка обробки результату room:join, чи то
   * початкового (при connect), чи то ручного (switchRoom). Спільна
   * логіка потрібна, бо обидва місця мають однаково реагувати на
   * BANNED/CONFINED — інакше поведінка розійшлася б і хтось із них
   * знову почав би мовчки перекидати користувача в іншу кімнату.
   */
  const applyJoinOutcome = useCallback((target, result) => {
    if (result?.success) {
      setMessages(result.messages ?? []);
      setRoomUsers(result.users ?? []);
      setRoomCounts((prev) => ({ ...prev, [result.room]: result.count }));
      setJoinError(null);
      setRoomBan(null);
      setHistoryLoaded(true);
      return;
    }

    if (result?.code === "BANNED") {
      // Лишаємось на місці (target) — composer заблокується через
      // roomBan, а НЕ мовчки перенаправляємо кудись ще (див. docblock).
      setRoomBan({
        room: target,
        reason: result.details?.reason,
        expiresAt: result.details?.expiresAt,
      });
      setMessages([]);
      setRoomUsers([]);
      setHistoryLoaded(true);
      return;
    }

    if (result?.code === "CONFINED") {
      const confinedRoom = result.details?.confinedRoom;
      setConfinement({
        confinedRoom,
        reason: result.details?.reason,
        expiresAt: result.details?.expiresAt,
      });

      if (confinedRoom && confinedRoom !== target) {
        activeRoomRef.current = confinedRoom;
        setActiveRoom(confinedRoom);
        if (chatSocket.connected) {
          chatSocket.emit(ROOM_JOIN, { room: confinedRoom }, (r2) =>
            applyJoinOutcome(confinedRoom, r2),
          );
          return;
        }
      }
      setHistoryLoaded(true);
      return;
    }

    setJoinError({
      code: result?.code,
      message: result?.message,
      details: result?.details,
    });
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const applySnapshot = (snapshot) => {
      if (cancelled || !snapshot) return;
      setMessages(snapshot.messages ?? []);
      setRoomUsers(snapshot.users ?? []);
      setJoinError(null);
      setRoomBan(null);

      if (snapshot.room && typeof snapshot.count === "number") {
        setRoomCounts((prev) => ({ ...prev, [snapshot.room]: snapshot.count }));
      }
      setHistoryLoaded(true);
    };

    const handleConnect = () => {
      setConnected(true);
      // Успішний конект означає, що глобального бану зараз немає
      // (інакше сервер відхилив би на етапі socketAuthGuard) — знімаємо
      // застарілий banInfo, якщо він лишився з попереднього сеансу.
      setBanInfo(null);

      // При (пере)підключенні явно (пере)заходимо в поточну кімнату —
      // presence на сервері прив'язаний до socket.id, після реконекту
      // потрібен новий join. Якщо за час офлайну виник room-бан або
      // кік-обмеження саме на цю кімнату — applyJoinOutcome відреагує
      // так само, як і на ручне перемикання (заблокує композер або
      // перенаправить у confinedRoom).
      chatSocket.emit(ROOM_JOIN, { room: activeRoomRef.current }, (result) =>
        applyJoinOutcome(activeRoomRef.current, result),
      );
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

    // Кік: сервер уже переніс усі сокети жертви в confinedRoom і додав
    // готовий знімок (історія+учасники) прямо в payload — окремий
    // room:join не потрібен, інакше був би проміжок, коли UI ще
    // показує стару кімнату, хоча сервер із неї вже вигнав.
    const handleKicked = (payload) => {
      setConfinement({
        confinedRoom: payload.confinedRoom,
        sourceRoom: payload.sourceRoom,
        reason: payload.reason,
        expiresAt: payload.expiresAt,
      });
      activeRoomRef.current = payload.confinedRoom;
      setActiveRoom(payload.confinedRoom);
      applySnapshot(payload.snapshot);
    };

    // Бан, застосований, поки сокет уже онлайн. scope='global' —
    // з'єднання буде розірвано сервером за мить (forceDisconnectUser),
    // тому тут лише виставляємо banInfo — сам disconnect прийде окремою
    // подією і НЕ спричинить авто-реконект (Socket.IO навмисно не
    // перепідключає після "io server disconnect"). scope='room' — НЕ
    // перемикаємо кімнату (див. docblock вище): якщо це саме та
    // кімната, яку користувач зараз бачить, просто блокуємо composer.
    const handleBanned = (payload) => {
      if (payload.scope === "global") {
        setBanInfo({ reason: payload.reason, expiresAt: payload.expiresAt });
        return;
      }

      if (payload.room === activeRoomRef.current) {
        setRoomBan({
          room: payload.room,
          reason: payload.reason,
          expiresAt: payload.expiresAt,
        });
      }
    };

    // connect_error з БЕКЕНДА (не мережева помилка) — глобальний бан
    // діяв УЖЕ ДО спроби підключення (див. guards/socketAuth.guard.js).
    // err.data — {reason, expiresAt}, покладені сервером у Error.
    const handleConnectError = (err) => {
      if (err?.message === "BANNED") {
        setBanInfo({ reason: err.data?.reason, expiresAt: err.data?.expiresAt });
      }
    };

    chatSocket.on("connect", handleConnect);
    chatSocket.on("disconnect", handleDisconnect);
    chatSocket.on("connect_error", handleConnectError);
    chatSocket.on(MESSAGE_NEW, handleMessageNew);
    chatSocket.on(SYSTEM_EVENT, handleSystemEvent);
    chatSocket.on(ROOM_USERS, handleRoomUsers);
    chatSocket.on(ROOMS_STATE, handleRoomsState);
    chatSocket.on(MODERATION_KICKED, handleKicked);
    chatSocket.on(MODERATION_BANNED, handleBanned);

    chatSocket.connect();

    return () => {
      cancelled = true;
      chatSocket.off("connect", handleConnect);
      chatSocket.off("disconnect", handleDisconnect);
      chatSocket.off("connect_error", handleConnectError);
      chatSocket.off(MESSAGE_NEW, handleMessageNew);
      chatSocket.off(SYSTEM_EVENT, handleSystemEvent);
      chatSocket.off(ROOM_USERS, handleRoomUsers);
      chatSocket.off(ROOMS_STATE, handleRoomsState);
      chatSocket.off(MODERATION_KICKED, handleKicked);
      chatSocket.off(MODERATION_BANNED, handleBanned);
      chatSocket.disconnect();
    };
  }, [enabled, applyJoinOutcome]);

  /**
   * switchRoom — перемикає активну кімнату. Якщо активне
   * кік-обмеження і цільова кімната — не confinedRoom, узагалі не
   * чіпаємо мережу й activeRoom: результат все одно був би
   * відхилений сервером, а так користувач одразу бачить причину без
   * зайвого "стрибка" інтерфейсу туди й назад.
   */
  const switchRoom = useCallback(
    (room) => {
      if (!room || room === activeRoomRef.current) return;

      const activeConfinement = confinementRef.current;
      if (
        activeConfinement &&
        activeConfinement.confinedRoom !== room &&
        (!activeConfinement.expiresAt || new Date(activeConfinement.expiresAt) > new Date())
      ) {
        setJoinError({
          code: "CONFINED",
          message: "Ви тимчасово обмежені однією кімнатою",
          details: activeConfinement,
        });
        return;
      }

      activeRoomRef.current = room;
      setActiveRoom(room);
      setMessages([]);
      setRoomUsers([]);
      setHistoryLoaded(false);
      setJoinError(null);
      setRoomBan(null);

      if (!chatSocket.connected) return;

      chatSocket.emit(ROOM_JOIN, { room }, (result) => {
        // Користувач міг встигнути перемкнутися на іншу кімнату, поки
        // йшов цей запит — застосовуємо відповідь лише якщо вона все
        // ще стосується кімнати, яка активна прямо зараз.
        if (result?.success && result.room !== activeRoomRef.current) {
          setHistoryLoaded(true);
          return;
        }
        applyJoinOutcome(room, result);
      });
    },
    [applyJoinOutcome],
  );

  const { remainingMs: cooldownMs, startCooldown } = useMessageCooldown();

  const sendMessage = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!chatSocket.connected) {
        reject(new Error("Немає з'єднання з сервером"));
        return;
      }

      if (roomBanRef.current?.room === activeRoomRef.current) {
        reject(new Error("Вас заблоковано в цій кімнаті"));
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

          if (result?.code === "BANNED") {
            setRoomBan({
              room: activeRoomRef.current,
              reason: result.details?.reason,
              expiresAt: result.details?.expiresAt,
            });
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

  const isComposerDisabled = Boolean(roomBan?.room === activeRoom);

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
    roomBan: isComposerDisabled ? roomBan : null,
    confinement,
    banInfo,
    joinError,
    dismissJoinError: useCallback(() => setJoinError(null), []),
  };
}
