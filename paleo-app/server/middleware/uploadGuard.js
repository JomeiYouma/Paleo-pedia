/**
 * uploadGuard — Rate limit per IP pour les uploads d'image anonymes.
 *
 * Les utilisateurs authentifiés ne sont pas limités (la création de cartel est
 * elle-même gated côté permissions). Les visiteurs anonymes sont limités à
 * MAX_ANON_UPLOADS_PER_WINDOW uploads sur une fenêtre glissante de WINDOW_MS.
 *
 * Implémentation en mémoire : Map { ip → { count, windowStart } }. Redémarrage
 * du serveur = reset. Pour un hébergement mono-instance comme o2switch c'est
 * suffisant — sur du multi-instance il faudrait un store partagé (Redis).
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_ANON_UPLOADS_PER_WINDOW = 20;

const uploadsByIp = new Map();

// Nettoyage lazy : toutes les 100 requêtes, on purge les entrées expirées
let tickSinceCleanup = 0;
function maybeCleanup(now) {
  if (++tickSinceCleanup < 100) return;
  tickSinceCleanup = 0;
  for (const [ip, entry] of uploadsByIp) {
    if (now - entry.windowStart > WINDOW_MS) uploadsByIp.delete(ip);
  }
}

export function uploadGuard(req, res, next) {
  // Bypass pour utilisateurs authentifiés
  if (req.user) return next();

  const ip = req.ip || 'unknown';
  const now = Date.now();
  maybeCleanup(now);

  const entry = uploadsByIp.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    uploadsByIp.set(ip, { count: 1, windowStart: now });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_ANON_UPLOADS_PER_WINDOW) {
    return res.status(429).json({
      error: `Limite atteinte : maximum ${MAX_ANON_UPLOADS_PER_WINDOW} images par heure par adresse IP.`,
    });
  }
  next();
}
