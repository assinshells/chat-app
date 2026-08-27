import { useEffect, useRef } from "react";

import logo from "@shared/assets/logo/logo.svg";
import { formatMessageTime } from "@shared/lib/message.js";

export function ChatConversation({ messages = [], currentUser }) {
  const endRef = useRef(null);

  // Автопрокрутка к последнему сообщению при добавлении нового.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <main className="chat-conversation">

      <div className="chat-messages">

        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <img src={logo} alt="" />
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

                  {!isOwn && (
                    <div className="message-avatar">
                      {message.author?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}

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