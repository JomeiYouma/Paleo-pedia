/**
 * SubsiteAdmin.jsx
 * Rend ManageCartels dans le contexte d'un sous-site (SubsiteLayout).
 * Le filtre sur le sous-site est verrouillé : impossible de l'enlever depuis
 * l'intérieur de /site/:slug/admin.
 */
import { useParams, Navigate, useLocation } from 'react-router-dom';
import ManageCartels from './ManageCartels';
import { useApp } from '../context/AppContext';
import { useSubsite } from '../layouts/SubsiteLayout';

const SubsiteAdmin = () => {
    const { slug } = useParams();
    const location = useLocation();
    const { isAdmin } = useApp();
    const subsite = useSubsite();

    // Redirige /site/:slug/admin → /site/:slug/admin/published pour activer l'onglet par défaut
    if (location.pathname === `/site/${slug}/admin`) {
        return <Navigate to={`/site/${slug}/admin/published`} replace />;
    }

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                Accès réservé à l'administration du sous-site.
            </div>
        );
    }

    return (
        <ManageCartels
            lockedSubsiteSlug={slug}
            lockedSubsiteCategory={subsite?.category_name || null}
        />
    );
};

export default SubsiteAdmin;
