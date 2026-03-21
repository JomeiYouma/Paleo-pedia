import React from 'react';

const Museum = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>Rétrofutur Museum</h1>

            <div style={{ background: '#ffffd0', padding: '20px', borderRadius: '8px', marginBottom: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                ⚡ Le 1er musée où les visiteur·euses doivent produire l'énergie afin d'éclairer le musée ! ⚡
            </div>

            <p style={{ fontSize: '1.2rem' }}>
                Ce musée citoyen, low-tech et participatif est le fruit d’un travail collectif, ancré dans le programme de recherche Paleo-Energetique.org lancé par Atelier 21 en 2015.
            </p>

            <p>
                Il (re)met en lumière des savoirs oubliés, et, dans la seconde partie du musée inaugurée en 2025, les met en dialogue avec des créations contemporaines issues du design, de l’ingénierie et de l’art.
                Le but est de développer de nouvelles pistes pour la recherche et l’innovation dans une perspective de transition.
            </p>

            <img
                src="https://paleo-energetique.org/wp-content/uploads/2021/04/MUSEE-RETROFUTUR-PANO-1024x454.jpg"
                alt="Vue panoramique du musée"
                style={{ width: '100%', borderRadius: '8px', margin: '30px 0' }}
            />

            <h2 style={{ marginTop: '40px' }}>Une Expérience Immersive</h2>
            <p>
                Prenant à bras le corps les questions de résilience, de précarité et d’autonomie énergétique, nous avons réfléchi à une expérience immersive qui implique les visiteurs dans le fonctionnement du musée en produisant localement l’énergie nécessaire.
                Pédaler, tourner des manivelles, actionner des leviers... : chaque cartel s'éclaire grâce à votre effort !
            </p>
        </div>
    );
};

export default Museum;
