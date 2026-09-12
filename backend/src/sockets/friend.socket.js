import { FriendService } from "../services/friend.service.js";
import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import logger from "../config/logger.js";

/**
 * registerFriendSocket — персональний список друзів користувачів. Живе
 * на тому самому персональному каналі, що й DM/блокування
 * (dmChannel(userId), див. dm.socket.js — socket.join там уже
 * виконано): додавання/видалення друга нікого, крім самого власника
 * списку, не стосується, тому досить лише розіслати оновлений список
 * на всі його власні вкладки/пристрої — на відміну від block:add,
 * тут немає адресної події для другого боку (додавання нікого ні до
 * чого не зобов'язує і не змінює жодних прав/обмежень цільового
 * користувача).
 */
export function registerFriendSocket(io, socket) {
  socket.on(SOCKET_EVENTS.FRIEND_LIST, async (_payload, ack) => {
    try {
      const friends = await FriendService.listFriends({ ownerId: socket.data.userId });
      if (typeof ack === "function") {
        ack({ success: true, friends });
      }
    } catch (err) {
      logger.warn(`friend:list не вдався для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Не вдалося завантажити список друзів" });
      }
    }
  });

  socket.on(SOCKET_EVENTS.FRIEND_ADD, async (payload, ack) => {
    const targetLogin = typeof payload === "string" ? payload : payload?.login;

    try {
      const { targetLogin: resolvedLogin } = await FriendService.addFriend({
        ownerId: socket.data.userId,
        ownerLogin: socket.data.login,
        targetLogin,
      });

      const friends = await FriendService.listFriends({ ownerId: socket.data.userId });

      // Усі вкладки/пристрої САМОГО власника списку — щоб інша відкрита
      // вкладка одразу побачила оновлений список друзів у сайдбарі.
      io.to(dmChannel(socket.data.userId)).emit(SOCKET_EVENTS.FRIEND_UPDATED, { friends });

      if (typeof ack === "function") {
        ack({ success: true, login: resolvedLogin, friends });
      }
    } catch (err) {
      logger.warn(`friend:add відхилено для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, code: err.code, message: err.message });
      }
    }
  });

  socket.on(SOCKET_EVENTS.FRIEND_REMOVE, async (payload, ack) => {
    const targetLogin = typeof payload === "string" ? payload : payload?.login;

    try {
      const { targetLogin: resolvedLogin } = await FriendService.removeFriend({
        ownerId: socket.data.userId,
        targetLogin,
      });

      const friends = await FriendService.listFriends({ ownerId: socket.data.userId });

      io.to(dmChannel(socket.data.userId)).emit(SOCKET_EVENTS.FRIEND_UPDATED, { friends });

      if (typeof ack === "function") {
        ack({ success: true, login: resolvedLogin, friends });
      }
    } catch (err) {
      logger.warn(`friend:remove відхилено для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, code: err.code, message: err.message });
      }
    }
  });
}
