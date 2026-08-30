CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    -- 'unknown' сознательно не входит в набор значений: гендер нужен для
    -- родових форм системных повідомлень (увійшов/увійшла тощо), а без
    -- конкретного значення таке повідомлення сформувати не можна.
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('male', 'female')),
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

-- Убираем значение 'unknown' из gender для уже существующих баз (init.sql
-- выполняется только на пустой базе, поэтому старые окружения нужно
-- домигрировать явно). Так как выбрать "правильный" пол за пользователя
-- нельзя, а поле обязательное и без дефолта — оставшиеся строки со
-- значением 'unknown' переводим в 'male' как нейтральный технический
-- выбор (просто чтобы CHECK не упал); если для вашей базы это не
-- подходит — поправьте построчно перед следующим деплоем.
UPDATE users SET gender = 'male' WHERE gender = 'unknown';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_gender_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_gender_check;
    END IF;
    ALTER TABLE users ADD CONSTRAINT users_gender_check
        CHECK (gender IN ('male', 'female'));
END $$;

CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Общий чат (комнаты из ROOMS, см. backend/src/constants/chat.constants.js).
-- text не содержит переносов строк — это гарантируется на уровне backend
-- (message.service.js).
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64) NOT NULL DEFAULT 'general',
    text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room, created_at);

-- Личные сообщения (DM) — отдельная таблица, а не messages с room=NULL:
-- у личики нет ни гендерных групп участников, ни системных подій
-- вхід/вихід, ни общего "списка комнат", это принципиально другая
-- сущность (переписка ровно двух конкретных людей), см.
-- backend/src/repositories/privateMessage.repository.js.
CREATE TABLE IF NOT EXISTS private_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT private_messages_no_self_dm CHECK (sender_id <> recipient_id)
);

-- Один индекс покрывает оба типичных запроса: "переписка между A и Б"
-- (WHERE LEAST/GREATEST(...) = конкретная пара, ORDER BY created_at) и
-- "список диалогов пользователя" (см. PrivateMessageRepository) — вместо
-- отдельных индексов на sender_id/recipient_id по отдельности.
CREATE INDEX IF NOT EXISTS idx_private_messages_pair
    ON private_messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at);