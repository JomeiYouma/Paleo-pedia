import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';
import Navigation from './Navigation';
import { useApp } from '../context/AppContext';

const Layout = () => {
    const { currentWorkshop, quitWorkshop } = useApp();

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
            <SharedHeader
                mode="app"
                appNavSlot={<Navigation />}
                currentWorkshop={currentWorkshop}
                quitWorkshop={quitWorkshop}
            />

            <div className="container" style={{ flex: 1, paddingBottom: '50px', paddingTop: '20px' }}>
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
