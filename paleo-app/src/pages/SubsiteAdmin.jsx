/**
 * SubsiteAdmin.jsx
 * Rend ManageCartels dans le contexte d'un sous-site (SubsiteLayout).
 * Le filtre sur le sous-site est verrouillé : impossible de l'enlever depuis
 * l'intérieur de /site/:slug/admin.
 */
import { Navigate, useLocation } from 'react-router-dom';
import ManageCartels from './ManageCartels';
import { useApp } from '../context/AppContext';
import { useSubsite } from '../layouts/SubsiteLayout';
import { subsiteBasePath } from '../utils/subsiteHost';

const SubsiteAdmin = () => {
    const location = useLocation();
    const { isAdmin } = useApp();
    const subsite = useSubsite();
    const slug = subsite?.slug;
    const base = subsiteBasePath(slug);

    // Redirige /admin (ou /site/:slug/admin) → /admin/published pour activer l'onglet par défaut.
    // Le `base` est `''` sur le host dédié (paleo-h2o.org/admin) et `/site/<slug>` ailleurs.
    if (location.pathname === `${base}/admin`) {
        return <Navigate to={`${base}/admin/published`} replace />;
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
