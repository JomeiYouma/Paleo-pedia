/**
 * SubsiteEditor.jsx
 * Panneau de création / édition d'un sous-site (modale).
 *
 * Modes :
 *   - création : choix de la source (catégorie OU atelier) + tous les champs
 *     d'identité (nom, slug, couleur), contenu de la page d'accueil, partenaires.
 *   - édition superadmin : tout sauf la source (figée à la création).
 *   - édition owner (canEditIdentity=false) : seulement contenu de la page
 *     d'accueil + couleur + partenaires. Ni le nom, ni le slug, ni la source
 *     ne sont modifiables — cohérent avec la liste OWNER_EDITABLE du
 *     controller (paleo-app/server/controllers/subsiteController.js).
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import api from '../services/apiClient';
import { BlockEditor } from './blocks/BlockEditor';

const slugify = (str) =>
    str.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Détecte le type de source d'un subsite existant en fonction des FK.
const detectSourceType = (subsite) => {
    if (!subsite) return 'category';
    if (subsite.workshop_id) return 'workshop';
    return 'category';
};

// Types de planète pour la vitrine Paléo-Pédia (doit rester synchronisé avec
// PLANET_TYPES dans components/pedia/Ecosystem3D.jsx). '' = automatique.
const PLANET_TYPE_OPTIONS = [
    { key: 'wind',   label: 'Éoliennes' },
    { key: 'forest', label: 'Forêt' },
    { key: 'solar',  label: 'Panneaux solaires' },
    { key: 'rocky',  label: 'Minéral / rocheux' },
    { key: 'icy',    label: 'Glacé (avec anneau)' },
    { key: 'lush',   label: 'Mixte (forêt + éoliennes)' },
];

const SubsiteEditor = ({ subsite = null, onClose, onSaved, canEditIdentity = true }) => {
    const isEdit = !!subsite;
    const { t } = useTranslation();

    const [name,          setName]          = useState(subsite?.name          ?? '');
    const [slug,          setSlug]          = useState(subsite?.slug          ?? '');
    const [sourceType,    setSourceType]    = useState(detectSourceType(subsite));
    const [categoryId,    setCategoryId]    = useState(subsite?.category_id   ?? '');
    const [workshopId,    setWorkshopId]    = useState(subsite?.workshop_id   ?? '');
    const [primaryColor,  setPrimaryColor]  = useState(subsite?.primary_color ?? '#4A90D9');
    const [planetType,    setPlanetType]    = useState(subsite?.planet_type   ?? '');
    const [blocks,        setBlocks]        = useState(subsite?.content_blocks ?? []);
    const [blocksEn,      setBlocksEn]      = useState(subsite?.content_blocks_en ?? []);
    const [blockLang,     setBlockLang]     = useState('fr');
    const [primaryPartnerIds, setPrimaryPartnerIds] = useState((subsite?.primary_partners ?? []).map(p => p.id));
    const [partnerIds,        setPartnerIds]        = useState((subsite?.partners ?? []).map(p => p.id));
    const [categories,    setCategories]    = useState([]);
    const [workshops,     setWorkshops]     = useState([]);
    const [allPartners,   setAllPartners]   = useState([]);
    const [saving,        setSaving]        = useState(false);
    const [error,         setError]         = useState('');
    const [slugManual,    setSlugManual]    = useState(isEdit);

    useEffect(() => {
        api.categories.getAll().then(d => setCategories(Array.isArray(d) ? d : []));
        api.workshops.getAll().then(d => setWorkshops(Array.isArray(d) ? d : []));
        api.partners.getAll().then(d => setAllPartners(Array.isArray(d) ? d : []));
    }, []);

    // Auto-slug depuis le nom
    useEffect(() => {
        if (!slugManual && name) setSlug(slugify(name));
    }, [name, slugManual]);

    // ── Partenaires ────────────────────────────────────────────
    const togglePrimaryPartner = (id) => {
        setPrimaryPartnerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setPartnerIds(prev => prev.filter(x => x !== id));
    };

    const togglePartner = (id) => {
        setPartnerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setPrimaryPartnerIds(prev => prev.filter(x => x !== id));
    };

    // ── Save ───────────────────────────────────────────────────
    const handleSave = async () => {
        // Pour la création on exige tous les champs d'identité + la source.
        // En édition owner (canEditIdentity = false), nom/slug/source restent
        // ceux du subsite courant et ne sont pas envoyés (le controller les
        // ignorerait de toute façon via OWNER_EDITABLE).
        if (!isEdit) {
            if (!name || !slug)                                              { setError(t('subsiteEditor.errNameSlug', 'Nom et slug sont requis.')); return; }
            if (sourceType === 'category' && !categoryId)                    { setError(t('subsiteEditor.errCategory', 'Choisissez une catégorie.')); return; }
            if (sourceType === 'workshop' && !workshopId)                    { setError(t('subsiteEditor.errWorkshop', 'Choisissez un atelier.'));  return; }
        }
        setSaving(true); setError('');
        try {
            const payload = {
                primary_color: primaryColor,
                planet_type: planetType || null,
                content_blocks: blocks,
                content_blocks_en: blocksEn,
                primary_partner_ids: primaryPartnerIds,
                partner_ids: partnerIds,
            };
            if (canEditIdentity) {
                payload.name = name;
                payload.slug = slug;
            }
            // La source n'est paramétrable qu'à la création — figée ensuite.
            if (!isEdit) {
                if (sourceType === 'workshop') payload.workshop_id = workshopId;
                else                            payload.category_id = categoryId;
            }

            if (isEdit) {
                await api.subsites.update(subsite.slug, payload);
            } else {
                await api.subsites.create(payload);
            }
            onSaved?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const color = primaryColor || '#4A90D9';

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '18px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>

                {/* Header modal */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>{isEdit ? t('subsiteEditor.editTitle', { name: subsite.name, defaultValue: `Modifier ${subsite.name}` }) : t('subsiteEditor.newTitle', 'Nouveau sous-site')}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: '#999' }}>{t('subsiteEditor.immediate', 'Les modifications sont publiées immédiatement.')}</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Identité — masqué en mode owner (champs verrouillés) */}
                    {canEditIdentity && (
                    <section>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>{t('subsiteEditor.identity', 'Identité')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>{t('subsiteEditor.nameLabel', 'Nom du sous-site *')}</label>
                                <input value={name} onChange={e => { setName(e.target.value); setSlugManual(false); }} placeholder="ex: Paléo-H₂O" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('subsiteEditor.slugLabel', 'Slug (URL) *')}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.85rem' }}>/site/</span>
                                    <input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }} placeholder="paleo-h2o" style={{ ...inputStyle, paddingLeft: '48px', fontFamily: 'monospace' }} />
                                </div>
                            </div>

                            {/* Source : éditable seulement à la création */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>{t('subsiteEditor.sourceLabel', 'Source des cartels *')}</label>
                                {isEdit ? (
                                    <div style={{ ...inputStyle, background: '#f7f7f7', color: '#666', display: 'flex', alignItems: 'center' }}>
                                        {subsite.workshop_id
                                            ? <>{t('subsiteEditor.sourceWorkshop', 'Atelier')} — <strong style={{ marginLeft: 4 }}>{subsite.workshop_name || '?'}</strong></>
                                            : <>{t('subsiteEditor.sourceCategory', 'Catégorie')} — <strong style={{ marginLeft: 4 }}>{subsite.category_name || '?'}</strong></>}
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#aaa' }}>{t('subsiteEditor.notEditable', '(non modifiable)')}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <SourceTab active={sourceType === 'category'} onClick={() => setSourceType('category')} color={color}>{t('subsiteEditor.sourceCategory', 'Catégorie')}</SourceTab>
                                            <SourceTab active={sourceType === 'workshop'} onClick={() => setSourceType('workshop')} color={color}>{t('subsiteEditor.sourceWorkshop', 'Atelier')}</SourceTab>
                                        </div>
                                        {sourceType === 'category' ? (
                                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                                                <option value="">{t('subsiteEditor.chooseCategory', '— Choisir une catégorie —')}</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            <select value={workshopId} onChange={e => setWorkshopId(e.target.value)} style={inputStyle}>
                                                <option value="">{t('subsiteEditor.chooseWorkshop', '— Choisir un atelier —')}</option>
                                                {workshops.map(w => <option key={w.id} value={w.id}>{w.name}{w.cartel_count !== undefined ? ` (${w.cartel_count} cartels)` : ''}</option>)}
                                            </select>
                                        )}
                                        <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#999', lineHeight: 1.4 }}>
                                            {sourceType === 'category'
                                                ? t('subsiteEditor.sourceCategoryHint', "Les cartels du sous-site seront ceux explicitement rattachés à ce sous-site dans l'admin.")
                                                : t('subsiteEditor.sourceWorkshopHint', "Les cartels du sous-site = cartels membres de l'atelier (vue live, mise à jour automatique à chaque ajout/retrait dans l'atelier).")}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>{t('subsiteEditor.colorPrimary', 'Couleur primaire')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                        style={{ width: '44px', height: '38px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', padding: '2px 4px' }} />
                                    <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#D65A5A"
                                        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
                                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: color, flexShrink: 0 }} />
                                </div>
                            </div>
                        </div>
                    </section>
                    )}

                    {/* Couleur (mode owner) : section dédiée si l'identité est masquée */}
                    {!canEditIdentity && (
                        <section>
                            <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>{t('subsiteEditor.color', 'Couleur')}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                                    style={{ width: '44px', height: '38px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', padding: '2px 4px' }} />
                                <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#D65A5A"
                                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: color, flexShrink: 0 }} />
                            </div>
                        </section>
                    )}

                    {/* Type de planète (apparence dans la vitrine Paléo-Pédia) */}
                    <section>
                        <h3 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>
                            {t('subsiteEditor.planetHeading', 'Planète (vitrine Paléo-Pédia)')}
                        </h3>
                        <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#999', lineHeight: 1.4 }}>
                            {t('subsiteEditor.planetHint', "Apparence de ce sous-site sur la page Paléo-Pédia. « Automatique » varie selon la position dans l'écosystème.")}
                        </p>
                        <select value={planetType} onChange={e => setPlanetType(e.target.value)} style={inputStyle}>
                            <option value="">{t('subsiteEditor.planetAuto', 'Automatique')}</option>
                            {PLANET_TYPE_OPTIONS.map(o => (
                                <option key={o.key} value={o.key}>{o.label}</option>
                            ))}
                        </select>
                    </section>

                    {/* Blocs de contenu (bilingue : FR + EN optionnel) */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>{t('subsiteEditor.contentHeading', "Contenu de la page d'accueil")}</h3>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <SourceTab active={blockLang === 'fr'} onClick={() => setBlockLang('fr')} color={color}>
                                    {t('subsiteEditor.langFr', 'Français')}{blocks.length ? ` (${blocks.length})` : ''}
                                </SourceTab>
                                <SourceTab active={blockLang === 'en'} onClick={() => setBlockLang('en')} color={color}>
                                    {t('subsiteEditor.langEn', 'English')}{blocksEn.length ? ` (${blocksEn.length})` : ''}
                                </SourceTab>
                            </div>
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#999', lineHeight: 1.4 }}>
                            {blockLang === 'fr'
                                ? t('subsiteEditor.contentFrHint', 'Blocs affichés aux visiteurs en français.')
                                : t('subsiteEditor.contentEnHint', 'Blocs affichés aux visiteurs en anglais. Si vous laissez cette version vide, les visiteurs anglophones verront automatiquement la version française.')}
                        </p>
                        {blockLang === 'fr'
                            ? <BlockEditor blocks={blocks}   onChange={setBlocks} />
                            : <BlockEditor blocks={blocksEn} onChange={setBlocksEn} />}
                    </section>

                    {/* Partenaires */}
                    {allPartners.length > 0 && (
                        <section>
                            <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>{t('subsiteEditor.partnersHeading', 'Partenaires du sous-site')}</h3>
                            <p style={{ margin: '0 0 10px', color: '#888', fontSize: '0.82rem' }}>
                                {t('subsiteEditor.partnersIntro', 'Sélectionnez les partenaires mis en avant (principaux) et les partenaires standards.')}
                            </p>

                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#666', marginBottom: '8px' }}>{t('subsiteEditor.partnersPrimary', 'Partenaires principaux')}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {allPartners.map(p => {
                                        const selected = primaryPartnerIds.includes(p.id);
                                        return (
                                            <button key={`primary-${p.id}`} onClick={() => togglePrimaryPartner(p.id)} style={{
                                                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.12s',
                                                background: selected ? color : '#f7f7f7',
                                                color: selected ? 'white' : '#555',
                                                border: selected ? `2px solid ${color}` : '2px solid #e8e8e8',
                                            }}>
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#666', marginBottom: '8px' }}>{t('subsiteEditor.partnersRegular', 'Partenaires')}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {allPartners.map(p => {
                                    const selected = partnerIds.includes(p.id);
                                    return (
                                        <button key={p.id} onClick={() => togglePartner(p.id)} style={{
                                            padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.12s',
                                            background: selected ? color : '#f0f0f0',
                                            color: selected ? 'white' : '#555',
                                            border: selected ? `2px solid ${color}` : '2px solid transparent',
                                        }}>
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </div>
                            </div>
                        </section>
                    )}

                    {/* Error + actions */}
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.87rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer', fontFamily: 'inherit' }}>{t('subsiteEditor.cancel', 'Annuler')}</button>
                        <button onClick={handleSave} disabled={saving} style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: saving ? '#ccc' : color, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
                            {saving ? t('subsiteEditor.saving') : isEdit ? t('subsiteEditor.edit') : t('subsiteEditor.create')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SourceTab = ({ active, onClick, children, color }) => (
    <button onClick={onClick} type="button" style={{
        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '700',
        background: active ? color : '#f5f5f5',
        color: active ? 'white' : '#666',
        border: active ? `2px solid ${color}` : '2px solid transparent',
        transition: 'all 0.12s',
    }}>{children}</button>
);

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#555', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };

export default SubsiteEditor;
