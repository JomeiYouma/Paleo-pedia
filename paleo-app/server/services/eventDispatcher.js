/**
 * eventDispatcher.js
 * Point unique de journalisation des événements applicatifs.
 *
 *   - INSERT dans event_logs (toujours)
 *   - Si event_email_config[type].enabled, envoi mail (asynchrone, non-bloquant)
 *
 * Conçu pour être appelé en fire-and-forget depuis les contrôleurs :
 *
 *   dispatchEvent({ type, req, targetId, summary, payload }).catch(() => {});
 *
 * Le dispatcher avale ses propres erreurs (logue la console mais ne propage
 * jamais), pour ne jamais faire échouer l'action métier qu'il instrumente.
 */

import { EventLogModel }         from '../models/EventLog.js';
import { EventEmailConfigModel } from '../models/EventEmailConfig.js';
import { sendMail }              from './mailer.js';
import { renderEventEmail }      from './emailTemplates.js';

/**
 * @param {object} args
 * @param {string} args.type        - identifiant du type d'événement (cartel.created, etc.)
 * @param {object} [args.req]       - express req (extrait actor depuis req.user)
 * @param {string} [args.actorId]
 * @param {string} [args.actorEmail]
 * @param {string} [args.targetId]
 * @param {string} [args.subsiteId]
 * @param {string} [args.summary]   - texte court (titre cartel, email user…)
 * @param {object} [args.payload]   - détails JSON (anciennes/nouvelles valeurs, etc.)
 */
export async function dispatchEvent({ type, req, actorId, actorEmail, targetId, subsiteId, summary = '', payload = null } = {}) {
  if (!type) return;

  // Extraction actor depuis req.user si fourni
  let aId = actorId ?? null;
  let aEmail = actorEmail ?? null;
  if (req?.user) {
    aId = aId ?? req.user.id ?? null;
    aEmail = aEmail ?? req.user.email ?? null;
  }

  // 1) Toujours logguer en BDD
  try {
    await EventLogModel.insert({
      type,
      actorId: aId,
      actorEmail: aEmail,
      subsiteId: subsiteId ?? null,
      targetId: targetId ?? null,
      summary,
      payload,
    });
  } catch (err) {
    console.error(`[eventDispatcher] log INSERT failed (${type}) :`, err.message);
    return; // Si l'INSERT échoue, on ne tente pas le mail (probable souci DB)
  }

  // 2) Email — non bloquant, capture les erreurs en interne
  try {
    const cfg = await EventEmailConfigModel.get(type);
    if (!cfg || !cfg.enabled || !cfg.recipient) return;

    // Mail dédié si ce type en a un (formulaires, soumissions), sinon le
    // format générique d'audit.
    const tpl = renderEventEmail({ type, summary, payload, actorEmail: aEmail, targetId, subsiteId });

    const prefix  = subjectPrefix(cfg.subject_prefix, tpl?.category);
    const subject = `${prefix} ${tpl ? tpl.subject : humanLabel(type) + (summary ? ' — ' + summary : '')}`;
    const text    = tpl ? tpl.text : genericBody({ type, summary, aEmail, targetId, subsiteId, payload });

    // fire-and-forget : on ne await pas pour ne pas bloquer la réponse HTTP
    sendMail({
      to: cfg.recipient,
      subject,
      text,
      replyTo: tpl?.replyTo || undefined,
      markAsSpam: !!cfg.mark_as_spam,
    }).catch(err => console.error('[eventDispatcher] mail :', err.message));
  } catch (err) {
    console.error(`[eventDispatcher] email lookup failed (${type}) :`, err.message);
  }
}

const DEFAULT_PREFIX = '[Paléo]';

/**
 * Préfixe du sujet. Un préfixe personnalisé par l'admin (Configuration emails)
 * gagne toujours ; s'il a laissé le défaut, on l'enrichit de la catégorie du
 * template → « [Paléo · Contact] », pour trier d'un coup d'œil dans la boîte.
 * Exporté pour que scripts/preview_emails.js montre le vrai sujet.
 */
export function subjectPrefix(configured, category) {
  const p = String(configured || '').trim();
  if (p && p !== DEFAULT_PREFIX) return p;
  return category ? `[Paléo · ${category}]` : DEFAULT_PREFIX;
}

/** Format générique : exhaustif pour l'audit, sans prétention de lisibilité. */
function genericBody({ type, summary, aEmail, targetId, subsiteId, payload }) {
  return [
    `Événement : ${type}`,
    summary   ? `Résumé : ${summary}` : null,
    aEmail    ? `Acteur : ${aEmail}` : null,
    targetId  ? `Cible : ${targetId}` : null,
    subsiteId ? `Sous-site : ${subsiteId}` : null,
    payload ? '\nDétails :\n' + JSON.stringify(payload, null, 2) : null,
    '',
    `— Notification automatique Paléo-Énergétique`,
  ].filter(Boolean).join('\n');
}

/** Convertit "cartel.published" en "Cartel published" pour le sujet du mail. */
function humanLabel(type) {
  const [scope, action] = String(type).split('.');
  if (!action) return type;
  return scope.charAt(0).toUpperCase() + scope.slice(1) + ' / ' + action.replace(/_/g, ' ');
}
