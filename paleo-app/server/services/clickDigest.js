/**
 * clickDigest.js
 * Récapitulatif QUOTIDIEN des clics sur les liens de paiement Stripe.
 *
 * Alternative « anti-spam » à l'email par événement (shop_item.checkout_click) :
 * plutôt qu'un mail à chaque clic, un superadmin peut activer un unique mail par
 * jour listant, par adresse IP, le nombre de clics et les produits concernés.
 * Le mail n'est envoyé QUE s'il y a eu au moins un clic sur la période.
 *
 * Config stockée dans la table `settings` (pas un type d'event) :
 *   - shop_click_digest_enabled    : '1' | '0'
 *   - shop_click_digest_recipient  : email destinataire
 *   - shop_click_digest_last_sent  : ISO timestamp du dernier envoi (interne)
 *
 * Déclenchement : planificateur in-process (startClickDigestScheduler), garde
 * anti-doublon en base (last_sent) → survit aux redémarrages, ne double jamais.
 * Aucun cron externe requis. Un script (scripts/send_click_digest.js) permet un
 * envoi manuel/cron optionnel.
 */

import { EventLogModel } from '../models/EventLog.js';
import { SettingModel }  from '../models/Setting.js';
import { sendMail }      from './mailer.js';

export const CLICK_EVENT_TYPE = 'shop_item.checkout_click';

const KEY_ENABLED   = 'shop_click_digest_enabled';
const KEY_RECIPIENT = 'shop_click_digest_recipient';
const KEY_LAST_SENT = 'shop_click_digest_last_sent';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Heure d'envoi quotidienne (0–23), configurable via CLICK_DIGEST_HOUR (défaut 8h). */
function sendHour() {
  const h = parseInt(process.env.CLICK_DIGEST_HOUR ?? '8', 10);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : 8;
}

/** Lit la config du récap depuis `settings`. */
export async function getDigestConfig() {
  const [enabled, recipient, lastSent] = await Promise.all([
    SettingModel.get(KEY_ENABLED),
    SettingModel.get(KEY_RECIPIENT),
    SettingModel.get(KEY_LAST_SENT),
  ]);
  return {
    enabled:   enabled === '1' || enabled === 'true',
    recipient: recipient || '',
    lastSent:  lastSent || null,
  };
}

/**
 * Met à jour la config. En passant d'inactif→actif, on initialise `last_sent`
 * à maintenant pour que le PREMIER récap parte le lendemain (pas de rattrapage
 * surprise des dernières 24 h à l'activation).
 * @param {object} patch - { enabled?:boolean, recipient?:string }
 */
export async function setDigestConfig(patch = {}, now = new Date()) {
  const current = await getDigestConfig();
  const pairs = {};
  if ('recipient' in patch) pairs[KEY_RECIPIENT] = String(patch.recipient || '').slice(0, 255);
  if ('enabled' in patch) {
    pairs[KEY_ENABLED] = patch.enabled ? '1' : '0';
    if (patch.enabled && !current.enabled && !current.lastSent) {
      pairs[KEY_LAST_SENT] = now.toISOString();
    }
  }
  if (Object.keys(pairs).length) await SettingModel.setMany(pairs);
  return getDigestConfig();
}

/**
 * Agrège les clics d'une période en un texte de mail, groupé par IP.
 * @returns {{ clicks:number, ips:number, text:string }|null} null si aucun clic.
 */
