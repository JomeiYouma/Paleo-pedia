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
async function request(method, path, body, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.get();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
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
  update:  (id, data) => patch(`/users/${id}`, data),
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
  create:  (data)       => post('/partners', data),
  update:  (id, data)   => patch(`/partners/${id}`, data),
  delete:  (id)         => del(`/partners/${id}`),
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
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
    return data; // { url, filename }
  },
};

// ── Traduction ────────────────────────────────────────────────
export const translate = {
  /** Traduit les champs d'un cartel (titre, description, location) via OpenAI serveur */
  cartel: (fields) => post('/translate', fields),
};

// ── Import / Export ───────────────────────────────────────────
export const io = {
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

const api = { auth, cartels, categories, workshops, settings, users, media, translate, io, subsites, partners };
export default api;