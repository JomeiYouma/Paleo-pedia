import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, Key, Save, RefreshCw,
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

const NumberInput = ({ value, onChange, min = 0, max = 9999, suffix }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
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
            {value ? 'Activé' : 'Désactivé'}
        </span>
        {label && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>— {label}</span>}
    </button>
);

// ── Groupe thématique : titre + bandeau coloré qui rassemble plusieurs Section ──
// On regroupe pour que la page de réglages soit lisible d'un coup d'œil :
// l'œil sait où chercher Contenus / Communauté / Système.
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
const ApiKeyField = ({ label, hint, placeholder, value, onChange, show, onToggleShow, onSave, saving, loading, detect }) => (
    <Field label={label} hint={hint}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
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
                {show ? 'Masquer' : 'Afficher'}
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={saving || loading}
                style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: saving ? 'var(--color-border-strong)' : 'var(--color-theme-system)',
                    color: 'var(--color-white)',
                    cursor: saving || loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                {saving ? 'Envoi…' : 'Enregistrer'}
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

    const [settings, setSettings]   = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState(null);

    // Sous-sites
    const [subsites,    setSubsites]    = useState([]);
    const [editSubsite, setEditSubsite] = useState(null); // null | 'new' | {subsite}

    // Partenaires (bibliothèque globale + sélection site principal)
    const [partners, setPartners] = useState([]);
    const [sitePrimaryPartnerIds, setSitePrimaryPartnerIds] = useState([]);
    const [sitePartnerIds, setSitePartnerIds] = useState([]);
    const [partnersExpanded, setPartnersExpanded] = useState(false);
    const [savingPartners, setSavingPartners] = useState(false);

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

    // ── Chargement initial ───────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const s = await api.settings.getAll();
                setSettings(s);
                setAllowAnon(s.allow_anonymous_submit === 'true');
                setMaxTotal(parseInt(s.max_submissions_per_ip_total, 10) || 10);
                setMaxWindow(parseInt(s.max_submissions_per_ip_window, 10) || 3);
                setWindowMinutes(parseInt(s.submission_window_minutes, 10) || 60);
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

    // ── Sauvegarde ───────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                allow_anonymous_submit:        String(allowAnon),
                max_submissions_per_ip_total:  String(maxTotal),
                max_submissions_per_ip_window: String(maxWindow),
                submission_window_minutes:     String(windowMinutes),
                openai_key: openaiKey,
                deepl_key:  deeplKey,
            };

            await api.settings.update(payload);
            showToast('success', i18n.t('toasts.settingsSaved'));
        } catch (e) {
            showToast('error', i18n.t('common.error', { msg: e.message }));
        } finally {
            setSaving(false);
        }
    };

    const toggleSitePrimaryPartner = (id) => {
        setSitePrimaryPartnerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setSitePartnerIds(prev => prev.filter(x => x !== id));
    };

    const toggleSitePartner = (id) => {
        setSitePartnerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setSitePrimaryPartnerIds(prev => prev.filter(x => x !== id));
    };

    const handleSaveMainSitePartners = async () => {
        setSavingPartners(true);
        try {
            const payload = {
                site_primary_partner_ids: JSON.stringify(sitePrimaryPartnerIds),
                site_partner_ids: JSON.stringify(sitePartnerIds),
            };

            try {
                await api.settings.update(payload);
            } catch (settingsError) {
                await api.partners.setSiteSelection({
                    primary_partner_ids: sitePrimaryPartnerIds,
                    partner_ids: sitePartnerIds,
                });
            }

            showToast('success', i18n.t('toasts.mainSitePartnersSaved'));
        } catch (e) {
            showToast('error', i18n.t('errors.savingPartnersPrefix', { msg: e.message }));
        } finally {
            setSavingPartners(false);
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                Accès réservé à l'administration.
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

            {/* ── En-tête ──────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Administration</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Paramètres globaux de l'application</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: saving ? 'var(--color-border-strong)' : 'var(--color-primary)',
                        color: 'var(--color-white)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 22px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-heading)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}
                >
                    {saving
                        ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
                        : <><Save size={15} /> Sauvegarder</>
                    }
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>Chargement…</div>
            ) : (
                <>
                    {/* ════════════════════════════════════════════════════════
                        GROUPE 1 — CONTENUS : ce qui peuple le site
                       ════════════════════════════════════════════════════════ */}
                    <Group title="Contenus" color="var(--color-theme-content)">

                        {/* ── Sous-sites ──────────── */}
                        <Section icon={Globe} title="Sous-sites thématiques"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditSubsite('new')}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-theme-content)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <Plus size={14} /> Nouveau sous-site
                                </button>
                            </div>
                            {subsites.length === 0 ? (
                                <p style={{ color: 'var(--color-text-subtle)', textAlign: 'center', padding: '24px 0' }}>Aucun sous-site configuré.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {subsites.map(s => (
                                        <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                                            <div style={{ width: '4px', height: '32px', background: s.primary_color, flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.name}</div>
                                                <div style={{ color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>/site/{s.slug} · {s.category_name}</div>
                                            </div>
                                            <a href={`#/site/${s.slug}`} target="_blank" rel="noopener" title="Ouvrir" style={{ color: 'var(--color-text-muted)', display: 'flex' }}><ExternalLink size={14} /></a>
                                            <button onClick={() => setEditSubsite(s)} title="Modifier" aria-label={`Modifier ${s.name}`}
                                                style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '5px 10px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                                <Edit size={13} />
                                            </button>
                                            <button onClick={async () => { if (!confirm(`Supprimer "${s.name}" ?`)) return; await api.subsites.delete(s.slug); loadSubsites(); }} title="Supprimer" aria-label={`Supprimer ${s.name}`}
                                                style={{ background: 'none', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', padding: '5px 10px', cursor: 'pointer', color: 'var(--color-error)', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* ── Catégories & ateliers ──────────── */}
                        <Section icon={FolderOpen} title="Catégories & ateliers"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/taxonomies')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Modifier ou supprimer les catégories et ateliers</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Gérez la taxonomie des cartels (couleurs, traductions) et le cycle de vie des ateliers.
                            </p>
                        </Section>

                        {/* ── Partenaires ──────────── */}
                        <Section icon={Users} title="Partenaires"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
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
                                    <span>Gérer les partenaires du site et des sous-sites</span>
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
                                                    background: 'var(--color-theme-content-bg)', border: '1px solid var(--color-theme-content)',
                                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                    fontFamily: 'var(--font-heading)', color: 'var(--color-theme-content)',
                                                    fontSize: '0.85rem', fontWeight: '700',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                }}
                                            >
                                                <ExternalLink size={16} />
                                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer la bibliothèque (obligatoires / pool / exclusifs)</span>
                                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                                            </button>
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--color-border)' }} />

                                        <div style={{ padding: '20px' }}>
                                            <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-theme-content)', fontFamily: 'var(--font-heading)' }}>
                                                Affichage sur le site principal
                                            </p>
                                            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                Un partenaire ne peut être que dans une seule liste. Cliquez pour cocher/décocher.
                                            </p>

                                            {partners.length === 0 ? (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)' }}>Ajoutez d'abord des partenaires dans la bibliothèque.</p>
                                            ) : (
                                                <>
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-theme-content)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            <span style={{ background: 'var(--color-theme-content-bg)', borderRadius: 'var(--radius-md)', padding: '2px 8px' }}>★ Principaux</span>
                                                            <span style={{ fontWeight: '400', color: 'var(--color-text-subtle)' }}>— mis en avant (grande vignette)</span>
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
                                                                            border: active ? '2px solid var(--color-theme-content)' : '2px solid var(--color-border)',
                                                                            background: active ? 'var(--color-theme-content)' : 'var(--color-surface-2)',
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
                                                            <span style={{ background: 'var(--color-neutral-bg)', borderRadius: 'var(--radius-md)', padding: '2px 8px' }}>Standards</span>
                                                            <span style={{ fontWeight: '400', color: 'var(--color-text-subtle)' }}>— affichage secondaire</span>
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

                                                    <button
                                                        type="button"
                                                        onClick={handleSaveMainSitePartners}
                                                        disabled={savingPartners}
                                                        style={{
                                                            border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 18px',
                                                            background: savingPartners ? 'var(--color-border-strong)' : 'var(--color-theme-content)', color: 'var(--color-white)',
                                                            fontWeight: '700', cursor: savingPartners ? 'not-allowed' : 'pointer',
                                                            fontFamily: 'var(--font-heading)', fontSize: '0.82rem',
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                        }}
                                                    >
                                                        <Save size={14} /> Enregistrer la sélection
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>
                    </Group>

                    {/* ════════════════════════════════════════════════════════
                        GROUPE 2 — COMMUNAUTÉ & MODÉRATION
                       ════════════════════════════════════════════════════════ */}
                    <Group title="Communauté & modération" color="var(--color-theme-people)">

                        {/* ── Soumissions de visiteurs ──────── */}
                        <Section icon={Users} title="Soumissions de visiteurs"
                            color="var(--color-theme-people)" bg="var(--color-theme-people-bg)">

                            <Field
                                label="Autoriser les soumissions anonymes"
                                hint="Si désactivé, seuls les utilisateurs connectés pourront proposer des cartels."
                            >
                                <Toggle value={allowAnon} onChange={setAllowAnon} />
                            </Field>

                            {allowAnon && (
                                <div style={{
                                    background: 'var(--color-theme-people-bg)',
                                    border: '1px solid var(--color-theme-people)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                }}>
                                    <Field
                                        label="Maximum de soumissions par adresse IP (total)"
                                        hint="Nombre total de cartels qu'une même IP peut soumettre, toutes périodes confondues."
                                    >
                                        <NumberInput
                                            value={maxTotal}
                                            onChange={v => setMaxTotal(Number(v))}
                                            min={1}
                                            max={500}
                                            suffix="cartels max"
                                        />
                                    </Field>

                                    <div style={{ borderTop: '1px solid var(--color-theme-people)', paddingTop: '20px' }}>
                                        <p style={{ margin: '0 0 14px', fontWeight: '700', fontSize: '0.78rem', color: 'var(--color-theme-people)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Limite sur fenêtre glissante
                                        </p>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                            <Field label="Soumissions autorisées par fenêtre" hint="Nombre max de cartels sur la période définie ci-dessous.">
                                                <NumberInput value={maxWindow} onChange={v => setMaxWindow(Number(v))} min={1} max={50} suffix="cartels" />
                                            </Field>
                                            <Field label="Durée de la fenêtre" hint="Période glissante de contrôle.">
                                                <NumberInput value={windowMinutes} onChange={v => setWindowMinutes(Number(v))} min={1} max={1440} suffix="minutes" />
                                            </Field>
                                        </div>

                                        <div style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-theme-people)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '12px 16px',
                                            marginTop: '4px',
                                            fontSize: '0.87rem',
                                            color: 'var(--color-theme-people)',
                                            fontWeight: '600',
                                        }}>
                                            Règle active : chaque IP peut soumettre au maximum{' '}
                                            <strong>{maxWindow} cartel{maxWindow > 1 ? 's' : ''}</strong> toutes les{' '}
                                            <strong>
                                                {windowMinutes >= 60
                                                    ? `${Math.floor(windowMinutes / 60)}h${windowMinutes % 60 > 0 ? ` ${windowMinutes % 60}min` : ''}`
                                                    : `${windowMinutes} min`
                                                }
                                            </strong>,
                                            et <strong>{maxTotal} cartel{maxTotal > 1 ? 's' : ''} au total</strong>.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Section>

                        {/* ── Équipe (page publique « À propos ») ──────────── */}
                        <Section icon={Users} title="Équipe (page À propos)"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/team-content')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer les membres affichés sur la page publique « À propos »</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Trois catégories : principaux (avec photo + bio), secondaires (compact), communauté (liste de chercheur·euses associé·es).
                            </p>
                        </Section>

                        {/* ── Articles de presse (page publique /presse) ──────────── */}
                        <Section icon={FolderOpen} title="Articles de presse"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/press')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer les articles affichés sur la page publique « Presse »</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Tri automatique par date décroissante. Vignettes uploadables. Possibilité de masquer un article sans le supprimer.
                            </p>
                        </Section>

                        {/* ── Missions (page publique /participer) ──────────── */}
                        <Section icon={Target} title="Missions (page Participer)"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/missions')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer les missions affichées en haut de la page « Participer »</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Cards dépliables (thème + nom + texte + lien optionnel). Ordre, visibilité et traduction EN gérés ici.
                            </p>
                        </Section>

                        {/* ── Prestations (page publique /prestations) ──────────── */}
                        <Section icon={FolderOpen} title="Prestations"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/prestations')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer les cards de la page publique « Prestations »</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Challenges, ateliers, expo itinérante, conseil… Titre + icône + intro + description + bullets + plaquette PDF.
                            </p>
                        </Section>

                        {/* ── Boutique (liens PrestaShop) ──────────── */}
                        <Section icon={FolderOpen} title="Boutique (liens externes)"
                            color="var(--color-theme-content)" bg="var(--color-theme-content-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/shop')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Gérer les liens vers le PrestaShop (livres, jeux, autres)</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Vitrine sans panier — chaque card renvoie vers la fiche produit du PrestaShop externe.
                            </p>
                        </Section>

                        {/* ── Gestion d'équipe (comptes utilisateurs) ──────────── */}
                        <Section icon={Users} title="Gestion d'équipe (comptes)"
                            color="var(--color-theme-people)" bg="var(--color-theme-people-bg)">
                            <button
                                type="button"
                                onClick={() => navigate('/app/admin/team')}
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Inviter ou gérer les membres d'un sous-site</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Owners : gérez votre propre équipe. Superadmins : vous pouvez aussi utiliser la page globale des utilisateurs.
                            </p>
                        </Section>

                        {/* ── Journal d'événements ──────────── */}
                        <Section icon={Activity} title="Journal d'événements"
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
                                <span style={{ flex: 1, textAlign: 'left' }}>Consulter le journal et configurer les notifications email</span>
                                <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Audit complet des actions (publications, modifications, créations de comptes…) et activation des notifications par email à l'équipe.
                            </p>
                        </Section>
                    </Group>

                    {/* ════════════════════════════════════════════════════════
                        GROUPE 3 — SYSTÈME : config technique & état
                       ════════════════════════════════════════════════════════ */}
                    <Group title="Système" color="var(--color-theme-system)">

                        {/* ── Clés API ──────── */}
                        <Section icon={Key} title="Clés API (traduction automatique)"
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">

                            <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Si une clé DeepL est renseignée, elle est utilisée pour les traductions <strong>FR&nbsp;↔&nbsp;EN</strong> (moins coûteux).
                                La clé OpenAI prend le relais pour toutes les <strong>autres langues</strong> (export PDF multilingue).
                            </p>

                            <ApiKeyField
                                label="Clé DeepL (FR ↔ EN)"
                                hint="Optionnelle. Se termine par :fx pour DeepL Free, ou clé brute pour DeepL Pro."
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                                value={deeplKey}
                                onChange={setDeeplKey}
                                show={showDeeplKey}
                                onToggleShow={() => setShowDeeplKey(!showDeeplKey)}
                                onSave={handleSave}
                                saving={saving}
                                loading={loading}
                                detect={(k) => {
                                    if (k.endsWith(':fx')) return 'Format DeepL Free détecté';
                                    if (k.startsWith('sk-') || k.startsWith('proj-')) return 'Attention : ressemble à une clé OpenAI — à coller dans le champ ci-dessous';
                                    return 'Format DeepL Pro (présumé)';
                                }}
                            />

                            <ApiKeyField
                                label="Clé OpenAI (autres langues)"
                                hint="Requise pour traduire vers une langue autre que FR/EN. Commence par sk-… ou proj-…"
                                placeholder="sk-…"
                                value={openaiKey}
                                onChange={setOpenaiKey}
                                show={showOpenaiKey}
                                onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
                                onSave={handleSave}
                                saving={saving}
                                loading={loading}
                                detect={(k) => {
                                    if (k.startsWith('sk-') || k.startsWith('proj-')) return 'Format OpenAI détecté';
                                    if (k.endsWith(':fx')) return 'Attention : ressemble à une clé DeepL — à coller dans le champ ci-dessus';
                                    return 'Format non reconnu';
                                }}
                            />

                            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                Cliquez sur « Enregistrer » après collage pour confirmer la prise en compte.
                            </p>
                        </Section>

                        {/* ── Informations système ──────── */}
                        <Section icon={Shield} title="Informations système"
                            color="var(--color-theme-system)" bg="var(--color-theme-system-bg)">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                {[
                                    { label: 'Soumissions anonymes',  value: allowAnon ? 'Autorisées' : 'Bloquées' },
                                    { label: 'Limite globale / IP',   value: `${maxTotal} cartels` },
                                    { label: 'Limite sur fenêtre',    value: `${maxWindow} cartels / ${windowMinutes} min` },
                                    { label: 'Clé OpenAI configurée', value: openaiKey ? 'Oui' : 'Non' },
                                    { label: 'Clé DeepL configurée',  value: deeplKey  ? 'Oui' : 'Non' },
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
