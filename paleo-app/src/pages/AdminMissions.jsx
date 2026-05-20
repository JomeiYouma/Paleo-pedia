import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Target, Plus, Trash2, Eye, EyeOff, Pencil, Save,
    ArrowUp, ArrowDown,
} from 'lucide-react';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast, TranslateButton,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Formulaire (création + édition) ───────────────────────────
const MissionForm = ({ initial, onCancel, onSubmit, busy, submitLabel = 'Enregistrer' }) => {
    const [theme, setTheme]       = useState(initial?.theme || '');
    const [name, setName]         = useState(initial?.name || '');
    const [nameEn, setNameEn]     = useState(initial?.name_en || '');
    const [text, setText]         = useState(initial?.text || '');
    const [textEn, setTextEn]     = useState(initial?.text_en || '');
    const [linkUrl, setLinkUrl]   = useState(initial?.link_url || '');
    const [linkLabel, setLinkLabel] = useState(initial?.link_label || '');
    const [isPublished, setIsPublished] = useState(initial ? initial.is_published !== 0 : true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!theme.trim() || !name.trim()) return;
        onSubmit({
            theme: theme.trim(),
            name: name.trim(),
            name_en: nameEn.trim() || null,
            text: text.trim() || null,
            text_en: textEn.trim() || null,
            link_url: linkUrl.trim() || null,
            link_label: linkLabel.trim() || null,
            is_published: isPublished,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Thème *</label>
                    <input value={theme} onChange={e => setTheme(e.target.value)} required style={inputStyle}
                        placeholder="Recherche, Intelligence collective, Ingénierie…" />
                </div>
                <div>
                    <label style={labelStyle}>Nom *</label>
                    <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle}
                        placeholder="À la recherche de femmes oubliées" />
                </div>
            </div>

            <div>
                <label style={labelStyle}>Texte (HTML autorisé)</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }}
                    placeholder="<p><strong>Mission :</strong> …</p><p><strong>Pour qui :</strong> …</p>" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Lien (URL — optionnel)</label>
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={inputStyle}
                        placeholder="https://…" />
                </div>
                <div>
                    <label style={labelStyle}>Libellé du lien</label>
                    <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} style={inputStyle}
                        placeholder="En savoir plus" />
                </div>
            </div>

            {/* ── Version anglaise ─────────────────────────────────────── */}
            <fieldset style={{
                border: '1px dashed var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                margin: '8px 0 4px',
            }}>
                <legend style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', padding: '0 8px' }}>
                    Version anglaise (optionnelle)
                </legend>
                <div style={{ marginBottom: '10px' }}>
                    <TranslateButton
                        getFrFields={() => ({ name, text })}
                        onTranslated={(out) => {
                            if ('name' in out) setNameEn(out.name);
                            if ('text' in out) setTextEn(out.text);
                        }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Name (EN)</label>
                    <input value={nameEn} onChange={e => setNameEn(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Text (EN)</label>
                    <textarea value={textEn} onChange={e => setTextEn(e.target.value)} rows={6}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }} />
                </div>
            </fieldset>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                Mission publiée (visible sur /participer)
            </label>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={busy} style={ghostBtnStyle}>
                        Annuler
                    </button>
                )}
                <button type="submit" disabled={busy || !theme.trim() || !name.trim()} style={{
                    ...primaryBtnStyle,
                    opacity: (busy || !theme.trim() || !name.trim()) ? 0.5 : 1,
                    cursor: (busy || !theme.trim() || !name.trim()) ? 'not-allowed' : 'pointer',
                }}>
                    <Save size={14} /> {busy ? 'Envoi…' : submitLabel}
                </button>
            </div>
        </form>
    );
};

