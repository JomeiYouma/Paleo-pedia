import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import TimelineMode from '../components/TimelineMode';
import MapMode from '../components/MapMode';
import ArborescenceMode from '../components/ArborescenceMode';
import ConfirmModal from '../components/ConfirmModal';
import LongOperationOverlay from '../components/LongOperationOverlay';
import { getYearForSort } from '../utils/helpers';
import { Download, Trash2, CheckSquare, Square, Edit, LayoutList, CalendarDays, Map as MapIcon, Search, GitGraph } from 'lucide-react';
import { generateZip } from '../utils/zipGenerator';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { rememberReturn } from '../utils/navigation';
import './Library.css';

/** Badge de statut pour les cartels hors "published" (visible admin only) */
const StatusBadge = ({ status, t }) => {
    const styles = {
        draft:          { background: '#f0f4ff', color: '#3b5bdb' },
        pending_review: { background: '#fff4e0', color: '#e67e00' },
        archived:       { background: '#f8f8f8', color: '#888' },
    };
    const s = styles[status];
    if (!s) return null;
    const label = t(`status.${status}`);
    return (
        <span style={{
            display: 'inline-block', fontSize: '0.72rem', fontWeight: '600',
            padding: '2px 8px', borderRadius: '20px',
            background: s.background, color: s.color,
            marginLeft: '8px', verticalAlign: 'middle',
        }}>
            {label}
        </span>
    );
};

// Mapping mode interne ↔ suffixe d'URL public.
// Le mode 'list' reste admin-only sans URL (toggle interne uniquement).
const MODE_SUFFIX = { timeline: 'frise', map: 'carte', arborescence: 'arborescence' };
const SUFFIX_MODE = Object.fromEntries(Object.entries(MODE_SUFFIX).map(([k, v]) => [v, k]));

// Pour une route donnée, calcule l'URL d'un autre mode en conservant le préfixe
// (`/app`, `/site/<slug>`, ou racine `''` sur subsite host). Cas spécial : sur
// le site principal, /app sert directement la frise (pas de /app/frise).
function urlForMode(pathname, mode) {
    const base = pathname.replace(/\/(frise|carte|arborescence)\/?$/, '');
    if (base === '/app' && mode === 'timeline') return '/app';
    return `${base}/${MODE_SUFFIX[mode]}`;
}

