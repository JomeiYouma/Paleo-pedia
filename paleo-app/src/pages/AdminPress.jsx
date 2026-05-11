import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Newspaper, Plus, Trash2, Upload, Eye, EyeOff, Pencil, Save, X, ExternalLink,
} from 'lucide-react';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

const fmtDate = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
};

// Convertit une date MySQL ('YYYY-MM-DD' ou ISO) en valeur acceptée par <input type="date">
const toDateInputValue = (v) => {
    if (!v) return '';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    try { return new Date(v).toISOString().slice(0, 10); } catch { return ''; }
};

// ── Formulaire (création + édition) ───────────────────────────
const ArticleForm = ({ initial, onCancel, onSubmit, busy, submitLabel = 'Enregistrer' }) => {
    const [title, setTitle]   = useState(initial?.title || '');
    const [source, setSource] = useState(initial?.source || '');
    const [date, setDate]     = useState(toDateInputValue(initial?.published_date));
    const [url, setUrl]       = useState(initial?.url || '');
    const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
    const [thumbnailPath, setThumbnailPath] = useState(initial?.thumbnail_path || '');
    const [isPublished, setIsPublished] = useState(initial ? initial.is_published !== 0 : true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleThumb = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadError('');
        try {
            const up = await api.media.upload(file);
            setThumbnailPath(up?.url || '');
        } catch (e) {
            setUploadError(e.message || "Échec de l'upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            source: source.trim() || null,
            published_date: date || null,
            url: url.trim() || null,
            excerpt: excerpt.trim() || null,
            thumbnail_path: thumbnailPath || null,
            is_published: isPublished,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <label style={labelStyle}>Titre *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle}
                    placeholder="Cédric Carles, le designer fédérateur d'énergies" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Source / média</label>
                    <input value={source} onChange={e => setSource(e.target.value)} style={inputStyle}
                        placeholder="Le Monde, RTBF, Ouest France…" />
                </div>
                <div>
                    <label style={labelStyle}>Date de publication</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>
            </div>

            <div>
                <label style={labelStyle}>URL de l'article</label>
                <input value={url} onChange={e => setUrl(e.target.value)} style={inputStyle}
                    placeholder="https://lemonde.fr/article-…" />
            </div>

            <div>
                <label style={labelStyle}>Accroche / résumé (optionnel)</label>
                <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Une phrase qui résume l'article — affichée sous le titre." />
            </div>

            {/* Vignette */}
            <div>
                <label style={labelStyle}>Vignette</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {thumbnailPath ? (
                        <img src={thumbnailPath} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                    ) : (
                        <div style={{ width: '120px', height: '80px', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            (vide)
                        </div>
                    )}
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                        <Upload size={14} />
                        {uploading ? 'Upload en cours…' : (thumbnailPath ? 'Remplacer la vignette' : 'Choisir une vignette…')}
                        <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={e => handleThumb(e.target.files?.[0])} />
                    </label>
                    {thumbnailPath && (
                        <button type="button" onClick={() => setThumbnailPath('')} style={ghostBtnStyle} title="Retirer la vignette">
                            <X size={14} />
                        </button>
                    )}
                </div>
                {uploadError && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--color-error)' }}>{uploadError}</p>
                )}
            </div>

            {/* Visibilité */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                Article publié (visible sur la page presse)
            </label>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={busy} style={ghostBtnStyle}>
                        Annuler
                    </button>
                )}
                <button type="submit" disabled={busy || !title.trim()} style={{
                    ...primaryBtnStyle,
                    opacity: (busy || !title.trim()) ? 0.5 : 1,
                    cursor: (busy || !title.trim()) ? 'not-allowed' : 'pointer',
                }}>
                    <Save size={14} /> {busy ? 'Envoi…' : submitLabel}
                </button>
            </div>
        </form>
    );
};

