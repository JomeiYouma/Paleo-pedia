/**
 * paleo-api — client JS (React / Vite)
 */

const BASE = '/api';

// ── Token storage ─────────────────────────────────────────────
const token = {
  get:   () => localStorage.getItem('paleo_token'),
  set:   (t) => localStorage.setItem('paleo_token', t),
  clear: () => localStorage.removeItem('paleo_token'),
};

// ── Core fetch ────────────────────────────────────────────────
// Cas multi-onglets : si l'utilisateur s'est déconnecté ailleurs (ou si le
// token a expiré côté serveur), un 401 retourné alors qu'on avait envoyé un
// token signifie que la session est morte. On purge le token et on prévient
// l'app via un événement window pour que l'UI réagisse (toast + déco).
function notifySessionExpired() {
  token.clear();
  try {
    window.dispatchEvent(new CustomEvent('paleo:session-expired'));
  } catch { /* SSR / tests : noop */ }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.get();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch ne rejette que sur erreur réseau (hors-ligne, DNS…). Le serveur
    // de dev arrêté entre dans ce cas.
    throw new Error('Serveur injoignable. Vérifiez votre connexion et réessayez.');
  }

  if (res.status === 401 && t) notifySessionExpired();
  if (res.status === 204) return null;

  // On lit le corps en texte d'abord : un backend coupé/planté (ou le proxy
  // Vite qui n'atteint pas localhost:3001) répond souvent SANS corps JSON,
  // et res.json() planterait alors avec un « Unexpected end of JSON input »
  // illisible. On parse défensivement et on remonte un message clair.
  const raw = await res.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { /* corps non-JSON : page d'erreur HTML, etc. */ }
  }

  if (!res.ok) {
    throw new Error(data?.error ?? `Erreur ${res.status} — serveur indisponible.`);
  }
  return data;
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const patch  = (path, body)  => request('PATCH',  path, body);
const del    = (path)        => request('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  async login(email, password) {
    const data = await post('/auth/login', { email, password });
    token.set(data.token);
    return data;
  },
  me: () => get('/auth/me'),
  logout: () => token.clear(),
  /** L'utilisateur connecté change son propre mot de passe (vérifie l'actuel). */
  changePassword: (current_password, new_password) =>
    post('/auth/change-password', { current_password, new_password }),
};

// ── Cartels ───────────────────────────────────────────────────
export const cartels = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
    );
    const qs = params.toString();
    return get(`/cartels${qs ? '?' + qs : ''}`);
  },
  getOne:    (id)       => get(`/cartels/${id}`),
  create:    (data)     => post('/cartels', data),
  update:    (id, data) => patch(`/cartels/${id}`, data),
  setStatus: (id, s)    => patch(`/cartels/${id}/status`, { status: s }),
  delete:    (id)       => del(`/cartels/${id}`),

  publish:         (id) => cartels.setStatus(id, 'published'),
  archive:         (id) => cartels.setStatus(id, 'archived'),
  submitForReview: (id) => cartels.setStatus(id, 'pending_review'),

  // Routes scopées d'un sous-site (owner / admin tenant)
  listForSubsite:   (slug, filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
    );
    const qs = params.toString();
    return get(`/s/${slug}/cartels${qs ? '?' + qs : ''}`);
  },
  getOneForSubsite: (slug, id)       => get(`/s/${slug}/cartels/${id}`),
  createForSubsite: (slug, data)     => post(`/s/${slug}/cartels`, data),
  updateInSubsite:  (slug, id, data) => patch(`/s/${slug}/cartels/${id}`, data),
  setStatusInSubsite: (slug, id, s)  => patch(`/s/${slug}/cartels/${id}/status`, { status: s }),
  deleteInSubsite:  (slug, id)       => del(`/s/${slug}/cartels/${id}`),
  submitToMain:     (slug, id)       => post(`/s/${slug}/cartels/${id}/submit-to-main`),
  withdrawFromMain: (slug, id)       => post(`/s/${slug}/cartels/${id}/withdraw-from-main`),

  // Notes admin internes (auth requise, scope = admin du cartel)
  listNotes:   (id, slug)            => get(slug ? `/s/${slug}/cartels/${id}/notes` : `/cartels/${id}/notes`),
  addNote:     (id, body, slug)      => post(slug ? `/s/${slug}/cartels/${id}/notes` : `/cartels/${id}/notes`, { body }),
  deleteNote:  (id, noteId, slug)    => del(slug ? `/s/${slug}/cartels/${id}/notes/${noteId}` : `/cartels/${id}/notes/${noteId}`),
};

