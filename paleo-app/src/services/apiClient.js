/**
 * paleo-api — client JS (React / Vite)
 * 
 * Usage:
 *   import api from './api/client'
 *   const cartels = await api.cartels.getAll({ status: 'published' })
 */

const BASE = '/api';

// ── Token storage ────────────────────────────────────────────
const token = {
  get: ()       => localStorage.getItem('paleo_token'),
  set: (t)      => localStorage.setItem('paleo_token', t),
  clear: ()     => localStorage.removeItem('paleo_token'),
};

// ── Core fetch ───────────────────────────────────────────────
async function request(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = token.get();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
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

const get    = (path, auth)      => request('GET',    path, null, auth);
const post   = (path, body, auth)=> request('POST',   path, body, auth);
const patch  = (path, body)      => request('PATCH',  path, body);
const del    = (path)            => request('DELETE', path);

// ── Auth ─────────────────────────────────────────────────────
export const auth = {
  /** Connexion — stocke le token automatiquement */
  async login(email, password) {
    const data = await post('/auth/login', { email, password }, false);
    token.set(data.token);
    return data;
  },

  /** Inscription (admin) */
  async register(payload) {
    const data = await post('/auth/register', payload, false);
    token.set(data.token);
    return data;
  },

  /** Profil courant */
  me: () => get('/auth/me'),

  /** Déconnexion locale */
  logout: () => token.clear(),
};

// ── Cartels ──────────────────────────────────────────────────
export const cartels = {
  /**
   * @param {{ status?, visible?, category?, search?, limit?, offset? }} filters
   */
  getAll: (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
    );
    return get(`/cartels?${params}`);
  },

  getOne:  (id)       => get(`/cartels/${id}`),
  create:  (data)     => post('/cartels', data),
  update:  (id, data) => patch(`/cartels/${id}`, data),

  /** status: 'draft' | 'pending_review' | 'published' | 'archived' */
  setStatus: (id, status) => patch(`/cartels/${id}/status`, { status }),

  delete: (id) => del(`/cartels/${id}`),

  // Raccourcis utiles
  publish:  (id) => cartels.setStatus(id, 'published'),
  archive:  (id) => cartels.setStatus(id, 'archived'),
  submitForReview: (id) => cartels.setStatus(id, 'pending_review'),
};

// ── Categories ───────────────────────────────────────────────
export const categories = {
  getAll:  ()         => get('/categories', false),
  getOne:  (id)       => get(`/categories/${id}`, false),
  create:  (data)     => post('/categories', data),
  update:  (id, data) => patch(`/categories/${id}`, data),
  delete:  (id)       => del(`/categories/${id}`),
};

// ── Users (admin) ────────────────────────────────────────────
export const users = {
  getAll:  ({ limit, offset } = {}) => {
    const p = new URLSearchParams();
    if (limit)  p.set('limit', limit);
    if (offset) p.set('offset', offset);
    return get(`/users?${p}`);
  },
  getOne:  (id)       => get(`/users/${id}`),
  update:  (id, data) => patch(`/users/${id}`, data),
  delete:  (id)       => del(`/users/${id}`),
};

const api = { auth, cartels, categories, users };
export default api;