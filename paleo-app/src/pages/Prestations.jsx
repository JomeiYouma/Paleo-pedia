import React from 'react';
import { useTranslation } from 'react-i18next';
import { PenTool, Users, Presentation as PresentationIcon, Map, Download } from 'lucide-react';

// Page "Nos prestations" — contenu enrichi à partir de
// https://paleo-energetique.org/nos-prestations/
// DA : gris primaire + jaune accent uniquement (pas de bleu/vert/violet).

const SERVICE_CARDS = [
    {
        Icon: Users,
        titleKey: 'pages.prestations.challenges',
        body: (
            <>
                <p style={{ fontSize: '1.1rem' }}>
                    Vous êtes une entreprise ou une collectivité et vous souhaitez remuer l'innovation au sein de votre équipe ?
                </p>
                <p>
                    Plongez dans le Challenge Rétrofutur et découvrez comment les inventions du passé peuvent nourrir votre stratégie d'innovation.
                    Nous organisons des hackathons et des sessions de créativité basés sur notre base de données d'inventions oubliées pour stimuler l'imagination et trouver des solutions durables.
                </p>
            </>
        ),
    },
    {
        Icon: PresentationIcon,
        titleKey: 'pages.prestations.workshops',
        body: (
            <>
                <p style={{ fontSize: '1.1rem' }}>
                    Vous êtes une école ou une université et vous souhaitez organiser des formations sur l'histoire des techniques liées aux énergies renouvelables ?
                </p>
                <p>Plusieurs modules de cours sont possibles :</p>
                <ul style={{ marginTop: '10px' }}>
                    <li>Sensibilisation à l'écologie et à la transition énergétique.</li>
                    <li>Découverte de la recherche par l'exhumation d'archives.</li>
                    <li>Étude des brevets anciens et de la propriété intellectuelle.</li>
                    <li>Exploration des innovations « low-tech » historiques.</li>
                </ul>
            </>
        ),
    },
    {
        Icon: Map,
        title: 'Expositions itinérantes',
        body: (
            <>
                <p style={{ fontSize: '1.1rem' }}>
                    Vous êtes un organisme, une association, un tiers-lieu ou un établissement scolaire ?
                    Accueillez tout ou partie de la collection Rétrofutur chez vous.
                </p>
                <p>
                    Nous proposons l'affichage d'<strong>une frise ou plus</strong>, accompagnée de cartels,
                    de dispositifs interactifs et — sur demande — d'une médiation. L'expo s'adapte à
                    votre espace : des écoles aux festivals, en passant par les médiathèques et les entreprises.
                </p>
                <p style={{ marginTop: '14px' }}>
                    <a
                        href="#"
                        /* [À REMPLACER : href vers la plaquette PDF dédiée à l'expo itinérante,
                            ex: /downloads/plaquette-expo-itinerante.pdf ] */
                        className="paleo-btn paleo-btn--ghost"
                        style={{ padding: '10px 18px', fontSize: '0.82rem' }}
                    >
                        <Download size={15} /> Plaquette expo itinérante (PDF)
                    </a>
                </p>
            </>
        ),
    },
    {
        Icon: PenTool,
        titleKey: 'pages.prestations.consulting',
        body: (
            <>
                <p style={{ fontSize: '1.1rem' }}>
                    Vous travaillez sur un projet nécessitant des recherches historiques ou une expertise en histoire des innovations ?
                </p>
                <p>
                    Nous proposons des services de conseil, de recherche et d'accompagnement pour explorer les innovations du passé comme source d'inspiration pour les défis d'aujourd'hui.
                </p>
            </>
        ),
    },
];

const Prestations = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.6', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)', textAlign: 'center' }}>
                {t('pages.prestations.title')}
            </h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '30px', color: 'var(--color-text-muted)' }}>
                {t('pages.prestations.subtitle')}
            </p>

            {/* Bouton plaquette PDF (CTA principal) */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <a
                    href="#"
                    /* [À REMPLACER : href vers la plaquette PDF des prestations,
                        ex: /downloads/plaquette-prestations.pdf ] */
                    className="paleo-btn"
                >
                    <Download size={18} /> Télécharger la plaquette
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {SERVICE_CARDS.map(({ Icon, title, titleKey, body }, i) => (
                    <article
                        key={i}
                        style={{
                            display: 'flex',
                            gap: '28px',
                            alignItems: 'flex-start',
                            background: 'var(--color-surface)',
                            padding: '36px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            borderLeft: '4px solid var(--color-accent)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div
                            style={{
                                background: 'var(--color-primary)',
                                width: '64px',
                                height: '64px',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Icon size={30} color="var(--color-accent)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ marginTop: 0, color: 'var(--color-primary)' }}>
                                {titleKey ? t(titleKey) : title}
                            </h2>
                            {body}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default Prestations;
