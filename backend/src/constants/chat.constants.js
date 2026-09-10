export const CHAT_ERRORS = Object.freeze({
  MESSAGE_EMPTY: "Текст повідомлення порожній",
  MESSAGE_TOO_LONG: "Текст повідомлення занадто довгий",

  // Автомодератор (див. moderation/moderation.service.js). Тексти тут
  // використовуються як fallback для логів/непередбачених клієнтів —
  // основний текст для користувача підбирається на фронті за кодом
  // помилки (див. shared/lib/moderationMessages.js), а не за цим рядком.
  PROFANITY: "Повідомлення містить заборонену лексику",
  CAPS_LOCK: "Будь ласка, не використовуйте забагато великих літер",
  SPAM: Object.freeze({
    duplicate: "Будь ласка, не повторюйте те саме повідомлення",
    links: "Повідомлення схоже на спам із посиланнями",
  }),
  MUTED: "Вас тимчасово заглушено за повторні порушення",
});

export const CHAT_LIMITS = Object.freeze({
  MAX_MESSAGE_LENGTH: 300,
  HISTORY_DEFAULT_LIMIT: 50,
  HISTORY_MAX_LIMIT: 200,
});

// Особисті повідомлення (DM) — окремі помилки/ліміти від публічного чату,
// хоча зараз збігаються за значеннями: це різні сутності (див.
// private_messages в init.sql), і ліміти цілком можуть розійтися в
// майбутньому (наприклад, суворіший рейт-ліміт для особистих повідомлень).
export const DM_ERRORS = Object.freeze({
  MESSAGE_EMPTY: "Текст повідомлення порожній",
  MESSAGE_TOO_LONG: "Текст повідомлення занадто довгий",
  RECIPIENT_NOT_FOUND: "Одержувача не знайдено",
  CANNOT_MESSAGE_SELF: "Не можна надіслати особисте повідомлення самому собі",
  // Незалежно від того, ХТО кого заблокував (одержувач відправника чи
  // навпаки) — повідомлення для відправника однакове, деталі "хто саме"
  // йому знати не потрібно (див. services/privateMessage.service.js).
  BLOCKED: "Не можна надіслати повідомлення цьому користувачу",
});

// Помилки персонального блокування користувачів (features/dm
// DmTriggerButton -> "Заблокувати", див. services/block.service.js).
// Окремо від DM_ERRORS: сама дія (не)блокування — не відправлення
// повідомлення, у неї свій набір відмов.
export const BLOCK_ERRORS = Object.freeze({
  USER_NOT_FOUND: "Користувача не знайдено",
  CANNOT_BLOCK_SELF: "Не можна заблокувати самого себе",
  ALREADY_BLOCKED: "Цей користувач уже заблокований",
  NOT_BLOCKED: "Цей користувач не заблокований",
});

export const DM_LIMITS = Object.freeze({
  MAX_MESSAGE_LENGTH: 300,
  HISTORY_DEFAULT_LIMIT: 50,
  HISTORY_MAX_LIMIT: 200,
});

/**
 * dmChannel — ім'я персональної Socket.IO room користувача, до якої він
 * автоматично приєднується при конекті (див. sockets/dm.socket.js) і не
 * покидає її незалежно від того, в якій публічній кімнаті чату
 * перебуває зараз — це окремий, постійно відкритий канал доставки
 * особистих повідомлень, не пов'язаний з ROOM_JOIN/currentRoom.
 */
export const dmChannel = (userId) => `dm:${userId}`;

// Список кімнат чату. id зберігається в messages.room і використовується як ім'я
// Socket.IO room + ключ у реєстрі присутності (див. sockets/presence.js) —
// тому id вже наявних кімнат змінювати не можна, це ключ у БД.
// "general" — кімната за замовчуванням, збігається з DEFAULT у схемі
// messages.room, тому в неї вже є історичні повідомлення.
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

// Кімната-"відстійник", куди примусово переводиться кожен кікнутий
// (див. services/moderationAction.service.js, sockets/moderationEnforcement.js):
// на час кіку користувач НЕ може перейти в жодну ІНШУ кімнату (перевіряється
// в joinRoom, chat.socket.js), сама ж bespredel лишається звичайною
// доступною кімнатою — тому саме вона, а не повний дисконект, і зроблена
// "камерою": людина не випадає з чату повністю, просто на деякий час
// обмежена одним конкретним місцем.
export const KICK_CONFINEMENT_ROOM = "bespredel";

