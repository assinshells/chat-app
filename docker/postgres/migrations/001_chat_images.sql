-- Міграція для вже існуючої БД: зображення-вкладення.
-- Запуск (dev):
--   docker exec -i chat-postgres-dev psql -U postgre -d postgre < docker/postgres/migrations/001_chat_images.sql
CREATE TABLE IF NOT EXISTS chat_images (
    id BIGSERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope VARCHAR(8) NOT NULL CHECK (scope IN ('room', 'dm')),
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mime VARCHAR(32) NOT NULL,
    size INTEGER NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS image_id BIGINT REFERENCES chat_images(id) ON DELETE SET NULL;
ALTER TABLE private_messages
    ADD COLUMN IF NOT EXISTS image_id BIGINT REFERENCES chat_images(id) ON DELETE SET NULL;
