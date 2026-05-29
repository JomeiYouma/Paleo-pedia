import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Linkedin, Globe, Link2, X } from 'lucide-react';
import api from '../services/apiClient';
import { pickLang } from '../utils/i18nHelpers';
import PartnersList from '../components/PartnersList';
import { usePageMeta } from '../hooks/usePageMeta';
import { getHostSubsiteSlug } from '../utils/subsiteHost';

// Page "À propos" — équipe rendue depuis la base via /api/team-members.
// Trois rendus selon la catégorie :
//   - 'main'      → cards complètes (photo, rôle, bio, liens sociaux)
//   - 'secondary' → cards compactes (photo, rôle)
//   - 'community' → liste textuelle (nom + rôle, séparés par virgules)

// Bios plus longues que ce seuil sont tronquées avec un bouton « Afficher + »
// qui ouvre une modale (préserve la géométrie de la grille). Le seuil est
// calibré sur la bio de Simon Bouchaudy (~245 car.) qui sert de référence.
const BIO_TRUNCATE_LIMIT = 250;

// Nombre de contributeur·ices affiché·es par défaut avant le bouton
// « Afficher tous les contributeur·ices » (≈ 2 lignes sur desktop avec la
// grille auto-fit minmax(240px, 1fr)).
const CONTRIBUTORS_PREVIEW_COUNT = 6;

// ── Modale bio longue ─────────────────────────────────────────
// S'affiche au clic sur « Afficher + » d'une bio tronquée. Esc et clic sur
// le backdrop ferment la modale. Pas de Portal explicite : `position: fixed`
// + z-index élevé suffit puisque rien d'autre n'utilise un z-index >= 1000.
const BioModal = ({ member, onClose }) => {
    const { t } = useTranslation();
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bio-modal-title"
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '640px', width: '100%',
                    maxHeight: '85vh', overflowY: 'auto',
                    padding: '32px 28px',
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
            >
                <button
                    onClick={onClose}
                    aria-label={t('common.close', 'Fermer')}
                    style={{
                        position: 'absolute', top: '14px', right: '14px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: '6px', borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    <X size={20} />
                </button>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px' }}>
                    {member.photo_path && (
                        <img
                            src={member.photo_path}
                            alt=""
                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                    )}
                    <div>
                        <h3 id="bio-modal-title" style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{member.name}</h3>
                        {member.role && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {member.role}
                            </div>
                        )}
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                    {member.bio}
                </p>
            </div>
        </div>
    );
};

// ── Bio avec troncature + bouton modale ───────────────────────
// Si la bio dépasse BIO_TRUNCATE_LIMIT, on tronque proprement à la fin du
// dernier mot complet et on ajoute un bouton « Afficher + » qui demande
// l'ouverture de la modale au parent (via onExpand).
const TruncatedBio = ({ bio, onExpand, style }) => {
    const { t } = useTranslation();
    if (!bio) return null;
    const isLong = bio.length > BIO_TRUNCATE_LIMIT;
    if (!isLong) {
        return <p style={style}>{bio}</p>;
    }
    const cut = bio.slice(0, BIO_TRUNCATE_LIMIT);
    const lastSpace = cut.lastIndexOf(' ');
    const truncated = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
    return (
        <p style={style}>
            {truncated}…{' '}
            <button
                type="button"
                onClick={onExpand}
                style={{
                    background: 'transparent', border: 'none', padding: 0,
                    color: 'var(--color-primary)', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'inherit',
                    textDecoration: 'underline',
                }}
            >
                {t('pages.presentation.showMoreBio', 'Afficher +')}
            </button>
        </p>
    );
};

