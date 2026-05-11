import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    Users, Plus, Trash2, Upload, ArrowUp, ArrowDown,
    Pencil, Save, X, Linkedin, Globe, Link2,
} from 'lucide-react';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, AdminTabs, AdminTabDescription,
    useAdminToast, TranslateButton,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Onglets ──────────────────────────────────────────────────
const TABS = [
    {
        key: 'main',
        label: 'Principaux',
        description: 'Équipe principale — cards verticales centrées (photo, rôle, bio, liens sociaux).',
    },
    {
        key: 'secondary',
        label: 'Secondaires',
        description: 'Contributeur·ices proches — même richesse d\'infos que les Principaux mais affiché·es en card horizontale plus compacte.',
    },
    {
        key: 'community',
        label: 'Communauté',
        description: 'Communauté de chercheur·euses associé·es — affichage en liste textuelle (nom + rôle) sans photo.',
    },
];

// ── Formulaire de création / édition ──────────────────────────
const MemberForm = ({ initial, onCancel, onSubmit, busy, submitLabel = 'Enregistrer' }) => {
    const [name, setName] = useState(initial?.name || '');
    const [role, setRole] = useState(initial?.role || '');
    const [roleEn, setRoleEn] = useState(initial?.role_en || '');
    const [bio, setBio]   = useState(initial?.bio || '');
    const [bioEn, setBioEn] = useState(initial?.bio_en || '');
    const [photoPath, setPhotoPath] = useState(initial?.photo_path || '');
    const [urlLinkedin, setUrlLinkedin] = useState(initial?.url_linkedin || '');
    const [urlWebsite,  setUrlWebsite]  = useState(initial?.url_website  || '');
    const [urlOther,    setUrlOther]    = useState(initial?.url_other    || '');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handlePhoto = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadError('');
        try {
            const up = await api.media.upload(file);
            setPhotoPath(up?.url || '');
        } catch (e) {
            setUploadError(e.message || 'Échec de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name: name.trim(),
            role: role.trim() || null,
            role_en: roleEn.trim() || null,
            bio: bio.trim() || null,
            bio_en: bioEn.trim() || null,
            photo_path: photoPath || null,
            url_linkedin: urlLinkedin.trim() || null,
            url_website: urlWebsite.trim() || null,
            url_other: urlOther.trim() || null,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Nom *</label>
                    <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="Cédric Carles" />
                </div>
                <div>
                    <label style={labelStyle}>Rôle</label>
                    <input value={role} onChange={e => setRole(e.target.value)} style={inputStyle} placeholder="Designer / chercheur" />
                </div>
            </div>

            <div>
                <label style={labelStyle}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Quelques phrases qui décrivent le parcours et les missions de la personne…" />
            </div>

            {/* Photo */}
            <div>
                <label style={labelStyle}>Photo</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {photoPath ? (
                        <img src={photoPath} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
                    ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.7rem' }}>
                            (vide)
                        </div>
                    )}
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                        <Upload size={14} />
                        {uploading ? 'Upload en cours…' : (photoPath ? 'Remplacer la photo' : 'Choisir une photo…')}
                        <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0])} />
                    </label>
                    {photoPath && (
                        <button type="button" onClick={() => setPhotoPath('')} style={ghostBtnStyle} title="Retirer la photo">
                            <X size={14} />
                        </button>
                    )}
                </div>
                {uploadError && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--color-error)' }}>{uploadError}</p>
                )}
            </div>

            {/* URLs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}><Linkedin size={11} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> LinkedIn</label>
                    <input value={urlLinkedin} onChange={e => setUrlLinkedin(e.target.value)} style={inputStyle} placeholder="https://linkedin.com/in/…" />
                </div>
                <div>
                    <label style={labelStyle}><Globe size={11} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Site web</label>
                    <input value={urlWebsite} onChange={e => setUrlWebsite(e.target.value)} style={inputStyle} placeholder="https://…" />
                </div>
                <div>
                    <label style={labelStyle}><Link2 size={11} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> Autre lien</label>
                    <input value={urlOther} onChange={e => setUrlOther(e.target.value)} style={inputStyle} placeholder="https://…" />
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
                    Version anglaise
                </legend>
                <div style={{ marginBottom: '10px' }}>
                    <TranslateButton
                        getFrFields={() => ({ role, bio })}
                        onTranslated={(out) => {
                            if ('role' in out) setRoleEn(out.role);
                            if ('bio'  in out) setBioEn(out.bio);
                        }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Role (EN)</label>
                    <input value={roleEn} onChange={e => setRoleEn(e.target.value)} style={inputStyle} placeholder="Designer / researcher" />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Bio (EN)</label>
                    <textarea value={bioEn} onChange={e => setBioEn(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="A few sentences describing their background and missions…" />
                </div>
            </fieldset>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={busy} style={ghostBtnStyle}>
                        Annuler
                    </button>
                )}
                <button type="submit" disabled={busy || !name.trim()} style={{
                    ...primaryBtnStyle,
                    opacity: (busy || !name.trim()) ? 0.5 : 1,
                    cursor: (busy || !name.trim()) ? 'not-allowed' : 'pointer',
                }}>
                    <Save size={14} /> {busy ? 'Envoi…' : submitLabel}
                </button>
            </div>
        </form>
    );
};

// ── Page principale ───────────────────────────────────────────
const AdminTeamContent = () => {
    const { isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('main');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.teamMembers.getAll();
            setMembers(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];

    const filteredMembers = useMemo(
        () => members.filter(m => m.category === activeTab),
        [members, activeTab]
    );

    const counts = useMemo(() => Object.fromEntries(
        TABS.map(t => [t.key, members.filter(m => m.category === t.key).length])
    ), [members]);

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
            const maxOrder = filteredMembers.reduce((m, x) => Math.max(m, x.display_order || 0), 0);
            const created = await api.teamMembers.create({
                ...data,
                category: activeTab,
                display_order: maxOrder + 10,
            });
            setMembers(prev => [...prev, created]);
            setShowForm(false);
            showToast('success', `« ${created.name} » ajouté·e`);
        } catch (e) {
            showToast('error', e.message || 'Erreur création');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setBusyId(id);
        try {
            const updated = await api.teamMembers.update(id, data);
            setMembers(prev => prev.map(x => x.id === id ? updated : x));
            setEditingId(null);
            showToast('success', `« ${updated.name} » mis à jour`);
        } catch (e) {
            showToast('error', e.message || 'Erreur mise à jour');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (m) => {
        if (!confirm(`Supprimer définitivement « ${m.name} » ?`)) return;
        setBusyId(m.id);
        try {
            await api.teamMembers.delete(m.id);
            setMembers(prev => prev.filter(x => x.id !== m.id));
            showToast('success', `« ${m.name} » supprimé·e`);
        } catch (e) {
            showToast('error', e.message || 'Erreur suppression');
        } finally {
            setBusyId(null);
        }
    };

    const handleMove = async (m, direction) => {
        const sorted = [...filteredMembers].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const idx = sorted.findIndex(x => x.id === m.id);
        const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (neighborIdx < 0 || neighborIdx >= sorted.length) return;
        const neighbor = sorted[neighborIdx];
        setBusyId(m.id);
        try {
            const [u1, u2] = await Promise.all([
                api.teamMembers.update(m.id,        { display_order: neighbor.display_order }),
                api.teamMembers.update(neighbor.id, { display_order: m.display_order }),
            ]);
            setMembers(prev => prev.map(x => {
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

    const handleChangeCategory = async (m, category) => {
        if (m.category === category) return;
        setBusyId(m.id);
        try {
            const updated = await api.teamMembers.update(m.id, { category });
            setMembers(prev => prev.map(x => x.id === m.id ? updated : x));
            showToast('success', `« ${updated.name} » déplacé·e`);
        } catch (e) {
            showToast('error', e.message || 'Erreur déplacement');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={Users} title="Équipe (page À propos)" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les membres affichés sur la <strong>page publique « À propos »</strong>.
                Trois catégories sont disponibles :
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                    <li><strong>Principaux</strong> — équipe core, cards verticales centrées (photo + rôle + bio + liens).</li>
                    <li><strong>Secondaires</strong> — contributeur·ices proches, cards horizontales compactes (mêmes infos).</li>
                    <li><strong>Communauté</strong> — chercheur·euses associé·es, liste textuelle nom + rôle.</li>
                </ul>
                Cette page ne gère pas les comptes utilisateurs ; pour ça, voir <em>Gestion d'équipe (comptes)</em>.
            </ExplainerBox>

            <AdminTabs
                tabs={TABS}
                active={activeTab}
                onChange={(key) => { setActiveTab(key); setEditingId(null); setShowForm(false); }}
                counts={counts}
            />

            <AdminTabDescription>{currentTab.description}</AdminTabDescription>

            {/* Bouton + formulaire d'ajout */}
            {!showForm && (
                <button
                    type="button"
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    style={{ ...primaryBtnStyle, marginBottom: '16px' }}
                >
                    <Plus size={14} /> Ajouter un membre
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Nouveau membre — {currentTab.label}
                    </p>
                    <MemberForm
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
                ) : filteredMembers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
                        Aucun membre dans cet onglet.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredMembers
                            .slice()
                            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                            .map((m, idx, arr) => {
                                const isEditing = editingId === m.id;
                                if (isEditing) {
                                    return (
                                        <div key={m.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                                Édition de « {m.name} »
                                            </p>
                                            <MemberForm
                                                initial={m}
                                                onCancel={() => setEditingId(null)}
                                                onSubmit={(data) => handleUpdate(m.id, data)}
                                                busy={busyId === m.id}
                                                submitLabel="Enregistrer"
                                            />
                                        </div>
                                    );
                                }
                                return (
                                    <div key={m.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                        padding: '10px 14px', background: 'var(--color-surface-2)',
                                    }}>
                                        {m.photo_path ? (
                                            <img src={m.photo_path} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--color-text-muted)', fontSize: '1rem', flexShrink: 0 }}>
                                                {(m.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)' }}>
                                                {m.name}
                                            </div>
                                            {m.role && (
                                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{m.role}</div>
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

                                        <select
                                            value={m.category}
                                            onChange={e => handleChangeCategory(m, e.target.value)}
                                            disabled={busyId === m.id}
                                            style={{
                                                padding: '6px 8px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--color-border)',
                                                background: 'var(--color-surface)',
                                                fontFamily: 'inherit',
                                                fontSize: '0.78rem',
                                                color: 'var(--color-text-muted)',
                                                cursor: 'pointer',
                                            }}
                                            title="Déplacer vers une autre catégorie"
                                        >
                                            {TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => { setEditingId(m.id); setShowForm(false); }}
                                            disabled={busyId === m.id}
                                            style={ghostBtnStyle}
                                            title="Modifier"
                                        >
                                            <Pencil size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(m)}
                                            disabled={busyId === m.id}
                                            style={dangerBtnStyle}
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

export default AdminTeamContent;
