import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Edit, Trash2, Eye, EyeOff, Check, X, Clock,
    Download, Square, CheckSquare, Search,
    ArrowUpDown, ArrowUp, ArrowDown,
    FileText, Inbox, Globe, Plus, ScanEye, MapPin, Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateZip } from '../utils/zipGenerator';
import CartelPreview from '../components/CartelPreview';
import { getYearForSort } from '../utils/helpers';
import api from '../services/apiClient';

// ── Onglets ──────────────────────────────────────────────────
const TABS = [
    {
        key: 'drafts',
        label: 'Brouillons',
        icon: FileText,
        color: '#3b5bdb',
        bg: '#f0f4ff',
        description: 'Cartels en cours de rédaction (non visibles)',
        filter: c => c.status === 'draft',
    },
    {
        key: 'pending',
        label: 'Propositions',
        icon: Inbox,
        color: '#e67e00',
        bg: '#fff4e0',
        description: 'Soumissions de visiteurs à modérer',
        filter: c => c.status === 'pending_review',
    },
    {
        key: 'published',
        label: 'Publiés',
        icon: Globe,
        color: '#2e7d32',
        bg: '#e8f5e9',
        description: 'Cartels visibles sur la frise',
        filter: c => c.status === 'published' || c.status === 'archived',
    },
];

const STATUS_BADGE = {
    draft:          { label: 'Brouillon',   bg: '#f0f4ff', color: '#3b5bdb' },
    pending_review: { label: 'Proposition', bg: '#fff4e0', color: '#e67e00' },
    published:      { label: 'Publié',      bg: '#e8f5e9', color: '#2e7d32' },
    archived:       { label: 'Archivé',     bg: '#f5f5f5', color: '#888'   },
};

