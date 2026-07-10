/**
 * send_click_digest.js
 * Envoi MANUEL du récapitulatif des clics boutique (test, ou cron externe
 * optionnel si on préfère ne pas dépendre du planificateur in-process).
 *
 * Usage :
 *   node server/scripts/send_click_digest.js            # fenêtre = 24 dernières heures
 *   node server/scripts/send_click_digest.js --hours=48 # fenêtre personnalisée
 *   node server/scripts/send_click_digest.js --to=me@ex.org  # force le destinataire
 *
 * Contrairement au scheduler, ce script IGNORE l'heure d'envoi et le garde
 * anti-doublon (last_sent) : il tente l'envoi immédiatement. Il respecte quand
 * même « rien à envoyer si aucun clic ». Le destinataire par défaut = celui
 * configuré (shop_click_digest_recipient) ; --to le surcharge.
 */
import 'dotenv/config';
import { getDigestConfig, sendClickDigest } from '../services/clickDigest.js';

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const hours = parseInt(getArg('hours') || '24', 10);
const overrideTo = getArg('to');

const cfg = await getDigestConfig();
const recipient = overrideTo || cfg.recipient;

if (!recipient) {
  console.error('❌ Aucun destinataire (ni --to=, ni shop_click_digest_recipient en base).');
  process.exit(1);
}

const until = new Date();
const since = new Date(until.getTime() - Math.max(1, hours) * 60 * 60 * 1000);

console.log(`Fenêtre : ${since.toISOString()} → ${until.toISOString()}`);
console.log(`Destinataire : ${recipient}`);

const result = await sendClickDigest({ since, until, recipient });

if (result.skipped) console.log('Ignoré :', result.skipped);
else if (!result.sent) console.log('Aucun clic sur la période — aucun email envoyé.');
else console.log(`✅ Email envoyé : ${result.clicks} clic(s), ${result.ips} IP.`);

process.exit(0);
