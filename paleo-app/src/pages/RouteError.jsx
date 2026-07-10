import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../hooks/usePageMeta';
import ErrorPage, { errorButtonPrimary, errorButtonSecondary } from '../components/ErrorPage';

// errorElement du router (cf. App.jsx) : rendu à la place de RootLayout quand
// une route lève une exception (crash de rendu, loader/action en échec, ou
// `throw new Response(...)`). Contrairement à la 404 — qui est une route qui
// MATCHE (`path="*"`) et garde donc le header/footer — une erreur lancée
// remplace tout l'arbre, on rend donc une page autonome centrée mais brandée.
//
// On distingue :
//   - 404 : Response 404 explicitement lancée → mêmes textes que la page 404.
//   - 403 : accès refusé (permissions).
//   - autres Response (5xx…) : erreur serveur.
//   - erreur JS non-Response : crash inattendu.
const RouteError = () => {
    const { t } = useTranslation();
    const error = useRouteError();

    let code = t('errorPage.oops', 'Oups');
    let heading = t('errorPage.genericHeading', "Une erreur inattendue s'est produite");
    let message = t('errorPage.genericMessage', "Un problème technique nous empêche d'afficher cette page. Réessayez dans un instant.");

    if (isRouteErrorResponse(error)) {
        code = String(error.status);
        if (error.status === 404) {
            heading = t('notFound.heading', 'Cette page est introuvable');
            message = t('notFound.message', "Le lien est peut-être erroné, ou la page a été déplacée.");
        } else if (error.status === 403) {
            heading = t('errorPage.forbiddenHeading', 'Accès refusé');
            message = t('errorPage.forbiddenMessage', "Vous n'avez pas les droits nécessaires pour consulter cette page.");
        } else {
            heading = t('errorPage.serverHeading', 'Le serveur a rencontré un problème');
            message = t('errorPage.serverMessage', "La page n'a pas pu être chargée. Réessayez dans un instant.");
        }
    }

    usePageMeta({ title: t('errorPage.title', 'Erreur') });

    // En développement seulement, on garde la trace technique sous la main.
    const detail = import.meta.env.DEV
        ? (error?.stack || error?.data || (error && error.toString?.()) || null)
        : null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-bg)' }}>
            <ErrorPage code={code} heading={heading} message={message}>
                <Link to="/" style={errorButtonPrimary}>
                    {t('notFound.backHome', "Retour à l'accueil")}
                </Link>
                <button type="button" onClick={() => window.location.reload()} style={errorButtonSecondary}>
                    {t('errorPage.reload', 'Recharger la page')}
                </button>
            </ErrorPage>
            {detail && (
                <details style={{ maxWidth: 640, margin: '0 auto 40px', padding: '0 24px', width: '100%', color: 'var(--color-text-muted)' }}>
                    <summary style={{ cursor: 'pointer' }}>{t('errorPage.details', 'Détails techniques')}</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', overflowX: 'auto' }}>{String(detail)}</pre>
                </details>
            )}
        </div>
    );
};

export default RouteError;
