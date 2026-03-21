import React from 'react';

const Presentation = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>À Propos</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                <strong>LA PALÉO-ÉNERGÉTIQUE : une contre-histoire de l’énergie</strong>
            </p>

            <p>
                Ressusciter les techniques disparues, montrer la capacité d’innovation, revaloriser des innovations oubliées et une capacité d’innovation sociale, vernaculaire, décentralisée, inattendue.
                Cette recherche se veut ouverte et souhaite faire appel à l’intelligence collective ainsi qu’à la capacité collaborative du numérique.
            </p>

            <h2 style={{ fontSize: '1.8rem', marginTop: '40px', marginBottom: '20px' }}>Notre Mission</h2>
            <p>
                Une innovation sociale ou technique en lien avec l’énergie, quelqu’un qui a créé une innovation qui fournit une solution mais qui serait méconnu ou tombé dans l’oubli ?
                Sur la frise chronologique des inventions, vous pouvez découvrir une sélection de paléo-héros nominés ainsi que les personnes qui les ont retrouvé / identifié / exhumé.
            </p>

            <p>
                L’histoire de l’énergie n’est ni linéaire, ni darwinienne. Elle regorge d’innovations fantastiques oubliées qui n’ont pas été généralisées à leur époque, alors qu’elles répondaient déjà à des problématiques contemporaines.
            </p>

            <h3 style={{ fontSize: '1.5rem', marginTop: '30px', marginBottom: '15px' }}>Quelques exemples :</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: '30px' }}>
                <li>En Hollande où les voitures électriques en autopartage ont été expérimentées dès 1974.</li>
                <li>Les « Vélibs » existaient à la Rochelle à la même époque.</li>
                <li>Jean-Luc Perrier, enseignant à l’université catholique d’Angers, a construit sa voiture qui fonctionnait à l’hydrogène produit à l’énergie solaire et qui ne rejetait que de la vapeur d’eau en 1979.</li>
                <li>Les premiers concentrateurs solaires thermiques, conçus à Tours par le professeur Augustin Mouchot, étaient déjà présentés lors de l’exposition universelle de 1878.</li>
            </ul>

            <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', borderLeft: '4px solid var(--color-pink-darker, #C2185B)' }}>
                <em>
                    Alors que tramways, dirigeables et trains magnétiques reviennent au goût du jour, cette recherche propose une plongée dans les oubliés de l’histoire de l’énergie.
                    Quels sont les contextes propices à l’émergence de ces inventions, les crises seraient-elles des opportunités de créativité ?
                </em>
            </div>

            <p style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
                Ce programme de recherche citoyen est soutenu par la fondation Schneider Electric.
            </p>
        </div>
    );
};

export default Presentation;
