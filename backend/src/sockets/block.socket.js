import { BlockService } from "../services/block.service.js";
import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import logger from "../config/logger.js";

/**
 * registerBlockSocket — персональне блокування користувачів. Живе на
 * тому самому персональному каналі, що й DM (dmChannel(userId), див.
 * dm.socket.js — socket.join там уже виконано), тому що обидві функції
 * стосуються особистих взаємодій одного користувача з іншим і повинні
 * долітати незалежно від того, в якій кімнаті чату він зараз перебуває.
 *
 * Сама "видимість" заблокованого користувача (зникнення з чату/списку
 * користувачів) — суто фронтенд-фільтрація за списком заблокованих
 * логінів (див. features/block/model/useBlockStore.js): це особиста
 * якість перегляду, а не питання безпеки, тому додаткового
 * серверного приховування в ROOM_USERS/message:new немає. А от заборона
 * писати заблокованому — реальне обмеження, і воно перевіряється на
 * бекенді (див. services/privateMessage.service.js).
 */
export function registerBlockSocket(io, socket) {
  socket.on(SOCKET_EVENTS.BLOCK_LIST, async (_payload, ack) => {
    try {
      const blocked = await BlockService.listBlocked({ blockerId: socket.data.userId });
      if (typeof ack === "function") {
        ack({ success: true, blocked });
      }
    } catch (err) {
      logger.warn(`block:list не вдався для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Не вдалося завантажити список заблокованих" });
      }
    }
  });

  socket.on(SOCKET_EVENTS.BLOCK_ADD, async (payload, ack) => {
    const targetLogin = typeof payload === "string" ? payload : payload?.login;

    try {
      const { targetId, targetLogin: resolvedLogin } = await BlockService.blockUser({
        blockerId: socket.data.userId,
        blockerLogin: socket.data.login,
        targetLogin,
      });

      const blocked = await BlockService.listBlocked({ blockerId: socket.data.userId });

      // Усі вкладки/пристрої САМОГО блокувальника — щоб інша відкрита
      // вкладка одразу побачила оновлений список заблокованих у сайдбарі.
      io.to(dmChannel(socket.data.userId)).emit(SOCKET_EVENTS.BLOCK_UPDATED, { blocked });

      // Персональний канал ЗАБЛОКОВАНОГО — якщо в нього прямо зараз
      // відкрито діалог із блокувальником, DirectMessagesModal одразу
      // вимкне форму відправлення, не чекаючи наступного dm:open.
      io.to(dmChannel(targetId)).emit(SOCKET_EVENTS.DM_BLOCKED_CHANGED, {
        by: socket.data.login,
        blocked: true,
      });

      if (typeof ack === "function") {
        ack({ success: true, login: resolvedLogin, blocked });
      }
    } catch (err) {
      logger.warn(`block:add відхилено для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, code: err.code, message: err.message });
      }
    }
  });

  socket.on(SOCKET_EVENTS.BLOCK_REMOVE, async (payload, ack) => {
    const targetLogin = typeof payload === "string" ? payload : payload?.login;

    try {
      const { targetId, targetLogin: resolvedLogin } = await BlockService.unblockUser({
        blockerId: socket.data.userId,
        targetLogin,
      });

      const blocked = await BlockService.listBlocked({ blockerId: socket.data.userId });

      io.to(dmChannel(socket.data.userId)).emit(SOCKET_EVENTS.BLOCK_UPDATED, { blocked });

      io.to(dmChannel(targetId)).emit(SOCKET_EVENTS.DM_BLOCKED_CHANGED, {
        by: socket.data.login,
        blocked: false,
      });

      if (typeof ack === "function") {
        ack({ success: true, login: resolvedLogin, blocked });
      }
    } catch (err) {
      logger.warn(`block:remove відхилено для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, code: err.code, message: err.message });
      }
    }
  });
}
