import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Save, RefreshCw, Search, Filter } from 'lucide-react';
import api from '../services/apiClient';

const PAGE_SIZE = 100;

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString();
};

const Tab = ({ active, icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', border: 'none',
            background: active ? 'white' : 'transparent',
            color: active ? '#222' : '#666',
            borderBottom: active ? '3px solid #6741d9' : '3px solid transparent',
            cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, fontFamily: 'inherit',
        }}
    >
        <Icon size={16} /> {label}
    </button>
);

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
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>Type</label>
                    <select
                        value={filters.type}
                        onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.88rem', minWidth: 220 }}
                    >
                        <option value="">— tous —</option>
                        {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ flex: '1 1 220px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>Recherche (résumé)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={filters.q}
                            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { setPage(0); load(); } }}
                            placeholder="ex: titre cartel, email…"
                            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#aaa' }} />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', marginBottom: 4 }}>Depuis</label>
                    <input
                        type="datetime-local"
                        value={filters.since}
                        onChange={e => setFilters(f => ({ ...f, since: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.88rem' }}
                    />
                </div>
                <button
                    onClick={() => { setPage(0); load(); }}
                    style={{ padding: '8px 14px', border: '1px solid #6741d9', borderRadius: 6, background: '#6741d9', color: 'white', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <Filter size={14} /> Filtrer
                </button>
                <button
                    onClick={() => { setFilters({ type: '', q: '', since: '' }); setPage(0); setTimeout(load, 0); }}
                    style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {error && <div style={{ background: '#fee', color: '#a00', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.88rem' }}>{error}</div>}

            {/* Tableau */}
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #eee', overflow: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#fafafa' }}>
                        <tr>
                            <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>Date</th>
                            <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>Type</th>
                            <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>Acteur</th>
                            <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>Résumé</th>
                            <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#fafafa', zIndex: 1 }}>Cible</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>Chargement…</td></tr>}
                        {!loading && items.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>Aucun événement.</td></tr>}
                        {!loading && items.map(it => (
                            <tr key={it.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                                <td style={{ padding: 10, whiteSpace: 'nowrap', color: '#555', fontSize: '0.82rem' }}>{fmtDate(it.created_at)}</td>
                                <td style={{ padding: 10 }}>
                                    <code style={{ background: '#f5f3ff', color: '#6741d9', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{it.type}</code>
                                </td>
                                <td style={{ padding: 10, color: '#444' }}>{it.actor_email || (it.actor_id ? it.actor_id.slice(0, 8) + '…' : <em style={{ color: '#999' }}>anonyme</em>)}</td>
                                <td style={{ padding: 10 }}>{it.summary || ''}</td>
                                <td style={{ padding: 10, color: '#888', fontFamily: 'monospace', fontSize: '0.78rem' }}>{it.target_id ? String(it.target_id).slice(0, 8) + '…' : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ color: '#666' }}>{total} événement(s) — page {page + 1} / {totalPages}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>← Précédent</button>
                    <button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer', opacity: page + 1 >= totalPages ? 0.4 : 1 }}>Suivant →</button>
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

    // Track des lignes modifiées (set de types). Vide = rien à sauvegarder.
    const [dirty, setDirty] = useState(() => new Set());

    // Bulk update : changer le destinataire de tous les types d'un coup
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
        if (!window.confirm(`Remplacer le destinataire de TOUS les types par "${value}" ?\n\nLes autres réglages (activation, spam, préfixe) sont conservés.`)) return;
        setBulkSaving(true); setError(''); setSuccess('');
        try {
            const { affected, items: fresh } = await api.logs.bulkSetRecipient(value);
            setItems(fresh || []);
            setDirty(new Set());  // le bulk a tout sauvegardé côté serveur
            setSuccess(`Destinataire appliqué à ${affected} type(s).`);
            setBulkRecipient('');
            setTimeout(() => setSuccess(''), 3000);
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

    /** Sauvegarde les lignes modifiées en parallèle (max 5 en simultané). */
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
                        // On met à jour items avec la version serveur (pas de re-render
                        // de la position de la ligne car le type ne change pas)
                        setItems(prev => prev.map(x => x.type === it.type ? updated : x));
                    } catch (e) {
                        failed.push({ type: it.type, message: e.message });
                    }
                }));
            }
            if (failed.length) {
                setError(`${failed.length} échec(s) : ` + failed.map(f => f.type).join(', '));
                // Garder dirty sur les types en échec uniquement
                setDirty(new Set(failed.map(f => f.type)));
            } else {
                setSuccess(`${toSave.length} type(s) sauvegardé(s).`);
                setDirty(new Set());
                setTimeout(() => setSuccess(''), 2500);
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

    if (loading) return <div style={{ padding: 24, color: '#999' }}>Chargement…</div>;

    return (
        <div>
            <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 0 }}>
                Pour chaque type d'événement, configurez si un email est envoyé, à quel destinataire,
                avec quel préfixe de sujet, et si l'en-tête <code>X-Spam-Flag</code> doit être ajouté
                (utile pour des règles de tri côté boîte de réception).
            </p>

            {/* Bulk : changer le destinataire de tous les types */}
            <div style={{
                background: '#f5f3ff', border: '1px solid #d9ccff',
                borderRadius: 10, padding: '14px 16px', marginBottom: 18,
            }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5327b5', marginBottom: 8 }}>
                    Appliquer un destinataire à tous les types
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#666' }}>
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
                        style={{
                            flex: '1 1 280px',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #d9ccff',
                            fontSize: '0.9rem',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={bulkSaving || !bulkRecipient.trim()}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: bulkSaving || !bulkRecipient.trim() ? '#bbb' : '#6741d9',
                            color: 'white',
                            borderRadius: 6,
                            cursor: bulkSaving || !bulkRecipient.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                        }}
                    >
                        {bulkSaving ? 'Application…' : 'Appliquer à tous'}
                    </button>
                </form>
            </div>

            {error && <div style={{ background: '#fee', color: '#a00', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.88rem' }}>{error}</div>}
            {success && <div style={{ background: '#e6f7ec', color: '#1f7a3f', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: '0.88rem' }}>{success}</div>}

            {/* Padding bas pour ne pas que le sticky footer cache la dernière ligne */}
            <div style={{ paddingBottom: dirty.size ? 80 : 0 }}>
                {grouped.map(([scope, group]) => (
                    <div key={scope} style={{ marginBottom: 24 }}>
                        <h3 style={{ margin: '8px 0', textTransform: 'capitalize', color: '#444', fontSize: '1rem' }}>{scope}</h3>
                        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 10, overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: '#fafafa' }}>
                                    <tr>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Type</th>
                                        <th style={{ padding: 10, textAlign: 'center', width: 90 }}>Email</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Destinataire</th>
                                        <th style={{ padding: 10, textAlign: 'left', width: 140 }}>Sujet préfixe</th>
                                        <th style={{ padding: 10, textAlign: 'center', width: 90 }}>Spam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.map(it => {
                                        const isDirty = dirty.has(it.type);
                                        return (
                                            <tr key={it.type} style={{
                                                borderTop: '1px solid #f3f3f3',
                                                background: isDirty ? '#fff8e1' : 'transparent',
                                                transition: 'background 0.15s',
                                            }}>
                                                <td style={{ padding: 10 }}>
                                                    <code style={{ background: '#f5f3ff', color: '#6741d9', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>{it.type}</code>
                                                    {isDirty && <span title="Modification non sauvegardée" style={{ marginLeft: 6, color: '#d97706', fontSize: '0.78rem' }}>●</span>}
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
                                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                    />
                                                </td>
                                                <td style={{ padding: 10 }}>
                                                    <input
                                                        type="text"
                                                        value={it.subject_prefix || '[Paléo]'}
                                                        onChange={e => updateLocal(it.type, { subject_prefix: e.target.value })}
                                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: '0.85rem', boxSizing: 'border-box' }}
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
                    background: 'white',
                    borderTop: '1px solid #e0e0e0',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                    padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    zIndex: 10,
                }}>
                    <span style={{ fontSize: '0.9rem', color: '#444' }}>
                        <strong style={{ color: '#d97706' }}>●</strong>{' '}
                        {dirty.size} modification{dirty.size > 1 ? 's' : ''} non sauvegardée{dirty.size > 1 ? 's' : ''}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button
                            onClick={discardChanges}
                            disabled={savingAll}
                            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: savingAll ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={saveAll}
                            disabled={savingAll}
                            style={{
                                padding: '8px 18px', borderRadius: 6, border: 'none',
                                background: savingAll ? '#aaa' : '#6741d9', color: 'white',
                                cursor: savingAll ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem', fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', gap: 6,
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
const AdminLogs = () => {
    const { isAdmin } = useApp();
    const navigate = useNavigate();
    const [tab, setTab] = useState('logs');

    if (!isAdmin) {
        return (
            <div className="container" style={{ padding: 24 }}>
                <p>Accès réservé aux superadmins.</p>
                <button onClick={() => navigate('/app')}>Retour</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: 1280, padding: '20px 24px 80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Activity size={22} />
                <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Journal d'événements</h1>
            </div>

            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #eee', marginBottom: 20 }}>
                <Tab active={tab === 'logs'}   icon={Activity} label="Journal"               onClick={() => setTab('logs')} />
                <Tab active={tab === 'config'} icon={Mail}     label="Configuration emails" onClick={() => setTab('config')} />
            </div>

            {tab === 'logs' ? <LogsTab /> : <EmailConfigTab />}
        </div>
    );
};

export default AdminLogs;
