import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';
import SiteFooter from './SiteFooter';

// Layout du site public (/, /presentation, /museum…)
// Le SharedHeader détecte qu'on N'est PAS sur /app et affiche
// seulement le header du site (sans la bande de navigation applicative).
const SiteLayout = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <SharedHeader />

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <SiteFooter />
        </div>
    );
};

export default SiteLayout;
