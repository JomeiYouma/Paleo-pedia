import React from 'react';

const Ouvrages = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: '#333' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px', color: 'var(--color-pink-darker, #C2185B)' }}>Nos Ouvrages</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
                Découvrez nos livres qui compilent des centaines d'inventions oubliées et proposent une autre lecture de l'histoire technique.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>

                <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', transition: 'transform 0.2s', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#eee', height: '200px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                        Couverture Livre
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Rétrofutur : une autre histoire des innovations énergétiques</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Éditions Buchet/Chastel</p>
                    <p style={{ marginTop: '10px' }}>L'ouvrage de référence du projet. Une encyclopédie visuelle des inventions énergétiques oubliées.</p>
                </div>

                <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', transition: 'transform 0.2s', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#eee', height: '200px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                        Couverture Livre
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Rétrofutur : une autre histoire des machines à vent</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Focus Thématique</p>
                    <p style={{ marginTop: '10px' }}>Une plongée spécifique dans l'histoire des éoliennes et des machines utilisant la force du vent.</p>
                </div>

                <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '20px', transition: 'transform 0.2s', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#eee', height: '200px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                        Couverture Livre
                    </div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Retrotech and Lowtech [English]</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>International Edition</p>
                    <p style={{ marginTop: '10px' }}>The english version of our research, focusing on low-tech and forgotten innovations.</p>
                </div>

            </div>
        </div>
    );
};

export default Ouvrages;
