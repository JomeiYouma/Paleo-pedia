import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle2, AlertCircle, Presentation, GraduationCap, Handshake, Globe2 } from 'lucide-react';
import api from '../services/apiClient';
import { usePageMeta } from '../hooks/usePageMeta';

// Page « Participer au projet » : passerelle vers l'équipe pour les démos,
// formations, partenariats et frises/plateformes dédiées (cf. communication de
// lancement). Le formulaire réutilise contactMessages → l'équipe reçoit un email
// (type contact_message.created activé en v31).
const REQUEST_TYPES = [
    { key: 'demo',        icon: Presentation,  label: 'Demander une démonstration' },
    { key: 'formation',  icon: GraduationCap, label: 'Former mon équipe ou mes élèves' },
    { key: 'partenariat', icon: Handshake,     label: 'Proposer un partenariat' },
    { key: 'frise',       icon: Globe2,        label: 'Créer une frise / plateforme dédiée' },
];

const ParticiperProjet = () => {
    const { t } = useTranslation();
    usePageMeta({
        title: t('participerProjet.title', 'Participer au projet'),
        description: t('participerProjet.intro', "Démonstration, formation, partenariat ou frise pédagogique dédiée : écrivez à l'équipe Paléo-Énergétique."),
        path: '/participer-au-projet',
    });

    const [name, setName]         = useState('');
    const [email, setEmail]       = useState('');
    const [structure, setStructure] = useState('');
    const [requestType, setRequestType] = useState('demo');
    const [message, setMessage]   = useState('');
    const [website, setWebsite]   = useState(''); // honeypot
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]     = useState({ kind: null, msg: '' });

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.78rem',
        color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
    };
    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.95rem',
        boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-text)',
    };

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus({ kind: 'error', msg: t('participerProjet.errorRequired', 'Merci de renseigner votre nom, votre e-mail et votre message.') });
            return;
        }
        setSubmitting(true);
        setStatus({ kind: null, msg: '' });
        const typeLabel = REQUEST_TYPES.find(r => r.key === requestType)?.label || requestType;
        try {
            await api.contactMessages.create({
                name: name.trim(),
                email: email.trim(),
                // Le sujet permet à l'équipe de trier ces demandes par rapport aux
                // messages génériques de /contact.
                subject: `[Participer au projet] ${typeLabel}${structure.trim() ? ` — ${structure.trim()}` : ''}`,
                message: message.trim(),
                website,
            });
            setStatus({ kind: 'success', msg: t('participerProjet.success', "Merci ! Votre demande a bien été envoyée — nous revenons vers vous rapidement.") });
            setName(''); setEmail(''); setStructure(''); setMessage(''); setRequestType('demo');
        } catch (err) {
            setStatus({ kind: 'error', msg: err.message || t('participerProjet.errorGeneric', "Une erreur est survenue. Réessayez ou écrivez à hello@atelier21.org.") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 20px', lineHeight: '1.7', color: 'var(--color-text)' }}>
            <Link to="/" style={{ color: 'var(--color-text-subtle)', textDecoration: 'none', fontSize: '0.88rem' }}>
                ← {t('legal.backHome', 'Retour à l\'accueil')}
            </Link>
            <h1 style={{ fontSize: '2.5rem', margin: '16px 0 20px' }}>{t('participerProjet.title', 'Participer au projet')}</h1>

            <p style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
                {t('participerProjet.intro', 'Vous êtes enseignant·e, formateur·rice, étudiant·e, collectivité ou acteur de la transition ?')}
            </p>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '28px' }}>
                {t('participerProjet.body', "Nous pouvons vous accompagner pour prendre en main l'outil, organiser une démonstration, former vos équipes, construire une frise thématique ou ouvrir votre propre plateforme pédagogique dédiée.")}
            </p>

            {/* Ce que l'on peut faire ensemble */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '36px' }}>
                {REQUEST_TYPES.map((r) => (
                    <div key={r.key} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-accent)',
                        padding: '14px 16px',
                    }}>
                        <r.icon size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: '600', fontSize: '0.92rem' }}>{t(`participerProjet.types.${r.key}`, r.label)}</span>
                    </div>
                ))}
            </div>

            <form
                onSubmit={submit}
                style={{
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    background: 'var(--color-surface)', padding: '30px',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                {/* Honeypot — caché aux humains */}
                <input
                    type="text" name="website" value={website}
                    onChange={e => setWebsite(e.target.value)}
                    tabIndex={-1} autoComplete="off" aria-hidden="true"
                    style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', opacity: 0 }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <div>
                        <label htmlFor="pp-name" style={labelStyle}>{t('participerProjet.name', 'Nom')} *</label>
                        <input id="pp-name" type="text" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" style={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="pp-email" style={labelStyle}>{t('participerProjet.email', 'E-mail')} *</label>
                        <input id="pp-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={inputStyle} />
                    </div>
                </div>

                <div>
                    <label htmlFor="pp-structure" style={labelStyle}>{t('participerProjet.structure', 'Structure (école, entreprise, collectivité…)')}</label>
                    <input id="pp-structure" type="text" value={structure} onChange={e => setStructure(e.target.value)} autoComplete="organization" style={inputStyle} />
                </div>

                <div>
                    <label htmlFor="pp-type" style={labelStyle}>{t('participerProjet.requestType', 'Votre demande')}</label>
                    <select id="pp-type" value={requestType} onChange={e => setRequestType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {REQUEST_TYPES.map(r => (
                            <option key={r.key} value={r.key}>{t(`participerProjet.types.${r.key}`, r.label)}</option>
                        ))}
                        <option value="autre">{t('participerProjet.types.autre', 'Autre')}</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="pp-message" style={labelStyle}>{t('participerProjet.message', 'Votre message')} *</label>
                    <textarea id="pp-message" rows={5} required value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {status.kind && (
                    <div role={status.kind === 'error' ? 'alert' : 'status'} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: status.kind === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                        border: `1px solid ${status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                        borderRadius: 'var(--radius-md)', padding: '12px 14px',
                        color: status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        fontSize: '0.92rem', fontWeight: '600',
                    }}>
                        {status.kind === 'success'
                            ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            : <AlertCircle  size={18} style={{ flexShrink: 0, marginTop: '2px' }} />}
                        <span>{status.msg}</span>
                    </div>
                )}

                <button
                    type="submit" disabled={submitting} className="paleo-btn"
                    style={{ alignSelf: 'flex-start', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}
                >
                    <Send size={16} /> {submitting ? t('participerProjet.sending', 'Envoi…') : t('participerProjet.send', 'Envoyer ma demande')}
                </button>
            </form>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-subtle)', marginTop: '18px' }}>
                {t('participerProjet.alt', 'Vous préférez proposer une invention oubliée ?')}{' '}
                <Link to="/app/create" style={{ color: 'var(--color-text-muted)' }}>{t('participerProjet.altLink', 'Proposer une invention')}</Link>.
            </p>
        </div>
    );
};

export default ParticiperProjet;
