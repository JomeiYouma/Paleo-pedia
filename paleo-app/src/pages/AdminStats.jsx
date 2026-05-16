import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Filter, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import api from '../services/apiClient';
import ExplainerBox from '../components/ExplainerBox';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast,
    primaryBtnStyle, ghostBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// Palette par défaut quand l'agrégation ne fournit pas de couleur (sous-sites
// sans primary_color, statuts, etc.). Choisie pour rester lisible sur fond clair.
const FALLBACK_COLORS = [
    '#6b7280', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ef4444', '#14b8a6', '#f97316', '#a855f7', '#06b6d4',
];

const STATUS_LABELS = {
    draft:          'Brouillon',
    pending_review: 'En attente',
    published:      'Publié',
    archived:       'Archivé',
};

const STATUS_COLORS = {
    draft:          '#9ca3af',
    pending_review: '#f59e0b',
    published:      '#10b981',
    archived:       '#6b7280',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([k, v]) => ({ key: k, label: v }));

const EMPTY_FILTERS = {
    subsiteId:   '',
    categoryIds: [],
    statuses:    [],
    createdFrom: '',
    createdTo:   '',
    yearMin:     '',
    yearMax:     '',
    exhumePar:   '',
    visible:     '',
};

// ── Helpers d'agrégation ─────────────────────────────────────

/**
 * Choisit une taille de bucket (en années) selon l'étendue des données.
 * On vise ~15-25 barres pour une lecture confortable.
 */
function pickYearBucketSize(min, max) {
    const span = Math.max(1, max - min);
    if (span <= 30)   return 1;
    if (span <= 80)   return 5;
    if (span <= 200)  return 10;
    if (span <= 500)  return 25;
    if (span <= 1500) return 50;
    return 100;
}

function bucketYears(byYear) {
    if (!byYear || byYear.length === 0) return [];
    const min = Math.min(...byYear.map(d => d.year));
    const max = Math.max(...byYear.map(d => d.year));
    const size = pickYearBucketSize(min, max);
    const start = Math.floor(min / size) * size;
    const end   = Math.ceil((max + 1) / size) * size;

    const buckets = new Map();
    for (let b = start; b < end; b += size) buckets.set(b, 0);
    for (const { year, count } of byYear) {
        const b = Math.floor(year / size) * size;
        buckets.set(b, (buckets.get(b) || 0) + count);
    }
    return Array.from(buckets.entries()).map(([b, count]) => ({
        bucket: size === 1 ? `${b}` : `${b}–${b + size - 1}`,
        count,
    }));
}

// ── Composant ────────────────────────────────────────────────

