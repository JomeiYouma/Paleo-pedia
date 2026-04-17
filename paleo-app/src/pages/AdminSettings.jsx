import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
    Shield, Users, Key, Save, RefreshCw,
    ToggleLeft, ToggleRight, Clock, Hash, AlertCircle, CheckCircle2,
    Globe, Plus, Trash2, Edit, ExternalLink
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

    const loadSubsites = () => api.subsites.getAll().then(d => setSubsites(Array.isArray(d) ? d : [])).catch(() => {});
    useEffect(() => { loadSubsites(); }, []);

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
