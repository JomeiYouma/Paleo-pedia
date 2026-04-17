import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Shield, Users, Key, Save, RefreshCw,
    ToggleLeft, ToggleRight, Clock, Hash, AlertCircle, CheckCircle2, Check,
    Globe, Plus, Trash2, Edit, ExternalLink, ChevronDown, ChevronUp, Upload
} from 'lucide-react';
import api from '../services/apiClient';
import SubsiteEditor from '../components/SubsiteEditor';

// ── Composants de formulaire ─────────────────────────────────
const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: '700', fontSize: '0.88rem', color: '#333', marginBottom: '4px' }}>
            {label}
        </label>
        {hint && <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#999' }}>{hint}</p>}
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
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '0.95rem',
                fontWeight: '600',
                textAlign: 'center',
            }}
        />
        {suffix && <span style={{ fontSize: '0.85rem', color: '#888' }}>{suffix}</span>}
    </div>
);

const Toggle = ({ value, onChange, label }) => (
    <button
        onClick={() => onChange(!value)}
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
            ? <ToggleRight size={32} color="#2e7d32" />
            : <ToggleLeft size={32} color="#bbb" />
        }
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: value ? '#2e7d32' : '#888' }}>
            {value ? 'Activé' : 'Désactivé'}
        </span>
        {label && <span style={{ color: '#555', fontSize: '0.88rem' }}>— {label}</span>}
    </button>
);

