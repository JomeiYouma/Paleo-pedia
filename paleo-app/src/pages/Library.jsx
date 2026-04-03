import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import TimelineMode from '../components/TimelineMode';
import MapMode from '../components/MapMode';
import HeuristicMode from '../components/HeuristicMode';
import { getYearForSort } from '../utils/helpers';
import { Download, Trash2, CheckSquare, Square, Edit, LayoutList, CalendarDays, Map as MapIcon, Search, GitGraph } from 'lucide-react';
import { generateZip } from '../utils/zipGenerator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Library.css';

/** Badge de statut pour les cartels hors "published" (visible admin only) */
const StatusBadge = ({ status }) => {
    const styles = {
        draft:          { background: '#f0f4ff', color: '#3b5bdb', label: '🖊️ Brouillon'    },
        pending_review: { background: '#fff4e0', color: '#e67e00', label: '⏳ En attente'   },
        archived:       { background: '#f8f8f8', color: '#888',    label: '🗄️ Archivé'      },
    };
    const s = styles[status];
    if (!s) return null;
    return (
        <span style={{
            display: 'inline-block', fontSize: '0.72rem', fontWeight: '600',
            padding: '2px 8px', borderRadius: '20px',
            background: s.background, color: s.color,
            marginLeft: '8px', verticalAlign: 'middle',
        }}>
            {s.label}
        </span>
    );
};