// ── Statistiques (admin) ──────────────────────────────────────
// Agrégations pour la page /app/admin/stats. Tous les filtres sont optionnels.
// Les multi-valeurs (categoryIds, statuses) sont sérialisées en CSV.
export const stats = {
  cartels: (filters = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) { if (v.length) params.set(k, v.join(',')); }
      else params.set(k, String(v));
    }
    const qs = params.toString();
    return get(`/cartels/stats${qs ? '?' + qs : ''}`);
  },
};

// ── File de validation (superadmin) ───────────────────────────
export const submissions = {
  list:    ()    => get('/submissions'),
  approve: (id)  => post(`/submissions/${id}/approve`),
  reject:  (id)  => post(`/submissions/${id}/reject`),
};

// ── Gestion d'équipe scopée (owner / superadmin) ──────────────
export const team = {
  list:    (slug)           => get(`/s/${slug}/users`),
  create:  (slug, data)     => post(`/s/${slug}/users`, data),
  update:  (slug, id, data) => patch(`/s/${slug}/users/${id}`, data),
  setPassword: (slug, id, new_password) => patch(`/s/${slug}/users/${id}/password`, { new_password }),
  delete:  (slug, id)       => del(`/s/${slug}/users/${id}`),
};

// ── Categories ────────────────────────────────────────────────
export const categories = {
  getAll:  ()         => get('/categories'),
  getOne:  (id)       => get(`/categories/${id}`),
  create:  (data)     => post('/categories', data),
  update:  (id, data) => patch(`/categories/${id}`, data),
  delete:  (id)       => del(`/categories/${id}`),
};

// ── Workshops ─────────────────────────────────────────────────
export const workshops = {
  getAll:  ()         => get('/workshops'),
  getOne:  (id)       => get(`/workshops/${id}`),
  create:  (data)     => post('/workshops', data),
  update:  (id, data) => patch(`/workshops/${id}`, data),
  delete:  (id)       => del(`/workshops/${id}`),
  addCartels:    (id, cartelIds)  => post(`/workshops/${id}/cartels`, { cartelIds }),
  removeCartel:  (id, cartelId)   => del(`/workshops/${id}/cartels/${cartelId}`),
};

// ── Settings ──────────────────────────────────────────────────
export const settings = {
  getAll:      ()         => get('/settings'),
  getOpenAIKey: ()        => get('/settings/openai-key'),
  getDeepLKey:  ()        => get('/settings/deepl-key'),
  update:      (data)     => patch('/settings', data),
};

// ── Users (admin) ─────────────────────────────────────────────
export const users = {
  getAll:  ({ limit, offset } = {}) => {
    const p = new URLSearchParams();
    if (limit)  p.set('limit',  limit);
    if (offset) p.set('offset', offset);
    return get(`/users?${p}`);
  },
  getOne:  (id)       => get(`/users/${id}`),
  create:  (data)     => post('/users', data),
  update:  (id, data) => patch(`/users/${id}`, data),
  setPassword: (id, new_password) => patch(`/users/${id}/password`, { new_password }),
  delete:  (id)       => del(`/users/${id}`),
};

// ── Sous-sites ────────────────────────────────────────────────
export const subsites = {
  getAll:  ()           => get('/subsites'),
  getOne:  (slug)       => get(`/subsites/${slug}`),
  create:  (data)       => post('/subsites', data),
  update:  (slug, data) => patch(`/subsites/${slug}`, data),
  delete:  (slug)       => del(`/subsites/${slug}`),
};

// ── Partenaires ───────────────────────────────────────────────
export const partners = {
  getAll:  ()           => get('/partners'),
  getSiteSelection: ()  => get('/partners/site'),
  setSiteSelection: (data) => request('PUT', '/partners/site', data),
  create:  (data)       => post('/partners', data),
  update:  (id, data)   => patch(`/partners/${id}`, data),
  delete:  (id)         => del(`/partners/${id}`),
};

