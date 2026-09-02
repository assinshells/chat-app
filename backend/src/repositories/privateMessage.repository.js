import { pool } from "../config/database.js";

const SELECT_WITH_PARTIES = `
  SELECT pm.id, pm.text, pm.created_at, pm.sender_id, pm.recipient_id,
         s.login AS sender_login, s.color AS sender_color,
         r.login AS recipient_login
  FROM private_messages pm
  JOIN users s ON s.id = pm.sender_id
  JOIN users r ON r.id = pm.recipient_id
`;

export const PrivateMessageRepository = {
  async create({ senderId, recipientId, text }) {
    const { rows } = await pool.query(
      `INSERT INTO private_messages (sender_id, recipient_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, text, created_at, sender_id, recipient_id`,
      [senderId, recipientId, text],
    );
    return rows[0];
  },

  /**
   * findConversation — усе листування між двома КОНКРЕТНИМИ людьми
   * (в обидва боки), останні `limit` повідомлень у хронологічному
   * порядку (старі -> нові), готові до прямого рендеру. userIdA/
   * userIdB не обов'язково мають бути відсортовані — порівнюються в
   * обидва боки, порядок аргументів не важливий (див. idx_private_messages_pair
   * у init.sql, який побудований через LEAST/GREATEST саме під цей
   * запит).
   */
  async findConversation(userIdA, userIdB, limit = 50) {
    const { rows } = await pool.query(
      `${SELECT_WITH_PARTIES}
       WHERE (pm.sender_id = $1 AND pm.recipient_id = $2)
          OR (pm.sender_id = $2 AND pm.recipient_id = $1)
       ORDER BY pm.created_at DESC, pm.id DESC
       LIMIT $3`,
      [userIdA, userIdB, limit],
    );
    return rows.reverse();
  },

  /**
   * findConversationsList — по одному "останньому повідомленню" на
   * кожного співрозмовника, з яким userId коли-небудь писав/отримував,
   * для списку діалогів у DirectMessagesModal (вертикальні вкладки).
   * DISTINCT ON + сортування всередині тієї самої колонки — стандартний
   * Postgres-патерн "останній запис у кожній групі" без віконних функцій.
   */
  async findConversationsList(userId, limit = 50) {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
         other_user_id,
         other_login,
         other_color,
         text AS last_text,
         created_at AS last_at,
         is_own
       FROM (
         SELECT
           CASE WHEN pm.sender_id = $1 THEN pm.recipient_id ELSE pm.sender_id END AS other_user_id,
           CASE WHEN pm.sender_id = $1 THEN r.login ELSE s.login END AS other_login,
           CASE WHEN pm.sender_id = $1 THEN r.color ELSE s.color END AS other_color,
           pm.id,
           pm.text,
           pm.created_at,
           (pm.sender_id = $1) AS is_own
         FROM private_messages pm
         JOIN users s ON s.id = pm.sender_id
         JOIN users r ON r.id = pm.recipient_id
         WHERE pm.sender_id = $1 OR pm.recipient_id = $1
       ) AS conversation
       -- id DESC як вторинний тай-брейкер: created_at у повідомлень,
       -- вставлених в одній транзакції/тій самій мілісекунді, може
       -- збігтися (NOW() у Postgres фіксується один раз на транзакцію),
       -- id AUTOINCREMENT гарантовано однозначний.
       ORDER BY other_user_id, last_at DESC, id DESC
       LIMIT $2`,
      [userId, limit],
    );
    return rows.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
  },
};
