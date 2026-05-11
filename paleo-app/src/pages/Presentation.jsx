import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Linkedin, Globe, Link2 } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';

// Page "À propos" — équipe rendue depuis la base via /api/team-members.
// Trois rendus selon la catégorie :
//   - 'main'      → cards complètes (photo, rôle, bio, liens sociaux)
//   - 'secondary' → cards compactes (photo, rôle)
//   - 'community' → liste textuelle (nom + rôle, séparés par virgules)

// ── Liens sociaux d'un membre ─────────────────────────────────
const SocialLinks = ({ member }) => {
    const links = [
        { url: member.url_linkedin, Icon: Linkedin, label: 'LinkedIn' },
        { url: member.url_website,  Icon: Globe,    label: 'Site web' },
        { url: member.url_other,    Icon: Link2,    label: 'Autre lien' },
    ].filter(l => l.url);
    if (!links.length) return null;
    return (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {links.map(({ url, Icon, label }, i) => (
                <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-primary)',
                        color: 'var(--color-accent)',
                        transition: 'background-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                >
                    <Icon size={14} />
                </a>
            ))}
        </div>
    );
};

// ── Card pleine (équipe principale) ───────────────────────────
const MainCard = ({ member, lang }) => {
    const role = pickLang(member, 'role', lang) || member.role;
    const bio  = pickLang(member, 'bio',  lang) || member.bio;
    return (
    <article style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '28px 22px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }}>
        {member.photo_path ? (
            <img
                src={member.photo_path}
                alt={member.name}
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '18px' }}
            />
        ) : (
            <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'var(--color-primary-soft)',
                marginBottom: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-muted)',
            }}>
                {(member.name || '?').charAt(0).toUpperCase()}
            </div>
        )}
        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>{member.name}</h3>
        {role && (
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {role}
            </p>
        )}
        {bio && (
            <p style={{ margin: '14px 0 0', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}>
                {bio}
            </p>
        )}
        <SocialLinks member={member} />
    </article>
    );
};

