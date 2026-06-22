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

// ── Garde de configuration : secret JWT obligatoire ──────────
// Sans JWT_SECRET, la signature des tokens échoue (donc toute connexion).
// On échoue tôt et clairement en production plutôt que de planter de façon
// obscure à la première tentative de connexion.
if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error('❌ JWT_SECRET non défini. Démarrage refusé en production.');
    process.exit(1);
  } else {
    console.warn('⚠️  JWT_SECRET non défini : la connexion échouera. Définissez-le dans votre .env.');
  }
}

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
    `<title>${title} Paléo-Énergétique</title>`,
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

// ── En-têtes de sécurité (toutes réponses) ───────────────────
// Durcissement « standard » sans CSP stricte globale : on évite de casser la
// vue 3D (three.js), les cartes Leaflet et les embeds (YouTube, Calaméo,
// Sketchfab). La neutralisation des SVG se fait plus bas, sur /api/images.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0'); // filtre legacy désactivé (bonne pratique moderne)
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), browsing-topics=()');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ── CORS ─────────────────────────────────────────────────────
// ALLOWED_ORIGIN : origines autorisées, séparées par des virgules. En
// production sans valeur, on n'émet AUCUN en-tête CORS (l'app et l'API sont
// servies en same-origin, rien à autoriser en cross-origin). En dev, on
// autorise « * » pour le proxy Vite.
const corsOrigins = (process.env.ALLOWED_ORIGIN || (isProd ? '' : '*'))
  .split(',').map(s => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Servir les images uploadées ───────────────────────────────
// Neutralisation XSS : un SVG malveillant ouvert DIRECTEMENT (navigation
// top-level vers /api/images/x.svg) pourrait exécuter du JavaScript. On pose
// une CSP « sandbox » sur les réponses .svg (scripts neutralisés) et nosniff
// sur toutes les images. L'affichage via <img> reste inchangé.
const imageStaticHeaders = (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (filePath.toLowerCase().endsWith('.svg')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
};
app.use('/api/images', express.static(UPLOADS_DIR, { setHeaders: imageStaticHeaders }));
app.use('/api/images', express.static(LEGACY_UPLOADS_DIR, { setHeaders: imageStaticHeaders }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// ── Healthcheck ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Front React (production uniquement) ─────────────────────
// Sert le build Vite et assure le fallback SPA (react-router)
const distPath = path.join(__dirname, '..', 'dist');
if (isProd && fs.existsSync(distPath)) {
  // SEO multi-domaines : robots.txt / sitemap.xml dépendent du host. Le site
  // principal (Paléo-Énergétique) et la vitrine (Paléo-Pédia) partagent cette
  // même app mais exposent des URLs distinctes. On sert donc une variante par
  // domaine AVANT le static (sinon express.static renverrait le même fichier
  // à tous les hosts). req.hostname suit X-Forwarded-Host via trust proxy.
  const PEDIA_HOSTS = new Set(['paleo-pedia.org', 'www.paleo-pedia.org']);
  app.get('/robots.txt', (req, res) =>
    res.sendFile(path.join(distPath, PEDIA_HOSTS.has(req.hostname) ? 'robots-pedia.txt' : 'robots.txt')));
  app.get('/sitemap.xml', (req, res) =>
    res.sendFile(path.join(distPath, PEDIA_HOSTS.has(req.hostname) ? 'sitemap-pedia.xml' : 'sitemap.xml')));

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