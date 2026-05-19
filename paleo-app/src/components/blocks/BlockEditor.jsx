/**
 * BlockEditor.jsx — éditeur de blocs partagé (sous-sites + page détail cartel).
 *
 * Reçoit `blocks` (array) et `onChange(newBlocks)`. Gère les types
 * title / text / image / video / gallery / quote / button / separator / embed.
 */
import React, { useRef, useState } from 'react';
import {
    Trash2, Type, AlignLeft, Image as ImgIcon, Video, GalleryHorizontal,
    Quote, Link2, Minus, Code, Upload,
} from 'lucide-react';
import api from '../../services/apiClient';

const BLOCK_TYPES = [
    { type: 'title',     label: 'Titre',     icon: Type            },
    { type: 'text',      label: 'Texte',     icon: AlignLeft       },
    { type: 'image',     label: 'Image',     icon: ImgIcon         },
    { type: 'video',     label: 'Vidéo',     icon: Video           },
    { type: 'gallery',   label: 'Galerie',   icon: GalleryHorizontal },
    { type: 'quote',     label: 'Citation',  icon: Quote           },
    { type: 'button',    label: 'Bouton',    icon: Link2           },
    { type: 'separator', label: 'Séparateur', icon: Minus          },
    { type: 'embed',     label: 'Embed',     icon: Code            },
];

const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};
const iconBtn = {
    background: 'none', border: 'none', cursor: 'pointer', padding: '3px',
    color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px',
};

const newBlockOfType = (type) => {
    switch (type) {
        case 'title':     return { type, content: '', level: 2 };
        case 'text':      return { type, content: '' };
        case 'image':     return { type, url: '', caption: '' };
        case 'video':     return { type, url: '', caption: '' };
        case 'gallery':   return { type, items: [] };
        case 'quote':     return { type, content: '', attribution: '' };
        case 'button':    return { type, label: '', url: '', style: 'primary' };
        case 'separator': return { type };
        case 'embed':     return { type, url: '', caption: '', height: 500 };
        default:          return { type };
    }
};

/** Bouton d'upload d'image qui pose l'URL retournée dans `onUploaded(url)`. */
const ImageUpload = ({ onUploaded, label = 'Upload' }) => {
    const ref = useRef(null);
    const [busy, setBusy] = useState(false);
    return (
        <>
            <input type="file" accept="image/*" ref={ref} style={{ display: 'none' }}
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                        const { url } = await api.media.upload(file);
                        onUploaded(url);
                    } catch (err) {
                        alert(`Erreur upload : ${err.message}`);
                    } finally {
                        setBusy(false);
                        e.target.value = '';
                    }
                }} />
            <button type="button" onClick={() => ref.current?.click()} disabled={busy}
                style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px',
                    borderRadius: '8px', border: '1px solid #ddd', background: busy ? '#f5f5f5' : 'white',
                    cursor: busy ? 'wait' : 'pointer', fontSize: '0.82rem', color: '#555', fontFamily: 'inherit',
                }}>
                <Upload size={13} /> {busy ? '…' : label}
            </button>
        </>
    );
};

