import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
    Edit, Trash2, Check, X, Clock,
    Download, Square, CheckSquare, Search,
    ArrowUpDown, ArrowUp, ArrowDown,
    FileText, Inbox, Globe, Plus, ScanEye, MapPin, Image as ImageIcon,
    Languages, Upload, Package, FileJson, ImageIcon as ImgIcon, Columns, SlidersHorizontal, StickyNote,
    FolderPlus, AlertTriangle, Loader2, Archive, Monitor,
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { generateZip, generatePdf, generateArchive } from '../utils/zipGenerator';
import PrintPreview from '../components/PrintPreview';
import CartelPreview from '../components/CartelPreview';
import LongOperationOverlay from '../components/LongOperationOverlay';
import TranslateFriseModal from '../components/TranslateFriseModal';
import Toast from '../components/Toast';
import { getYearForSort } from '../utils/helpers';
import api from '../services/apiClient';
import ConfirmModal from '../components/ConfirmModal';
import ImageHealthModal from '../components/ImageHealthModal';
import ExplainerBox from '../components/ExplainerBox';
import { rememberReturn } from '../utils/navigation';
import { subsiteBasePath } from '../utils/subsiteHost';
import Breadcrumb from '../components/Breadcrumb';
import { DropdownButton, DropItem } from '../components/DropdownButton';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';

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
// Ordre d'affichage : Publiés en tête (le contenu visible publiquement, le plus
// consulté), puis les états de production (Brouillons, En attente), enfin
// Soumissions (file de modération superadmin).
const TABS = [
    { key: 'published', labelKey: 'nav.published', icon: Globe,    color: '#2e7d32', bg: '#e8f5e9', descriptionKey: 'manageCartels.publishedDescription',   filter: c => c.status === 'published' },
    { key: 'drafts',    labelKey: 'nav.drafts',    icon: FileText, color: '#3b5bdb', bg: '#f0f4ff', descriptionKey: 'manageCartels.draftsDescription',      filter: c => c.status === 'draft' },
    { key: 'pending',   labelKey: 'nav.pending',   icon: Inbox,    color: '#e67e00', bg: '#fff4e0', descriptionKey: 'manageCartels.pendingDescription',     filter: c => c.status === 'pending_review' },
    { key: 'archived',  labelKey: 'nav.archived',  icon: Archive,  color: '#6b7280', bg: '#f3f4f6', descriptionKey: 'manageCartels.archivedDescription',    filter: c => c.status === 'archived' },
    { key: 'submissions', labelKey: 'nav.submissions', icon: Inbox, color: '#C2185B', bg: '#fce4ec', descriptionKey: 'manageCartels.submissionsDescription', filter: c => !!c.submitted_to_main_at && !c.visible_on_main && !!c.subsite_id, superadminOnly: true },
];

