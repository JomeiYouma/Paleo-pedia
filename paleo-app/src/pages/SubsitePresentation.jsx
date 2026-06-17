/**
 * SubsitePresentation.jsx
 * Page « Présentation » d'un sous-site : on y affiche la démarche du projet
 * (la même méthodologie que /pedia), au lieu de la page « À propos / équipe »
 * générique du site principal.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSubsite } from '../layouts/SubsiteLayout';
import { usePageMeta } from '../hooks/usePageMeta';
import MethodoSection from '../components/pedia/MethodoSection';

const SubsitePresentation = () => {
    const subsite = useSubsite();
    const { pathname } = useLocation();

    usePageMeta({
        title: subsite ? `${subsite.name} — Démarche` : 'Démarche',
        description: "La démarche du projet Paléo-Énergétique : recenser, documenter et remettre en lumière les techniques énergétiques anciennes ou méconnues.",
        path: pathname,
    });

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 64px' }}>
            <MethodoSection standalone />
        </div>
    );
};

export default SubsitePresentation;
