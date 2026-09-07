import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";

/**
 * RoomBanNoticeBanner — показується одразу після "бан кімнати"
 * (BAN_ROOM, див. useChatSocket.roomBanNotice): користувача щойно
 * перенесло в bespredel і забанило в переліку конкретних кімнат. На
 * відміну від ConfinementBanner, тут НЕМАЄ фрази "перехід в інші
 * кімнати недоступний" — перехід у будь-яку НЕзабанену кімнату
 * дозволений, банер лише перелічує, куди саме заходити не можна.
 */
export function RoomBanNoticeBanner({ notice }) {
  if (!notice) return null;

  const expiresLabel = notice.expiresAt
    ? new Date(notice.expiresAt).toLocaleString()
    : "назавжди";

  const roomNames = (notice.bannedRooms ?? [])
    .map((id) => ROOMS_BY_ID[id]?.name ?? id)
    .join(", ");

  return (
    <div className="alert alert-danger m-2 mb-0 py-2 px-3">
      <span className="small">
        Вас переведено в «Бєспрєдєл» і заблоковано в кімнатах: {roomNames} (до{" "}
        {expiresLabel})
        {notice.reason ? ` · Причина: ${notice.reason}` : ""}. В інші кімнати
        переходити можна.
      </span>
    </div>
  );
}