// ── Composant principal ──────────────────────────────────────
const ManageCartels = () => {
    const { cartels, fetchData, deleteCartel, deleteCartels, updateCartel, isAdmin, categories } = useApp();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tab actif
    const activeTab = searchParams.get('tab') || 'drafts';
    const setActiveTab = (key) => setSearchParams({ tab: key });

    // Filtres & tri
    const [search,          setSearch]          = useState('');
    const [filterCategory,  setFilterCategory]  = useState('');
    const [sortConfig,      setSortConfig]       = useState({ key: 'date', direction: 'desc' });
    const [selectedIds,     setSelectedIds]      = useState(new Set());
    const [processingId,    setProcessingId]     = useState(null);
    const [previewCartel,   setPreviewCartel]    = useState(null);
    const [generatingZip,   setGeneratingZip]    = useState(false);
    const [progress,        setProgress]         = useState({ current: 0, total: 0 });

    const currentTabDef = TABS.find(t => t.key === activeTab) || TABS[0];

    // Comptages par onglet
    const counts = useMemo(() => {
        const obj = {};
        TABS.forEach(tab => {
            obj[tab.key] = cartels.filter(tab.filter).length;
        });
        return obj;
    }, [cartels]);

    // Données filtrées pour l'onglet actif
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
            if (sortConfig.key === 'date')     { av = getYearForSort(a);                  bv = getYearForSort(b); }
            else if (sortConfig.key === 'titre') { av = (a.titre || '').toLowerCase();     bv = (b.titre || '').toLowerCase(); }
            else if (sortConfig.key === 'loc')   { av = (a.location || '').toLowerCase();  bv = (b.location || '').toLowerCase(); }
            else                                 { av = a[sortConfig.key];                  bv = b[sortConfig.key]; }
            if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
            if (av > bv) return sortConfig.direction === 'asc' ?  1 : -1;
            return 0;
        });

        return data;
    }, [cartels, currentTabDef, search, filterCategory, sortConfig]);

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                <p>Accès réservé à l'administration.</p>
            </div>
        );
    }

    // ── Actions ──────────────────────────────────────────────

    const act = async (id, fn) => {
        setProcessingId(id);
        try { await fn(); await fetchData(); }
        catch (e) { alert('Erreur : ' + e.message); }
        finally { setProcessingId(null); }
    };

    const handlePublish = (cartel) => {
        if (!confirm(`Publier "${cartel.titre}" ?`)) return;
        act(cartel.id, () => api.cartels.publish(cartel.id));
    };

    const handleToDraft = (cartel) => {
        if (!confirm(`Repasser "${cartel.titre}" en brouillon ?`)) return;
        act(cartel.id, () => api.cartels.setStatus(cartel.id, 'draft'));
    };

    const handleArchive = (cartel) => {
        if (!confirm(`Archiver "${cartel.titre}" ?`)) return;
        act(cartel.id, () => api.cartels.archive(cartel.id));
    };

    const handleDelete = (id) => {
        if (!confirm(t('messages.confirmDelete', 'Supprimer ?'))) return;
        act(id, () => api.cartels.delete(id));
    };

    const handleVisibility = (cartel) => {
        updateCartel({ ...cartel, visible: !cartel.visible });
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size || !confirm(`Supprimer ces ${selectedIds.size} cartels ?`)) return;
        setGeneratingZip(true);
        try {
            for (const id of selectedIds) await api.cartels.delete(id);
            await fetchData();
            setSelectedIds(new Set());
        } finally { setGeneratingZip(false); }
    };

    const handleBulkPublish = async () => {
        if (!selectedIds.size) return;
        setGeneratingZip(true);
        try {
            for (const id of selectedIds) {
                const c = cartels.find(x => x.id === id);
                if (c && c.status !== 'published') await api.cartels.publish(id);
            }
            await fetchData();
            setSelectedIds(new Set());
        } finally { setGeneratingZip(false); }
    };

    const handleExportZip = async () => {
        if (!selectedIds.size) return;
        setGeneratingZip(true);
        setProgress({ current: 0, total: selectedIds.size });
        try {
            const items = cartels.filter(c => selectedIds.has(c.id));
            await generateZip(items, i18n.language || 'fr', (curr, total) => setProgress({ current: curr, total }));
        } finally { setGeneratingZip(false); }
    };

    // ── Sélection ─────────────────────────────────────────────
    const toggleSelect = (id) => {
        const s = new Set(selectedIds);
        s.has(id) ? s.delete(id) : s.add(id);
        setSelectedIds(s);
    };
    const selectAll = () => {
        setSelectedIds(selectedIds.size === filteredCartels.length
            ? new Set()
            : new Set(filteredCartels.map(c => c.id))
        );
    };

    // ── Tri ───────────────────────────────────────────────────
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };
    const SortIcon = ({ k }) => {
        if (sortConfig.key !== k) return <ArrowUpDown size={13} color="#ccc" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={13} color="#333" /> : <ArrowDown size={13} color="#333" />;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>

            {/* ── Overlay export ───────────────────────────────── */}
            {generatingZip && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(255,255,255,0.92)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{ width: '50px', height: '50px', border: '5px solid #eee', borderTop: '5px solid #D65A5A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h3 style={{ marginTop: '20px' }}>Traitement…</h3>
                    {progress.total > 0 && (
                        <>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700', margin: '8px 0' }}>{progress.current}/{progress.total}</div>
                            <div style={{ width: '280px', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: '#D65A5A', transition: 'width 0.3s' }} />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── En-tête ───────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1a1a1a' }}>Gestion des cartels</h1>
                    <p style={{ margin: '4px 0 0', color: '#999', fontSize: '0.88rem' }}>
                        {cartels.length} cartel{cartels.length !== 1 ? 's' : ''} au total
                    </p>
                </div>
                <button
                    onClick={() => navigate('/app/create')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 20px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                    }}
                >
                    <Plus size={16} /> Nouveau cartel
                </button>
            </div>

            {/* ── Onglets ───────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                gap: '4px',
                background: '#f5f5f5',
                borderRadius: '14px',
                padding: '4px',
                marginBottom: '24px',
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.88rem',
                                fontFamily: 'inherit',
                                background: active ? 'white' : 'transparent',
                                color: active ? tab.color : '#888',
                                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            <Icon size={15} />
                            {tab.label}
                            <span style={{
                                background: active ? tab.bg : '#e8e8e8',
                                color: active ? tab.color : '#999',
                                borderRadius: '20px',
                                padding: '1px 8px',
                                fontSize: '0.78rem',
                                fontWeight: '800',
                                minWidth: '22px',
                                textAlign: 'center',
                            }}>
                                {counts[tab.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Description de l'onglet ──────────────────────── */}
            <p style={{
                background: currentTabDef.bg,
                color: currentTabDef.color,
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                margin: '0 0 20px',
            }}>
                {currentTabDef.description}
            </p>

            {/* ── Barre filtres + actions ───────────────────────── */}
            <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px',
            }}>
                {/* Recherche */}
                <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input
                        type="text"
                        placeholder="Rechercher…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 36px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                    {filteredCartels.length > 0 && (
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#eee', color: '#666', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem', fontWeight: '700' }}>
                            {filteredCartels.length}
                        </span>
                    )}
                </div>

                {/* Filtre catégorie */}
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.88rem', background: 'white' }}
                >
                    <option value="">Toutes catégories</option>
                    {categories.map(c => <option key={c.id || c} value={c.name || c}>{c.name || c}</option>)}
                </select>

                {/* Sélectionner tout */}
                <button
                    onClick={selectAll}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '0.85rem', color: '#555', fontFamily: 'inherit' }}
                >
                    {selectedIds.size > 0 && selectedIds.size === filteredCartels.length
                        ? <CheckSquare size={15} color="#3b5bdb" />
                        : <Square size={15} color="#aaa" />
                    }
                    {selectedIds.size > 0 ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
                </button>

                {/* Actions sur la sélection */}
                {selectedIds.size > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {activeTab !== 'published' && (
                            <button
                                onClick={handleBulkPublish}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#2e7d32', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' }}
                            >
                                <Check size={14} /> Publier ({selectedIds.size})
                            </button>
                        )}
                        <button
                            onClick={handleExportZip}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#555', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' }}
                        >
                            <Download size={14} /> ZIP
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#d32f2f', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' }}
                        >
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                )}
            </div>

            {/* ── Tableau ───────────────────────────────────────── */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                {filteredCartels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
                        <p style={{ fontSize: '1.1rem' }}>Aucun cartel dans cet onglet.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead style={{ background: '#f8f8f8', borderBottom: '2px solid #eee' }}>
                            <tr>
                                <th style={{ padding: '12px', width: '36px' }} />
                                <th style={{ padding: '12px', width: '50px', textAlign: 'left' }}>Img</th>
                                <th
                                    onClick={() => handleSort('date')}
                                    style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Année <SortIcon k="date" /></div>
                                </th>
                                <th
                                    onClick={() => handleSort('titre')}
                                    style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Titre <SortIcon k="titre" /></div>
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Catégories</th>
                                <th
                                    onClick={() => handleSort('loc')}
                                    style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Lieu <SortIcon k="loc" /></div>
                                </th>
                                {activeTab === 'pending' && <th style={{ padding: '12px', textAlign: 'left' }}>IP</th>}
                                <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCartels.map(cartel => {
                                const badge = STATUS_BADGE[cartel.status] || {};
                                const isVisible = cartel.visible !== false;
                                const isProc = processingId === cartel.id;

                                return (
                                    <tr
                                        key={cartel.id}
                                        style={{
                                            borderBottom: '1px solid #f0f0f0',
                                            background: isProc ? '#fffbf0' : (isVisible ? 'white' : '#fcfcfc'),
                                            opacity: isProc ? 0.7 : 1,
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <div onClick={() => toggleSelect(cartel.id)} style={{ cursor: 'pointer' }}>
                                                {selectedIds.has(cartel.id)
                                                    ? <CheckSquare size={16} color="#3b5bdb" />
                                                    : <Square size={16} color="#ccc" />
                                                }
                                            </div>
                                        </td>

                                        {/* Image */}
                                        <td style={{ padding: '10px' }}>
                                            {(cartel.image_path || cartel.imageUrl) ? (
                                                <img
                                                    src={cartel.image_path || cartel.imageUrl}
                                                    alt=""
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                                />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ImageIcon size={16} color="#ccc" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Année */}
                                        <td style={{ padding: '10px', fontWeight: '700', color: '#444', whiteSpace: 'nowrap' }}>
                                            {cartel.annee || '—'}
                                        </td>

                                        {/* Titre */}
                                        <td style={{ padding: '10px', maxWidth: '280px' }}>
                                            <div style={{ fontWeight: '700', color: '#1a1a1a', lineHeight: '1.3' }}>{cartel.titre || '(sans titre)'}</div>
                                            {cartel.titre_en && (
                                                <div style={{ color: '#999', fontSize: '0.82rem', marginTop: '2px' }}>{cartel.titre_en}</div>
                                            )}
                                            {activeTab === 'pending' && cartel.created_at && (
                                                <div style={{ color: '#bbb', fontSize: '0.78rem', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={11} />
                                                    {new Date(cartel.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </td>

                                        {/* Catégories */}
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                                                {(cartel.categories || []).slice(0, 3).map(c => (
                                                    <span key={c} style={{ background: '#f0f0f0', padding: '2px 7px', borderRadius: '10px', fontSize: '0.75rem', color: '#555' }}>{c}</span>
                                                ))}
                                                {(cartel.categories || []).length > 3 && (
                                                    <span style={{ color: '#bbb', fontSize: '0.75rem' }}>+{cartel.categories.length - 3}</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Lieu */}
                                        <td style={{ padding: '10px', color: '#777', fontSize: '0.85rem' }}>
                                            {cartel.location && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={12} color="#bbb" />
                                                    {cartel.location}
                                                </div>
                                            )}
                                        </td>

                                        {/* IP (onglet pending seulement) */}
                                        {activeTab === 'pending' && (
                                            <td style={{ padding: '10px' }}>
                                                {cartel.submitter_ip && (
                                                    <code style={{ background: '#f5f5f5', padding: '2px 7px', borderRadius: '4px', fontSize: '0.78rem', color: '#666' }}>
                                                        {cartel.submitter_ip}
                                                    </code>
                                                )}
                                            </td>
                                        )}

                                        {/* Statut + visibilité */}
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <span style={{
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    borderRadius: '20px',
                                                    padding: '2px 8px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                }}>
                                                    {badge.label}
                                                </span>
                                                {activeTab === 'published' && (
                                                    <button
                                                        onClick={() => handleVisibility(cartel)}
                                                        title={isVisible ? 'Visible · cliquer pour masquer' : 'Masqué · cliquer pour afficher'}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isVisible ? '#2e7d32' : '#ccc' }}
                                                    >
                                                        {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '10px' }}>
                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                {/* Aperçu rapide */}
                                                <ActionButton
                                                    onClick={() => setPreviewCartel(cartel)}
                                                    title="Aperçu"
                                                    color="#555"
                                                >
                                                    <ScanEye size={15} />
                                                </ActionButton>

                                                {/* Éditer */}
                                                <ActionButton
                                                    onClick={() => navigate(`/app/create?edit=${cartel.id}`)}
                                                    title="Éditer"
                                                    color="#3b5bdb"
                                                >
                                                    <Edit size={15} />
                                                </ActionButton>

                                                {/* Publier (depuis draft ou pending) */}
                                                {(cartel.status === 'draft' || cartel.status === 'pending_review') && (
                                                    <ActionButton
                                                        onClick={() => handlePublish(cartel)}
                                                        title="Publier"
                                                        color="#2e7d32"
                                                        disabled={isProc}
                                                    >
                                                        <Check size={15} />
                                                    </ActionButton>
                                                )}

                                                {/* Repasser en brouillon (depuis pending ou published) */}
                                                {(cartel.status === 'pending_review' || cartel.status === 'published') && (
                                                    <ActionButton
                                                        onClick={() => handleToDraft(cartel)}
                                                        title="Repasser en brouillon"
                                                        color="#e67e00"
                                                        disabled={isProc}
                                                    >
                                                        <FileText size={15} />
                                                    </ActionButton>
                                                )}

                                                {/* Archiver */}
                                                {cartel.status === 'published' && (
                                                    <ActionButton
                                                        onClick={() => handleArchive(cartel)}
                                                        title="Archiver"
                                                        color="#888"
                                                        disabled={isProc}
                                                    >
                                                        <X size={15} />
                                                    </ActionButton>
                                                )}

                                                {/* Supprimer */}
                                                <ActionButton
                                                    onClick={() => handleDelete(cartel.id)}
                                                    title="Supprimer"
                                                    color="#d32f2f"
                                                    disabled={isProc}
                                                >
                                                    <Trash2 size={15} />
                                                </ActionButton>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Modal aperçu ────────────────────────────────── */}
            {previewCartel && (
                <div
                    onClick={() => setPreviewCartel(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '700px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                        }}
                    >
                        <button
                            onClick={() => setPreviewCartel(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={16} />
                        </button>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '700' }}>Aperçu</h3>
                        <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '12px', height: '400px', overflow: 'hidden' }}>
                            <CartelPreview data={previewCartel} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setPreviewCartel(null); navigate(`/app/create?edit=${previewCartel.id}`); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#3b5bdb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}
                            >
                                <Edit size={15} /> Éditer
                            </button>
                            <button
                                onClick={() => setPreviewCartel(null)}
                                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Bouton action compact ────────────────────────────────────
const ActionButton = ({ onClick, title, color, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${color}20`,
            borderRadius: '6px',
            background: `${color}10`,
            color,
            cursor: disabled ? 'wait' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.12s',
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; } }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.color = color; }}
    >
        {children}
    </button>
);

export default ManageCartels;
