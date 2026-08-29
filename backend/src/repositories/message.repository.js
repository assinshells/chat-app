import { pool } from "../config/database.js";
import { DEFAULT_ROOM } from "../constants/chat.constants.js";

const SELECT_WITH_AUTHOR = `
  SELECT m.id, m.text, m.created_at, m.author_id, m.room,
         u.login AS author_login, u.color AS author_color
  FROM messages m
  JOIN users u ON u.id = m.author_id
`;

export const MessageRepository = {
  async create({ authorId, text, room = DEFAULT_ROOM }) {
    const { rows } = await pool.query(
      `INSERT INTO messages (author_id, room, text) VALUES ($1, $2, $3)
       RETURNING id, text, created_at, author_id, room`,
      [authorId, room, text],
    );
    return rows[0];
  },

  /**
   * findRecent — последние `limit` сообщений room в хронологическом
   * порядке (старые -> новые), готовые к прямому рендеру в ленте.
   */
  async findRecent(room = DEFAULT_ROOM, limit = 50) {
    const { rows } = await pool.query(
      `${SELECT_WITH_AUTHOR}
       WHERE m.room = $1
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $2`,
      [room, limit],
    );
    return rows.reverse();
  },
};