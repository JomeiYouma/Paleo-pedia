import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Briefcase, Plus, Trash2, Upload, Eye, EyeOff, Pencil, Save, X,
    ArrowUp, ArrowDown,
} from 'lucide-react';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast, TranslateButton,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';
import { PRESTATION_ICON_OPTIONS, getPrestationIcon } from '../utils/prestationIcons';

// ── Formulaire ───────────────────────────────────────────────
const PrestationForm = ({ initial, onCancel, onSubmit, busy, submitLabel = 'Enregistrer' }) => {
    const [title, setTitle]           = useState(initial?.title || '');
    const [titleEn, setTitleEn]       = useState(initial?.title_en || '');
    const [intro, setIntro]           = useState(initial?.intro || '');
    const [introEn, setIntroEn]       = useState(initial?.intro_en || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [descriptionEn, setDescriptionEn] = useState(initial?.description_en || '');
    const [bullets, setBullets]       = useState(initial?.bullet_points || '');
    const [bulletsEn, setBulletsEn]   = useState(initial?.bullet_points_en || '');
    const [imagePath, setImagePath]   = useState(initial?.image_path || '');
    const [iconName, setIconName]     = useState(initial?.icon_name || 'Sparkles');
    const [pdfUrl, setPdfUrl]         = useState(initial?.pdf_path || '');
    const [pdfLabel, setPdfLabel]     = useState(initial?.pdf_label || '');
    const [pdfLabelEn, setPdfLabelEn] = useState(initial?.pdf_label_en || '');
    const [isPublished, setIsPublished] = useState(initial ? initial.is_published !== 0 : true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleImage = async (file) => {
        if (!file) return;
        setUploadingImage(true);
        setUploadError('');
        try {
            const up = await api.media.upload(file);
            setImagePath(up?.url || '');
        } catch (e) {
            setUploadError(e.message || "Échec de l'upload");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            title_en: titleEn.trim() || null,
            intro: intro.trim() || null,
            intro_en: introEn.trim() || null,
            description: description.trim() || null,
            description_en: descriptionEn.trim() || null,
            bullet_points: bullets.trim() || null,
            bullet_points_en: bulletsEn.trim() || null,
            image_path: imagePath || null,
            icon_name: iconName || null,
            pdf_path: pdfUrl.trim() || null,
            pdf_label: pdfLabel.trim() || null,
            pdf_label_en: pdfLabelEn.trim() || null,
            is_published: isPublished,
        });
    };

    const SelectedIcon = getPrestationIcon(iconName);

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Titre *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle}
                        placeholder="Challenges Rétrofutur" />
                </div>
                <div>
                    <label style={labelStyle}>Icône</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                            width: '38px', height: '38px',
                            background: 'var(--color-primary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <SelectedIcon size={18} color="var(--color-accent)" />
                        </div>
                        <select value={iconName} onChange={e => setIconName(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                            {PRESTATION_ICON_OPTIONS.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label} ({opt.key})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label style={labelStyle}>Intro (question / accroche)</label>
                <textarea value={intro} onChange={e => setIntro(e.target.value)} rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Vous êtes une entreprise ou une collectivité et vous souhaitez remuer l'innovation ?" />
            </div>

            <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Description détaillée de la prestation, ses objectifs et son déroulé." />
            </div>

            <div>
                <label style={labelStyle}>Liste à puces (optionnelle — un item par ligne)</label>
                <textarea value={bullets} onChange={e => setBullets(e.target.value)} rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
                    placeholder={"Sensibilisation à l'écologie\nDécouverte de la recherche par l'exhumation d'archives\nÉtude des brevets anciens"} />
            </div>

            {/* Image / photo illustrative */}
            <div>
                <label style={labelStyle}>Image illustrative (optionnelle)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {imagePath ? (
                        <img src={imagePath} alt="" style={{ width: '120px', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                    ) : (
                        <div style={{ width: '120px', height: '80px', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            (vide)
                        </div>
                    )}
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: uploadingImage ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                        <Upload size={14} />
                        {uploadingImage ? 'Upload en cours…' : (imagePath ? "Remplacer l'image" : 'Choisir une image…')}
                        <input type="file" accept="image/*" disabled={uploadingImage} style={{ display: 'none' }} onChange={e => handleImage(e.target.files?.[0])} />
                    </label>
                    {imagePath && (
                        <button type="button" onClick={() => setImagePath('')} style={ghostBtnStyle} title="Retirer l'image">
                            <X size={14} />
                        </button>
                    )}
                </div>
                {uploadError && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--color-error)' }}>{uploadError}</p>
                )}
            </div>

            {/* Plaquette (URL externe ou PDF uploadé) */}
            <div>
                <label style={labelStyle}>Plaquette — URL (Calaméo, PDF…) optionnelle</label>
                <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} style={inputStyle}
                    placeholder="https://www.calameo.com/books/… ou /downloads/plaquette.pdf" />
                <input value={pdfLabel} onChange={e => setPdfLabel(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }}
                    placeholder="Libellé du bouton — défaut : « Consulter la plaquette »" />
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
                        getFrFields={() => ({
                            title, intro, description, bullet_points: bullets, pdf_label: pdfLabel,
                        })}
                        onTranslated={(out) => {
                            if ('title'         in out) setTitleEn(out.title);
                            if ('intro'         in out) setIntroEn(out.intro);
                            if ('description'   in out) setDescriptionEn(out.description);
                            if ('bullet_points' in out) setBulletsEn(out.bullet_points);
                            if ('pdf_label'     in out) setPdfLabelEn(out.pdf_label);
                        }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Title (EN)</label>
                    <input value={titleEn} onChange={e => setTitleEn(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Intro (EN)</label>
                    <textarea value={introEn} onChange={e => setIntroEn(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Description (EN)</label>
                    <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Bullets (EN) — one per line</label>
                    <textarea value={bulletsEn} onChange={e => setBulletsEn(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>PDF button label (EN)</label>
                    <input value={pdfLabelEn} onChange={e => setPdfLabelEn(e.target.value)} style={inputStyle} placeholder="View brochure" />
                </div>
            </fieldset>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                Prestation publiée (visible sur la page /prestations)
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

// ── Page principale ───────────────────────────────────────────
const AdminPrestations = () => {
    const { isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.prestations.getAll();
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
            const created = await api.prestations.create({ ...data, display_order: maxOrder + 10 });
            setItems(prev => [...prev, created]);
            setShowForm(false);
            showToast('success', `« ${created.title} » ajoutée`);
        } catch (e) {
            showToast('error', e.message || 'Erreur création');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (id, data) => {
        setBusyId(id);
        try {
            const updated = await api.prestations.update(id, data);
            setItems(prev => prev.map(x => x.id === id ? updated : x));
            setEditingId(null);
            showToast('success', `« ${updated.title} » mise à jour`);
        } catch (e) {
            showToast('error', e.message || 'Erreur mise à jour');
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (p) => {
        setBusyId(p.id);
        try {
            const updated = await api.prestations.update(p.id, { is_published: !p.is_published });
            setItems(prev => prev.map(x => x.id === p.id ? updated : x));
            showToast('success', updated.is_published ? 'Prestation publiée' : 'Prestation masquée');
        } catch (e) {
            showToast('error', e.message || 'Erreur');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (p) => {
        if (!confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
        setBusyId(p.id);
        try {
            await api.prestations.delete(p.id);
            setItems(prev => prev.filter(x => x.id !== p.id));
            showToast('success', `« ${p.title} » supprimée`);
        } catch (e) {
            showToast('error', e.message || 'Erreur suppression');
        } finally {
            setBusyId(null);
        }
    };

    const handleMove = async (p, direction) => {
        const sorted = [...items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const idx = sorted.findIndex(x => x.id === p.id);
        const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (neighborIdx < 0 || neighborIdx >= sorted.length) return;
        const neighbor = sorted[neighborIdx];
        setBusyId(p.id);
        try {
            const [u1, u2] = await Promise.all([
                api.prestations.update(p.id,        { display_order: neighbor.display_order }),
                api.prestations.update(neighbor.id, { display_order: p.display_order }),
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

            <AdminPageHeader icon={Briefcase} title="Prestations" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les cards de prestation affichées sur la <strong>page publique /prestations</strong>.
                Chaque card a un titre, une icône, une accroche, une description, éventuellement une liste à
                puces et une plaquette PDF téléchargeable.
                L'ordre d'affichage est défini par les flèches ↑ ↓ ci-dessous.
            </ExplainerBox>

            {!showForm && (
                <button
                    type="button"
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    style={{ ...primaryBtnStyle, marginBottom: '16px' }}
                >
                    <Plus size={14} /> Ajouter une prestation
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Nouvelle prestation
                    </p>
                    <PrestationForm
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
                        Aucune prestation. Ajoutez la première ci-dessus.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedItems.map((p, idx, arr) => {
                            const isEditing = editingId === p.id;
                            if (isEditing) {
                                return (
                                    <div key={p.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                            Édition de « {p.title} »
                                        </p>
                                        <PrestationForm
                                            initial={p}
                                            onCancel={() => setEditingId(null)}
                                            onSubmit={(data) => handleUpdate(p.id, data)}
                                            busy={busyId === p.id}
                                        />
                                    </div>
                                );
                            }
                            const Icon = getPrestationIcon(p.icon_name);
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    background: 'var(--color-surface-2)',
                                    opacity: p.is_published ? 1 : 0.6,
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'var(--color-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={18} color="var(--color-accent)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)' }}>
                                            {p.title}
                                            {!p.is_published && <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: 'var(--color-warning)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>· masquée</span>}
                                        </div>
                                        {p.intro && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.intro}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(p, 'up')}
                                            disabled={idx === 0 || busyId === p.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Monter"
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMove(p, 'down')}
                                            disabled={idx === arr.length - 1 || busyId === p.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === arr.length - 1 ? 0.3 : 1 }}
                                            title="Descendre"
                                        >
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleTogglePublish(p)}
                                        disabled={busyId === p.id}
                                        style={{
                                            ...ghostBtnStyle,
                                            padding: '5px 10px',
                                            background: p.is_published ? 'var(--color-accent)' : 'var(--color-surface)',
                                            color: p.is_published ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                                            borderColor: p.is_published ? 'var(--color-accent)' : 'var(--color-border)',
                                        }}
                                        title={p.is_published ? 'Masquer' : 'Publier'}
                                    >
                                        {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(p.id); setShowForm(false); }}
                                        disabled={busyId === p.id}
                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                        title="Modifier"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(p)}
                                        disabled={busyId === p.id}
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

export default AdminPrestations;
