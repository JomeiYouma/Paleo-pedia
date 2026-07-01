/**
 * socialMeta.js — balises Open Graph / Twitter injectées côté serveur.
 *
 * Un SPA pose ses balises meta en JavaScript, que les crawlers des réseaux
 * sociaux (LinkedIn, Facebook, WhatsApp, Discord…) n'exécutent PAS : ils ne
 * lisent que le HTML brut servi par Express. Sans injection, toute page —
 * quel que soit le domaine — hérite des balises génériques de index.html
 * (« Paléo-Énergétique » + bannière du museum). D'où l'aperçu erroné quand on
 * partage un lien de sous-site (ex. paleo-h2o.org/frise).
 *
 * On résout donc le contexte de la requête et on réécrit les balises :
 *   - page cartel (/cartel/:id, /site/:slug/cartel/:id) → infos du cartel,
 *     signées par son sous-site s'il en a un ;
 *   - page d'un sous-site (host dédié comme paleo-h2o.org, OU /site/:slug/…)
 *     → identité du sous-site (nom, description, logo) ;
 *   - sinon → les balises par défaut de index.html (site principal).
 */
import { SubsiteModel } from '../models/Subsite.js';
import { CartelModel } from '../models/Cartel.js';
// Single source of truth du mapping host → slug de sous-site (cf. App.jsx qui
// s'en sert pour le routing). Le fichier est pur (aucun import, gardes window)
// donc importable tel quel côté Node.
import { HOST_TO_SUBSITE_SLUG } from '../../src/utils/subsiteHost.js';

const SITE_NAME = 'Paléo-Énergétique';
// Repli d'image quand ni le cartel ni le sous-site n'exposent de visuel propre.
const DEFAULT_IMAGE = '/photos/museum-banner.png';

const escapeHtml = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (s, n = 200) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// URL absolue d'image depuis les formats stockés (http…, /api/images/…,
// images/…). cf. memory « legacy image paths ».
const absoluteImageUrl = (base, p) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return base + p;
  return base + '/api/images/' + p.replace(/^images\//, '');
};

// Premier bloc de contenu exploitable comme description (FR puis EN). On
// privilégie un paragraphe (`text`) — plus descriptif qu'un titre — avant de se
// rabattre sur une citation puis un titre.
const firstBlockText = (...blockLists) => {
  const all = blockLists.filter(Array.isArray).flat()
    .filter(b => b && typeof b === 'object' && b.content?.trim());
  for (const type of ['text', 'quote', 'title']) {
    const hit = all.find(b => b.type === type);
    if (hit) return hit.content.trim();
  }
  return '';
};

// Première image des blocs de contenu (image directe ou 1re d'une galerie).
const firstBlockImage = (...blockLists) => {
  for (const blocks of blockLists) {
    if (!Array.isArray(blocks)) continue;
    for (const b of blocks) {
      if (!b || typeof b !== 'object') continue;
      if (b.type === 'image' && b.url) return b.url;
      if (b.type === 'gallery' && Array.isArray(b.items) && b.items[0]?.url) return b.items[0].url;
    }
  }
  return null;
};

// Retire le <title> + les balises OG/Twitter/description par défaut de
// index.html (sinon doublons → un crawler peut retenir l'image générique), puis
// injecte celles fournies juste avant </head>. `name="author"` est conservé.
const replaceHead = (html, tags) => html
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .replace(/\s*<meta\b[^>]*\b(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/gi, '')
  .replace('</head>', `  ${tags.filter(Boolean).join('\n  ')}\n</head>`);

// Balises d'un cartel (titre, description, image), signées par son sous-site.
const cartelTags = (cartel, pageUrl, base) => {
  const siteName = escapeHtml(cartel.subsite_name || SITE_NAME);
  const title = escapeHtml(cartel.titre || cartel.titre_en || 'Cartel');
  const desc = escapeHtml(truncate(stripHtml(cartel.description || cartel.description_en || '')));
  const img = absoluteImageUrl(base, cartel.image_path);
  return [
    `<title>${title} ${siteName}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    img ? `<meta property="og:image" content="${escapeHtml(img)}" />` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    img ? `<meta name="twitter:image" content="${escapeHtml(img)}" />` : '',
  ];
};

// Balises d'un sous-site (nom, description, logo/visuel). Le nom du sous-site
// prime sur celui du réseau : c'est LUI qui doit apparaître dans l'aperçu.
const subsiteTags = (subsite, pageUrl, base) => {
  const name = escapeHtml(subsite.name || SITE_NAME);
  const descRaw = firstBlockText(subsite.content_blocks, subsite.content_blocks_en)
    || (subsite.category_name
      ? `Thématique : ${subsite.category_name} — un sous-site du programme Paléo-Énergétique.`
      : `${subsite.name} — un sous-site du programme de recherche participatif Paléo-Énergétique.`);
  const desc = escapeHtml(truncate(stripHtml(descRaw)));
  const img = absoluteImageUrl(base, subsite.logo_path
    || firstBlockImage(subsite.content_blocks, subsite.content_blocks_en)
    || DEFAULT_IMAGE);
  return [
    `<title>${name}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${name}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${name}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    img ? `<meta property="og:image" content="${escapeHtml(img)}" />` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${name}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    img ? `<meta name="twitter:image" content="${escapeHtml(img)}" />` : '',
  ];
};

// Slug du sous-site ciblé par la requête : le chemin /site/:slug/… prime (il
// marche sur n'importe quel host), sinon on mappe le host dédié (paleo-h2o.org…).
export const subsiteSlugForRequest = (req) => {
  const m = req.path.match(/^\/site\/([^/]+)(?:\/|$)/);
  if (m) return decodeURIComponent(m[1]);
  return HOST_TO_SUBSITE_SLUG[req.hostname] || null;
};

/**
 * Renvoie index.html avec les balises OG/Twitter adaptées au contexte de la
 * requête. Repli silencieux sur le HTML d'origine si rien ne correspond ou en
 * cas d'erreur (le SPA pose alors ses balises par défaut côté client).
 */
export async function injectSocialMeta(html, req) {
  const base = `${req.protocol}://${req.get('host')}`;
  const pageUrl = base + req.originalUrl;

  // 1) Page détail d'un cartel → infos du cartel.
  const cartelMatch = req.path.match(/(?:^|\/)cartel\/([^/]+)\/?$/);
  if (cartelMatch) {
    const cartel = await CartelModel.findById(cartelMatch[1]);
    if (cartel) return replaceHead(html, cartelTags(cartel, pageUrl, base));
    // cartel introuvable → on continue (sous-site ou défaut).
  }

  // 2) Page d'un sous-site (host dédié ou /site/:slug/…) → identité du sous-site.
  const slug = subsiteSlugForRequest(req);
  if (slug) {
    const subsite = await SubsiteModel.findMetaBySlug(slug);
    if (subsite) return replaceHead(html, subsiteTags(subsite, pageUrl, base));
  }

  // 3) Défaut : balises de index.html (site principal Paléo-Énergétique).
  return html;
}
