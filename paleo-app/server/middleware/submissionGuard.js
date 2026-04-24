import { SettingModel } from '../models/Setting.js';
import { query } from '../lib/db.js';

/**
 * Middleware de garde sur les soumissions de cartels.
 *
 * Vérifie :
 *  1. Si les soumissions anonymes sont autorisées (setting allow_anonymous_submit)
 *  2. Si l'IP n'a pas dépassé le quota global (max_submissions_per_ip_total)
 *  3. Si l'IP n'a pas dépassé le quota sur la fenêtre glissante (max_submissions_per_ip_window / submission_window_minutes)
 *
 * Si l'utilisateur est authentifié (req.user présent), les limites par IP ne s'appliquent pas.
 */
export async function submissionGuard(req, res, next) {
  try {
    // Utilisateur connecté → toujours autorisé
    if (req.user) return next();

    // Honeypot : champ piège invisible côté client. Rempli = bot quasi certain.
    // Le formulaire pose un <input name="website"> caché en CSS ; un humain ne
    // le voit pas, un scraper le remplit. On répond 400 générique pour ne pas
    // lui donner d'indice sur la cause du rejet.
    if (req.body && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
      return res.status(400).json({ error: 'Requête invalide.' });
    }

    const settings = await SettingModel.getCached();

    // Soumissions anonymes désactivées ?
    if (settings.allow_anonymous_submit !== 'true') {
      return res.status(403).json({
        error: 'Les soumissions anonymes sont désactivées. Veuillez vous connecter.',
      });
    }

    // `req.ip` résolu par Express via `trust proxy` (cf. server.js). Évite
    // d'utiliser `x-forwarded-for` brut — un client peut poser sa propre en-tête
    // et spoofer l'IP s'il prend la 1ʳᵉ valeur.
    const ip = req.ip || 'unknown';

    const maxTotal  = parseInt(settings.max_submissions_per_ip_total,  10) || 10;
    const maxWindow = parseInt(settings.max_submissions_per_ip_window, 10) || 3;
    const windowMin = parseInt(settings.submission_window_minutes,     10) || 60;

    // Compter le total global de submissions pour cette IP
    const { rows: totalRows } = await query(
      'SELECT COUNT(*) AS cnt FROM cartels WHERE submitter_ip = ? AND created_by IS NULL',
      [ip]
    );
    const totalCount = Number(totalRows[0]?.cnt ?? 0);

    if (totalCount >= maxTotal) {
      return res.status(429).json({
        error: `Limite atteinte : maximum ${maxTotal} soumissions par adresse IP.`,
      });
    }

    // Compter les soumissions récentes (fenêtre glissante)
    const windowStart = new Date(Date.now() - windowMin * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    const { rows: windowRows } = await query(
      'SELECT COUNT(*) AS cnt FROM cartels WHERE submitter_ip = ? AND created_by IS NULL AND created_at >= ?',
      [ip, windowStart]
    );
    const windowCount = Number(windowRows[0]?.cnt ?? 0);

    if (windowCount >= maxWindow) {
      return res.status(429).json({
        error: `Trop de soumissions : maximum ${maxWindow} en ${windowMin} minutes par adresse IP.`,
      });
    }

    // Injecter l'IP dans la requête pour que le contrôleur puisse la stocker
    req.submitterIp = ip;
    next();
  } catch (err) {
    console.error('[submissionGuard]', err.message);
    // En cas d'erreur DB sur le guard, on laisse passer (fail open)
    next();
  }
}
