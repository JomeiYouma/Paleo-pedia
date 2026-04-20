import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes/index.js';
import { UPLOADS_DIR, LEGACY_UPLOADS_DIR } from './controllers/uploadController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Trust proxy ──────────────────────────────────────────────
// o2switch (et la plupart des hébergeurs) fait passer les requêtes via
// Apache/Passenger. Sans ce réglage, req.ip vaut l'IP de la loopback et
// X-Forwarded-For peut être forgé. Le nombre de hops est configurable via
// TRUST_PROXY (défaut "1" = un seul proxy connu devant Node).
app.set('trust proxy', process.env.TRUST_PROXY ?? 1);

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  // En production, limiter CORS au domaine déclaré dans ALLOWED_ORIGIN
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
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

// ── Front React (production uniquement) ─────────────────────
// Sert le build Vite et assure le fallback SPA (react-router)
const distPath = path.join(__dirname, '..', 'dist');
if (isProd && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback : toute route non-API renvoie index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── 404 API ──────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`\n🌿 paleo-api démarré sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}\n`);
});