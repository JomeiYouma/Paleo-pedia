/**
 * SubsiteFrise.jsx
 * Library filtrée sur la catégorie du sous-site, dans un des trois modes
 * publics (frise, carte, arborescence) déterminé par la route appelante.
 */
import React from 'react';
import { useSubsite } from '../layouts/SubsiteLayout';
import Library from './Library';

const SubsiteFrise = ({ viewMode = 'timeline' }) => {
    const subsite = useSubsite();
    if (!subsite) return null;
    // Pour un subsite-atelier (workshop_id set, category_name null), on passe
    // aussi fixedWorkshopId pour que Library matche les cartels par
    // appartenance à l'atelier (vue live, indépendamment de cartels.subsite_id).
    return <Library
        fixedCategory={subsite.category_name}
        fixedSubsiteId={subsite.id}
        fixedWorkshopId={subsite.workshop_id}
        viewMode={viewMode}
    />;
};

export default SubsiteFrise;
