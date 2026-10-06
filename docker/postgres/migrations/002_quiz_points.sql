-- Міграція для вже існуючої БД: бали вікторини.
-- Запуск (dev):
--   docker exec -i chat-postgres-dev psql -U postgre -d postgre < docker/postgres/migrations/002_quiz_points.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_points_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_points_check CHECK (points >= 0);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
