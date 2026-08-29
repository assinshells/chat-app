// Родовые формы текста системных сообщений (вхід/перехід/вихід),
// см. widgets/chat-conversation/ui/ChatConversation.jsx.
//
// gender гарантированно 'male' | 'female' — значение 'unknown' убрано
// из GENDER_OPTIONS (см. shared/constants/auth.constants.js), поэтому
// системное сообщение всегда можно однозначно сформувати граматично.
const SYSTEM_EVENT_TEXT = Object.freeze({
  join: { male: "увійшов у кімнату", female: "увійшла у кімнату" },
  switch: { male: "перейшов у кімнату", female: "перейшла у кімнату" },
  leave: { male: "вийшов з чату", female: "вийшла з чату" },
});

/**
 * getSystemEventText — фраза-дія для системного повідомлення без ніка й
 * без назви кімнати (вони рендеряться окремо як клікабельні елементи,
 * див. ChatConversation.jsx): "увійшов у кімнату" / "вийшла з чату" тощо.
 * Невідомий event/gender — тихий фолбек на чоловічий рід, щоб рендер не
 * впав через неочікувані дані з сокета.
 */
export function getSystemEventText(event, gender) {
  const forEvent = SYSTEM_EVENT_TEXT[event];
  if (!forEvent) return "";
  return forEvent[gender] ?? forEvent.male;
}

/**
 * hasRoomLink — для 'join'/'switch' у повідомленні є клікабельна назва
 * кімнати (куди увійшли/перейшли); для 'leave' кімнати в тексті немає
 * (користувач пішов із чату загалом, переходити нікуди).
 */
export function hasRoomLink(event) {
  return event === "join" || event === "switch";
}
