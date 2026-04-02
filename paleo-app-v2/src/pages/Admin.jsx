import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { supabase } from '../lib/supabase';
import {
  Layers, Users, Settings, Plus, Trash2, Edit,
  Check, X, Eye, EyeOff, RefreshCw, Tag
} from 'lucide-react';
import './Admin.css';

/**
 * Admin — Panneau d'administration.
 * 
 * Sections :
 * 1. Cartels en attente de validation (pending_review)
 * 2. Gestion des catégories (créer, modifier, supprimer)
 * 3. Gestion des utilisateurs (promouvoir/rétrograder)
 */
export default function Admin() {
  const { user, isAdmin } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── Charger les propositions ──
  useEffect(() => {
    if (activeTab === 'proposals') loadProposals();
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadProposals = async () => {
    setLoadingProposals(true);
    const { data } = await supabase
      .from('cartels')
      .select('*, cartel_categories(category_id, category:categories(id,name,color))')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });
    setProposals((data || []).map(c => ({
      ...c,
      categories: c.cartel_categories?.map(cc => cc.category).filter(Boolean) || []
    })));
    setLoadingProposals(false);
  };

  const publishProposal = async (id) => {
    const { error } = await supabase
      .from('cartels')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user?.id,
        visible: true,
      })
      .eq('id', id);

    if (!error) setProposals(prev => prev.filter(p => p.id !== id));
  };

  const rejectProposal = async (id) => {
    const { error } = await supabase
      .from('cartels')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (!error) setProposals(prev => prev.filter(p => p.id !== id));
  };

  // ── Gestion utilisateurs ──
  const loadUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase.from('users_metadata').select('*');
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const toggleAdmin = async (userId, currentIsAdmin) => {
    await supabase.from('users_metadata').update({
      can_manage_admin: !currentIsAdmin,
      can_create_cartels: !currentIsAdmin,
      can_publish_cartels: !currentIsAdmin,
      role: !currentIsAdmin ? 'admin' : 'viewer',
    }).eq('id', userId);
    loadUsers();
  };

  const tabs = [
    { id: 'proposals', label: 'Propositions', icon: Layers, count: proposals.length },
    { id: 'categories', label: 'Catégories', icon: Tag, count: categories.length },
    { id: 'users', label: 'Utilisateurs', icon: Users },
  ];

  return (
    <div className="admin-page page-enter">
      <div className="container">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>Administration</h1>
            <p className="admin-subtitle">Gestion du contenu et des accès — Paléo-Cartels</p>
          </div>
          <Link to="/create" className="btn btn-primary" id="admin-new-cartel">
            <Plus size={16} /> Nouveau cartel
          </Link>
        </div>

        {/* Tabs */}
        <div className="admin-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-${tab.id}`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== undefined && (
                <span className="admin-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Propositions ── */}
        {activeTab === 'proposals' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Propositions en attente</h2>
              <button className="btn btn-ghost btn-sm" onClick={loadProposals}>
                <RefreshCw size={14} /> Rafraîchir
              </button>
            </div>

            {loadingProposals ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : proposals.length === 0 ? (
              <div className="admin-empty">
                <Check size={32} />
                <p>Aucune proposition en attente.</p>
              </div>
            ) : (
              <div className="admin-proposals">
                {proposals.map(proposal => (
                  <div key={proposal.id} className="proposal-card">
                    {proposal.image_path && (
                      <div className="proposal-img">
                        <img src={proposal.image_path} alt={proposal.titre} />
                      </div>
                    )}
                    <div className="proposal-body">
                      <div className="proposal-cats">
                        {proposal.categories.map(cat => (
                          <span key={cat.id} className="badge" style={{
                            background: `${cat.color}20`, color: cat.color,
                            border: `1px solid ${cat.color}40`
                          }}>{cat.name}</span>
                        ))}
                      </div>
                      <h3 className="proposal-title">{proposal.titre}</h3>
                      <div className="proposal-meta">
                        {proposal.annee && <span>📅 {proposal.annee}</span>}
                        {proposal.location && <span>📍 {proposal.location}</span>}
                        {proposal.exhume_par && <span>👤 {proposal.exhume_par}</span>}
                      </div>
                      {proposal.description && (
                        <p className="proposal-desc">{proposal.description.slice(0, 200)}…</p>
                      )}
                    </div>
                    <div className="proposal-actions">
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(76,175,125,0.1)', color: 'var(--color-success)', borderColor: 'rgba(76,175,125,0.3)' }}
                        onClick={() => publishProposal(proposal.id)}
                        id={`approve-${proposal.id}`}
                      >
                        <Check size={14} /> Publier
                      </button>
                      <button
                        onClick={() => navigate(`/create?edit=${proposal.id}`)}
                        className="btn btn-secondary btn-sm"
                        id={`edit-${proposal.id}`}
                      >
                        <Edit size={14} /> Modifier
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectProposal(proposal.id)}
                        id={`reject-${proposal.id}`}
                      >
                        <X size={14} /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Catégories ── */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onCreate={createCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        )}

        {/* ── Utilisateurs ── */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>Utilisateurs</h2>
              <button className="btn btn-ghost btn-sm" onClick={loadUsers}>
                <RefreshCw size={14} /> Rafraîchir
              </button>
            </div>
            {loadingUsers ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : (
              <div className="admin-users">
                {users.map(u => (
                  <div key={u.id} className="user-row">
                    <div className="user-row-id" title={u.id}>
                      {u.id.slice(0, 8)}…
                    </div>
                    <div className="user-row-role">
                      <span className={`badge badge-${u.role === 'admin' ? 'published' : 'draft'}`}>
                        {u.role || 'viewer'}
                      </span>
                    </div>
                    {u.id !== user?.id && (
                      <button
                        className={`btn btn-sm ${u.can_manage_admin ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleAdmin(u.id, u.can_manage_admin)}
                        id={`toggle-admin-${u.id}`}
                      >
                        {u.can_manage_admin ? 'Rétrograder' : 'Promouvoir Admin'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Category Manager sous-composant ── */
function CategoryManager({ categories, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', description: '', color: '#c8622a', icon: '' });
  const [saving, setSaving] = useState(false);

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name) return;
    setSaving(true);
    try {
      await onCreate(form);
      setForm({ id: '', name: '', description: '', color: '#c8622a', icon: '' });
      setShowNew(false);
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate(id, form);
      setEditingId(null);
    } finally { setSaving(false); }
  };

  const startEdit = (cat) => {
    setForm({ id: cat.id, name: cat.name, description: cat.description || '', color: cat.color || '#c8622a', icon: cat.icon || '' });
    setEditingId(cat.id);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Catégories</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(v => !v)} id="admin-new-cat">
          <Plus size={14} /> Nouvelle catégorie
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="cat-form card">
          <h3>Nouvelle catégorie</h3>
          <div className="cat-form-grid">
            <div className="form-group">
              <label className="form-label">Identifiant (slug) *</label>
              <input className="form-input" value={form.id} onChange={set('id')}
                placeholder="paleo-eau" required id="new-cat-id" />
            </div>
            <div className="form-group">
              <label className="form-label">Nom affiché *</label>
              <input className="form-input" value={form.name} onChange={set('name')}
                placeholder="Paléo H₂O" required id="new-cat-name" />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="color" value={form.color} onChange={set('color')} id="new-cat-color"
                  style={{ width:40, height:36, borderRadius:6, border:'1px solid var(--color-border)', cursor:'pointer' }} />
                <span style={{ fontSize:'0.8rem', color:'var(--color-text-muted)' }}>{form.color}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Icône (emoji ou texte)</label>
              <input className="form-input" value={form.icon} onChange={set('icon')}
                placeholder="💧 ou H2O" id="new-cat-icon" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')}
              rows={2} placeholder="Description de la thématique…" id="new-cat-desc" />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="new-cat-submit">
              {saving ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="admin-cats-list">
        {categories.map(cat => (
          <div key={cat.id} className="admin-cat-row" style={{ '--accent': cat.color || 'var(--color-accent)' }}>
            <div className="admin-cat-bar" />
            {editingId === cat.id ? (
              <form onSubmit={e => handleUpdate(e, cat.id)} className="admin-cat-edit-form">
                <div className="cat-form-grid">
                  <div className="form-group">
                    <label className="form-label">Nom *</label>
                    <input className="form-input" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Couleur</label>
                    <input type="color" value={form.color} onChange={set('color')}
                      style={{ width:40, height:36, borderRadius:6, border:'1px solid var(--color-border)', cursor:'pointer' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Icône</label>
                    <input className="form-input" value={form.icon} onChange={set('icon')} placeholder="💧" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={2} />
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Annuler</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>Enregistrer</button>
                </div>
              </form>
            ) : (
              <div className="admin-cat-info">
                <div className="admin-cat-icon" style={{ background: `${cat.color}20`, color: cat.color }}>
                  {cat.icon || <Tag size={14} />}
                </div>
                <div className="admin-cat-meta">
                  <strong>{cat.name}</strong>
                  <span className="admin-cat-id">#{cat.id}</span>
                  {cat.description && <span className="admin-cat-desc">{cat.description}</span>}
                </div>
                <div className="admin-cat-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(cat)} id={`edit-cat-${cat.id}`}>
                    <Edit size={13} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) onDelete(cat.id);
                    }}
                    id={`delete-cat-${cat.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
