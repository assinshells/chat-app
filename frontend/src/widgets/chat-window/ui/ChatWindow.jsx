import { useEffect, useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import { ArrowLeft, Repeat, Ellipsis } from "lucide-react";
import { useMessagesStore } from "@entities/message";
import { MessageInput } from "@features/message/send";
import { LogoutButton } from "@features/auth/logout/ui/LogoutButton.jsx";
import { MAX_MESSAGE_RECIPIENTS } from "@shared/constants/socket.constants.js";
import { useChatSession } from "../model/useChatSession.js";

// Стабильная ссылка на "нет сообщений". Если возвращать из селектора
// новый литерал `[]` при каждом вызове, useSyncExternalStore (на нём
// построен zustand v5) считает стор изменившимся на каждом рендере —
// это и давало "Maximum update depth exceeded" / getSnapshot loop.
const EMPTY_MESSAGES = [];

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/**
 * ChatWindow — основная область чата: лента сообщений активной комнаты
 * и поле отправки. Realtime join/leave/подписку на Socket.IO держит
 * useChatSession; сами сообщения (кэш по комнатам) живут в
 * entities/message (useMessagesStore) — переключение вкладок Rooms не
 * требует повторного REST-запроса истории, если она уже загружена.
 *
 * Сообщения рендерятся простой плоской строкой (автор + время сверху,
 * текст под ними), без отдельного компонента-"пузыря" — вместо него
 * тут инлайновая разметка ниже.
 *
 * roomId=null (комната ещё не выбрана) — валидное состояние: рендерим
 * пустое приглашение вместо ленты, инпут отправки заблокирован. Список
 * комнат теперь открывается только по кнопке "Кімнати" в шапці (панель
 * user-profile-sidebar) — окремого лівого сайдбару більше немає, тож
 * .user-chat завжди видимий і займає весь доступний простір (див.
 * app/styles/user-chat.css). onBack — кнопка "назад" в шапке, видима
 * тільки на мобільному, скидає activeRoomId в ChatPage.
 *
 * Адресация сообщения: ник в ленте (кроме своего) кликабелен — клик
 * добавляет/убирает автора из selectedRecipients (до
 * MAX_MESSAGE_RECIPIENTS человек, повторный клик по уже выбранному
 * нику снимает выбор). Выбор отображается панелью "Кому:" над инпутом
 * (MessageInput) с кнопкой "Очистити"; при отправке id получателей
 * уходят вместе с сообщением, и после отправки выбор сбрасывается —
 * это разовый реплай, а не постоянный "режим адресации".
 */
export function ChatWindow({
  roomId,
  roomName,
  currentUserId,
  onBack,
  onOpenRooms,
  onLogout,
}) {
  const messages = useMessagesStore((s) =>
    roomId ? (s.messagesByRoom[roomId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const loadingRoomId = useMessagesStore((s) => s.loadingRoomId);
  const { sendMessage } = useChatSession(roomId);
  const bottomRef = useRef(null);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  // Смена комнаты — выбор адресатов из предыдущей комнаты теряет
  // смысл (это были ники из другой ленты). Сброс — прямо в теле
  // рендера (паттерн React "adjusting state when a prop changes"), а
  // не в useEffect: избегаем лишнего "мигающего" рендера со старым
  // выбором поверх уже новой комнаты.
  const [recipientsResetRoomId, setRecipientsResetRoomId] = useState(roomId);
  if (roomId !== recipientsResetRoomId) {
    setRecipientsResetRoomId(roomId);
    setSelectedRecipients([]);
  }

  useEffect(() => {
    // Якір в кінці списку повідомлень: scrollIntoView сам знаходить
    // прокручуваний контейнер SimpleBar, тож не потрібно тягнутись
    // до внутрішнього overflow-вузла напряму.
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const toggleRecipient = (user) => {
    if (user.id === currentUserId) return; // свой ник не адресуем
    setSelectedRecipients((prev) => {
      const alreadySelected = prev.some((r) => r.id === user.id);
      if (alreadySelected) return prev.filter((r) => r.id !== user.id);
      if (prev.length >= MAX_MESSAGE_RECIPIENTS) return prev; // лимит — лишние клики игнорируем
      return [...prev, user];
    });
  };

  const clearRecipients = () => setSelectedRecipients([]);

  const handleSend = (content) => {
    sendMessage(
      content,
      selectedRecipients.map((r) => r.id),
    );
    setSelectedRecipients([]);
  };

  return (
    <div className="user-chat w-100 overflow-hidden">
      <div className="d-lg-flex">
        <div className="w-100 overflow-hidden position-relative">
          <div className="p-3 p-lg-4 border-bottom user-chat-topbar">
            <div className="row align-items-center">
              <div className="col-sm-4 col-8">
                <div className="d-flex align-items-center">
                  <div className="d-block d-lg-none me-2 ms-0">
                    {roomId && (
                      <a
                        href="#"
                        className="user-chat-remove text-muted font-size-16 p-2"
                        onClick={onBack}
                        aria-label="Назад до кімнат"
                      >
                        <ArrowLeft size={20} />
                      </a>
                    )}
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="font-size-16 mb-0 text-truncate">
                      {roomId ? roomName : "Оберіть кімнату"}
                    </h5>
                  </div>
                </div>
              </div>
              <div className="col-sm-8 col-4">
                <ul className="list-inline user-chat-nav text-end mb-0">
                  <li className="list-inline-item">
                    <button
                      type="button"
                      className="btn nav-btn user-profile-show"
                      onClick={onOpenRooms}
                      title="Кімнати"
                      aria-label="Показати кімнати"
                    >
                      <Repeat size={18} />
                    </button>
                  </li>
                  <li className="list-inline-item d-none d-lg-inline-block me-2 ms-0">
                    <div className="dropdown">
                      <button
                        className="btn nav-btn dropdown-toggle arrow-none"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <Ellipsis className="float-end text-muted" size={16} />
                      </button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <a
                          className="dropdown-item d-block d-lg-none user-profile-show"
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            onOpenRooms?.();
                          }}
                        >
                          Кімнати{" "}
                          <Repeat className="float-end text-muted" size={16} />
                        </a>
                        <div className="dropdown-divider d-block d-lg-none" />
                        <LogoutButton onLoggedOut={onLogout} variant="menu-item" />
                    
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <SimpleBar className="chat-conversation p-3 p-lg-4">
            <ul className="list-unstyled mb-0">
              {!roomId && (
                <li className="text-muted text-center">
                  Оберіть кімнату, натиснувши «Кімнати» вгорі
                </li>
              )}
              {roomId && loadingRoomId === roomId && messages.length === 0 && (
                <li className="text-muted text-center">
                  Завантаження історії...
                </li>
              )}
              {roomId && !loadingRoomId && messages.length === 0 && (
                <li className="text-muted text-center">
                  Повідомлень ще немає — напишіть перше
                </li>
              )}
              {messages.map((message) => {
                const isOwn = message.authorId === currentUserId;
                const isAuthorSelected = selectedRecipients.some(
                  (r) => r.id === message.authorId,
                );
                const atLimit =
                  selectedRecipients.length >= MAX_MESSAGE_RECIPIENTS;
                // Пары id+логин получателей этого сообщения — чтобы
                // и в "→ Кому" их тоже можно было кликать (добавить в
                // свой текущий выбор при ответе), а не только автора.
                const recipientPairs = (message.recipientIds ?? []).map(
                  (id, i) => ({
                    id,
                    login: message.recipientLogins?.[i] ?? "?",
                  }),
                );
                return (
                  <li
                    key={message.id}
                    className={
                      isOwn ? "message-line message-line-own" : "message-line"
                    }
                  >
                    <p className="mb-0">
                      <span className="message-time">
                        {formatTime(message.createdAt)}
                      </span>{" "}
                      <span
                        className={
                          "message-author" +
                          (isOwn ? " own-nick" : " message-author-clickable") +
                          (isAuthorSelected ? " message-author-selected" : "") +
                          (!isOwn && !isAuthorSelected && atLimit
                            ? " message-author-limit"
                            : "")
                        }
                        onClick={
                          isOwn
                            ? undefined
                            : () =>
                                toggleRecipient({
                                  id: message.authorId,
                                  login: message.authorLogin,
                                })
                        }
                        title={
                          isOwn
                            ? undefined
                            : "Натисніть, щоб адресувати відповідь"
                        }
                      >
                        {message.authorLogin}
                      </span>{" "}
                      {recipientPairs.length > 0 && (
                        <span className="message-recipients">
                          →{" "}
                          {recipientPairs.map((r, i) => {
                            const isOwnRecipient = r.id === currentUserId;
                            const isSelected = selectedRecipients.some(
                              (sel) => sel.id === r.id,
                            );
                            return (
                              <span key={r.id}>
                                <span
                                  className={
                                    "message-recipients-nick" +
                                    (isOwnRecipient
                                      ? " own-nick"
                                      : " message-author-clickable") +
                                    (isSelected
                                      ? " message-author-selected"
                                      : "")
                                  }
                                  onClick={
                                    isOwnRecipient
                                      ? undefined
                                      : () => toggleRecipient(r)
                                  }
                                >
                                  {r.login}
                                </span>
                                {i < recipientPairs.length - 1 ? ", " : ""}
                              </span>
                            );
                          })}
                        </span>
                      )}{" "}
                      <span className="message-text">{message.content}</span>
                    </p>
                  </li>
                );
              })}
              {/* Якір для автоскролу до останнього повідомлення */}
              <li
                ref={bottomRef}
                aria-hidden="true"
                className="message-anchor"
              />
            </ul>
          </SimpleBar>
          <div className="chat-input-section p-3 p-lg-4 border-top mb-0">
            <MessageInput
              onSend={handleSend}
              disabled={!roomId}
              recipients={selectedRecipients}
              onClearRecipients={clearRecipients}
            />
          </div>
        </div>
      </div>
    </div>
  );
}