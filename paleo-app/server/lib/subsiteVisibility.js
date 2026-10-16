/**
 * subsiteVisibility.js — Règles de visibilité d'un sous-site (migration v37).
 *
 *   - 'listed'   : public, listé sur paleo-pedia et dans le menu du site principal.
 *   - 'unlisted' : public (accès par le lien) mais listé nulle part. Le filtrage
 *                  « listé ou non » se fait côté front ; l'API renvoie ces
 *                  sous-sites car leur existence n'est pas secrète.
 *   - 'admin'    : visible uniquement par un superadmin ou un compte rattaché
 *                  au sous-site. Pour tous les autres, l'API répond 404.
 */

export const SUBSITE_VISIBILITIES = ['listed', 'unlisted', 'admin'];

/** True si `user` (ou null pour un visiteur anonyme) peut accéder au sous-site. */
export const canSeeSubsite = (user, subsite) => {
  if (!subsite || subsite.visibility !== 'admin') return true;
  if (user?.can_manage_admin) return true;
  return !!user?.home_subsite_id && user.home_subsite_id === subsite.id;
};

/**
 * Un cartel accepté sur la frise principale reste visible même si son
 * sous-site est réservé aux admins. On retire alors le lien vers ce sous-site
 * (slug/nom) pour les visiteurs qui n'y ont pas accès : le front retombe sur
 * la page détail du site principal au lieu d'une page « introuvable ».
 */
export const maskHiddenSubsite = (user, cartel) => {
  if (!cartel?.subsite_id) return cartel;
  if (canSeeSubsite(user, { id: cartel.subsite_id, visibility: cartel.subsite_visibility })) return cartel;
  return { ...cartel, subsite_slug: null, subsite_name: null };
};
