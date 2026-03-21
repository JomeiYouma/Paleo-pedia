import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import './Navigation.css';

const Navigation = () => {
    const { t } = useTranslation();
    const { isAdmin, currentWorkshop } = useApp();
    const location = useLocation();
    const isDraftMode = new URLSearchParams(location.search).get('mode') === 'draft';

    return (
        <nav className="nav-container">
            <NavLink to={currentWorkshop ? `/app/workshop/${currentWorkshop.id}` : "/app"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                {t('nav.library').toUpperCase()}
            </NavLink>
            {!isAdmin && (
                <>
                    <NavLink
                        to="/app/create"
                        className={({ isActive }) => `nav-item ${isActive && !isDraftMode ? 'active' : ''}`}
                    >
                        {t('nav.create').toUpperCase()}
                    </NavLink>
                    <NavLink
                        to="/app/drafts"
                        className={({ isActive }) => `nav-item ${isActive || (location.pathname.includes('create') && isDraftMode) ? 'active' : ''}`}
                    >
                        {t('nav.drafts').toUpperCase()}
                    </NavLink>
                </>
            )}
            {isAdmin && (
                <>
                    <NavLink to="/app/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        GESTION
                    </NavLink>
                    <NavLink to="/app/proposals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        PROPOSITIONS
                    </NavLink>
                </>
            )}
        </nav>
    );
};

export default Navigation;
