/**
 * mailer.js
 * Wrapper nodemailer + transport SMTP partagé.
 * Configuration via .env :
 *   MAIL_SMTP_HOST, MAIL_SMTP_PORT (par défaut 587), MAIL_SMTP_SECURE (true|false),
 *   MAIL_SMTP_USER, MAIL_SMTP_PASS,
 *   MAIL_FROM (ex: '"Paléo" <hello@atelier21.org>')
 *
 * Si la config SMTP est incomplète, sendMail() est un no-op (warn dans la console).
 * Cela évite de planter l'app en dev quand aucun serveur SMTP n'est configuré.
 */

import nodemailer from 'nodemailer';

let transporterCache = null;
let warnedMissing = false;

function getTransporter() {
  if (transporterCache !== null) return transporterCache;

  const host = process.env.MAIL_SMTP_HOST;
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASS;

  if (!host || !user || !pass) {
    if (!warnedMissing) {
      console.warn('[mailer] SMTP non configuré (MAIL_SMTP_HOST/USER/PASS manquants). Les emails ne seront pas envoyés.');
      warnedMissing = true;
    }
    transporterCache = false;  // false = pas de transport, mais on ne re-warn pas
    return false;
  }

  const port   = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const secure = String(process.env.MAIL_SMTP_SECURE || (port === 465)).toLowerCase() === 'true';

  transporterCache = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
  });
  return transporterCache;
}

/**
 * Envoie un email. Async fire-and-forget : ne rejette jamais (capture en interne).
 * @param {object} args
 * @param {string} args.to
 * @param {string} args.subject
 * @param {string} args.text
 * @param {string} [args.html]
 * @param {boolean} [args.markAsSpam] - ajoute X-Spam-Flag: YES (utile pour règles de tri)
 */
export async function sendMail({ to, subject, text, html, markAsSpam = false }) {
  const transporter = getTransporter();
  if (!transporter) return { skipped: true };
  if (!to) return { skipped: true };

  try {
    const headers = {};
    if (markAsSpam) {
      headers['X-Spam-Flag'] = 'YES';
      headers['X-Spam-Marked-By'] = 'paleo-event-dispatcher';
    }
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_SMTP_USER,
      to,
      subject,
      text,
      html: html || undefined,
      headers,
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[mailer] Échec envoi :', err.message);
    return { error: err.message };
  }
}

/** Pour tests : reset le cache (force re-lecture des env vars). */
export function _resetTransporter() { transporterCache = null; warnedMissing = false; }
