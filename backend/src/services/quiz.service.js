import { MessageRepository } from "../repositories/message.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toMessageDto } from "../dto/message.dto.js";
import { SOCKET_EVENTS } from "../constants/chat.constants.js";
import {
  QUIZ_ROOM,
  QUIZ_BOT_LOGIN,
  QUIZ_COMMANDS,
  QUIZ_POINTS,
  QUIZ_TIMING,
} from "../constants/quiz.constants.js";
import { QUIZ_QUESTIONS } from "../quiz/questions.data.js";
import { getQuizBot } from "./quizBootstrap.service.js";
import logger from "../config/logger.js";

/**
 * QuizService — вікторина в кімнаті QUIZ_ROOM.
 *
 * Одна команда "!викторина" = одне питання. Автоматично нічого не
 * стартує. Після завершення вікторини (хтось відповів АБО вийшов час)
 * діє пауза COOLDOWN (10 хв): у цей час "!викторина" лише повідомляє,
 * скільки лишилось до наступної; поки питання активне — що вікторина
 * вже йде.
 *
 * Стан у пам'яті процесу (як і presence.js; один інстанс backend).
 * Після рестарту пауза скидається, бали ж лежать у БД (users.points).
 */
const state = {
  current: null, // { question, index, timeoutId }
  cooldownUntil: 0, // timestamp (ms), раніше якого нову вікторину запустити не можна
  solved: [], // індекси питань, на які вже відповіли (щоб не повторювались)
};

// ---------- допоміжне ----------

/** 1 бал / 2 бали / 5 балів. */
function pluralPoints(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} бал`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} бали`;
  return `${n} балів`;
}

function formatDuration(ms) {
  const totalSec = Math.max(1, Math.ceil(ms / 1000));
  if (totalSec < 60) return `${totalSec} с`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec ? `${min} хв ${sec} с` : `${min} хв`;
}

const DIFFICULTY_LABEL = { easy: "легке", medium: "середнє", hard: "складне" };

/** say — повідомлення від бота: зберігається в історії і розсилається кімнаті. */
async function say(io, text) {
  const bot = getQuizBot();
  if (!bot) return;
  try {
    const created = await MessageRepository.create({
      authorId: bot.id,
      text,
      room: QUIZ_ROOM,
    });
    const dto = toMessageDto({ ...created, author: bot.login, color: bot.color });
    io.to(QUIZ_ROOM).emit(SOCKET_EVENTS.MESSAGE_NEW, dto);
  } catch (err) {
    logger.error(`Вікторина: не вдалося надіслати повідомлення бота: ${err.message}`);
  }
}

/**
 * Питання, на які ще не відповіли. Питання, що лишилось без відповіді,
 * у solved не потрапляє — тому може випасти знову. Коли відповіли на
 * все — список починається заново.
 */
