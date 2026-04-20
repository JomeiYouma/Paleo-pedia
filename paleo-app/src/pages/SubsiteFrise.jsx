/**
 * SubsiteFrise.jsx
 * Frise filtrée sur la catégorie du sous-site.
 * Réutilise Library en passant la catégorie fixée.
 */
import React from 'react';
import { useSubsite } from '../layouts/SubsiteLayout';
import Library from './Library';

const SubsiteFrise = () => {
    const subsite = useSubsite();
    if (!subsite) return null;
    return <Library fixedCategory={subsite.category_name} fixedSubsiteId={subsite.id} />;
};

export default SubsiteFrise;
