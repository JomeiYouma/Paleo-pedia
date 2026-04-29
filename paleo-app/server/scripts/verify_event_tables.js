/** Smoke test : vérifie que les tables event_logs / event_email_config existent
 *  et que le seed de event_email_config a bien été chargé. */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(
  process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

const [tables] = await conn.query("SHOW TABLES LIKE 'event_%'");
console.log('Tables event_*:', tables.map(t => Object.values(t)[0]));

const [cfg] = await conn.query('SELECT type, enabled FROM event_email_config ORDER BY type');
console.log(`event_email_config: ${cfg.length} types seedés`);
cfg.slice(0, 5).forEach(r => console.log('  ·', r.type, '→ enabled =', r.enabled));

const [logs] = await conn.query('SELECT COUNT(*) AS n FROM event_logs');
console.log(`event_logs: ${logs[0].n} entrées`);

await conn.end();
