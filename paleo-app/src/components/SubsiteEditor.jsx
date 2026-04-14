/**
 * SubsiteEditor.jsx
 * Panneau de création / édition d'un sous-site (modale).
 * Permet : nom, slug, catégorie, couleur primaire, blocs de contenu, partenaires.
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical, Type, AlignLeft, Image as ImgIcon, Upload } from 'lucide-react';
import api from '../services/apiClient';

const slugify = (str) =>
    str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const BLOCK_TYPES = [
    { type: 'title',  label: 'Titre',  icon: Type       },
    { type: 'text',   label: 'Texte',  icon: AlignLeft  },
    { type: 'image',  label: 'Image',  icon: ImgIcon    },
];

const SubsiteEditor = ({ subsite = null, onClose, onSaved }) => {
    const isEdit = !!subsite;

    const [name,          setName]          = useState(subsite?.name          ?? '');
    const [slug,          setSlug]          = useState(subsite?.slug          ?? '');
    const [categoryId,    setCategoryId]    = useState(subsite?.category_id   ?? '');
    const [primaryColor,  setPrimaryColor]  = useState(subsite?.primary_color ?? '#4A90D9');
    const [blocks,        setBlocks]        = useState(subsite?.content_blocks ?? []);
    const [partnerIds,    setPartnerIds]    = useState((subsite?.partners ?? []).map(p => p.id));
    const [categories,    setCategories]    = useState([]);
    const [allPartners,   setAllPartners]   = useState([]);
    const [saving,        setSaving]        = useState(false);
    const [error,         setError]         = useState('');
    const [slugManual,    setSlugManual]    = useState(isEdit);

    useEffect(() => {
        api.categories.getAll().then(d => setCategories(Array.isArray(d) ? d : []));
        api.partners.getAll().then(d => setAllPartners(Array.isArray(d) ? d : []));
    }, []);

    // Auto-slug depuis le nom
    useEffect(() => {
        if (!slugManual && name) setSlug(slugify(name));
    }, [name, slugManual]);

    // ── Blocs ──────────────────────────────────────────────────
    const addBlock = (type) => setBlocks(prev => [...prev, { type, content: '', level: 2 }]);
    const removeBlock = (i) => setBlocks(prev => prev.filter((_, idx) => idx !== i));
    const updateBlock = (i, upd) => setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, ...upd } : b));
    const moveBlock = (from, to) => {
        const next = [...blocks];
        const [el] = next.splice(from, 1);
        next.splice(to, 0, el);
        setBlocks(next);
    };

    // ── Partenaires ────────────────────────────────────────────
    const togglePartner = (id) =>
        setPartnerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    // ── Save ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (!name || !slug || !categoryId) { setError('Nom, slug et catégorie sont requis.'); return; }
        setSaving(true); setError('');
        try {
            const payload = { name, slug, category_id: categoryId, primary_color: primaryColor, content_blocks: blocks, partner_ids: partnerIds };
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
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>{isEdit ? `Modifier ${subsite.name}` : 'Nouveau sous-site'}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: '#999' }}>Les modifications sont publiées immédiatement.</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Identité */}
                    <section>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>Identité</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Nom du sous-site *</label>
                                <input value={name} onChange={e => { setName(e.target.value); setSlugManual(false); }} placeholder="ex: Paléo-H₂O" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Slug (URL) *</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '0.85rem' }}>/site/</span>
                                    <input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }} placeholder="paleo-h2o" style={{ ...inputStyle, paddingLeft: '48px', fontFamily: 'monospace' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Catégorie liée *</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                                    <option value="">— Choisir une catégorie —</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Couleur primaire</label>
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

                    {/* Blocs de contenu */}
                    <section>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>Contenu de la page d'accueil</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                            {blocks.map((block, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: '#fafafa', borderRadius: '10px', padding: '10px 12px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                                        <button onClick={() => i > 0 && moveBlock(i, i-1)} style={iconBtn} disabled={i === 0}>▲</button>
                                        <button onClick={() => i < blocks.length-1 && moveBlock(i, i+1)} style={iconBtn} disabled={i === blocks.length-1}>▼</button>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {block.type === 'title' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <select value={block.level ?? 2} onChange={e => updateBlock(i, { level: parseInt(e.target.value) })} style={{ ...inputStyle, width: '80px' }}>
                                                    <option value={1}>H1</option>
                                                    <option value={2}>H2</option>
                                                    <option value={3}>H3</option>
                                                </select>
                                                <input value={block.content} onChange={e => updateBlock(i, { content: e.target.value })} placeholder="Titre…" style={{ ...inputStyle, flex: 1, fontWeight: '700' }} />
                                            </div>
                                        )}
                                        {block.type === 'text' && (
                                            <textarea value={block.content} onChange={e => updateBlock(i, { content: e.target.value })} placeholder="Texte…" rows={3} style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                                        )}
                                        {block.type === 'image' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <input value={block.url ?? ''} onChange={e => updateBlock(i, { url: e.target.value })} placeholder="URL de l'image (ou /api/images/…)" style={inputStyle} />
                                                <input value={block.caption ?? ''} onChange={e => updateBlock(i, { caption: e.target.value })} placeholder="Légende (optionnel)" style={{ ...inputStyle, fontSize: '0.85rem', color: '#666' }} />
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => removeBlock(i)} style={{ ...iconBtn, color: '#d32f2f' }}><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                                <button key={type} onClick={() => addBlock(type)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px dashed #ddd', background: 'white', cursor: 'pointer', fontSize: '0.83rem', color: '#555', fontFamily: 'inherit' }}>
                                    <Icon size={14} /> {label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Partenaires */}
                    {allPartners.length > 0 && (
                        <section>
                            <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: '#aaa', letterSpacing: '0.5px' }}>Partenaires associés</h3>
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
                        </section>
                    )}

                    {/* Error + actions */}
                    {error && <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.87rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                        <button onClick={handleSave} disabled={saving} style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: saving ? '#ccc' : color, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
                            {saving ? 'Sauvegarde…' : isEdit ? 'Enregistrer' : 'Créer le sous-site'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#555', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' };

export default SubsiteEditor;
