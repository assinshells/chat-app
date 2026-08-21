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
      `SELECT m.id, m.room_id, m.user_id, m.content, m.created_at, m.recipient_ids,
              u.login AS author_login,
              COALESCE(
                (SELECT array_agg(ru.login ORDER BY array_position(m.recipient_ids, ru.id))
                 FROM users ru WHERE ru.id = ANY(m.recipient_ids)),
                '{}'
              ) AS recipient_logins
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
   * author_login и recipient_logins подтягиваются подзапросами прямо в
   * RETURNING — чтобы не делать второй SELECT ради JOIN с users после
   * INSERT (они нужны сразу для Socket.IO-рассылки: клиенты ждут
   * готовые имена, а не голые id).
   * recipientIds уже отфильтрован и провалидирован в
   * MessageService (существующие пользователи, не сам отправитель,
   * не больше MAX_RECIPIENTS) — репозиторий просто пишет то, что дали.
   */
  async create({ roomId, userId, content, recipientIds = [] }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (room_id, user_id, content, recipient_ids)
       VALUES ($1, $2, $3, $4)
       RETURNING id, room_id, user_id, content, created_at, recipient_ids,
         (SELECT login FROM users WHERE id = $2) AS author_login,
         COALESCE(
           (SELECT array_agg(ru.login ORDER BY array_position($4::int[], ru.id))
            FROM users ru WHERE ru.id = ANY($4::int[])),
           '{}'
         ) AS recipient_logins`,
      [roomId, userId, content, recipientIds],
    );
    return rows[0];
  },
};