// ── Membres d'équipe (page publique « À propos ») ─────────────
// Lecture publique, écriture réservée au superadmin.
// `slug` (optionnel) scope la requête à un sous-site précis via les routes
// /s/:slug/team-members. Sans slug → équipe du site principal.
const teamRoot = (slug) => slug ? `/s/${slug}/team-members` : '/team-members';
export const teamMembers = {
  getAll:  (slug)              => get(teamRoot(slug)),
  create:  (data, slug)        => post(teamRoot(slug), data),
  update:  (id, data, slug)    => patch(`${teamRoot(slug)}/${id}`, data),
  delete:  (id, slug)          => del(`${teamRoot(slug)}/${id}`),
};

// ── Articles de presse (page publique /presse) ────────────────
// Lecture publique (filtrée à publié pour les non-admins, tout pour les
// admins). Écriture réservée au superadmin.
export const pressArticles = {
  getAll:  ()           => get('/press-articles'),
  create:  (data)       => post('/press-articles', data),
  update:  (id, data)   => patch(`/press-articles/${id}`, data),
  delete:  (id)         => del(`/press-articles/${id}`),
};

// ── Missions (page publique /participer — appels à participation) ──
// Lecture publique (filtrée à publié pour les non-admins, tout pour les
// admins). Écriture réservée au superadmin.
export const missions = {
  getAll:  ()           => get('/missions'),
  create:  (data)       => post('/missions', data),
  update:  (id, data)   => patch(`/missions/${id}`, data),
  delete:  (id)         => del(`/missions/${id}`),
};

// ── Candidatures aux missions (formulaire public /participer) ─────
// POST public (no auth). Lecture réservée aux superadmins.
export const missionApplications = {
  create:  (data)       => post('/mission-applications', data),
  getAll:  ()           => get('/mission-applications'),
};

// ── Messages du formulaire de contact (/contact) ──────────────
// POST public (no auth). Lecture réservée aux superadmins.
export const contactMessages = {
  create:  (data)       => post('/contact-messages', data),
  getAll:  ()           => get('/contact-messages'),
};

// ── Prestations (page publique /prestations) ──────────────────
// Lecture publique (filtrée à publié pour les non-admins, tout pour les
// admins). Écriture réservée au superadmin.
export const prestations = {
  getAll:  ()           => get('/prestations'),
  create:  (data)       => post('/prestations', data),
  update:  (id, data)   => patch(`/prestations/${id}`, data),
  delete:  (id)         => del(`/prestations/${id}`),
};

// ── Shop items (liens vers le PrestaShop externe) ─────────────
// Lecture publique (filtrée à publié), écriture réservée au superadmin.
export const shopItems = {
  getAll:  ()           => get('/shop-items'),
  create:  (data)       => post('/shop-items', data),
  update:  (id, data)   => patch(`/shop-items/${id}`, data),
  delete:  (id)         => del(`/shop-items/${id}`),
};

// ── Upload image ──────────────────────────────────────────────
export const media = {
  /** Envoie un fichier image au serveur, retourne { url } */
  upload: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const t = token.get();
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    });
    if (res.status === 401 && t) notifySessionExpired();
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
    return data; // { url, filename }
  },
};

// ── Traduction ────────────────────────────────────────────────
export const translate = {
  /**
   * Traduit les champs d'un cartel.
   * @param {object} fields - { titre, description, location } dans la langue SOURCE.
   * @param {object} [opts]
   * @param {'en'|'fr'} [opts.target='en'] - Langue cible.
   *   target='en' → réponse { titre_en, description_en, location_en }
   *   target='fr' → réponse { titre, description, location }
   */
  cartel: (fields, { target = 'en' } = {}) => post('/translate', { ...fields, target }),

  /**
   * Traduit un lot de cartels vers une langue arbitraire (frise traduite).
   * @param {object}   args
   * @param {string[]} args.ids
   * @param {'fr'|'en'} args.sourceLang
   * @param {string}   args.targetLanguage  - Nom libre saisi par l'admin.
   * Réponse : {
   *   translations: [{ id, titre, annee, description, location }],
   *   labels:       { moreText, exhumeText, catText, creditText, unknownText }, // libellés UI traduits
   *   categoryMap:  { [catSrc]: catTraduit }                                    // map nom-catégorie source → traduite
   * }
   */
  bulk: ({ ids, sourceLang, targetLanguage }) =>
    post('/translate/bulk', { ids, sourceLang, targetLanguage }),

  /**
   * Traduit un set arbitraire de champs FR↔EN (générique).
   * @param {object} fields - { key1: text1, ... } dans la langue source.
   * @param {object} [opts]
   * @param {'en'|'fr'} [opts.target='en']
   * Retourne { key1: translated1, ... } (mêmes clés).
   */
  fields: (fields, { target = 'en' } = {}) =>
    post('/translate/fields', { fields, target }),
};

