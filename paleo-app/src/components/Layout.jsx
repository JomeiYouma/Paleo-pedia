import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';
import { useApp } from '../context/AppContext';

// Layout de l'application (/app/*)
// Le SharedHeader détecte automatiquement qu'on est en zone /app
// et affiche la bande de navigation applicative sous le header du site.
const Layout = () => {
    const { currentWorkshop, quitWorkshop } = useApp();

    return (
        <div style={{
            fontFamily: 'var(--font-body)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
        }}>
            <SharedHeader
                currentWorkshop={currentWorkshop}
                quitWorkshop={quitWorkshop}
            />
            <div style={{ flex: 1 }}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