const AdminPress = () => {
    const { isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId]     = useState(null);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.pressArticles.getAll();
            setArticles(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (!isSuperadmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                Accès réservé aux superadmins.
            </div>
        );
    }

    const handleCreate = async (data) => {
        setCreating(true);
        try {
            const created = await api.pressArticles.create(data);
            setArticles(prev => [created, ...prev]);
            setShowForm(false);
            showToast('success', `« ${created.title} » ajouté`);
        } catch (e) {
            showToast('error', e.message || 'Erreur création');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setBusyId(id);
        try {
            const updated = await api.pressArticles.update(id, data);
            setArticles(prev => prev.map(x => x.id === id ? updated : x));
            setEditingId(null);
            showToast('success', `« ${updated.title} » mis à jour`);
        } catch (e) {
            showToast('error', e.message || 'Erreur mise à jour');
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (a) => {
        setBusyId(a.id);
        try {
            const updated = await api.pressArticles.update(a.id, { is_published: !a.is_published });
            setArticles(prev => prev.map(x => x.id === a.id ? updated : x));
            showToast('success', updated.is_published ? 'Article publié' : 'Article masqué');
        } catch (e) {
            showToast('error', e.message || 'Erreur');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (a) => {
        if (!confirm(`Supprimer définitivement « ${a.title} » ?`)) return;
        setBusyId(a.id);
        try {
            await api.pressArticles.delete(a.id);
            setArticles(prev => prev.filter(x => x.id !== a.id));
            showToast('success', `« ${a.title} » supprimé`);
        } catch (e) {
            showToast('error', e.message || 'Erreur suppression');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={Newspaper} title="Articles de presse" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les articles de presse affichés sur la <strong>page publique « Presse »</strong>.
                Les articles sont triés automatiquement par date de publication décroissante (les plus récents
                en premier). Vous pouvez masquer un article temporairement sans le supprimer en décochant
                « Article publié ».
            </ExplainerBox>

            {/* Bouton + formulaire d'ajout */}
            {!showForm && (
                <button
                    type="button"
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    style={{ ...primaryBtnStyle, marginBottom: '16px' }}
                >
                    <Plus size={14} /> Ajouter un article
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Nouvel article
                    </p>
                    <ArticleForm
                        onCancel={() => setShowForm(false)}
                        onSubmit={handleCreate}
                        busy={creating}
                        submitLabel="Ajouter"
                    />
                </AdminSection>
            )}

            {/* Liste */}
            <AdminSection>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0' }}>Chargement…</p>
                ) : articles.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
                        Aucun article. Ajoutez le premier ci-dessus.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {articles.map(a => {
                            const isEditing = editingId === a.id;
                            if (isEditing) {
                                return (
                                    <div key={a.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                            Édition de « {a.title} »
                                        </p>
                                        <ArticleForm
                                            initial={a}
                                            onCancel={() => setEditingId(null)}
                                            onSubmit={(data) => handleUpdate(a.id, data)}
                                            busy={busyId === a.id}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    background: 'var(--color-surface-2)',
                                    opacity: a.is_published ? 1 : 0.6,
                                }}>
                                    {a.thumbnail_path ? (
                                        <img src={a.thumbnail_path} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '60px', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.7rem', flexShrink: 0 }}>
                                            —
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700' }}>
                                            {a.source || '—'}{a.published_date && ` · ${fmtDate(a.published_date)}`}
                                            {!a.is_published && <span style={{ marginLeft: '8px', color: 'var(--color-warning)' }}>· masqué</span>}
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.title}
                                        </div>
                                        {a.url && (
                                            <a href={a.url} target="_blank" rel="noopener noreferrer"
                                                style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <ExternalLink size={11} /> {a.url.replace(/^https?:\/\//, '').slice(0, 40)}…
                                            </a>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleTogglePublish(a)}
                                        disabled={busyId === a.id}
                                        style={{
                                            ...ghostBtnStyle,
                                            padding: '5px 10px',
                                            background: a.is_published ? 'var(--color-accent)' : 'var(--color-surface)',
                                            color: a.is_published ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                                            borderColor: a.is_published ? 'var(--color-accent)' : 'var(--color-border)',
                                        }}
                                        title={a.is_published ? 'Masquer' : 'Publier'}
                                    >
                                        {a.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(a.id); setShowForm(false); }}
                                        disabled={busyId === a.id}
                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                        title="Modifier"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(a)}
                                        disabled={busyId === a.id}
                                        style={{ ...dangerBtnStyle, padding: '5px 10px' }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </AdminSection>
        </div>
    );
};

export default AdminPress;
