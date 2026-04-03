import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import TimelineMode from '../components/TimelineMode';
import MapMode from '../components/MapMode';
import HeuristicMode from '../components/HeuristicMode';
import { getYearForSort } from '../utils/helpers';
import { Download, Trash2, CheckSquare, Square, Edit, LayoutList, CalendarDays, Map as MapIcon, Search, Eye, GitGraph, ArrowLeft, Layers } from 'lucide-react';
import { generateZip } from '../utils/zipGenerator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Library.css';

const Library = () => {
    const { t, i18n } = useTranslation();
    const { cartels, drafts, loading, deleteCartel, deleteCartels, updateCartel, isAdmin, currentWorkshop } = useApp();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('timeline');
    const [selectedCats, setSelectedCats] = useState([]);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [targetCartelId, setTargetCartelId] = useState(null);

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Pré-filtrer par catégorie si ?category= est présent dans l'URL
    useEffect(() => {
        const catParam = searchParams.get('category');
        if (catParam) {
            setSelectedCats([decodeURIComponent(catParam)]);
        }
    }, [searchParams]);

    // Titre dynamique : "Paléo H2O" si filtrage par 1 catégorie via URL
    const urlCategoryFilter = searchParams.get('category');
    const pageTitle = urlCategoryFilter ? `Paléo ${decodeURIComponent(urlCategoryFilter)}` : null;

    const clearCategoryFilter = () => {
        setSelectedCats([]);
        setSearchParams({});
    };

    const handleGoToTimeline = (id) => {
        setTargetCartelId(id);
        setViewMode('timeline');
    };

    // Extract all categories
    const allCategories = useMemo(() => {
        const set = new Set();
        const isEn = i18n.language === 'en';
        if (Array.isArray(cartels)) {
            cartels.forEach(c => {
                if (!c) return;
                const cats = isEn ? (c.categories_en || []) : (c.categories || []);
                if (Array.isArray(cats)) {
                    cats.forEach(cat => set.add(cat));
                }
            });
        }
        return Array.from(set).sort();
    }, [cartels, i18n.language]);

    // Filter and Sort
    const filteredCartels = useMemo(() => {
        let data = [];
        if (!Array.isArray(cartels)) return [];

        // WORKSHOP MODE: Only show cartels belonging to this workshop
        if (currentWorkshop) {
            const allowedIds = currentWorkshop.cartelIds || [];
            // Also include cartels that were created in this workshop (origin == workshop.id or name)
            // Check string/number types carefully.
            data = cartels.filter(c =>
                c && (
                    allowedIds.includes(String(c.id)) ||
                    allowedIds.includes(Number(c.id))
                )
            );

            // MERGE DRAFTS: Show proposals created in this workshop immediately
            if (Array.isArray(drafts)) {
                // Determine if a draft belongs here. 
                // We rely on 'workshopId' matching the workshop ID.
                const workshopDrafts = drafts.filter(d => String(d.workshopId) === String(currentWorkshop.id));
                if (workshopDrafts.length > 0) {
                    // Combine. Drafts usually go at the end or sorted by date?
                    // We let the sorter handle it.
                    data = [...data, ...workshopDrafts];
                }
            }
        } else {
            // NORMAL MODE: Show visible ones (unless admin, but strictly following 'Public' view for Library)
            data = cartels.filter(c => c && c.visible !== false);
        }

        const isEn = i18n.language === 'en';
        if (selectedCats.length > 0) {
            data = data.filter(c => {
                if (!c) return false;
                const cats = isEn ? (c.categories_en || []) : (c.categories || []);
                return cats && Array.isArray(cats) && cats.some(cat => selectedCats.includes(cat));
            });
        }
        // TEXT SEARCH
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(c => {
                const title = (c.titre || '').toLowerCase();
                const titleEn = (c.titre_en || '').toLowerCase();
                const desc = (c.description || '').toLowerCase();
                const descEn = (c.description_en || '').toLowerCase();
                const loc = (c.location || '').toLowerCase();
                const year = String(c.annee || '');
                return title.includes(query) || titleEn.includes(query) || desc.includes(query) || descEn.includes(query) || loc.includes(query) || year.includes(query);
            });
        }

        return [...data].sort((a, b) => getYearForSort(a) - getYearForSort(b));
    }, [cartels, selectedCats, i18n.language, currentWorkshop, searchQuery]);

    // Selection Handlers
    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredCartels.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCartels.map(c => c.id)));
        }
    };

    const handleZip = async () => {
        if (selectedIds.size === 0) return;
        setGeneratingZip(true);
        setProgress({ current: 0, total: selectedIds.size });
        try {
            const selectedItems = cartels.filter(c => selectedIds.has(c.id));
            await generateZip(selectedItems, t('lang', { defaultValue: i18n.language || 'fr' }) === 'en' ? 'en' : i18n.language || 'fr', (current, total) => {
                setProgress({ current, total });
            });
        } catch (e) {
            console.error(e);
            alert(t('messages.zipError'));
        } finally {
            setGeneratingZip(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(t('messages.bulkDeleteConfirm'))) return;

        const idsToDelete = Array.from(selectedIds);
        await deleteCartels(idsToDelete);

        setSelectedIds(new Set());
    };

    const handleBulkVisibility = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(t('messages.bulkVisibilityConfirm', "Changer la visibilité des éléments sélectionnés ?"))) return;

        // We toggle visibility. If mixed, we set all to visible? Or just inverse?
        // Let's ask: Force Visible or Force Hidden?
        // Simpler: Just toggle each one? No, inconsistent.
        // Better: Dialog "Rendre Visible" vs "Rendre Incorrect"?
        // Implementation: Toggle based on the first one, or just set to TRUE/FALSE?
        // Let's use a simple toggle loop for now, or maybe default to 'Visible'.
        // Let's set them all to VISIBLE (true) if they differ, or toggle if they are all same.
        // Actually, let's just make them all VISIBLE for now as that's the most common use case for "Publication".
        // The user asked "modifier la visibilité", like in Workshops.
        // In Workshop it's likely a toggle. I will implement a toggle: if ALL are visible => hide. Else => show.

        const selectedItems = cartels.filter(c => selectedIds.has(c.id));
        const allVisible = selectedItems.every(c => c.visible !== false);
        const newStatus = !allVisible;

        for (const item of selectedItems) {
            await updateCartel({ ...item, visible: newStatus }, false); // false = not draft mode, direct update
        }
        alert(t('messages.bulkVisibilityDone', `Visibilité mise à jour : ${newStatus ? 'Visible' : 'Caché'}`));
        setSelectedIds(new Set());
    };

    if (loading && cartels.length === 0) return <div className="container">{t('library.loading')}</div>;

    return (
        <div style={{ padding: '0 20px' }}>

            {/* ── Titre Thématique ─────────────────────────────────── */}
            {pageTitle && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '24px 0 8px 0',
                    borderBottom: '2px solid var(--color-pink-darker, #C2185B)',
                    marginBottom: '24px',
                }}>
                    <button
                        onClick={clearCategoryFilter}
                        title="Retour à tous les cartels"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'none', border: '1px solid #ddd',
                            borderRadius: '20px', padding: '6px 14px',
                            cursor: 'pointer', color: '#666', fontSize: '0.85rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        <ArrowLeft size={14} /> Toutes les thématiques
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layers size={22} color="var(--color-pink-darker, #C2185B)" />
                        <h1 style={{
                            margin: 0,
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: 'var(--color-pink-darker, #C2185B)',
                            letterSpacing: '-0.5px',
                        }}>
                            {pageTitle}
                        </h1>
                    </div>
                </div>
            )}
            {/* Progress Overlay */}
            {generatingZip && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-black)'
                }}>
                    <h3>{t('library.generating')}</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '20px 0' }}>
                        {progress.current} / {progress.total}
                    </div>
                    <div style={{ width: '300px', height: '10px', backgroundColor: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${(progress.current / progress.total) * 100}%`,
                            height: '100%',
                            backgroundColor: 'var(--color-pink-darker)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <input
                            type="text"
                            placeholder={t('library.searchPlaceholder', "Rechercher (titre, année, lieu...)")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 10px 8px 35px',
                                borderRadius: '20px',
                                border: '1px solid #ccc',
                                fontSize: '0.9rem'
                            }}
                        />
                        <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                        {filteredCartels.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#eee',
                                color: '#555',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {filteredCartels.length}
                            </span>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="view-mode-container">
                        <button
                            onClick={() => setViewMode('timeline')}
                            title={t('library.viewTimeline')}
                            className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                        >
                            <CalendarDays size={18} />
                            <span>{t('library.viewTimeline', "Frise")}</span>
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            title={t('library.viewMap')}
                            className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                        >
                            <MapIcon size={18} />
                            <span>{t('library.viewMap', "Carte")}</span>
                        </button>
                        <button
                            onClick={() => setViewMode('heuristic')}
                            title={t('library.viewHeuristic', "Heuristique")}
                            className={`view-mode-btn ${viewMode === 'heuristic' ? 'active' : ''}`}
                        >
                            <GitGraph size={18} />
                            <span>{t('library.viewHeuristic', "Heuristique")}</span>
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setViewMode('list')}
                                title={t('library.viewExport')}
                                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                <LayoutList size={18} />
                                <span>{t('library.viewExport', "Liste / Export")}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {allCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                if (selectedCats.includes(cat)) setSelectedCats(selectedCats.filter(c => c !== cat));
                                else setSelectedCats([...selectedCats, cat]);
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '15px',
                                border: '1px solid #ccc',
                                backgroundColor: selectedCats.includes(cat) ? 'var(--color-pink-darker)' : 'transparent',
                                fontSize: '0.8rem'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Batch Actions only in List Mode */}
                {viewMode === 'list' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {selectedIds.size === filteredCartels.length && filteredCartels.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                            {selectedIds.size === filteredCartels.length ? t('library.deselectAll') : t('library.selectAll')}
                        </button>

                        <button onClick={handleZip} disabled={selectedIds.size === 0 || generatingZip} className={selectedIds.size > 0 ? "active-action" : ""}>
                            <Download size={16} style={{ marginRight: '5px' }} />
                            {generatingZip ? t('library.generating') : `${t('library.generateZip')} (${selectedIds.size})`}
                        </button>

                        {selectedIds.size > 0 && isAdmin && (
                            <>
                                <button onClick={handleBulkDelete} style={{ color: 'red', borderColor: 'red' }}>
                                    <Trash2 size={16} style={{ marginRight: '5px' }} />
                                    {t('library.deleteList')} ({selectedIds.size})
                                </button>

                                <button onClick={handleBulkVisibility} style={{ color: 'blue', borderColor: 'blue' }}>
                                    <Eye size={16} style={{ marginRight: '5px' }} />
                                    {t('library.toggleVisibility', "Visibilité")}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* View Content */}
            {
                viewMode === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredCartels.map(cartel => (
                            <div key={cartel.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <div onClick={() => toggleSelection(cartel.id)} style={{ cursor: 'pointer', marginTop: '10px' }}>
                                    {selectedIds.has(cartel.id) ? <CheckSquare /> : <Square color="#ccc" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <CartelPreview data={cartel} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => navigate(`/app/create?edit=${cartel.id}`)} title={t('cartel.edit')}>
                                                <Edit size={20} />
                                            </button>
                                            <button onClick={() => { if (confirm(t('messages.deleteConfirm'))) deleteCartel(cartel.id); }} style={{ color: 'red' }} title={t('cartel.delete')}>
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {
                viewMode === 'timeline' && (
                    <TimelineMode cartels={filteredCartels} onDelete={deleteCartel} targetId={targetCartelId} isAdmin={isAdmin} />
                )
            }

            {
                viewMode === 'map' && (
                    <MapMode cartels={filteredCartels} onGoToTimeline={handleGoToTimeline} isAdmin={isAdmin} />
                )
            }

            {
                viewMode === 'heuristic' && (
                    <HeuristicMode cartels={filteredCartels} />
                )
            }
        </div >
    );
};

export default Library;