const AdminMissions = () => {
    const { isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [items, setItems]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId]   = useState(null);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.missions.getAll();
            setItems(Array.isArray(data) ? data : []);
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
            const maxOrder = items.reduce((m, x) => Math.max(m, x.display_order || 0), 0);
            const created = await api.missions.create({ ...data, display_order: maxOrder + 10 });
            setItems(prev => [...prev, created]);
            setShowForm(false);
            showToast('success', `« ${created.name} » ajoutée`);
        } catch (e) {
            showToast('error', e.message || 'Erreur création');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setBusyId(id);
        try {
            const updated = await api.missions.update(id, data);
            setItems(prev => prev.map(x => x.id === id ? updated : x));
            setEditingId(null);
            showToast('success', `« ${updated.name} » mise à jour`);
        } catch (e) {
            showToast('error', e.message || 'Erreur mise à jour');
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (m) => {
        setBusyId(m.id);
        try {
            const updated = await api.missions.update(m.id, { is_published: !m.is_published });
            setItems(prev => prev.map(x => x.id === m.id ? updated : x));
            showToast('success', updated.is_published ? 'Mission publiée' : 'Mission masquée');
        } catch (e) {
            showToast('error', e.message || 'Erreur');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (m) => {
        if (!confirm(`Supprimer définitivement « ${m.name} » ?`)) return;
        setBusyId(m.id);
        try {
            await api.missions.delete(m.id);
            setItems(prev => prev.filter(x => x.id !== m.id));
            showToast('success', `« ${m.name} » supprimée`);
        } catch (e) {
            showToast('error', e.message || 'Erreur suppression');
        } finally {
            setBusyId(null);
        }
    };

    const handleMove = async (m, direction) => {
        const sorted = [...items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const idx = sorted.findIndex(x => x.id === m.id);
        const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (neighborIdx < 0 || neighborIdx >= sorted.length) return;
        const neighbor = sorted[neighborIdx];
        setBusyId(m.id);
        try {
            const [u1, u2] = await Promise.all([
                api.missions.update(m.id,        { display_order: neighbor.display_order }),
                api.missions.update(neighbor.id, { display_order: m.display_order }),
            ]);
            setItems(prev => prev.map(x => {
                if (x.id === u1.id) return u1;
                if (x.id === u2.id) return u2;
                return x;
            }));
        } catch (e) {
            showToast('error', e.message || 'Erreur réordonnancement');
        } finally {
            setBusyId(null);
        }
    };

    const sortedItems = items.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={Target} title="Missions (page Participer)" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les missions (appels à participation thématiques) affichées en haut de la
                <strong> page publique /participer</strong>. Chaque mission a un thème (Recherche,
                Intelligence collective, Ingénierie…), un nom, un texte descriptif (HTML autorisé)
                et un lien optionnel. Sur la page publique elles sont dépliables : seul le nom est
                visible par défaut, le texte apparaît au clic.
                L'ordre d'affichage est défini par les flèches ↑ ↓ ci-dessous.
            </ExplainerBox>

            {!showForm && (
                <button
                    type="button"
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    style={{ ...primaryBtnStyle, marginBottom: '16px' }}
                >
                    <Plus size={14} /> Ajouter une mission
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Nouvelle mission
                    </p>
                    <MissionForm
                        onCancel={() => setShowForm(false)}
                        onSubmit={handleCreate}
                        busy={creating}
                        submitLabel="Ajouter"
                    />
                </AdminSection>
            )}

            <AdminSection>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0' }}>Chargement…</p>
                ) : sortedItems.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
                        Aucune mission. Ajoutez la première ci-dessus.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedItems.map((m, idx, arr) => {
                            const isEditing = editingId === m.id;
                            if (isEditing) {
                                return (
                                    <div key={m.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                            Édition de « {m.name} »
                                        </p>
                                        <MissionForm
                                            initial={m}
                                            onCancel={() => setEditingId(null)}
                                            onSubmit={(data) => handleUpdate(m.id, data)}
                                            busy={busyId === m.id}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    background: 'var(--color-surface-2)',
                                    opacity: m.is_published ? 1 : 0.6,
                                }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: '700', padding: '3px 9px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--color-accent-soft)',
                                        color: 'var(--color-primary)',
                                        whiteSpace: 'nowrap',
                                        fontFamily: 'var(--font-heading)',
                                        textTransform: 'uppercase', letterSpacing: '0.4px',
                                        flexShrink: 0,
                                    }}>
                                        {m.theme}
                                    </span>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.name}
                                            {!m.is_published && <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: 'var(--color-warning)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>· masquée</span>}
                                        </div>
                                        {m.link_url && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {m.link_label || m.link_url}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(m, 'up')}
                                            disabled={idx === 0 || busyId === m.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Monter"
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(m, 'down')}
                                            disabled={idx === arr.length - 1 || busyId === m.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === arr.length - 1 ? 0.3 : 1 }}
                                            title="Descendre"
                                        >
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleTogglePublish(m)}
                                        disabled={busyId === m.id}
                                        style={{
                                            ...ghostBtnStyle,
                                            padding: '5px 10px',
                                            background: m.is_published ? 'var(--color-accent)' : 'var(--color-surface)',
                                            color: m.is_published ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                                            borderColor: m.is_published ? 'var(--color-accent)' : 'var(--color-border)',
                                        }}
                                        title={m.is_published ? 'Masquer' : 'Publier'}
                                    >
                                        {m.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(m.id); setShowForm(false); }}
                                        disabled={busyId === m.id}
                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                        title="Modifier"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(m)}
                                        disabled={busyId === m.id}
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

export default AdminMissions;
