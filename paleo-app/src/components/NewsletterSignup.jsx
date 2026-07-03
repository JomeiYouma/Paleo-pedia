import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/apiClient';

// Bandeau d'inscription à la newsletter. Relaie vers Sendy (auto-hébergé) via
// le proxy serveur /api/newsletter/subscribe. Composant réutilisable : posé en
// bas de la page d'accueil, il peut être déposé tel quel sur d'autres pages
// publiques (on ajuste privacyPath selon le contexte : /site/:slug/…, /pedia…).
const NewsletterSignup = ({ privacyPath = '/politique-confidentialite' }) => {
    const { t } = useTranslation();
    const [email, setEmail]         = useState('');
    const [website, setWebsite]     = useState(''); // honeypot
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]       = useState({ kind: null, msg: '' });

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!email.trim()) {
            setStatus({ kind: 'error', msg: t('newsletter.errorRequired') });
            return;
        }
        setSubmitting(true);
        setStatus({ kind: null, msg: '' });
        try {
            const r = await api.newsletter.subscribe({ email: email.trim(), website });
            setStatus({ kind: 'success', msg: r?.already ? t('newsletter.already') : t('newsletter.success') });
            setEmail('');
        } catch (err) {
            setStatus({ kind: 'error', msg: err.message || t('newsletter.errorGeneric') });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section aria-labelledby="newsletter-heading" style={{
            background: 'var(--color-surface-2)',
            borderTop: '1px solid var(--color-border)',
            padding: '56px 20px',
        }}>
            <div style={{ maxWidth: '620px', margin: '0 auto', textAlign: 'center' }}>
                <Mail size={30} color="var(--color-primary)" aria-hidden="true" />
                <h2 id="newsletter-heading" style={{ margin: '12px 0 8px', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                    {t('newsletter.title')}
                </h2>
                <p style={{ margin: '0 auto 24px', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: '520px' }}>
                    {t('newsletter.subtitle')}
                </p>

                <form onSubmit={submit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* Honeypot — caché aux humains */}
                    <input
                        type="text"
                        name="website"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', opacity: 0 }}
                    />

                    <label htmlFor="newsletter-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                        {t('newsletter.placeholder')}
                    </label>
                    <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('newsletter.placeholder')}
                        autoComplete="email"
                        style={{
                            flex: '1 1 280px', maxWidth: '360px',
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)', fontSize: '1rem',
                            fontFamily: 'inherit', boxSizing: 'border-box',
                            background: 'var(--color-surface)', color: 'var(--color-text)',
                        }}
                    />
                    <button type="submit" disabled={submitting} className="paleo-btn"
                        style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'wait' : 'pointer' }}>
                        <Send size={16} /> {submitting ? t('newsletter.submitting') : t('newsletter.submit')}
                    </button>
                </form>

                {status.kind && (
                    <div role={status.kind === 'error' ? 'alert' : 'status'} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px',
                        color: status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: 600, fontSize: '0.95rem',
                    }}>
                        {status.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span>{status.msg}</span>
                    </div>
                )}

                <p style={{ marginTop: '16px', fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                    {t('newsletter.privacyNote')}{' '}
                    <Link to={privacyPath} style={{ color: 'var(--color-text-muted)' }}>{t('newsletter.privacyLink')}</Link>.
                </p>
            </div>
        </section>
    );
};

export default NewsletterSignup;
