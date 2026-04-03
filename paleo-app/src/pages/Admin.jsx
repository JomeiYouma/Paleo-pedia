import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Trash2, Globe, MapPin, Image as ImageIcon, Eye, EyeOff, Download, Square, CheckSquare, Search, ScanEye, X, Link, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generateZip } from '../utils/zipGenerator';
import CartelPreview from '../components/CartelPreview';
import { getYearForSort } from '../utils/helpers'; // Import helper

const Admin = () => {
    const { cartels, deleteCartel, deleteCartels, updateCartel, isAdmin, categories, addWorkshop, deleteWorkshop, workshops } = useApp();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    // State for Selection & Filters & Sorting
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' }); // Default sort
    const [generatingZip, setGeneratingZip] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // ... (rest of state) ...
    const [showWorkshopModal, setShowWorkshopModal] = useState(false);
    const [newWorkshopName, setNewWorkshopName] = useState('');
    const [isImmersive, setIsImmersive] = useState(false);
    const [previewCartel, setPreviewCartel] = useState(null);

    // ... (params) ...
    const { workshopId } = useParams();
    const activeWorkshop = workshopId ? workshops.find(w => String(w.id) === String(workshopId)) : null;

    // ... (uniqueLocations logic) ...
    const uniqueLocations = useMemo(() => {
        if (!isAdmin) return [];
        const source = activeWorkshop
            ? cartels.filter(c => activeWorkshop.cartelIds?.includes(String(c.id)) || activeWorkshop.cartelIds?.includes(Number(c.id)))
            : cartels;
        const locs = new Set(source.map(c => c.location).filter(Boolean));
        return Array.from(locs).sort();
    }, [cartels, isAdmin, activeWorkshop]);

    const filteredCartels = useMemo(() => {
        if (!isAdmin) return [];

        let data = cartels;

        // Workshop Filter
        if (activeWorkshop) {
            data = data.filter(c => activeWorkshop.cartelIds?.includes(String(c.id)) || activeWorkshop.cartelIds?.includes(Number(c.id)));
        }

        // Apply Filters
        data = data.filter(c => {
            const matchesSearch = searchTerm === '' ||
                (c.titre && c.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.titre_en && c.titre_en.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCat = filterCategory === '' ||
                (c.categories && c.categories.includes(filterCategory)) ||
                (c.categories_en && c.categories_en.includes(filterCategory));

            const matchesLoc = filterLocation === '' || c.location === filterLocation;

            return matchesSearch && matchesCat && matchesLoc;
        });

        // Apply Sorting
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aVal, bVal;

                if (sortConfig.key === 'date') {
                    aVal = getYearForSort(a);
                    bVal = getYearForSort(b);
                } else if (sortConfig.key === 'titre') {
                    aVal = (a.titre || '').toLowerCase();
                    bVal = (b.titre || '').toLowerCase();
                } else if (sortConfig.key === 'location') {
                    aVal = (a.location || '').toLowerCase();
                    bVal = (b.location || '').toLowerCase();
                } else if (sortConfig.key === 'origin') {
                    aVal = (a.origin || '').toLowerCase();
                    bVal = (b.origin || '').toLowerCase();
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [cartels, searchTerm, filterCategory, filterLocation, isAdmin, activeWorkshop, sortConfig]);

    // ... (rest of effects and handlers) ...

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} color="#ccc" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} color="black" /> : <ArrowDown size={14} color="black" />;
    };


    // Handlers
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

    const handleVisibility = async (cartel) => {
        const currentVisibility = cartel.visible !== false;
        await updateCartel({ ...cartel, visible: !currentVisibility });
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('messages.confirmDelete'))) {
            await deleteCartel(id, false);
            if (selectedIds.has(id)) {
                const newSet = new Set(selectedIds);
                newSet.delete(id);
                setSelectedIds(newSet);
            }
        }
    };

    const handleBulkExport = async (format = 'zip') => {
        if (selectedIds.size === 0) return;
        setGeneratingZip(true);
        setProgress({ current: 0, total: selectedIds.size });
        try {
            const selectedItems = cartels.filter(c => selectedIds.has(c.id));
            const lang = i18n.language || 'fr';

            const onProg = (curr, total) => {
                setProgress({ current: curr, total });
            };

            if (format === 'pdf') {
                const { generatePdf } = await import('../utils/zipGenerator');
                await generatePdf(selectedItems, lang, onProg);
            } else {
                await generateZip(selectedItems, lang, onProg);
            }

            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.error(e);
            alert("Erreur export: " + e.message);
        } finally {
            setGeneratingZip(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Voulez-vous vraiment supprimer ces ${selectedIds.size} cartels ?`)) {
            await deleteCartels(Array.from(selectedIds), false);
            setSelectedIds(new Set());
        }
    };

    const handleBulkPublish = async () => {
        if (selectedIds.size === 0) return;
        const confirmMsg = `Voulez-vous rendre ces ${selectedIds.size} cartels visibles sur la frise générale ?`;
        if (confirm(confirmMsg)) {
            let count = 0;
            for (const id of selectedIds) {
                const c = cartels.find(x => x.id === id);
                if (c && c.visible === false) {
                    await updateCartel({ ...c, visible: true });
                    count++;
                }
            }
            alert(`${count} cartels publiés sur la frise générale !`);
            setSelectedIds(new Set());
        }
    };

    const handleBulkUndisclose = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Voulez-vous masquer ces ${selectedIds.size} cartels de la frise générale ?`)) {
            let count = 0;
            for (const id of selectedIds) {
                const c = cartels.find(x => x.id === id);
                if (c && c.visible !== false) {
                    await updateCartel({ ...c, visible: false });
                    count++;
                }
            }
            alert(`${count} cartels masqués.`);
            setSelectedIds(new Set());
        }
    };

    const handleCreateWorkshop = async () => {
        if (!newWorkshopName) return alert("Nom de l'atelier requis");
        const id = await addWorkshop(newWorkshopName, Array.from(selectedIds), { immersive: isImmersive });
        if (id) {
            setShowWorkshopModal(false);
            setNewWorkshopName('');
            setIsImmersive(false);
            if (confirm(`Atelier "${newWorkshopName}" créé ! Voulez-vous y aller maintenant ?`)) {
                navigate(`/app/admin/workshop/${id}`);
            }
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '100px', maxWidth: '1400px' }}>

            {/* Loading / Export Overlay */}
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
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #eee', borderTop: '5px solid var(--color-pink-darker)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

                    <h3 style={{ marginTop: '20px' }}>Génération de l'export...</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0' }}>
                        {progress.current} / {progress.total}
                    </div>
                    <div style={{ width: '300px', height: '10px', backgroundColor: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                            width: progress.total ? `${(progress.current / progress.total) * 100}%` : '0%',
                            height: '100%',
                            backgroundColor: 'var(--color-pink-darker)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Header / Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    {activeWorkshop ? (
                        <>
                            <button onClick={() => navigate('/app/admin')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2em' }}>⬅️</button>
                            <span>Atelier : {activeWorkshop.name}</span>
                        </>
                    ) : (
                        "🛠️ Gestion Globale"
                    )}
                </h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Public View Link */}
                    {activeWorkshop && (
                        <a
                            href={`#/app/workshop/${activeWorkshop.id}`}
                            target="_blank"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: 'blue', border: '1px solid blue', padding: '5px 10px', borderRadius: '5px' }}
                        >
                            <Globe size={16} /> Voir Version Publique
                        </a>
                    )}

                    {!activeWorkshop && (
                        <button
                            onClick={() => setShowWorkshopModal(true)}
                            disabled={selectedIds.size === 0}
                            style={{
                                background: selectedIds.size > 0 ? '#4CAF50' : '#ccc',
                                color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            }}
                        >
                            + Créer Atelier ({selectedIds.size})
                        </button>
                    )}

                    <button
                        onClick={handleBulkPublish}
                        disabled={selectedIds.size === 0}
                        style={{
                            background: selectedIds.size > 0 ? 'green' : '#ccc',
                            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                        title="Rendre visible sur la frise générale"
                    >
                        <Eye size={18} /> Publier ({selectedIds.size})
                    </button>
                    <button
                        onClick={handleBulkUndisclose}
                        disabled={selectedIds.size === 0}
                        style={{
                            background: selectedIds.size > 0 ? 'orange' : '#ccc',
                            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                        title="Masquer de la frise générale"
                    >
                        <EyeOff size={18} /> Masquer ({selectedIds.size})
                    </button>

                    <button
                        onClick={() => handleBulkExport('zip')}
                        disabled={selectedIds.size === 0 || generatingZip}
                        style={{
                            background: selectedIds.size > 0 ? 'var(--color-pink-darker)' : '#ccc',
                            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                    >
                        <Download size={18} /> {generatingZip ? '...' : 'ZIP'}
                    </button>
                    <button
                        onClick={() => handleBulkExport('pdf')}
                        disabled={selectedIds.size === 0 || generatingZip}
                        style={{
                            background: selectedIds.size > 0 ? '#BF2431' : '#ccc', // Darker Red for PDF
                            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                    >
                        <Download size={18} /> {generatingZip ? '...' : 'PDF'}
                    </button>

                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0}
                        style={{
                            background: selectedIds.size > 0 ? 'red' : '#ccc',
                            color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px',
                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                    >
                        <Trash2 size={18} /> Supprimer ({selectedIds.size})
                    </button>

                    <button
                        onClick={() => navigate(activeWorkshop ? `/app/create?workshopId=${activeWorkshop.id}` : '/app/create')}
                        style={{ background: 'black', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        + {t('nav.create')}
                    </button>
                </div>
            </div>

            {/* Workshop List (Global Dashboard Only) */}
            {!activeWorkshop && workshops.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '10px', background: '#eef', borderRadius: '8px' }}>
                    <h4>Ateliers Actifs :</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {workshops.map(w => {
                            const publicLink = `${window.location.origin}${window.location.pathname}#/workshop/${w.id}`;
                            return (
                                <div key={w.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    background: 'white', padding: '5px 10px', borderRadius: '15px', border: '1px solid blue'
                                }}>
                                    {/* Link to ADMIN management for this workshop */}
                                    <span
                                        onClick={() => navigate(`/app/admin/workshop/${w.id}`)}
                                        style={{ cursor: 'pointer', fontWeight: 'bold', color: 'darkblue', textDecoration: 'underline' }}
                                    >
                                        {w.name} ({w.cartelIds?.length || 0})
                                    </span>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(publicLink);
                                            alert("Lien public copié !");
                                        }}
                                        title="Copier le lien public"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                                    >
                                        <Link size={14} />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Supprimer l'atelier "${w.name}" ? (Les cartels créés resteront mais ne seront plus liés)`)) {
                                                await deleteWorkshop(w.id);
                                            }
                                        }}
                                        title="Supprimer l'atelier"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewCartel && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', pading: '20px'
                }} onClick={() => setPreviewCartel(null)}>
                    <div style={{
                        background: 'white', padding: '20px', borderRadius: '8px',
                        maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '600px'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewCartel(null)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h3 style={{ marginTop: 0 }}>Aperçu</h3>
                        <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
                            <CartelPreview data={previewCartel} />
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setPreviewCartel(null); navigate(`/app/create?edit=${previewCartel.id}`); }}
                                style={{ background: 'blue', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                                <Edit size={16} style={{ marginRight: '5px', verticalAlign: 'text-bottom' }} /> Editer
                            </button>
                            <button onClick={() => setPreviewCartel(null)} style={{ padding: '10px 15px' }}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Workshop Creation */}
            {showWorkshopModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px' }}>
                        <h3>Créer un Atelier</h3>
                        <p>Créer un atelier avec les <b>{selectedIds.size}</b> cartels sélectionnés.</p>
                        <input
                            type="text"
                            placeholder="Nom de l'atelier (ex: Atelier Solaire)"
                            value={newWorkshopName}
                            onChange={(e) => setNewWorkshopName(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        />
                        <div style={{ paddingBottom: '15px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={isImmersive}
                                    onChange={(e) => setIsImmersive(e.target.checked)}
                                />
                                <span title="Masque le bandeau 'Mode Atelier' et le bouton 'Quitter' pour une immersion totale">
                                    Mode Immersif (Masquer bandeau & Quitter)
                                </span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowWorkshopModal(false)}>Annuler</button>
                            <button onClick={handleCreateWorkshop} style={{ background: 'blue', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}>Créer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar Filters */}
            <div style={{
                background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px',
                display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', color: '#888' }} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 40px 8px 32px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
                    />
                    {filteredCartels.length > 0 && (
                        <span style={{
                            position: 'absolute',
                            right: '10px',
                            background: '#eee',
                            color: '#555',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            pointerEvents: 'none'
                        }}>
                            {filteredCartels.length}
                        </span>
                    )}
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Toutes Catégories</option>
                    {categories.map(c => <option key={c.id || c} value={c.name || c}>{c.name || c}</option>)}
                </select>

                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Toutes Localisations</option>
                    {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <button onClick={selectAll} style={{ background: 'none', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {selectedIds.size > 0 && selectedIds.size === filteredCartels.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    {selectedIds.size === filteredCartels.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                    <thead style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', width: '40px' }}></th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '60px' }}>Img</th>

                            <th onClick={() => handleSort('date')} style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Date {getSortIcon('date')}
                                </div>
                            </th>

                            <th onClick={() => handleSort('titre')} style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Titre (FR / EN) {getSortIcon('titre')}
                                </div>
                            </th>

                            <th style={{ padding: '12px', textAlign: 'left' }}>Catégories</th>

                            <th onClick={() => handleSort('location')} style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    Localisation {getSortIcon('location')}
                                </div>
                            </th>

                            <th onClick={() => handleSort('origin')} style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                    Origine {getSortIcon('origin')}
                                </div>
                            </th>

                            <th style={{ padding: '12px', textAlign: 'center' }}>Visible</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCartels.map(cartel => {
                            const hasEn = !!cartel.titre_en;
                            const hasFr = !!cartel.titre;
                            const isVisible = cartel.visible !== false; // Default true

                            return (
                                <tr key={cartel.id} style={{ borderBottom: '1px solid #eee', background: isVisible ? 'white' : '#fcfcfc', opacity: isVisible ? 1 : 0.7 }}>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <div onClick={() => toggleSelection(cartel.id)} style={{ cursor: 'pointer' }}>
                                            {selectedIds.has(cartel.id) ? <CheckSquare size={18} color="blue" /> : <Square size={18} color="#ccc" />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {cartel.image_path || cartel.imageUrl ? (
                                            <img
                                                src={cartel.image_path || cartel.imageUrl}
                                                alt=""
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                        {cartel.annee || '-'}
                                    </td>

                                    <td style={{ padding: '10px' }}>
                                        <div style={{ fontWeight: 'bold', color: hasFr ? 'black' : 'red' }}>
                                            {cartel.titre || "(Manquant)"}
                                        </div>
                                        <div style={{ color: hasEn ? '#666' : 'red', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Globe size={12} /> {cartel.titre_en || "(Missing EN Translation)"}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(cartel.categories || []).map(c => (
                                                <span key={c} style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em' }}>{c}</span>
                                            ))}
                                            {(cartel.categories_en || []).length === 0 && (
                                                <span style={{ color: 'red', fontSize: '10px' }}>⚠️ EN Cats?</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px', color: '#555' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={12} /> {cartel.location}
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8em', color: '#666' }}>
                                        {cartel.origin ? (
                                            <span style={{ background: '#e0f7fa', padding: '2px 6px', borderRadius: '4px', color: '#006064' }}>
                                                {cartel.origin}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleVisibility(cartel)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: isVisible ? 'green' : '#ccc' }}
                                            title={isVisible ? 'Visible (Click to Hide)' : 'Hidden (Click to Show)'}
                                        >
                                            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setPreviewCartel(cartel)}
                                                title="Aperçu Rapide"
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555' }}
                                            >
                                                <ScanEye size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/app/create?edit=${cartel.id}`)}
                                                title={t('drafts.edit')}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'blue' }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cartel.id)}
                                                title={t('drafts.delete')}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {cartels.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        Aucun cartel dans la bibliothèque.
                    </div>
                )}
            </div>
        </div >
    );
};

export default Admin;
