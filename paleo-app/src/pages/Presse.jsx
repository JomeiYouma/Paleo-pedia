import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Download, Mail, Image as ImageIcon } from 'lucide-react';

// Page "Presse" — articles repris de https://paleo-energetique.org/presse/
// Les vignettes (image) et le dossier de presse PDF sont à remplacer.
// La liste d'articles est éditable directement dans le tableau ci-dessous.

const ARTICLES = [
    {
        title: 'Retro Tech: When the past inspires innovation',
        date: '2021-03-01',
        source: 'Paris&Co',
        url: 'https://paleo-energetique.org/presse/', // [À REMPLACER : URL de l'article original]
        thumb: null, // [À REMPLACER : URL ou import de la vignette]
    },
    {
        title: 'Léonard : Paléo-inspiration',
        date: '2020-09-11',
        source: 'Léonard / Vinci',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Drôles de machines',
        date: '2020-08-01',
        source: 'Le Monde diplomatique',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Cédric Carles, le designer fédérateur d\'énergies',
        date: '2020-06-29',
        source: 'Le Monde',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Cédric de retour à l\'école',
        date: '2020-03-26',
        source: 'La Nouvelle République',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Cédric Carles invité de RTBF La Première',
        date: '2020-02-15',
        source: 'RTBF Belgique',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Interview de Cédric Carles',
        date: '2020-02-04',
        source: 'RTS — Radio Suisse Romande',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Paleo-energy, the alternative future of energy',
        date: '2020-01-02',
        source: 'We Make Money Not Art',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Le passé révèle le futur de l\'énergie',
        date: '2019-12-29',
        source: '24 Heures (Suisse)',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
    {
        title: 'Huit inventions d\'hier qui éclairent demain',
        date: '2019-12-28',
        source: 'Ouest France',
        url: 'https://paleo-energetique.org/presse/',
        thumb: null,
    },
];

const formatDate = (iso) => {
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
    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-pink-darker, #C2185B)' }}>
                Presse
            </h1>
            <p style={{ fontSize: '1.15rem', marginBottom: '40px', color: '#555' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {ARTICLES.map((a, i) => (
                    <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paleo-card-link"
                        style={{
                            display: 'flex',
                            gap: '20px',
                            background: 'white',
                            padding: '18px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                            border: '1px solid #eee',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        {/* Vignette (placeholder à remplacer) */}
                        <div style={{
                            flexShrink: 0,
                            width: '120px',
                            height: '90px',
                            background: a.thumb ? `url(${a.thumb}) center/cover` : '#eee',
                            border: a.thumb ? 'none' : '1px dashed #bbb',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#aaa',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                        }}>
                            {!a.thumb && '[vignette]'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                {a.source} · {formatDate(a.date)}
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{a.title}</h3>
                            <span style={{ fontSize: '0.85rem', color: '#1565c0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                Lire l'article <ExternalLink size={13} />
                            </span>
                        </div>
                    </a>
                ))}
            </div>

            {/* Bandeau retour contact */}
            <div style={{
                marginTop: '50px',
                padding: '24px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-pink-darker, #C2185B)',
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
