import { useEffect, useRef } from "react";

import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";

export function ChatConversation({ messages = [], currentUser }) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useAutoHideScrollbar(scrollRef);

  // Автопрокрутка к последнему сообщению при добавлении нового.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <main ref={scrollRef} className="chat-conversation app-scrollbar">
      <div className="chat-messages">

        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          <div className="message-list">

            {messages.map((message) => {
              const isOwn = message.author === currentUser;

              return (
                <div
                  key={message.id}
                  className={`message ${isOwn ? "message-user" : "message-other"}`}
                >

                  <div className="message-content">
                    <span className="message-time">
                      {formatMessageTime(message.timestamp)}
                    </span>{" "}
                    <span className="message-author">
                      {message.author}
                    </span>{" "}
                    <span className="message-text">
                      {message.text}
                    </span>
                  </div>

                </div>
              );
            })}

            <div ref={endRef} />

          </div>
        )}

      </div>
    </main>
  );
}