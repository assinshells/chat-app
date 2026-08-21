CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    -- Не FK: комнаты — статический список в коде
    -- (backend/src/constants/rooms.data.js), не таблица БД.
    -- Принадлежность списку проверяется в приложении (RoomService.assertRoomExists).
    room_id VARCHAR(64) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Кому адресовано сообщение (клик по нику в чате) — до
    -- CHAT_LIMITS.MAX_RECIPIENTS id'шников users. Не FK-таблица
    -- многие-ко-многим, а просто массив: адресация — не подписка и не
    -- членство, отдельная связка тут избыточна. Пустой массив по
    -- умолчанию — обычное сообщение "всем".
    recipient_ids INTEGER[] NOT NULL DEFAULT '{}'
);

-- room_id + id (не created_at) — под keyset-пагинацию истории
-- (MessageRepository.findByRoom сортирует/фильтрует по id).
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, id DESC);