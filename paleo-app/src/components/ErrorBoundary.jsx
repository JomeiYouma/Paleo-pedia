import React from 'react';
import i18n from '../i18n';
import ErrorPage, { errorButtonPrimary, errorButtonSecondary } from './ErrorPage';

// Dernier filet de sécurité : capture les erreurs de rendu qui remontent AU-DESSUS
// du router (crash dans RouterProvider, dans le fallback Suspense, etc.). Les
// erreurs survenant DANS une route sont, elles, interceptées par l'errorElement
// du data router (cf. pages/RouteError.jsx). Étant monté hors du router, ce
// composant ne peut pas utiliser <Link> — les actions sont de simples liens/boutons.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;
            return (
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-bg)' }}>
                    <ErrorPage
                        code={i18n.t('errorPage.oops', 'Oups')}
                        heading={i18n.t('errorPage.genericHeading', "Une erreur inattendue s'est produite")}
                        message={i18n.t('errorPage.genericMessage', "Un problème technique nous empêche d'afficher cette page. Réessayez dans un instant.")}
                    >
                        <a href="/" style={errorButtonPrimary}>
                            {i18n.t('notFound.backHome', "Retour à l'accueil")}
                        </a>
                        <button type="button" onClick={() => window.location.reload()} style={errorButtonSecondary}>
                            {i18n.t('errorPage.reload', 'Recharger la page')}
                        </button>
                    </ErrorPage>
                    {import.meta.env.DEV && error && (
                        <details style={{ maxWidth: 640, margin: '0 auto 40px', padding: '0 24px', width: '100%', color: 'var(--color-text-muted)' }}>
                            <summary style={{ cursor: 'pointer' }}>{i18n.t('errorPage.details', 'Détails techniques')}</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', overflowX: 'auto' }}>
                                {error.toString()}
                                {errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
