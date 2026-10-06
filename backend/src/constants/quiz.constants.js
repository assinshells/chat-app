import { DEFAULT_ROOM } from "./chat.constants.js";

// Вікторина працює лише в одній кімнаті — "Головна".
export const QUIZ_ROOM = DEFAULT_ROOM;

// Логін бота-ведучого. Користувач із таким логіном заводиться при
// старті бекенда (services/quizBootstrap.service.js); оскільки логін
// унікальний, звичайна реєстрація під цим ніком неможлива — підробити
// бота не вийде.
export const QUIZ_BOT_LOGIN = "Вікторина";
export const QUIZ_BOT_COLOR = "purple";

export const QUIZ_COMMANDS = Object.freeze({
  START: "!викторина",
  START_UA: "!вікторина",
  POINTS: ["!очки", "!бали", "!баллы"],
  TOP: "!топ",
});

// Бали за складність: легке — 1, середнє — 2, складне — 3.
export const QUIZ_DIFFICULTY = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
});

export const QUIZ_POINTS = Object.freeze({
  [QUIZ_DIFFICULTY.EASY]: 1,
  [QUIZ_DIFFICULTY.MEDIUM]: 2,
  [QUIZ_DIFFICULTY.HARD]: 3,
});

export const QUIZ_TIMING = Object.freeze({
  // Час на відповідь — однаковий для всіх питань і навмисно короткий,
  // щоб не встигнути загуглити.
  ANSWER_TIME_MS: Number(process.env.QUIZ_ANSWER_TIME_SECONDS ?? 25) * 1000,
  // Пауза між вікторинами: від завершення попередньої (відповіли або
  // вийшов час) до моменту, коли можна запустити наступну. Автоматично
  // вікторина НЕ стартує — лише за командою користувача.
  COOLDOWN_MS: Number(process.env.QUIZ_COOLDOWN_MINUTES ?? 10) * 60 * 1000,
});

