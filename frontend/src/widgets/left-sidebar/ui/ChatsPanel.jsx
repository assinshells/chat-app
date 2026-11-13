import { RoomsPanel } from "@widgets/side-panel";

/**
 * ChatsPanel — вкладка "Чати": список кімнат. Особисті діалоги
 * переїхали в модалку (іконка в шапці, @widgets/private-chat).
 */
export function ChatsPanel({ activeRoom, roomCounts, onSelectRoom }) {
  return (
    <RoomsPanel
      activeRoom={activeRoom}
      roomCounts={roomCounts}
      onSelectRoom={onSelectRoom}
    />
  );
}