// ── Liens sociaux d'un membre ─────────────────────────────────
const SocialLinks = ({ member }) => {
    const { t } = useTranslation();
    const links = [
        { url: member.url_linkedin, Icon: Linkedin, label: t('pages.presentation.socialLinkedin') },
        { url: member.url_website,  Icon: Globe,    label: t('pages.presentation.socialWebsite') },
        { url: member.url_other,    Icon: Link2,    label: t('pages.presentation.socialOther') },
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
const MainCard = ({ member, lang, onExpandBio }) => {
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
        <TruncatedBio
            bio={bio}
            onExpand={() => onExpandBio({ ...member, role, bio })}
            style={{ margin: '14px 0 0', fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}
        />
        <SocialLinks member={member} />
    </article>
    );
};

// ── Card compacte (équipe secondaire) — layout horizontal pour distinguer
//    visuellement des Principaux, mais inclut bio détaillée et liens sociaux.
const SecondaryCard = ({ member, lang, onExpandBio }) => {
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
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem' }}>{member.name}</h3>
            {role && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {role}
                </div>
            )}
            <TruncatedBio
                bio={bio}
                onExpand={() => onExpandBio({ ...member, role, bio })}
                style={{ margin: '10px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.55' }}
            />
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
    const [bioModal, setBioModal] = useState(null);
    const [showAllContributors, setShowAllContributors] = useState(false);

    usePageMeta({
        title: t('pages.presentation.title'),
        description: t('pages.presentation.intro'),
        path: '/presentation',
    });

    // Offset vertical des personnages décoratifs : quand le footer entre dans
    // le viewport, on translate les personnages vers le haut du même nombre
    // de pixels pour qu'ils « remontent avec lui » au lieu d'être recouverts.
    const [footerOverlap, setFooterOverlap] = useState(0);
    useEffect(() => {
        const update = () => {
            const footer = document.querySelector('footer');
            if (!footer) { setFooterOverlap(0); return; }
            const top = footer.getBoundingClientRect().top;
            setFooterOverlap(Math.max(0, window.innerHeight - top));
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    // Sur un sous-site, on charge l'équipe scopée du subsite (avec fallback
    // serveur sur l'équipe principale si le subsite n'a aucun membre déclaré).
    // Le slug provient soit de la route /site/:slug/presentation, soit du
    // host dédié (ex. paleo-h2o.org → 'paleo-h2o').
    const params = useParams();
    const subsiteSlug = params.slug || getHostSubsiteSlug();
    useEffect(() => {
        api.teamMembers.getAll(subsiteSlug)
            .then(data => setMembers(Array.isArray(data) ? data : []))
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, [subsiteSlug]);

    const { mainMembers, secondaryMembers, communityMembers } = useMemo(() => ({
        mainMembers:      members.filter(m => m.category === 'main'),
        secondaryMembers: members.filter(m => m.category === 'secondary'),
        communityMembers: members.filter(m => m.category === 'community'),
    }), [members]);

    return (
        <div style={{ position: 'relative' }}>
            {/* ── Décor latéral : Mouchot (gauche) + Maria (droite) ─────
                Affiché uniquement quand la largeur le permet — sinon caché
                pour ne pas chevaucher le contenu. Position fixe ancrée en
                bas. Le translateY dynamique (footerOverlap) fait remonter
                les personnages quand le footer arrive en bas du viewport,
                pour qu'ils s'élèvent avec lui plutôt que d'être coupés. */}
            <img
                src="/photos/mouchot.png"
                alt=""
                aria-hidden="true"
                className="presentation-decor presentation-decor--left"
                style={{ transform: `translateY(-${footerOverlap}px) rotate(7deg)` }}
            />
            <img
                src="/photos/maria.png"
                alt=""
                aria-hidden="true"
                className="presentation-decor presentation-decor--right"
                style={{ transform: `translateY(-${footerOverlap}px) rotate(-7deg)` }}
            />

        <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: 'var(--color-text)', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-primary)' }}>{t('pages.presentation.title')}</h1>

            <p>
                {t('pages.presentation.intro')}
            </p>

            {/* ── Notre histoire ───────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>{t('pages.presentation.historyTitle')}</h2>
            <p dangerouslySetInnerHTML={{ __html: t('pages.presentation.history1Html') }} />
            <p dangerouslySetInnerHTML={{ __html: t('pages.presentation.history2Html') }} />

            {/* ── Vidéos de présentation ───────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                margin: '30px 0',
            }}>
                {[
                    { id: 'PUdb3Z739rk', title: t('pages.presentation.video1Title') },
                    { id: '_cJts9dZzGM', title: t('pages.presentation.video2Title') },
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
            <p>{t('pages.presentation.missionBody')}</p>

            <p>
                {t('pages.presentation.examples_intro')}
            </p>

            <h3 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>{t('pages.presentation.examples')}</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                <li>{t('pages.presentation.exampleNL')}</li>
                <li>{t('pages.presentation.exampleVelibs')}</li>
                <li>{t('pages.presentation.examplePerrier')}</li>
                <li>{t('pages.presentation.exampleMouchot')}</li>
            </ul>

            {/* ── Galerie illustrant les exemples ──────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                margin: '0 0 30px',
            }}>
                {[
                    { src: '/photos/about-1.png', alt: t('pages.presentation.img1Alt') },
                    { src: '/photos/about-2.jpg', alt: t('pages.presentation.img2Alt') },
                    { src: '/photos/about-3.jpg', alt: t('pages.presentation.img3Alt') },
                    { src: '/photos/about-4.jpg', alt: t('pages.presentation.img4Alt') },
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
                <em>{t('pages.presentation.quote')}</em>
            </div>

            {/* ── L'équipe (rendue depuis la base) ──────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '8px' }}>{t('pages.presentation.teamTitle')}</h2>
            <p style={{ marginTop: 0 }}>{t('pages.presentation.teamIntro')}</p>

            {loading ? (
                <p style={{ color: 'var(--color-text-subtle)', fontStyle: 'italic' }}>{t('pages.presentation.teamLoading')}</p>
            ) : (
                <>
                    {/* Équipe principale — cards pleines */}
                    {mainMembers.length > 0 && (
                        <>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                                {t('pages.presentation.teamMain')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                {mainMembers.map(m => <MainCard key={m.id} member={m} lang={lang} onExpandBio={setBioModal} />)}
                            </div>
                        </>
                    )}

                    {/* Équipe secondaire — cards compactes.
                        Séparé visuellement des Principaux par une marge généreuse
                        + un filet horizontal, pour ne pas paraître en continuité
                        de la grille principale. Affiché en aperçu (2 lignes ≈ 6
                        cards) puis un bouton dévoile la liste complète. */}
                    {secondaryMembers.length > 0 && (
                        <>
                            <hr style={{
                                border: 0,
                                borderTop: '1px solid var(--color-border)',
                                margin: '64px 0 0',
                            }} />
                            <h3 style={{ fontSize: '1.2rem', marginTop: '36px', marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                                {t('pages.presentation.teamSecondary')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                {(showAllContributors ? secondaryMembers : secondaryMembers.slice(0, CONTRIBUTORS_PREVIEW_COUNT))
                                    .map(m => <SecondaryCard key={m.id} member={m} lang={lang} onExpandBio={setBioModal} />)}
                            </div>
                            {secondaryMembers.length > CONTRIBUTORS_PREVIEW_COUNT ? (
                                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAllContributors(v => !v)}
                                        style={{
                                            background: 'var(--color-primary)',
                                            color: 'var(--color-accent)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '10px 22px',
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {showAllContributors
                                            ? t('pages.presentation.showLessContributors', 'Réduire')
                                            : t('pages.presentation.showAllContributors', 'Afficher tous les contributeur·ices ({{count}})', { count: secondaryMembers.length })}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '40px' }} />
                            )}
                        </>
                    )}

                    {/* Communauté — liste textuelle */}
                    {communityMembers.length > 0 && (
                        <>
                            <h3 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '12px', color: 'var(--color-text-muted)' }}>
                                {t('pages.presentation.teamCommunity')}
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
                            {t('pages.presentation.teamEmpty')}
                        </p>
                    )}
                </>
            )}

            {/* ── Partenaires ─────────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '8px' }}>
                {t('pages.partners.title', 'Partenaires')}
            </h2>
            <p style={{ marginTop: 0, marginBottom: '24px' }}>
                {t('pages.partners.subtitle', 'Les organisations qui soutiennent et accompagnent le projet.')}
            </p>
            <PartnersList />

            {/* ── Liens utiles ─────────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>{t('pages.presentation.moreLinks')}</h2>
            <ul style={{ paddingLeft: '20px' }}>
                <li><Link to="/participer">{t('pages.presentation.linkParticipate')}</Link> {t('pages.presentation.linkParticipateHint')}</li>
                <li><Link to="/prestations">{t('pages.presentation.linkPrestations')}</Link> {t('pages.presentation.linkPrestationsHint')}</li>
                <li><Link to="/contact">{t('pages.presentation.linkContact')}</Link> {t('pages.presentation.linkContactHint')}</li>
            </ul>

            <p style={{ marginTop: '30px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                {t('pages.presentation.supportNote')}
            </p>
        </div>

            <style>{`
                /* Décor latéral de la page « À propos » : Mouchot et Maria
                   posés dans les marges gauche/droite, bustes coupés par le
                   bas et par le bord latéral pour donner un effet « les
                   personnages se penchent vers le contenu ». Hauteurs et
                   rotations dissymétriques pour éviter l'effet miroir.
                   Pointer-events désactivés pour rester purement décoratifs. */
                .presentation-decor {
                    position: fixed;
                    width: auto;
                    pointer-events: none;
                    user-select: none;
                    z-index: 0;
                }
                .presentation-decor--left {
                    height: 720px;
                    left: -40px;             /* léger débord sur le bord gauche */
                    bottom: -430px;          /* bas du corps coupé par le bord inférieur */
                    transform-origin: bottom right;
                    /* transform: translateY(...) rotate(7deg) — appliqué en inline pour
                       composer la rotation avec l'offset dynamique du footer. */
                }
                .presentation-decor--right {
                    height: 720px;
                    right: -30px;            /* léger débord sur le bord droit */
                    bottom: -340px;          /* coupé plus bas → buste plus haut que Mouchot */
                    transform-origin: bottom left;
                }

                /* Petit boost de taille sur très grands écrans */
                @media (min-width: 1800px) {
                    .presentation-decor--left  { height: 820px; bottom: -490px; }
                    .presentation-decor--right { height: 820px; bottom: -390px; }
                }

                /* En-dessous du seuil, on cache pour ne pas mordre sur le
                   contenu (900 + ~250×2 ≈ 1400px nécessaires). */
                @media (max-width: 1400px) {
                    .presentation-decor { display: none; }
                }
            `}</style>

            {bioModal && <BioModal member={bioModal} onClose={() => setBioModal(null)} />}
        </div>
    );
};

export default Presentation;
