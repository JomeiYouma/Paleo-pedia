import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

const Navigation = () => {
    const { isAdmin, currentWorkshop } = useApp();
    const { t } = useTranslation();
    const location = useLocation();

    return (
        <nav className="nav-container">
            {/* Bibliothèque — toujours visible */}
            <NavLink
                to={currentWorkshop ? `/app/workshop/${currentWorkshop.id}` : '/app'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end
            >
                {t('nav.library')}
            </NavLink>

            {/* Visiteur non connecté et connecté non-admin */}
            {!isAdmin && (
                <NavLink
                    to="/app/create"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    {t('nav.create')}
                </NavLink>
            )}

            {/* Admin only */}
            {isAdmin && (
                <>
                    <NavLink
                        to="/app/admin"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {t('nav.management')}
                    </NavLink>
                    <NavLink
                        to="/app/drafts"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {t('nav.pending')}
                    </NavLink>
                </>
            )}
        </nav>
    );
};

export default Navigation;
