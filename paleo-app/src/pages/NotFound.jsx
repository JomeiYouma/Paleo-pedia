import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../hooks/usePageMeta';
import ErrorPage, { errorButtonPrimary } from '../components/ErrorPage';

// Page 404 « brandée » : rendue DANS SiteLayout (donc avec le header + le
// footer du site), elle remplace l'écran d'erreur brut de React Router pour
// les routes inconnues, et offre un vrai retour à la navigation.
const NotFound = () => {
    const { t } = useTranslation();
    usePageMeta({ title: t('notFound.title', 'Page introuvable') });
    return (
        <ErrorPage
            code="404"
            heading={t('notFound.heading', 'Cette page est introuvable')}
            message={t('notFound.message', "Le lien est peut-être erroné, ou la page a été déplacée.")}
        >
            <Link to="/" style={errorButtonPrimary}>
                {t('notFound.backHome', "Retour à l'accueil")}
            </Link>
        </ErrorPage>
    );
};

export default NotFound;