// ── Card compacte (équipe secondaire) — layout horizontal pour distinguer
//    visuellement des Principaux, mais inclut bio détaillée et liens sociaux.
const SecondaryCard = ({ member, lang }) => {
    const role = pickLang(member, 'role', lang) || member.role;
    const bio  = pickLang(member, 'bio',  lang) || member.bio;
    return (
    <article style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px',
        display: 'flex',
        gap: '18px',
        alignItems: 'flex-start',
    }}>
        {member.photo_path ? (
            <img src={member.photo_path} alt={member.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {(member.name || '?').charAt(0).toUpperCase()}
            </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{member.name}</div>
            {role && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                    {role}
                </div>
            )}
            {bio && (
                <p style={{ margin: '10px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}>
                    {bio}
                </p>
            )}
            <SocialLinks member={member} />
        </div>
    </article>
    );
};

const Presentation = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.teamMembers.getAll()
            .then(data => setMembers(Array.isArray(data) ? data : []))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, []);

    const { mainMembers, secondaryMembers, communityMembers } = useMemo(() => ({
        mainMembers:      members.filter(m => m.category === 'main'),
        secondaryMembers: members.filter(m => m.category === 'secondary'),
        communityMembers: members.filter(m => m.category === 'community'),
    }), [members]);

    return (
        <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-primary)' }}>{t('pages.presentation.title')}</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                <strong>{t('pages.presentation.subtitle')}</strong>
            </p>

            <p>
                {t('pages.presentation.intro')}
            </p>

            {/* ── Notre histoire ───────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>Notre histoire</h2>
            <p>
                Le programme de recherche <strong>Paléo-Énergétique</strong> a été lancé en <strong>2015</strong>
                {' '}par <a href="https://atelier21.org" target="_blank" rel="noopener noreferrer">Atelier 21</a>,
                association de design et de recherche sur la transition écologique. Depuis, il rassemble
                designers, chercheur·euses, ingénieur·es et citoyen·nes autour d'une même conviction : l'histoire
                de l'énergie regorge d'inventions oubliées dont les solutions méritent d'être réactivées.
            </p>
            <p>
                En <strong>2025</strong>, le projet ouvre une nouvelle étape avec l'extension du Rétrofutur Museum,
                qui met en dialogue savoirs historiques et créations contemporaines.
            </p>

            {/* ── Vidéos de présentation ───────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                margin: '30px 0',
            }}>
                {[
                    { id: 'PUdb3Z739rk', title: 'Paléo-Énergétique — présentation' },
                    { id: '_cJts9dZzGM', title: 'Paléo-Énergétique — vidéo complémentaire' },
                ].map(v => (
                    <div key={v.id} style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                        background: 'var(--color-primary-soft)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                    }}>
                        <iframe
                            src={`https://www.youtube.com/embed/${v.id}`}
                            title={v.title}
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
                ))}
            </div>

            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>{t('pages.presentation.mission')}</h2>
            <p>
                Vous êtes une innovation sociale ou technique en lien avec l'énergie, quelqu'un qui a créé une innovation qui fournit une solution mais qui serait méconnu ou tombé dans l'oubli ?
                Sur la frise chronologique des inventions, vous pouvez découvrir une sélection de paléo-héros nominés ainsi que les personnes qui les ont retrouvé / identifié / exhumé.
            </p>

            <p>
                {t('pages.presentation.examples_intro')}
            </p>

            <h3 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>{t('pages.presentation.examples')}</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                <li>En Hollande où les voitures électriques en autopartage ont été expérimentées dès 1974.</li>
                <li>Les « Vélibs » existaient à la Rochelle à la même époque.</li>
                <li>Jean-Luc Perrier, enseignant à l'université catholique d'Angers, a construit sa voiture qui fonctionnait à l'hydrogène produit à l'énergie solaire et qui ne rejetait que de la vapeur d'eau en 1979.</li>
                <li>Les premiers concentrateurs solaires thermiques, conçus à Tours par le professeur Augustin Mouchot, étaient déjà présentés lors de l'exposition universelle de 1878.</li>
            </ul>

            {/* ── Galerie illustrant les exemples ──────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                margin: '0 0 30px',
            }}>
                {[
                    { src: '/photos/about-1.png', alt: 'Voitures électriques en autopartage, Hollande 1974' },
                    { src: '/photos/about-2.jpg', alt: 'Vélos en libre-service, La Rochelle 1974' },
                    { src: '/photos/about-3.jpg', alt: "Voiture à hydrogène solaire de Jean-Luc Perrier, 1979" },
                    { src: '/photos/about-4.jpg', alt: 'Concentrateur solaire Mouchot–Pifre, 1878' },
                ].map((img, i) => (
                    <figure key={i} style={{ margin: 0 }}>
                        <img
                            src={img.src}
                            alt={img.alt}
                            loading="lazy"
                            style={{
                                width: '100%',
                                aspectRatio: '4 / 3',
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--color-primary-soft)',
                            }}
                        />
                        <figcaption style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-text-subtle)',
                            marginTop: '6px',
                            lineHeight: '1.4',
                        }}>
                            {img.alt}
                        </figcaption>
                    </figure>
                ))}
            </div>

            <div style={{ background: 'var(--color-surface-2)', padding: '30px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-accent)' }}>
                <em>
                    Alors que tramways, dirigeables et trains magnétiques reviennent au goût du jour, cette recherche propose une plongée dans les oubliés de l'histoire de l'énergie.
                    Quels sont les contextes propices à l'émergence de ces inventions, les crises seraient-elles des opportunités de créativité ?
                </em>
            </div>

            {/* ── L'équipe (rendue depuis la base) ──────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '8px' }}>L'équipe</h2>
            <p style={{ marginTop: 0 }}>
                Le projet est porté par une équipe core entourée d'une communauté de chercheur·euses associé·es :
                académiques, expert·es de la transition énergétique, designers, journalistes et entrepreneur·es.
            </p>

            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>Chargement de l'équipe…</p>
            ) : (
                <>
                    {/* Équipe principale — cards pleines */}
                    {mainMembers.length > 0 && (
                        <>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '16px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Équipe principale
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                                {mainMembers.map(m => <MainCard key={m.id} member={m} lang={lang} />)}
                            </div>
                        </>
                    )}

                    {/* Équipe secondaire — cards compactes */}
                    {secondaryMembers.length > 0 && (
                        <>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '16px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Contributeur·ices
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '40px' }}>
                                {secondaryMembers.map(m => <SecondaryCard key={m.id} member={m} lang={lang} />)}
                            </div>
                        </>
                    )}

                    {/* Communauté — liste textuelle */}
                    {communityMembers.length > 0 && (
                        <>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Communauté de chercheur·euses associé·es
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.7' }}>
                                {communityMembers.map((m, i) => {
                                    const role = pickLang(m, 'role', lang) || m.role;
                                    return (
                                        <React.Fragment key={m.id}>
                                            <strong>{m.name}</strong>
                                            {role && <span style={{ color: 'var(--color-text-subtle)' }}> ({role})</span>}
                                            {i < communityMembers.length - 1 ? ', ' : '.'}
                                        </React.Fragment>
                                    );
                                })}
                            </p>
                        </>
                    )}

                    {!mainMembers.length && !secondaryMembers.length && !communityMembers.length && (
                        <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>
                            La liste des membres sera bientôt disponible.
                        </p>
                    )}
                </>
            )}

            {/* ── Liens utiles ─────────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>Pour aller plus loin</h2>
            <ul style={{ paddingLeft: '20px' }}>
                <li><Link to="/partenaires">Nos partenaires</Link> — institutions et soutiens du projet.</li>
                <li><Link to="/participer">Appel à participation</Link> — comment contribuer.</li>
                <li><Link to="/prestations">Nos prestations</Link> — challenges, ateliers, expo itinérante.</li>
                <li><Link to="/contact">Contact</Link> — pour toute question, partenariat ou interview.</li>
            </ul>

            <p style={{ marginTop: '30px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Ce programme de recherche citoyen est soutenu par la fondation Schneider Electric.
            </p>
        </div>
    );
};

export default Presentation;