export async function buildDigest({ since, until }) {
  // Volume attendu faible : on tire la fenêtre et on agrège en JS (l'IP vit
  // dans le payload JSON, pas dans une colonne indexable).
  const { items, total } = await EventLogModel.list({
    types: [CLICK_EVENT_TYPE],
    since: since.toISOString(),
    limit: 500,
  });
  // Fenêtre haute : EventLogModel filtre `created_at >= since` ; on borne aussi
  // le haut pour ne pas compter un clic arrivé APRÈS le déclenchement.
  const rows = items.filter((it) => new Date(it.created_at) <= until);
  if (!rows.length) return null;

  const byIp = new Map(); // ip → { count, products: Map(label→n) }
  for (const it of rows) {
    const ip = (it.payload && it.payload.ip) || 'IP inconnue';
    if (!byIp.has(ip)) byIp.set(ip, { count: 0, products: new Map() });
    const g = byIp.get(ip);
    g.count += 1;
    const label = it.summary || (it.payload && it.payload.title) || '(article)';
    g.products.set(label, (g.products.get(label) || 0) + 1);
  }

  const ipsSorted = [...byIp.entries()].sort((a, b) => b[1].count - a[1].count);
  const lines = [];
  lines.push(`Période : du ${fmt(since)} au ${fmt(until)}`);
  lines.push('');
  lines.push(`${rows.length} clic(s) au total, ${byIp.size} adresse(s) IP.`);
  if (total > rows.length) lines.push(`(liste tronquée aux 500 événements les plus récents)`);
  lines.push('');
  for (const [ip, g] of ipsSorted) {
    lines.push(`• ${ip} — ${g.count} clic(s)`);
    const prods = [...g.products.entries()].sort((a, b) => b[1] - a[1]);
    for (const [label, n] of prods) lines.push(`    - ${label} ×${n}`);
  }
  lines.push('');
  lines.push('— Notification automatique Paléo-Énergétique');

  return { clicks: rows.length, ips: byIp.size, text: lines.join('\n') };
}

/**
 * Construit ET envoie le récap si des clics existent sur la période.
 * N'envoie rien (et ne jette pas) si aucun clic.
 * @returns {object} résumé de ce qui s'est passé
 */
export async function sendClickDigest({ since, until, recipient }) {
  if (!recipient) return { skipped: 'no-recipient' };
  const digest = await buildDigest({ since, until });
  if (!digest) return { sent: false, clicks: 0 };

  const subject = `[Paléo] Récap quotidien — clics boutique (${digest.clicks} clic(s), ${digest.ips} IP)`;
  await sendMail({ to: recipient, subject, text: digest.text });
  return { sent: true, clicks: digest.clicks, ips: digest.ips };
}

/**
 * Envoie le récap si l'heure est venue et qu'on ne l'a pas déjà fait aujourd'hui.
 * Idempotent sur la journée grâce à `last_sent`. Appelé par le scheduler.
 */
export async function runClickDigestIfDue(now = new Date()) {
  const cfg = await getDigestConfig();
  if (!cfg.enabled || !cfg.recipient) return { skipped: 'disabled' };

  const threshold = new Date(now);
  threshold.setHours(sendHour(), 0, 0, 0);
  if (now < threshold) return { skipped: 'before-hour' };

  const lastSent = cfg.lastSent ? new Date(cfg.lastSent) : null;
  if (lastSent && lastSent >= threshold) return { skipped: 'already-today' };

  // Fenêtre : depuis le dernier passage, sinon 24 h glissantes au premier run.
  const since = lastSent || new Date(now.getTime() - DAY_MS);
  const result = await sendClickDigest({ since, until: now, recipient: cfg.recipient });
  // On marque la journée comme traitée même si 0 clic (pas de renvoi le jour même).
  await SettingModel.set(KEY_LAST_SENT, now.toISOString());
  return result;
}

let _timer = null;

/**
 * Démarre le planificateur in-process. Vérifie toutes les 30 min si le récap
 * du jour est dû (rattrapage inclus au boot après ~1 min, utile si l'app a
 * redémarré après l'heure d'envoi). Non bloquant, avale ses erreurs.
 */
export function startClickDigestScheduler() {
  if (_timer) return; // idempotent (évite un double timer si appelé 2×)
  const tick = () => {
    runClickDigestIfDue().catch((e) => console.error('[clickDigest] tick :', e.message));
  };
  setTimeout(tick, 60_000);            // rattrapage post-boot
  _timer = setInterval(tick, 30 * 60_000);
  if (typeof _timer.unref === 'function') _timer.unref(); // ne bloque pas un arrêt propre
}

function fmt(d) {
  // Format lisible FR sans dépendance : "09/07/2026 08:00".
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
