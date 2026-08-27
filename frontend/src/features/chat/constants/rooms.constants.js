// Список комнат чата. ВАЖНО: id должны точно совпадать с бэкендом
// (backend/src/constants/chat.constants.js) — id используется как имя
// Socket.IO room и хранится в БД (messages.room), это не просто текст
// для отображения. При добавлении/переименовании комнаты правь оба файла.
export const ROOMS = [
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
];

export const DEFAULT_ROOM = "general";

export const ROOMS_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room]));