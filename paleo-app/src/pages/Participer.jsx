import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Send, Search, FileText, ChevronDown, ChevronUp, ExternalLink, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import { usePageMeta } from '../hooks/usePageMeta';

// Page "Appel à participation" — contenu repris de
// https://paleo-energetique.org/participer/kit-affiche/
// Les emplacements [À REMPLACER] doivent être complétés (PDF du kit,
// affiche haute définition, exemples concrets d'inventions).

// ── Mission dépliable ─────────────────────────────────────────
// Carte cliquable qui n'affiche que le thème + nom au repos, et
// déplie le texte HTML + lien éventuel + bouton "postuler" au clic.
const MissionAccordion = ({ mission, lang, expanded, onToggle, onApply, applyLabel }) => {
    const name = pickLang(mission, 'name', lang) || mission.name;
    const text = pickLang(mission, 'text', lang) || mission.text;
    return (
        <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            overflow: 'hidden',
        }}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                style={{
                    width: '100%', border: 'none',
                    background: expanded ? 'var(--color-surface-2)' : 'var(--color-surface)',
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                }}
            >
                <span style={{
                    fontSize: '0.7rem', fontWeight: '700', padding: '3px 9px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}>
                    {mission.theme}
                </span>
                <span style={{ flex: 1, fontWeight: '700', fontSize: '1rem', color: 'var(--color-text)' }}>
                    {name}
                </span>
                {expanded ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
            </button>
            {expanded && (
                <div style={{ padding: '4px 22px 22px', borderTop: '1px solid var(--color-border)' }}>
                    {text && (
                        <div
                            style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--color-text)' }}
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
                        <button type="button" onClick={() => onApply(mission.id)} className="paleo-btn">
                            <Send size={14} /> {applyLabel}
                        </button>
                        {mission.link_url && (
                            <a
                                href={mission.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="paleo-btn paleo-btn--outline"
                            >
                                {mission.link_label || mission.link_url} <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Formulaire de candidature mission ─────────────────────────
const MissionApplicationForm = ({ missions, preselectedId, lang, t, onCancel }) => {
    const [name, setName]           = useState('');
    const [email, setEmail]         = useState('');
    const [missionId, setMissionId] = useState(preselectedId || '');
    const [knowledge, setKnowledge] = useState('');
    const [website, setWebsite]     = useState(''); // honeypot
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]       = useState({ kind: null, msg: '' });

    useEffect(() => {
        if (preselectedId) setMissionId(preselectedId);
    }, [preselectedId]);

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!name.trim() || !email.trim()) {
            setStatus({ kind: 'error', msg: t('participer.applyForm.errorRequired') });
            return;
        }
        setSubmitting(true);
        setStatus({ kind: null, msg: '' });
        try {
            await api.missionApplications.create({
                name: name.trim(),
                email: email.trim(),
                mission_id: missionId || null,
                knowledge: knowledge.trim() || null,
                website,
            });
            setStatus({ kind: 'success', msg: t('participer.applyForm.success') });
            setName(''); setEmail(''); setKnowledge('');
        } catch (err) {
            setStatus({ kind: 'error', msg: err.message || t('participer.applyForm.errorGeneric') });
        } finally {
            setSubmitting(false);
        }
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.78rem',
        fontWeight: '700',
        color: 'var(--color-text-muted)',
        marginBottom: '4px',
        fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };
    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
    };

    return (
        <form
            onSubmit={submit}
            style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '28px',
                marginTop: '20px',
                display: 'flex', flexDirection: 'column', gap: '14px',
            }}
        >
            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{t('participer.applyForm.title')}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                {t('participer.applyForm.intro')}
            </p>

            {/* Honeypot — caché aux humains */}
            <input
                type="text"
                name="website"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', opacity: 0 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                    <label htmlFor="ma-name" style={labelStyle}>{t('participer.applyForm.nameLabel')} *</label>
                    <input id="ma-name" type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoComplete="name" />
                </div>
                <div>
                    <label htmlFor="ma-email" style={labelStyle}>{t('participer.applyForm.emailLabel')} *</label>
                    <input id="ma-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
                </div>
            </div>

            <div>
                <label htmlFor="ma-mission" style={labelStyle}>{t('participer.applyForm.missionLabel')}</label>
                <select
                    id="ma-mission"
                    value={missionId}
                    onChange={e => setMissionId(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                >
                    <option value="">{t('participer.applyForm.missionPlaceholder')}</option>
                    {missions.map(m => {
                        const label = pickLang(m, 'name', lang) || m.name;
                        return <option key={m.id} value={m.id}>{m.theme} — {label}</option>;
                    })}
                </select>
            </div>

            <div>
                <label htmlFor="ma-knowledge" style={labelStyle}>{t('participer.applyForm.knowledgeLabel')}</label>
                <textarea
                    id="ma-knowledge"
                    rows={5}
                    value={knowledge}
                    onChange={e => setKnowledge(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder={t('participer.applyForm.knowledgePlaceholder')}
                />
            </div>

            {status.kind && (
                <div role={status.kind === 'error' ? 'alert' : 'status'} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    background: status.kind === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    border: `1px solid ${status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    color: status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                    fontSize: '0.92rem', fontWeight: '600',
                }}>
                    {status.kind === 'success'
                        ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        : <AlertCircle  size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    }
                    <span>{status.msg}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '4px' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={submitting} className="paleo-btn paleo-btn--ghost">
                        {t('participer.applyForm.cancel')}
                    </button>
                )}
                <button type="submit" disabled={submitting} className="paleo-btn" style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}>
                    <Send size={14} /> {submitting ? t('participer.applyForm.submitting') : t('participer.applyForm.submit')}
                </button>
            </div>
        </form>
    );
};

const Participer = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const [missions, setMissions] = useState([]);
    const [missionsLoaded, setMissionsLoaded] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [preselectedMissionId, setPreselectedMissionId] = useState('');
    const applyFormRef = useRef(null);

    usePageMeta({
        title: t('participer.title'),
        description: t('participer.intro'),
        path: '/participer',
    });

    useEffect(() => {
        api.missions.getAll()
            .then(data => setMissions(Array.isArray(data) ? data : []))
            .catch(() => setMissions([]))
            .finally(() => setMissionsLoaded(true));
    }, []);

    const openApplyForm = (missionId = '') => {
        setPreselectedMissionId(missionId);
        setShowApplyForm(true);
        setTimeout(() => {
            applyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const cards = [
        { title: t('participer.cards.techTitle'),         desc: t('participer.cards.techDesc') },
        { title: t('participer.cards.socialTitle'),       desc: t('participer.cards.socialDesc') },
        { title: t('participer.cards.imaginariesTitle'),  desc: t('participer.cards.imaginariesDesc') },
    ];

    const hasMissions = missionsLoaded && missions.length > 0;

    return (
        <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
                {t('participer.title')}
            </h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                {t('participer.intro')}
            </p>

            {/* ── Missions (appels à participation thématiques) ────────── */}
            {hasMissions && (
                <div style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1.8rem', marginTop: 0, marginBottom: '12px' }}>
                        {t('participer.missionsTitle')}
                    </h2>
                    <p style={{ marginTop: 0, marginBottom: '24px', color: 'var(--color-text-muted)' }}>
                        {t('participer.missionsIntro')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {missions.map(m => (
                            <MissionAccordion
                                key={m.id}
                                mission={m}
                                lang={lang}
                                expanded={expandedId === m.id}
                                onToggle={() => setExpandedId(prev => prev === m.id ? null : m.id)}
                                onApply={openApplyForm}
                                applyLabel={t('participer.missionApplyBtn')}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Deux CTA côte à côte : invention OU mission ──────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: hasMissions ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
                gap: '20px',
                marginBottom: '50px',
            }}>
                {/* CTA Invention */}
                <div style={{
                    background: 'var(--color-surface)',
                    padding: '32px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    borderTop: '4px solid var(--color-accent)',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'center',
                    display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center',
                }}>
                    <Search size={28} color="var(--color-primary)" />
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{t('participer.alreadyIdeaTitle')}</h2>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        {t('participer.alreadyIdeaBody')}
                    </p>
                    <Link to="/app/create" className="paleo-btn" style={{ marginTop: 'auto' }}>
                        <Send size={16} /> {t('participer.proposeBtn')}
                    </Link>
                </div>

                {/* CTA Mission — affiché uniquement si des missions existent */}
                {hasMissions && (
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        borderTop: '4px solid var(--color-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        textAlign: 'center',
                        display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center',
                    }}>
                        <Target size={28} color="var(--color-primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{t('participer.applyMissionTitle')}</h2>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            {t('participer.applyMissionBody')}
                        </p>
                        <button type="button" onClick={() => openApplyForm()} className="paleo-btn" style={{ marginTop: 'auto' }}>
                            <Send size={16} /> {t('participer.applyMissionBtn')}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Formulaire de candidature (inline, après les CTA) ───── */}
            <div ref={applyFormRef}>
                {showApplyForm && hasMissions && (
                    <MissionApplicationForm
                        missions={missions}
                        preselectedId={preselectedMissionId}
                        lang={lang}
                        t={t}
                        onCancel={() => setShowApplyForm(false)}
                    />
                )}
            </div>

            {/* ── Que recherche-t-on ? ─────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>{t('participer.lookingForTitle')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'var(--color-surface)',
                            padding: '20px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            borderTop: '3px solid var(--color-accent)',
                        }}
                    >
                        <Search size={22} color="var(--color-primary)" />
                        <h3 style={{ marginTop: '10px', fontSize: '1.05rem' }}>{card.title}</h3>
                        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Comment ça marche (couvre invention ET mission) ──────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px' }}>{t('participer.howTitle')}</h2>
            <ol style={{ paddingLeft: '20px', marginTop: '20px', fontSize: '1.05rem' }}>
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step1Html') }} />
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step2Html') }} />
                <li style={{ marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('participer.step3Html') }} />
                <li dangerouslySetInnerHTML={{ __html: t('participer.step4Html') }} />
            </ol>

            {/* ── Pour aller plus loin ─────────────────────────────────── */}
            <div style={{
                background: 'var(--color-surface-2)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--color-primary)',
                marginTop: '40px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
            }}>
                <FileText size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong>{t('participer.questionTitle')}</strong><br />
                    <span style={{ fontSize: '0.95rem' }}>
                        {t('participer.questionWriteTo')}{' '}
                        <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>{' '}
                        {t('participer.questionOrVia')} <Link to="/contact">{t('participer.questionContactPage')}</Link>.
                    </span>
                </div>
            </div>

            {/* ── Affiche + bouton de téléchargement (kit) ─────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '40px',
                alignItems: 'center',
                background: 'var(--color-surface-2)',
                padding: '30px',
                borderRadius: 'var(--radius-md)',
                marginTop: '50px',
            }}>
                <img
                    src="/downloads/kit-appel-participation.jpg"
                    alt={t('participer.posterAlt')}
                    style={{
                        width: '100%',
                        aspectRatio: '700 / 989',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary-soft)',
                    }}
                />
                <noscript>
                    <a href="/downloads/kit-appel-participation.jpg">{t('participer.posterNoscript')}</a>
                </noscript>

                <div>
                    <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>{t('participer.downloadTitle')}</h2>
                    <p>{t('participer.downloadBody')}</p>
                    <a
                        href="#"
                        /* [À REMPLACER : href vers le PDF du kit affiche, ex: /downloads/kit-appel-participation.pdf ] */
                        className="paleo-btn"
                    >
                        <Download size={18} /> {t('participer.downloadBtn')}
                    </a>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', marginTop: '14px' }}>
                        {t('participer.jpgAvailable')}{' '}
                        <a
                            href="/downloads/kit-appel-participation.jpg"
                            download
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {t('participer.jpgLink')}
                        </a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Participer;
