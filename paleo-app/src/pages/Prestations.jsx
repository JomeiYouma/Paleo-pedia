import React from 'react';
import { PenTool, Users, Presentation as PresentationIcon } from 'lucide-react';

const Prestations = () => {
    return (
        <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', lineHeight: '1.6', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-pink-darker, #C2185B)', textAlign: 'center' }}>Nos Prestations</h1>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '60px', color: '#666' }}>
                Innovation collaborative, Recherche & Formation
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>

                {/* Challenges Retrofutur */}
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '50%' }}>
                        <Users size={40} color="#1565c0" />
                    </div>
                    <div>
                        <h2 style={{ marginTop: 0, color: '#1565c0' }}>Challenges Rétrofutur</h2>
                        <p style={{ fontSize: '1.1rem' }}>
                            Vous êtes une entreprise ou une collectivité et vous souhaitez remuer l’innovation au sein de votre équipe ?
                        </p>
                        <p>
                            Plongez dans le Challenge Rétrofutur et découvrez comment les inventions du passé peuvent nourrir votre stratégie d’innovation.
                            Nous organisons des hackathons et des sessions de créativité basés sur notre base de données d'inventions oubliées pour stimuler l'imagination et trouver des solutions durables.
                        </p>
                    </div>
                </div>

                {/* Ateliers de Formation */}
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '50%' }}>
                        <PresentationIcon size={40} color="#2e7d32" />
                    </div>
                    <div>
                        <h2 style={{ marginTop: 0, color: '#2e7d32' }}>Ateliers de Formation</h2>
                        <p style={{ fontSize: '1.1rem' }}>
                            Vous êtes une école ou une université et vous souhaitez organiser des formations sur l’histoire des techniques liées aux énergies renouvelables ?
                        </p>
                        <p>
                            Plusieurs modules de cours sont possibles :
                        </p>
                        <ul style={{ marginTop: '10px' }}>
                            <li>Sensibilisation à l’écologie et à la transition énergétique.</li>
                            <li>Découverte de la recherche par l'exhumation d'archives.</li>
                            <li>Étude des brevets anciens et de la propriété intellectuelle.</li>
                            <li>Exploration des innovations "Low-tech" historiques.</li>
                        </ul>
                    </div>
                </div>

                {/* Expositions */}
                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '50%' }}>
                        <PenTool size={40} color="#ef6c00" />
                    </div>
                    <div>
                        <h2 style={{ marginTop: 0, color: '#ef6c00' }}>Expositions Itinérantes</h2>
                        <p style={{ fontSize: '1.1rem' }}>
                            Faites venir l'histoire de l'énergie chez vous !
                        </p>
                        <p>
                            Nous proposons des expositions clés en main ou sur mesure pour vos événements, festivals, ou lieux culturels.
                            Nos expositions mettent en scène les inventions les plus marquantes de notre recherche, avec des reproductions, des maquettes et des contenus interactifs.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Prestations;
