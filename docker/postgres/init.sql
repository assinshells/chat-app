CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
    -- Цвет сообщений/ника пользователя в сайдбаре, выбирается в настройках.
    -- 'black' — значение по умолчанию, ставится всем новым пользователям.
    color VARCHAR(16) NOT NULL DEFAULT 'black'
        CHECK (color IN ('black', 'blue', 'green', 'purple', 'orange')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Для баз, созданных до появления поля color (init.sql выполняется только
-- на пустой базе через docker-entrypoint-initdb.d) — добить существующую
-- таблицу колонкой без падения, если она уже есть.
ALTER TABLE users ADD COLUMN IF NOT EXISTS color VARCHAR(16) NOT NULL DEFAULT 'black';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_color_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_color_check
            CHECK (color IN ('black', 'blue', 'green', 'purple', 'orange'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Общий чат (один room "general") — соответствует текущему фронтенду,
-- где нет ни диалогов, ни списка контактов. text не содержит переносов
-- строк — это гарантируется на уровне backend (message.service.js).
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64) NOT NULL DEFAULT 'general',
    text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room, created_at);