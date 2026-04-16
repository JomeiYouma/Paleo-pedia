import mysql from 'mysql2/promise';
import 'dotenv/config';

// Supporte deux modes de config :
//   1. DATABASE_URL="mysql://user:pass@host:port/db"  (variable unique)
//   2. DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD (variables séparées)
//      → utile quand cPanel encode mal les caractères spéciaux dans l'URL
const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = mysql.createPool({
  ...poolConfig,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
});

/** Exécute une requête paramétrée (utiliser ? comme placeholders) */
export async function query(text, params = []) {
  const start = Date.now();
  const [rows] = await pool.query(text, params);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL] ${text.slice(0, 60)}... (${Date.now() - start}ms)`);
  }
  return { rows: Array.isArray(rows) ? rows : [rows] };
}

/** Fournit un client pour les transactions */
export async function getClient() {
  const conn = await pool.getConnection();
  return {
    query: async (text, params = []) => {
      const [rows] = await conn.query(text, params);
      return { rows: Array.isArray(rows) ? rows : [rows] };
    },
    release: () => conn.release(),
  };
}

export default pool;
