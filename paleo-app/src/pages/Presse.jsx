import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Download, Mail, Image as ImageIcon } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import { usePageMeta } from '../hooks/usePageMeta';

// Page publique « Presse » — articles rendus depuis /api/press-articles.
// Le contenu était auparavant codé en dur dans ce fichier ; il est désormais
// administrable via /app/admin/press.

const formatDate = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const Presse = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    usePageMeta({
        title: t('pages.presse.title'),
        description: t('pages.presse.intro'),
        path: '/presse',
    });

    useEffect(() => {
        api.pressArticles.getAll()
            .then(d => setArticles(Array.isArray(d) ? d : []))
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)' }}>
                {t('pages.presse.title')}
            </h1>
            <p style={{ fontSize: '1.15rem', marginBottom: '40px', color: 'var(--color-text-muted)' }}>
                {t('pages.presse.intro')}
            </p>

            {/* ── Bandeau ressources presse ────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '50px',
            }}>
                <a
                    href="/downloads/revue-presse-2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paleo-btn"
                    style={{ padding: '20px', justifyContent: 'flex-start' }}
                >
                    <Download size={22} />
                    <span style={{ textAlign: 'left' }}>
                        {t('pages.presse.pressKit')}
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            {t('pages.presse.pressKitNote')}
                        </span>
                    </span>
                </a>
                <a
                    href="/downloads/kit-media-paleo-energetique.zip"
                    download
                    className="paleo-btn paleo-btn--outline"
                    style={{ padding: '20px', justifyContent: 'flex-start' }}
                >
                    <ImageIcon size={22} />
                    <span style={{ textAlign: 'left' }}>
                        {t('pages.presse.mediaKit')}
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            {t('pages.presse.mediaKitNote')}
                        </span>
                    </span>
                </a>
                <a
                    href="mailto:hello@paleo-energetique.org"
                    className="paleo-btn paleo-btn--ghost"
                    style={{ padding: '20px', justifyContent: 'flex-start' }}
                >
                    <Mail size={22} />
                    <span style={{ textAlign: 'left' }}>
                        {t('pages.presse.pressContact')}
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            hello@paleo-energetique.org
                        </span>
                    </span>
                </a>
            </div>

            {/* ── Liste des articles ───────────────────────────────────── */}
            <h2 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>{t('pages.presse.theyTalkAboutUs')}</h2>
            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>{t('pages.presse.loading')}</p>
            ) : articles.length === 0 ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    {t('pages.presse.empty')}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {articles.map((a) => {
                        const title = pickLang(a, 'title', lang) || a.title;
                        const excerpt = pickLang(a, 'excerpt', lang) || a.excerpt;
                        const hasUrl = !!a.url;
                        const Tag = hasUrl ? 'a' : 'div';
                        const interactiveProps = hasUrl
                            ? { href: a.url, target: '_blank', rel: 'noopener noreferrer', className: 'paleo-card-link' }
                            : {};
                        return (
                            <Tag
                                key={a.id}
                                {...interactiveProps}
                                style={{
                                    display: 'flex',
                                    gap: '20px',
                                    background: 'var(--color-surface)',
                                    padding: '18px',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-sm)',
                                    border: '1px solid var(--color-border)',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                            >
                                {/* Vignette */}
                                <div style={{
                                    flexShrink: 0,
                                    width: '120px',
                                    height: '90px',
                                    background: a.thumbnail_path ? `url(${a.thumbnail_path}) center/cover` : 'var(--color-primary-soft)',
                                    border: a.thumbnail_path ? 'none' : '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-text-subtle)',
                                    fontSize: '0.7rem',
                                }}>
                                    {!a.thumbnail_path && '—'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--color-text-subtle)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        fontFamily: 'var(--font-heading)',
                                        fontWeight: '700',
                                        marginBottom: '4px',
                                    }}>
                                        {a.source || '—'}{a.published_date && ` · ${formatDate(a.published_date)}`}
                                    </div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{title}</h3>
                                    {excerpt && (
                                        <p style={{ margin: '0 0 8px', color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: '1.55' }}>
                                            {excerpt}
                                        </p>
                                    )}
                                    {hasUrl && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                                            {t('pages.presse.readArticle')} <ExternalLink size={13} />
                                        </span>
                                    )}
                                </div>
                            </Tag>
                        );
                    })}
                </div>
            )}

            {/* Bandeau retour contact */}
            <div style={{
                marginTop: '50px',
                padding: '24px',
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--color-accent)',
            }}>
                <strong>{t('pages.presse.journalistTitle')}</strong><br />
                <span style={{ fontSize: '0.95rem' }}>
                    {t('pages.presse.journalistBody1')} <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>
                    {' '}{t('pages.presse.journalistBody2')}
                    {' '}{t('pages.presse.journalistBody3')} <Link to="/contact">{t('pages.presse.contactPageLink')}</Link>.
                </span>
            </div>
        </div>
    );
};

export default Presse;
