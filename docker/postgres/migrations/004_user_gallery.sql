-- Міграція для вже існуючої БД: фотогалерея профілю (Профіль → Фотогалерея).
-- До 10 фото на користувача (ліміт перевіряється на бекенді в транзакції).
-- Запуск (dev):
--   docker exec -i chat-postgres-dev psql -U postgre -d postgre < docker/postgres/migrations/004_user_gallery.sql
CREATE TABLE IF NOT EXISTS user_gallery_photos (
    id BIGSERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mime VARCHAR(32) NOT NULL,
    size INTEGER NOT NULL,
    data BYTEA NOT NULL,
    thumb_mime VARCHAR(32) NOT NULL,
    thumb BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_gallery_photos_owner
    ON user_gallery_photos(owner_id, created_at DESC);
