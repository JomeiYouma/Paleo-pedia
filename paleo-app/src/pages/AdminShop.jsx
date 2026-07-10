import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    ShoppingBag, Plus, Trash2, Upload, Eye, EyeOff, Pencil, Save, X,
    ArrowUp, ArrowDown, ExternalLink,
} from 'lucide-react';
import api from '../services/apiClient';
import { useTranslation } from 'react-i18next';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, AdminTabs, AdminTabDescription,
    useAdminToast, TranslateButton,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// ── Onglets / catégories ─────────────────────────────────────
const TABS = [
    { key: 'book',  label: 'Livres',         description: "Ouvrages — chaque article renvoie vers un ou plusieurs liens de paiement Stripe." },
    { key: 'game',  label: 'Jeux de cartes', description: 'Jeux et autres supports ludiques vendus via des liens de paiement Stripe.' },
    { key: 'other', label: 'Autres',         description: "Autres produits ou ressources qui ne rentrent pas dans Livres ou Jeux." },
];

// ── Variantes & options de paiement (liens Stripe) ───────────
// Un article → variantes (ex. Papier / E-book) → options de paiement
// (ex. modes d'envoi), avec un lien Stripe par option.
const EMPTY_OPTION  = { label: '', label_en: '', price: '', url: '' };
const newVariant    = () => ({ label: '', label_en: '', options: [{ ...EMPTY_OPTION }] });

// Normalise les options d'une variante (repli sur l'ancien lien unique `url`).
const initOptions = (v) => {
    if (Array.isArray(v?.options) && v.options.length) {
        return v.options.map(o => ({
            label: o.label || '', label_en: o.label_en || '',
            price: o.price || '', url: o.url || '',
        }));
    }
    if (v?.url) return [{ label: '', label_en: '', price: v.price || '', url: v.url }];
    return [{ ...EMPTY_OPTION }];
};

// Amorce la liste de variantes à l'ouverture du formulaire :
// variantes existantes, sinon repli sur l'ancien lien unique, sinon une ligne vide.
const initVersions = (initial) => {
    if (Array.isArray(initial?.versions) && initial.versions.length) {
        return initial.versions.map(v => ({
            label:    v.label    || '',
            label_en: v.label_en || '',
            options:  initOptions(v),
        }));
    }
    if (initial?.external_url) {
        return [{ label: '', label_en: '', options: [{ label: '', label_en: '', price: initial.price_text || '', url: initial.external_url }] }];
    }
    return [newVariant()];
};

