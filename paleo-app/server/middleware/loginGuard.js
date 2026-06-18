/**
 * loginGuard.js
 * Limiteur anti-force-brute pour /api/auth/login.
 *
 * Même esprit que submissionGuard / uploadGuard : compteur en mémoire par IP,
 * fenêtre glissante. Suffisant en mono-instance (o2switch). Les compteurs sont
 * remis à zéro au redémarrage du serveur — acceptable pour ce besoin.
 *
 * On compte TOUTES les tentatives par IP (succès comme échec) : une connexion
 * normale en fait 1 à 3, donc une limite généreuse ne gêne pas les utilisateurs
 * légitimes tout en bloquant le bourrage d'identifiants.
 */
import { dispatchEvent } from '../services/eventDispatcher.js';

// Helper local : journalisation fire-and-forget (jamais bloquante).
const dispatch = (args) => { dispatchEvent(args).catch(() => {}); };

const WINDOW_MS    = Number(process.env.LOGIN_WINDOW_MS)   || 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 15;

const attempts = new Map(); // ip -> { count, resetAt }

export function loginRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  // Purge paresseuse pour éviter une croissance non bornée de la Map.
  if (attempts.size > 10000) {
    for (const [k, v] of attempts) { if (now > v.resetAt) attempts.delete(k); }
  }

  let rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, rec);
  }
  rec.count += 1;

  if (rec.count > MAX_ATTEMPTS) {
    // Journaliser une seule fois, au franchissement du seuil — pas à chaque
    // requête suivante de la même fenêtre, sinon une attaque noierait le journal.
    if (rec.count === MAX_ATTEMPTS + 1) {
      dispatch({ type: 'auth.locked_out', req, actorEmail: req.body?.email ?? null, summary: `IP ${ip}`, payload: { ip, email: req.body?.email ?? null, attempts: rec.count } });
    }
    const mins = Math.max(1, Math.ceil((rec.resetAt - now) / 60000));
    return res.status(429).json({
      error: `Trop de tentatives de connexion. Réessayez dans ${mins} minute(s).`,
    });
  }
  next();
}