// ── Import / Export ───────────────────────────────────────────
export const io = {
  /**
   * Audit image_path — retourne { total, issues: [{ id, titre, type, ... }] }.
   * Par défaut n'audite que les cartels publiés (ce qui sera effectivement
   * exporté). Passer { ids: [...] } pour scoper à une sélection, ou
   * { status: 'all' } pour tout auditer (brouillons inclus).
   */
  imageCheck: ({ ids, status } = {}) => {
    const qs = [];
    if (Array.isArray(ids) && ids.length) qs.push(`ids=${ids.join(',')}`);
    if (status) qs.push(`status=${status}`);
    return get(`/export/image-check${qs.length ? '?' + qs.join('&') : ''}`);
  },

  /** Importe un ZIP contenant cartels.json + images — retourne { created, errors } */
  importZip: async (zipFile) => {
    const formData = new FormData();
    formData.append('archive', zipFile);
    const t = token.get();
    const res = await fetch(`${BASE}/import`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    });
    if (res.status === 401 && t) notifySessionExpired();
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
    return data;
  },
  /** Télécharge une archive ZIP (JSON + images) des cartels sélectionnés */
  exportArchive: (ids = []) => {
    const qs = ids.length ? `?ids=${ids.join(',')}` : '';
    const t = token.get();
    // Déclenche un téléchargement natif via une balise <a>
    const a = document.createElement('a');
    a.href = `${BASE}/export${qs}`;
    if (t) {
      // Le token ne peut pas être envoyé via balise <a>, on passe par fetch + blob
      return fetch(`${BASE}/export${qs}`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const date = new Date().toISOString().split('T')[0];
          link.href = url;
          link.download = `paleo-export-${date}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return Promise.resolve();
  },
};

// ── Event logs (superadmin) ───────────────────────────────────
export const logs = {
  /**
   * @param {object} params
   * @param {string|string[]} [params.types]
   * @param {string} [params.actorId]
   * @param {string} [params.subsiteId]
   * @param {string} [params.q]
   * @param {string} [params.since]
   * @param {number} [params.limit]
   * @param {number} [params.offset]
   */
  list: (params = {}) => {
    const qp = new URLSearchParams();
    if (params.types) qp.set('types', Array.isArray(params.types) ? params.types.join(',') : params.types);
    if (params.actorId) qp.set('actorId', params.actorId);
    if (params.subsiteId) qp.set('subsiteId', params.subsiteId);
    if (params.q) qp.set('q', params.q);
    if (params.since) qp.set('since', params.since);
    if (params.limit != null) qp.set('limit', String(params.limit));
    if (params.offset != null) qp.set('offset', String(params.offset));
    const qs = qp.toString();
    return get(`/logs${qs ? '?' + qs : ''}`);
  },
  distinctTypes:    () => get('/logs/types'),
  getEmailConfig:   () => get('/logs/email-config'),
  updateEmailConfig: (type, body) => patch(`/logs/email-config/${encodeURIComponent(type)}`, body),
  /** Met à jour le destinataire de tous les types en une seule fois. */
  bulkSetRecipient: (recipient) => patch('/logs/email-config', { recipient }),
};

const api = { auth, cartels, stats, submissions, team, categories, workshops, settings, users, media, translate, io, subsites, partners, teamMembers, pressArticles, missions, missionApplications, contactMessages, prestations, shopItems, logs };
export default api;