export const isValidRoom = (room) => ROOM_IDS.includes(room);

export const SOCKET_EVENTS = Object.freeze({
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  MESSAGE_ERROR: "message:error",
  // Клієнт явно запитує вступ до кімнати (у т.ч. одразу після
  // конекту — кімната за замовчуванням не призначається автоматично).
  ROOM_JOIN: "room:join",
  // Розсилається всім у конкретній room при зміні її складу —
  // актуальний список учасників (зі статтю) та їх кількість.
  ROOM_USERS: "room:users",
  // Розсилається всім підключеним сокетам при зміні лічильника
  // учасників БУДЬ-ЯКОЇ кімнати — використовується для списку кімнат у сайдбарі,
  // щоб лічильники були живими навіть для кімнат, у яких користувач
  // зараз не перебуває.
  ROOMS_STATE: "rooms:state",
  // Сповіщення про вхід/перехід/вихід користувача — див.
  // broadcastSystemEvent у sockets/chat.socket.js. На відміну від
  // ROOMS_STATE, розсилається НЕ всім підключеним, а лише учасникам
  // конкретної room (io.to(room).emit): "Ласкаво просимо" бачать лише
  // ті, хто зараз у кімнаті, куди увійшли; "переходить у кімнату X" —
  // лише ті, хто залишився в СТАРІЙ кімнаті (звідки користувач пішов).
  SYSTEM_EVENT: "system:event",

  // Особисті повідомлення (DM) — окремий канал доставки, не пов'язаний
  // з ROOM_JOIN/currentRoom, див. dmChannel вище і sockets/dm.socket.js.
  DM_OPEN: "dm:open",
  DM_LIST: "dm:list",
  DM_SEND: "dm:send",
  DM_NEW: "dm:new",
  DM_ERROR: "dm:error",
  // Явне "прочитано" для випадку, коли діалог уже відкритий і нове
  // повідомлення прийшло live через dm:new — dm:open вдруге не
  // викликається (історія вже завантажена), тож без цього окремого
  // події read_at для такого повідомлення не проставився б.
  DM_READ: "dm:read",
  // "Мене (не)заблокував співрозмовник" — адресна подія в персональний
  // канал ІНШОЇ сторони блокування (див. sockets/block.socket.js), щоб
  // уже відкрита в неї DirectMessagesModal з цим діалогом одразу
  // відреагувала (вимкнула форму відправлення / зняла обмеження), не
  // чекаючи наступного dm:open.
  DM_BLOCKED_CHANGED: "dm:blocked_changed",

  // Персональні блокування користувачів — свій канал, той самий
  // dmChannel(userId) (див. dmChannel вище): "Заблокувати" в дропдавні
  // ніка доступне будь-якому користувачу, а не лише модерації.
  BLOCK_LIST: "block:list",
  BLOCK_ADD: "block:add",
  BLOCK_REMOVE: "block:remove",
  // Розсилається на всі вкладки/пристрої САМОГО блокувальника (інші
  // вкладки того ж акаунта повинні одразу побачити оновлений список
  // заблокованих — наприклад, у сайдбарі відкритому в іншій вкладці).
  BLOCK_UPDATED: "block:updated",

  // Модерація (кік/бан) — надсилаються АДРЕСНО жертві дії (див.
  // sockets/moderationEnforcement.js), а не всій кімнаті: інші учасники
  // дізнаються про звільнене місце лише через звичайний ROOM_USERS.
  MODERATION_KICKED: "moderation:kicked",
  MODERATION_BANNED: "moderation:banned",
  // "Бан кімнати" (MODERATION_ACTIONS.BAN_ROOM) — на відміну від
  // MODERATION_KICKED, це НЕ повне замкнення: жертву лише переносить у
  // KICK_CONFINEMENT_ROOM одноразово (стартова точка), а надалі вона
  // може переходити в будь-яку кімнату, окрім тих, куди видано
  // room-бан (перевіряється звичайним BanRepository.findActive у
  // room:join, як і будь-який інший room-бан) — тому це окрема подія,
  // а не варіант MODERATION_KICKED.
  MODERATION_ROOM_BANNED: "moderation:room_banned",
});
