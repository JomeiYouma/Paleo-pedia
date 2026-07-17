/**
 * emailTemplates.js
 * Mails « métier » pour les quelques types d'événements qu'une équipe lit
 * vraiment : formulaires publics et soumissions de visiteurs. Les autres types
 * gardent le format générique du dispatcher — pratique pour un audit, mais
 * illisible dans une boîte de réception.
 *
 * Un template reçoit le contexte de l'événement et retourne :
 *   category : mot injecté dans le préfixe du sujet → « [Paléo · Contact] »
 *   subject  : la partie du sujet APRÈS le préfixe
 *   text     : le corps du mail
 *   replyTo  : optionnel — { name, address } : « Répondre » écrit au visiteur
 *
 * Ajouter un type = ajouter une entrée ici, rien d'autre à câbler.
 */

const SIGNATURE = '— Notification automatique Paléo-Énergétique';

/**
 * Lien profond vers l'app, seulement si PUBLIC_BASE_URL est renseigné.
 * Sans lien on nomme la page en toutes lettres : mieux qu'une URL fausse.
 */
function appLink(path) {
  const base = String(process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  return base ? base + path : null;
}

/** Assemble les lignes en corps de mail. `null` = ligne omise, '' = ligne vide. */
const body = (lines) => lines.filter((l) => l !== null && l !== undefined).join('\n');

const templates = {

  'contact_message.created': ({ payload = {} }) => {
    const { name = '(anonyme)', email = '', subject = '', message = '' } = payload;
    const objet = subject || '(sans sujet)';
    return {
      category: 'Contact',
      subject: `${name} : « ${objet} »`,
      replyTo: email ? { name, address: email } : null,
      text: body([
        `${name} <${email}> a écrit via le formulaire de contact.`,
        '',
        `Objet : ${objet}`,
        '',
        message,
        '',
        '---',
        email ? 'Réponds directement à ce mail : la réponse part vers son adresse.' : null,
        SIGNATURE,
      ]),
    };
  },

  'mission_application.created': ({ payload = {} }) => {
    const { name = '(anonyme)', email = '', mission_name, knowledge } = payload;
    const mission = mission_name || 'mission non précisée';
    return {
      category: 'Candidature',
      subject: `${name} → ${mission}`,
      replyTo: email ? { name, address: email } : null,
      text: body([
        `${name} <${email}> candidate à « ${mission} ».`,
        '',
        'Connaissance du projet :',
        knowledge || '(non renseignée)',
        '',
        '---',
        email ? 'Réponds directement à ce mail : la réponse part vers son adresse.' : null,
        SIGNATURE,
      ]),
    };
  },

  // Soumission « classique » : visiteur non connecté, sur le site principal.
  // À ne pas confondre avec cartel.subsite_submitted (sous-site → principal).
  'cartel.submission_pending': ({ summary, targetId }) => {
    const titre = summary || '(sans titre)';
    const lien = appLink('/app/manage/pending');
    return {
      category: 'Cartel à modérer',
      subject: `« ${titre} »`,
      text: body([
        'Un visiteur a proposé un cartel sur le site principal.',
        '',
        `Titre : ${titre}`,
        '',
        'Il attend une modération dans Gérer les cartels → onglet « ⏳ En attente ».',
        lien ? '' : null,
        lien,
        '',
        `Référence : ${targetId || '—'}`,
        SIGNATURE,
      ]),
    };
  },
};

/**
 * Rend le mail d'un événement, ou null si aucun template n'existe pour ce type
 * (l'appelant retombe alors sur le format générique).
 * Un template qui jette ne doit jamais faire perdre la notification.
 */
export function renderEventEmail(ctx = {}) {
  const build = templates[ctx.type];
  if (!build) return null;
  try {
    return build(ctx);
  } catch (err) {
    console.error(`[emailTemplates] rendu échoué (${ctx.type}) :`, err.message);
    return null;
  }
}

/** Types disposant d'un mail dédié — exporté pour la doc et les tests. */
export const TEMPLATED_TYPES = Object.keys(templates);
