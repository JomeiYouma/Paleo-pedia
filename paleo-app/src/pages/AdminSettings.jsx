import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Shield, Users, Key,
    ToggleLeft, ToggleRight, AlertCircle, CheckCircle2, Check,
    Globe, Plus, Trash2, Edit, ExternalLink, ChevronDown, ChevronUp,
    FolderOpen, Activity, Target,
} from 'lucide-react';
import api from '../services/apiClient';
import i18n from '../i18n';
import SubsiteEditor from '../components/SubsiteEditor';

// ── Composants de formulaire ─────────────────────────────────
const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '4px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
        </label>
        {hint && <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>{hint}</p>}
        {children}
    </div>
);

// `onCommit(clampedNumber)` est appelé au blur : c'est le moment de la
// sauvegarde automatique (on ne persiste pas à chaque frappe). La valeur est
// bornée à [min, max] avant d'être remontée, pour ne jamais enregistrer un
// champ vide/hors limites.
const NumberInput = ({ value, onChange, onCommit, min = 0, max = 9999, suffix }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={e => {
                const clamped = Math.min(max, Math.max(min, Number(e.target.value) || min));
                if (clamped !== Number(value)) onChange(clamped);
                onCommit?.(clamped);
            }}
            min={min}
            max={max}
            style={{
                width: '100px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
                fontWeight: '700',
                textAlign: 'center',
                fontFamily: 'inherit',
            }}
        />
        {suffix && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{suffix}</span>}
    </div>
);

const Toggle = ({ value, onChange, label }) => (
    <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            fontFamily: 'inherit',
        }}
    >
        {value
            ? <ToggleRight size={32} color="var(--color-success)" />
            : <ToggleLeft size={32} color="var(--color-border-strong)" />
        }
        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: value ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {value ? i18n.t('adminSettings.toggleEnabled', 'Activé') : i18n.t('adminSettings.toggleDisabled', 'Désactivé')}
        </span>
        {label && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>— {label}</span>}
    </button>
);

// ── Groupe thématique : titre + bandeau coloré qui rassemble plusieurs Section ──
// On regroupe pour que la page de réglages soit lisible d'un coup d'œil :
// l'œil sait où chercher Contenu / Communauté / Système.
const Group = ({ title, color, children }) => (
    <section style={{ marginBottom: '40px' }} aria-label={title}>
        <header style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            margin: '0 0 16px',
            paddingLeft: '10px',
            borderLeft: `4px solid ${color}`,
        }}>
            <h2 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontFamily: 'var(--font-display)',
                color: color,
                letterSpacing: '0.04em',
            }}>{title}</h2>
        </header>
        {children}
    </section>
);

// ── Champ "clé API" (réutilisé pour OpenAI et DeepL) ─────────
// La clé est enregistrée automatiquement au blur via `onCommit` (plus de
// bouton « Enregistrer » : on ne persiste jamais une clé à moitié collée).
const ApiKeyField = ({ label, hint, placeholder, value, onChange, onCommit, show, onToggleShow, detect }) => (
    <Field label={label} hint={hint}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                onBlur={() => onCommit?.(value)}
                placeholder={placeholder}
                style={{
                    flex: 1,
                    minWidth: '260px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                }}
            />
            <button
                onClick={onToggleShow}
                style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text-muted)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                {show ? i18n.t('adminSettings.apiKeyHide', 'Masquer') : i18n.t('adminSettings.apiKeyShow', 'Afficher')}
            </button>
        </div>
        {value && detect && (
            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                {detect(value)}
            </p>
        )}
    </Field>
);

// ── Section card ─────────────────────────────────────────────
const Section = ({ icon: Icon, title, color = 'var(--color-primary)', bg, children }) => (
    <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: '14px',
        boxShadow: 'var(--shadow-sm)',
    }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: bg || 'var(--color-surface-2)',
        }}>
            <div style={{
                width: '32px', height: '32px',
                background: color,
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={16} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-heading)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text)' }}>{title}</h3>
        </div>
        <div style={{ padding: '24px' }}>
            {children}
        </div>
    </div>
);

