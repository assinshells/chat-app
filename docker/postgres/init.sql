CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    -- 'unknown' свідомо не входить до набору значень: стать потрібна для
    -- родових форм системних повідомлень (увійшов/увійшла тощо), а без
    -- конкретного значення таке повідомлення сформувати не можна.
    gender VARCHAR(16) NOT NULL CHECK (gender IN ('male', 'female')),
    -- Колір повідомлень/ніка користувача в сайдбарі, обирається в налаштуваннях.
    -- 'black' — значення за замовчуванням, ставиться всім новим користувачам.
    color VARCHAR(16) NOT NULL DEFAULT 'black'
        CHECK (color IN ('black', 'blue', 'green', 'purple', 'orange')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Для баз, створених до появи поля color (init.sql виконується лише
-- на порожній базі через docker-entrypoint-initdb.d) — доповнити наявну
-- таблицю колонкою без падіння, якщо вона вже є.
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

-- Прибираємо значення 'unknown' зі статі для вже наявних баз (init.sql
-- виконується лише на порожній базі, тому старі оточення потрібно
-- домігрувати явно). Оскільки обрати "правильну" стать за користувача
-- не можна, а поле обов'язкове і без дефолту — рядки, що залишилися зі
-- значенням 'unknown', переводимо в 'male' як нейтральний технічний
-- вибір (просто щоб CHECK не впав); якщо для вашої бази це не
-- підходить — поправте порядково перед наступним деплоєм.
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

-- Загальний чат (кімнати з ROOMS, див. backend/src/constants/chat.constants.js).
-- text не містить переносів рядків — це гарантується на рівні backend
-- (message.service.js).
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64) NOT NULL DEFAULT 'general',
    text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_created_at ON messages(room, created_at);

-- Особисті повідомлення (DM) — окрема таблиця, а не messages з room=NULL:
-- у особистих немає ні гендерних груп учасників, ні системних подій
-- вхід/вихід, ні загального "списку кімнат", це принципово інша
-- сутність (листування рівно двох конкретних людей), див.
-- backend/src/repositories/privateMessage.repository.js.
CREATE TABLE IF NOT EXISTS private_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT private_messages_no_self_dm CHECK (sender_id <> recipient_id)
);

-- Один індекс покриває обидва типові запити: "листування між A і Б"
-- (WHERE LEAST/GREATEST(...) = конкретна пара, ORDER BY created_at) і
-- "список діалогів користувача" (див. PrivateMessageRepository) — замість
-- окремих індексів на sender_id/recipient_id окремо.
CREATE INDEX IF NOT EXISTS idx_private_messages_pair
    ON private_messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at);
