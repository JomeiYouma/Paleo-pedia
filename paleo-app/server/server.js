import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes/index.js';
import { UPLOADS_DIR, LEGACY_UPLOADS_DIR } from './controllers/uploadController.js';
import { CartelModel } from './models/Cartel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// ── SEO : balises Open Graph pour les pages cartel ───────────
// Un SPA pose ses balises en JS, que les crawlers des réseaux sociaux
// n'exécutent pas. On injecte donc les balises OG (titre, description, image
// du cartel) directement dans le HTML servi pour /cartel/:id.
const escapeHtml = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// URL absolue d'image depuis les formats stockés (http…, /api/images/…,
// images/…). cf. memory « legacy image paths ».
const absoluteImageUrl = (base, p) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return base + p;
  return base + '/api/images/' + p.replace(/^images\//, '');
};

// Injecte le <title> + les balises OG/Twitter du cartel dans index.html.
const injectCartelMeta = (html, cartel, pageUrl, base) => {
  const title = escapeHtml(cartel.titre || cartel.titre_en || 'Cartel');
  const descRaw = stripHtml(cartel.description || cartel.description_en || '');
  const desc = escapeHtml(descRaw.length > 200 ? descRaw.slice(0, 197) + '…' : descRaw);
  const img = absoluteImageUrl(base, cartel.image_path);
  const tags = [
    `<title>${title} — Paléo-Énergétique</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Paléo-Énergétique" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    img ? `<meta property="og:image" content="${escapeHtml(img)}" />` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    img ? `<meta name="twitter:image" content="${escapeHtml(img)}" />` : '',
  ].filter(Boolean).join('\n  ');
  // On retire le <title> et les balises OG/Twitter/description par défaut du
  // site (sinon doublons → un crawler peut retenir l'image générique au lieu
  // de celle du cartel), puis on injecte celles du cartel.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\b[^>]*\b(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/gi, '')
    .replace('</head>', `  ${tags}\n</head>`);
};

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Trust proxy ──────────────────────────────────────────────
// o2switch (et la plupart des hébergeurs) fait passer les requêtes via
// Apache/Passenger. Sans ce réglage, req.ip vaut l'IP de la loopback et
// X-Forwarded-For peut être forgé. Le nombre de hops est configurable via
// TRUST_PROXY (défaut "1" = un seul proxy connu devant Node).
app.set('trust proxy', process.env.TRUST_PROXY ?? 1);

// ── Redirect HTTP → HTTPS (prod uniquement) ──────────────────
// Apache/Passenger transmet le protocole réel client via X-Forwarded-Proto.
// On redirige en amont de tout autre middleware pour ne pas gaspiller de CPU
// sur des requêtes qu'on va de toute façon rediriger. En dev (NODE_ENV
// ≠ production), aucune redirection : le header peut être absent.
app.use((req, res, next) => {
  if (isProd && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

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

  // SEO : pages cartel → balises Open Graph injectées (image du cartel sur les
  // réseaux sociaux). Doit précéder le fallback SPA. Repli silencieux sur
  // index.html si le cartel est introuvable ou en cas d'erreur.
  app.get(['/cartel/:id', '/site/:slug/cartel/:id'], async (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(distPath, 'index.html');
    try {
      const html = fs.readFileSync(indexPath, 'utf8');
      const cartel = await CartelModel.findById(req.params.id);
      if (!cartel) return res.send(html);
      const base = `${req.protocol}://${req.get('host')}`;
      res.send(injectCartelMeta(html, cartel, base + req.originalUrl, base));
    } catch {
      res.sendFile(indexPath);
    }
  });

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