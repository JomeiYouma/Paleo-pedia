import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Edit, Trash2, Eye, EyeOff, Check, X, Clock,
    Download, Square, CheckSquare, Search,
    ArrowUpDown, ArrowUp, ArrowDown,
    FileText, Inbox, Globe, Plus, ScanEye, MapPin, Image as ImageIcon,
    Languages, Upload, ChevronDown, Package, FileJson, ImageIcon as ImgIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateZip, generatePdf, generateArchive } from '../utils/zipGenerator';
import CartelPreview from '../components/CartelPreview';
import { getYearForSort } from '../utils/helpers';
import api from '../services/apiClient';

const HEX_COLORS = {
    neutral: '#4b5563',
};

function hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(75, 85, 99, ${alpha})`;
    const raw = hex.slice(1);
    const normalized = raw.length === 3
        ? raw.split('').map(c => c + c).join('')
        : raw;
    if (normalized.length !== 6) return `rgba(75, 85, 99, ${alpha})`;

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Onglets ──────────────────────────────────────────────────
const TABS = [
    { key: 'drafts',    label: 'Brouillons',   icon: FileText, color: '#3b5bdb', bg: '#f0f4ff', description: 'Cartels en cours de rédaction (non visibles)',      filter: c => c.status === 'draft' },
    { key: 'pending',   label: 'Propositions', icon: Inbox,    color: '#e67e00', bg: '#fff4e0', description: 'Soumissions de visiteurs à modérer',                 filter: c => c.status === 'pending_review' },
    { key: 'published', label: 'Publiés',      icon: Globe,    color: '#2e7d32', bg: '#e8f5e9', description: 'Cartels visibles sur la frise',                      filter: c => c.status === 'published' || c.status === 'archived' },
];

const STATUS_BADGE = {
    draft:          { label: 'Brouillon',   bg: '#f0f4ff', color: '#3b5bdb' },
    pending_review: { label: 'Proposition', bg: '#fff4e0', color: '#e67e00' },
    published:      { label: 'Publié',      bg: '#e8f5e9', color: '#2e7d32' },
    archived:       { label: 'Archivé',     bg: '#f5f5f5', color: '#888'   },
};

// ── Overlay de progression ────────────────────────────────────
const ProgressOverlay = ({ label, current, total }) => (
    <div style={{ position:'fixed', inset:0, background:'rgba(255,255,255,0.92)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'50px', height:'50px', border:'5px solid #eee', borderTop:'5px solid #D65A5A', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <h3 style={{ marginTop:'20px' }}>{label}</h3>
        {total > 0 && (
            <>
                <div style={{ fontSize:'1.4rem', fontWeight:'700', margin:'8px 0' }}>{current}/{total}</div>
                <div style={{ width:'280px', height:'8px', background:'#eee', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ width:`${(current/total)*100}%`, height:'100%', background:'#D65A5A', transition:'width 0.3s' }} />
                </div>
            </>
        )}
    </div>
);

// ── Dropdown bouton ───────────────────────────────────────────
const DropdownButton = ({ label, icon: Icon, color = '#555', children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    React.useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position:'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 12px', borderRadius:'8px', border:'none', background:color, color:'white', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', fontFamily:'inherit' }}>
                {Icon && <Icon size={14} />} {label} <ChevronDown size={13} style={{ opacity:0.7 }} />
            </button>
            {open && (
                <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:'white', border:'1px solid #eee', borderRadius:'10px', boxShadow:'0 6px 24px rgba(0,0,0,0.12)', zIndex:50, minWidth:'190px', overflow:'hidden' }}>
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
};

const DropItem = ({ icon: Icon, label, onClick, danger }) => (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'11px 14px', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:'0.88rem', color: danger ? '#d32f2f' : '#333', fontFamily:'inherit' }}
        onMouseEnter={e => e.currentTarget.style.background = danger ? '#fff5f5' : '#f8f8f8'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
        {Icon && <Icon size={15} color={danger ? '#d32f2f' : '#666'} />} {label}
    </button>
);

// ── Modal Import ZIP ─────────────────────────────────────────
const ImportModal = ({ onClose, onDone }) => {
    const [file,    setFile]    = useState(null);
    const [busy,    setBusy]    = useState(false);
    const [result,  setResult]  = useState(null);
    const [error,   setError]   = useState('');

    const handleImport = async () => {
        if (!file) return;
        setBusy(true);
        setError('');
        try {
            const res = await api.io.importZip(file);
            setResult(res);
            onDone?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div onClick={() => !busy && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'28px', maxWidth:'480px', width:'100%', position:'relative' }}>
                <button onClick={onClose} style={{ position:'absolute', top:'16px', right:'16px', background:'#f5f5f5', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} /></button>

                <h3 style={{ margin:'0 0 8px', fontSize:'1.1rem', fontWeight:'800' }}>Importer une archive ZIP</h3>
                <p style={{ color:'#888', fontSize:'0.85rem', margin:'0 0 20px', lineHeight:'1.4' }}>
                    L'archive doit contenir un fichier <code>cartels.json</code> à la racine.<br/>
                    Les images peuvent être placées à la racine ou dans un dossier <code>images/</code>.<br/>
                    Les cartels importés seront créés en <strong>brouillon</strong>.
                </p>

                {!result ? (
                    <>
                        <label style={{ display:'block', border:'2px dashed #ddd', borderRadius:'10px', padding:'24px', textAlign:'center', cursor:'pointer', background:file ? '#f0fff4' : '#fafafa' }}>
                            <input type="file" accept=".zip" style={{ display:'none' }} onChange={e => setFile(e.target.files[0] ?? null)} />
                            <Upload size={28} color={file ? '#2e7d32' : '#aaa'} style={{ marginBottom:'8px' }} />
                            <div style={{ fontSize:'0.9rem', fontWeight:'600', color: file ? '#2e7d32' : '#555' }}>
                                {file ? file.name : 'Choisir une archive .zip'}
                            </div>
                            {file && <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'4px' }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</div>}
                        </label>
                        {error && <p style={{ color:'#d32f2f', fontSize:'0.85rem', marginTop:'12px' }}>{error}</p>}
                        <div style={{ display:'flex', gap:'10px', marginTop:'20px', justifyContent:'flex-end' }}>
                            <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
                            <button onClick={handleImport} disabled={!file || busy} style={{ padding:'10px 18px', borderRadius:'8px', border:'none', background: file ? '#1a1a1a' : '#ccc', color:'white', cursor: file ? 'pointer' : 'not-allowed', fontWeight:'700', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
                                {busy ? 'Import en cours…' : <><Upload size={14} /> Importer</>}
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <div style={{ background:'#e8f5e9', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
                            <div style={{ fontWeight:'800', color:'#2e7d32', fontSize:'1.1rem', marginBottom:'4px' }}>Import terminé</div>
                            <div style={{ fontSize:'0.9rem', color:'#555' }}>{result.created} cartel(s) créé(s) en brouillon.</div>
                        </div>
                        {result.errors?.length > 0 && (
                            <div style={{ background:'#fff3e0', borderRadius:'10px', padding:'12px', marginBottom:'16px', fontSize:'0.82rem' }}>
                                <strong>{result.errors.length} erreur(s) :</strong>
                                {result.errors.map((e, i) => <div key={i} style={{ color:'#e67e00', marginTop:'4px' }}>• {e.titre || `Ligne ${e.index+1}`} : {e.error}</div>)}
                            </div>
                        )}
                        <button onClick={onClose} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#1a1a1a', color:'white', cursor:'pointer', fontWeight:'700', fontFamily:'inherit' }}>Fermer</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Composant principal ──────────────────────────────────────
const ManageCartels = () => {
    const { cartels, fetchData, deleteCartel, deleteCartels, updateCartel, isAdmin, categories } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const pathToTab = {
        '/app/manage/drafts': 'drafts',
        '/app/manage/pending': 'pending',
        '/app/manage/published': 'published',
    };
    const tabToPath = {
        drafts: '/app/manage/drafts',
        pending: '/app/manage/pending',
        published: '/app/manage/published',
    };

    const activeTab = pathToTab[location.pathname] || 'drafts';
    const setActiveTab = (key) => navigate(tabToPath[key] || '/app/manage/drafts');
    const goToCreate = (editId) => {
        const target = editId ? `/app/create?edit=${editId}` : '/app/create';
        navigate(target, { state: { returnTo: location.pathname } });
    };

    const [search,         setSearch]         = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortConfig,     setSortConfig]      = useState({ key: 'date', direction: 'desc' });
    const [selectedIds,    setSelectedIds]     = useState(new Set());
    const [processingId,   setProcessingId]    = useState(null);
    const [previewCartel,  setPreviewCartel]   = useState(null);
    const [busy,           setBusy]            = useState(false);
    const [busyLabel,      setBusyLabel]       = useState('Traitement…');
    const [progress,       setProgress]        = useState({ current: 0, total: 0 });
    const [showImport,     setShowImport]      = useState(false);
    const [translating,    setTranslating]     = useState(new Set()); // ids en cours de traduction

    const currentTabDef = TABS.find(t => t.key === activeTab) || TABS[0];

    const counts = useMemo(() => {
        const obj = {};
        TABS.forEach(tab => { obj[tab.key] = cartels.filter(tab.filter).length; });
        return obj;
    }, [cartels]);

    const filteredCartels = useMemo(() => {
        let data = cartels.filter(currentTabDef.filter);
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(c =>
                (c.titre || '').toLowerCase().includes(q) ||
                (c.titre_en || '').toLowerCase().includes(q) ||
                (c.location || '').toLowerCase().includes(q)
            );
        }
        if (filterCategory) {
            data = data.filter(c =>
                (c.categories || []).includes(filterCategory) ||
                (c.categories_en || []).includes(filterCategory)
            );
        }
        data.sort((a, b) => {
            let av, bv;
            if (sortConfig.key === 'date')  { av = getYearForSort(a);               bv = getYearForSort(b); }
            else if (sortConfig.key === 'titre') { av = (a.titre || '').toLowerCase(); bv = (b.titre || '').toLowerCase(); }
            else if (sortConfig.key === 'loc')   { av = (a.location || '').toLowerCase(); bv = (b.location || '').toLowerCase(); }
            else { av = a[sortConfig.key]; bv = b[sortConfig.key]; }
            if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
            if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
            return 0;
        });
        return data;
    }, [cartels, currentTabDef, search, filterCategory, sortConfig]);

    if (!isAdmin) {
        return <div style={{ textAlign:'center', padding:'80px 20px', color:'#aaa' }}><p>Accès réservé à l'administration.</p></div>;
    }

    // ── Actions unitaires ─────────────────────────────────────
    const act = async (id, fn) => {
        setProcessingId(id);
        try { await fn(); await fetchData(); }
        catch (e) { alert('Erreur : ' + e.message); }
        finally { setProcessingId(null); }
    };

    const handlePublish   = (c) => { if (!confirm(`Publier "${c.titre}" ?`)) return; act(c.id, () => api.cartels.publish(c.id)); };
    const handleToDraft   = (c) => { if (!confirm(`Repasser "${c.titre}" en brouillon ?`)) return; act(c.id, () => api.cartels.setStatus(c.id, 'draft')); };
    const handleArchive   = (c) => { if (!confirm(`Archiver "${c.titre}" ?`)) return; act(c.id, () => api.cartels.archive(c.id)); };
    const handleDelete    = (id) => { if (!confirm(t('messages.confirmDelete', 'Supprimer ?'))) return; act(id, () => api.cartels.delete(id)); };
    const handleVisibility = (c) => { updateCartel({ ...c, visible: !c.visible }); };

    // ── Traduction unitaire ───────────────────────────────────
    const handleTranslate = async (cartel) => {
        if (!confirm(`Retraduire "${cartel.titre}" en anglais via IA ? Les champs anglais existants seront écrasés.`)) return;
        setTranslating(prev => new Set([...prev, cartel.id]));
        try {
            const translated = await api.translate.cartel({
                titre: cartel.titre, description: cartel.description, location: cartel.location,
            });
            await api.cartels.update(cartel.id, translated);
            await fetchData();
        } catch (e) {
            alert('Erreur traduction : ' + e.message);
        } finally {
            setTranslating(prev => { const s = new Set(prev); s.delete(cartel.id); return s; });
        }
    };

    // ── Actions batch ─────────────────────────────────────────
    const withBusy = async (label, fn) => {
        setBusy(true); setBusyLabel(label); setProgress({ current:0, total:0 });
        try { await fn(); }
        finally { setBusy(false); }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size || !confirm(`Supprimer ces ${selectedIds.size} cartels ?`)) return;
        await withBusy('Suppression…', async () => {
            for (const id of selectedIds) await api.cartels.delete(id);
            await fetchData();
            setSelectedIds(new Set());
        });
    };

    const handleBulkPublish = async () => {
        if (!selectedIds.size) return;
        await withBusy('Publication…', async () => {
            for (const id of selectedIds) {
                const c = cartels.find(x => x.id === id);
                if (c && c.status !== 'published') await api.cartels.publish(id);
            }
            await fetchData();
            setSelectedIds(new Set());
        });
    };

    const handleBulkTranslate = async () => {
        if (!selectedIds.size || !confirm(`Retraduire ${selectedIds.size} cartel(s) via IA ?`)) return;
        await withBusy('Traduction IA…', async () => {
            let count = 0;
            for (const id of selectedIds) {
                count++;
                setProgress({ current: count, total: selectedIds.size });
                const cartel = cartels.find(c => c.id === id);
                if (!cartel) continue;
                try {
                    const translated = await api.translate.cartel({
                        titre: cartel.titre, description: cartel.description, location: cartel.location,
                    });
                    await api.cartels.update(id, translated);
                } catch (e) {
                    console.error(`Traduction ${id} échouée`, e);
                }
            }
            await fetchData();
            setSelectedIds(new Set());
        });
    };

    const handleExportImages = async (close) => {
        close?.();
        if (!selectedIds.size) return;
        await withBusy('Génération images…', async () => {
            const items = cartels.filter(c => selectedIds.has(c.id));
            await generateZip(items, i18n.language || 'fr', (cur, tot) => setProgress({ current:cur, total:tot }));
        });
    };

    const handleExportPdf = async (close) => {
        close?.();
        if (!selectedIds.size) return;
        await withBusy('Génération PDF…', async () => {
            const items = cartels.filter(c => selectedIds.has(c.id));
            await generatePdf(items, i18n.language || 'fr', (cur, tot) => setProgress({ current:cur, total:tot }));
        });
    };

    const handleExportArchive = async (close) => {
        close?.();
        if (!selectedIds.size) {
            // Export serveur de tous
            await withBusy('Préparation archive…', () => api.io.exportArchive([]));
        } else {
            await withBusy('Génération archive…', async () => {
                const items = cartels.filter(c => selectedIds.has(c.id));
                await generateArchive(items, (cur, tot) => setProgress({ current:cur, total:tot }));
            });
        }
    };

    // ── Sélection ─────────────────────────────────────────────
    const toggleSelect = (id) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
    const selectAll    = () => setSelectedIds(selectedIds.size === filteredCartels.length ? new Set() : new Set(filteredCartels.map(c => c.id)));

    // ── Tri ───────────────────────────────────────────────────
    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const SortIcon = ({ k }) => {
        if (sortConfig.key !== k) return <ArrowUpDown size={13} color="#ccc" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={13} color="#333" /> : <ArrowDown size={13} color="#333" />;
    };

    return (
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 24px 80px' }}>

            {/* Overlay */}
            {busy && <ProgressOverlay label={busyLabel} current={progress.current} total={progress.total} />}

            {/* Modal import */}
            {showImport && (
                <ImportModal
                    onClose={() => setShowImport(false)}
                    onDone={() => { fetchData(); setShowImport(false); }}
                />
            )}

            {/* ── En-tête ────────────────────────────────────── */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 0 20px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                    <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1a1a1a' }}>{t('admin.title')}</h1>
                    <p style={{ margin:'4px 0 0', color:'#999', fontSize:'0.88rem' }}>{cartels.length} cartel{cartels.length !== 1 ? 's' : ''} au total</p>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button
                        onClick={() => setShowImport(true)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', background:'#6b7280', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', cursor:'pointer', fontWeight:'700', fontSize:'0.88rem', fontFamily:'inherit' }}
                    >
                        <Upload size={15} /> Importer
                    </button>
                    <button
                        onClick={() => goToCreate()}
                        style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--color-red-accent, #D65A5A)', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', cursor:'pointer', fontWeight:'700', fontSize:'0.88rem', fontFamily:'inherit' }}
                    >
                        <Plus size={15} /> Nouveau cartel
                    </button>
                </div>
            </div>

            {/* ── Onglets ────────────────────────────────────── */}
            <div style={{ display:'flex', gap:'4px', background:'#f5f5f5', borderRadius:'14px', padding:'4px', marginBottom:'24px' }}>
                {TABS.map(tab => {
                    const Icon   = tab.icon;
                    const active = tab.key === activeTab;
                    return (
                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px 16px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:'700', fontSize:'0.88rem', fontFamily:'inherit', background: active ? 'white' : 'transparent', color: active ? tab.color : '#888', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition:'all 0.15s' }}>
                            <Icon size={15} />
                            {tab.label}
                            <span style={{ background: active ? tab.bg : '#e8e8e8', color: active ? tab.color : '#999', borderRadius:'20px', padding:'1px 8px', fontSize:'0.78rem', fontWeight:'800', minWidth:'22px', textAlign:'center' }}>
                                {counts[tab.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Description onglet */}
            <p style={{ background:currentTabDef.bg, color:currentTabDef.color, borderRadius:'8px', padding:'10px 16px', fontSize:'0.85rem', fontWeight:'600', margin:'0 0 20px' }}>
                {currentTabDef.description}
            </p>

            {/* ── Barre filtres + actions ───────────────────── */}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', background:'#fafafa', border:'1px solid #eee', borderRadius:'12px', padding:'12px 16px', marginBottom:'16px' }}>

                {/* Recherche */}
                <div style={{ position:'relative', flex:'1', minWidth:'180px' }}>
                    <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#aaa' }} />
                    <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width:'100%', padding:'8px 36px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.88rem', boxSizing:'border-box' }} />
                    {filteredCartels.length > 0 && (
                        <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'#eee', color:'#666', borderRadius:'10px', padding:'1px 7px', fontSize:'0.75rem', fontWeight:'700' }}>
                            {filteredCartels.length}
                        </span>
                    )}
                </div>

                {/* Filtre catégorie */}
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.88rem', background:'white' }}>
                    <option value="">Toutes catégories</option>
                    {categories.map(c => <option key={c.id || c} value={c.name || c}>{c.name || c}</option>)}
                </select>

                {/* Tout sélectionner */}
                <button onClick={selectAll} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', background:'white', cursor:'pointer', fontSize:'0.85rem', color:'#555', fontFamily:'inherit' }}>
                    {selectedIds.size > 0 && selectedIds.size === filteredCartels.length
                        ? <CheckSquare size={15} color="#3b5bdb" />
                        : <Square size={15} color="#aaa" />}
                    {selectedIds.size > 0 ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
                </button>

                {/* Actions batch */}
                {selectedIds.size > 0 && (
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {activeTab !== 'published' && (
                            <button onClick={handleBulkPublish} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'none', background:'#2e7d32', color:'white', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', fontFamily:'inherit' }}>
                                <Check size={14} /> Publier ({selectedIds.size})
                            </button>
                        )}
                        {/* Retraduire batch */}
                        <button onClick={handleBulkTranslate} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'none', background:'#6741d9', color:'white', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', fontFamily:'inherit' }}>
                            <Languages size={14} /> Retraduire ({selectedIds.size})
                        </button>
                        {/* Export dropdown */}
                        <DropdownButton label="Exporter" icon={Download} color="#444">
                            {close => (<>
                                <DropItem icon={ImgIcon}   label="Images (ZIP)" onClick={() => handleExportImages(close)} />
                                <DropItem icon={FileText}  label="PDF impression" onClick={() => handleExportPdf(close)} />
                                <DropItem icon={Package}   label="Archive complète (JSON + Images)" onClick={() => handleExportArchive(close)} />
                            </>)}
                        </DropdownButton>
                        <button onClick={handleBulkDelete} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'none', background:'#d32f2f', color:'white', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', fontFamily:'inherit' }}>
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                )}

                {/* Export sans sélection → tout exporter */}
                {selectedIds.size === 0 && (
                    <DropdownButton label="Exporter tout" icon={Download} color="#666">
                        {close => (<>
                            <DropItem icon={Package}  label="Archive complète (JSON + Images)" onClick={() => { close(); withBusy('Préparation archive…', () => api.io.exportArchive([])); }} />
                        </>)}
                    </DropdownButton>
                )}
            </div>

            {/* ── Tableau ────────────────────────────────────── */}
            <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                {filteredCartels.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb' }}>
                        <p style={{ fontSize:'1.1rem' }}>Aucun cartel dans cet onglet.</p>
                    </div>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
                        <thead style={{ background:'#f8f8f8', borderBottom:'2px solid #eee' }}>
                            <tr>
                                <th style={{ padding:'12px', width:'36px' }} />
                                <th style={{ padding:'12px', width:'50px', textAlign:'left' }}>Img</th>
                                <th onClick={() => handleSort('date')}  style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>Année <SortIcon k="date" /></div></th>
                                <th onClick={() => handleSort('titre')} style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none' }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>Titre <SortIcon k="titre" /></div></th>
                                <th style={{ padding:'12px', textAlign:'left' }}>Catégories</th>
                                <th onClick={() => handleSort('loc')}   style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none' }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>Lieu <SortIcon k="loc" /></div></th>
                                {activeTab === 'pending' && <th style={{ padding:'12px', textAlign:'left' }}>IP</th>}
                                <th style={{ padding:'12px', textAlign:'center' }}>Statut</th>
                                <th style={{ padding:'12px', textAlign:'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCartels.map(cartel => {
                                const badge   = STATUS_BADGE[cartel.status] || {};
                                const isVis   = cartel.visible !== false;
                                const isProc  = processingId === cartel.id;
                                const isTrans = translating.has(cartel.id);

                                return (
                                    <tr key={cartel.id} style={{ borderBottom:'1px solid #f0f0f0', background: isProc ? '#fffbf0' : (isVis ? 'white' : '#fcfcfc'), opacity: isProc ? 0.7 : 1 }}>

                                        {/* Checkbox */}
                                        <td style={{ padding:'10px', textAlign:'center' }}>
                                            <div onClick={() => toggleSelect(cartel.id)} style={{ cursor:'pointer' }}>
                                                {selectedIds.has(cartel.id) ? <CheckSquare size={16} color="#3b5bdb" /> : <Square size={16} color="#ccc" />}
                                            </div>
                                        </td>

                                        {/* Image */}
                                        <td style={{ padding:'10px' }}>
                                            {(cartel.image_path || cartel.imageUrl) ? (
                                                <img src={cartel.image_path || cartel.imageUrl} alt="" style={{ width:'40px', height:'40px', objectFit:'cover', borderRadius:'6px' }} />
                                            ) : (
                                                <div style={{ width:'40px', height:'40px', background:'#f0f0f0', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    <ImageIcon size={16} color="#ccc" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Année */}
                                        <td style={{ padding:'10px', fontWeight:'700', color:'#444', whiteSpace:'nowrap' }}>{cartel.annee || '—'}</td>

                                        {/* Titre */}
                                        <td style={{ padding:'10px', maxWidth:'280px' }}>
                                            <div style={{ fontWeight:'700', color:'#1a1a1a', lineHeight:'1.3' }}>{cartel.titre || '(sans titre)'}</div>
                                            {cartel.titre_en && <div style={{ color:'#999', fontSize:'0.82rem', marginTop:'2px' }}>{cartel.titre_en}</div>}
                                            {!cartel.titre_en && <div style={{ color:'#f5a623', fontSize:'0.78rem', marginTop:'2px' }}>⚠ Pas de traduction EN</div>}
                                            {activeTab === 'pending' && cartel.created_at && (
                                                <div style={{ color:'#bbb', fontSize:'0.78rem', marginTop:'3px', display:'flex', alignItems:'center', gap:'4px' }}>
                                                    <Clock size={11} />
                                                    {new Date(cartel.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                                </div>
                                            )}
                                        </td>

                                        {/* Catégories */}
                                        <td style={{ padding:'10px' }}>
                                            <div style={{ display:'flex', flexWrap:'wrap', gap:'3px' }}>
                                                {(cartel.categories || []).slice(0, 3).map(c => (
                                                    <span key={c} style={{ background:'#f0f0f0', padding:'2px 7px', borderRadius:'10px', fontSize:'0.75rem', color:'#555' }}>{c}</span>
                                                ))}
                                                {(cartel.categories || []).length > 3 && <span style={{ color:'#bbb', fontSize:'0.75rem' }}>+{cartel.categories.length - 3}</span>}
                                            </div>
                                        </td>

                                        {/* Lieu */}
                                        <td style={{ padding:'10px', color:'#777', fontSize:'0.85rem' }}>
                                            {cartel.location && <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><MapPin size={12} color="#bbb" />{cartel.location}</div>}
                                        </td>

                                        {/* IP */}
                                        {activeTab === 'pending' && (
                                            <td style={{ padding:'10px' }}>
                                                {cartel.submitter_ip && <code style={{ background:'#f5f5f5', padding:'2px 7px', borderRadius:'4px', fontSize:'0.78rem', color:'#666' }}>{cartel.submitter_ip}</code>}
                                            </td>
                                        )}

                                        {/* Statut + visibilité */}
                                        <td style={{ padding:'10px', textAlign:'center' }}>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                                                <span style={{ background:badge.bg, color:badge.color, borderRadius:'20px', padding:'2px 8px', fontSize:'0.75rem', fontWeight:'700' }}>{badge.label}</span>
                                                {activeTab === 'published' && (
                                                    <button onClick={() => handleVisibility(cartel)} title={isVis ? 'Visible · cliquer pour masquer' : 'Masqué · cliquer pour afficher'}
                                                        style={{ background:'none', border:'none', cursor:'pointer', color: isVis ? '#2e7d32' : '#ccc' }}>
                                                        {isVis ? <Eye size={15} /> : <EyeOff size={15} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding:'10px' }}>
                                            <div style={{ display:'flex', gap:'4px', justifyContent:'center', flexWrap:'wrap' }}>
                                                <ActionBtn onClick={() => setPreviewCartel(cartel)} title="Aperçu du cartel" color={HEX_COLORS.neutral}><ScanEye size={15} /></ActionBtn>
                                                <ActionBtn onClick={() => goToCreate(cartel.id)} title="Modifier le cartel" color="#3b5bdb"><Edit size={15} /></ActionBtn>

                                                {/* Retraduire */}
                                                <ActionBtn onClick={() => handleTranslate(cartel)} title="Retraduire en anglais (IA)" color="#6741d9" disabled={isTrans}>
                                                    {isTrans ? <Clock size={15} /> : <Languages size={15} />}
                                                </ActionBtn>

                                                {(cartel.status === 'draft' || cartel.status === 'pending_review') && (
                                                    <ActionBtn onClick={() => handlePublish(cartel)} title="Publier sur la frise" color="#2e7d32" disabled={isProc}><Check size={15} /></ActionBtn>
                                                )}
                                                {(cartel.status === 'pending_review' || cartel.status === 'published') && (
                                                    <ActionBtn onClick={() => handleToDraft(cartel)} title="Repasser en brouillon" color="#e67e00" disabled={isProc}><FileText size={15} /></ActionBtn>
                                                )}
                                                {cartel.status === 'published' && (
                                                    <ActionBtn onClick={() => handleArchive(cartel)} title="Archiver (masquer)" color="#6b7280" disabled={isProc}><X size={15} /></ActionBtn>
                                                )}
                                                <ActionBtn onClick={() => handleDelete(cartel.id)} title="Supprimer définitivement" color="#d32f2f" disabled={isProc}><Trash2 size={15} /></ActionBtn>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Modal aperçu ──────────────────────────────── */}
            {previewCartel && (
                <div onClick={() => setPreviewCartel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'700px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
                        <button onClick={() => setPreviewCartel(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f5f5f5', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} /></button>
                        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:'700' }}>Aperçu</h3>
                        <div style={{ border:'1px solid #eee', borderRadius:'10px', padding:'12px', height:'400px', overflow:'hidden' }}>
                            <CartelPreview data={previewCartel} />
                        </div>
                        <div style={{ display:'flex', gap:'10px', marginTop:'16px', justifyContent:'flex-end' }}>
                            <button onClick={() => { setPreviewCartel(null); goToCreate(previewCartel.id); }}
                                style={{ display:'flex', alignItems:'center', gap:'6px', background:'#3b5bdb', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                <Edit size={15} /> Éditer
                            </button>
                            <button onClick={() => handleTranslate(previewCartel)}
                                style={{ display:'flex', alignItems:'center', gap:'6px', background:'#6741d9', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                <Languages size={15} /> Retraduire
                            </button>
                            <button onClick={() => setPreviewCartel(null)} style={{ padding:'10px 18px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', fontFamily:'inherit' }}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Bouton action compact ─────────────────────────────────────
const ActionBtn = ({ onClick, title, color, disabled, children }) => {
    const [isHover, setIsHover] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const baseColor = color || HEX_COLORS.neutral;

    const style = {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${hexToRgba(baseColor, 0.25)}`,
        borderRadius: '10px',
        background: disabled
            ? '#f3f4f6'
            : isHover
                ? baseColor
                : hexToRgba(baseColor, 0.12),
        color: disabled ? '#9ca3af' : (isHover ? 'white' : baseColor),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.9 : 1,
        transition: 'all 0.12s ease',
    };

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                onClick={onClick}
                disabled={disabled}
                aria-label={title}
                style={style}
                onMouseEnter={() => { setIsHover(true); setShowTip(true); }}
                onMouseLeave={() => { setIsHover(false); setShowTip(false); }}
                onFocus={() => setShowTip(true)}
                onBlur={() => setShowTip(false)}
            >
                {children}
            </button>

            {showTip && (
                <div
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#111827',
                        color: 'white',
                        fontSize: '0.74rem',
                        fontWeight: '600',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 20,
                        boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
                    }}
                >
                    {title}
                </div>
            )}
        </div>
    );
};

export default ManageCartels;