const BlockFieldsEditor = ({ block, onChange }) => {
    const upd = (patch) => onChange({ ...block, ...patch });

    switch (block.type) {
        case 'title':
            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={block.level ?? 2} onChange={e => upd({ level: parseInt(e.target.value) })}
                        style={{ ...inputStyle, width: '80px' }}>
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                    </select>
                    <input value={block.content ?? ''} onChange={e => upd({ content: e.target.value })}
                        placeholder="Titre…" style={{ ...inputStyle, flex: 1, fontWeight: 700 }} />
                </div>
            );
        case 'text':
            return (
                <textarea value={block.content ?? ''} onChange={e => upd({ content: e.target.value })}
                    placeholder="Texte…" rows={3}
                    style={{ ...inputStyle, resize: 'vertical', width: '100%' }} />
            );
        case 'image':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={block.url ?? ''} onChange={e => upd({ url: e.target.value })}
                            placeholder="URL de l'image (ou /api/images/…)" style={{ ...inputStyle, flex: 1 }} />
                        <ImageUpload onUploaded={(url) => upd({ url })} />
                    </div>
                    <input value={block.caption ?? ''} onChange={e => upd({ caption: e.target.value })}
                        placeholder="Légende (optionnel)" style={{ ...inputStyle, fontSize: '0.85rem', color: '#666' }} />
                </div>
            );
        case 'video':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input value={block.url ?? ''} onChange={e => upd({ url: e.target.value })}
                        placeholder="URL YouTube / Vimeo / vidéo .mp4" style={inputStyle} />
                    <input value={block.caption ?? ''} onChange={e => upd({ caption: e.target.value })}
                        placeholder="Légende (optionnel)" style={{ ...inputStyle, fontSize: '0.85rem', color: '#666' }} />
                </div>
            );
        case 'gallery': {
            const items = Array.isArray(block.items) ? block.items : [];
            const updItem = (idx, patch) => upd({
                items: items.map((it, i) => i === idx ? { ...it, ...patch } : it),
            });
            const addItem = (url = '') => upd({ items: [...items, { url, caption: '' }] });
            const removeItem = (idx) => upd({ items: items.filter((_, i) => i !== idx) });
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input value={it.url ?? ''} onChange={e => updItem(idx, { url: e.target.value })}
                                placeholder="URL image" style={{ ...inputStyle, flex: 2 }} />
                            <input value={it.caption ?? ''} onChange={e => updItem(idx, { caption: e.target.value })}
                                placeholder="Légende" style={{ ...inputStyle, flex: 1, fontSize: '0.82rem' }} />
                            <button onClick={() => removeItem(idx)} style={{ ...iconBtn, color: '#d32f2f' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => addItem()} style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px dashed #ddd',
                            background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#555', fontFamily: 'inherit',
                        }}>+ URL</button>
                        <ImageUpload onUploaded={(url) => addItem(url)} label="Upload image" />
                    </div>
                </div>
            );
        }
        case 'quote':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <textarea value={block.content ?? ''} onChange={e => upd({ content: e.target.value })}
                        placeholder="Citation…" rows={2}
                        style={{ ...inputStyle, resize: 'vertical', fontStyle: 'italic' }} />
                    <input value={block.attribution ?? ''} onChange={e => upd({ attribution: e.target.value })}
                        placeholder="Attribution (optionnel)" style={{ ...inputStyle, fontSize: '0.85rem' }} />
                </div>
            );
        case 'button':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={block.label ?? ''} onChange={e => upd({ label: e.target.value })}
                            placeholder="Libellé du bouton" style={{ ...inputStyle, flex: 1, fontWeight: 600 }} />
                        <select value={block.style ?? 'primary'} onChange={e => upd({ style: e.target.value })}
                            style={{ ...inputStyle, width: '130px' }}>
                            <option value="primary">Plein</option>
                            <option value="secondary">Contour</option>
                        </select>
                    </div>
                    <input value={block.url ?? ''} onChange={e => upd({ url: e.target.value })}
                        placeholder="URL de destination" style={inputStyle} />
                </div>
            );
        case 'separator':
            return <div style={{ color: '#aaa', fontSize: '0.85rem', fontStyle: 'italic' }}>— Séparateur horizontal —</div>;
        case 'embed':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input value={block.url ?? ''} onChange={e => upd({ url: e.target.value })}
                        placeholder="URL d'iframe (PDF, Sketchfab, Google Maps, etc.)" style={inputStyle} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={block.caption ?? ''} onChange={e => upd({ caption: e.target.value })}
                            placeholder="Légende (optionnel)" style={{ ...inputStyle, flex: 1, fontSize: '0.85rem' }} />
                        <input type="number" min={150} max={1200} value={block.height ?? 500}
                            onChange={e => upd({ height: parseInt(e.target.value) || 500 })}
                            placeholder="Hauteur px" style={{ ...inputStyle, width: '110px' }} />
                    </div>
                </div>
            );
        default:
            return null;
    }
};

export const BlockEditor = ({ blocks = [], onChange }) => {
    const update = (i, next) => onChange(blocks.map((b, idx) => idx === i ? next : b));
    const remove = (i) => onChange(blocks.filter((_, idx) => idx !== i));
    const move = (from, to) => {
        if (to < 0 || to >= blocks.length) return;
        const next = [...blocks];
        const [el] = next.splice(from, 1);
        next.splice(to, 0, el);
        onChange(next);
    };
    const add = (type) => onChange([...blocks, newBlockOfType(type)]);

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {blocks.map((block, i) => (
                    <div key={i} style={{
                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                        background: '#fafafa', borderRadius: '10px', padding: '10px 12px', border: '1px solid #eee',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px' }}>
                            <button onClick={() => move(i, i - 1)} style={iconBtn} disabled={i === 0}>▲</button>
                            <button onClick={() => move(i, i + 1)} style={iconBtn} disabled={i === blocks.length - 1}>▼</button>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <BlockFieldsEditor block={block} onChange={(next) => update(i, next)} />
                        </div>
                        <button onClick={() => remove(i)} style={{ ...iconBtn, color: '#d32f2f' }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                    <button key={type} type="button" onClick={() => add(type)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
                            borderRadius: '8px', border: '1px dashed #ddd', background: 'white',
                            cursor: 'pointer', fontSize: '0.83rem', color: '#555', fontFamily: 'inherit',
                        }}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BlockEditor;
