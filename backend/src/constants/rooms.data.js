/**
 * CHAT_ROOMS — фиксированный список комнат чата.
 * Раньше комнаты создавались пользователями и хранились в таблице
 * rooms — по требованию список теперь статический, без БД и сидеров:
 * этот массив — единственный источник истины (фронт получает его
 * через GET /api/rooms и ничего не дублирует у себя).
 *
 * id используется как room_id в таблице messages (VARCHAR, не FK —
 * ссылочная целостность не нужна для статического набора) и как
 * Socket.IO room-канал.
 */
export const CHAT_ROOMS = Object.freeze([
  { id: "general", name: "Головна" },
  { id: "znakomstva", name: "Знайомства" },
  { id: "seks", name: "Секс" },
  { id: "gey-les-bi", name: "Гей/Лес/Бі" },
  { id: "bespredel", name: "Бєспрєдєл" },
  { id: "kyiv", name: "Київ" },
  { id: "vinnytsia", name: "Вінниця" },
  { id: "dnipro", name: "Дніпро" },
  { id: "donetsk", name: "Донецьк" },
  { id: "zhytomyr", name: "Житомир" },
  { id: "zaporizhzhia", name: "Запоріжжя" },
  { id: "ivano-frankivsk", name: "Ів-Франківськ" },
  { id: "kropyvnytskyi", name: "Кропивницький" },
  { id: "luhansk", name: "Луганськ" },
  { id: "lutsk", name: "Луцьк" },
  { id: "lviv", name: "Львів" },
  { id: "mykolaiv", name: "Миколаїв" },
  { id: "odesa", name: "Одеса" },
  { id: "poltava", name: "Полтава" },
  { id: "rivne", name: "Рівне" },
  { id: "sevastopol", name: "Севастополь" },
  { id: "simferopol", name: "Сімферополь" },
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

const ROOMS_BY_ID = new Map(CHAT_ROOMS.map((room) => [room.id, room]));

export const findRoomById = (id) => ROOMS_BY_ID.get(id) ?? null;
