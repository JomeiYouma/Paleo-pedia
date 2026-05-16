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
    return <Library fixedCategory={subsite.category_name} fixedSubsiteId={subsite.id} viewMode={viewMode} />;
};

export default SubsiteFrise;
