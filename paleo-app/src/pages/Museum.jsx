import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Users } from 'lucide-react';

// Page "Rétrofutur Museum" — contenu repris de
// https://paleo-energetique.org/retrofutur-museum/
// Emplacements [À REMPLACER] : photos additionnelles, plaquette PDF du musée.

const Museum = () => {
    return (
        <>
            {/* ── Bannière pleine largeur ─────────────────────────────── */}
            <div style={{
                width: '100%',
                height: 'clamp(240px, 38vw, 460px)',
                overflow: 'hidden',
                background: 'var(--color-primary-soft)',
            }}>
                <img
                    src="/photos/museum-banner.png"
                    alt="Le 1er musée des énergies alternatives à Paris"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
            </div>

        <div style={{ maxWidth: '900px', margin: '40px auto 60px', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--color-pink-darker, #C2185B)' }}>
                Rétrofutur Museum
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#666', marginTop: 0, marginBottom: '32px' }}>
                Le 1<sup>er</sup> musée des énergies alternatives à Paris !
            </p>

            <blockquote style={{
                margin: '36px 0',
                padding: '22px 30px',
                background: 'var(--color-surface)',
                borderLeft: '4px solid var(--color-accent)',
                borderRadius: 0,
                fontSize: '1.15rem',
                fontWeight: '700',
                color: 'var(--color-text)',
                lineHeight: '1.5',
            }}>
                Le 1<sup>er</sup> musée où les visiteur·euses doivent produire l'énergie pour éclairer le musée.
            </blockquote>

            <p style={{ fontSize: '1.15rem' }}>
                Ce musée citoyen, low-tech et participatif est le fruit d'un travail collectif, ancré dans
                le programme de recherche Paleo-Energetique.org lancé par <strong>Atelier 21 en 2015</strong>.
                Sa mission : inventorier et partager les inventions oubliées dans le domaine des énergies
                alternatives.
            </p>

            <p>
                Il (re)met en lumière des savoirs oubliés, et — dans la seconde partie du musée inaugurée en
                2025 — les met en dialogue avec des créations contemporaines issues du design, de l'ingénierie
                et de l'art. Le but : développer de nouvelles pistes pour la recherche et l'innovation dans
                une perspective de transition.
            </p>

            <img
                src="/photos/museum-1.jpg"
                alt="Vue intérieure du Rétrofutur Museum"
                loading="lazy"
                style={{ width: '100%', borderRadius: '8px', margin: '30px 0' }}
            />

            {/* ── Infos pratiques ──────────────────────────────────────── */}
            <h2 style={{ marginTop: '40px' }}>Nous trouver</h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginTop: '20px',
            }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <MapPin size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>Adresse</strong><br />
                        5 allée Paris-Ivry<br />
                        Paris 13<sup>e</sup>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <Mail size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>Contact</strong><br />
                        <a href="mailto:hello@paleo-energetique.org">hello@paleo-energetique.org</a>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <Users size={22} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '4px' }} />
                    <div>
                        <strong>Pour qui ?</strong><br />
                        Écoles, entreprises, collectivités, touristes — visites en semaine sur rendez-vous.
                    </div>
                </div>
            </div>

            {/* ── Une expérience immersive ─────────────────────────────── */}
            <h2 style={{ marginTop: '50px' }}>Une expérience immersive</h2>
            <p>
                Prenant à bras le corps les questions de résilience, de précarité et d'autonomie énergétique,
                nous avons réfléchi à une expérience immersive qui implique les visiteurs dans le fonctionnement
                du musée en produisant localement l'énergie nécessaire.
                Pédaler, tourner des manivelles, actionner des leviers… : chaque cartel s'éclaire grâce à votre effort !
            </p>

            {/* ── Photos intérieures du musée ──────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                margin: '30px 0',
            }}>
                {[1, 2, 3].map(i => (
                    <img
                        key={i}
                        src={`/photos/museum-${i}.jpg`}
                        alt={`Vue intérieure du musée #${i}`}
                        loading="lazy"
                        style={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            background: '#eee',
                        }}
                    />
                ))}
            </div>

            {/* ── Vidéo de présentation ────────────────────────────────── */}
            <div style={{ margin: '30px 0' }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    background: 'var(--color-primary-soft)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}>
                    <iframe
                        src="https://www.youtube.com/embed/9pG61-I47EA"
                        title="Présentation vidéo du Rétrofutur Museum"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                    />
                </div>
            </div>

            {/* ── Expo itinérante ──────────────────────────────────────── */}
            <h2 style={{ marginTop: '50px' }}>L'exposition itinérante</h2>
            <p>
                Une partie de la collection peut se déplacer dans des institutions publiques, des écoles et
                des tiers-lieux. Frises, cartels et dispositifs interactifs viennent à votre rencontre, en
                France comme à l'étranger.
            </p>
            <p>
                <Link to="/prestations" className="paleo-btn">
                    Découvrir l'expo itinérante <span className="paleo-btn-arrow">→</span>
                </Link>
            </p>

            {/* ── Designers & partenaires ──────────────────────────────── */}
            <h2 style={{ marginTop: '50px' }}>Designers & partenaires</h2>
            <p>
                Le musée est le fruit d'un travail collectif avec une quinzaine de designers, parmi lesquels
                <strong> Julien Benayoun</strong>, <strong>William Boujon (bold-design)</strong> et de nombreux·euses
                contributeur·ices.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                Le projet est soutenu par <strong>Semapa</strong>, <strong>Plateau Urbain</strong>,
                la <strong>Mairie du 13<sup>e</sup></strong>, <strong>ENGIE</strong>, la
                <strong> Région Île-de-France</strong> et la <strong>Fondation Schneider Electric</strong>.
            </p>

            {/* ── CTAs participation ───────────────────────────────────── */}
            <div style={{
                marginTop: '50px',
                background: '#f8f9fa',
                padding: '30px',
                borderRadius: '12px',
                textAlign: 'center',
            }}>
                <h3 style={{ marginTop: 0 }}>Envie de contribuer ?</h3>
                <p>Proposez une invention oubliée ou rejoignez un atelier collectif.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '14px' }}>
                    <Link to="/participer" className="paleo-btn">
                        Appel à participation
                    </Link>
                    <Link to="/app/create" className="paleo-btn paleo-btn--outline">
                        Proposer une invention
                    </Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default Museum;
