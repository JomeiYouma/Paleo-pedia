// URL canonique du site principal (utilisée pour les liens de retour depuis
// les sous-sites sur leur host dédié, qui ne peuvent pas pointer vers `/`).
// À mettre à jour si on change le domaine principal.
export const MAIN_SITE_URL = 'https://paleo-pedia.org';

// Map host → subsite slug. Un domaine dédié comme paleo-h2o.org affiche
// le sous-site h2o à la racine (`/`, `/frise`, `/admin/...`) au lieu de
// passer par `/site/h2o/...`. Quand le host ne correspond à aucun sous-site,
// l'app utilise son routeur historique (createHashRouter) sans changement.
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