function pickQuestionIndex() {
  const total = QUIZ_QUESTIONS.length;
  if (state.solved.length >= total) state.solved = [];
  const pool = [];
  for (let i = 0; i < total; i += 1) {
    if (!state.solved.includes(i)) pool.push(i);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

const startCooldown = () => {
  state.cooldownUntil = Date.now() + QUIZ_TIMING.COOLDOWN_MS;
};

// ---------- життєвий цикл ----------

async function startQuiz(io) {
  // Спочатку виставляємо стан (синхронно), і лише потім чекаємо на БД:
  // повторне "!викторина" або відповідь під час await say() вже побачать
  // активне питання.
  const index = pickQuestionIndex();
  const question = QUIZ_QUESTIONS[index];
  const points = QUIZ_POINTS[question.d];

  state.current = {
    question,
    index,
    timeoutId: setTimeout(() => {
      onTimeout(io).catch((err) => logger.error(`Вікторина: ${err.message}`));
    }, QUIZ_TIMING.ANSWER_TIME_MS),
  };

  await say(
    io,
    `❓ Питання на ${pluralPoints(points)} (${DIFFICULTY_LABEL[question.d]}): ${question.q} ` +
      `⏱ Час — ${formatDuration(QUIZ_TIMING.ANSWER_TIME_MS)}. ` +
      `Відповідь — одним повідомленням, точно, з великої літери де треба.`,
  );
}

async function onTimeout(io) {
  if (!state.current) return;
  state.current = null;
  startCooldown();

  // Правильну відповідь свідомо НЕ озвучуємо: питання може випасти ще раз.
  await say(
    io,
    `⌛ Ніхто не відповів на питання. Наступна вікторина — через ${formatDuration(QUIZ_TIMING.COOLDOWN_MS)}.`,
  );
}

async function onCorrectAnswer(io, { userId, login }) {
  const solved = state.current;
  if (!solved) return;

  // Забираємо питання СИНХРОННО, до першого await: якщо двоє відповіли
  // майже одночасно, друге повідомлення вже побачить current === null
  // і бали отримає лише перший.
  state.current = null;
  clearTimeout(solved.timeoutId);
  state.solved.push(solved.index);
  startCooldown();

  const points = QUIZ_POINTS[solved.question.d];
  let total = null;
  try {
    total = await UserRepository.addPoints(userId, points);
  } catch (err) {
    logger.error(`Вікторина: не вдалося нарахувати бали користувачу ${userId}: ${err.message}`);
  }

  await say(
    io,
    `🎉 Ура! ${login} відповів(-ла) вірно і отримує ${pluralPoints(points)}!` +
      (total !== null ? ` Всього балів: ${total}.` : "") +
      ` Наступна вікторина — через ${formatDuration(QUIZ_TIMING.COOLDOWN_MS)}.`,
  );
}

async function handleStartCommand(io) {
  if (state.current) {
    return say(io, "Вікторина вже йде — відповідайте на поточне питання! 🙂");
  }

  const left = state.cooldownUntil - Date.now();
  if (left > 0) {
    return say(io, `До наступної вікторини залишилось ${formatDuration(left)}.`);
  }

  return startQuiz(io);
}

// ---------- вхідна точка ----------

export const QuizService = {
  /**
   * handleMessage — викликається з chat.socket.js ПІСЛЯ того, як звичайне
   * повідомлення користувача вже розіслано кімнаті (тому відповідь
   * користувача в стрічці йде раніше за реакцію бота). Не кидає винятків.
   */
  async handleMessage(io, { room, userId, login, text }) {
    try {
      if (room !== QUIZ_ROOM || login === QUIZ_BOT_LOGIN) return;

      // Відповідь порівнюється з ТОЧНИМ текстом (без нормалізації).
      // Команди нижче — нечутливі до регістру.
      const answer = String(text ?? "").trim();
      if (!answer) return;

      const command = answer.toLowerCase();

      if (command === QUIZ_COMMANDS.START || command === QUIZ_COMMANDS.START_UA) {
        return handleStartCommand(io);
      }

      if (QUIZ_COMMANDS.POINTS.includes(command)) {
        const points = await UserRepository.getPoints(userId);
        return say(io, `${login}, у вас ${pluralPoints(points)}.`);
      }

      if (command === QUIZ_COMMANDS.TOP) {
        const top = await UserRepository.topByPoints(5, QUIZ_BOT_LOGIN);
        if (top.length === 0) return say(io, "Рейтинг поки порожній — перемагайте у вікторині!");
        const medals = ["🥇", "🥈", "🥉", "4.", "5."];
        const lines = top.map((u, i) => `${medals[i]} ${u.login} — ${u.points}`);
        return say(io, `🏆 Топ вікторини: ${lines.join("; ")}`);
      }

      if (state.current && state.current.question.answers.includes(answer)) {
        await onCorrectAnswer(io, { userId, login });
      }
    } catch (err) {
      logger.error(`Вікторина: помилка обробки повідомлення: ${err.message}`);
    }
  },
};
