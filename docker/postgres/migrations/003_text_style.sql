-- Міграція для вже існуючої БД: жирний/курсивний текст повідомлень
-- (Налаштування -> Зовнішній вигляд). Видно всім у чаті, як і колір.
-- Запуск (dev):
--   docker exec -i chat-postgres-dev psql -U postgre -d postgre < docker/postgres/migrations/003_text_style.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS text_bold BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS text_italic BOOLEAN NOT NULL DEFAULT FALSE;
