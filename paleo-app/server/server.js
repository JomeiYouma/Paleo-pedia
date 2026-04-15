import 'dotenv/config';
import express from 'express';
import routes from './routes/index.js';
import { UPLOADS_DIR, LEGACY_UPLOADS_DIR } from './controllers/uploadController.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Servir les images uploadées ───────────────────────────────
app.use('/api/images', express.static(UPLOADS_DIR));
app.use('/api/images', express.static(LEGACY_UPLOADS_DIR));

// ── Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// ── Healthcheck ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ─────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`\n🌿 paleo-api démarré sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}\n`);
});