import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    ShoppingBag, Plus, Trash2, Upload, Eye, EyeOff, Pencil, Save, X,
    ArrowUp, ArrowDown, ExternalLink,
} from 'lucide-react';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, AdminTabs, AdminTabDescription,
    useAdminToast, TranslateButton,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Onglets / catégories ─────────────────────────────────────
const TABS = [
    { key: 'book',  label: 'Livres',         description: "Ouvrages — chaque card pointe vers la page produit du PrestaShop." },
    { key: 'game',  label: 'Jeux de cartes', description: 'Jeux et autres supports ludiques distribués via le PrestaShop.' },
    { key: 'other', label: 'Autres',         description: "Autres produits ou ressources qui ne rentrent pas dans Livres ou Jeux." },
];

// ── Formulaire ───────────────────────────────────────────────
const ShopItemForm = ({ initial, onCancel, onSubmit, busy, submitLabel = 'Enregistrer' }) => {
    const [title, setTitle]         = useState(initial?.title || '');
    const [titleEn, setTitleEn]     = useState(initial?.title_en || '');
    const [subtitle, setSubtitle]   = useState(initial?.subtitle || '');
    const [subtitleEn, setSubtitleEn] = useState(initial?.subtitle_en || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [descriptionEn, setDescriptionEn] = useState(initial?.description_en || '');
    const [imagePath, setImagePath] = useState(initial?.image_path || '');
    const [externalUrl, setExternalUrl] = useState(initial?.external_url || '');
    const [priceText, setPriceText] = useState(initial?.price_text || '');
    const [isPublished, setIsPublished] = useState(initial ? initial.is_published !== 0 : true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleImage = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadError('');
        try {
            const up = await api.media.upload(file);
            setImagePath(up?.url || '');
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
            title_en: titleEn.trim() || null,
            subtitle: subtitle.trim() || null,
            subtitle_en: subtitleEn.trim() || null,
            description: description.trim() || null,
            description_en: descriptionEn.trim() || null,
            image_path: imagePath || null,
            external_url: externalUrl.trim() || null,
            price_text: priceText.trim() || null,
            is_published: isPublished,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <label style={labelStyle}>Titre *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle}
                    placeholder="Rétrofutur : une autre histoire des innovations énergétiques" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Sous-titre / éditeur (optionnel)</label>
                    <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={inputStyle}
                        placeholder="Éditions Buchet/Chastel" />
                </div>
                <div>
                    <label style={labelStyle}>Prix indicatif</label>
                    <input value={priceText} onChange={e => setPriceText(e.target.value)} style={inputStyle}
                        placeholder="28 €  ou  5,99 € – 30 €" />
                </div>
            </div>

            <div>
                <label style={labelStyle}>URL PrestaShop *</label>
                <input value={externalUrl} onChange={e => setExternalUrl(e.target.value)} style={inputStyle}
                    type="url"
                    placeholder="https://shop.atelier21.org/product/…" />
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                    Lien vers la fiche produit. Sans URL, la card s'affiche mais le bouton « Acheter » est masqué.
                </p>
            </div>

            <div>
                <label style={labelStyle}>Description (optionnelle)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="L'ouvrage de référence du projet — une encyclopédie visuelle…" />
            </div>

            {/* Image */}
            <div>
                <label style={labelStyle}>Visuel (couverture / vignette)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {imagePath ? (
                        <img src={imagePath} alt="" style={{ width: '80px', height: '110px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                    ) : (
                        <div style={{ width: '80px', height: '110px', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            (vide)
                        </div>
                    )}
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                        <Upload size={14} />
                        {uploading ? 'Upload en cours…' : (imagePath ? "Remplacer l'image" : 'Choisir une image…')}
                        <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={e => handleImage(e.target.files?.[0])} />
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
                        getFrFields={() => ({ title, subtitle, description })}
                        onTranslated={(out) => {
                            if ('title'       in out) setTitleEn(out.title);
                            if ('subtitle'    in out) setSubtitleEn(out.subtitle);
                            if ('description' in out) setDescriptionEn(out.description);
                        }}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Title (EN)</label>
                    <input value={titleEn} onChange={e => setTitleEn(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Subtitle / publisher (EN)</label>
                    <input value={subtitleEn} onChange={e => setSubtitleEn(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Description (EN)</label>
                    <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
            </fieldset>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                Item publié (visible sur la page /boutique)
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
const AdminShop = () => {
    const { isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('book');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.shopItems.getAll();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast('error', e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const currentTab = TABS.find(t => t.key === activeTab) || TABS[0];
    const filteredItems = useMemo(
        () => items.filter(x => x.category === activeTab),
        [items, activeTab]
    );
    const counts = useMemo(() => Object.fromEntries(
        TABS.map(t => [t.key, items.filter(x => x.category === t.key).length])
    ), [items]);

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
            const maxOrder = filteredItems.reduce((m, x) => Math.max(m, x.display_order || 0), 0);
            const created = await api.shopItems.create({
                ...data,
                category: activeTab,
                display_order: maxOrder + 10,
            });
            setItems(prev => [...prev, created]);
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
            const updated = await api.shopItems.update(id, data);
            setItems(prev => prev.map(x => x.id === id ? updated : x));
            setEditingId(null);
            showToast('success', `« ${updated.title} » mis à jour`);
        } catch (e) {
            showToast('error', e.message || 'Erreur mise à jour');
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (it) => {
        setBusyId(it.id);
        try {
            const updated = await api.shopItems.update(it.id, { is_published: !it.is_published });
            setItems(prev => prev.map(x => x.id === it.id ? updated : x));
            showToast('success', updated.is_published ? 'Item publié' : 'Item masqué');
        } catch (e) {
            showToast('error', e.message || 'Erreur');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (it) => {
        if (!confirm(`Supprimer définitivement « ${it.title} » ?`)) return;
        setBusyId(it.id);
        try {
            await api.shopItems.delete(it.id);
            setItems(prev => prev.filter(x => x.id !== it.id));
            showToast('success', `« ${it.title} » supprimé`);
        } catch (e) {
            showToast('error', e.message || 'Erreur suppression');
        } finally {
            setBusyId(null);
        }
    };

    const handleMove = async (it, direction) => {
        const sorted = [...filteredItems].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const idx = sorted.findIndex(x => x.id === it.id);
        const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (neighborIdx < 0 || neighborIdx >= sorted.length) return;
        const neighbor = sorted[neighborIdx];
        setBusyId(it.id);
        try {
            const [u1, u2] = await Promise.all([
                api.shopItems.update(it.id,        { display_order: neighbor.display_order }),
                api.shopItems.update(neighbor.id,  { display_order: it.display_order }),
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

    const handleChangeCategory = async (it, category) => {
        if (it.category === category) return;
        setBusyId(it.id);
        try {
            const updated = await api.shopItems.update(it.id, { category });
            setItems(prev => prev.map(x => x.id === it.id ? updated : x));
            showToast('success', `« ${updated.title} » déplacé`);
        } catch (e) {
            showToast('error', e.message || 'Erreur déplacement');
        } finally {
            setBusyId(null);
        }
    };

    const sortedItems = filteredItems.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={ShoppingBag} title="Boutique (liens externes)" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les liens vers le <strong>PrestaShop externe</strong> affichés sur la page publique
                /boutique. Le site ne gère pas de panier ni de paiement : chaque card est un lien enrichi
                (visuel, titre, prix indicatif) qui renvoie vers la fiche produit hébergée chez PrestaShop.
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                    <li><strong>Livres</strong> — ouvrages Rétrofutur (FR/EN/JP…)</li>
                    <li><strong>Jeux de cartes</strong> — supports ludiques</li>
                    <li><strong>Autres</strong> — tout le reste</li>
                </ul>
            </ExplainerBox>

            <AdminTabs
                tabs={TABS}
                active={activeTab}
                onChange={(key) => { setActiveTab(key); setEditingId(null); setShowForm(false); }}
                counts={counts}
            />

            <AdminTabDescription>{currentTab.description}</AdminTabDescription>

            {!showForm && (
                <button
                    type="button"
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    style={{ ...primaryBtnStyle, marginBottom: '16px' }}
                >
                    <Plus size={14} /> Ajouter un item
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Nouveau lien — {currentTab.label}
                    </p>
                    <ShopItemForm
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
                        Aucun item dans cet onglet.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedItems.map((it, idx, arr) => {
                            const isEditing = editingId === it.id;
                            if (isEditing) {
                                return (
                                    <div key={it.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                            Édition de « {it.title} »
                                        </p>
                                        <ShopItemForm
                                            initial={it}
                                            onCancel={() => setEditingId(null)}
                                            onSubmit={(data) => handleUpdate(it.id, data)}
                                            busy={busyId === it.id}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div key={it.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px',
                                    background: 'var(--color-surface-2)',
                                    opacity: it.is_published ? 1 : 0.6,
                                }}>
                                    {it.image_path ? (
                                        <img src={it.image_path} alt="" style={{ width: '52px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: '52px', height: '72px', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.7rem', flexShrink: 0 }}>
                                            —
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {it.title}
                                            {!it.is_published && <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: 'var(--color-warning)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>· masqué</span>}
                                        </div>
                                        {(it.subtitle || it.price_text) && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                {it.subtitle}{it.subtitle && it.price_text ? ' · ' : ''}{it.price_text}
                                            </div>
                                        )}
                                        {it.external_url ? (
                                            <a href={it.external_url} target="_blank" rel="noopener noreferrer"
                                                style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <ExternalLink size={11} /> {it.external_url.replace(/^https?:\/\//, '').slice(0, 38)}…
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)' }}>URL manquante</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button type="button" onClick={() => handleMove(it, 'up')}
                                            disabled={idx === 0 || busyId === it.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Monter">
                                            <ArrowUp size={12} />
                                        </button>
                                        <button type="button" onClick={() => handleMove(it, 'down')}
                                            disabled={idx === arr.length - 1 || busyId === it.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === arr.length - 1 ? 0.3 : 1 }}
                                            title="Descendre">
                                            <ArrowDown size={12} />
                                        </button>
                                    </div>

                                    <select
                                        value={it.category}
                                        onChange={e => handleChangeCategory(it, e.target.value)}
                                        disabled={busyId === it.id}
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
                                        onClick={() => handleTogglePublish(it)}
                                        disabled={busyId === it.id}
                                        style={{
                                            ...ghostBtnStyle,
                                            padding: '5px 10px',
                                            background: it.is_published ? 'var(--color-accent)' : 'var(--color-surface)',
                                            color: it.is_published ? 'var(--color-primary)' : 'var(--color-text-subtle)',
                                            borderColor: it.is_published ? 'var(--color-accent)' : 'var(--color-border)',
                                        }}
                                        title={it.is_published ? 'Masquer' : 'Publier'}
                                    >
                                        {it.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(it.id); setShowForm(false); }}
                                        disabled={busyId === it.id}
                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                        title="Modifier"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(it)}
                                        disabled={busyId === it.id}
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

export default AdminShop;