// ── Modal Import ZIP ─────────────────────────────────────────
const ImportModal = ({ onClose, onDone, t }) => {
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

                <h3 style={{ margin:'0 0 8px', fontSize:'1.1rem', fontWeight:'800' }}>{t('manageCartels.importZip')}</h3>
                <p style={{ color:'#888', fontSize:'0.85rem', margin:'0 0 20px', lineHeight:'1.4' }}>
                    {t('manageCartels.importHelp1')} <code>cartels.json</code> {t('manageCartels.importHelp2')}<br/>
                    {t('manageCartels.importHelp3')} <code>images/</code>.<br/>
                    {t('manageCartels.importHelp4')} <strong>{t('status.draft')}</strong>.
                </p>

                {!result ? (
                    <>
                        <label style={{ display:'block', border:'2px dashed #ddd', borderRadius:'10px', padding:'24px', textAlign:'center', cursor:'pointer', background:file ? '#f0fff4' : '#fafafa' }}>
                            <input type="file" accept=".zip" style={{ display:'none' }} onChange={e => setFile(e.target.files[0] ?? null)} />
                            <Upload size={28} color={file ? '#2e7d32' : '#aaa'} style={{ marginBottom:'8px' }} />
                            <div style={{ fontSize:'0.9rem', fontWeight:'600', color: file ? '#2e7d32' : '#555' }}>
                                {file ? file.name : t('manageCartels.chooseZip')}
                            </div>
                            {file && <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'4px' }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</div>}
                        </label>
                        {error && <p style={{ color:'#d32f2f', fontSize:'0.85rem', marginTop:'12px' }}>{error}</p>}
                        <div style={{ display:'flex', gap:'10px', marginTop:'20px', justifyContent:'flex-end' }}>
                            <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', fontFamily:'inherit' }}>{t('common.back')}</button>
                            <button onClick={handleImport} disabled={!file || busy} style={{ padding:'10px 18px', borderRadius:'8px', border:'none', background: file ? '#1a1a1a' : '#ccc', color:'white', cursor: file ? 'pointer' : 'not-allowed', fontWeight:'700', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
                                {busy ? t('manageCartels.importing') : <><Upload size={14} /> {t('manageCartels.import')}</>}
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <div style={{ background:'#e8f5e9', borderRadius:'10px', padding:'16px', marginBottom:'16px' }}>
                            <div style={{ fontWeight:'800', color:'#2e7d32', fontSize:'1.1rem', marginBottom:'4px' }}>{t('messages.publishSuccess')}</div>
                            <div style={{ fontSize:'0.9rem', color:'#555' }}>{t('manageCartels.importCreated', { count: result.created })}</div>
                        </div>
                        {result.errors?.length > 0 && (
                            <div style={{ background:'#fff3e0', borderRadius:'10px', padding:'12px', marginBottom:'16px', fontSize:'0.82rem' }}>
                                <strong>{result.errors.length} erreur(s) :</strong>
                                {result.errors.map((e, i) => <div key={i} style={{ color:'#e67e00', marginTop:'4px' }}>• {e.titre || `Ligne ${e.index+1}`} : {e.error}</div>)}
                            </div>
                        )}
                        <button onClick={onClose} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#1a1a1a', color:'white', cursor:'pointer', fontWeight:'700', fontFamily:'inherit' }}>{t('manageCartels.importClose')}</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Composant principal ──────────────────────────────────────
const ManageCartels = ({ lockedSubsiteSlug = null, lockedSubsiteCategory = null } = {}) => {
    const { cartels, fetchData, deleteCartel, deleteCartels, updateCartel, isAdmin, isSuperadmin, isOwner, homeSubsiteId, categories, workshops, addWorkshop, loading: appLoading, hasFetched } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const { workshopId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, i18n } = useTranslation();

    // Base path dépend du contexte : intégré dans un sous-site ou page admin globale.
    // subsiteBasePath() renvoie '' sur le host dédié (paleo-h2o.org) → URLs propres.
    const managePrefix = lockedSubsiteSlug ? `${subsiteBasePath(lockedSubsiteSlug)}/admin` : '/app/manage';
    const pathToTab = {
        [`${managePrefix}/drafts`]: 'drafts',
        [`${managePrefix}/pending`]: 'pending',
        [`${managePrefix}/published`]: 'published',
        [`${managePrefix}/archived`]: 'archived',
        [`${managePrefix}/submissions`]: 'submissions',
    };
    const tabToPath = {
        drafts: `${managePrefix}/drafts`,
        pending: `${managePrefix}/pending`,
        published: `${managePrefix}/published`,
        archived: `${managePrefix}/archived`,
        submissions: `${managePrefix}/submissions`,
    };

    // L'onglet submissions est réservé à la page admin principale (file de validation
    // globale du superadmin). Il n'a aucun sens dans un contexte sous-site verrouillé.
    const visibleTabs = TABS.filter(tab => {
        if (tab.key === 'submissions') return isSuperadmin && !lockedSubsiteSlug;
        if (tab.superadminOnly) return isSuperadmin;
        return true;
    });

    const activeTab = pathToTab[location.pathname] || 'published';
    const setActiveTab = (key) => navigate(tabToPath[key] || tabToPath.published);
    const goToCreate = (editId) => {
        const basePath = lockedSubsiteSlug ? `${subsiteBasePath(lockedSubsiteSlug)}/create` : '/app/create';
        // Si un seul atelier est filtré, on pré-remplit le formulaire. Avec plusieurs
        // ateliers cochés, on ne sait pas lequel choisir → pas de pré-remplissage.
        const singleWorkshopId = filterWorkshops.length === 1 ? filterWorkshops[0] : '';
        const workshopQuery = singleWorkshopId ? `?workshopId=${singleWorkshopId}` : '';
        const target = editId ? `${basePath}?edit=${editId}` : `${basePath}${workshopQuery}`;
        // scrollId = editId permet de re-scroller la liste jusqu'à la ligne éditée au retour.
        const returnTo = rememberReturn(location, { scrollId: editId || null });
        navigate(target, { state: { returnTo } });
    };

    const [search,         setSearch]         = useState('');
    // Filtres multi-valeurs. URL legacy ?cat=A → on accepte aussi ?cat=A,B
    // pour pouvoir partager une URL avec plusieurs catégories cochées.
    const parseCsvParam = (raw) => (raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : []);
    const [filterCategories,   setFilterCategories]   = useState(() => parseCsvParam(searchParams.get('cat')));
    const [filterCategoriesOp, setFilterCategoriesOp] = useState('OR');
    const [filterWorkshops,    setFilterWorkshops]    = useState(() => (workshopId ? [String(workshopId)] : parseCsvParam(searchParams.get('ws'))));
    const [filterWorkshopsOp,  setFilterWorkshopsOp]  = useState('OR');
    // Si intégré dans un sous-site, le filtre est verrouillé sur ce sous-site et
    // ignore le query param. Sinon on lit ?subsite= depuis l'URL.
    const filterSubsiteSlug = lockedSubsiteSlug || searchParams.get('subsite') || '';
    // Tri persisté dans l'URL (?sort=…&dir=…) pour survivre à un aller-retour vers Create.
    const [sortConfig, setSortConfig] = useState(() => ({
        key: searchParams.get('sort') || 'date',
        direction: searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
    }));
    // Sélection persistée en sessionStorage, restaurée au mount.
    const selectionStorageKey = `paleo:manage:selection:${lockedSubsiteSlug || 'main'}`;
    const [selectedIds, setSelectedIds] = useState(() => {
        try {
            const raw = sessionStorage.getItem(selectionStorageKey);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch { return new Set(); }
    });
    // Persistance continue : chaque changement est reflété dans sessionStorage.
    React.useEffect(() => {
        try { sessionStorage.setItem(selectionStorageKey, JSON.stringify(Array.from(selectedIds))); } catch { /* noop */ }
    }, [selectedIds, selectionStorageKey]);
    const [processingId,   setProcessingId]    = useState(null);
    const [previewCartel,  setPreviewCartel]   = useState(null);
    // Aperçu « version web » : rend CartelPreview (la carte telle qu'affichée
    // dans la bibliothèque publique), par opposition à previewCartel qui montre
    // le rendu imprimé A4 (PrintPreview).
    const [webPreviewCartel, setWebPreviewCartel] = useState(null);
    // Cartel cible de la mini-modal "Ajouter une note" (null = modal fermée).
    const [noteCartel,     setNoteCartel]      = useState(null);

    // ── Filtres complexes ────────────────────────────────────────
    // Quand actif, on ignore les filtres inline (categories/workshops) et on
    // applique une combinaison ET/OU de conditions, chaque condition étant
    // un type (catégorie ou atelier) + une liste de valeurs (OU entre elles).
    // Couvre les cas type « (cat A ou B) et (ws 1 ou 2) ».
    const [complexFilter, setComplexFilter] = useState({
        enabled: false,
        combinator: 'AND', // entre conditions
        conditions: [],
    });
    const [showComplexModal, setShowComplexModal] = useState(false);

    // Masquage de colonnes optionnelles (Catégories / Ateliers / Lieu). Persisté
    // en localStorage pour survivre aux rechargements. Les clés stockées
    // correspondent à la colonne masquée.
    const HIDDEN_COLS_KEY = 'paleo:manage:hiddenColumns';
    const [hiddenColumns, setHiddenColumns] = useState(() => {
        try {
            const raw = localStorage.getItem(HIDDEN_COLS_KEY);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch { return new Set(); }
    });
    const isColHidden = (key) => hiddenColumns.has(key);
    const toggleCol = (key) => {
        setHiddenColumns(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            try { localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify(Array.from(next))); } catch { /* noop */ }
            return next;
        });
    };
    const [busy,           setBusy]            = useState(false);
    const [busyLabel,      setBusyLabel]       = useState('Traitement…');
    const [progress,       setProgress]        = useState({ current: 0, total: 0 });
    const [showImport,     setShowImport]      = useState(false);
    const [showTranslateFrise, setShowTranslateFrise] = useState(false);
    const [toastError,     setToastError]      = useState('');
    const [translating,    setTranslating]     = useState(new Set()); // ids en cours de traduction
    const [confirmState,      setConfirmState]      = useState(null);
    const [showWorkshopModal, setShowWorkshopModal] = useState(false);
    const [newWorkshopName, setNewWorkshopName] = useState('');
    const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
    // ── Audit images (au chargement) ─────────────────────────
    const [imageIssues,         setImageIssues]         = useState([]);
    const [showImageHealthModal, setShowImageHealthModal] = useState(false);
    const [issueIdsFilter,      setIssueIdsFilter]      = useState(null); // Set<id> ou null

    React.useEffect(() => {
        let cancelled = false;
        api.io.imageCheck()
            .then(({ issues }) => {
                if (cancelled) return;
                if (issues && issues.length > 0) {
                    setImageIssues(issues);
                    setShowImageHealthModal(true);
                }
            })
            .catch(() => { /* silencieux : ne bloque pas la page */ });
        return () => { cancelled = true; };
    }, []);

    React.useEffect(() => {
        // Le filtre atelier vient du param de route (/workshop/:id) ou de l'URL
        // (?ws=A,B). Persisté dans l'URL → survit à l'édition d'un cartel + retour.
        setFilterWorkshops(workshopId ? [String(workshopId)] : parseCsvParam(searchParams.get('ws')));
    }, [workshopId, location.search]);

    // Sync filterCategories avec l'URL (?cat=A,B) pour survivre aux navigations.
    // Format CSV : compatible avec l'ancien ?cat=A (un seul nom = tableau de 1).
    const handleSetFilterCategories = (cats) => {
        setFilterCategories(cats);
        const next = new URLSearchParams(searchParams);
        if (cats.length) next.set('cat', cats.join(','));
        else next.delete('cat');
        setSearchParams(next, { replace: true });
    };

    // Idem pour les ateliers (?ws=A,B) — corrige la perte du filtre atelier au
    // retour d'édition d'un cartel (rememberReturn capture l'URL, donc le filtre).
    const handleSetFilterWorkshops = (ws) => {
        setFilterWorkshops(ws);
        const next = new URLSearchParams(searchParams);
        if (ws.length) next.set('ws', ws.join(','));
        else next.delete('ws');
        setSearchParams(next, { replace: true });
    };

    React.useEffect(() => {
        setFilterCategories(parseCsvParam(searchParams.get('cat')));
    }, [location.search]);

    const hashScrolledRef = useRef(null);

    const currentTabDef = TABS.find(t => t.key === activeTab) || TABS[0];
    const activeWorkshops = filterWorkshops
        .map(id => workshops.find(w => String(w.id) === String(id)))
        .filter(Boolean);

    // Pool de référence :
    //   - Hors verrouillage : tous les cartels (ou scopés à un ?subsite=).
    //   - Verrouillage sous-site : cartels scopés au sous-site + cartels du site
    //     principal (subsite_id NULL) qui s'affichent sur la frise via la catégorie
    //     du sous-site (consultation en lecture seule).
    const scopedCartels = useMemo(() => {
        if (!filterSubsiteSlug) return cartels;
        return cartels.filter(c => {
            if (c.subsite_slug === filterSubsiteSlug) return true;
            if (lockedSubsiteCategory && c.subsite_id === null) {
                const cat = lockedSubsiteCategory.toLowerCase();
                return (c.categories || []).some(x => (x || '').toLowerCase() === cat);
            }
            return false;
        });
    }, [cartels, filterSubsiteSlug, lockedSubsiteCategory]);

    // Détecte si un cartel est "du site principal" (affiché en consultation seulement)
    const isReadOnlyMainCartel = (c) => !!lockedSubsiteSlug && c.subsite_id === null;

    const counts = useMemo(() => {
        const obj = {};
        TABS.forEach(tab => { obj[tab.key] = scopedCartels.filter(tab.filter).length; });
        return obj;
    }, [scopedCartels]);

    const filteredCartels = useMemo(() => {
        // Mode "Voir les cartels problématiques" : on ignore le filtre d'onglet
        // pour rassembler tous les cartels cassés, quel que soit leur statut.
        let data = issueIdsFilter
            ? scopedCartels.filter(c => issueIdsFilter.has(c.id))
            : scopedCartels.filter(currentTabDef.filter);

        // Branche A : filtres complexes prennent le dessus si activés.
        // Chaque condition matche par sous-ensemble (OU entre ses valeurs).
        // Les conditions se combinent ensuite via combinator (ET ou OU).
        if (complexFilter.enabled && complexFilter.conditions.length) {
            const conds = complexFilter.conditions;
            const matchCond = (cartel, cond) => {
                if (!cond.values?.length) return true; // condition vide = passe
                if (cond.field === 'category') {
                    const cats = [...(cartel.categories || []), ...(cartel.categories_en || [])];
                    return cond.values.some(v => cats.includes(v));
                }
                if (cond.field === 'workshop') {
                    const ws = (cartel.workshopIds || []).map(String);
                    return cond.values.some(v => ws.includes(String(v)));
                }
                return true;
            };
            data = data.filter(c => complexFilter.combinator === 'OR'
                ? conds.some(cond => matchCond(c, cond))
                : conds.every(cond => matchCond(c, cond)));
        } else {
            // Branche B : filtres inline multi-valeurs (mode par défaut).
            if (filterWorkshops.length) {
                const wantedWs = filterWorkshops.map(String);
                data = data.filter(c => {
                    const ws = (c.workshopIds || []).map(String);
                    return filterWorkshopsOp === 'AND'
                        ? wantedWs.every(id => ws.includes(id))
                        : wantedWs.some(id => ws.includes(id));
                });
            }
            if (filterCategories.length) {
                data = data.filter(c => {
                    const cats = [...(c.categories || []), ...(c.categories_en || [])];
                    return filterCategoriesOp === 'AND'
                        ? filterCategories.every(v => cats.includes(v))
                        : filterCategories.some(v => cats.includes(v));
                });
            }
        }

        // Recherche texte : s'applique dans les deux branches.
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(c =>
                (c.titre || '').toLowerCase().includes(q) ||
                (c.titre_en || '').toLowerCase().includes(q) ||
                (c.location || '').toLowerCase().includes(q)
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
    }, [cartels, currentTabDef, search, filterCategories, filterCategoriesOp, filterWorkshops, filterWorkshopsOp, complexFilter, filterSubsiteSlug, sortConfig, issueIdsFilter, scopedCartels]);

    // ── Scroll vers la ligne éditée au retour : location.hash = '#cartel-<id>'
    // (posé par rememberReturn(location, { scrollId })). On déclenche quand
    // filteredCartels est prêt pour que la ligne existe dans le DOM.
    React.useEffect(() => {
        const h = location.hash || '';
        if (!h.startsWith('#cartel-')) return;
        if (hashScrolledRef.current === h) return;
        const id = h.slice('#cartel-'.length);
        const el = document.getElementById(`cartel-${id}`);
        if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            const prevBg = el.style.background;
            el.style.transition = 'background 0.6s ease';
            el.style.background = '#fff8d6';
            setTimeout(() => { el.style.background = prevBg; }, 1400);
            hashScrolledRef.current = h;
        }
    }, [location.hash, filteredCartels]);

    const subsiteScopedName = useMemo(() => {
        if (!filterSubsiteSlug) return null;
        const sample = cartels.find(c => c.subsite_slug === filterSubsiteSlug);
        return sample?.subsite_name || filterSubsiteSlug;
    }, [filterSubsiteSlug, cartels]);

    if (!isAdmin) {
        return <div style={{ textAlign:'center', padding:'80px 20px', color:'#aaa' }}><p>{t('manageCartels.adminOnly')}</p></div>;
    }

    // ── Actions unitaires ─────────────────────────────────────
    const askConfirm = (message, onConfirm, opts = {}) =>
        setConfirmState({ message, onConfirm, ...opts });

    const act = async (id, fn) => {
        setProcessingId(id);
        try { await fn(); await fetchData(); }
        catch (e) { alert(t('common.error', { msg: e.message })); }
        finally { setProcessingId(null); }
    };

    const handlePublish = (c) => askConfirm(
        t('manageCartels.confirmPublish', { title: c.titre }),
        () => act(c.id, () => api.cartels.publish(c.id)),
        { danger: false, confirmLabel: t('manageCartels.publish') }
    );
    const handleToDraft = (c) => askConfirm(
        t('manageCartels.confirmDraft', { title: c.titre }),
        () => act(c.id, () => api.cartels.setStatus(c.id, 'draft')),
        { danger: false, confirmLabel: t('manageCartels.draft') }
    );
    // Archiver : le cartel reste « publié » côté cycle de vie mais passe en
    // status='archived' → le serveur ne le renvoie plus aux visiteurs (getAll
    // filtre status='published' pour les non-admins). Réversible via republish.
    const handleArchive = (c) => askConfirm(
        t('manageCartels.confirmArchive', { title: c.titre }),
        () => act(c.id, () => api.cartels.archive(c.id)),
        { danger: false, confirmLabel: t('manageCartels.archive') }
    );
    // Désarchiver = republier : repasse en status='published' (re-visible).
    const handleUnarchive = (c) => askConfirm(
        t('manageCartels.confirmUnarchive', { title: c.titre }),
        () => act(c.id, () => api.cartels.publish(c.id)),
        { danger: false, confirmLabel: t('manageCartels.unarchive') }
    );
    const handleDelete = (id) => {
        // Le message s'adapte au statut du cartel : "brouillon" pour un draft,
        // un avertissement explicite pour un cartel publié (disparaît de la frise),
        // etc. Évite l'incohérence « Supprimer ce brouillon ? » sur un cartel publié.
        const c = cartels.find(x => x.id === id);
        const title = c?.titre || c?.titre_en || '';
        const message =
            c?.status === 'published' ? t('messages.confirmDeletePublished', { title })
          : c?.status === 'archived'  ? t('messages.confirmDeleteArchived',  { title })
          : c?.status === 'draft'     ? t('messages.confirmDelete')
          :                             t('messages.confirmDeleteGeneric',   { title });
        askConfirm(message, () => act(id, () => api.cartels.delete(id)));
    };

    const handleApproveSubmission = (c) => askConfirm(
        t('manageCartels.confirmApproveSubmission', { title: c.titre }),
        () => act(c.id, () => api.submissions.approve(c.id)),
        { danger: false, confirmLabel: t('manageCartels.approve') }
    );
    const handleRejectSubmission = (c) => askConfirm(
        t('manageCartels.confirmRejectSubmission', { title: c.titre }),
        () => act(c.id, () => api.submissions.reject(c.id)),
        { danger: true, confirmLabel: t('manageCartels.reject') }
    );

    // ── Workflow owner → submit/withdraw au site principal ────
    const canSubmitThisCartel = (c) => {
        if (!c.subsite_id || !c.subsite_slug) return false;
        if (c.status !== 'published') return false;
        if (isSuperadmin) return true;
        return isOwner && c.subsite_id === homeSubsiteId;
    };

    const handleSubmitToMain = (c) => askConfirm(
        t('manageCartels.confirmSubmitMain', { title: c.titre }),
        () => act(c.id, () => api.cartels.submitToMain(c.subsite_slug, c.id)),
        { danger: false, confirmLabel: t('manageCartels.submit') }
    );
    const handleWithdrawFromMain = (c) => askConfirm(
        t('manageCartels.confirmWithdrawMain', { title: c.titre }),
        () => act(c.id, () => api.cartels.withdrawFromMain(c.subsite_slug, c.id)),
        { danger: true, confirmLabel: t('manageCartels.withdraw') }
    );

    // ── Traduction unitaire ───────────────────────────────────
    const handleRetranslate = (cartel, target) => {
        const targetLabel   = target === 'fr' ? 'français' : 'anglais';
        const overwriteSide = target === 'fr' ? 'français' : 'anglais';
        const sourceFields  = target === 'fr'
            ? { titre: cartel.titre_en || '', description: cartel.description_en || '', location: cartel.location_en || '' }
            : { titre: cartel.titre    || '', description: cartel.description    || '', location: cartel.location    || '' };

        askConfirm(
            `Retraduire "${cartel.titre || cartel.titre_en || ''}" en ${targetLabel} via IA ? Les champs ${overwriteSide} existants seront écrasés.`,
            async () => {
                setTranslating(prev => new Set([...prev, cartel.id]));
                try {
                    const translated = await api.translate.cartel(sourceFields, { target });
                    await api.cartels.update(cartel.id, translated);
                    await fetchData();
                } catch (e) {
                    alert(t('errors.translationPrefix', { msg: e.message }));
                } finally {
                    setTranslating(prev => { const s = new Set(prev); s.delete(cartel.id); return s; });
                }
            },
            { danger: false, confirmLabel: 'Retraduire' }
        );
    };

    // ── Actions batch ─────────────────────────────────────────
    const withBusy = async (label, fn) => {
        setBusy(true); setBusyLabel(label); setProgress({ current:0, total:0 });
        try { await fn(); }
        finally { setBusy(false); }
    };

    // Retire de la sélection les cartels en lecture seule (cartels du site
    // principal affichés dans une vue owner verrouillée). Un owner ne peut pas
    // les modifier/supprimer ; on les exclut donc des actions groupées mutantes
    // (l'export, lui, reste inclusif). Hors vue verrouillée, isReadOnlyMainCartel
    // est toujours faux → aucun changement de comportement.
    const actionableSelectedIds = () =>
        Array.from(selectedIds).filter(id => {
            const c = cartels.find(x => x.id === id);
            return c && !isReadOnlyMainCartel(c);
        });
    const noEditableMsg = () => t(
        'manageCartels.noEditableInSelection',
        'Aucun cartel modifiable dans la sélection : les cartels du site principal sont en lecture seule.'
    );

    const handleBulkDelete = () => {
        if (!selectedIds.size) return;
        const ids = actionableSelectedIds();
        if (!ids.length) { alert(noEditableMsg()); return; }
        askConfirm(
            t('manageCartels.confirmBulkDelete', { count: ids.length }),
            () => withBusy(t('manageCartels.busyDeleting'), async () => {
                for (const id of ids) await api.cartels.delete(id);
                await fetchData();
                setSelectedIds(new Set());
            })
        );
    };

    const handleBulkWorkshop = async () => {
        if (!selectedIds.size) return;
        if (!newWorkshopName.trim() && !selectedWorkshopId) {
            alert(t('manageCartels.chooseWorkshopWarning'));
            return;
        }
        const ids = actionableSelectedIds();
        if (!ids.length) { alert(noEditableMsg()); return; }

        await withBusy(t('manageCartels.busyAssigningWorkshop'), async () => {
            if (newWorkshopName.trim()) {
                await addWorkshop(newWorkshopName.trim(), ids);
            } else {
                await api.workshops.addCartels(selectedWorkshopId, ids);
                await fetchData();
            }
            setSelectedIds(new Set());
            setShowWorkshopModal(false);
            setNewWorkshopName('');
            setSelectedWorkshopId('');
        });
    };

    const handleBulkPublish = async () => {
        if (!selectedIds.size) return;
        const ids = actionableSelectedIds();
        if (!ids.length) { alert(noEditableMsg()); return; }
        await withBusy(t('manageCartels.busyPublishing'), async () => {
            for (const id of ids) {
                const c = cartels.find(x => x.id === id);
                if (c && c.status !== 'published') await api.cartels.publish(id);
            }
            await fetchData();
            setSelectedIds(new Set());
        });
    };

    const handleBulkTranslate = () => {
        if (!selectedIds.size) return;
        const ids = actionableSelectedIds();
        if (!ids.length) { alert(noEditableMsg()); return; }
        askConfirm(
            t('manageCartels.confirmBulkTranslate', { count: ids.length }),
            () => withBusy(t('manageCartels.busyTranslating'), async () => {
                let count = 0;
                for (const id of ids) {
                    count++;
                    setProgress({ current: count, total: ids.length });
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
            }),
            { danger: false, confirmLabel: 'Retraduire' }
        );
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

    /**
     * Frise traduite : on demande la langue cible via modal, on appelle l'API
     * bulk pour récupérer les traductions, puis on génère le PDF avec des
     * cartels-clones où les champs source sont remplacés par la traduction.
     * La langue source est l'i18n active (FR ou EN) — le PDF est généré
     * dans la même clé de langue, le contenu étant déjà traduit.
     */
    const handleTranslateFrise = async (targetLanguage) => {
        setShowTranslateFrise(false);
        if (!selectedIds.size) return;
        const sourceLang = i18n.language === 'en' ? 'en' : 'fr';
        const ids = Array.from(selectedIds);

        try {
            await withBusy(t('translateFrise.busyTranslating', { defaultValue: `Traduction vers ${targetLanguage}…` }), async () => {
                setProgress({ current: 0, total: ids.length });
                const { translations, labels, categoryMap } = await api.translate.bulk({ ids, sourceLang, targetLanguage });
                setProgress({ current: ids.length, total: ids.length });

                const byId = new Map(translations.map(tr => [String(tr.id), tr]));
                const items = cartels
                    .filter(c => selectedIds.has(c.id))
                    .map(c => {
                        const tr = byId.get(String(c.id));
                        if (!tr) return c;
                        // On remplace les champs de la langue source : generatePdf
                        // affichera ces champs traduits puisqu'on garde la même langue.
                        // `annee` est commun (pas de variante _en en BDD) : on l'écrase
                        // toujours par la version traduite par OpenAI.
                        return sourceLang === 'en'
                            ? { ...c, titre_en: tr.titre, description_en: tr.description, location_en: tr.location, annee: tr.annee || c.annee }
                            : { ...c, titre: tr.titre, description: tr.description, location: tr.location, annee: tr.annee || c.annee };
                    });

                setBusyLabel(t('translateFrise.busyGenerating', { defaultValue: 'Génération du PDF traduit…' }));
                setProgress({ current: 0, total: items.length });
                await generatePdf(
                    items,
                    sourceLang,
                    (cur, tot) => setProgress({ current: cur, total: tot }),
                    { labels, categoryMap }
                );
            });
        } catch (err) {
            // Le serveur renvoie un message technique quand DeepL est configuré.
            // On le traduit en quelque chose de lisible pour l'utilisateur.
            const msg = String(err?.message || '');
            if (msg.includes('OpenAI')) {
                setToastError('Clef DeepL pas assez puissante. Renseigne une clé OpenAI dans Admin → Réglages pour la frise traduite.');
            } else if (msg.includes('Clé API non configurée')) {
                setToastError('Aucune clé de traduction configurée. Renseigne une clé OpenAI dans Admin → Réglages.');
            } else {
                setToastError(`Échec de la traduction : ${msg || 'erreur inconnue'}`);
            }
        }
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
    const handleSort = (key) => setSortConfig(prev => {
        const next = { key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' };
        // Écrire dans l'URL pour que le tri survive à un aller-retour vers Create.
        const qp = new URLSearchParams(searchParams);
        qp.set('sort', next.key);
        qp.set('dir', next.direction);
        setSearchParams(qp, { replace: true });
        return next;
    });
    const SortIcon = ({ k }) => {
        if (sortConfig.key !== k) return <ArrowUpDown size={13} color="#ccc" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={13} color="#333" /> : <ArrowDown size={13} color="#333" />;
    };

    return (
        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'0 24px 80px' }}>

            {/* Overlay */}
            <LongOperationOverlay visible={busy} label={busyLabel} current={progress.current} total={progress.total} />

            <Toast visible={!!toastError} type="error" message={toastError} onDismiss={() => setToastError('')} autoDismiss={6000} />

            {/* Confirmation */}
            {confirmState && (
                <ConfirmModal
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    danger={confirmState.danger !== false}
                    onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
                    onCancel={() => setConfirmState(null)}
                />
            )}

            {/* Modal import */}
            {showImport && (
                <ImportModal
                    t={t}
                    onClose={() => setShowImport(false)}
                    onDone={() => { fetchData(); setShowImport(false); }}
                />
            )}

            {/* Modal frise traduite */}
            {showTranslateFrise && (
                <TranslateFriseModal
                    count={selectedIds.size}
                    sourceLang={i18n.language === 'en' ? 'en' : 'fr'}
                    onCancel={() => setShowTranslateFrise(false)}
                    onSubmit={handleTranslateFrise}
                />
            )}

            {/* Modal audit images (au chargement) */}
            {showImageHealthModal && (
                <ImageHealthModal
                    issues={imageIssues}
                    onContinue={() => setShowImageHealthModal(false)}
                    onShowIssues={() => {
                        setIssueIdsFilter(new Set(imageIssues.map(i => i.id)));
                        setShowImageHealthModal(false);
                    }}
                />
            )}

            {/* Bannière filtre "cartels problématiques" actif */}
            {issueIdsFilter && (
                <div style={{ margin: '16px 0 0', padding: '10px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: '#7a2222' }}>
                    <AlertTriangle size={16} color="#e53e3e" />
                    <span>{t('manageCartels.issueFilterBanner', { count: filteredCartels.length })}</span>
                    <button
                        onClick={() => setIssueIdsFilter(null)}
                        style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px', border: '1px solid #fecaca', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#7a2222' }}
                    >
                        {t('manageCartels.clearFilter')}
                    </button>
                </div>
            )}

            {/* ── Info contextuelle (sous-site) ──────────────── */}
            {lockedSubsiteSlug && (
                <div style={{ padding: '20px 0 0' }}>
                    <ExplainerBox
                        color="#c2185b"
                        background="#fce4ec"
                        border="#f8bbd0"
                        title={t('manageCartels.lockedIntroTitle', { name: subsiteScopedName || lockedSubsiteSlug })}
                    >
                        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                            <li><Trans i18nKey="manageCartels.lockedIntroPoint1" components={{ strong: <strong />, em: <em /> }} /></li>
                            <li><Trans i18nKey="manageCartels.lockedIntroPoint2" components={{ strong: <strong />, em: <em /> }} /></li>
                            <li><Trans i18nKey="manageCartels.lockedIntroPoint3" components={{ strong: <strong />, em: <em /> }} /></li>
                        </ul>
                    </ExplainerBox>
                </div>
            )}

            {/* ── En-tête ────────────────────────────────────── */}
            <div style={{ padding: '28px 0 0' }}>
                <Breadcrumb
                    crumbs={[
                        { label: t('nav.library', 'Bibliothèque'), href: '/app' },
                        { label: t('nav.management', 'Gestion'),   href: '/app/admin' },
                    ]}
                    current={t(currentTabDef.labelKey)}
                />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 0 20px', flexWrap:'wrap', gap:'12px' }}>
                <div>
                    <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:'800', color:'#1a1a1a' }}>{t('admin.title')}</h1>
                    <p style={{ margin:'4px 0 0', color:'#999', fontSize:'0.88rem' }}>{t('manageCartels.totalCount', { count: scopedCartels.length })}</p>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button
                        onClick={() => setShowImport(true)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', background:'#6b7280', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', cursor:'pointer', fontWeight:'700', fontSize:'0.88rem', fontFamily:'inherit' }}
                    >
                        <Upload size={15} /> {t('manageCartels.import')}
                    </button>
                    <button
                        onClick={() => goToCreate()}
                        style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--color-red-accent, #D65A5A)', color:'white', border:'none', borderRadius:'10px', padding:'10px 16px', cursor:'pointer', fontWeight:'700', fontSize:'0.88rem', fontFamily:'inherit' }}
                    >
                        <Plus size={15} /> {t('manageCartels.newCartel')}
                    </button>
                </div>
            </div>

            {/* ── Onglets : chaque tab est un bouton bordé pour qu'on voie tout
                  de suite que c'est cliquable, l'actif est rempli, les autres
                  restent en outline avec leur couleur sémantique. ───────── */}
            <div role="tablist" aria-label="Statuts des cartels" style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
                {visibleTabs.map(tab => {
                    const Icon   = tab.icon;
                    const active = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={active}
                            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
                            style={{
                                flex:1, minWidth:'180px',
                                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                                padding:'12px 18px',
                                borderRadius:'var(--radius-md)',
                                border: `1px solid ${active ? tab.color : 'var(--color-border)'}`,
                                cursor:'pointer',
                                fontFamily: 'var(--font-heading)',
                                fontWeight:'700', fontSize:'0.85rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                background: active ? tab.bg : 'var(--color-surface)',
                                color: active ? tab.color : 'var(--color-text-muted)',
                                transition:'background-color 0.15s, color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-primary-soft)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'var(--color-surface)'; }}
                        >
                            <Icon size={15} />
                            {t(tab.labelKey)}
                            <span style={{
                                background: active ? tab.color : 'var(--color-neutral-bg)',
                                color: active ? 'var(--color-white)' : 'var(--color-text-muted)',
                                borderRadius:'var(--radius-md)',
                                padding:'2px 8px', fontSize:'0.78rem', fontWeight:'700',
                                minWidth:'22px', textAlign:'center',
                                fontFamily: 'var(--font-heading)',
                            }}>
                                {counts[tab.key] ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bandeau scope sous-site — uniquement hors /site/:slug/admin
                (dans la page admin principale, on garde le bandeau compact avec
                 le bouton pour retirer le filtre). En mode lockedSubsiteSlug,
                 l'info box contextuelle au-dessus du titre couvre déjà ce rôle. */}
            {/* Bandeau : filtres complexes actifs.
                S'affiche au-dessus de la barre filtres pour signaler que les
                dropdowns inline catégorie/atelier sont ignorés au profit du
                builder. Boutons Modifier / Désactiver pour reprendre la main. */}
            {complexFilter.enabled && (
                <div style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    background:'#fff8e6', border:'1px solid #ffe0a8',
                    borderRadius:'10px', padding:'10px 14px', marginBottom:'12px',
                    color:'#a85d00', fontSize:'0.88rem', fontWeight:'600',
                }}>
                    <SlidersHorizontal size={16} />
                    <span>
                        {t('filters.activeBanner', {
                            count: complexFilter.conditions.length,
                            combinator: complexFilter.combinator === 'AND' ? t('filters.and', 'ET') : t('filters.or', 'OU'),
                            defaultValue: `Filtres complexes actifs : {{count}} condition(s) combinées en {{combinator}}.`,
                        })}
                    </span>
                    <span style={{ flex:1 }} />
                    <button
                        onClick={() => setShowComplexModal(true)}
                        style={{ background:'white', border:'1px solid #ffe0a8', color:'#a85d00', borderRadius:'6px', padding:'4px 10px', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                    >
                        {t('filters.edit', 'Modifier')}
                    </button>
                    <button
                        onClick={() => setComplexFilter(f => ({ ...f, enabled: false }))}
                        style={{ background:'#a85d00', border:'none', color:'white', borderRadius:'6px', padding:'4px 10px', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                    >
                        {t('filters.disable', 'Désactiver')}
                    </button>
                </div>
            )}

            {filterSubsiteSlug && !lockedSubsiteSlug && (
                <div style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    background:'#fce4ec', border:'1px solid #f8bbd0',
                    borderRadius:'10px', padding:'10px 14px', marginBottom:'16px',
                    color:'#c2185b', fontSize:'0.88rem', fontWeight:'600',
                }}>
                    <span><Trans i18nKey="manageCartels.subsiteFilterBanner" values={{ name: subsiteScopedName }} components={[<strong key="s" />]} /></span>
                    <span style={{ flex: 1 }} />
                    <button
                        onClick={() => { const next = new URLSearchParams(searchParams); next.delete('subsite'); setSearchParams(next, { replace: true }); }}
                        style={{ background:'white', border:'1px solid #f8bbd0', color:'#c2185b', borderRadius:'6px', padding:'4px 10px', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                    >
                        {t('manageCartels.removeSubsiteFilter')}
                    </button>
                    <button
                        onClick={() => navigate(subsiteBasePath(filterSubsiteSlug) || '/')}
                        style={{ background:'#c2185b', border:'none', color:'white', borderRadius:'6px', padding:'4px 10px', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                    >
                        {t('manageCartels.backToSubsite')}
                    </button>
                </div>
            )}

            {/* Description onglet */}
            {activeTab === 'submissions' ? (
                <ExplainerBox
                    color="#C2185B"
                    background="#fce4ec"
                    border="#f8bbd0"
                    title={t('manageCartels.submissionsExplainerTitle')}
                >
                    {t('manageCartels.submissionsExplainerIntro')}<br />
                    <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                        <li><Trans i18nKey="manageCartels.submissionsExplainerApprove" components={{ strong: <strong /> }} /></li>
                        <li><Trans i18nKey="manageCartels.submissionsExplainerReject" components={{ strong: <strong /> }} /></li>
                    </ul>
                </ExplainerBox>
            ) : (
                <p style={{ background:currentTabDef.bg, color:currentTabDef.color, borderRadius:'8px', padding:'10px 16px', fontSize:'0.85rem', fontWeight:'600', margin:'0 0 20px' }}>
                    {t(currentTabDef.descriptionKey)}
                </p>
            )}

            {/* ── Barre filtres + actions ───────────────────── */}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center', background:'#fafafa', border:'1px solid #eee', borderRadius:'12px', padding:'12px 16px', marginBottom:'16px' }}>

                {/* Recherche */}
                <div style={{ position:'relative', flex:'1', minWidth:'180px' }}>
                    <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#aaa' }} />
                    <input type="text" placeholder={t('manageCartels.search')} value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width:'100%', padding:'8px 36px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.88rem', boxSizing:'border-box' }} />
                    {filteredCartels.length > 0 && (
                        <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'#eee', color:'#666', borderRadius:'10px', padding:'1px 7px', fontSize:'0.75rem', fontWeight:'700' }}>
                            {filteredCartels.length}
                        </span>
                    )}
                </div>

                {/* Filtre catégorie (multi-select avec ET/OU) */}
                <MultiSelectDropdown
                    label={t('manageCartels.allCategories')}
                    options={categories.map(c => ({ value: c.name || c, label: c.name || c }))}
                    selected={filterCategories}
                    onChange={handleSetFilterCategories}
                    op={filterCategoriesOp}
                    onOpChange={setFilterCategoriesOp}
                    opLabels={{ or: t('filters.or', 'OU'), and: t('filters.and', 'ET') }}
                    emptyLabel={t('filters.clearSelection', 'Tout afficher')}
                />

                {/* Filtre atelier (multi-select avec ET/OU) */}
                <MultiSelectDropdown
                    label={t('manageCartels.allWorkshops')}
                    options={workshops.map(w => ({ value: w.id, label: w.name }))}
                    selected={filterWorkshops}
                    onChange={handleSetFilterWorkshops}
                    op={filterWorkshopsOp}
                    onOpChange={setFilterWorkshopsOp}
                    opLabels={{ or: t('filters.or', 'OU'), and: t('filters.and', 'ET') }}
                    emptyLabel={t('filters.clearSelection', 'Tout afficher')}
                />

                {activeWorkshops.length === 1 && (
                    <span style={{ background:'#e8f1ff', color:'#1f6feb', padding:'8px 12px', borderRadius:'999px', fontSize:'0.82rem', fontWeight:'700' }}>
                        {t('manageCartels.workshopFilter', { name: activeWorkshops[0].name })}
                    </span>
                )}

                {/* Bouton "Filtres complexes" : ouvre le builder modal. */}
                <button
                    onClick={() => setShowComplexModal(true)}
                    title={t('filters.complexButtonHelp', 'Cibler un lot de cartels plus précis : combiner plusieurs catégories et ateliers avec ET/OU.')}
                    style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', background: complexFilter.enabled ? '#fff8e6' : 'white', cursor:'pointer', fontSize:'0.85rem', color: complexFilter.enabled ? '#a85d00' : '#555', fontFamily:'inherit', fontWeight: complexFilter.enabled ? '700' : '500' }}
                >
                    <SlidersHorizontal size={14} />
                    {t('filters.complexButton', 'Filtres complexes')}
                    {complexFilter.enabled && complexFilter.conditions.length > 0 && (
                        <span style={{ background:'#f59f00', color:'white', borderRadius:'10px', padding:'1px 7px', fontSize:'0.72rem', fontWeight:'800' }}>
                            {complexFilter.conditions.length}
                        </span>
                    )}
                </button>

                {/* Tout sélectionner */}
                <button onClick={selectAll} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', background:'white', cursor:'pointer', fontSize:'0.85rem', color:'#555', fontFamily:'inherit' }}>
                    {selectedIds.size > 0 && selectedIds.size === filteredCartels.length
                        ? <CheckSquare size={22} color="#3b5bdb" />
                        : <Square size={22} color="#aaa" />}
                    {selectedIds.size > 0 ? `${selectedIds.size} ${t('manageCartels.selected')}${selectedIds.size > 1 ? 's' : ''}` : t('manageCartels.selectAll')}
                </button>

                {/* Colonnes affichées : permet de masquer Catégories / Ateliers / Lieu
                    quand on n'en a pas besoin (préférence persistée en localStorage). */}
                <DropdownButton label={t('manageCartels.columnsMenu', 'Colonnes')} icon={Columns} color="#555" variant="outline">
                    {() => (
                        <div style={{ padding:'6px 0' }}>
                            {[
                                { key: 'categories', label: t('manageCartels.categories') },
                                { key: 'workshops',  label: t('manageCartels.workshops')  },
                                { key: 'location',   label: t('manageCartels.location')   },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => toggleCol(key)}
                                    style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'9px 14px', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:'0.88rem', color:'#333', fontFamily:'inherit' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    {isColHidden(key)
                                        ? <Square size={16} color="#aaa" />
                                        : <CheckSquare size={16} color="#3b5bdb" />}
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </DropdownButton>

                {/* Actions batch */}
                {selectedIds.size > 0 && (
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                        {activeTab !== 'published' && (
                            <button onClick={handleBulkPublish} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 11px', borderRadius:'8px', border:'none', background:'var(--color-success, #2e7d32)', color:'white', cursor:'pointer', fontSize:'0.84rem', fontWeight:'600', fontFamily:'inherit' }}>
                                <Check size={14} /> {t('manageCartels.publish')} ({selectedIds.size})
                            </button>
                        )}
                        <button onClick={handleBulkTranslate} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 11px', borderRadius:'8px', border:'1px solid #6741d9', background:'white', color:'#6741d9', cursor:'pointer', fontSize:'0.84rem', fontWeight:'600', fontFamily:'inherit' }}>
                            <Languages size={14} /> {t('manageCartels.retranslate')} ({selectedIds.size})
                        </button>
                        <DropdownButton label={t('manageCartels.export')} icon={Download} color="#555" variant="outline">
                            {close => (<>
                                <DropItem icon={ImgIcon}   label={t('manageCartels.imagesZip')} onClick={() => handleExportImages(close)} />
                                <DropItem icon={FileText}  label={t('manageCartels.pdfPrint')} onClick={() => handleExportPdf(close)} />
                                <DropItem icon={Languages} label={t('translateFrise.menuLabel', 'PDF traduit (autre langue)…')} onClick={() => { close(); setShowTranslateFrise(true); }} />
                                <DropItem icon={Package}   label={t('manageCartels.fullArchive')} onClick={() => handleExportArchive(close)} />
                            </>)}
                        </DropdownButton>
                        <button onClick={() => { setNewWorkshopName(''); setSelectedWorkshopId(''); setShowWorkshopModal(true); }} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 11px', borderRadius:'8px', border:'1px solid #1f6feb', background:'white', color:'#1f6feb', cursor:'pointer', fontSize:'0.84rem', fontWeight:'600', fontFamily:'inherit' }}>
                            <FolderPlus size={14} /> {t('manageCartels.assignWorkshop')} ({selectedIds.size})
                        </button>
                        <button onClick={handleBulkDelete} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 11px', borderRadius:'8px', border:'none', background:'var(--color-error, #d32f2f)', color:'white', cursor:'pointer', fontSize:'0.84rem', fontWeight:'600', fontFamily:'inherit' }}>
                            <Trash2 size={14} /> {t('manageCartels.delete')}
                        </button>
                    </div>
                )}

                {/* Export sans sélection → tout exporter */}
                {selectedIds.size === 0 && (
                    <DropdownButton label={t('manageCartels.exportAll')} icon={Download} color="#555" variant="outline">
                        {close => (<>
                            <DropItem icon={Package}  label={t('manageCartels.fullArchive')} onClick={() => { close(); withBusy(t('manageCartels.preparingArchive'), () => api.io.exportArchive([])); }} />
                        </>)}
                    </DropdownButton>
                )}
            </div>

            {/* Indicateur discret de rafraîchissement en cours, montré
                uniquement après le premier chargement réussi (sinon le bloc
                "Chargement…" plein vide ci-dessous prend le relais). */}
            {appLoading && hasFetched && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 4px', color:'#888', fontSize:'0.82rem' }}>
                    <Loader2 size={14} style={{ animation:'paleoSpin 1s linear infinite' }} />
                    <span>{t('manageCartels.refreshing', 'Mise à jour…')}</span>
                    <style>{`@keyframes paleoSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* ── Tableau ────────────────────────────────────── */}
            {/* Scroll interne : seules les lignes défilent, filtres/onglets/entête
                de page restent visibles. thead reste collé en haut grâce au sticky. */}
            <div style={{ background:'white', borderRadius:'12px', border:'1px solid #eee', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', maxHeight:'calc(100vh - 340px)', overflowY:'auto' }}>
                {(!hasFetched || (appLoading && cartels.length === 0)) ? (
                    /* Premier chargement : on n'a aucune donnée à afficher,
                       donc on remplace l'état vide par un spinner pour ne pas
                       laisser croire que le gestionnaire est cassé / vide. */
                    <div style={{ textAlign:'center', padding:'80px 20px', color:'#888', display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
                        <Loader2 size={32} color="#C2185B" style={{ animation:'paleoSpin 1s linear infinite' }} />
                        <p style={{ fontSize:'0.95rem', margin:0 }}>{t('common.loading', 'Chargement…')}</p>
                        <style>{`@keyframes paleoSpin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filteredCartels.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb' }}>
                        <p style={{ fontSize:'1.1rem' }}>{t('manageCartels.noCartelsTab')}</p>
                    </div>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.88rem' }}>
                        {/* Sticky sur chaque <th> (plus fiable cross-browser que sur <thead>).
                            top:0 relatif au conteneur de scroll au-dessus. */}
                        <thead style={{ background:'#f8f8f8', borderBottom:'2px solid #eee' }}>
                            <tr>
                                {(() => {
                                    const thSticky = { position:'sticky', top:0, background:'#f8f8f8', zIndex:2, boxShadow:'inset 0 -2px 0 #eee' };
                                    return <>
                                        <th style={{ padding:'12px', width:'36px', ...thSticky }} />
                                        <th style={{ padding:'12px', width:'50px', textAlign:'left', ...thSticky }}>Img</th>
                                        <th onClick={() => handleSort('date')}  style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', ...thSticky }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>{t('manageCartels.year')} <SortIcon k="date" /></div></th>
                                        <th onClick={() => handleSort('titre')} style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none', ...thSticky }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>{t('manageCartels.title')} <SortIcon k="titre" /></div></th>
                                        {!isColHidden('categories') && <th style={{ padding:'12px', textAlign:'left', ...thSticky }}>{t('manageCartels.categories')}</th>}
                                        {!isColHidden('workshops')  && <th style={{ padding:'12px', textAlign:'left', ...thSticky }}>{t('manageCartels.workshops')}</th>}
                                        {!isColHidden('location')   && <th onClick={() => handleSort('loc')}   style={{ padding:'12px', textAlign:'left', cursor:'pointer', userSelect:'none', ...thSticky }}><div style={{ display:'flex', alignItems:'center', gap:'4px' }}>{t('manageCartels.location')} <SortIcon k="loc" /></div></th>}
                                        {activeTab === 'pending' && <th style={{ padding:'12px', textAlign:'left', ...thSticky }}>IP</th>}
                                        {activeTab === 'submissions' && <th style={{ padding:'12px', textAlign:'left', ...thSticky }}>{t('manageCartels.subsite')}</th>}
                                        <th style={{ padding:'12px', textAlign:'center', ...thSticky }}>{t('manageCartels.actions')}</th>
                                        <th style={{ padding:'12px', textAlign:'center', ...thSticky }}>{t('manageCartels.statusActions')}</th>
                                    </>;
                                })()}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCartels.map(cartel => {
                                const isProc  = processingId === cartel.id;
                                const isTrans = translating.has(cartel.id);
                                const readOnly = isReadOnlyMainCartel(cartel);
                                // Archivé : le badge "État" a été retiré ; on garde la distinction
                                // visuelle via une opacité plus faible sur la ligne entière.
                                const rowOpacity = isProc ? 0.7 : cartel.status === 'archived' ? 0.55 : 1;

                                return (
                                    <tr key={cartel.id} id={`cartel-${cartel.id}`} style={{ borderBottom:'1px solid #f0f0f0', background: isProc ? '#fffbf0' : 'white', opacity: rowOpacity }}>

                                        {/* Checkbox */}
                                        <td style={{ padding:'10px', textAlign:'center' }}>
                                            <div onClick={() => toggleSelect(cartel.id)} style={{ cursor:'pointer' }}>
                                                {selectedIds.has(cartel.id) ? <CheckSquare size={22} color="#3b5bdb" /> : <Square size={22} color="#ccc" />}
                                            </div>
                                        </td>

                                        {/* Image */}
                                        <td style={{ padding:'10px' }}>
                                            {(cartel.image_path || cartel.imageUrl) ? (
                                                <img src={cartel.image_path || cartel.imageUrl} alt="" loading="lazy" style={{ width:'40px', height:'40px', objectFit:'cover', borderRadius:'6px' }} />
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
                                            {/* Badge sous-site d'origine (affiché sur les onglets hors submissions) */}
                                            {activeTab !== 'submissions' && cartel.subsite_name && (
                                                <span style={{ display:'inline-block', marginTop:'4px', background:'#fce4ec', color:'#c2185b', borderRadius:'10px', padding:'1px 7px', fontSize:'0.72rem', fontWeight:'700' }}>
                                                    {cartel.subsite_name}
                                                </span>
                                            )}
                                            {/* Badge "Site principal" pour les cartels en consultation seule */}
                                            {isReadOnlyMainCartel(cartel) && (
                                                <span style={{ display:'inline-block', marginTop:'4px', background:'#e8f0fe', color:'#1a56db', borderRadius:'10px', padding:'1px 7px', fontSize:'0.72rem', fontWeight:'700' }}>
                                                    Site principal · consultation
                                                </span>
                                            )}
                                            {activeTab === 'pending' && cartel.created_at && (
                                                <div style={{ color:'#bbb', fontSize:'0.78rem', marginTop:'3px', display:'flex', alignItems:'center', gap:'4px' }}>
                                                    <Clock size={11} />
                                                    {new Date(cartel.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                                </div>
                                            )}
                                        </td>

                                        {/* Catégories */}
                                        {!isColHidden('categories') && (
                                            <td style={{ padding:'10px' }}>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:'3px' }}>
                                                    {(cartel.categories || []).slice(0, 3).map(c => (
                                                        <span key={c} style={{ background:'#f0f0f0', padding:'2px 7px', borderRadius:'10px', fontSize:'0.75rem', color:'#555' }}>{c}</span>
                                                    ))}
                                                    {(cartel.categories || []).length > 3 && <span style={{ color:'#bbb', fontSize:'0.75rem' }}>+{cartel.categories.length - 3}</span>}
                                                </div>
                                            </td>
                                        )}

                                        {/* Workshops */}
                                        {!isColHidden('workshops') && (
                                            <td style={{ padding:'10px' }}>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                                                    {((cartel.workshopIds || []).map(id => workshops.find(w => String(w.id) === String(id))).filter(Boolean).slice(0, 2)).map(w => (
                                                        <span key={w.id} style={{ background:'#e8f1ff', padding:'2px 7px', borderRadius:'10px', fontSize:'0.75rem', color:'#1f6feb' }}>{w.name}</span>
                                                    ))}
                                                    {((cartel.workshopIds || []).length > 2) && <span style={{ color:'#bbb', fontSize:'0.75rem' }}>+{cartel.workshopIds.length - 2}</span>}
                                                    {(cartel.workshopIds || []).length === 0 && <span style={{ color:'#bbb', fontSize:'0.8rem' }}>—</span>}
                                                </div>
                                            </td>
                                        )}

                                        {/* Lieu */}
                                        {!isColHidden('location') && (
                                            <td style={{ padding:'10px', color:'#777', fontSize:'0.85rem' }}>
                                                {cartel.location && <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><MapPin size={12} color="#bbb" />{cartel.location}</div>}
                                            </td>
                                        )}

                                        {/* IP */}
                                        {activeTab === 'pending' && (
                                            <td style={{ padding:'10px' }}>
                                                {cartel.submitter_ip && <code style={{ background:'#f5f5f5', padding:'2px 7px', borderRadius:'4px', fontSize:'0.78rem', color:'#666' }}>{cartel.submitter_ip}</code>}
                                            </td>
                                        )}

                                        {/* Sous-site d'origine */}
                                        {activeTab === 'submissions' && (
                                            <td style={{ padding:'10px' }}>
                                                {cartel.subsite_name ? (
                                                    <span style={{ background:'#fce4ec', color:'#C2185B', borderRadius:'10px', padding:'2px 8px', fontSize:'0.78rem', fontWeight:'600' }}>{cartel.subsite_name}</span>
                                                ) : <span style={{ color:'#bbb' }}>—</span>}
                                                {cartel.submitted_to_main_at && (
                                                    <div style={{ color:'#aaa', fontSize:'0.75rem', marginTop:'3px' }}>
                                                        <Clock size={10} style={{ verticalAlign:'middle', marginRight:'2px' }} />
                                                        {new Date(cartel.submitted_to_main_at).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                                    </div>
                                                )}
                                            </td>
                                        )}

                                        {/* Actions de modification : aperçu, édition du contenu, retraduction. */}
                                        <td style={{ padding:'10px' }}>
                                            <div style={{ display:'flex', gap:'4px', justifyContent:'center', flexWrap:'wrap' }}>
                                                <ActionBtn onClick={() => setPreviewCartel(cartel)} title={t('manageCartels.preview')} color={HEX_COLORS.neutral}><ScanEye size={15} /></ActionBtn>
                                                <ActionBtn onClick={() => setWebPreviewCartel(cartel)} title={t('manageCartels.webPreview')} color="#0e7490"><Monitor size={15} /></ActionBtn>
                                                {!readOnly && <ActionBtn onClick={() => goToCreate(cartel.id)} title={t('manageCartels.edit')} color="#3b5bdb"><Edit size={15} /></ActionBtn>}

                                                {/* Retraduction automatique : on n'affiche que la direction
                                                    qui part de la langue active. En FR on lance EN→ depuis FR,
                                                    en EN on lance FR→ depuis EN. L'autre bouton (Ajouter une
                                                    note) prend la place de l'option redondante. */}
                                                {!readOnly && (i18n.language === 'en' ? (
                                                    <ActionBtn onClick={() => handleRetranslate(cartel, 'fr')} title={t('manageCartels.retranslateFr', 'Lancer une traduction automatique en français à partir de la version anglaise.')} color="#3b82c4" disabled={isTrans}>
                                                        {isTrans ? <Clock size={15} /> : <Languages size={15} />}
                                                    </ActionBtn>
                                                ) : (
                                                    <ActionBtn onClick={() => handleRetranslate(cartel, 'en')} title={t('manageCartels.retranslateEn', 'Lancer une traduction automatique en anglais à partir de la version française.')} color="#6741d9" disabled={isTrans}>
                                                        {isTrans ? <Clock size={15} /> : <Languages size={15} />}
                                                    </ActionBtn>
                                                ))}
                                                {!readOnly && (
                                                    <ActionBtn onClick={() => setNoteCartel(cartel)} title={t('manageCartels.addNote', 'Ajouter une note')} color="#e67e00">
                                                        <StickyNote size={15} />
                                                    </ActionBtn>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions de statut : changement de cycle de vie (publier, brouillon,
                                            archiver, supprimer) et workflow de soumission au site principal. */}
                                        <td style={{ padding:'10px' }}>
                                            <div style={{ display:'flex', gap:'4px', justifyContent:'center', flexWrap:'wrap' }}>
                                                {activeTab === 'submissions' && (
                                                    <>
                                                        <ActionBtn onClick={() => handleApproveSubmission(cartel)} title={t('manageCartels.approve')} color="#2e7d32" disabled={isProc}><Check size={15} /></ActionBtn>
                                                        <ActionBtn onClick={() => handleRejectSubmission(cartel)} title={t('manageCartels.reject')} color="#d32f2f" disabled={isProc}><X size={15} /></ActionBtn>
                                                    </>
                                                )}

                                                {!readOnly && activeTab !== 'submissions' && (cartel.status === 'draft' || cartel.status === 'pending_review') && (
                                                    <ActionBtn onClick={() => handlePublish(cartel)} title={t('manageCartels.publish')} color="#2e7d32" disabled={isProc}><Check size={15} /></ActionBtn>
                                                )}
                                                {/* Désarchiver = republier (re-visible aux visiteurs) */}
                                                {!readOnly && activeTab !== 'submissions' && cartel.status === 'archived' && (
                                                    <ActionBtn onClick={() => handleUnarchive(cartel)} title={t('manageCartels.unarchive')} color="#2e7d32" disabled={isProc}><Globe size={15} /></ActionBtn>
                                                )}
                                                {!readOnly && activeTab !== 'submissions' && (cartel.status === 'pending_review' || cartel.status === 'published' || cartel.status === 'archived') && (
                                                    <ActionBtn onClick={() => handleToDraft(cartel)} title={t('status.draft')} color="#e67e00" disabled={isProc}><FileText size={15} /></ActionBtn>
                                                )}
                                                {/* Archiver : publié → caché aux visiteurs, contenu conservé */}
                                                {!readOnly && activeTab !== 'submissions' && cartel.status === 'published' && (
                                                    <ActionBtn onClick={() => handleArchive(cartel)} title={t('manageCartels.archive')} color="#6b7280" disabled={isProc}><Archive size={15} /></ActionBtn>
                                                )}

                                                {/* Workflow site principal (owner/superadmin sur cartels de sous-site) */}
                                                {!readOnly && activeTab !== 'submissions' && canSubmitThisCartel(cartel) && (
                                                    <>
                                                        {cartel.visible_on_main ? (
                                                            <ActionBtn onClick={() => handleWithdrawFromMain(cartel)} title={t('manageCartels.tipVisibleOnMain')} color="#2e7d32" disabled={isProc}><Globe size={15} /></ActionBtn>
                                                        ) : cartel.submitted_to_main_at ? (
                                                            <ActionBtn onClick={() => handleWithdrawFromMain(cartel)} title={t('manageCartels.tipPendingMain')} color="#C2185B" disabled={isProc}><Clock size={15} /></ActionBtn>
                                                        ) : (
                                                            <ActionBtn onClick={() => handleSubmitToMain(cartel)} title={t('manageCartels.tipSubmitToMain')} color="#6741d9" disabled={isProc}><Upload size={15} /></ActionBtn>
                                                        )}
                                                    </>
                                                )}

                                                {!readOnly && activeTab !== 'submissions' && (
                                                    <ActionBtn onClick={() => handleDelete(cartel.id)} title={t('manageCartels.delete')} color="#d32f2f" disabled={isProc}><Trash2 size={15} /></ActionBtn>
                                                )}
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
                    <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'960px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
                        <button onClick={() => setPreviewCartel(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f5f5f5', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 10 }}><X size={16} /></button>
                        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:'700' }}>{t('manageCartels.preview')}</h3>
                        {/* Aperçu fidèle du rendu imprimé : on rend le canvas via la
                            même fonction qui produit les exports PNG/PDF, à ratio A4
                            paysage exact. Les deux boutons PNG/PDF sont en overlay
                            pour ne pas modifier la composition imprimée. */}
                        <PrintPreview data={previewCartel} />
                        <div style={{ display:'flex', gap:'10px', marginTop:'16px', justifyContent:'flex-end' }}>
                            <button onClick={() => { setPreviewCartel(null); goToCreate(previewCartel.id); }}
                                style={{ display:'flex', alignItems:'center', gap:'6px', background:'#3b5bdb', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                <Edit size={15} /> {t('manageCartels.edit')}
                            </button>
                            {/* Une seule direction de retraduction selon la langue active,
                                cohérente avec les boutons d'action de ligne. */}
                            {i18n.language === 'en' ? (
                                <button onClick={() => handleRetranslate(previewCartel, 'fr')}
                                    title={t('manageCartels.retranslateFr')}
                                    style={{ display:'flex', alignItems:'center', gap:'6px', background:'#3b82c4', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                    <Languages size={15} /> {t('manageCartels.retranslateShortFr', 'Retraduire en français')}
                                </button>
                            ) : (
                                <button onClick={() => handleRetranslate(previewCartel, 'en')}
                                    title={t('manageCartels.retranslateEn')}
                                    style={{ display:'flex', alignItems:'center', gap:'6px', background:'#6741d9', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                    <Languages size={15} /> {t('manageCartels.retranslateShortEn', 'Retraduire en anglais')}
                                </button>
                            )}
                            <button onClick={() => setPreviewCartel(null)} style={{ padding:'10px 18px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', fontFamily:'inherit' }}>{t('manageCartels.importClose')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal aperçu version web ──────────────────────
                Rend CartelPreview, le composant utilisé dans la bibliothèque
                publique : montre le cartel tel que le verra un visiteur. */}
            {webPreviewCartel && (
                <div onClick={() => setWebPreviewCartel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'960px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
                        <button onClick={() => setWebPreviewCartel(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f5f5f5', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 10 }}><X size={16} /></button>
                        <h3 style={{ margin:'0 0 16px', fontSize:'1rem', fontWeight:'700', display:'flex', alignItems:'center', gap:'8px' }}><Monitor size={16} /> {t('manageCartels.webPreview')}</h3>
                        <CartelPreview data={webPreviewCartel} isDraft={webPreviewCartel.status !== 'published'} />
                        <div style={{ display:'flex', gap:'10px', marginTop:'16px', justifyContent:'flex-end' }}>
                            <button onClick={() => { setWebPreviewCartel(null); goToCreate(webPreviewCartel.id); }}
                                style={{ display:'flex', alignItems:'center', gap:'6px', background:'#3b5bdb', color:'white', border:'none', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                                <Edit size={15} /> {t('manageCartels.edit')}
                            </button>
                            <button onClick={() => setWebPreviewCartel(null)} style={{ padding:'10px 18px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', fontFamily:'inherit' }}>{t('manageCartels.importClose')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showWorkshopModal && (
                <div onClick={() => setShowWorkshopModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'520px', width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop:0 }}>{t('manageCartels.assignWorkshop')}</h3>
                        <p style={{ color:'#666', marginTop:'-4px' }}>{selectedIds.size} cartel(s) sélectionné(s).</p>

                        <div style={{ marginBottom:'14px' }}>
                            <label style={{ display:'block', fontWeight:'700', marginBottom:'6px' }}>{t('manageCartels.existingWorkshop')}</label>
                            <select value={selectedWorkshopId} onChange={e => { setSelectedWorkshopId(e.target.value); setNewWorkshopName(''); }} style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid #ddd' }}>
                                <option value="">{t('manageCartels.chooseWorkshop')}</option>
                                {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom:'14px' }}>
                            <label style={{ display:'block', fontWeight:'700', marginBottom:'6px' }}>{t('manageCartels.newWorkshop')}</label>
                            <input value={newWorkshopName} onChange={e => { setNewWorkshopName(e.target.value); setSelectedWorkshopId(''); }} placeholder={t('manageCartels.newWorkshopPlaceholder')} style={{ width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid #ddd' }} />
                        </div>

                        <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
                            <button onClick={() => setShowWorkshopModal(false)} style={{ padding:'10px 16px', borderRadius:'10px', border:'1px solid #ddd', background:'white', cursor:'pointer' }}>{t('common.back')}</button>
                            <button onClick={handleBulkWorkshop} style={{ padding:'10px 16px', borderRadius:'10px', border:'none', background:'#1f6feb', color:'white', cursor:'pointer', fontWeight:'700' }}>{t('manageCartels.assign')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mini-modal "Ajouter une note" ────────────
                Saisie rapide sans ouvrir l'éditeur de cartel. La note est créée
                via api.cartels.addNote ; pas de relecture liste après (les notes
                ne s'affichent pas dans le gestionnaire — on évite un re-fetch). */}
            {noteCartel && (
                <AddNoteModal
                    cartel={noteCartel}
                    subsiteSlug={lockedSubsiteSlug || null}
                    onClose={() => setNoteCartel(null)}
                    t={t}
                />
            )}

            {/* ── Modal Filtres complexes ──────────────────────
                State local (draftFilter) édité dans la modal, appliqué seulement
                au clic sur "Appliquer". Annuler/fermer ne touche pas
                complexFilter, donc l'utilisateur peut explorer librement. */}
            {showComplexModal && (
                <ComplexFilterModal
                    initial={complexFilter}
                    categories={categories}
                    workshops={workshops}
                    onClose={() => setShowComplexModal(false)}
                    onApply={(next) => { setComplexFilter(next); setShowComplexModal(false); }}
                    t={t}
                />
            )}
        </div>
    );
};

// ── Mini-modal "Ajouter une note" ──────────────────────────────
// Saisie minimale pour ajouter une note admin à un cartel sans devoir
// ouvrir l'éditeur complet. Ferme automatiquement après succès.
const AddNoteModal = ({ cartel, subsiteSlug, onClose, t }) => {
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const trimmed = body.trim();
        if (!trimmed) return;
        setBusy(true);
        setError('');
        try {
            await api.cartels.addNote(cartel.id, trimmed, subsiteSlug || undefined);
            onClose();
        } catch (e) {
            setError(e.message || t('manageCartels.addNoteError', 'Erreur lors de l\'ajout de la note'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'22px', maxWidth:'460px', width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin:'0 0 4px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <StickyNote size={18} /> {t('manageCartels.addNote', 'Ajouter une note')}
                </h3>
                <p style={{ color:'#666', fontSize:'0.82rem', margin:'0 0 14px' }}>
                    {cartel.titre || '(sans titre)'}
                </p>
                <textarea
                    autoFocus
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder={t('manageCartels.addNotePlaceholder', 'Note interne, visible des admins uniquement…')}
                    maxLength={5000}
                    style={{ width:'100%', minHeight:'120px', padding:'10px 12px', borderRadius:'10px', border:'1px solid #ddd', fontFamily:'inherit', fontSize:'0.9rem', resize:'vertical', boxSizing:'border-box' }}
                />
                {error && <p style={{ color:'#d32f2f', fontSize:'0.82rem', marginTop:'8px' }}>{error}</p>}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'14px' }}>
                    <button onClick={onClose} disabled={busy} style={{ padding:'9px 16px', borderRadius:'10px', border:'1px solid #ddd', background:'white', cursor: busy ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                        {t('common.back')}
                    </button>
                    <button onClick={handleSave} disabled={busy || !body.trim()} style={{ padding:'9px 16px', borderRadius:'10px', border:'none', background: busy || !body.trim() ? '#bbb' : '#e67e00', color:'white', cursor: busy || !body.trim() ? 'not-allowed' : 'pointer', fontWeight:'700', fontFamily:'inherit' }}>
                        {busy ? t('manageCartels.savingNote', 'Enregistrement…') : t('manageCartels.saveNote', 'Enregistrer')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Modal Filtres complexes ─────────────────────────────────────
// Builder isolé pour ne pas alourdir le composant principal. Édite un draft
// local du filtre puis l'applique au composant parent via onApply.
const ComplexFilterModal = ({ initial, categories, workshops, onClose, onApply, t }) => {
    const [draft, setDraft] = useState(() => ({
        enabled: true,
        combinator: initial.combinator || 'AND',
        conditions: (initial.conditions || []).map(c => ({ ...c, values: [...(c.values || [])] })),
    }));

    const addCondition = () => {
        setDraft(d => ({
            ...d,
            conditions: [...d.conditions, { id: Date.now() + Math.random(), field: 'category', values: [] }],
        }));
    };
    const removeCondition = (id) => {
        setDraft(d => ({ ...d, conditions: d.conditions.filter(c => c.id !== id) }));
    };
    const updateCondition = (id, patch) => {
        setDraft(d => ({
            ...d,
            conditions: d.conditions.map(c => c.id === id ? { ...c, ...patch } : c),
        }));
    };

    const optionsFor = (field) => field === 'workshop'
        ? workshops.map(w => ({ value: String(w.id), label: w.name }))
        : categories.map(c => ({ value: c.name || c, label: c.name || c }));

    const handleApply = () => {
        // Conditions vides ignorées au moment d'appliquer pour éviter une activation
        // sans effet visible.
        const cleaned = draft.conditions.filter(c => c.values && c.values.length > 0);
        if (!cleaned.length) {
            onApply({ enabled: false, combinator: draft.combinator, conditions: [] });
            return;
        }
        onApply({ enabled: true, combinator: draft.combinator, conditions: cleaned });
    };

    const handleDisable = () => {
        onApply({ enabled: false, combinator: 'AND', conditions: [] });
    };

    return (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'640px', width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto' }}>
                <h3 style={{ margin:'0 0 4px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <SlidersHorizontal size={18} /> {t('filters.complexTitle', 'Filtres complexes')}
                </h3>
                <p style={{ color:'#666', fontSize:'0.85rem', margin:'0 0 16px' }}>
                    {t('filters.complexHelp', 'Ajoutez plusieurs conditions et choisissez comment les combiner. Dans une condition, les valeurs cochées sont liées par OU.')}
                </p>

                {/* Combinator global entre conditions */}
                {draft.conditions.length >= 2 && (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px', padding:'10px 12px', background:'#fafafa', border:'1px solid #eee', borderRadius:'10px' }}>
                        <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#555' }}>{t('filters.combine', 'Combiner les conditions par :')}</span>
                        <div style={{ display:'flex', gap:'4px' }}>
                            <button
                                onClick={() => setDraft(d => ({ ...d, combinator: 'AND' }))}
                                style={{ padding:'5px 12px', borderRadius:'6px', border:'none', background: draft.combinator === 'AND' ? '#3b5bdb' : '#eee', color: draft.combinator === 'AND' ? 'white' : '#555', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                            >{t('filters.and', 'ET')}</button>
                            <button
                                onClick={() => setDraft(d => ({ ...d, combinator: 'OR' }))}
                                style={{ padding:'5px 12px', borderRadius:'6px', border:'none', background: draft.combinator === 'OR' ? '#3b5bdb' : '#eee', color: draft.combinator === 'OR' ? 'white' : '#555', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                            >{t('filters.or', 'OU')}</button>
                        </div>
                    </div>
                )}

                {/* Liste des conditions */}
                {draft.conditions.map((cond, idx) => (
                    <div key={cond.id} style={{ border:'1px solid #eee', borderRadius:'10px', padding:'12px', marginBottom:'10px', background:'white' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                            <span style={{ fontSize:'0.82rem', fontWeight:'700', color:'#888' }}>
                                {t('filters.conditionNumber', { num: idx + 1, defaultValue: `Condition ${idx + 1}` })}
                            </span>
                            <span style={{ flex:1 }} />
                            <button
                                onClick={() => removeCondition(cond.id)}
                                title={t('filters.removeCondition', 'Retirer cette condition')}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#d32f2f', padding:'4px', display:'flex' }}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                            <select
                                value={cond.field}
                                onChange={e => updateCondition(cond.id, { field: e.target.value, values: [] })}
                                style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.88rem', background:'white' }}
                            >
                                <option value="category">{t('manageCartels.categories', 'Catégories')}</option>
                                <option value="workshop">{t('manageCartels.workshops', 'Ateliers')}</option>
                            </select>
                            <MultiSelectDropdown
                                label={cond.field === 'workshop'
                                    ? t('manageCartels.allWorkshops')
                                    : t('manageCartels.allCategories')}
                                options={optionsFor(cond.field)}
                                selected={cond.values}
                                onChange={(vals) => updateCondition(cond.id, { values: vals })}
                                emptyLabel={t('filters.clearSelection', 'Tout afficher')}
                            />
                        </div>
                    </div>
                ))}

                <button
                    onClick={addCondition}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', border:'1px dashed #aaa', background:'white', cursor:'pointer', fontSize:'0.86rem', color:'#3b5bdb', fontFamily:'inherit', marginBottom:'18px' }}
                >
                    + {t('filters.addCondition', 'Ajouter une condition')}
                </button>

                <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', borderTop:'1px solid #eee', paddingTop:'14px' }}>
                    {initial.enabled && (
                        <button onClick={handleDisable} style={{ padding:'10px 16px', borderRadius:'10px', border:'1px solid #d32f2f', background:'white', color:'#d32f2f', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>
                            {t('filters.disable', 'Désactiver')}
                        </button>
                    )}
                    <span style={{ flex:1 }} />
                    <button onClick={onClose} style={{ padding:'10px 16px', borderRadius:'10px', border:'1px solid #ddd', background:'white', cursor:'pointer', fontFamily:'inherit' }}>
                        {t('common.back')}
                    </button>
                    <button onClick={handleApply} style={{ padding:'10px 16px', borderRadius:'10px', border:'none', background:'#3b5bdb', color:'white', cursor:'pointer', fontWeight:'700', fontFamily:'inherit' }}>
                        {t('filters.apply', 'Appliquer')}
                    </button>
                </div>
            </div>
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
                        padding: '7px 10px',
                        borderRadius: '6px',
                        // Multi-ligne avec largeur bornée pour ne pas déborder
                        // du conteneur de scroll (overflow-y:auto rogne aussi
                        // horizontalement) et garder un tooltip lisible.
                        whiteSpace: 'normal',
                        maxWidth: '260px',
                        width: 'max-content',
                        lineHeight: 1.35,
                        textAlign: 'center',
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