const Library = ({ fixedCategory = null, fixedSubsiteId = null, viewMode: viewModeProp = 'timeline' }) => {
    const { t, i18n } = useTranslation();
    // Source unique : tous les cartels depuis l'API (l'API filtre selon le rôle)
    const { cartels, loading, deleteCartel, deleteCartels, isAdmin, currentWorkshop } = useApp();

    const [selectedIds, setSelectedIds]     = useState(new Set());
    const [searchQuery, setSearchQuery]     = useState('');
    // 'list' est admin-only sans URL ; les autres modes viennent de la prop.
    const [adminListMode, setAdminListMode] = useState(false);
    const viewMode = adminListMode ? 'list' : viewModeProp;
    const [selectedCats, setSelectedCats]   = useState([]);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [progress, setProgress]           = useState({ current: 0, total: 0 });
    const [targetCartelId, setTargetCartelId] = useState(null);
    const [confirmState, setConfirmState]   = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Sortir du mode admin "Liste" dès que l'URL change de mode public (navigation
    // utilisateur via les boutons Frise/Carte/Arborescence).
    useEffect(() => { setAdminListMode(false); }, [viewModeProp]);

    // Pré-filtrer par catégorie si ?category= est dans l'URL (seulement sans fixedCategory)
    const urlCategoryFilter = !fixedCategory ? searchParams.get('category') : null;
    useEffect(() => {
        if (urlCategoryFilter) setSelectedCats([decodeURIComponent(urlCategoryFilter)]);
    }, [urlCategoryFilter]);

    const pageTitle = fixedCategory || (urlCategoryFilter ? decodeURIComponent(urlCategoryFilter) : null);
    const clearCategoryFilter = () => { if (!fixedCategory) { setSelectedCats([]); setSearchParams({}); } };
    const handleGoToTimeline = (id) => {
        if (viewMode === 'timeline') {
            setTargetCartelId(id);
        } else {
            // Library remount à la navigation → on passe l'id via le hash
            // (#cartel-<id>) que hashRestoredRef ré-applique au mount.
            navigate(`${urlForMode(location.pathname, 'timeline')}#cartel-${id}`);
        }
    };
    const goToMode = (mode) => {
        setAdminListMode(false);
        navigate(urlForMode(location.pathname, mode));
    };

    // Dataset de base : cartels visibles selon le rôle, PRÉ-filtrés par la catégorie fixe du sous-site
    const baseCartels = useMemo(() => {
        let data = Array.isArray(cartels) ? [...cartels] : [];

        // Mode Atelier
        if (currentWorkshop) {
            const allowedIds = new Set((currentWorkshop.cartelIds || []).map(String));
            data = data.filter(c => allowedIds.has(String(c.id)));
        } else if (!isAdmin) {
            data = data.filter(c => c.status === 'published' && c.visible);
        }

        // Si un sous-site impose une catégorie ou son subsite_id : on filtre en dur ici.
        // Règle : sur un sous-site on montre ses cartels scopés (subsite_id) ET les cartels
        // legacy du site principal (subsite_id NULL) partageant la catégorie.
        if (fixedSubsiteId || fixedCategory) {
            data = data.filter(c => {
                const matchesSubsite = fixedSubsiteId && c.subsite_id === fixedSubsiteId;
                const matchesCategory = fixedCategory && (c.categories || []).some(
                    cat => cat.toLowerCase() === fixedCategory.toLowerCase()
                );
                if (fixedSubsiteId && matchesSubsite) return true;
                if (fixedCategory && matchesCategory && (!c.subsite_id || c.subsite_id === fixedSubsiteId)) return true;
                return false;
            });
        }

        return data;
    }, [cartels, currentWorkshop, isAdmin, fixedCategory, fixedSubsiteId]);

    // Catégories disponibles dans le dataset de base (sous-ensemble cohérent)
    const allCategories = useMemo(() => {
        const set = new Set();
        const isEn = i18n.language === 'en';

        // Récupérer le nom EN de la catégorie fixe (pour l'exclure des chips secondaires en mode EN)
        // fixedCategory est toujours le nom FR
        let fixedCategoryEn = null;
        if (fixedCategory && isEn && baseCartels.length > 0) {
            for (const c of baseCartels) {
                const obj = (c.category_objects || []).find(
                    o => o.name?.toLowerCase() === fixedCategory.toLowerCase()
                );
                if (obj) { fixedCategoryEn = (obj.name_en || obj.name).toLowerCase(); break; }
            }
        }

        baseCartels.forEach(c => {
            const cats = isEn ? (c.categories_en || []) : (c.categories || []);
            cats.forEach(cat => {
                // Exclure la catégorie fixe (comparaison FR en mode FR, EN en mode EN)
                const excluded = fixedCategory && (
                    isEn
                        ? (fixedCategoryEn ? cat.toLowerCase() === fixedCategoryEn : false)
                        : cat.toLowerCase() === fixedCategory.toLowerCase()
                );
                if (!excluded) set.add(cat);
            });
        });
        return Array.from(set).sort();
    }, [baseCartels, i18n.language, fixedCategory]);

    // Construction de la liste filtrée (sur le dataset de base déjà contraint)
    const filteredCartels = useMemo(() => {
        let data = [...baseCartels];

        // Filtre catégories additionnelles (hors catégorie fixe)
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
    }, [baseCartels, selectedCats, searchQuery, i18n.language]);

    // Retour d'édition : location.hash = '#cartel-<id>' (posé par rememberReturn).
    // On restaure la sélection du Frise/TimelineMode dès que filteredCartels
    // contient la cible. La ref empêche que les changements de filtres
    // ultérieurs ne re-déclenchent le scroll sur un hash obsolète.
    const hashRestoredRef = React.useRef(null);
    useEffect(() => {
        const h = location.hash || '';
        if (!h.startsWith('#cartel-')) return;
        if (hashRestoredRef.current === h) return;
        const id = h.slice('#cartel-'.length);
        const found = filteredCartels.find(c => String(c.id) === String(id));
        if (!found) return;
        setTargetCartelId(found.id);
        // Sur un retour d'édition vers /carte ou /arborescence on rebascule sur
        // la frise (seuls timeline et map savent scroller jusqu'à un cartel).
        if (viewMode !== 'timeline' && viewMode !== 'map') {
            navigate(urlForMode(location.pathname, 'timeline'));
        }
        hashRestoredRef.current = h;
    }, [location.hash, location.pathname, filteredCartels, viewMode, navigate]);

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
        if (!selectedIds.size) return;
        setConfirmState({
            message: t('messages.bulkDeleteConfirm', `Supprimer les ${selectedIds.size} cartels sélectionnés ?`),
            onConfirm: async () => {
                await deleteCartels(Array.from(selectedIds));
                setSelectedIds(new Set());
                setConfirmState(null);
            },
        });
    };

    if (loading && !cartels.length) return <div className="container">{t('library.loading')}</div>;

    return (
        <div style={{ padding: '0 20px' }}>

            {/* Progress overlay export ZIP */}
            <LongOperationOverlay
                visible={generatingZip}
                label={t('library.generating')}
                current={progress.current}
                total={progress.total}
            />

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

                    {/* Modes de vue — chaque mode public a son URL dédiée
                        (cf. urlForMode). Le mode admin "Liste" reste un toggle
                        local sans URL. */}
                    <div className="view-mode-container">
                        <button onClick={() => goToMode('timeline')} className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}>
                            <CalendarDays size={18} /><span>{t('library.viewFrise', 'Frise')}</span>
                        </button>
                        <button onClick={() => goToMode('map')} className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}>
                            <MapIcon size={18} /><span>{t('library.viewMap', 'Carte')}</span>
                        </button>
                        <button onClick={() => goToMode('arborescence')} className={`view-mode-btn ${viewMode === 'arborescence' ? 'active' : ''}`}>
                            <GitGraph size={18} /><span>{t('library.viewArborescence', 'Arborescence')}</span>
                        </button>
                        {isAdmin && (
                            <button onClick={() => setAdminListMode(true)} className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}>
                                <LayoutList size={18} /><span>{t('library.viewList', 'Liste')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtres catégories */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
                    {/* Chip catégorie fixe du sous-site (non supprimable) */}
                    {fixedCategory && (
                        <span style={{
                            padding: '4px 12px', borderRadius: '20px',
                            background: 'var(--subsite-color, var(--color-pink-darker))',
                            color: 'white',
                            fontSize: '0.82rem', fontWeight: '700',
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            boxShadow: '0 2px 8px color-mix(in srgb, var(--subsite-color, #C2185B) 40%, transparent)',
                        }}>
                            {fixedCategory}
                        </span>
                    )}

                    {/* Séparateur si catégorie fixe + catégories secondaires */}
                    {fixedCategory && allCategories.length > 0 && (
                        <span style={{ color: '#ddd', fontSize: '0.8rem' }}>·</span>
                    )}

                    {/* Chips catégories secondaires (filtrables) */}
                    {allCategories.map(cat => {
                        const isActive = selectedCats.includes(cat);
                        const activeColor = fixedCategory
                            ? 'var(--subsite-color, var(--color-pink-darker))'
                            : 'var(--color-pink-darker)';
                        return (
                            <button
                                key={cat}
                                onClick={() => isActive
                                    ? setSelectedCats(selectedCats.filter(c => c !== cat))
                                    : setSelectedCats([...selectedCats, cat])}
                                style={{
                                    padding: '4px 12px', borderRadius: '20px',
                                    border: `1px solid ${isActive ? activeColor : '#ddd'}`,
                                    background: isActive ? activeColor : 'transparent',
                                    color: isActive ? 'white' : '#555',
                                    fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s'
                                }}
                            >{cat}</button>
                        );
                    })}
                </div>

                {/* Actions batch (mode liste admin) */}
                {viewMode === 'list' && isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
                        <button onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem', padding: '6px 10px' }}>
                            {selectedIds.size === filteredCartels.length && filteredCartels.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                            {selectedIds.size === filteredCartels.length && filteredCartels.length > 0
                                ? t('library.deselectAll', 'Tout désélectionner')
                                : t('library.selectAll', 'Tout sélectionner')}
                        </button>
                        <button onClick={handleZip} disabled={!selectedIds.size || generatingZip} style={{ fontSize: '0.88rem', padding: '6px 10px' }}>
                            <Download size={14} style={{ marginRight: 4 }} />
                            ZIP ({selectedIds.size})
                        </button>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkDelete} style={{ color: 'red', borderColor: 'red', fontSize: '0.88rem', padding: '6px 10px' }}>
                                <Trash2 size={14} style={{ marginRight: 4 }} />
                                {t('library.deleteCount', { count: selectedIds.size, defaultValue: `Supprimer (${selectedIds.size})` })}
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
                                        <StatusBadge status={cartel.status} t={t} />
                                    </div>
                                )}
                                <CartelPreview data={cartel} />
                            </div>
                            {isAdmin && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                    <button onClick={() => {
                                            const returnTo = rememberReturn(location, { scrollId: cartel.id });
                                            navigate(`/app/create?edit=${cartel.id}`, { state: { returnTo } });
                                        }} title="Éditer" style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => setConfirmState({
                                            message: t('messages.deleteConfirm', 'Supprimer ce cartel ?'),
                                            onConfirm: () => { deleteCartel(cartel.id); setConfirmState(null); },
                                        })}
                                        style={{ color: 'red', padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredCartels.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>{t('library.empty')}</p>
                    )}
                </div>
            )}

            {viewMode === 'timeline' && (
                <TimelineMode cartels={filteredCartels} onDelete={deleteCartel} targetId={targetCartelId} isAdmin={isAdmin} />
            )}
            {viewMode === 'map' && (
                <MapMode cartels={filteredCartels} onGoToTimeline={handleGoToTimeline} isAdmin={isAdmin} />
            )}
            {viewMode === 'arborescence' && (
                <ArborescenceMode cartels={filteredCartels} />
            )}

            {/* Modale de confirmation (remplace window.confirm) */}
            {confirmState && (
                <ConfirmModal
                    message={confirmState.message}
                    confirmLabel={t('action.delete', 'Supprimer')}
                    cancelLabel={t('action.cancel', 'Annuler')}
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </div>
    );
};

export default Library;
