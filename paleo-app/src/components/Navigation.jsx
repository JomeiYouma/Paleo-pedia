import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Navigation.css';

const Navigation = () => {
    const { isAdmin, currentWorkshop } = useApp();
    const location = useLocation();

    return (
        <nav className="nav-container">
            {/* Bibliothèque — toujours visible */}
            <NavLink
                to={currentWorkshop ? `/app/workshop/${currentWorkshop.id}` : '/app'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end
            >
                BIBLIOTHÈQUE
            </NavLink>

            {/* Visiteur non connecté et connecté non-admin */}
            {!isAdmin && (
                <NavLink
                    to="/app/create"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    CRÉER
                </NavLink>
            )}

            {/* Admin only */}
            {isAdmin && (
                <>
                    <NavLink
                        to="/app/admin"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        GESTION
                    </NavLink>
                    <NavLink
                        to="/app/drafts"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        EN ATTENTE
                    </NavLink>
                </>
            )}
        </nav>
    );
};

export default Navigation;