// ── Section card ─────────────────────────────────────────────
const Section = ({ icon: Icon, title, color = '#333', children }) => (
    <div style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '18px 24px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
        }}>
            <div style={{
                width: '36px', height: '36px',
                background: `${color}18`,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={18} color={color} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#1a1a1a' }}>{title}</h3>
        </div>
        <div style={{ padding: '24px' }}>
            {children}
        </div>
    </div>
);

// ── Page Admin ───────────────────────────────────────────────
const AdminSettings = () => {
    const { isAdmin } = useApp();

    const [settings, setSettings]   = useState(null);
    const [openaiKey, setOpenaiKey] = useState('');
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
    const [partnerName, setPartnerName] = useState('');
    const [partnerUrl, setPartnerUrl] = useState('');
    const [partnerLogoFile, setPartnerLogoFile] = useState(null);
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
    const [aiKey,         setAiKey]         = useState('');
    const [showKey,       setShowKey]       = useState(false);

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

                // Clé OpenAI séparée (endpoint dédié)
                try {
                    const k = await api.settings.getOpenAIKey();
                    setAiKey(k.openai_key || '');
                } catch { /* pas critique */ }
            } catch (e) {
                showToast('error', 'Erreur de chargement : ' + e.message);
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
            };
            if (aiKey !== undefined) payload.openai_key = aiKey;

            await api.settings.update(payload);
            showToast('success', 'Paramètres sauvegardés !');
        } catch (e) {
            showToast('error', 'Erreur : ' + e.message);
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

    const handleCreatePartner = async () => {
        if (!partnerName.trim()) {
            showToast('error', 'Le nom du partenaire est requis.');
            return;
        }
        setSavingPartners(true);
        try {
            let logoPath = null;
            if (partnerLogoFile) {
                const uploadRes = await api.media.upload(partnerLogoFile);
                logoPath = uploadRes?.url || null;
            }
            await api.partners.create({
                name: partnerName.trim(),
                url: partnerUrl.trim() || null,
                logo_path: logoPath,
            });
            setPartnerName('');
            setPartnerUrl('');
            setPartnerLogoFile(null);
            await loadPartners();
            showToast('success', 'Partenaire importé.');
        } catch (e) {
            showToast('error', 'Erreur import partenaire : ' + e.message);
        } finally {
            setSavingPartners(false);
        }
    };

    const handleDeletePartner = async (id, name) => {
        if (!confirm(`Supprimer le partenaire "${name}" ?`)) return;
        try {
            await api.partners.delete(id);
            await Promise.all([loadPartners(), loadMainSitePartners()]);
            showToast('success', 'Partenaire supprimé.');
        } catch (e) {
            showToast('error', 'Erreur suppression partenaire : ' + e.message);
        }
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

            showToast('success', 'Partenaires du site principal enregistrés.');
        } catch (e) {
            showToast('error', 'Erreur enregistrement partenaires : ' + e.message);
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
                    onSaved={() => { loadSubsites(); showToast('success', 'Sous-site sauvegardé !'); }}
                />
            )}

            {/* ── Toast ─────────────────────────────────────── */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '24px',
                    zIndex: 9999,
                    background: toast.type === 'success' ? '#e8f5e9' : '#fff0f0',
                    border: `1px solid ${toast.type === 'success' ? '#a5d6a7' : '#ffcdd2'}`,
                    borderRadius: '12px',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    animation: 'slideIn 0.2s ease-out',
                    maxWidth: '340px',
                }}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={18} color="#2e7d32" />
                        : <AlertCircle size={18} color="#d32f2f" />
                    }
                    <span style={{ fontWeight: '600', fontSize: '0.88rem', color: toast.type === 'success' ? '#2e7d32' : '#d32f2f' }}>
                        {toast.msg}
                    </span>
                </div>
            )}

            {/* ── En-tête ──────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>Administration</h1>
                    <p style={{ margin: '4px 0 0', color: '#999', fontSize: '0.88rem' }}>Paramètres globaux de l'application</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: saving ? '#ccc' : '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 22px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
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
                    {/* ── Section 1 : soumissions anonymes ─── */}
                    <Section icon={Users} title="Soumissions de visiteurs" color="#3b5bdb">

                        <Field
                            label="Autoriser les soumissions anonymes"
                            hint="Si désactivé, seuls les utilisateurs connectés pourront proposer des cartels."
                        >
                            <Toggle value={allowAnon} onChange={setAllowAnon} />
                        </Field>

                        {allowAnon && (
                            <div style={{
                                background: '#f8f9ff',
                                border: '1px solid #e0e4ff',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                            }}>
                                {/* Limite totale par IP */}
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

                                {/* Fenêtre glissante */}
                                <div style={{ borderTop: '1px solid #e0e4ff', paddingTop: '20px' }}>
                                    <p style={{ margin: '0 0 14px', fontWeight: '700', fontSize: '0.88rem', color: '#333' }}>
                                        Limite sur fenêtre glissante
                                    </p>
                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                        <Field
                                            label="Soumissions autorisées par fenêtre"
                                            hint="Nombre max de cartels sur la période définie ci-dessous."
                                        >
                                            <NumberInput
                                                value={maxWindow}
                                                onChange={v => setMaxWindow(Number(v))}
                                                min={1}
                                                max={50}
                                                suffix="cartels"
                                            />
                                        </Field>

                                        <Field
                                            label="Durée de la fenêtre"
                                            hint="Période glissante de contrôle."
                                        >
                                            <NumberInput
                                                value={windowMinutes}
                                                onChange={v => setWindowMinutes(Number(v))}
                                                min={1}
                                                max={1440}
                                                suffix="minutes"
                                            />
                                        </Field>
                                    </div>

                                    {/* Résumé lisible */}
                                    <div style={{
                                        background: '#e8ecff',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        marginTop: '4px',
                                        fontSize: '0.87rem',
                                        color: '#3b5bdb',
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

                    {/* ── Section 2 : clé API IA ───────────── */}
                    <Section icon={Key} title="Clé API (traduction automatique)" color="#e67e00">
                        <Field
                            label="Clé OpenAI ou DeepL"
                            hint="Utilisée pour la traduction automatique des cartels. Commence par sk-… (OpenAI) ou se termine par :fx (DeepL Free)."
                        >
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={aiKey}
                                    onChange={e => setAiKey(e.target.value)}
                                    placeholder="sk-… ou votre clé DeepL"
                                    style={{
                                        flex: 1,
                                        minWidth: '260px',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        background: '#f8f8f8',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontFamily: 'inherit',
                                        color: '#666',
                                    }}
                                >
                                    {showKey ? 'Masquer' : 'Afficher'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || loading}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: saving ? '#999' : '#e67e00',
                                        color: 'white',
                                        cursor: saving || loading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: '700',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {saving ? 'Envoi…' : 'Enregistrer la clé'}
                                </button>
                            </div>
                            {aiKey && (
                                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                                    {aiKey.startsWith('sk-') ? 'Format OpenAI détecté' : aiKey.endsWith(':fx') ? 'Format DeepL Free détecté' : 'Format non reconnu'}
                                </p>
                            )}
                            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#888' }}>
                                Cliquez sur « Enregistrer la clé » après collage pour confirmer la prise en compte.
                            </p>
                        </Field>
                    </Section>

                    {/* ── Section 3 : Partenaires ──────────── */}
                    <Section icon={Users} title="Partenaires" color="#00897b">
                        {/* Toggler */}
                        <div style={{ border: '1px solid #e6f2ef', borderRadius: '12px', overflow: 'hidden' }}>
                            <button
                                type="button"
                                onClick={() => setPartnersExpanded(v => !v)}
                                style={{
                                    width: '100%', border: 'none', background: '#f4fbf9',
                                    padding: '14px 18px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', cursor: 'pointer',
                                    fontWeight: '700', color: '#16695f', fontFamily: 'inherit',
                                }}
                            >
                                <span>Gérer les partenaires du site et des sous-sites</span>
                                {partnersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {partnersExpanded && (
                                <div style={{ background: 'white' }}>

                                    {/* ── Bloc A : Bibliothèque ── */}
                                    <div style={{ padding: '20px 20px 0' }}>
                                        <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#00897b' }}>
                                            A — Bibliothèque de partenaires
                                        </p>
                                        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#888' }}>
                                            Chaque partenaire ajouté ici est disponible pour le site principal et tous les sous-sites.
                                        </p>

                                        {/* Formulaire d'ajout */}
                                        <div style={{ background: '#f8fffe', border: '1px solid #d0ede8', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                                <input
                                                    value={partnerName}
                                                    onChange={e => setPartnerName(e.target.value)}
                                                    placeholder="Nom du partenaire *"
                                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                                                />
                                                <input
                                                    value={partnerUrl}
                                                    onChange={e => setPartnerUrl(e.target.value)}
                                                    placeholder="URL (https://...)"
                                                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed #b2dfdb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.83rem', color: '#555', background: 'white' }}>
                                                    <Upload size={14} color="#00897b" />
                                                    {partnerLogoFile ? partnerLogoFile.name : 'Choisir un logo…'}
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setPartnerLogoFile(e.target.files?.[0] || null)} />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleCreatePartner}
                                                    disabled={savingPartners || !partnerName.trim()}
                                                    style={{
                                                        flexShrink: 0, border: 'none', borderRadius: '8px', padding: '9px 16px',
                                                        background: (savingPartners || !partnerName.trim()) ? '#b2dfdb' : '#00897b',
                                                        color: 'white', fontWeight: '700', cursor: (savingPartners || !partnerName.trim()) ? 'not-allowed' : 'pointer',
                                                        fontFamily: 'inherit', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px',
                                                    }}
                                                >
                                                    <Plus size={14} /> Ajouter
                                                </button>
                                            </div>
                                        </div>

                                        {/* Liste des partenaires */}
                                        {partners.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: '#bbb', padding: '16px 0', fontSize: '0.85rem' }}>
                                                Aucun partenaire dans la bibliothèque.
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
                                                {partners.map(p => {
                                                    const isPrimary = sitePrimaryPartnerIds.includes(p.id);
                                                    const isRegular = sitePartnerIds.includes(p.id);
                                                    return (
                                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #eee', borderRadius: '10px', padding: '8px 12px', background: '#fafafa' }}>
                                                            {/* Logo ou initiale */}
                                                            {p.logo_path ? (
                                                                <img src={p.logo_path} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: 'white', border: '1px solid #eee' }} />
                                                            ) : (
                                                                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#e0f2f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#00897b', fontSize: '0.9rem', flexShrink: 0 }}>
                                                                    {p.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                                {p.url && <div style={{ fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</div>}
                                                            </div>
                                                            {/* Badge de statut */}
                                                            {isPrimary && <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#e0f2f1', color: '#00695c', whiteSpace: 'nowrap' }}>★ Principal</span>}
                                                            {isRegular && <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#eceff1', color: '#546e7a', whiteSpace: 'nowrap' }}>Standard</span>}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeletePartner(p.id, p.name)}
                                                                style={{ flexShrink: 0, border: '1px solid #fecaca', background: 'white', color: '#b42318', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Séparateur */}
                                    <div style={{ margin: '20px 0', borderTop: '1px solid #e8f5f3' }} />

                                    {/* ── Bloc B : Sélection site principal ── */}
                                    <div style={{ padding: '0 20px 20px' }}>
                                        <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#00897b' }}>
                                            B — Affichage sur le site principal
                                        </p>
                                        <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#888' }}>
                                            Un partenaire ne peut être que dans une seule liste. Cliquez pour cocher/décocher.
                                        </p>

                                        {partners.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#bbb' }}>Ajoutez d'abord des partenaires dans la bibliothèque.</p>
                                        ) : (
                                            <>
                                                {/* Principaux */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#00695c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ background: '#e0f2f1', borderRadius: '4px', padding: '2px 7px' }}>★ Principaux</span>
                                                        <span style={{ fontWeight: '400', color: '#aaa' }}>— mis en avant (grande vignette)</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {partners.map(p => {
                                                            const active = sitePrimaryPartnerIds.includes(p.id);
                                                            return (
                                                                <button
                                                                    key={`site-primary-${p.id}`}
                                                                    type="button"
                                                                    onClick={() => toggleSitePrimaryPartner(p.id)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                                        borderRadius: '20px',
                                                                        border: active ? '2px solid #00695c' : '2px solid #e0e0e0',
                                                                        background: active ? '#00897b' : '#f5f5f5',
                                                                        color: active ? 'white' : '#555',
                                                                        padding: '5px 12px', fontSize: '0.84rem',
                                                                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600',
                                                                        transition: 'all 0.12s',
                                                                    }}
                                                                >
                                                                    {p.logo_path && <img src={p.logo_path} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }} />}
                                                                    {p.name}
                                                                    {active && <Check size={12} />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Standards */}
                                                <div style={{ marginBottom: '16px' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#546e7a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ background: '#eceff1', borderRadius: '4px', padding: '2px 7px' }}>Standards</span>
                                                        <span style={{ fontWeight: '400', color: '#aaa' }}>— affichage secondaire</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {partners.map(p => {
                                                            const active = sitePartnerIds.includes(p.id);
                                                            return (
                                                                <button
                                                                    key={`site-regular-${p.id}`}
                                                                    type="button"
                                                                    onClick={() => toggleSitePartner(p.id)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                                        borderRadius: '20px',
                                                                        border: active ? '2px solid #546e7a' : '2px solid #e0e0e0',
                                                                        background: active ? '#78909c' : '#f5f5f5',
                                                                        color: active ? 'white' : '#555',
                                                                        padding: '5px 12px', fontSize: '0.84rem',
                                                                        cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600',
                                                                        transition: 'all 0.12s',
                                                                    }}
                                                                >
                                                                    {p.logo_path && <img src={p.logo_path} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '3px' }} />}
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
                                                        border: 'none', borderRadius: '8px', padding: '10px 18px',
                                                        background: savingPartners ? '#9fb6b1' : '#00695c', color: 'white',
                                                        fontWeight: '700', cursor: savingPartners ? 'not-allowed' : 'pointer',
                                                        fontFamily: 'inherit', fontSize: '0.88rem',
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

                    {/* ── Section 3 : info système ─────────── */}
                    <Section icon={Shield} title="Informations système" color="#888">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Soumissions anonymes',  value: allowAnon ? 'Autorisées' : 'Bloquées' },
                                { label: 'Limite globale / IP',   value: `${maxTotal} cartels` },
                                { label: 'Limite sur fenêtre',    value: `${maxWindow} cartels / ${windowMinutes} min` },
                                { label: 'Clé IA configurée',     value: aiKey ? 'Oui' : 'Non' },
                            ].map(({ label, value }) => (
                                <div
                                    key={label}
                                    style={{
                                        background: '#f8f8f8',
                                        borderRadius: '10px',
                                        padding: '14px 16px',
                                    }}
                                >
                                    <div style={{ fontSize: '0.78rem', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                                        {label}
                                    </div>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#333' }}>
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                    {/* ── Section 4 : Sous-sites ──────────── */}
                    <Section icon={Globe} title="Sous-sites thématiques" color="#6741d9">
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditSubsite('new')}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#6741d9', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem', fontFamily: 'inherit' }}>
                                <Plus size={14} /> Nouveau sous-site
                            </button>
                        </div>
                        {subsites.length === 0 ? (
                            <p style={{ color: '#bbb', textAlign: 'center', padding: '24px 0' }}>Aucun sous-site configuré.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {subsites.map(s => (
                                    <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fafafa', border: '1px solid #eee', borderRadius: '10px', padding: '12px 16px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.primary_color, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.name}</div>
                                            <div style={{ color: '#aaa', fontSize: '0.78rem' }}>/site/{s.slug} · {s.category_name}</div>
                                        </div>
                                        <a href={`#/site/${s.slug}`} target="_blank" rel="noopener" title="Ouvrir" style={{ color: '#aaa', display: 'flex' }}><ExternalLink size={14} /></a>
                                        <button onClick={() => setEditSubsite(s)} title="Modifier"
                                            style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}>
                                            <Edit size={13} />
                                        </button>
                                        <button onClick={async () => { if (!confirm(`Supprimer "${s.name}" ?`)) return; await api.subsites.delete(s.slug); loadSubsites(); }} title="Supprimer"
                                            style={{ background: 'none', border: '1px solid #fcc', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: '#d32f2f', display: 'flex', alignItems: 'center' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
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
