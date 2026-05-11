import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Download, Mail, Image as ImageIcon } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';

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
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.pressArticles.getAll()
            .then(d => setArticles(Array.isArray(d) ? d : []))
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)' }}>
                Presse
            </h1>
            <p style={{ fontSize: '1.15rem', marginBottom: '40px', color: 'var(--color-text-muted)' }}>
                Articles, reportages et interviews consacrés au programme de recherche Paléo-Énergétique.
            </p>

            {/* ── Bandeau ressources presse ────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '50px',
            }}>
                <a
                    href="#"
                    /* [À REMPLACER : href vers le dossier de presse PDF, ex: /downloads/dossier-presse.pdf ] */
                    className="paleo-btn"
                    style={{ padding: '20px', justifyContent: 'flex-start' }}
                >
                    <Download size={22} />
                    <span style={{ textAlign: 'left' }}>
                        Dossier de presse
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            PDF — [à uploader]
                        </span>
                    </span>
                </a>
                <a
                    href="#"
                    /* [À REMPLACER : href vers l'archive ZIP du kit média (logos + photos HD) ] */
                    className="paleo-btn paleo-btn--outline"
                    style={{ padding: '20px', justifyContent: 'flex-start' }}
                >
                    <ImageIcon size={22} />
                    <span style={{ textAlign: 'left' }}>
                        Kit média
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            Logos + photos HD
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
                        Contact presse
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>
                            hello@paleo-energetique.org
                        </span>
                    </span>
                </a>
            </div>

            {/* ── Liste des articles ───────────────────────────────────── */}
            <h2 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>Ils parlent de nous</h2>
            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>Chargement des articles…</p>
            ) : articles.length === 0 ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                    Aucun article publié pour le moment.
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
                                            Lire l'article <ExternalLink size={13} />
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
                <strong>Vous êtes journaliste ?</strong><br />
                <span style={{ fontSize: '0.95rem' }}>
                    Écrivez-nous à <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>
                    {' '}pour toute demande d'interview, visite du musée ou accès au kit média complet.
                    Vous pouvez aussi passer par la <Link to="/contact">page contact</Link>.
                </span>
            </div>
        </div>
    );
};

export default Presse;