// ── Page Admin ───────────────────────────────────────────────
const AdminSettings = () => {
    const { isAdmin } = useApp();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading]     = useState(true);
    const [toast, setToast]         = useState(null);

    // Sous-sites
    const [subsites,    setSubsites]    = useState([]);
    const [editSubsite, setEditSubsite] = useState(null); // null | 'new' | {subsite}

    // Partenaires (bibliothèque globale + sélection site principal)
    const [partners, setPartners] = useState([]);
    const [sitePrimaryPartnerIds, setSitePrimaryPartnerIds] = useState([]);
    const [sitePartnerIds, setSitePartnerIds] = useState([]);
    const [partnersExpanded, setPartnersExpanded] = useState(false);

    const loadSubsites = () => api.subsites.getAll().then(d => setSubsites(Array.isArray(d) ? d : [])).catch(() => {});
    useEffect(() => { loadSubsites(); }, []);

    const loadPartners = () => api.partners.getAll().then(d => setPartners(Array.isArray(d) ? d : [])).catch(() => {});
    const loadMainSitePartners = () => api.partners.getSiteSelection().then(d => {
        setSitePrimaryPartnerIds(Array.isArray(d?.primary_partners) ? d.primary_partners.map(p => p.id) : []);
        setSitePartnerIds(Array.isArray(d?.partners) ? d.partners.map(p => p.id) : []);
    }).catch(() => {});
    useEffect(() => { if (isAdmin) { loadPartners(); loadMainSitePartners(); } }, [isAdmin]);

    // Champs du formulaire
    const [allowAnon,     setAllowAnon]     = useState(true);
    const [maxTotal,      setMaxTotal]      = useState(10);
    const [maxWindow,     setMaxWindow]     = useState(3);
    const [windowMinutes, setWindowMinutes] = useState(60);
    const [openaiKey,     setOpenaiKey]    = useState('');
    const [deeplKey,      setDeeplKey]     = useState('');
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [showDeeplKey,  setShowDeeplKey]  = useState(false);
    // Politique de re-validation quand un sous-site modifie un cartel déjà
    // publié sur le principal : 'off' | 'strict' ('soft' prévu mais pas livré).
    const [revalPolicy,   setRevalPolicy]   = useState('off');
    // Dernières valeurs persistées des champs sauvegardés au blur (nombres +
    // clés API) : permet d'ignorer un blur qui ne change rien — pas de requête
    // ni de toast inutile.
    const savedRef = useRef({});

    // ── Chargement initial ───────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const s = await api.settings.getAll();
                const maxTotal0      = parseInt(s.max_submissions_per_ip_total, 10)  || 10;
                const maxWindow0     = parseInt(s.max_submissions_per_ip_window, 10) || 3;
                const windowMinutes0 = parseInt(s.submission_window_minutes, 10)     || 60;
                setAllowAnon(s.allow_anonymous_submit === 'true');
                setMaxTotal(maxTotal0);
                setMaxWindow(maxWindow0);
                setWindowMinutes(windowMinutes0);
                setRevalPolicy(s.subsite_edit_revalidation || 'off');
                // Référence des valeurs sauvegardées, pour ignorer un blur sans changement.
                savedRef.current = { maxTotal: maxTotal0, maxWindow: maxWindow0, windowMinutes: windowMinutes0 };
                try {
                    setSitePrimaryPartnerIds(JSON.parse(s.site_primary_partner_ids || '[]'));
                    setSitePartnerIds(JSON.parse(s.site_partner_ids || '[]'));
                } catch {
                    setSitePrimaryPartnerIds([]);
                    setSitePartnerIds([]);
                }

                // Clés API (endpoints dédiés, admin only)
                try {
                    const [k1, k2] = await Promise.all([
                        api.settings.getOpenAIKey().catch(() => ({ openai_key: '' })),
                        api.settings.getDeepLKey().catch(()  => ({ deepl_key:  '' })),
                    ]);
                    setOpenaiKey(k1.openai_key || '');
                    setDeeplKey(k2.deepl_key   || '');
                    savedRef.current.openaiKey = k1.openai_key || '';
                    savedRef.current.deeplKey  = k2.deepl_key  || '';
                } catch { /* pas critique */ }
            } catch (e) {
                showToast('error', i18n.t('errors.loadingPrefix', { msg: e.message }));
            } finally {
                setLoading(false);
            }
        };
        if (isAdmin) load();
    }, [isAdmin]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Sauvegarde automatique ───────────────────────────────
    // Chaque réglage est persisté dès qu'on le modifie (toggle/radio) ou qu'on
    // quitte le champ (nombres, clés API). Plus de bouton « Enregistrer » global :
    // `persist` envoie le patch minimal et confirme par un toast « Enregistré ».
    const persist = async (patch, successMsg) => {
        try {
            await api.settings.update(patch);
            showToast('success', successMsg || i18n.t('toasts.saved'));
            return true;
        } catch (e) {
            showToast('error', i18n.t('common.error', { msg: e.message }));
            return false;
        }
    };

    // Champ texte/nombre sauvegardé au blur : on ignore le blur si rien n'a changé.
    const commitField = async (serverKey, refKey, value) => {
        if (savedRef.current[refKey] === value) return;
        if (await persist({ [serverKey]: String(value) })) savedRef.current[refKey] = value;
    };

    // Toggle / radio : état optimiste + persistance immédiate, retour arrière si échec.
    const setAllowAnonSaved = async (v) => {
        setAllowAnon(v);
        if (!(await persist({ allow_anonymous_submit: String(v) }))) setAllowAnon(!v);
    };

    const setRevalPolicySaved = async (v) => {
        const prev = revalPolicy;
        setRevalPolicy(v);
        if (!(await persist({ subsite_edit_revalidation: v }))) setRevalPolicy(prev);
    };

    const persistPartners = (primaryIds, regularIds) => persist(
        {
            site_primary_partner_ids: JSON.stringify(primaryIds),
            site_partner_ids:         JSON.stringify(regularIds),
        },
        i18n.t('toasts.mainSitePartnersSaved'),
    );

    // Un partenaire ne peut être que dans une seule liste. On calcule les deux
    // listes suivantes puis on persiste ; retour arrière si l'appel échoue.
    const toggleSitePrimaryPartner = async (id) => {
        const prevPrimary = sitePrimaryPartnerIds, prevRegular = sitePartnerIds;
        const nextPrimary = prevPrimary.includes(id) ? prevPrimary.filter(x => x !== id) : [...prevPrimary, id];
        const nextRegular = prevRegular.filter(x => x !== id);
        setSitePrimaryPartnerIds(nextPrimary);
        setSitePartnerIds(nextRegular);
        if (!(await persistPartners(nextPrimary, nextRegular))) {
            setSitePrimaryPartnerIds(prevPrimary);
            setSitePartnerIds(prevRegular);
        }
    };

    const toggleSitePartner = async (id) => {
        const prevPrimary = sitePrimaryPartnerIds, prevRegular = sitePartnerIds;
        const nextRegular = prevRegular.includes(id) ? prevRegular.filter(x => x !== id) : [...prevRegular, id];
        const nextPrimary = prevPrimary.filter(x => x !== id);
        setSitePartnerIds(nextRegular);
        setSitePrimaryPartnerIds(nextPrimary);
        if (!(await persistPartners(nextPrimary, nextRegular))) {
            setSitePrimaryPartnerIds(prevPrimary);
            setSitePartnerIds(prevRegular);
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                {t('adminSettings.accessRestricted', "Accès réservé à l'administration.")}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '28px 24px 80px' }}>

            {/* ── Modale sous-site ─────────────────────────── */}
            {editSubsite && (
                <SubsiteEditor
                    subsite={editSubsite === 'new' ? null : editSubsite}
                    onClose={() => setEditSubsite(null)}
                    onSaved={() => { loadSubsites(); showToast('success', i18n.t('toasts.subsiteSaved')); }}
                />
            )}

            {/* ── Toast ─────────────────────────────────────── */}
            {toast && (
                <div role="status" style={{
                    position: 'fixed',
                    top: '80px',
                    right: '24px',
                    zIndex: 9999,
                    background: toast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    border: `1px solid ${toast.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideIn 0.2s ease-out',
                    maxWidth: '340px',
                }}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={18} color="var(--color-success)" />
                        : <AlertCircle size={18} color="var(--color-error)" />
                    }
                    <span style={{ fontWeight: '700', fontSize: '0.88rem', color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {toast.msg}
                    </span>
                </div>
            )}

            {/* ── En-tête ─────────────────────────────────────── */}
            {/* Plus de bouton « Sauvegarder » : chaque réglage est enregistré
                automatiquement (toggle/radio au clic, champs au blur). */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: '16px', flexWrap: 'wrap',
                marginBottom: '24px', padding: '12px 0',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>{t('adminSettings.pageTitle', 'Administration')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {t('adminSettings.headerIntroPrefix', 'Paramètres globaux — ')}<strong>{t('adminSettings.headerIntroStrong', 'enregistrés automatiquement')}</strong>{t('adminSettings.headerIntroSuffix', ' à chaque modification.')}
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>{t('adminSettings.loading', 'Chargement…')}</div>
            ) : (
                <>
                    {/* ════════════════════════════════════════════════════════
                        GROUPE 1 — CONTENU : ce qui peuple le site (jaune orangé foncé)
                       ════════════════════════════════════════════════════════ */}
                    <Group title={t('adminSettings.groupContent', 'Contenu')} color="var(--color-theme-system)">

                        {/* ── Articles de presse (page publique /presse) ──────────── */}
                        <Section icon={FolderOpen} title={t('adminSettings.pressTitle', 'Articles de presse')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/press')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.pressButton', 'Gérer les articles affichés sur la page publique « Presse »')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.pressHint', 'Tri automatique par date décroissante. Vignettes uploadables. Possibilité de masquer un article sans le supprimer.')}
                            </p>
                        </Section>

                        {/* ── Missions (page publique /participer) ──────────── */}
                        <Section icon={Target} title={t('adminSettings.missionsTitle', 'Missions (page Participer)')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/missions')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.missionsButton', 'Gérer les missions affichées en haut de la page « Participer »')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.missionsHint', 'Cards dépliables (thème + nom + texte + lien optionnel). Ordre, visibilité et traduction EN gérés ici.')}
                            </p>
                        </Section>

                        {/* ── Prestations (page publique /prestations) ──────────── */}
                        <Section icon={FolderOpen} title={t('adminSettings.prestationsTitle', 'Prestations')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/prestations')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.prestationsButton', 'Gérer les cards de la page publique « Prestations »')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.prestationsHint', 'Challenges, ateliers, expo itinérante, conseil… Titre + icône + intro + description + bullets + plaquette PDF.')}
                            </p>
                        </Section>

                        {/* ── Boutique (liens PrestaShop) ──────────── */}
                        <Section icon={FolderOpen} title={t('adminSettings.shopTitle', 'Boutique (liens externes)')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/shop')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.shopButton', 'Gérer les liens vers le PrestaShop (livres, jeux, autres)')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.shopHint', 'Vitrine sans panier — chaque card renvoie vers la fiche produit du PrestaShop externe.')}
                            </p>
                        </Section>

                        {/* ── Équipe (page publique « À propos ») ──────────── */}
                        <Section icon={Users} title={t('adminSettings.teamContentTitle', 'Équipe (page À propos)')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/team-content')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.teamContentButton', 'Gérer les membres affichés sur la page publique « À propos »')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.teamContentHint', 'Trois catégories : principaux (avec photo + bio), secondaires (compact), communauté (liste de chercheur·euses associé·es).')}
                            </p>
                        </Section>

                        {/* ── Partenaires ──────────── */}
                        <Section icon={Users} title={t('adminSettings.partnersTitle', 'Partenaires')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <button
                                    type="button"
                                    onClick={() => setPartnersExpanded(v => !v)}
                                    aria-expanded={partnersExpanded}
                                    style={{
                                        width: '100%', border: 'none', background: 'var(--color-surface-2)',
                                        padding: '14px 18px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', cursor: 'pointer',
                                        fontWeight: '700', color: 'var(--color-text)',
                                        fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    <span>{t('adminSettings.partnersToggle', 'Gérer les partenaires du site et des sous-sites')}</span>
                                    {partnersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {partnersExpanded && (
                                    <div style={{ background: 'var(--color-surface)' }}>
                                        <div style={{ padding: '20px' }}>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/app/admin/partners')}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '14px 18px',
                                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                                    fontSize: '0.85rem', fontWeight: '700',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                }}
                                            >
                                                <ExternalLink size={16} />
                                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.partnersLibraryButton', 'Gérer la bibliothèque (obligatoires / pool / exclusifs)')}</span>
                                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                                            </button>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--color-border)' }} />

                                        <div style={{ padding: '20px' }}>
                                            <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-theme-system)', fontFamily: 'var(--font-heading)' }}>
                                                {t('adminSettings.partnersMainSiteHeading', 'Affichage sur le site principal')}
                                            </p>
                                            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                {t('adminSettings.partnersMainSiteHint', 'Un partenaire ne peut être que dans une seule liste. Cliquez pour cocher/décocher.')}
                                            </p>

                                            {partners.length === 0 ? (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>{t('adminSettings.partnersEmpty', "Ajoutez d'abord des partenaires dans la bibliothèque.")}</p>
                                            ) : (
                                                <>
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-theme-system)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            <span style={{ background: 'var(--color-theme-system-bg)', borderRadius: 'var(--radius-md)', padding: '2px 8px' }}>{t('adminSettings.partnersPrimaryBadge', '★ Principaux')}</span>
                                                            <span style={{ fontWeight: '400', color: 'var(--color-text-subtle)' }}>{t('adminSettings.partnersPrimaryHint', '— mis en avant (grande vignette)')}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {partners.map(p => {
                                                                const active = sitePrimaryPartnerIds.includes(p.id);
                                                                return (
                                                                    <button
                                                                        key={`site-primary-${p.id}`}
                                                                        type="button"
                                                                        onClick={() => toggleSitePrimaryPartner(p.id)}
                                                                        aria-pressed={active}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                                            borderRadius: 'var(--radius-md)',
                                                                            border: active ? '2px solid var(--color-theme-system)' : '2px solid var(--color-border)',
                                                                            background: active ? 'var(--color-theme-system)' : 'var(--color-surface-2)',
                                                                            color: active ? 'var(--color-white)' : 'var(--color-text-muted)',
                                                                            padding: '6px 12px', fontSize: '0.82rem',
                                                                            cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: '700',
                                                                            textTransform: 'uppercase', letterSpacing: '0.4px',
                                                                            transition: 'background-color 0.12s, border-color 0.12s, color 0.12s',
                                                                        }}
                                                                    >
                                                                        {p.logo_path && <img src={p.logo_path} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                                                                        {p.name}
                                                                        {active && <Check size={12} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            <span style={{ background: 'var(--color-neutral-bg)', borderRadius: 'var(--radius-md)', padding: '2px 8px' }}>{t('adminSettings.partnersStandardBadge', 'Standards')}</span>
                                                            <span style={{ fontWeight: '400', color: 'var(--color-text-subtle)' }}>{t('adminSettings.partnersStandardHint', '— affichage secondaire')}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                            {partners.map(p => {
                                                                const active = sitePartnerIds.includes(p.id);
                                                                return (
                                                                    <button
                                                                        key={`site-regular-${p.id}`}
                                                                        type="button"
                                                                        onClick={() => toggleSitePartner(p.id)}
                                                                        aria-pressed={active}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                                            borderRadius: 'var(--radius-md)',
                                                                            border: active ? '2px solid var(--color-text-muted)' : '2px solid var(--color-border)',
                                                                            background: active ? 'var(--color-text-muted)' : 'var(--color-surface-2)',
                                                                            color: active ? 'var(--color-white)' : 'var(--color-text-muted)',
                                                                            padding: '6px 12px', fontSize: '0.82rem',
                                                                            cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: '700',
                                                                            textTransform: 'uppercase', letterSpacing: '0.4px',
                                                                            transition: 'background-color 0.12s, border-color 0.12s, color 0.12s',
                                                                        }}
                                                                    >
                                                                        {p.logo_path && <img src={p.logo_path} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                                                                        {p.name}
                                                                        {active && <Check size={12} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>

                        {/* ── Catégories & ateliers ──────────── */}
                        <Section icon={FolderOpen} title={t('adminSettings.taxonomiesTitle', 'Catégories & ateliers')}
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/taxonomies')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-system-bg)', border: '1px solid var(--color-theme-system)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-system)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.taxonomiesButton', 'Modifier ou supprimer les catégories et ateliers')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.taxonomiesHint', 'Gérez la taxonomie des cartels (couleurs, traductions) et le cycle de vie des ateliers.')}
                            </p>
                        </Section>
                    </Group>

                    {/* ════════════════════════════════════════════════════════
                        GROUPE 2 — COMMUNAUTÉ & MODÉRATION (vert)
                       ════════════════════════════════════════════════════════ */}
                    <Group title={t('adminSettings.groupCommunity', 'Communauté & modération')} color="var(--color-theme-content)">

                        {/* ── Sites dédiés (sous-sites) ──────────── */}
                        <Section icon={Globe} title={t('adminSettings.subsitesTitle', 'Sites dédiés (sous-sites)')}
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditSubsite('new')}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-theme-content)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Plus size={14} /> {t('adminSettings.newSubsite', 'Nouveau sous-site')}
                                </button>
                            </div>
                            {subsites.length === 0 ? (
                                <p style={{ color: 'var(--color-text-subtle)', textAlign: 'center', padding: '24px 0' }}>{t('adminSettings.noSubsites', 'Aucun sous-site configuré.')}</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {subsites.map(s => (
                                        <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                                            <div style={{ width: '4px', height: '32px', background: s.primary_color, flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.name}</div>
                                                <div style={{ color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>/site/{s.slug} · {s.category_name}</div>
                                            </div>
                                            <a href={`/site/${s.slug}`} target="_blank" rel="noopener" title={t('adminSettings.openTitle', 'Ouvrir')} style={{ color: 'var(--color-text-muted)', display: 'flex' }}><ExternalLink size={14} /></a>
                                            <button onClick={() => setEditSubsite(s)} title={t('adminSettings.editTitle', 'Modifier')} aria-label={t('adminSettings.editSubsiteAria', { name: s.name, defaultValue: 'Modifier {{name}}' })}
                                                style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '5px 10px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                                <Edit size={13} />
                                            </button>
                                            <button onClick={async () => { if (!confirm(t('adminSettings.confirmDeleteSubsite', { name: s.name, defaultValue: 'Supprimer "{{name}}" ?' }))) return; await api.subsites.delete(s.slug); loadSubsites(); }} title={t('adminSettings.deleteTitle', 'Supprimer')} aria-label={t('adminSettings.deleteSubsiteAria', { name: s.name, defaultValue: 'Supprimer {{name}}' })}
                                                style={{ background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '5px 10px', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* ── Re-validation des modifs sous-site ──────── */}
                        <Section icon={Shield} title={t('adminSettings.revalSectionTitle', 'Cartels de sous-site publiés sur le principal')}
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <Field
                                label={t('adminSettings.revalFieldLabel', 'Que faire quand un sous-site modifie un cartel déjà validé sur le site principal ?')}
                                hint={t('adminSettings.revalFieldHint', "Un cartel de sous-site approuvé reste la même fiche : sans contrôle, une modification du sous-site s'affiche aussi sur le site principal sans nouvelle validation.")}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { key: 'off',    title: t('adminSettings.revalOffTitle', 'Désactivé'), desc: t('adminSettings.revalOffDesc', 'Les modifications passent directement sur le site principal (comportement par défaut).') },
                                        { key: 'strict', title: t('adminSettings.revalStrictTitle', 'Stricte — retrait + re-validation'), desc: t('adminSettings.revalStrictDesc', 'La modification retire le cartel du site principal jusqu’à une nouvelle validation. Le superadmin est notifié.') },
                                        { key: 'soft',   title: t('adminSettings.revalSoftTitle', 'Souple — reste en ligne + signalement'), desc: t('adminSettings.revalSoftDesc', 'À venir : le cartel reste visible avec le nouveau contenu, mais est signalé pour contrôle.'), disabled: true },
                                    ].map(opt => {
                                        const active = revalPolicy === opt.key;
                                        return (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                disabled={opt.disabled}
                                                onClick={() => !opt.disabled && setRevalPolicySaved(opt.key)}
                                                aria-pressed={active}
                                                style={{
                                                    textAlign: 'left',
                                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                    padding: '14px 16px',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: active ? '2px solid var(--color-theme-content)' : '2px solid var(--color-border)',
                                                    background: active ? 'var(--color-theme-content-bg)' : 'var(--color-surface-2)',
                                                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                                    opacity: opt.disabled ? 0.55 : 1,
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', flexShrink: 0, marginTop: '2px',
                                                    borderRadius: '50%',
                                                    border: active ? '5px solid var(--color-theme-content)' : '2px solid var(--color-border-strong)',
                                                    background: 'var(--color-surface)',
                                                }} />
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                                        {opt.title}{opt.disabled && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('adminSettings.soonBadge', 'bientôt')}</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{opt.desc}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                        </Section>

                        {/* ── Gestion des comptes et équipes ──────────── */}
                        <Section icon={Users} title={t('adminSettings.accountsTitle', 'Gestion des comptes et équipes')}
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/team')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-content-bg)', border: '1px solid var(--color-theme-content)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-content)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.accountsButton', "Inviter ou gérer les membres d'un sous-site")}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.accountsHint', 'Owners : gérez votre propre équipe. Superadmins : vous pouvez aussi utiliser la page globale des utilisateurs.')}
                            </p>
                        </Section>

                        {/* ── Soumissions de visiteurs ──────── */}
                        <Section icon={Users} title={t('adminSettings.submissionsTitle', 'Soumissions de visiteurs')}
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">

                            <Field
                                label={t('adminSettings.allowAnonLabel', 'Autoriser les soumissions anonymes')}
                                hint={t('adminSettings.allowAnonHint', 'Si désactivé, seuls les utilisateurs connectés pourront proposer des cartels.')}
                            >
                                <Toggle value={allowAnon} onChange={setAllowAnonSaved} />
                            </Field>

                            {allowAnon && (
                                <div style={{
                                    background: 'var(--color-theme-content-bg)',
                                    border: '1px solid var(--color-theme-content)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                }}>
                                    <Field
                                        label={t('adminSettings.maxTotalLabel', 'Maximum de soumissions par adresse IP (total)')}
                                        hint={t('adminSettings.maxTotalHint', "Nombre total de cartels qu'une même IP peut soumettre, toutes périodes confondues.")}
                                    >
                                        <NumberInput
                                            value={maxTotal}
                                            onChange={v => setMaxTotal(Number(v))}
                                            onCommit={n => commitField('max_submissions_per_ip_total', 'maxTotal', n)}
                                            min={1}
                                            max={500}
                                            suffix={t('adminSettings.cartelsMaxSuffix', 'cartels max')}
                                        />
                                    </Field>

                                    <div style={{ borderTop: '1px solid var(--color-theme-content)', paddingTop: '20px' }}>
                                        <p style={{ margin: '0 0 14px', fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-theme-content)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {t('adminSettings.windowLimitHeading', 'Limite sur fenêtre glissante')}
                                        </p>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <Field label={t('adminSettings.windowMaxLabel', 'Soumissions autorisées par fenêtre')} hint={t('adminSettings.windowMaxHint', 'Nombre max de cartels sur la période définie ci-dessous.')}>
                                                <NumberInput value={maxWindow} onChange={v => setMaxWindow(Number(v))} onCommit={n => commitField('max_submissions_per_ip_window', 'maxWindow', n)} min={1} max={50} suffix={t('adminSettings.cartelsSuffix', 'cartels')} />
                                            </Field>
                                            <Field label={t('adminSettings.windowDurationLabel', 'Durée de la fenêtre')} hint={t('adminSettings.windowDurationHint', 'Période glissante de contrôle.')}>
                                                <NumberInput value={windowMinutes} onChange={v => setWindowMinutes(Number(v))} onCommit={n => commitField('submission_window_minutes', 'windowMinutes', n)} min={1} max={1440} suffix={t('adminSettings.minutesSuffix', 'minutes')} />
                                            </Field>
                                        </div>

                                        <div style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-theme-content)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '12px 16px',
                                            marginTop: '4px',
                                            fontSize: '0.87rem',
                                            color: 'var(--color-theme-content)',
                                            fontWeight: '600',
                                        }}>
                                            {t('adminSettings.ruleActivePrefix', 'Règle active : chaque IP peut soumettre au maximum')}{' '}
                                            <strong>{maxWindow} cartel{maxWindow > 1 ? 's' : ''}</strong> {t('adminSettings.ruleActiveEvery', 'toutes les')}{' '}
                                            <strong>
                                                {windowMinutes >= 60
                                                    ? `${Math.floor(windowMinutes / 60)}h${windowMinutes % 60 > 0 ? ` ${windowMinutes % 60}min` : ''}`
                                                    : `${windowMinutes} min`
                                                }
                                            </strong>,{' '}
                                            {t('adminSettings.ruleActiveAnd', 'et')} <strong>{maxTotal} cartel{maxTotal > 1 ? 's' : ''} {t('adminSettings.ruleActiveTotal', 'au total')}</strong>.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>
                    </Group>

                    {/* ════════════════════════════════════════════════════════
                        GROUPE 3 — SYSTÈME : config technique & état (violet)
                       ════════════════════════════════════════════════════════ */}
                    <Group title={t('adminSettings.groupSystem', 'Système')} color="var(--color-theme-people)">

                        {/* ── Journal d'événements ──────────── */}
                        <Section icon={Activity} title={t('adminSettings.logsTitle', "Journal d'événements")}
                            color="var(--color-theme-people)" bg="var(--color-theme-people-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/logs')}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 18px',
                                    background: 'var(--color-theme-people-bg)', border: '1px solid var(--color-theme-people)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-people)',
                                    fontSize: '0.85rem', fontWeight: '700',
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}
                            >
                                <ExternalLink size={16} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{t('adminSettings.logsButton', 'Consulter le journal et configurer les notifications email')}</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.logsHint', "Audit complet des actions (publications, modifications, créations de comptes…) et activation des notifications par email à l'équipe.")}
                            </p>
                        </Section>

                        {/* ── Clés API ──────── */}
                        <Section icon={Key} title={t('adminSettings.apiKeysTitle', 'Clés API (traduction automatique)')}
                            color="var(--color-theme-people)" bg="var(--color-theme-people-bg)">

                            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.apiKeysIntro1', 'Si une clé DeepL est renseignée, elle est utilisée pour les traductions ')}<strong>FR&nbsp;↔&nbsp;EN</strong>{t('adminSettings.apiKeysIntro2', ' (moins coûteux). La clé OpenAI prend le relais pour toutes les ')}<strong>{t('adminSettings.apiKeysOtherLangs', 'autres langues')}</strong>{t('adminSettings.apiKeysIntro3', ' (export PDF multilingue).')}
                            </p>

                            <ApiKeyField
                                label={t('adminSettings.deeplLabel', 'Clé DeepL (FR ↔ EN)')}
                                hint={t('adminSettings.deeplHint', 'Optionnelle. Se termine par :fx pour DeepL Free, ou clé brute pour DeepL Pro.')}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                                value={deeplKey}
                                onChange={setDeeplKey}
                                onCommit={v => commitField('deepl_key', 'deeplKey', v)}
                                show={showDeeplKey}
                                onToggleShow={() => setShowDeeplKey(!showDeeplKey)}
                                detect={(k) => {
                                    if (k.endsWith(':fx')) return t('adminSettings.deeplDetectFree', 'Format DeepL Free détecté');
                                    if (k.startsWith('sk-') || k.startsWith('proj-')) return t('adminSettings.deeplDetectOpenaiWarn', 'Attention : ressemble à une clé OpenAI — à coller dans le champ ci-dessous');
                                    return t('adminSettings.deeplDetectPro', 'Format DeepL Pro (présumé)');
                                }}
                            />

                            <ApiKeyField
                                label={t('adminSettings.openaiLabel', 'Clé OpenAI (autres langues)')}
                                hint={t('adminSettings.openaiHint', 'Requise pour traduire vers une langue autre que FR/EN. Commence par sk-… ou proj-…')}
                                placeholder="sk-…"
                                value={openaiKey}
                                onChange={setOpenaiKey}
                                onCommit={v => commitField('openai_key', 'openaiKey', v)}
                                show={showOpenaiKey}
                                onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
                                detect={(k) => {
                                    if (k.startsWith('sk-') || k.startsWith('proj-')) return t('adminSettings.openaiDetectOk', 'Format OpenAI détecté');
                                    if (k.endsWith(':fx')) return t('adminSettings.openaiDetectDeeplWarn', 'Attention : ressemble à une clé DeepL — à coller dans le champ ci-dessus');
                                    return t('adminSettings.openaiDetectUnknown', 'Format non reconnu');
                                }}
                            />

                            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                {t('adminSettings.apiKeysAutosave', 'La clé est enregistrée automatiquement dès que vous quittez le champ.')}
                            </p>
                        </Section>

                        {/* ── Informations système ──────── */}
                        <Section icon={Shield} title={t('adminSettings.systemInfoTitle', 'Informations système')}
                            color="var(--color-theme-people)" bg="var(--color-theme-people-bg)">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                {[
                                    { label: t('adminSettings.infoAnonLabel', 'Soumissions anonymes'),  value: allowAnon ? t('adminSettings.infoAnonAllowed', 'Autorisées') : t('adminSettings.infoAnonBlocked', 'Bloquées') },
                                    { label: t('adminSettings.infoTotalLimitLabel', 'Limite globale / IP'),   value: t('adminSettings.infoTotalLimitValue', { n: maxTotal, defaultValue: '{{n}} cartels' }) },
                                    { label: t('adminSettings.infoWindowLimitLabel', 'Limite sur fenêtre'),    value: t('adminSettings.infoWindowValue', { n: maxWindow, m: windowMinutes, defaultValue: '{{n}} cartels / {{m}} min' }) },
                                    { label: t('adminSettings.infoOpenaiLabel', 'Clé OpenAI configurée'), value: openaiKey ? t('adminSettings.infoYes', 'Oui') : t('adminSettings.infoNo', 'Non') },
                                    { label: t('adminSettings.infoDeeplLabel', 'Clé DeepL configurée'),  value: deeplKey  ? t('adminSettings.infoYes', 'Oui') : t('adminSettings.infoNo', 'Non') },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        style={{
                                            background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '14px 16px',
                                        }}
                                    >
                                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-subtle)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                                            {label}
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-text)' }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </Group>
                </>
            )}

            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
};

export default AdminSettings;
