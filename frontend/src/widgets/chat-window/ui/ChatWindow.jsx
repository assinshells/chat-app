import { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";
import { ArrowLeft } from "lucide-react";
import { useMessagesStore } from "@entities/message";
import { MessageInput } from "@features/message/send";
import { useChatSession } from "../model/useChatSession.js";

// Стабильная ссылка на "нет сообщений". Если возвращать из селектора
// новый литерал `[]` при каждом вызове, useSyncExternalStore (на нём
// построен zustand v5) считает стор изменившимся на каждом рендере —
// это и давало "Maximum update depth exceeded" / getSnapshot loop.
const EMPTY_MESSAGES = [];

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
 * пустое приглашение вместо ленты, инпут отправки заблокирован.
 *
 * На мобильном (<992px) .user-chat по CSS спрятан за экраном и
 * появляется только с классом user-chat-show (см. app/styles/user-chat.css) —
 * навешиваем его, когда roomId выбран. onBack — кнопка "назад" в шапке,
 * видима только на мобильном, сбрасывает activeRoomId в ChatPage.
 */
export function ChatWindow({ roomId, roomName, currentUserId, onBack }) {
  const messages = useMessagesStore((s) =>
    roomId ? (s.messagesByRoom[roomId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES,
  );
  const loadingRoomId = useMessagesStore((s) => s.loadingRoomId);
  const { sendMessage } = useChatSession(roomId);
  const scrollRef = useRef(null);

  useEffect(() => {
    // scrollableNodeProps даёт прямой доступ к реальному overflow:auto
    // узлу внутри SimpleBar (обычный ref на дочерний <li>, как раньше
    // с plain div, тут не сработал бы — сам скролл-контейнер теперь
    // на два уровня глубже, его создаёт SimpleBar).
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  return (
    <div className={`user-chat w-100 overflow-hidden${roomId ? " user-chat-show" : ""}`}>
      <div className="d-lg-flex">
        <div className="w-100 overflow-hidden position-relative">
          <div className="p-3 p-lg-4 border-bottom user-chat-topbar">
            <div className="row align-items-center">
              <div className="col-sm-4 col-8">
                <div className="d-flex align-items-center">
                  <div className="d-block d-lg-none me-2 ms-0">
            {roomId && (
              <a href="#"
                className="user-chat-remove text-muted font-size-16 p-2"
                onClick={onBack}
                aria-label="Назад до кімнат"
              >
                <ArrowLeft size={20} />
              </a>
            )}
            </div>
            <div className="flex-grow-1 overflow-hidden">
            <h5 className="font-size-16 mb-0 text-truncate">{roomId ? roomName : "Оберіть кімнату"}</h5>
          </div>          
          </div>
          </div>{/* button */}</div></div>

          <SimpleBar className="chat-conversation p-3 p-lg-4" >
            <ul className="list-unstyled mb-0">
              {!roomId && (
                <li className="text-muted text-center">
                  Оберіть кімнату зі списку ліворуч
                </li>
              )}
              {roomId && loadingRoomId === roomId && messages.length === 0 && (
                <li className="text-muted text-center">Завантаження історії...</li>
              )}
              {roomId && !loadingRoomId && messages.length === 0 && (
                <li className="text-muted text-center">
                  Повідомлень ще немає — напишіть перше
                </li>
              )}
              {messages.map((message) => {
                const isOwn = message.authorId === currentUserId;
                return (
                  <li key={message.id}>
                    <div className="conversation-list">
                      <div class="user-chat-content">
                      <span className="">{formatTime(message.createdAt)}</span>
                      <span className="">
                        {isOwn ? "Ви" : message.authorLogin}
                      </span>
                      </div>
                    
                    <p className="mb-0">{message.content}</p></div>
                  </li>
                );
              })}
            </ul>
          </SimpleBar>
          <div className="chat-input-section p-3 p-lg-4 border-top mb-0">
            <MessageInput onSend={sendMessage} disabled={!roomId} />
          </div>
        </div>
      </div>
    </div>
  );
}