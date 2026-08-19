/**
 * ChatWindow — основная область чата: лента сообщений выбранного диалога
 * и поле отправки нового сообщения.
 *
 * Сейчас `children` — статичная заглушка (см. ChatPage), реальный чат
 * будет собираться из:
 *   - entities/message         (модель/рендер одного сообщения)
 *   - features/message/send    (форма/инпут отправки сообщения)
 * Их можно добавлять внутрь ChatWindow, не трогая ChatLayout.
 */
export function ChatWindow({ children }) {
  return (
    <div className="user-chat w-100 overflow-hidden">
      <div className="d-lg-flex">
        <div className="w-100 overflow-hidden position-relative">
          <div className="p-3 p-lg-4 border-bottom user-chat-topbar">
            user-chat-topbar
          </div>
          <div className="chat-conversation p-3 p-lg-4">
            <ul className="list-unstyled mb-0">
              <li>
                <div className="conversation-list">
                  <div className="user-chat-content">
                    <div className="ctext-wrap">
                      <div className="ctext-wrap-content">
                        <p className="mb-0">{children}</p>
                        <p className="chat-time mb-0">
                          <i className="ri-time-line align-middle"></i>{" "}
                          <span className="align-middle">10:00:01</span>
                        </p>
                      </div>
                    </div>
                    <div className="conversation-name">Doris Brown</div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className="chat-input-section p-3 p-lg-4 border-top mb-0">
            <div className="row g-0">
              <div className="col">
                <input
                  type="text"
                  className="form-control form-control-lg bg-light border-light"
                  placeholder="Enter Message..."
                />
              </div>
              <div className="col-auto">
                <div className="chat-input-links ms-md-2 me-md-0">
                  <ul className="list-inline mb-0">
                    <li className="list-inline-item">
                      <button
                        type="submit"
                        className="btn btn-primary font-size-16 btn-lg chat-send"
                      >
                        <i className="ri-send-plane-2-fill"></i>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
