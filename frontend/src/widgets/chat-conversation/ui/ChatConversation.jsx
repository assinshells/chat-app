import { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";

import { formatMessageTime } from "@shared/lib/message.js";

export function ChatConversation({ messages = [], currentUser }) {
  const endRef = useRef(null);

  // Автопрокрутка к последнему сообщению при добавлении нового.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <main className="chat-conversation">
      <SimpleBar style={{ height: "100%" }} autoHide={true}>
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
      </SimpleBar>
    </main>
  );
}