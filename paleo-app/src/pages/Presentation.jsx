import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Page "À propos" — contenu enrichi à partir de
// https://paleo-energetique.org/about/  +  /team/
// Ajouts : section "Notre histoire" (fondation 2015 par Atelier 21),
// liens vers /partenaires et /contact, mention équipe & chercheurs associés.

const Presentation = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>{t('pages.presentation.title')}</h1>

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

            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>{t('pages.presentation.mission')}</h2>
            <p>
                Vous êtes une innovation sociale ou technique en lien avec l'énergie, quelqu'un qui a créé une innovation qui fournit une solution mais qui serait méconnu ou tombé dans l'oubli ?
                Sur la frise chronologique des inventions, vous pouvez découvrir une sélection de paléo-héros nominés ainsi que les personnes qui les ont retrouvé / identifié / exhumé.
            </p>

            <p>
                {t('pages.presentation.examples_intro')}
            </p>

            <h3 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>{t('pages.presentation.examples')}</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '30px' }}>
                <li>En Hollande où les voitures électriques en autopartage ont été expérimentées dès 1974.</li>
                <li>Les « Vélibs » existaient à la Rochelle à la même époque.</li>
                <li>Jean-Luc Perrier, enseignant à l'université catholique d'Angers, a construit sa voiture qui fonctionnait à l'hydrogène produit à l'énergie solaire et qui ne rejetait que de la vapeur d'eau en 1979.</li>
                <li>Les premiers concentrateurs solaires thermiques, conçus à Tours par le professeur Augustin Mouchot, étaient déjà présentés lors de l'exposition universelle de 1878.</li>
            </ul>

            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', borderLeft: '4px solid var(--color-pink-darker, #C2185B)' }}>
                <em>
                    Alors que tramways, dirigeables et trains magnétiques reviennent au goût du jour, cette recherche propose une plongée dans les oubliés de l'histoire de l'énergie.
                    Quels sont les contextes propices à l'émergence de ces inventions, les crises seraient-elles des opportunités de créativité ?
                </em>
            </div>

            {/* ── L'équipe ─────────────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>L'équipe</h2>
            <p>
                Le projet est porté par une équipe core (designers, chercheur·euses, médiateur·ices) entourée
                d'une <strong>communauté de plus de 60 chercheur·euses associé·es</strong> : académiques, expert·es
                de la transition énergétique, designers, journalistes et entrepreneur·es.
            </p>
            <p style={{ fontSize: '0.95rem', color: '#555' }}>
                Parmi les membres : <strong>Cédric Carles</strong> (designer / chercheur, fondateur),
                <strong> Loïc Rogard</strong>, <strong>Simona Iliycheva</strong>, <strong>Simon Bouchaudy</strong>,
                <strong> Anaïs Chazel</strong>, <strong>Eric Dussert</strong>, <strong>Thomas Ortiz</strong>…
            </p>
            {/* [À REMPLACER : galerie photo de l'équipe (4–6 portraits) si disponible] */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                margin: '20px 0',
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        style={{
                            aspectRatio: '1 / 1',
                            background: '#eee',
                            border: '2px dashed #bbb',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#888',
                            fontSize: '0.75rem',
                        }}
                    >
                        [portrait {i}]
                    </div>
                ))}
            </div>

            {/* ── Liens utiles ─────────────────────────────────────────── */}
            <h2 style={{ fontSize: '1.8rem', marginTop: '50px', marginBottom: '20px' }}>Pour aller plus loin</h2>
            <ul style={{ paddingLeft: '20px' }}>
                <li><Link to="/partenaires">Nos partenaires</Link> — institutions et soutiens du projet.</li>
                <li><Link to="/participer">Appel à participation</Link> — comment contribuer.</li>
                <li><Link to="/prestations">Nos prestations</Link> — challenges, ateliers, expo itinérante.</li>
                <li><Link to="/contact">Contact</Link> — pour toute question, partenariat ou interview.</li>
            </ul>

            <p style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
                Ce programme de recherche citoyen est soutenu par la fondation Schneider Electric.
            </p>
        </div>
    );
};

export default Presentation;
