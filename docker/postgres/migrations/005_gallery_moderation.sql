-- Міграція для вже існуючої БД: модерація фотогалереї.
--  * кожне завантажене фото спочатку 'pending' (не перевірене) і не видно
--    в загальній галереї; після схвалення — 'approved' (видно всім);
--  * право перевіряти фото: admin/superadmin завжди, moderator — лише якщо
--    йому видано can_review_photos (видає admin у "Керування роллю").
-- Фото, завантажені до цієї міграції, стають 'pending' (їх ще ніхто не перевіряв).
-- Запуск (dev):
--   docker exec -i chat-postgres-dev psql -U postgre -d postgre < docker/postgres/migrations/005_gallery_moderation.sql
ALTER TABLE user_gallery_photos ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'pending';
ALTER TABLE user_gallery_photos ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE user_gallery_photos ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_gallery_photos_status_check'
    ) THEN
        ALTER TABLE user_gallery_photos ADD CONSTRAINT user_gallery_photos_status_check
            CHECK (status IN ('pending', 'approved'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_gallery_photos_status
    ON user_gallery_photos(status, id DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS can_review_photos BOOLEAN NOT NULL DEFAULT FALSE;