const Library = () => {
    const { t, i18n } = useTranslation();
    // Source unique : tous les cartels depuis l'API (l'API filtre selon le rôle)
    const { cartels, loading, deleteCartel, deleteCartels, isAdmin, currentWorkshop } = useApp();

    const [selectedIds, setSelectedIds]     = useState(new Set());
    const [searchQuery, setSearchQuery]     = useState('');
    const [viewMode, setViewMode]           = useState('timeline');
    const [selectedCats, setSelectedCats]   = useState([]);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [progress, setProgress]           = useState({ current: 0, total: 0 });
    const [targetCartelId, setTargetCartelId] = useState(null);

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Pré-filtrer par catégorie si ?category= est dans l'URL
    const urlCategoryFilter = searchParams.get('category');
    useEffect(() => {
        if (urlCategoryFilter) setSelectedCats([decodeURIComponent(urlCategoryFilter)]);
    }, [urlCategoryFilter]);

    const pageTitle = urlCategoryFilter ? decodeURIComponent(urlCategoryFilter) : null;
    const clearCategoryFilter = () => { setSelectedCats([]); setSearchParams({}); };
    const handleGoToTimeline = (id) => { setTargetCartelId(id); setViewMode('timeline'); };

    // Toutes les catégories présentes dans les cartels
    const allCategories = useMemo(() => {
        const set = new Set();
        const isEn = i18n.language === 'en';
        (cartels || []).forEach(c => {
            const cats = isEn ? (c.categories_en || []) : (c.categories || []);
            cats.forEach(cat => set.add(cat));
        });
        return Array.from(set).sort();
    }, [cartels, i18n.language]);

    // Construction de la liste filtrée
    const filteredCartels = useMemo(() => {
        let data = Array.isArray(cartels) ? [...cartels] : [];

        // Mode Atelier : seulement les cartels liés à cet atelier
        if (currentWorkshop) {
            const allowedIds = new Set((currentWorkshop.cartelIds || []).map(String));
            data = data.filter(c => allowedIds.has(String(c.id)));
        } else if (!isAdmin) {
            // Visiteur : seulement les publiés
            data = data.filter(c => c.status === 'published' && c.visible);
        }
        // Admin : voit tout (avec badges)

        // Filtre catégories
        const isEn = i18n.language === 'en';
        if (selectedCats.length > 0) {
            data = data.filter(c => {
                const cats = isEn ? (c.categories_en || []) : (c.categories || []);
                return cats.some(cat => selectedCats.includes(cat));
            });
        }

        // Filtre texte
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(c =>
                (c.titre || '').toLowerCase().includes(q) ||
                (c.titre_en || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q) ||
                (c.location || '').toLowerCase().includes(q) ||
                String(c.annee || '').includes(q)
            );
        }

        return data.sort((a, b) => getYearForSort(a) - getYearForSort(b));
    }, [cartels, selectedCats, searchQuery, isAdmin, currentWorkshop, i18n.language]);

    // Sélection
    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setSelectedIds(newSet);
    };
    const selectAll = () => {
        setSelectedIds(selectedIds.size === filteredCartels.length
            ? new Set()
            : new Set(filteredCartels.map(c => c.id)));
    };

    const handleZip = async () => {
        if (!selectedIds.size) return;
        setGeneratingZip(true);
        setProgress({ current: 0, total: selectedIds.size });
        try {
            const items = cartels.filter(c => selectedIds.has(c.id));
            await generateZip(items, i18n.language || 'fr', (current, total) => setProgress({ current, total }));
        } catch (e) {
            alert(t('messages.zipError'));
        } finally {
            setGeneratingZip(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size || !confirm(t('messages.bulkDeleteConfirm'))) return;
        await deleteCartels(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    if (loading && !cartels.length) return <div className="container">{t('library.loading')}</div>;

    return (
        <div style={{ padding: '0 20px' }}>

            {/* Progress overlay export ZIP */}
            {generatingZip && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3>{t('library.generating')}</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '20px 0' }}>{progress.current} / {progress.total}</div>
                    <div style={{ width: '300px', height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'var(--color-pink-darker)', transition: 'width 0.3s' }} />
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                {/* Barre de contrôles */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    {/* Recherche */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <input
                            type="text"
                            placeholder={t('library.searchPlaceholder', 'Rechercher (titre, année, lieu...)')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '8px 40px 8px 36px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box' }}
                        />
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        {filteredCartels.length > 0 && (
                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#eee', color: '#666', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700' }}>
                                {filteredCartels.length}
                            </span>
                        )}
                    </div>

                    {/* Modes de vue */}
                    <div className="view-mode-container">
                        <button onClick={() => setViewMode('timeline')} className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}>
                            <CalendarDays size={18} /><span>Frise</span>
                        </button>
                        <button onClick={() => setViewMode('map')} className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}>
                            <MapIcon size={18} /><span>Carte</span>
                        </button>
                        <button onClick={() => setViewMode('heuristic')} className={`view-mode-btn ${viewMode === 'heuristic' ? 'active' : ''}`}>
                            <GitGraph size={18} /><span>Heuristique</span>
                        </button>
                        {isAdmin && (
                            <button onClick={() => setViewMode('list')} className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}>
                                <LayoutList size={18} /><span>Liste</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtres catégories */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {allCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => selectedCats.includes(cat)
                                ? setSelectedCats(selectedCats.filter(c => c !== cat))
                                : setSelectedCats([...selectedCats, cat])}
                            style={{
                                padding: '4px 12px', borderRadius: '20px', border: '1px solid #ddd',
                                background: selectedCats.includes(cat) ? 'var(--color-pink-darker)' : 'transparent',
                                color: selectedCats.includes(cat) ? 'white' : '#555',
                                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >{cat}</button>
                    ))}
                </div>

                {/* Actions batch (mode liste admin) */}
                {viewMode === 'list' && isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
                        <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem', padding: '6px 10px' }}>
                            {selectedIds.size === filteredCartels.length && filteredCartels.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                            {selectedIds.size === filteredCartels.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                        <button onClick={handleZip} disabled={!selectedIds.size || generatingZip} style={{ fontSize: '0.88rem', padding: '6px 10px' }}>
                            <Download size={14} style={{ marginRight: 4 }} />
                            ZIP ({selectedIds.size})
                        </button>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkDelete} style={{ color: 'red', borderColor: 'red', fontSize: '0.88rem', padding: '6px 10px' }}>
                                <Trash2 size={14} style={{ marginRight: 4 }} />
                                Supprimer ({selectedIds.size})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Contenu */}
            {viewMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredCartels.map(cartel => (
                        <div key={cartel.id} style={{
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                            borderTop: '1px solid #eee', paddingTop: '16px',
                            opacity: cartel.status === 'archived' ? 0.6 : 1
                        }}>
                            {isAdmin && (
                                <div onClick={() => toggleSelection(cartel.id)} style={{ cursor: 'pointer', marginTop: '10px', flexShrink: 0 }}>
                                    {selectedIds.has(cartel.id) ? <CheckSquare size={18} /> : <Square size={18} color="#ccc" />}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                {/* Badge statut pour l'admin */}
                                {isAdmin && cartel.status !== 'published' && (
                                    <div style={{ marginBottom: '6px' }}>
                                        <StatusBadge status={cartel.status} />
                                    </div>
                                )}
                                <CartelPreview data={cartel} />
                            </div>
                            {isAdmin && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                    <button onClick={() => navigate(`/app/create?edit=${cartel.id}`)} title="Éditer" style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => { if (confirm(t('messages.deleteConfirm'))) deleteCartel(cartel.id); }} style={{ color: 'red', padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredCartels.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>Aucun cartel ne correspond à ces filtres.</p>
                    )}
                </div>
            )}

            {viewMode === 'timeline' && (
                <TimelineMode cartels={filteredCartels} onDelete={deleteCartel} targetId={targetCartelId} isAdmin={isAdmin} />
            )}
            {viewMode === 'map' && (
                <MapMode cartels={filteredCartels} onGoToTimeline={handleGoToTimeline} isAdmin={isAdmin} />
            )}
            {viewMode === 'heuristic' && (
                <HeuristicMode cartels={filteredCartels} />
            )}
        </div>
    );
};

export default Library;
