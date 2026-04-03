import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import { Trash2, Check, X, Edit, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/apiClient';

/**
 * Page "En attente" pour l'admin.
 * Regroupe tous les cartels non-publiés : brouillons (draft) + propositions (pending_review).
 * Le visiteur n'a pas accès à cette page (redirection gérée via la navigation).
 */

const STATUS_LABELS = {
    draft:          { label: '🖊️ Brouillon',      bg: '#f0f4ff', color: '#3b5bdb' },
    pending_review: { label: '⏳ Proposition',     bg: '#fff4e0', color: '#e67e00' },
    archived:       { label: '🗄️ Archivé',         bg: '#f8f8f8', color: '#888'   },
};

const Drafts = () => {
    const { cartels, fetchData, isAdmin } = useApp();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [processingId, setProcessingId] = useState(null);

    if (!isAdmin) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                <p>Accès réservé à l'administration.</p>
            </div>
        );
    }

    // Tous les cartels non-publiés (draft + pending_review). L'API nous renvoie tout si admin.
    const pendingCartels = (cartels || []).filter(c =>
        c.status === 'draft' || c.status === 'pending_review'
    );

    const drafts = pendingCartels.filter(c => c.status === 'draft');
    const proposals = pendingCartels.filter(c => c.status === 'pending_review');

    const handlePublish = async (cartel) => {
        if (!confirm(`Publier "${cartel.titre}" ?`)) return;
        setProcessingId(cartel.id);
        try {
            await api.cartels.publish(cartel.id);
            await fetchData();
        } catch (e) {
            alert('Erreur : ' + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (cartel) => {
        if (!confirm(`Refuser et supprimer "${cartel.titre}" ?`)) return;
        setProcessingId(cartel.id);
        try {
            await api.cartels.delete(cartel.id);
            await fetchData();
        } catch (e) {
            alert('Erreur : ' + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRevertDraft = async (cartel) => {
        if (!confirm(`Remettre "${cartel.titre}" en brouillon ?`)) return;
        setProcessingId(cartel.id);
        try {
            await api.cartels.setStatus(cartel.id, 'draft');
            await fetchData();
        } catch (e) {
            alert('Erreur : ' + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleArchive = async (cartel) => {
        if (!confirm(`Archiver "${cartel.titre}" ?`)) return;
        setProcessingId(cartel.id);
        try {
            await api.cartels.archive(cartel.id);
            await fetchData();
        } catch (e) {
            alert('Erreur : ' + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>En attente de publication</h2>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.9rem' }}>
                        {drafts.length} brouillon{drafts.length !== 1 ? 's' : ''} · {proposals.length} proposition{proposals.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/app/create')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: '600' }}
                >
                    <Plus size={16} /> Nouveau cartel
                </button>
            </div>

            {/* ── Propositions des visiteurs ── */}
            {proposals.length > 0 && (
                <section style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '2px solid #e67e00', paddingBottom: '8px', color: '#e67e00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📥 Propositions de visiteurs <span style={{ fontSize: '0.85rem', fontWeight: '400', color: '#888' }}>— À modérer</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {proposals.map(cartel => (
                            <PendingCard
                                key={cartel.id}
                                cartel={cartel}
                                isProcessing={processingId === cartel.id}
                                onPublish={() => handlePublish(cartel)}
                                onReject={() => handleReject(cartel)}
                                onEdit={() => navigate(`/app/create?edit=${cartel.id}`)}
                                onRevertDraft={() => handleRevertDraft(cartel)}
                                t={t}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Brouillons admin ── */}
            {drafts.length > 0 && (
                <section>
                    <h3 style={{ borderBottom: '2px solid #3b5bdb', paddingBottom: '8px', color: '#3b5bdb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🖊️ Brouillons
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {drafts.map(cartel => (
                            <PendingCard
                                key={cartel.id}
                                cartel={cartel}
                                isProcessing={processingId === cartel.id}
                                onPublish={() => handlePublish(cartel)}
                                onReject={() => handleReject(cartel)}
                                onEdit={() => navigate(`/app/create?edit=${cartel.id}`)}
                                onArchive={() => handleArchive(cartel)}
                                t={t}
                            />
                        ))}
                    </div>
                </section>
            )}

            {pendingCartels.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', background: '#fafafa', borderRadius: '12px' }}>
                    <p style={{ fontSize: '1.1rem' }}>✅ Aucun cartel en attente</p>
                    <small>Toutes les soumissions ont été traitées.</small>
                </div>
            )}
        </div>
    );
};

/** Carte d'un cartel en attente */
const PendingCard = ({ cartel, isProcessing, onPublish, onReject, onEdit, onRevertDraft, onArchive, t }) => {
    const dateStr = cartel.created_at
        ? new Date(cartel.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    const badge = STATUS_LABELS[cartel.status];

    return (
        <div style={{
            display: 'flex', gap: '16px', alignItems: 'flex-start',
            border: `1px solid ${cartel.status === 'pending_review' ? '#ffd08a' : '#c5d0ff'}`,
            borderRadius: '10px', padding: '16px', background: 'white'
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '10px', fontSize: '0.85rem', color: '#888', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} /> Créé le <strong>{dateStr}</strong>
                    </span>
                    {cartel.submitter_ip && (
                        <span>IP : <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: '4px' }}>{cartel.submitter_ip}</code></span>
                    )}
                    {badge && (
                        <span style={{ background: badge.bg, color: badge.color, padding: '2px 10px', borderRadius: '20px', fontWeight: '600', fontSize: '0.78rem' }}>
                            {badge.label}
                        </span>
                    )}
                </div>
                <CartelPreview data={cartel} isDraft />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <ActionBtn onClick={onPublish} disabled={isProcessing} color="green" title="Publier">
                    <Check size={16} />
                </ActionBtn>
                <ActionBtn onClick={onEdit} color="#555" title="Éditer">
                    <Edit size={16} />
                </ActionBtn>
                {onRevertDraft && (
                    <ActionBtn onClick={onRevertDraft} disabled={isProcessing} color="#e67e00" title="Repasser en brouillon">
                        ↩️
                    </ActionBtn>
                )}
                {onArchive && (
                    <ActionBtn onClick={onArchive} disabled={isProcessing} color="#888" title="Archiver">
                        🗄️
                    </ActionBtn>
                )}
                <ActionBtn onClick={onReject} disabled={isProcessing} color="red" title="Supprimer">
                    <X size={16} />
                </ActionBtn>
            </div>
        </div>
    );
};

const ActionBtn = ({ onClick, disabled, color, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${color}`, borderRadius: '8px',
            color, background: 'white', cursor: disabled ? 'wait' : 'pointer',
            opacity: disabled ? 0.5 : 1, transition: 'background 0.15s',
            fontSize: '1rem',
        }}
    >
        {children}
    </button>
);

export default Drafts;
