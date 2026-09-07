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

-- Ролі (див. backend/src/constants/auth.constants.js — ROLE_VALUES).
-- 'user' — значення за замовчуванням для всіх звичайних користувачів.
-- 'moderator' модерує лише кімнати, перелічені в moderator_rooms нижче;
-- 'admin' і 'superadmin' модерують усі кімнати без винятку (перевіряється
-- на рівні коду, а не БД). Один суперадмін заводиться автоматично при
-- старті бекенда (див. services/superadminBootstrap.service.js) —
-- саме він може призначати/знімати ролі іншим користувачам.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check
            CHECK (role IN ('user', 'moderator', 'admin', 'superadmin'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Кімнати, які конкретний модератор має право модерувати. Заповнюється
-- лише для role = 'moderator' (для admin/superadmin — модерація всіх
-- кімнат одразу, окремого переліку не потрібно; для user — порожньо).
-- room не має FK, оскільки кімнати — фіксований список у коді
-- (backend/src/constants/chat.constants.js ROOM_IDS), а не таблиця в БД —
-- коректність значення room перевіряється на рівні сервісу (isValidRoom).
CREATE TABLE IF NOT EXISTS moderator_rooms (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, room)
);

-- Бани. room = NULL означає ГЛОБАЛЬНИЙ бан (на весь чат), інакше — бан
-- лише в конкретній кімнаті. Активний бан = revoked_at IS NULL AND
-- (expires_at IS NULL OR expires_at > now()); expires_at IS NULL — назавжди.
-- На відміну від ролей, тут навмисно НЕ підтримується "один активний
-- бан на пару (user, room)" через UNIQUE — історія старих
-- (роз)банів для одного й того самого користувача/кімнати зберігається
-- в цій же таблиці (revoked_at IS NOT NULL = вже неактивний), а не
-- виноситься в окремий журнал.
CREATE TABLE IF NOT EXISTS bans (
    id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64),
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Часткові індекси лише по активних банах — саме вони на гарячому
-- шляху (перевіряються при кожному connect/room:join/message:send).
CREATE INDEX IF NOT EXISTS idx_bans_active_by_user
    ON bans(target_user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bans_active_by_user_room
    ON bans(target_user_id, room) WHERE revoked_at IS NULL;

-- Журнал дій модерації (кік/бан/розбан) — для аудиту. Кік не створює
-- рядок у bans (це миттєва безстанова дія), тому фіксується лише тут.
CREATE TABLE IF NOT EXISTS moderation_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(16) NOT NULL CHECK (action IN ('kick', 'kick_chat', 'ban', 'ban_room', 'unban')),
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room VARCHAR(64),
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moderation_log_target ON moderation_log(target_user_id);

-- Домігрування для баз, створених до появи 'kick_chat'/'ban_room'
-- (дропдавн "Кикнути" > "Із чату" і "Бан" > "Бан кімнати" — див.
-- services/moderationAction.service.js kickChat/banRoom): init.sql
-- виконується лише на порожній базі, тому наявний CHECK на старих
-- оточеннях потрібно замінити явно, а не покладатись на CREATE TABLE
-- IF NOT EXISTS вище.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'moderation_log_action_check'
    ) THEN
        ALTER TABLE moderation_log DROP CONSTRAINT moderation_log_action_check;
    END IF;
    ALTER TABLE moderation_log ADD CONSTRAINT moderation_log_action_check
        CHECK (action IN ('kick', 'kick_chat', 'ban', 'ban_room', 'unban'));
END $$;

-- Кік більше не є "виштовхнули і одразу можна повернутися" — на час
-- kick_confinement користувач переводиться в конкретну "камеру"
-- (confined_room, завжди KICK_CONFINEMENT_ROOM='bespredel', див.
-- backend/src/constants/chat.constants.js) і НЕ може перейти в жодну
-- ІНШУ кімнату, поки не спливе expires_at — перевіряється в room:join
-- (sockets/chat.socket.js). UNIQUE(target_user_id): одночасно діє
-- щонайбільше одне обмеження на людину — повторний кік лише
-- оновлює/продовжує той самий рядок (UPSERT, див. ConfinementRepository).
CREATE TABLE IF NOT EXISTS room_confinements (
    id SERIAL PRIMARY KEY,
    target_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    confined_room VARCHAR(64) NOT NULL,
    source_room VARCHAR(64),
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_room_confinements_active
    ON room_confinements(target_user_id) WHERE revoked_at IS NULL;

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
