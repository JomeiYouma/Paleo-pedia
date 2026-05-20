import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/apiClient';

const Contact = () => {
    const { t } = useTranslation();
    const [name, setName]       = useState('');
    const [email, setEmail]     = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [website, setWebsite] = useState(''); // honeypot
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]   = useState({ kind: null, msg: '' });

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '700',
        fontSize: '0.78rem',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };
    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
    };

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus({ kind: 'error', msg: t('pages.contact.errorRequired') });
            return;
        }
        setSubmitting(true);
        setStatus({ kind: null, msg: '' });
        try {
            await api.contactMessages.create({
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim() || null,
                message: message.trim(),
                website,
            });
            setStatus({ kind: 'success', msg: t('pages.contact.success') });
            setName(''); setEmail(''); setSubject(''); setMessage('');
        } catch (err) {
            setStatus({ kind: 'error', msg: err.message || t('pages.contact.errorGeneric') });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>{t('pages.contact.title')}</h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                {t('pages.contact.intro')}
            </p>

            <form
                onSubmit={submit}
                style={{
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    background: 'var(--color-surface)',
                    padding: '30px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
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

                <div>
                    <label htmlFor="contact-name" style={labelStyle}>{t('pages.contact.name')} *</label>
                    <input
                        id="contact-name"
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoComplete="name"
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label htmlFor="contact-email" style={labelStyle}>{t('pages.contact.email')} *</label>
                    <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label htmlFor="contact-subject" style={labelStyle}>{t('pages.contact.subject')}</label>
                    <input
                        id="contact-subject"
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label htmlFor="contact-message" style={labelStyle}>{t('pages.contact.message')} *</label>
                    <textarea
                        id="contact-message"
                        rows={5}
                        required
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                </div>

                {status.kind && (
                    <div role={status.kind === 'error' ? 'alert' : 'status'} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: status.kind === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                        border: `1px solid ${status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        color: status.kind === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        fontSize: '0.92rem', fontWeight: '600',
                    }}>
                        {status.kind === 'success'
                            ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                            : <AlertCircle  size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        }
                        <span>{status.msg}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="paleo-btn"
                    style={{
                        alignSelf: 'flex-start',
                        opacity: submitting ? 0.6 : 1,
                        cursor: submitting ? 'wait' : 'pointer',
                    }}
                >
                    <Send size={16} /> {submitting ? t('pages.contact.sending') : t('pages.contact.send')}
                </button>
            </form>
        </div>
    );
};

export default Contact;