const AdminStats = () => {
    const { isAdmin, isSuperadmin } = useApp();
    const { toast, showToast } = useAdminToast();

    const [categories, setCategories] = useState([]);
    const [subsites, setSubsites] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    // Replier la liste des catégories au top 10 par défaut : sur les jeux de
    // données larges, on noierait le reste de la page sous un mur de barres.
    const [showAllCategories, setShowAllCategories] = useState(false);
    // Filtres dépliables : replié par défaut pour que la page s'ouvre sur les
    // graphiques. Un résumé textuel des filtres actifs reste visible en mode
    // replié pour que l'utilisateur sache toujours ce qui est en cours.
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Filtres en attente d'application (modifiés par l'UI) et filtres effectifs
    // (envoyés au backend). On dissocie pour éviter de relancer une requête à
    // chaque frappe ; l'utilisateur clique "Appliquer" quand il a fini.
    const [pending, setPending] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);

    const loadStats = useCallback(async (filters) => {
        setLoading(true);
        try {
            const payload = {
                subsiteId:   filters.subsiteId || undefined,
                categoryIds: filters.categoryIds,
                statuses:    filters.statuses,
                createdFrom: filters.createdFrom || undefined,
                createdTo:   filters.createdTo || undefined,
                yearMin:     filters.yearMin || undefined,
                yearMax:     filters.yearMax || undefined,
                exhumePar:   filters.exhumePar || undefined,
                visible:     filters.visible === '' ? undefined : filters.visible,
            };
            const res = await api.stats.cartels(payload);
            setData(res);
        } catch (e) {
            showToast('error', e.message || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Chargement initial : catégories + sous-sites (pour les selects) puis stats
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [cats, subs] = await Promise.all([
                    api.categories.getAll().catch(() => []),
                    isSuperadmin ? api.subsites.getAll().catch(() => []) : Promise.resolve([]),
                ]);
                if (cancelled) return;
                setCategories(Array.isArray(cats) ? cats : []);
                setSubsites(Array.isArray(subs) ? subs : []);
            } catch { /* noop */ }
        })();
        loadStats(EMPTY_FILTERS);
        return () => { cancelled = true; };
    }, [loadStats, isSuperadmin]);

    const apply = () => {
        setApplied(pending);
        loadStats(pending);
    };

    const reset = () => {
        setPending(EMPTY_FILTERS);
        setApplied(EMPTY_FILTERS);
        loadStats(EMPTY_FILTERS);
    };

    const toggleArray = (key, value) => {
        setPending(p => {
            const arr = p[key];
            return { ...p, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
        });
    };

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (applied.subsiteId) n++;
        if (applied.categoryIds.length) n++;
        if (applied.statuses.length) n++;
        if (applied.createdFrom || applied.createdTo) n++;
        if (applied.yearMin || applied.yearMax) n++;
        if (applied.exhumePar) n++;
        if (applied.visible !== '') n++;
        return n;
    }, [applied]);

    // Résumé textuel des filtres actifs, affiché à côté du chevron quand le
    // bloc est replié. Les listes de plus de 2 éléments sont compactées en
    // "N catégories" pour ne pas déborder.
    const filterSummaryChips = useMemo(() => {
        const parts = [];
        if (applied.subsiteId === 'main') parts.push('Site principal');
        else if (applied.subsiteId) {
            const s = subsites.find(x => x.id === applied.subsiteId);
            parts.push(s ? s.name : 'Sous-site');
        }
        if (applied.categoryIds.length) {
            const names = applied.categoryIds
                .map(id => categories.find(c => c.id === id)?.name)
                .filter(Boolean);
            parts.push(names.length <= 2 ? names.join(' + ') : `${names.length} catégories`);
        }
        if (applied.statuses.length) {
            parts.push(applied.statuses.map(s => STATUS_LABELS[s] || s).join(' + '));
        }
        if (applied.createdFrom && applied.createdTo) parts.push(`Créé ${applied.createdFrom} → ${applied.createdTo}`);
        else if (applied.createdFrom) parts.push(`Créé depuis ${applied.createdFrom}`);
        else if (applied.createdTo)   parts.push(`Créé jusqu'au ${applied.createdTo}`);
        if (applied.yearMin && applied.yearMax) parts.push(`Époque ${applied.yearMin}–${applied.yearMax}`);
        else if (applied.yearMin) parts.push(`Époque ≥ ${applied.yearMin}`);
        else if (applied.yearMax) parts.push(`Époque ≤ ${applied.yearMax}`);
        if (applied.exhumePar) parts.push(`Exhumé par: « ${applied.exhumePar} »`);
        if (applied.visible === 'true')  parts.push('Visibles');
        if (applied.visible === 'false') parts.push('Masqués');
        return parts;
    }, [applied, subsites, categories]);

    // Données dérivées pour les charts
    const yearBuckets = useMemo(() => bucketYears(data?.byYear), [data?.byYear]);

    const statusData = useMemo(() => (data?.byStatus || []).map(s => ({
        ...s,
        label: STATUS_LABELS[s.status] || s.status,
        color: STATUS_COLORS[s.status] || '#6b7280',
    })), [data?.byStatus]);

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                Accès réservé à l'administration.
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={BarChart3} title="Statistiques" />

            <ExplainerBox title="À quoi sert cette page ?">
                Explorer la base de cartels en croisant plusieurs dimensions :
                catégories, statut, période de création, époque de l'invention, contributeurs.
                Les filtres en haut s'appliquent à tous les graphiques en dessous —
                vous pouvez par exemple isoler une catégorie ou une plage d'années pour
                voir qui contribue le plus dans ce périmètre.
            </ExplainerBox>

            {/* ─── Filtres (dépliable) ───────────────────────── */}
            <AdminSection style={filtersOpen ? undefined : { padding: '12px 20px' }}>
                <button
                    type="button"
                    onClick={() => setFiltersOpen(o => !o)}
                    aria-expanded={filtersOpen}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', background: 'none', border: 'none',
                        padding: 0, cursor: 'pointer', textAlign: 'left',
                        marginBottom: filtersOpen ? '14px' : 0,
                    }}
                >
                    <Filter size={16} color="var(--color-primary)" />
                    <span style={{ fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Filtres
                    </span>
                    {activeFilterCount > 0 && (
                        <span style={{
                            background: 'var(--color-accent)', color: 'var(--color-primary)',
                            borderRadius: 'var(--radius-md)', padding: '1px 8px',
                            fontSize: '0.75rem', fontWeight: '800',
                            fontFamily: 'var(--font-heading)',
                        }}>
                            {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {!filtersOpen && filterSummaryChips.length > 0 && (
                        <span style={{
                            flex: 1, minWidth: 0,
                            fontSize: '0.82rem', color: 'var(--color-text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {filterSummaryChips.join(' · ')}
                        </span>
                    )}
                    {!filtersOpen && filterSummaryChips.length === 0 && (
                        <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                            Aucun filtre — données complètes
                        </span>
                    )}
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', color: 'var(--color-text-muted)' }}>
                        {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                </button>

                {filtersOpen && (
                <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    {isSuperadmin && (
                        <div>
                            <label style={labelStyle}>Sous-site</label>
                            <select
                                value={pending.subsiteId}
                                onChange={e => setPending(p => ({ ...p, subsiteId: e.target.value }))}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="">Tous</option>
                                <option value="main">Site principal uniquement</option>
                                {subsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>Créé entre</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                                type="date"
                                value={pending.createdFrom}
                                onChange={e => setPending(p => ({ ...p, createdFrom: e.target.value }))}
                                style={inputStyle}
                            />
                            <input
                                type="date"
                                value={pending.createdTo}
                                onChange={e => setPending(p => ({ ...p, createdTo: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Époque (année min / max)</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={pending.yearMin}
                                onChange={e => setPending(p => ({ ...p, yearMin: e.target.value }))}
                                style={inputStyle}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={pending.yearMax}
                                onChange={e => setPending(p => ({ ...p, yearMax: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Exhumé par (contient)</label>
                        <input
                            type="text"
                            value={pending.exhumePar}
                            onChange={e => setPending(p => ({ ...p, exhumePar: e.target.value }))}
                            placeholder="Nom partiel…"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Visibilité publique</label>
                        <select
                            value={pending.visible}
                            onChange={e => setPending(p => ({ ...p, visible: e.target.value }))}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <option value="">Tous</option>
                            <option value="true">Visible</option>
                            <option value="false">Masqué</option>
                        </select>
                    </div>
                </div>

                {/* Catégories — chips multi-sélection */}
                <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Catégories</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {categories.length === 0 && (
                            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>Aucune catégorie</span>
                        )}
                        {categories.map(c => {
                            const active = pending.categoryIds.includes(c.id);
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => toggleArray('categoryIds', c.id)}
                                    style={{
                                        border: `1px solid ${active ? (c.color || 'var(--color-primary)') : 'var(--color-border)'}`,
                                        background: active ? (c.color || 'var(--color-primary)') : 'var(--color-surface)',
                                        color: active ? '#fff' : 'var(--color-text-muted)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '5px 11px',
                                        fontSize: '0.78rem',
                                        fontWeight: '700',
                                        fontFamily: 'var(--font-heading)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Statuts — chips multi */}
                <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Statuts</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {STATUS_OPTIONS.map(s => {
                            const active = pending.statuses.includes(s.key);
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => toggleArray('statuses', s.key)}
                                    style={{
                                        border: `1px solid ${active ? STATUS_COLORS[s.key] : 'var(--color-border)'}`,
                                        background: active ? STATUS_COLORS[s.key] : 'var(--color-surface)',
                                        color: active ? '#fff' : 'var(--color-text-muted)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '5px 11px',
                                        fontSize: '0.78rem',
                                        fontWeight: '700',
                                        fontFamily: 'var(--font-heading)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={apply} disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                        <RefreshCw size={14} /> {loading ? 'Calcul…' : 'Appliquer'}
                    </button>
                    <button type="button" onClick={reset} disabled={loading} style={ghostBtnStyle}>
                        <X size={14} /> Réinitialiser
                    </button>
                </div>
                </>
                )}
            </AdminSection>

            {/* ─── Total ─────────────────────────────────────── */}
            <AdminSection>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{
                        fontSize: '2.4rem', fontWeight: '800',
                        fontFamily: 'var(--font-heading)', color: 'var(--color-primary)',
                    }}>
                        {data?.total ?? '—'}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                        cartel{(data?.total ?? 0) > 1 ? 's' : ''} dans le périmètre
                    </span>
                </div>
            </AdminSection>

            {/* ─── Grille de graphiques ──────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                <ChartCard title="Par catégorie">
                    {data?.byCategory?.length ? (() => {
                        const all = data.byCategory;
                        const visible = showAllCategories ? all : all.slice(0, 10);
                        const hidden = all.length - visible.length;
                        return (
                            <>
                                <ResponsiveContainer width="100%" height={Math.max(220, visible.length * 32)}>
                                    <BarChart data={visible} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis type="number" allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} />
                                        <YAxis type="category" dataKey="name" width={140} stroke="var(--color-text-muted)" fontSize={12} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                        <Bar dataKey="count" name="Cartels">
                                            {visible.map((c, i) => (
                                                <Cell key={c.id} fill={c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {all.length > 10 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAllCategories(v => !v)}
                                            style={ghostBtnStyle}
                                        >
                                            {showAllCategories
                                                ? 'Replier au top 10'
                                                : `Afficher tout (${hidden} de plus)`}
                                        </button>
                                    </div>
                                )}
                            </>
                        );
                    })() : <EmptyChart />}
                </ChartCard>

                {(isSuperadmin && (data?.bySubsite?.length || 0) > 0) && (
                    <ChartCard title="Par sous-site">
                        <ResponsiveContainer width="100%" height={Math.max(220, data.bySubsite.length * 36)}>
                            <BarChart data={data.bySubsite} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis type="number" allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="name" width={140} stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                <Bar dataKey="count" name="Cartels">
                                    {data.bySubsite.map((s, i) => (
                                        <Cell key={s.id || 'main'} fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                )}

                <ChartCard title="Par statut">
                    {statusData.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={90}
                                    paddingAngle={2}
                                    label={(d) => `${d.label} (${d.count})`}
                                >
                                    {statusData.map((s, i) => (
                                        <Cell key={s.status} fill={s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="Créations dans le temps">
                    {data?.byMonth?.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data.byMonth} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={11} />
                                <YAxis allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="Cartels créés" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="Distribution par époque (année de l'invention)" subtitle="Seuls les cartels avec une année numérique sont comptés">
                    {yearBuckets.length ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={yearBuckets} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="bucket" stroke="var(--color-text-muted)" fontSize={11} angle={-25} textAnchor="end" height={56} />
                                <YAxis allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="count" name="Cartels" fill="var(--color-primary)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="Top contributeurs (« exhumé par »)" subtitle="20 premiers, classés par nombre de cartels">
                    {data?.topExhumePar?.length ? (
                        <ResponsiveContainer width="100%" height={Math.max(220, data.topExhumePar.length * 24)}>
                            <BarChart data={data.topExhumePar} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis type="number" allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} />
                                <YAxis type="category" dataKey="name" width={150} stroke="var(--color-text-muted)" fontSize={12} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                <Bar dataKey="count" name="Cartels" fill="var(--color-primary)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>
            </div>
        </div>
    );
};

// ── Sous-composants ──────────────────────────────────────────

const ChartCard = ({ title, subtitle, children }) => (
    <AdminSection style={{ marginBottom: 0 }}>
        <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--color-primary)' }}>
                {title}
            </h3>
            {subtitle && (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{subtitle}</p>
            )}
        </div>
        {children}
    </AdminSection>
);

const EmptyChart = () => (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-subtle)', fontSize: '0.85rem' }}>
        Pas de données dans ce périmètre.
    </div>
);

export default AdminStats;
