import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';

const SiteLayout = () => {
    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SharedHeader mode="site" />

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <footer style={{ background: '#f8f9fa', padding: '40px', marginTop: 'auto', borderTop: '1px solid #eee' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Paléo-Énergétique</h3>
                        <p style={{ color: '#666', maxWidth: '300px' }}>Une contre-histoire de l'énergie pour inspirer le futur.</p>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Liens</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <a href="#/app" style={{ color: '#666', textDecoration: 'none' }}>La Frise Chronologique</a>
                            <a href="#/contact" style={{ color: '#666', textDecoration: 'none' }}>Nous contacter</a>
                        </div>
                    </div>
                    <div>
                        <p style={{ color: '#999', fontSize: '0.9rem' }}>© {new Date().getFullYear()} Atelier 21</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SiteLayout;
