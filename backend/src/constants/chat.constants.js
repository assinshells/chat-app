export const CHAT_ERRORS = Object.freeze({
  MESSAGE_EMPTY: "Message text is empty",
  MESSAGE_TOO_LONG: "Message text is too long",

  // Автомодератор (см. moderation/moderation.service.js). Тексты здесь
  // используются как fallback для логов/непредвиденных клиентов —
  // основной пользовательский текст подбирается на фронте по коду
  // ошибки (см. shared/lib/moderationMessages.js), не по этой строке.
  PROFANITY: "Message contains prohibited language",
  CAPS_LOCK: "Please don't use excessive capital letters",
  SPAM: Object.freeze({
    duplicate: "Please don't repeat the same message",
    links: "Message looks like link spam",
  }),
  MUTED: "You are temporarily muted for repeated violations",
});

export const CHAT_LIMITS = Object.freeze({
  MAX_MESSAGE_LENGTH: 2000,
  HISTORY_DEFAULT_LIMIT: 50,
  HISTORY_MAX_LIMIT: 200,
});

// Личные сообщения (DM) — отдельные ошибки/лимиты от публичного чата,
// хотя сейчас совпадают по значениям: это разные сущности (см.
// private_messages в init.sql), и лимиты вполне могут разойтись в
// будущем (например, более строгий рейт-лимит для личики).
export const DM_ERRORS = Object.freeze({
  MESSAGE_EMPTY: "Message text is empty",
  MESSAGE_TOO_LONG: "Message text is too long",
  RECIPIENT_NOT_FOUND: "Recipient not found",
  CANNOT_MESSAGE_SELF: "Cannot send a private message to yourself",
});

export const DM_LIMITS = Object.freeze({
  MAX_MESSAGE_LENGTH: 2000,
  HISTORY_DEFAULT_LIMIT: 50,
  HISTORY_MAX_LIMIT: 200,
});

/**
 * dmChannel — имя персонального Socket.IO room пользователя, куда он
 * автоматически вступает при коннекте (см. sockets/dm.socket.js) и не
 * покидает его независимо от того, в какой публичной комнате чата
 * находится сейчас — это отдельный, постоянно открытый канал доставки
 * личных сообщений, не связанный с ROOM_JOIN/currentRoom.
 */
export const dmChannel = (userId) => `dm:${userId}`;

// Список комнат чата. id хранится в messages.room и используется как имя
// Socket.IO room + ключ в presence-реестре (см. sockets/presence.js) —
// поэтому id уже существующих комнат менять нельзя, это ключ в БД.
// "general" — комната по умолчанию, совпадает с DEFAULT в схеме
// messages.room, поэтому у неё уже есть исторические сообщения.
export const ROOMS = Object.freeze([
  { id: "general", name: "Головна" },
  { id: "dating", name: "Знайомства" },
  { id: "sex", name: "Секс" },
  { id: "lgbt", name: "ЛГБТ" },
  { id: "bespredel", name: "Бєспрєдєл" },
  { id: "kyiv", name: "Київ" },
  { id: "vinnytsia", name: "Вінниця" },
  { id: "dnipro", name: "Дніпро" },
  { id: "donetsk", name: "Донецьк" },
  { id: "zhytomyr", name: "Житомир" },
  { id: "zaporizhzhia", name: "Запоріжжя" },
  { id: "if", name: "Ів-Франківськ" },
  { id: "kropyvnytskyi", name: "Кропивницький" },
  { id: "crimea", name: "Крим" },
  { id: "luhansk", name: "Луганськ" },
  { id: "lutsk", name: "Луцьк" },
  { id: "lviv", name: "Львів" },
  { id: "mykolaiv", name: "Миколаїв" },
  { id: "odesa", name: "Одеса" },
  { id: "poltava", name: "Полтава" },
  { id: "rivne", name: "Рівне" },
  { id: "sumy", name: "Суми" },
  { id: "ternopil", name: "Тернопіль" },
  { id: "uzhhorod", name: "Ужгород" },
  { id: "kharkiv", name: "Харків" },
  { id: "kherson", name: "Херсон" },
  { id: "khmelnytskyi", name: "Хмельницький" },
  { id: "cherkasy", name: "Черкаси" },
  { id: "chernivtsi", name: "Чернівці" },
  { id: "chernihiv", name: "Чернігів" },
]);

export const ROOM_IDS = Object.freeze(ROOMS.map((room) => room.id));

export const DEFAULT_ROOM = "general";

export const isValidRoom = (room) => ROOM_IDS.includes(room);

export const SOCKET_EVENTS = Object.freeze({
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_ERROR: "message:error",
  // Клиент явно запрашивает вступление в комнату (в т.ч. сразу после
  // коннекта — комната по умолчанию не назначается автоматически).
  ROOM_JOIN: "room:join",
  // Рассылается всем в конкретной room при изменении её состава —
  // актуальный список участников (с гендером) и их количество.
  ROOM_USERS: "room:users",
  // Рассылается всем подключённым сокетам при изменении счётчика
  // участников ЛЮБОЙ комнаты — используется для списка комнат в сайдбаре,
  // чтобы счётчики были живыми даже для комнат, в которых пользователь
  // сейчас не находится.
  ROOMS_STATE: "rooms:state",
  // Уведомление о входе/переходе/выходе пользователя — см.
  // broadcastSystemEvent в sockets/chat.socket.js. В отличие от
  // ROOMS_STATE, рассылается НЕ всем подключённым, а только участникам
  // конкретной room (io.to(room).emit): "Добро пожаловать" видят только
  // те, кто сейчас в комнате, куда вошли; "переходит в комнату X" —
  // только те, кто остался в СТАРОЙ комнате (откуда пользователь ушёл).
  SYSTEM_EVENT: "system:event",

  // Особисті повідомлення (DM) — окремий канал доставки, не пов'язаний
  // з ROOM_JOIN/currentRoom, див. dmChannel вище і sockets/dm.socket.js.
  DM_OPEN: "dm:open",
  DM_LIST: "dm:list",
  DM_SEND: "dm:send",
  DM_NEW: "dm:new",
  DM_ERROR: "dm:error",
});