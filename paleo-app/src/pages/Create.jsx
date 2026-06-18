import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useLocation, useParams, useBlocker } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { geocodingService } from '../services/geocoding';
import { Save, MapPin, Check, X, Bold, Italic, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { compressImage } from '../utils/imageProcessor';
import { detectWrongLanguage } from '../utils/detectLang';
import { readStoredReturnTo, clearReturnTo } from '../utils/navigation';
import { getHostSubsiteSlug, subsiteBasePath } from '../utils/subsiteHost';
import api from '../services/apiClient';
import { BlockEditor } from '../components/blocks/BlockEditor';
import CartelNotesPanel from '../components/CartelNotesPanel';
import Breadcrumb from '../components/Breadcrumb';
import FileButton from '../components/FileButton';
import { fieldStyle, ghostBtnStyle } from '../styles/formStyles';

const RequiredMark = () => (
    <span aria-hidden="true" style={{ color: '#d32f2f', marginLeft: '3px', fontWeight: 700 }}>*</span>
);

const Create = () => {
    const { t, i18n } = useTranslation();
    const context = useApp() || {};
    const {
        cartels = [],
        addCartel,
        addCartelToSubsite,
        updateCartel,
        updateCartelInSubsite,
        deleteCartel,
        uploadImage,
        categories: globalCats = [],
        addLocalCategory,
        addWorkshop,
        isAdmin,
        isSuperadmin,
        homeSubsiteId,
        currentWorkshop,
        workshops = [],
    } = context;

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const routeParams = useParams();
    // Le slug provient de /site/:slug/create, ou du host dédié (paleo-h2o.org/create).
    const subsiteSlug = routeParams.slug || getHostSubsiteSlug() || null;
    const editId = searchParams.get('edit');
    const workshopIdParam = searchParams.get('workshopId');
    // location.state peut disparaître (reload, entrée via lien direct sans state,
    // certaines navigations hash). sessionStorage sert de filet pour préserver
    // les filtres du gestionnaire (ex. ?cat=énergie) au retour.
    const returnTo = location.state?.returnTo
        || readStoredReturnTo()
        || (subsiteSlug ? (subsiteBasePath(subsiteSlug) || '/') : '/app');

    // Clé de sauvegarde locale du formulaire (anti-perte réseau). Par contexte :
    // sous-site + nouveau/édition, pour ne jamais mélanger deux cartels distincts.
    const draftKey = `paleo_cartel_draft:${subsiteSlug || 'main'}:${editId || 'new'}`;

    const isEn = i18n.language === 'en';

    // Form initial extrait en fabrique : réutilisé par useState ET par le bouton
    // « repartir de zéro » qui réinitialise après récupération d'un brouillon local.
    const makeInitialForm = () => ({
        titre: '',
        titre_en: '',
        annee: '2025',
        description: '',
        description_en: '',
        exhume_par: '',
        categories: [],
        categories_en: [],
        url_qr: '',
        // Page détail "En savoir plus" éditable par blocs. Quand
        // use_internal_details=true, le bouton + le QR pointent vers /cartel/:id
        // au lieu de url_qr (cf. CartelPreview + zipGenerator).
        details_blocks: [],
        use_internal_details: false,
        location: '',
        location_en: '',
        lat: null,
        lng: null,
        image_path: '',
        workshopIds: workshopIdParam ? [workshopIdParam] : [],
        // Contact du soumissionnaire (visiteurs anonymes uniquement) : email
        // ou téléphone pour qu'on puisse le recontacter à propos de sa
        // proposition. Stocké en BDD via la colonne submitter_contact.
        submitter_contact: '',
        // Honeypot : toujours '' pour un humain. Si rempli, le backend rejette
        // la soumission (guard anti-bot côté submissionGuard).
        website: '',
    });

    const [form, setForm] = useState(makeInitialForm);

    const [imageFile, setImageFile] = useState(null);
    const [newCategory, setNewCategory] = useState('');
    const [showAllCats, setShowAllCats] = useState(false);
    const [newWorkshop, setNewWorkshop] = useState('');
    const [geoStatus, setGeoStatus] = useState('idle');
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [submitError, setSubmitError] = useState('');
    // Notice post-enregistrement : ce cartel était publié sur le site principal
    // et vient d'en être retiré + resoumis à validation (mode « strict »). On
    // diffère la navigation tant que l'owner n'a pas lu le message.
    const [revalNotice, setRevalNotice] = useState(false);
    // Vrai dès que l'utilisateur a modifié le form. Sert au garde-fou anti-perte
    // (handleBack + beforeunload). Reste false tant qu'on est sur le pré-remplissage
    // initial en mode edit (cf. useEffect editId plus bas).
    const [isDirty, setIsDirty] = useState(false);
    // Horodatage ISO d'un brouillon local récupéré → déclenche le bandeau d'info.
    // null tant qu'aucune récupération.
    const [restoredAt, setRestoredAt] = useState(null);
    const draftLoadedRef = useRef(false);
    const descRef = useRef(null);

    // beforeunload : bloque les refreshs / fermetures d'onglet si modifs en cours.
    // (Le garde-fou des navs internes est dans useBlocker plus bas.)
    // Le message lui-même est imposé par le navigateur (on ne peut pas le customiser
    // depuis ~2017), mais le simple fait de set returnValue déclenche la confirmation.
    useEffect(() => {
        if (!isDirty || isSaving) return;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty, isSaving]);

    // useBlocker intercepte la navigation interne (Link, navigate(), back btn).
    // Nécessite le data router (cf. App.jsx createBrowserRouter). On ne bloque
    // que les changements de chemin réels — un navigate vers la même URL passe.
    const blocker = useBlocker(
        useCallback(
            ({ currentLocation, nextLocation }) =>
                isDirty && !isSaving && currentLocation.pathname !== nextLocation.pathname,
            [isDirty, isSaving],
        ),
    );

    useEffect(() => {
        if (blocker.state !== 'blocked') return;
        if (window.confirm(t('create.confirmLeave', "Vous avez des modifications non enregistrées. Quitter sans publier ?"))) {
            blocker.proceed();
        } else {
            blocker.reset();
        }
    }, [blocker, t]);

    // Résolution paresseuse du nom du sous-site natif (pour le bandeau d'info
    // quand un utilisateur de sous-site crée un cartel depuis /app/create)
    const [homeSubsite, setHomeSubsite] = useState(null);
    useEffect(() => {
        // Pas besoin de fetcher si : route sous-site, superadmin, ou pas rattaché
        if (subsiteSlug || isSuperadmin || !homeSubsiteId) return;
        api.subsites.getAll()
            .then(list => setHomeSubsite((Array.isArray(list) ? list : []).find(s => s.id === homeSubsiteId) || null))
            .catch(() => {});
    }, [subsiteSlug, isSuperadmin, homeSubsiteId]);

    // Détection de langue mal saisie (heuristique)
    const [langMismatch, setLangMismatch] = useState(null); // { field, detectedLang, content } | null
    const dismissedRef = useRef({ title: '', desc: '' });   // dernier texte écarté par l'utilisateur par champ

    // Encouragement à renseigner le contact lors de la proposition (visiteur non connecté).
    // Le champ est facultatif côté DB et UI : si vide au moment du « Proposer », on
    // ouvre une modale qui explique l'intérêt sans forcer la saisie. Le visiteur peut
    // « renseigner » (focus sur le champ) ou « envoyer sans » (skip = on relance le submit).
    const [contactEncourage, setContactEncourage]   = useState(false);
    const skipContactPromptRef = useRef(false);
    const formRef       = useRef(null);
    const proposeBtnRef = useRef(null);
    const contactInputRef = useRef(null);

    const checkLangMismatch = (field, text) => {
        if (!text || dismissedRef.current[field] === text) return;
        const detected = detectWrongLanguage(text, i18n.language);
        if (detected) setLangMismatch({ field, detectedLang: detected, content: text });
    };

    const acceptLangSwitch = () => {
        if (!langMismatch) return;
        const target = langMismatch.detectedLang; // 'fr' ou 'en'
        // Déplace tous les champs actuellement remplis du côté courant vers le côté cible
        setForm(prev => {
            const next = { ...prev };
            if (target === 'en') {
                // Page FR → EN : déplace titre/description/location vers *_en
                if (prev.titre       && !prev.titre_en)       { next.titre_en       = prev.titre;       next.titre = ''; }
                if (prev.description && !prev.description_en) { next.description_en = prev.description; next.description = ''; }
                if (prev.location    && !prev.location_en)    { next.location_en    = prev.location;    next.location = ''; }
            } else {
                // Page EN → FR : déplace *_en vers titre/description/location
                if (prev.titre_en       && !prev.titre)       { next.titre       = prev.titre_en;       next.titre_en = ''; }
                if (prev.description_en && !prev.description) { next.description = prev.description_en; next.description_en = ''; }
                if (prev.location_en    && !prev.location)    { next.location    = prev.location_en;    next.location_en = ''; }
            }
            return next;
        });
        i18n.changeLanguage(target);
        setLangMismatch(null);
    };

    const dismissLangSwitch = () => {
        if (!langMismatch) return;
        dismissedRef.current[langMismatch.field] = langMismatch.content;
        setLangMismatch(null);
    };

    const insertMarkdown = (marker) => {
        const el = descRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const value = el.value;
        const selected = value.slice(start, end);
        const newValue = value.slice(0, start) + marker + selected + marker + value.slice(end);
        handleInputChange({ target: { name: 'desc_input', value: newValue } });
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + marker.length, end + marker.length);
        });
    };

    // Pré-remplissage initial en mode edit. On ne le fait qu'UNE seule fois,
    // sinon chaque refetch de `cartels` (déclenché par toutes les mutations du
    // contexte via fetchData) écrase silencieusement les modifs en cours de
    // l'utilisateur — y compris la prévisu d'image qu'il vient de choisir.
    const initializedRef = useRef(false);

    // ── Récupération du brouillon local au montage ───────────────
    // S'il existe, il représente des saisies non enregistrées (coupure réseau,
    // reload, onglet fermé) : il prime sur la version serveur, donc on bloque le
    // pré-remplissage edit en passant initializedRef à true.
    useEffect(() => {
        if (draftLoadedRef.current) return;
        draftLoadedRef.current = true;
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* JSON corrompu */ }
        if (!saved || !saved.form) return;
        // Purge d'un brouillon trop vieux (> 30 j) pour ne pas ressortir une
        // saisie oubliée ni encombrer le stockage indéfiniment.
        const ageMs = saved.savedAt ? (Date.now() - (Date.parse(saved.savedAt) || 0)) : 0;
        if (saved.savedAt && ageMs > 30 * 24 * 3600 * 1000) {
            try { localStorage.removeItem(draftKey); } catch { /* noop */ }
            return;
        }
        initializedRef.current = true; // empêche l'écrasement par le prefill serveur
        setForm(prev => ({
            ...prev,
            ...saved.form,
            // Le blob de prévisualisation d'image ne survit pas au reload : on
            // retombe sur l'éventuel chemin déjà uploadé, sinon vide.
            imageUrl: saved.form.image_path || '',
        }));
        setIsDirty(true);
        setRestoredAt(saved.savedAt || true);
    }, [draftKey]);

    // ── Sauvegarde locale à chaque frappe (debounce) ─────────────
    // On n'écrit qu'une fois le form « sale » pour ne pas stocker le squelette
    // vide à chaque ouverture. try/catch : quota plein ou navigation privée.
    useEffect(() => {
        if (!isDirty) return;
        const id = setTimeout(() => {
            try {
                const snapshot = { ...form };
                delete snapshot.imageUrl; // blob de prévisu non sérialisable utilement
                localStorage.setItem(draftKey, JSON.stringify({ form: snapshot, savedAt: new Date().toISOString() }));
            } catch { /* on abandonne sans bruit */ }
        }, 600);
        return () => clearTimeout(id);
    }, [form, isDirty, draftKey]);

    // « Repartir de zéro » : oublie le brouillon local et restaure l'état initial
    // (form vierge en création, version serveur en édition).
    const discardLocalDraft = () => {
        try { localStorage.removeItem(draftKey); } catch { /* noop */ }
        setRestoredAt(null);
        setIsDirty(false);
        setImageFile(null);
        if (editId) {
            const existing = cartels.find(c => c.id === editId);
            if (existing) {
                setForm(prev => ({
                    ...prev,
                    ...existing,
                    imageUrl: existing.image_path || '',
                    categories: existing.categories || [],
                    categories_en: existing.categories_en || [],
                    workshopIds: existing.workshopIds || [],
                }));
            }
        } else {
            setForm(makeInitialForm());
        }
    };

    useEffect(() => {
        if (!editId || initializedRef.current) return;
        const existing = cartels.find(c => c.id === editId);
        if (!existing) return;
        initializedRef.current = true;
        setForm(prev => ({
            ...prev,
            ...existing,
            imageUrl: existing.image_path || '',
            categories: existing.categories || [],
            categories_en: existing.categories_en || [],
            workshopIds: existing.workshopIds || [],
        }));
        if (existing.lat != null && existing.lng != null) setGeoStatus('success');
    }, [editId, cartels]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'title_input') {
            setForm(prev => ({ ...prev, [isEn ? 'titre_en' : 'titre']: value }));
        } else if (name === 'desc_input') {
            setForm(prev => ({ ...prev, [isEn ? 'description_en' : 'description']: value }));
        } else if (name === 'location') {
            setForm(prev => ({ ...prev, [isEn ? 'location_en' : 'location']: value }));
            setGeoStatus('idle');
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGeocode = async () => {
        const loc = isEn ? form.location_en : form.location;
        if (!loc) return;
        setGeoStatus('loading');
        const result = await geocodingService.search(loc);
        if (result) {
            setForm(prev => ({ ...prev, coords: { lat: result.lat, lng: result.lng }, lat: result.lat, lng: result.lng }));
            setGeoStatus('success');
        } else {
            setGeoStatus('error');
            setForm(prev => ({ ...prev, coords: null, lat: null, lng: null }));
        }
    };

    // Les toggles boutons ne déclenchent pas onChange du <form> : on doit
    // marquer dirty manuellement pour que le garde-fou anti-perte fonctionne.
    const handleCategoryToggle = (cat) => {
        setIsDirty(true);
        setForm(prev => {
            const cats = prev.categories || [];
            if (cats.includes(cat)) return { ...prev, categories: cats.filter(c => c !== cat) };
            return { ...prev, categories: [...cats, cat] };
        });
    };

    const handleAddCategory = () => {
        if (newCategory) {
            addLocalCategory(newCategory);
            if (!form.categories.includes(newCategory)) {
                setIsDirty(true);
                setForm(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
            }
            setNewCategory('');
        }
    };

    const handleAddWorkshop = async () => {
        const name = newWorkshop.trim();
        if (!name || !isAdmin || !addWorkshop) return;

        const createdWorkshopId = await addWorkshop(name);
        if (createdWorkshopId) {
            setIsDirty(true);
            setForm(prev => {
                const current = new Set((prev.workshopIds || []).map(String));
                current.add(String(createdWorkshopId));
                return { ...prev, workshopIds: Array.from(current) };
            });
            setNewWorkshop('');
        }
    };

    const handleWorkshopToggle = (id) => {
        setIsDirty(true);
        setForm(prev => {
            const current = new Set((prev.workshopIds || []).map(String));
            const key = String(id);
            if (current.has(key)) current.delete(key);
            else current.add(key);
            return { ...prev, workshopIds: Array.from(current) };
        });
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setForm(prev => ({ ...prev, imageUrl: url }));
            try {
                setStatusMsg(t('create.optimizingImage'));
                const compressed = await compressImage(file);
                setImageFile(compressed);
                setStatusMsg("");
            } catch (err) {
                console.error("Compression failed", err);
                setImageFile(file);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // Filet de sécurité : si l'utilisateur clique Publier sans sortir du champ,
        // onBlur ne déclenche pas à temps (le formulaire navigue avant que le modal
        // soit visible). On vérifie donc titre + description au submit et on bloque
        // jusqu'à la décision (bascule de langue ou "continuer").
        const pairs = [
            ['title', isEn ? form.titre_en : form.titre],
            ['desc',  isEn ? form.description_en : form.description],
        ];
        for (const [field, text] of pairs) {
            if (!text || dismissedRef.current[field] === text) continue;
            const detected = detectWrongLanguage(text, i18n.language);
            if (detected) {
                setLangMismatch({ field, detectedLang: detected, content: text });
                return;
            }
        }

        const action = e.nativeEvent.submitter.name;

        // Visiteur anonyme qui propose un cartel sans avoir renseigné de contact :
        // on n'empêche plus l'envoi, mais on ouvre une modale qui explique l'intérêt
        // (nous recontacter à propos du cartel, jamais publié). Le visiteur choisit
        // ensuite de renseigner ou d'envoyer sans. Le ref garde la décision pour la
        // relance via formRef.requestSubmit() (sinon on reboucle indéfiniment).
        if (!isAdmin && action === 'propose'
            && !(form.submitter_contact || '').trim()
            && !skipContactPromptRef.current) {
            setContactEncourage(true);
            return;
        }

        setIsSaving(true);
        setStatusMsg(t('create.processing'));
        await new Promise(r => setTimeout(r, 100));

        let data = { ...form };

        // IMAGE UPLOAD
        setStatusMsg(t('create.uploading', "Sauvegarde..."));
        let finalImagePath = form.image_path;
        if (imageFile) {
            try {
                finalImagePath = await uploadImage(imageFile);
            } catch (err) {
                alert(t('messages.imageUploadError') + err.message);
                setIsSaving(false);
                return;
            }
        }

        // Atelier
        const activeWorkshopCtx = currentWorkshop || null;

        const entry = {
            id: editId || String(Date.now()),
            ...data,
            annee: data.annee || '2025',
            image_path: finalImagePath,
            date: data.date || new Date().toISOString().split('T')[0],
            created_at: data.created_at || new Date().toISOString()
        };
        delete entry.imageUrl;
        delete entry.coords;
        entry.workshop_ids = Array.isArray(form.workshopIds) ? form.workshopIds : [];

        if (activeWorkshopCtx) {
            entry.origin = activeWorkshopCtx.name;
            entry.workshopId = activeWorkshopCtx.id;
        }

        // Sur création initiale d'un cartel admin, auto-traduire le côté manquant.
        // Détection automatique de la direction : si FR rempli et EN vide → FR→EN ;
        // si EN rempli et FR vide → EN→FR.
        if (!editId && isAdmin) {
            const hasFrContent = [entry.titre, entry.description, entry.location].some(v => (v || '').trim() !== '');
            const hasEnContent = [entry.titre_en, entry.description_en, entry.location_en].some(v => (v || '').trim() !== '');
            const needsEn = [entry.titre_en, entry.description_en, entry.location_en].some(v => (v || '').trim() === '');
            const needsFr = [entry.titre, entry.description, entry.location].some(v => (v || '').trim() === '');

            if (hasFrContent && !hasEnContent && needsEn) {
                // FR → EN (comportement historique)
                setStatusMsg(t('create.translating'));
                try {
                    const translated = await api.translate.cartel({
                        titre: entry.titre || '',
                        description: entry.description || '',
                        location: entry.location || '',
                    }, { target: 'en' });
                    entry.titre_en       = translated.titre_en       || entry.titre_en       || '';
                    entry.description_en = translated.description_en || entry.description_en || '';
                    entry.location_en    = translated.location_en    || entry.location_en    || '';
                } catch (err) {
                    console.error('Auto translation FR→EN failed', err);
                    alert(t('messages.autoTranslateWarning') + err.message);
                }
            } else if (hasEnContent && !hasFrContent && needsFr) {
                // EN → FR
                setStatusMsg(t('create.translating'));
                try {
                    const translated = await api.translate.cartel({
                        titre: entry.titre_en || '',
                        description: entry.description_en || '',
                        location: entry.location_en || '',
                    }, { target: 'fr' });
                    entry.titre       = translated.titre       || entry.titre       || '';
                    entry.description = translated.description || entry.description || '';
                    entry.location    = translated.location    || entry.location    || '';
                } catch (err) {
                    console.error('Auto translation EN→FR failed', err);
                    alert(t('messages.autoTranslateWarning') + err.message);
                }
            }
        }

        // Détection de re-validation : si on édite un cartel déjà publié sur le
        // site principal, le serveur peut le retirer + le resoumettre (réglage
        // « strict »). On capture l'état AVANT pour comparer à la réponse.
        let requeuedForMain = false;
        const wasVisibleOnMain = editId
            ? !!cartels.find(c => c.id === editId)?.visible_on_main
            : false;

        try {
            if (editId) {
                // Mise à jour d'un cartel existant
                if (isAdmin && action === 'publish') {
                    entry.status = 'published';
                } else if (isAdmin) {
                    // Admin garde le statut actuel ou force draft
                    entry.status = entry.status || 'draft';
                } else {
                    // Visiteur non admin : toujours une proposition (le serveur
                    // force pending_review de toute façon — cf. resolveCreateStatus).
                    entry.status = 'pending_review';
                }
                const updated = subsiteSlug
                    ? await updateCartelInSubsite(subsiteSlug, entry)
                    : await updateCartel(entry);
                // updateCartel retourne null en cas d'échec (alert déjà affiché) :
                // on reste sur la page pour que l'utilisateur voie le bandeau.
                if (updated == null) {
                    setSubmitError(t('errors.updateFailedRetry', "La mise à jour a échoué. Vos modifications n'ont pas été enregistrées."));
                    setIsSaving(false);
                    return;
                }
                // Le serveur a retiré le cartel du principal pour re-validation
                // (était visible_on_main, ne l'est plus, et repart en file).
                requeuedForMain = wasVisibleOnMain && !updated.visible_on_main && !!updated.submitted_to_main_at;
            } else {
                // Nouveau cartel
                if (isAdmin) {
                    entry.status = action === 'publish' ? 'published' : 'draft';
                } else {
                    // Visiteur non admin : toujours une proposition (le serveur
                    // force pending_review de toute façon — cf. resolveCreateStatus).
                    entry.status = 'pending_review';
                }
                if (subsiteSlug) {
                    await addCartelToSubsite(subsiteSlug, entry);
                } else {
                    await addCartel(entry);
                }
            }
        } catch (err) {
            // Échec de création/soumission : on reste sur la page avec un bandeau
            // explicite. Surtout ne PAS naviguer — sinon le visiteur croit que sa
            // proposition est partie alors qu'elle a été rejetée (rate limit, etc.).
            setSubmitError(t('errors.submitFailedRetry', { msg: err?.message || 'Erreur inconnue' }));
            setIsSaving(false);
            return;
        }

        setIsDirty(false);
        setIsSaving(false);
        // Succès only : le brouillon local a rempli son rôle, on le purge. (Sur
        // échec/retour anticipé plus haut, on le GARDE pour permettre le retry.)
        try { localStorage.removeItem(draftKey); } catch { /* noop */ }
        // Cartel retiré du principal pour re-validation : on diffère la navigation
        // et on affiche un message explicatif (le modal navigue à la fermeture).
        if (requeuedForMain) {
            setRevalNotice(true);
            return;
        }
        clearReturnTo();
        navigate(returnTo);
    };

    return (
        <div className="container" style={{ paddingBottom: '100px', maxWidth: '720px', margin: '0 auto' }}>
            {isSaving && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h3>{statusMsg || t('common.loading', 'Chargement...')}</h3>
                </div>
            )}

            {/* Notice de re-validation : le cartel a été retiré du site principal */}
            {revalNotice && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reval-notice-title"
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <div style={{
                        background: 'var(--color-surface, #fff)',
                        borderRadius: '14px',
                        maxWidth: '460px', width: '100%',
                        padding: '26px 26px 22px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                        borderTop: '5px solid var(--color-warning, #e0a000)',
                    }}>
                        <h3 id="reval-notice-title" style={{ margin: '0 0 12px', fontSize: '1.15rem' }}>
                            {t('create.revalNoticeTitle', 'Cartel retiré du site principal')}
                        </h3>
                        <p style={{ margin: '0 0 18px', fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--color-text-muted, #555)' }}>
                            {t('create.revalNoticeBody', "Vos modifications ont bien été enregistrées et restent visibles sur votre sous-site. Comme ce cartel était aussi publié sur le site principal, il en a été retiré le temps qu'un·e responsable le revalide. Il y réapparaîtra une fois la validation effectuée.")}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => { setRevalNotice(false); clearReturnTo(); navigate(returnTo); }}
                                style={{
                                    border: 'none', borderRadius: '10px',
                                    padding: '11px 22px', cursor: 'pointer',
                                    background: 'var(--color-primary, #2a6)', color: '#fff',
                                    fontWeight: '700', fontSize: '0.9rem',
                                }}
                            >
                                {t('create.revalNoticeOk', 'Compris')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fil d'Ariane : libellé du parent inféré du contexte (sous-site vs
                site principal, gestion vs frise). onClick conserve l'appel à
                clearReturnTo pour ne pas laisser un sessionStorage périmé. */}
            {(() => {
                const inSubsiteAdmin  = subsiteSlug && returnTo.includes('/admin');
                const inMainManage    = !subsiteSlug && returnTo.includes('/manage');
                const parentLabel = subsiteSlug
                    ? (inSubsiteAdmin ? t('manageCartels.title', 'Gestion') : t('subsiteFrise.title', 'Frise'))
                    : (inMainManage   ? t('manageCartels.title', 'Gestion') : t('library.title', 'Bibliothèque'));
                const crumbs = subsiteSlug
                    ? [
                        { label: t('subsite.navHome', 'Accueil'), href: subsiteBasePath(subsiteSlug) || '/' },
                        { label: parentLabel, href: returnTo, onClick: clearReturnTo },
                      ]
                    : [
                        { label: t('siteLayout.home', 'Accueil'), href: '/' },
                        { label: parentLabel, href: returnTo, onClick: clearReturnTo },
                      ];
                const current = editId
                    ? t('messages.editCartel', 'Modifier le cartel')
                    : t('create.pageTitle', 'Nouveau cartel');
                return <Breadcrumb crumbs={crumbs} current={current} />;
            })()}

            <h2>{editId ? t('messages.editCartel', 'Modifier le cartel') : t('create.pageTitle', 'Nouveau cartel')}</h2>

            {submitError && (
                <div
                    role="alert"
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: '#fff0f0', border: '1px solid #f5c2c7',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '14px',
                        color: '#842029', fontSize: '0.9rem', lineHeight: '1.5',
                    }}
                >
                    <AlertTriangle size={18} color="#c0392b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <strong>{t('errors.submitFailedTitle', "Votre cartel n'a pas été enregistré.")}</strong>
                        <div style={{ marginTop: '4px' }}>{submitError}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSubmitError('')}
                        aria-label={t('common.close', 'Fermer')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#842029', padding: 0 }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Bandeau : un brouillon local a été restauré après une coupure/un reload */}
            {restoredAt && (
                <div
                    role="status"
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: '#e8f5e9', border: '1px solid #a5d6a7',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '14px',
                        color: '#1b5e20', fontSize: '0.9rem', lineHeight: '1.5',
                    }}
                >
                    <Info size={18} color="#2e7d32" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <strong>{t('create.draftRestoredTitle', 'Brouillon récupéré')}</strong>
                        <div style={{ marginTop: '4px' }}>
                            {t('create.draftRestoredBody', "Une saisie non enregistrée a été retrouvée sur cet appareil et restaurée. Si vous aviez ajouté une image, pensez à la re-sélectionner.")}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={discardLocalDraft}
                        style={{ flexShrink: 0, background: 'none', border: '1px solid #a5d6a7', borderRadius: '6px', cursor: 'pointer', color: '#1b5e20', padding: '4px 8px', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                        {t('create.draftRestoredDiscard', 'Repartir de zéro')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRestoredAt(null)}
                        aria-label={t('common.close', 'Fermer')}
                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#1b5e20', padding: 0 }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Info discret : l'utilisateur est rattaché à un sous-site et ne le sait peut-être pas */}
            {!subsiteSlug && !editId && homeSubsite && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    background: '#fce4ec', border: '1px solid #f8bbd0',
                    borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
                    color: '#1a1a1a', fontSize: '0.85rem', lineHeight: '1.5',
                }}>
                    <Info size={16} color="#c2185b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        Votre cartel sera publié sur le sous-site <strong>{homeSubsite.name}</strong>, pas sur le site principal.
                        {' '}
                        <button
                            type="button"
                            onClick={() => navigate(`${subsiteBasePath(homeSubsite.slug)}/create`)}
                            style={{ background: 'none', border: 'none', color: '#c2185b', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            Passer en vue sous-site →
                        </button>
                    </div>
                </div>
            )}

            <form
                ref={formRef}
                onSubmit={handleSubmit}
                onChange={() => setIsDirty(true)}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >

                {/* Honeypot anti-bot : champ invisible à l'œil nu et aux lecteurs d'écran,
                    mais présent dans le DOM. Les scrapers le remplissent → le serveur
                    rejette. Nom "website" choisi pour paraître légitime aux yeux d'un bot. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
                    <label>
                        Website (leave empty)
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={form.website || ''}
                            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                        />
                    </label>
                </div>

                {/* Title */}
                <div>
                    <label>{t('create.fieldTitle')}<RequiredMark /></label>
                    <input
                        name="title_input"
                        value={isEn ? form.titre_en : form.titre}
                        onChange={handleInputChange}
                        onBlur={e => checkLangMismatch('title', e.target.value)}
                        required
                        style={fieldStyle}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label>{t('create.fieldYear')}</label>
                        <input name="annee" value={form.annee} onChange={handleInputChange} style={fieldStyle} />
                    </div>
                    <div>
                        <label>{t('create.fieldExhume')}</label>
                        <input name="exhume_par" value={form.exhume_par} onChange={handleInputChange} style={fieldStyle} />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {t('create.fieldLocation')}
                        <span
                            tabIndex={0}
                            title={t('create.fieldLocationHelp')}
                            aria-label={t('create.fieldLocationHelp')}
                            style={{ display: 'inline-flex', cursor: 'help', color: '#c2185b' }}
                        >
                            <Info size={14} aria-hidden="true" />
                        </span>
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                name="location"
                                value={isEn ? (form.location_en || '') : (form.location || '')}
                                onChange={handleInputChange}
                                placeholder={t('create.fieldLocationPlaceholder')}
                                style={{ ...fieldStyle, paddingRight: '30px' }}
                                onBlur={handleGeocode}
                            />
                            {geoStatus === 'success' && <Check size={16} color="green" style={{ position: 'absolute', right: 8, top: 10 }} />}
                            {geoStatus === 'error' && <X size={16} color="red" style={{ position: 'absolute', right: 8, top: 10 }} />}
                        </div>
                        <button type="button" onClick={handleGeocode} disabled={geoStatus === 'loading'} style={{ ...ghostBtnStyle, padding: '9px' }}>
                            <MapPin size={20} />
                        </button>
                    </div>
                    {geoStatus === 'success' && form.lat != null && <small style={{ color: 'green' }}>{t('create.located')} : {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</small>}
                    {geoStatus === 'error' && <small style={{ color: 'red' }}>{t('create.notFound')}</small>}
                </div>

                {/* Description */}
                <div>
                    <label>{t('create.fieldDesc')}</label>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <button
                            type="button"
                            onClick={() => insertMarkdown('**')}
                            title={t('create.boldTitle', 'Gras (** … **)')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f8f8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'inherit' }}
                        >
                            <Bold size={13} /> {t('create.boldBtn', 'Gras')}
                        </button>
                        <button
                            type="button"
                            onClick={() => insertMarkdown('*')}
                            title={t('create.italicTitle', 'Italique (* … *)')}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f8f8', cursor: 'pointer', fontSize: '0.8rem', fontStyle: 'italic', fontFamily: 'inherit' }}
                        >
                            <Italic size={13} /> {t('create.italicBtn', 'Italique')}
                        </button>
                    </div>
                    {(() => {
                        const descText = (isEn ? form.description_en : form.description) || '';
                        const descLen = descText.length;
                        const descOver = descLen > 1500;
                        return (
                            <>
                                <textarea
                                    ref={descRef}
                                    name="desc_input"
                                    value={descText}
                                    onChange={handleInputChange}
                                    onBlur={e => checkLangMismatch('desc', e.target.value)}
                                    rows={10}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: `1px solid ${descOver ? '#d32f2f' : '#ccc'}`,
                                        outline: descOver ? '1px solid #d32f2f' : undefined,
                                        borderRadius: '4px',
                                    }}
                                />
                                <div style={{
                                    textAlign: 'right',
                                    fontSize: '0.8em',
                                    color: descOver ? '#d32f2f' : '#666',
                                    fontWeight: descOver ? 700 : 'normal',
                                    marginTop: '4px',
                                }}>
                                    {descOver
                                        ? t('create.descOverLimit', { count: descLen - 1500, total: descLen, defaultValue: `⚠︎ ${descLen - 1500} caractère(s) en trop — ${descLen} / 1500` })
                                        : `${1500 - descLen} / 1500`}
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Image */}
                <div style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '10px', background: '#f9f9f9', textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>{t('create.fieldImage')}</label>
                    <FileButton onChange={handleImageChange} />
                    {form.imageUrl && (
                        <div style={{ marginTop: '15px', maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img src={form.imageUrl} alt="Previsu" style={{ maxWidth: '300px', maxHeight: '300px', width: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                        </div>
                    )}
                    <div style={{ marginTop: '10px', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.9em', color: '#666' }}>{t('create.imageCredit', "Crédit Image")}</label>
                        <input
                            name="imageCredit"
                            value={form.imageCredit || ''}
                            onChange={handleInputChange}
                            placeholder={t('create.imageCreditPlaceholder')}
                            style={{ ...fieldStyle, marginTop: '8px' }}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <label>{t('create.fieldCategories')}</label>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                        {t('create.fieldCategoriesHint', 'Cliquez sur les catégories correspondantes.')}
                    </p>
                    {(() => {
                        const allCatNames = Array.from(new Set([
                            // Catégories globales = objets {id, name, ...} → on extrait .name
                            ...(globalCats || []).map(c => (typeof c === 'object' ? c.name : c)),
                            ...(form.categories || []),
                        ]));
                        const LIMIT = 12;
                        const collapsed = !showAllCats && allCatNames.length > LIMIT;
                        // En replié : on garde les premières + TOUJOURS les sélectionnées.
                        const shown = collapsed
                            ? allCatNames.filter((n, i) => i < LIMIT || (form.categories || []).includes(n))
                            : allCatNames;
                        const hiddenCount = allCatNames.length - shown.length;
                        return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                {shown.map(catName => {
                                    const active = (form.categories || []).includes(catName);
                                    return (
                                        <button
                                            type="button"
                                            key={catName}
                                            onClick={() => handleCategoryToggle(catName)}
                                            aria-pressed={active}
                                            style={{
                                                backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                                color: active ? 'var(--color-white)' : 'var(--color-text)',
                                                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                borderRadius: '999px',
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: '0.78rem',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px',
                                                padding: '5px 12px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.12s, color 0.12s, border-color 0.12s',
                                            }}
                                        >
                                            {catName}
                                        </button>
                                    );
                                })}
                                {(collapsed || (showAllCats && allCatNames.length > LIMIT)) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllCats(v => !v)}
                                        aria-expanded={!collapsed}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: 'var(--color-primary)',
                                            border: '1px dashed var(--color-border)',
                                            borderRadius: '999px',
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.4px',
                                            padding: '5px 12px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {collapsed ? `+${hiddenCount}` : t('create.showLessCategories', 'Réduire')}
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <input placeholder={t('common.otherCategory')} value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
                        <button type="button" onClick={handleAddCategory} style={ghostBtnStyle}>{t('common.add')}</button>
                    </div>
                </div>

                {isAdmin && (
                    <div>
                        <label>{t('create.fieldWorkshops')}</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {workshops.length > 0 ? workshops.map(workshop => {
                                const active = (form.workshopIds || []).map(String).includes(String(workshop.id));
                                return (
                                    <button
                                        key={workshop.id}
                                        type="button"
                                        onClick={() => handleWorkshopToggle(workshop.id)}
                                        style={{
                                            backgroundColor: active ? '#1a1a1a' : 'transparent',
                                            color: active ? 'white' : '#333',
                                            border: '1px solid #ccc',
                                            borderRadius: '15px',
                                            fontSize: '0.8rem',
                                            padding: '4px 10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {workshop.name}
                                    </button>
                                );
                            }) : <small style={{ color: '#888' }}>{t('create.noWorkshops')}</small>}
                        </div>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                            <input
                                placeholder={t('create.newWorkshopPlaceholder')}
                                value={newWorkshop}
                                onChange={e => setNewWorkshop(e.target.value)}
                                style={{ ...fieldStyle, flex: 1 }}
                            />
                            <button type="button" onClick={handleAddWorkshop} disabled={!newWorkshop.trim()} style={{ ...ghostBtnStyle, opacity: newWorkshop.trim() ? 1 : 0.5 }}>{t('common.add')}</button>
                        </div>
                        <small style={{ color: '#777' }}>{t('create.workshopHelp')}</small>
                    </div>
                )}

                <div>
                    <label>{t('create.fieldUrlQR')}</label>
                    <input name="url_qr" value={form.url_qr} onChange={handleInputChange} style={fieldStyle} />
                    <small style={{ color: '#777', display: 'block', marginTop: '4px', fontSize: '0.82rem' }}>
                        {t('create.qrHint', "Lien externe affiché par le bouton « En savoir plus » et encodé dans le QR code à l'impression.")}
                    </small>
                </div>

                {/* Page détail "En savoir plus" éditable (admin uniquement).
                    Fond jaune clair (var --color-accent-soft) pour séparer
                    visuellement cette zone du reste du formulaire — plus
                    contrasté que le gris ambiant. */}
                {isAdmin && (
                    <div style={{ border: '1px solid #f0e2a0', borderRadius: '12px', padding: '16px', background: 'var(--color-accent-soft)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={!!form.use_internal_details}
                                onChange={e => { setForm(prev => ({ ...prev, use_internal_details: e.target.checked })); setIsDirty(true); }}
                            />
                            {t('create.internalPageLabel', 'Utiliser une page « En savoir plus » interne')}
                        </label>
                        <small style={{ color: '#777', display: 'block', margin: '4px 0 12px 24px', fontSize: '0.82rem' }}>
                            {t('create.internalPageHelp', 'Si coché, le bouton et le QR pointent vers une page éditable hébergée sur le site au lieu du lien externe ci-dessus.')}
                        </small>
                        {form.use_internal_details && (
                            <div style={{ marginTop: '8px' }}>
                                <BlockEditor
                                    blocks={Array.isArray(form.details_blocks) ? form.details_blocks : []}
                                    onChange={(next) => { setForm(prev => ({ ...prev, details_blocks: next })); setIsDirty(true); }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Notes admin internes (uniquement en édition) */}
                {isAdmin && editId && (
                    <CartelNotesPanel cartelId={editId} subsiteSlug={subsiteSlug} />
                )}

                {/* Contact :
                    - Visiteur non connecté : obligatoire (seul moyen de le recontacter).
                    - Admin connecté : optionnel, utile pour saisir un cartel au nom
                      d'une autre personne (l'auteur réel n'est pas l'utilisateur
                      connecté). Si vide, on retombe sur l'email du compte. */}
                <div>
                    <label htmlFor="submitter_contact">
                        {isAdmin
                            ? t('create.fieldContactOptional', "Contact de l'auteur (email ou téléphone)")
                            : t('create.fieldContact', 'Votre contact (email ou téléphone)')}
                    </label>
                    <input
                        ref={contactInputRef}
                        id="submitter_contact"
                        name="submitter_contact"
                        type="text"
                        value={form.submitter_contact || ''}
                        onChange={handleInputChange}
                        maxLength={255}
                        placeholder={t('create.fieldContactPlaceholder', 'ex: vous@exemple.org ou 06 12 34 56 78')}
                        style={fieldStyle}
                    />
                    <small style={{ color: '#777', display: 'block', marginTop: '4px', fontSize: '0.82rem', lineHeight: 1.4 }}>
                        {isAdmin
                            ? t('create.fieldContactAdminHelp', "Renseignez si vous saisissez un cartel pour quelqu'un d'autre. Laissez vide si vous êtes l'auteur·rice.")
                            : t('create.fieldContactHelp', 'Facultatif — utile pour vous recontacter au sujet de votre proposition. Jamais affiché publiquement. ')}
                        {!isAdmin && (
                            <Link to="/politique-confidentialite" style={{ color: '#555', textDecoration: 'underline' }}>
                                {t('create.fieldContactPolicyLink', 'Politique de confidentialité')}
                            </Link>
                        )}
                    </small>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {isAdmin && (
                        <>
                            <button type="submit" name="save" disabled={isSaving} style={{ flex: 1, backgroundColor: '#555', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Save /> {isSaving ? statusMsg : t('create.saveDraft')}
                            </button>
                            <button type="submit" name="publish" disabled={isSaving} style={{ flex: 1, backgroundColor: 'black', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                                <Save /> {isSaving ? statusMsg : (editId ? t('create.btnSave') : t('manageCartels.publish'))}
                            </button>
                        </>
                    )}
                    {!isAdmin && (
                        <button ref={proposeBtnRef} type="submit" name="propose" disabled={isSaving} style={{ flex: 1, backgroundColor: 'var(--color-pink-darker, #C2185B)', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}>
                            <Check /> {t('create.sendProposal')}
                        </button>
                    )}
                </div>
            </form>

            {/* Modal : langue mal saisie */}
            {langMismatch && (
                <div
                    onClick={dismissLangSwitch}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '14px', padding: '28px',
                            maxWidth: '460px', width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff4e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={20} color="#e67e00" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                                {t('create.langMismatchTitle', 'Langue différente détectée')}
                            </h3>
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#333', lineHeight: '1.5' }}>
                            {langMismatch.detectedLang === 'en'
                                ? t('create.langMismatchEnOnFr', 'Il semble que vous écrivez en anglais sur la page française. Basculez vers la page anglaise pour saisir les champs anglais, votre texte sera déplacé.')
                                : t('create.langMismatchFrOnEn', 'Il semble que vous écrivez en français sur la page anglaise. Basculez vers la page française pour saisir les champs français, votre texte sera déplacé.')}
                        </p>
                        <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: '#888' }}>
                            {t('create.langMismatchHint', 'Astuce : utilisez le sélecteur de langue en haut à droite pour basculer manuellement à tout moment.')}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={dismissLangSwitch}
                                style={{
                                    padding: '9px 16px', borderRadius: '8px',
                                    border: '1px solid #ddd', background: 'white',
                                    color: '#555', cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '600',
                                }}
                            >
                                {t('create.langMismatchDismiss', 'Non, continuer')}
                            </button>
                            <button
                                type="button"
                                onClick={acceptLangSwitch}
                                style={{
                                    padding: '9px 16px', borderRadius: '8px',
                                    border: 'none', background: '#e67e00', color: 'white',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '700',
                                }}
                            >
                                {t('create.langMismatchConfirm', 'Oui, basculer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal : encouragement à renseigner le contact (visiteur anonyme) */}
            {contactEncourage && (
                <div
                    onClick={() => setContactEncourage(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '14px', padding: '28px',
                            maxWidth: '460px', width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff4e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={20} color="#e67e00" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                                {t('create.contactEncourageTitle', 'Un e-mail pour vous recontacter ?')}
                            </h3>
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#333', lineHeight: '1.5' }}>
                            {t('create.contactEncourageBody', "Ajouter votre e-mail nous permet de vous recontacter au sujet de votre proposition (précisions, sources, attribution). Il ne sera jamais affiché publiquement.")}
                        </p>
                        <p style={{ margin: '0 0 18px', fontSize: '0.8rem', color: '#888' }}>
                            {t('create.contactEncourageHint', 'Vous pouvez aussi envoyer sans, mais on ne pourra plus revenir vers vous.')}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    skipContactPromptRef.current = true;
                                    setContactEncourage(false);
                                    // Petit délai pour laisser React fermer la modale avant de
                                    // relancer le submit (sinon requestSubmit court-circuite
                                    // l'unmount et le focus reste piégé sur le bouton).
                                    setTimeout(() => formRef.current?.requestSubmit(proposeBtnRef.current), 0);
                                }}
                                style={{
                                    padding: '9px 16px', borderRadius: '8px',
                                    border: '1px solid #ddd', background: 'white',
                                    color: '#555', cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '600',
                                }}
                            >
                                {t('create.contactEncourageSkip', 'Envoyer sans e-mail')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setContactEncourage(false);
                                    setTimeout(() => contactInputRef.current?.focus(), 0);
                                }}
                                style={{
                                    padding: '9px 16px', borderRadius: '8px',
                                    border: 'none', background: '#e67e00', color: 'white',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: '700',
                                }}
                            >
                                {t('create.contactEncourageFill', 'Renseigner mon e-mail')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Create;
