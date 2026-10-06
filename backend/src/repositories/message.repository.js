import { pool } from "../config/database.js";
import { DEFAULT_ROOM } from "../constants/chat.constants.js";

const SELECT_WITH_AUTHOR = `
  SELECT m.id, m.text, m.created_at, m.author_id, m.room, m.image_id,
         u.login AS author_login, u.color AS author_color,
         u.text_bold AS author_bold, u.text_italic AS author_italic
  FROM messages m
  JOIN users u ON u.id = m.author_id
`;

export const MessageRepository = {
  /**
   * create — зберігає повідомлення. Якщо є image ({data, mime, size}),
   * картинка і повідомлення вставляються ОДНИМ запитом (CTE) — атомарно,
   * без "осиротілих" зображень, якщо вставка повідомлення впаде.
   */
  async create({ authorId, text, room = DEFAULT_ROOM, image = null }) {
    if (!image) {
      const { rows } = await pool.query(
        `INSERT INTO messages (author_id, room, text) VALUES ($1, $2, $3)
         RETURNING id, text, created_at, author_id, room, image_id`,
        [authorId, room, text],
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `WITH img AS (
         INSERT INTO chat_images (owner_id, scope, mime, size, data)
         VALUES ($1, 'room', $2, $3, $4)
         RETURNING id
       )
       INSERT INTO messages (author_id, room, text, image_id)
       VALUES ($1, $5, $6, (SELECT id FROM img))
       RETURNING id, text, created_at, author_id, room, image_id`,
      [authorId, image.mime, image.size, image.data, room, text],
    );
    return rows[0];
  },

  /**
   * findRecent — останні `limit` повідомлень room у хронологічному
   * порядку (старі -> нові), готові до прямого рендеру в стрічці.
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