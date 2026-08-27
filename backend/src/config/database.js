import pg from "pg";
import logger from "./logger.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false,
});

pool.on("error", (err) => {
  logger.error(`PostgreSQL pool error: ${err.message}`);
});

const connectDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    logger.info("PostgreSQL connected successfully");
  } catch (err) {
    const detail = err?.message || err?.code || JSON.stringify(err);
    logger.error(`PostgreSQL connection failed: ${detail}`);
    logger.debug(
      `PostgreSQL error object: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`,
    );
    throw err;
  } finally {
    if (client) client.release();
  }
};

export { pool, connectDatabase };