// ── Formulaire ───────────────────────────────────────────────
const ShopItemForm = ({ initial, onCancel, onSubmit, busy, submitLabel }) => {
    const { t } = useTranslation();
    const [title, setTitle]         = useState(initial?.title || '');
    const [titleEn, setTitleEn]     = useState(initial?.title_en || '');
    const [subtitle, setSubtitle]   = useState(initial?.subtitle || '');
    const [subtitleEn, setSubtitleEn] = useState(initial?.subtitle_en || '');
    const [description, setDescription] = useState(initial?.description || '');
    const [descriptionEn, setDescriptionEn] = useState(initial?.description_en || '');
    const [imagePath, setImagePath] = useState(initial?.image_path || '');
    const [versions, setVersions] = useState(() => initVersions(initial));
    const [isPublished, setIsPublished] = useState(initial ? initial.is_published !== 0 : true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Variantes (niveau 1)
    const setVariant    = (vi, patch) => setVersions(vs => vs.map((v, i) => (i === vi ? { ...v, ...patch } : v)));
    const addVariant    = ()          => setVersions(vs => [...vs, newVariant()]);
    const removeVariant = (vi)        => setVersions(vs => (vs.length > 1 ? vs.filter((_, i) => i !== vi) : vs));
    // Options de paiement (niveau 2, imbriqué dans une variante)
    const setOption     = (vi, oi, patch) => setVersions(vs => vs.map((v, i) => (i !== vi ? v : { ...v, options: v.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) })));
    const addOption     = (vi)        => setVersions(vs => vs.map((v, i) => (i !== vi ? v : { ...v, options: [...v.options, { ...EMPTY_OPTION }] })));
    const removeOption  = (vi, oi)    => setVersions(vs => vs.map((v, i) => (i !== vi ? v : { ...v, options: v.options.length > 1 ? v.options.filter((_, j) => j !== oi) : v.options })));

    const handleImage = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadError('');
        try {
            const up = await api.media.upload(file);
            setImagePath(up?.url || '');
        } catch (e) {
            setUploadError(e.message || t('adminShop.uploadFailed', "Échec de l'upload"));
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
            versions: versions
                .map(v => ({
                    label:    v.label.trim(),
                    label_en: v.label_en.trim(),
                    options: v.options
                        .map(o => ({
                            label:    o.label.trim(),
                            label_en: o.label_en.trim(),
                            price:    o.price.trim(),
                            url:      o.url.trim(),
                        }))
                        .filter(o => o.url),
                }))
                .filter(v => v.options.length),
            is_published: isPublished,
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
                <label style={labelStyle}>{t('adminShop.titleLabel', 'Titre *')}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle}
                    placeholder={t('adminShop.titlePlaceholder', 'Rétrofutur : une autre histoire des innovations énergétiques')} />
            </div>

            <div>
                <label style={labelStyle}>{t('adminShop.subtitleLabel', 'Sous-titre / éditeur (optionnel)')}</label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={inputStyle}
                    placeholder={t('adminShop.subtitlePlaceholder', 'Éditions Buchet/Chastel')} />
            </div>

            {/* ── Variantes & options de paiement Stripe ──────────────── */}
            <div>
                <label style={labelStyle}>{t('adminShop.variantsLabel', 'Variantes & options de paiement Stripe')}</label>
                <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'var(--color-text-subtle)', lineHeight: '1.5' }}>
                    {t('adminShop.variantsHelp1', 'Un article se décline en ')}<strong>{t('adminShop.variantsHelpStrong1', 'variantes')}</strong>{t('adminShop.variantsHelp2', ' (ex. Papier / E-book), et chaque variante en ')}<strong>{t('adminShop.variantsHelpStrong2', 'options de paiement')}</strong>{t('adminShop.variantsHelp3', " (ex. modes d'envoi), avec un lien Stripe par option. Sur la page produit : si tout est unique → un bouton « Acheter » ; sinon l'affichage s'adapte (choix de la variante puis de l'option). Laissez le nom d'une option vide s'il n'y en a qu'une. Une option sans lien est ignorée.")}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {versions.map((v, vi) => (
                        <div key={vi} style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px',
                            background: 'var(--color-surface-2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            {/* En-tête + nom de la variante */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)' }}>
                                    {t('adminShop.variantNumber', { n: vi + 1, defaultValue: `Variante ${vi + 1}` })}
                                </span>
                                {versions.length > 1 && (
                                    <button type="button" onClick={() => removeVariant(vi)}
                                        style={{ ...ghostBtnStyle, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={t('adminShop.deleteVariantTitle', 'Supprimer cette variante')}>
                                        <Trash2 size={13} /> {t('adminShop.deleteVariantBtn', 'Variante')}
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={labelStyle}>{t('adminShop.variantNameFr', 'Nom de la variante (FR)')}</label>
                                    <input value={v.label} onChange={e => setVariant(vi, { label: e.target.value })}
                                        style={inputStyle} placeholder={t('adminShop.variantNameFrPlaceholder', 'Papier')} />
                                </div>
                                <div>
                                    <label style={labelStyle}>{t('adminShop.variantNameEn', 'Nom (EN, optionnel)')}</label>
                                    <input value={v.label_en} onChange={e => setVariant(vi, { label_en: e.target.value })}
                                        style={inputStyle} placeholder={t('adminShop.variantNameEnPlaceholder', 'Paperback')} />
                                </div>
                            </div>

                            {/* Options de paiement (un lien Stripe par option) */}
                            <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '10px', marginLeft: '2px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
                                    {t('adminShop.paymentOptionsHeading', 'Options de paiement — un lien Stripe par option')}
                                </span>
                                {v.options.map((o, oi) => (
                                    <div key={oi} style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '10px',
                                        background: 'var(--color-surface)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', fontWeight: '700' }}>
                                                {t('adminShop.optionNumber', { n: oi + 1, defaultValue: `Option ${oi + 1}` })}
                                            </span>
                                            {v.options.length > 1 && (
                                                <button type="button" onClick={() => removeOption(vi, oi)}
                                                    style={{ ...ghostBtnStyle, padding: '2px 6px' }} title={t('adminShop.deleteOptionTitle', 'Supprimer cette option')}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={labelStyle}>{t('adminShop.optionNameFr', 'Nom (FR)')}</label>
                                                <input value={o.label} onChange={e => setOption(vi, oi, { label: e.target.value })}
                                                    style={inputStyle} placeholder={t('adminShop.optionNameFrPlaceholder', 'Point Relais')} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>{t('adminShop.optionNameEn', 'Nom (EN, opt.)')}</label>
                                                <input value={o.label_en} onChange={e => setOption(vi, oi, { label_en: e.target.value })}
                                                    style={inputStyle} placeholder={t('adminShop.optionNameEnPlaceholder', 'Pickup point')} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>{t('adminShop.priceLabel', 'Prix')}</label>
                                                <input value={o.price} onChange={e => setOption(vi, oi, { price: e.target.value })}
                                                    style={inputStyle} placeholder={t('adminShop.pricePlaceholder', '4,15 €')} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>{t('adminShop.stripeLinkLabel', 'Lien de paiement Stripe')}</label>
                                            <input value={o.url} onChange={e => setOption(vi, oi, { url: e.target.value })}
                                                style={inputStyle} type="url" placeholder="https://buy.stripe.com/…" />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addOption(vi)} style={{ ...ghostBtnStyle, padding: '5px 10px', alignSelf: 'flex-start' }}>
                                    <Plus size={13} /> {t('adminShop.addOption', 'Ajouter une option')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addVariant} style={{ ...ghostBtnStyle, marginTop: '10px' }}>
                    <Plus size={14} /> {t('adminShop.addVariant', 'Ajouter une variante')}
                </button>
            </div>

            <div>
                <label style={labelStyle}>{t('adminShop.descriptionLabel', 'Description (optionnelle)')}</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder={t('adminShop.descriptionPlaceholder', "L'ouvrage de référence du projet — une encyclopédie visuelle…")} />
            </div>

            {/* Image */}
            <div>
                <label style={labelStyle}>{t('adminShop.imageLabel', 'Visuel (couverture / vignette)')}</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {imagePath ? (
                        <img src={imagePath} alt="" style={{ width: '80px', height: '110px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                    ) : (
                        <div style={{ width: '80px', height: '110px', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-subtle)', fontSize: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            {t('adminShop.emptyPlaceholder', '(vide)')}
                        </div>
                    )}
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
                        <Upload size={14} />
                        {uploading ? t('adminShop.uploading', 'Upload en cours…') : (imagePath ? t('adminShop.replaceImage', "Remplacer l'image") : t('adminShop.chooseImage', 'Choisir une image…'))}
                        <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={e => handleImage(e.target.files?.[0])} />
                    </label>
                    {imagePath && (
                        <button type="button" onClick={() => setImagePath('')} style={ghostBtnStyle} title={t('adminShop.removeImage', "Retirer l'image")}>
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
                    {t('adminShop.englishVersion', 'Version anglaise')}
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
                {t('adminShop.publishedCheckbox', 'Item publié (visible sur la page /boutique)')}
            </label>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={busy} style={ghostBtnStyle}>
                        {t('adminShop.cancel', 'Annuler')}
                    </button>
                )}
                <button type="submit" disabled={busy || !title.trim()} style={{
                    ...primaryBtnStyle,
                    opacity: (busy || !title.trim()) ? 0.5 : 1,
                    cursor: (busy || !title.trim()) ? 'not-allowed' : 'pointer',
                }}>
                    <Save size={14} /> {busy ? t('adminShop.sending', 'Envoi…') : (submitLabel || t('adminShop.submitDefault', 'Enregistrer'))}
                </button>
            </div>
        </form>
    );
};

// ── Page principale ───────────────────────────────────────────
const AdminShop = () => {
    const { t } = useTranslation();
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
            showToast('error', e.message || t('adminShop.loadError', 'Erreur de chargement'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const tabKeyMap = {
        book:  ['adminShop.tabBookLabel', 'adminShop.tabBookDesc'],
        game:  ['adminShop.tabGameLabel', 'adminShop.tabGameDesc'],
        other: ['adminShop.tabOtherLabel', 'adminShop.tabOtherDesc'],
    };
    const localizedTabs = TABS.map(tab => ({
        key: tab.key,
        label: t(tabKeyMap[tab.key][0], tab.label),
        description: t(tabKeyMap[tab.key][1], tab.description),
    }));
    const currentTab = localizedTabs.find(x => x.key === activeTab) || localizedTabs[0];
    const filteredItems = useMemo(
        () => items.filter(x => x.category === activeTab),
        [items, activeTab]
    );
    const counts = useMemo(() => Object.fromEntries(
        TABS.map(tab => [tab.key, items.filter(x => x.category === tab.key).length])
    ), [items]);

    if (!isSuperadmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                {t('adminShop.superadminOnly', 'Accès réservé aux superadmins.')}
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
            showToast('success', t('adminShop.itemAdded', { title: created.title, defaultValue: `« ${created.title} » ajouté` }));
        } catch (e) {
            showToast('error', e.message || t('adminShop.createError', 'Erreur création'));
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
            showToast('success', t('adminShop.itemUpdated', { title: updated.title, defaultValue: `« ${updated.title} » mis à jour` }));
        } catch (e) {
            showToast('error', e.message || t('adminShop.updateError', 'Erreur mise à jour'));
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (it) => {
        setBusyId(it.id);
        try {
            const updated = await api.shopItems.update(it.id, { is_published: !it.is_published });
            setItems(prev => prev.map(x => x.id === it.id ? updated : x));
            showToast('success', updated.is_published ? t('adminShop.itemPublished', 'Item publié') : t('adminShop.itemHidden', 'Item masqué'));
        } catch (e) {
            showToast('error', e.message || t('adminShop.genericError', 'Erreur'));
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (it) => {
        if (!confirm(t('adminShop.confirmDelete', { title: it.title, defaultValue: `Supprimer définitivement « ${it.title} » ?` }))) return;
        setBusyId(it.id);
        try {
            await api.shopItems.delete(it.id);
            setItems(prev => prev.filter(x => x.id !== it.id));
            showToast('success', t('adminShop.itemDeleted', { title: it.title, defaultValue: `« ${it.title} » supprimé` }));
        } catch (e) {
            showToast('error', e.message || t('adminShop.deleteError', 'Erreur suppression'));
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
            showToast('error', e.message || t('adminShop.reorderError', 'Erreur réordonnancement'));
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
            showToast('success', t('adminShop.itemMoved', { title: updated.title, defaultValue: `« ${updated.title} » déplacé` }));
        } catch (e) {
            showToast('error', e.message || t('adminShop.moveError', 'Erreur déplacement'));
        } finally {
            setBusyId(null);
        }
    };

    const sortedItems = filteredItems.slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={ShoppingBag} title={t('adminShop.pageTitle', 'Boutique (liens Stripe)')} />

            <ExplainerBox title={t('adminShop.explainerTitle', 'À quoi sert cette page ?')}>
                {t('adminShop.explainer1', 'Gérer les articles affichés sur la page publique /boutique. Le site ne gère ni panier ni paiement : chaque article renvoie vers un ou plusieurs ')}<strong>{t('adminShop.explainerStrong1', 'liens de paiement Stripe')}</strong>{t('adminShop.explainer2', '. Un article peut proposer plusieurs ')}<strong>{t('adminShop.explainerStrong2', 'versions')}</strong>{t('adminShop.explainer3', ' (ex. Papier / E-book), chacune avec son nom, son prix et son propre lien.')}
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                    <li><strong>{t('adminShop.tabBookLabel', 'Livres')}</strong>{t('adminShop.explainerBooks', ' — ouvrages Rétrofutur (FR/EN/JP…)')}</li>
                    <li><strong>{t('adminShop.tabGameLabel', 'Jeux de cartes')}</strong>{t('adminShop.explainerGames', ' — supports ludiques')}</li>
                    <li><strong>{t('adminShop.tabOtherLabel', 'Autres')}</strong>{t('adminShop.explainerOther', ' — tout le reste')}</li>
                </ul>
            </ExplainerBox>

            <AdminTabs
                tabs={localizedTabs}
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
                    <Plus size={14} /> {t('adminShop.addItem', 'Ajouter un item')}
                </button>
            )}
            {showForm && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        {t('adminShop.newItem', 'Nouvel article —')} {currentTab.label}
                    </p>
                    <ShopItemForm
                        onCancel={() => setShowForm(false)}
                        onSubmit={handleCreate}
                        busy={creating}
                        submitLabel={t('adminShop.addBtn', 'Ajouter')}
                    />
                </AdminSection>
            )}

            <AdminSection>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0' }}>{t('adminShop.loading', 'Chargement…')}</p>
                ) : sortedItems.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
                        {t('adminShop.noItems', 'Aucun item dans cet onglet.')}
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sortedItems.map((it, idx, arr) => {
                            const isEditing = editingId === it.id;
                            if (isEditing) {
                                return (
                                    <div key={it.id} style={{ border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--color-surface)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                                            {t('adminShop.editingItem', { title: it.title, defaultValue: `Édition de « ${it.title} »` })}
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
                            const vers = Array.isArray(it.versions) ? it.versions : [];
                            const totalLinks = vers.reduce((n, v) => n + (Array.isArray(v.options) ? v.options.length : (v.url ? 1 : 0)), 0);
                            const firstUrl = vers[0]?.options?.[0]?.url || vers[0]?.url || '';
                            const versSummary = vers
                                .map(v => [v.label, v.price].filter(Boolean).join(' '))
                                .filter(Boolean).join(' — ');
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
                                            {!it.is_published && <span style={{ marginLeft: '8px', fontSize: '0.74rem', color: 'var(--color-warning)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('adminShop.hiddenTag', '· masqué')}</span>}
                                        </div>
                                        {it.subtitle && (
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {it.subtitle}
                                            </div>
                                        )}
                                        {vers.length > 0 ? (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                {(vers.length > 1 || totalLinks > 1) && (
                                                    <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                                        {vers.length > 1 ? t('adminShop.variantsCount', { n: vers.length, defaultValue: `${vers.length} variantes` }) : t('adminShop.oneVariant', '1 variante')} · {totalLinks} {totalLinks > 1 ? t('adminShop.linksPlural', 'liens') : t('adminShop.linkSingular', 'lien')} ·
                                                    </span>
                                                )}
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {versSummary || firstUrl.replace(/^https?:\/\//, '').slice(0, 40)}
                                                </span>
                                                {firstUrl && (
                                                    <a href={firstUrl} target="_blank" rel="noopener noreferrer"
                                                        title={t('adminShop.openPaymentLink', 'Ouvrir le lien de paiement')}
                                                        style={{ color: 'var(--color-text-subtle)', display: 'inline-flex' }}>
                                                        <ExternalLink size={11} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--color-warning)' }}>{t('adminShop.noPaymentLink', 'Aucun lien de paiement')}</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button type="button" onClick={() => handleMove(it, 'up')}
                                            disabled={idx === 0 || busyId === it.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title={t('adminShop.moveUp', 'Monter')}>
                                            <ArrowUp size={12} />
                                        </button>
                                        <button type="button" onClick={() => handleMove(it, 'down')}
                                            disabled={idx === arr.length - 1 || busyId === it.id}
                                            style={{ ...ghostBtnStyle, padding: '3px 6px', opacity: idx === arr.length - 1 ? 0.3 : 1 }}
                                            title={t('adminShop.moveDown', 'Descendre')}>
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
                                        title={t('adminShop.changeCategory', 'Déplacer vers une autre catégorie')}
                                    >
                                        {localizedTabs.map(tab => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
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
                                        title={it.is_published ? t('adminShop.hide', 'Masquer') : t('adminShop.publish', 'Publier')}
                                    >
                                        {it.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(it.id); setShowForm(false); }}
                                        disabled={busyId === it.id}
                                        style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                        title={t('adminShop.edit', 'Modifier')}
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(it)}
                                        disabled={busyId === it.id}
                                        style={{ ...dangerBtnStyle, padding: '5px 10px' }}
                                        title={t('adminShop.delete', 'Supprimer')}
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
