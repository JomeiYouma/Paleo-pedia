// URL canonique du site principal (utilisée pour les liens de retour depuis
// les sous-sites sur leur host dédié, qui ne peuvent pas pointer vers `/`).
// À mettre à jour si on change le domaine principal.
export const MAIN_SITE_URL = 'https://paleo-pedia.org';

// Map host → subsite slug. Un domaine dédié comme paleo-h2o.org affiche
// le sous-site h2o à la racine (`/`, `/frise`, `/admin/...`) au lieu de
// passer par `/site/h2o/...`. Quand le host ne correspond à aucun sous-site,
// l'app utilise createBrowserRouter avec les routes principales (App.jsx).
export const HOST_TO_SUBSITE_SLUG = {
    'paleo-h2o.org':      'paleo-h2o',
    'www.paleo-h2o.org':  'paleo-h2o',
};

// Retourne le slug du sous-site associé au host courant, ou null.
// Sûr côté SSR / tests : window peut être absent.
export function getHostSubsiteSlug() {
    if (typeof window === 'undefined' || !window.location) return null;
    return HOST_TO_SUBSITE_SLUG[window.location.hostname] || null;
}

// Préfixe à utiliser dans les Link/navigate pour pointer vers un sous-site :
//   - '' (chaîne vide) quand on est sur le host dédié de CE sous-site
//     → permet `${base}/frise` = `/frise` et `${base || '/'}` = `/`
//   - '/site/<slug>' sinon (URL historique, fonctionne sur n'importe quel host)
export function subsiteBasePath(slug) {
    if (!slug) return '';
    return getHostSubsiteSlug() === slug ? '' : `/site/${slug}`;
}

// Inverse de getHostSubsiteSlug : pour un slug donné, renvoie l'URL absolue
// du host dédié s'il y en a un (ex: 'paleo-h2o' → 'https://paleo-h2o.org'),
// sinon null. Utilisé pour rediriger les utilisateurs du site principal vers
// le domaine canonique d'un sous-site quand il en a un.
export function getSubsiteHostUrl(slug) {
    if (!slug) return null;
    // On préfère l'entrée sans préfixe 'www.' pour le lien canonique.
    const apexHost = Object.entries(HOST_TO_SUBSITE_SLUG)
        .find(([host, s]) => s === slug && !host.startsWith('www.'));
    return apexHost ? `https://${apexHost[0]}` : null;
}

/**
 * Chemin (relatif, à utiliser dans des <Link>) vers la page détail interne
 * d'un cartel. Tient compte du contexte hôte : sur le host dédié du sous-site
 * → `/cartel/:id`, sinon `/site/<slug>/cartel/:id`, sinon `/cartel/:id` pour
 * un cartel du site principal.
 */
export function cartelDetailPath(cartelId, subsiteSlug) {
    if (!cartelId) return '';
    const base = subsiteBasePath(subsiteSlug);
    return `${base}/cartel/${cartelId}`;
}

/**
 * URL absolue vers la page détail interne d'un cartel, à encoder dans le QR
 * code à l'impression. Pour les cartels d'un sous-site avec host dédié, on
 * utilise ce host ; sinon on retombe sur MAIN_SITE_URL avec le routeur hash.
 */
export function cartelDetailAbsoluteUrl(cartelId, subsiteSlug) {
    if (!cartelId) return '';
    const hostUrl = subsiteSlug ? getSubsiteHostUrl(subsiteSlug) : null;
    if (hostUrl) return `${hostUrl}/cartel/${cartelId}`;
    const path = subsiteSlug ? `/site/${subsiteSlug}/cartel/${cartelId}` : `/cartel/${cartelId}`;
    return `${MAIN_SITE_URL}/#${path}`;
}
