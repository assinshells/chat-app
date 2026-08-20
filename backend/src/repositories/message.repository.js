import { pool } from "../config/database.js";

export const MessageRepository = {
  /**
   * Keyset-пагинация по id (не OFFSET — тот деградирует на больших
   * чатах, т.к. БД всё равно сканирует и отбрасывает все пропущенные
   * строки). beforeId не передан → отдаём самую свежую страницу;
   * дальнейшая подгрузка "истории выше" идёт через beforeId = id
   * самого старого уже загруженного сообщения.
   * Строки возвращаются в хронологическом порядке (старые → новые).
   */
  async findByRoom(roomId, { limit, beforeId } = {}) {
    const params = [roomId];
    let where = "m.room_id = $1";
    if (beforeId) {
      params.push(beforeId);
      where += ` AND m.id < $${params.length}`;
    }
    params.push(limit);

    const { rows } = await pool.query(
      `SELECT m.id, m.room_id, m.user_id, m.content, m.created_at,
              u.login AS author_login
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE ${where}
       ORDER BY m.id DESC
       LIMIT $${params.length}`,
      params,
    );
    return rows.reverse();
  },

  /**
   * author_login подтягивается подзапросом прямо в RETURNING — чтобы
   * не делать второй SELECT ради JOIN с users после INSERT (он нужен
   * сразу для Socket.IO-рассылки: клиенты ждут готовое имя автора).
   */
  async create({ roomId, userId, content }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (room_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, content, created_at,
         (SELECT login FROM users WHERE id = $2) AS author_login`,
      [roomId, userId, content],
    );
    return rows[0];
  },
};
