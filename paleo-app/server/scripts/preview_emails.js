/** Aperçu des mails métier (emailTemplates.js), sans toucher à la base.
 *  Utile pour ajuster les formulations sans déclencher de vrais événements.
 *
 *  Usage : node server/scripts/preview_emails.js               → affiche
 *          node server/scripts/preview_emails.js --send <mail> → envoie aussi */
import 'dotenv/config';
import { renderEventEmail, TEMPLATED_TYPES } from '../services/emailTemplates.js';
import { subjectPrefix } from '../services/eventDispatcher.js';
import { sendMail } from '../services/mailer.js';

const sendTo = process.argv.includes('--send') ? process.argv[process.argv.indexOf('--send') + 1] : null;

// Jeux de données représentatifs : mêmes formes de payload que les contrôleurs.
const cases = [
  {
    type: 'contact_message.created',
    summary: 'Marie Dupont — Panne sur la frise',
    payload: {
      name: 'Marie Dupont', email: 'marie.dupont@exemple.fr',
      subject: 'Panne sur la frise',
      message: 'Bonjour,\n\nLa frise ne charge plus depuis hier sur mon téléphone.\n\nMarie',
    },
  },
  {
    type: 'mission_application.created',
    summary: 'Jean Martin → Chantier participatif',
    payload: {
      name: 'Jean Martin', email: 'jean.martin@exemple.fr',
      mission_id: 'abc', mission_name: 'Chantier participatif',
      knowledge: "Je suis le projet depuis l'expo de 2024.",
    },
  },
  {
    type: 'cartel.submission_pending',
    summary: 'La pile de Bagdad',
    targetId: 'eb558ab8-e954-4838-83ca-eab3b96d2ac2',
    payload: { status: 'pending_review', anonymous: true },
  },
];

console.log('Types disposant d\'un mail dédié :', TEMPLATED_TYPES.join(', '), '\n');

for (const c of cases) {
  const tpl = renderEventEmail(c);
  if (!tpl) { console.log(`✗ ${c.type} : aucun template rendu !\n`); continue; }
  const subject = `${subjectPrefix('[Paléo]', tpl.category)} ${tpl.subject}`;
  console.log('='.repeat(72));
  console.log('Sujet    :', subject);
  console.log('Reply-To :', tpl.replyTo ? `${tpl.replyTo.name} <${tpl.replyTo.address}>` : '(aucun)');
  console.log('-'.repeat(72));
  console.log(tpl.text);
  if (sendTo) {
    const r = await sendMail({ to: sendTo, subject, text: tpl.text, replyTo: tpl.replyTo || undefined });
    console.log(r.sent ? `→ envoyé à ${sendTo}` : `→ NON envoyé : ${r.error || 'skipped'}`);
  }
  console.log('');
}
