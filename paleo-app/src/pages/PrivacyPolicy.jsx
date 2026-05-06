import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Politique de confidentialité — page statique accessible depuis le footer.
 * Contenu rédigé pour le contexte "proposer un cartel" (donnée principale
 * collectée : email/téléphone laissé volontairement par le proposant pour
 * être recontacté). Aucun tracker, aucune analytique tierce.
 */
const PrivacyPolicy = () => {
    return (
        <div style={{
            maxWidth: '760px', margin: '0 auto',
            padding: '40px 24px 80px',
            color: '#222', lineHeight: 1.6,
        }}>
            <Link to="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.88rem' }}>
                ← Retour à l'accueil
            </Link>

            <h1 style={{ marginTop: '20px', fontSize: '1.8rem', fontWeight: 800 }}>
                Politique de confidentialité
            </h1>
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '-6px' }}>
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <h2 style={{ marginTop: '28px', fontSize: '1.15rem', fontWeight: 700 }}>1. Responsable du traitement</h2>
            <p>
                Le site Paléo-Énergétique est édité par l'<strong>Atelier 21</strong>.
                Pour toute question relative à vos données personnelles, vous pouvez
                écrire à <a href="mailto:hello@atelier21.org" style={{ color: '#C2185B' }}>hello@atelier21.org</a>.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>2. Données collectées</h2>
            <p>
                Lorsque vous proposez un cartel sans être connecté, nous vous
                demandons un <strong>moyen de contact</strong> (email ou numéro de
                téléphone) ainsi qu'enregistrons l'<strong>adresse IP</strong> à
                des fins de modération anti-spam. Le contenu du cartel que vous
                soumettez (titre, description, image, lieu) est lui aussi conservé.
            </p>
            <p>
                Si vous disposez d'un compte, votre <strong>adresse email</strong>{' '}
                et votre <strong>mot de passe haché</strong> sont conservés pour
                vous permettre de vous connecter et d'éditer vos contenus.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>3. Finalités</h2>
            <ul style={{ paddingLeft: '22px' }}>
                <li>Vous recontacter au sujet de votre proposition (clarification, validation, refus motivé).</li>
                <li>Modérer les soumissions et lutter contre le spam.</li>
                <li>Permettre la connexion et la gestion des contenus pour les utilisateurs inscrits.</li>
            </ul>
            <p>
                Nous ne procédons à <strong>aucun profilage</strong>, ne vous envoyons
                pas de newsletter et ne transmettons vos données à <strong>aucun tiers</strong>.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>4. Durée de conservation</h2>
            <ul style={{ paddingLeft: '22px' }}>
                <li>Coordonnées d'un proposant non-connecté : conservées tant que la proposition est en file de modération, puis purgées sous 12 mois après publication ou rejet.</li>
                <li>Adresses IP : conservées 12 mois maximum.</li>
                <li>Compte utilisateur : conservé tant que le compte existe.</li>
            </ul>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>5. Cookies et traceurs</h2>
            <p>
                Le site n'utilise <strong>aucun cookie de mesure d'audience</strong>{' '}
                ni traceur tiers. Le seul stockage côté navigateur est un{' '}
                <em>localStorage</em> contenant votre jeton de session lorsque
                vous êtes connecté ; il est strictement nécessaire au fonctionnement.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>6. Vos droits</h2>
            <p>
                Conformément au RGPD, vous disposez d'un droit d'accès, de
                rectification, d'effacement, d'opposition et de portabilité de
                vos données. Pour les exercer, écrivez à{' '}
                <a href="mailto:hello@atelier21.org" style={{ color: '#C2185B' }}>hello@atelier21.org</a>{' '}
                en précisant l'email ou le numéro que vous nous avez communiqué.
                Nous répondons dans un délai d'un mois maximum.
            </p>

            <h2 style={{ marginTop: '24px', fontSize: '1.15rem', fontWeight: 700 }}>7. Réclamation</h2>
            <p>
                En cas de désaccord sur le traitement de vos données, vous avez
                le droit de saisir la <strong>CNIL</strong> ({' '}
                <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: '#C2185B' }}>
                    cnil.fr
                </a>{' '}).
            </p>
        </div>
    );
};

export default PrivacyPolicy;
