import { SOCKET_EVENTS } from "../constants/chat.constants.js";
import { RoomPresence } from "./presence.js";

/**
 * Винесено з chat.socket.js в окремий модуль, тому що ці ж дві
 * розсилки тепер потрібні і sockets/moderationEnforcement.js (кік/бан
 * когось, хто вже онлайн, теж змінює склад кімнати й лічильники) —
 * дублювати логіку розсилки в двох місцях означало б розсинхрон при
 * майбутній зміні формату payload.
 */
export function broadcastRoomUsers(io, room) {
  io.to(room).emit(SOCKET_EVENTS.ROOM_USERS, {
    room,
    users: RoomPresence.listUsers(room),
    count: RoomPresence.countUsers(room),
  });
}

export function broadcastRoomsState(io) {
  io.emit(SOCKET_EVENTS.ROOMS_STATE, RoomPresence.countsByRoom());
}
