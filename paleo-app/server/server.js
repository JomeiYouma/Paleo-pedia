import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes/index.js';
import { UPLOADS_DIR, LEGACY_UPLOADS_DIR } from './controllers/uploadController.js';
import { injectSocialMeta } from './lib/socialMeta.js';

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

// ── SEO : balises Open Graph servies côté serveur ────────────
// La logique (résolution cartel / sous-site / site principal + réécriture des
// balises) vit dans lib/socialMeta.js — cf. injectSocialMeta plus bas.

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

// ── Anciennes URLs WP (multisite décommissionné) : redirections + SEO ──────
// Le WP de paleo-energetique.org (apex + sous-domaines) est retiré. On redirige
// ce qui doit l'être (com + SEO) en 301, et on renvoie 410 (Gone) pour le reste :
// le sous-domaine abandonné + les pages de spam injectées par le hack WP.
// Basé sur req.hostname (fiable via trust proxy). Inerte sur les autres hosts.
const LEGACY_HOST_301 = {
  // aero.paleo-energetique.org : PAS ici — c'est un host dédié qui SERT le
  // sous-site paleo-aerospace (cf. HOST_TO_SUBSITE_SLUG), pas une redirection.
  'cyclo.paleo-energetique.org': 'https://paleo-pedia.org',
  'paleo-pedia.com':             'https://paleo-pedia.org',
  'www.paleo-pedia.com':         'https://paleo-pedia.org',
};
const LEGACY_HOST_410 = new Set(['stockage.paleo-energetique.org']);
// Spam injecté par le WP piraté : slug se terminant par "-k-<chiffres>".
const SPAM_PATH = /-k-\d+\/?$/;
app.use((req, res, next) => {
  const dest = LEGACY_HOST_301[req.hostname];
  if (dest) return res.redirect(301, dest);
  if (LEGACY_HOST_410.has(req.hostname) || SPAM_PATH.test(req.path)) {
    return res.status(410).type('text/plain').send('410 Gone');
  }
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

  // index: false → les requêtes « de répertoire » (« / », « /frise »…) ne sont
  // PAS court-circuitées par le index.html statique : elles tombent dans le
  // fallback ci-dessous pour recevoir leurs balises OG contextuelles. Sinon un
  // sous-site partagé à sa racine hériterait des balises génériques du site.
  app.use(express.static(distPath, { index: false }));

  // index.html est figé après le build → lu une fois au démarrage.
  const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');

  // Fallback SPA : toute route non-API renvoie index.html, avec les balises
  // Open Graph adaptées au contexte (cartel / sous-site / site principal — cf.
  // lib/socialMeta.js). Repli silencieux sur le HTML brut en cas d'erreur.
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    try {
      res.type('html').send(await injectSocialMeta(indexHtml, req));
    } catch {
      res.type('html').send(indexHtml);
    }
  });
}

// ── 404 API ──────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }));

app.listen(PORT, () => {
  console.log(`\n🌿 paleo-api démarré sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}\n`);
});