import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Save, RefreshCw, Search, Filter } from 'lucide-react';
import api from '../services/apiClient';
import Toast from '../components/Toast';
import {
    AdminPageHeader, AdminToast, AdminTabs, AdminTabDescription, useAdminToast,
    primaryBtnStyle, ghostBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

const PAGE_SIZE = 100;

const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString();
};

// ── Style commun pour les en-têtes de tableau ─────────────────
const thStyle = {
    padding: 10,
    textAlign: 'left',
    background: 'var(--color-surface-2)',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-heading)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    fontWeight: '700',
    fontSize: '0.74rem',
    color: 'var(--color-text-muted)',
    position: 'sticky', top: 0, zIndex: 1,
};

const codeStyle = {
    background: 'var(--color-accent-soft)',
    color: 'var(--color-primary)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.78rem',
    fontWeight: '700',
};

// ── Onglet Journal ───────────────────────────────────────────
const LogsTab = () => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allTypes, setAllTypes] = useState([]);
    const [filters, setFilters] = useState({ type: '', q: '', since: '' });
    const [page, setPage] = useState(0);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const params = {
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
            };
            if (filters.type)  params.types = filters.type;
            if (filters.q)     params.q = filters.q;
            if (filters.since) params.since = filters.since;
            const data = await api.logs.list(params);
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);
    useEffect(() => {
        api.logs.distinctTypes().then(d => setAllTypes(d.types || [])).catch(() => {});
    }, []);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
                <div>
                    <label style={labelStyle}>Type</label>
                    <select
                        value={filters.type}
                        onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                        style={{ ...inputStyle, minWidth: 220, cursor: 'pointer' }}
                    >
                        <option value="">— tous —</option>
                        {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ flex: '1 1 220px' }}>
                    <label style={labelStyle}>Recherche (résumé)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={filters.q}
                            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { setPage(0); load(); } }}
                            placeholder="ex : titre cartel, email…"
                            style={{ ...inputStyle, paddingLeft: 32 }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--color-text-subtle)' }} />
                    </div>
                </div>
                <div>
                    <label style={labelStyle}>Depuis</label>
                    <input
                        type="datetime-local"
                        value={filters.since}
                        onChange={e => setFilters(f => ({ ...f, since: e.target.value }))}
                        style={inputStyle}
                    />
                </div>
                <button onClick={() => { setPage(0); load(); }} style={primaryBtnStyle}>
                    <Filter size={14} /> Filtrer
                </button>
                <button
                    onClick={() => { setFilters({ type: '', q: '', since: '' }); setPage(0); setTimeout(load, 0); }}
                    style={ghostBtnStyle}
                    title="Réinitialiser les filtres"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <Toast visible={!!error} type="error" message={error} onDismiss={() => setError('')} />

            {/* Tableau */}
            <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'auto',
                maxHeight: 'calc(100vh - 360px)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Acteur</th>
                            <th style={thStyle}>Résumé</th>
                            <th style={thStyle}>Cible</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-subtle)' }}>Chargement…</td></tr>}
                        {!loading && items.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-subtle)' }}>Aucun événement.</td></tr>}
                        {!loading && items.map(it => (
                            <tr key={it.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 10, whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{fmtDate(it.created_at)}</td>
                                <td style={{ padding: 10 }}>
                                    <code style={codeStyle}>{it.type}</code>
                                </td>
                                <td style={{ padding: 10, color: 'var(--color-text)' }}>
                                    {it.actor_email || (it.actor_id ? it.actor_id.slice(0, 8) + '…' : <em style={{ color: 'var(--color-text-subtle)' }}>anonyme</em>)}
                                </td>
                                <td style={{ padding: 10 }}>{it.summary || ''}</td>
                                <td style={{ padding: 10, color: 'var(--color-text-subtle)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                    {it.target_id ? String(it.target_id).slice(0, 8) + '…' : ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{total} événement(s) — page {page + 1} / {totalPages}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        style={{ ...ghostBtnStyle, opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                    >
                        ← Précédent
                    </button>
                    <button
                        disabled={page + 1 >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        style={{ ...ghostBtnStyle, opacity: page + 1 >= totalPages ? 0.4 : 1, cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Suivant →
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Onglet Configuration emails ──────────────────────────────
const EmailConfigTab = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingAll, setSavingAll] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dirty, setDirty] = useState(() => new Set());
    const [bulkRecipient, setBulkRecipient] = useState('');
    const [bulkSaving, setBulkSaving] = useState(false);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const data = await api.logs.getEmailConfig();
            setItems(data.items || []);
            setDirty(new Set());
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const applyBulkRecipient = async () => {
        const value = bulkRecipient.trim();
        if (!value) return;
        if (!window.confirm(`Remplacer le destinataire de TOUS les types par « ${value} » ?\n\nLes autres réglages (activation, spam, préfixe) sont conservés.`)) return;
        setBulkSaving(true); setError(''); setSuccess('');
        try {
            const { affected, items: fresh } = await api.logs.bulkSetRecipient(value);
            setItems(fresh || []);
            setDirty(new Set());
            setSuccess(`Destinataire appliqué à ${affected} type(s).`);
            setBulkRecipient('');
        } catch (e) { setError(e.message); }
        finally { setBulkSaving(false); }
    };

    const updateLocal = (type, patch) => {
        setItems(prev => prev.map(it => it.type === type ? { ...it, ...patch } : it));
        setDirty(prev => {
            const next = new Set(prev);
            next.add(type);
            return next;
        });
    };

    const saveAll = async () => {
        const toSave = Array.from(dirty)
            .map(type => items.find(it => it.type === type))
            .filter(Boolean);
        if (!toSave.length) return;

        setSavingAll(true); setError(''); setSuccess('');
        const concurrency = 5;
        const failed = [];
        try {
            for (let i = 0; i < toSave.length; i += concurrency) {
                const slice = toSave.slice(i, i + concurrency);
                await Promise.all(slice.map(async it => {
                    try {
                        const updated = await api.logs.updateEmailConfig(it.type, {
                            enabled:        !!it.enabled,
                            recipient:      it.recipient || '',
                            mark_as_spam:   !!it.mark_as_spam,
                            subject_prefix: it.subject_prefix || '[Paléo]',
                        });
                        setItems(prev => prev.map(x => x.type === it.type ? updated : x));
                    } catch (e) {
                        failed.push({ type: it.type, message: e.message });
                    }
                }));
            }
            if (failed.length) {
                setError(`${failed.length} échec(s) : ` + failed.map(f => f.type).join(', '));
                setDirty(new Set(failed.map(f => f.type)));
            } else {
                setSuccess(`${toSave.length} type(s) sauvegardé(s).`);
                setDirty(new Set());
            }
        } finally {
            setSavingAll(false);
        }
    };

    const discardChanges = async () => {
        if (!dirty.size) return;
        if (!window.confirm(`Annuler les ${dirty.size} modification(s) non sauvegardée(s) ?`)) return;
        await load();
    };

    const grouped = useMemo(() => {
        const map = new Map();
        items.forEach(it => {
            const [scope] = it.type.split('.');
            if (!map.has(scope)) map.set(scope, []);
            map.get(scope).push(it);
        });
        return Array.from(map.entries());
    }, [items]);

    if (loading) return <div style={{ padding: 24, color: 'var(--color-text-subtle)' }}>Chargement…</div>;

    const cellInputStyle = { ...inputStyle, padding: '6px 8px', fontSize: '0.85rem' };

    return (
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: 0 }}>
                Pour chaque type d'événement, configurez si un email est envoyé, à quel destinataire,
                avec quel préfixe de sujet, et si l'en-tête <code style={codeStyle}>X-Spam-Flag</code> doit être ajouté
                (utile pour des règles de tri côté boîte de réception).
            </p>

            {/* Bulk : changer le destinataire de tous les types */}
            <div style={{
                background: 'var(--color-accent-soft)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 18,
            }}>
                <div style={{
                    fontSize: '0.78rem', fontWeight: '700',
                    color: 'var(--color-primary)',
                    marginBottom: 8,
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    Appliquer un destinataire à tous les types
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Remplace le champ « Destinataire » de tous les types d'un seul coup.
                    Les autres réglages (Email activé, Spam, Sujet préfixe) ne sont pas modifiés.
                </p>
                <form
                    onSubmit={e => { e.preventDefault(); applyBulkRecipient(); }}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                >
                    <input
                        type="email"
                        value={bulkRecipient}
                        onChange={e => setBulkRecipient(e.target.value)}
                        placeholder="hello@atelier21.org"
                        disabled={bulkSaving}
                        style={{ ...inputStyle, flex: '1 1 280px' }}
                    />
                    <button
                        type="submit"
                        disabled={bulkSaving || !bulkRecipient.trim()}
                        style={{
                            ...primaryBtnStyle,
                            opacity: bulkSaving || !bulkRecipient.trim() ? 0.5 : 1,
                            cursor: bulkSaving || !bulkRecipient.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {bulkSaving ? 'Application…' : 'Appliquer à tous'}
                    </button>
                </form>
            </div>

            <Toast visible={!!error}   type="error"   message={error}   onDismiss={() => setError('')} />
            <Toast visible={!!success} type="success" message={success} onDismiss={() => setSuccess('')} />

            <div style={{ paddingBottom: dirty.size ? 80 : 0 }}>
                {grouped.map(([scope, group]) => (
                    <div key={scope} style={{ marginBottom: 24 }}>
                        <h3 style={{
                            margin: '8px 0',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-heading)',
                            letterSpacing: '0.5px',
                        }}>{scope}</h3>
                        <div style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'auto',
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Type</th>
                                        <th style={{ ...thStyle, textAlign: 'center', width: 90 }}>Email</th>
                                        <th style={thStyle}>Destinataire</th>
                                        <th style={{ ...thStyle, width: 140 }}>Sujet préfixe</th>
                                        <th style={{ ...thStyle, textAlign: 'center', width: 90 }}>Spam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.map(it => {
                                        const isDirty = dirty.has(it.type);
                                        return (
                                            <tr key={it.type} style={{
                                                borderTop: '1px solid var(--color-border)',
                                                background: isDirty ? 'var(--color-accent-soft)' : 'transparent',
                                                transition: 'background 0.15s',
                                            }}>
                                                <td style={{ padding: 10 }}>
                                                    <code style={codeStyle}>{it.type}</code>
                                                    {isDirty && <span title="Modification non sauvegardée" style={{ marginLeft: 6, color: 'var(--color-warning)', fontSize: '0.78rem' }}>●</span>}
                                                </td>
                                                <td style={{ padding: 10, textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!it.enabled}
                                                        onChange={e => updateLocal(it.type, { enabled: e.target.checked })}
                                                    />
                                                </td>
                                                <td style={{ padding: 10 }}>
                                                    <input
                                                        type="email"
                                                        value={it.recipient || ''}
                                                        onChange={e => updateLocal(it.type, { recipient: e.target.value })}
                                                        placeholder="hello@atelier21.org"
                                                        style={cellInputStyle}
                                                    />
                                                </td>
                                                <td style={{ padding: 10 }}>
                                                    <input
                                                        type="text"
                                                        value={it.subject_prefix || '[Paléo]'}
                                                        onChange={e => updateLocal(it.type, { subject_prefix: e.target.value })}
                                                        style={cellInputStyle}
                                                    />
                                                </td>
                                                <td style={{ padding: 10, textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!it.mark_as_spam}
                                                        onChange={e => updateLocal(it.type, { mark_as_spam: e.target.checked })}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky footer : visible uniquement quand il y a des modifs en attente */}
            {dirty.size > 0 && (
                <div style={{
                    position: 'sticky', bottom: 0, left: 0, right: 0,
                    marginTop: 16,
                    background: 'var(--color-surface)',
                    borderTop: '1px solid var(--color-border)',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    zIndex: 10,
                }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                        <strong style={{ color: 'var(--color-warning)' }}>●</strong>{' '}
                        {dirty.size} modification{dirty.size > 1 ? 's' : ''} non sauvegardée{dirty.size > 1 ? 's' : ''}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button onClick={discardChanges} disabled={savingAll} style={ghostBtnStyle}>
                            Annuler
                        </button>
                        <button
                            onClick={saveAll}
                            disabled={savingAll}
                            style={{
                                ...primaryBtnStyle,
                                opacity: savingAll ? 0.5 : 1,
                                cursor: savingAll ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <Save size={14} /> {savingAll ? 'Enregistrement…' : `Enregistrer (${dirty.size})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Page racine ──────────────────────────────────────────────
const TABS = [
    { key: 'logs',   label: 'Journal',               icon: Activity },
    { key: 'config', label: 'Configuration emails', icon: Mail },
];

const AdminLogs = () => {
    const { isAdmin } = useApp();
    const navigate = useNavigate();
    const [tab, setTab] = useState('logs');

    if (!isAdmin) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
                <p style={{ color: 'var(--color-text-subtle)', textAlign: 'center' }}>Accès réservé aux superadmins.</p>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button onClick={() => navigate('/app')} style={ghostBtnStyle}>Retour</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminPageHeader icon={Activity} title="Journal d'événements" />

            <AdminTabs tabs={TABS} active={tab} onChange={setTab} />

            <AdminTabDescription>
                {tab === 'logs'
                    ? 'Historique chronologique de tous les événements (publications, créations de comptes, modifications). Filtrable par type, mots-clés et date.'
                    : 'Réglages des notifications email envoyées par l\'application pour chaque type d\'événement.'}
            </AdminTabDescription>

            {tab === 'logs' ? <LogsTab /> : <EmailConfigTab />}
        </div>
    );
};

export default AdminLogs;
