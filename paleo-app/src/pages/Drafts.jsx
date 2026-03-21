import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import { Trash2, Rocket, Plus, Edit, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translationService } from '../services/translation'; // Import service

const Drafts = () => {
    const { drafts, addCartel, deleteCartel, updateCartel, isAdmin, config, currentWorkshopId } = useApp(); // Get currentWorkshopId
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [processingId, setProcessingId] = useState(null);

    const handlePublish = async (draft) => {
        // VISITOR MODE: Propose (Update status only)
        if (!isAdmin) {
            if (!confirm(t('messages.proposeConfirm', "Proposer ce cartel à la validation ?"))) return;

            setProcessingId(draft.id);
            const updatedDraft = {
                ...draft,
                status: 'pending_review',
                // Optional: Tag title if needed, but status is better
                titre: draft.titre && !draft.titre.includes('(Proposition)') ? `${draft.titre} (Proposition)` : draft.titre
            };

            const success = await updateCartel(updatedDraft, true); // true = isDraft
            setProcessingId(null);

            if (success) {
                alert(t('messages.proposalSent', "Proposition envoyée ! Elle sera revue par l'administration."));
                // Navigate away or refresh list handled by context
            }
            return;
        }

        // ADMIN MODE: Publish (Move to Cartels)
        if (!confirm(t('messages.publishConfirm', { title: draft.titre }))) return;

        setProcessingId(draft.id);
        const entry = { ...draft };

        // 1. AUTO-TRANSLATION (Same logic as Create.jsx)
        if (config && config.openaiKey) {
            try {
                const needsEn = !entry.titre_en;
                const needsFr = !entry.titre;

                // Simplified Translation Logic
                if (needsEn && entry.titre) {
                    const resultEn = await translationService.translateCartel({
                        titre: entry.titre,
                        description: entry.description,
                        location: entry.location,
                        categories: entry.categories
                    }, config.openaiKey, 'en');
                    entry.titre_en = resultEn.title;
                    entry.description_en = resultEn.description;
                    entry.location_en = resultEn.location;
                    if (!entry.categories_en || entry.categories_en.length === 0) entry.categories_en = resultEn.categories;
                }
                else if (needsFr && entry.titre_en) {
                    const resultFr = await translationService.translateCartel({
                        titre_en: entry.titre_en,
                        description_en: entry.description_en,
                        location_en: entry.location_en,
                        categories: entry.categories
                    }, config.openaiKey, 'fr');
                    entry.titre = resultFr.title;
                    entry.description = resultFr.description;
                    entry.location = resultFr.location;
                    if (!entry.categories || entry.categories.length === 0) entry.categories = resultFr.categories;
                }
            } catch (err) {
                console.error("Publish Translation Failed", err);
                alert("Attention: Traduction auto échouée. " + err.message);
            }
        }

        // 2. CLEANUP & PREPARE
        // Remove "(Proposition)" suffix if present
        if (entry.titre) entry.titre = entry.titre.replace(/\s*\(Proposition\)$/i, '');
        if (entry.titre_en) entry.titre_en = entry.titre_en.replace(/\s*\(Proposal\)$/i, '');

        // New Official Entry
        const newEntry = {
            ...entry,
            id: String(Date.now()),
            date: new Date().toISOString().split('T')[0],
            created_at: undefined // Remove draft timestamp
        };
        if (newEntry.status) delete newEntry.status;

        // 3. EXECUTE SAFE MOVE
        // First ADD to cartels. If success, THEN delete from drafts.
        const addSuccess = await addCartel(newEntry, false);

        if (addSuccess) {
            await deleteCartel(draft.id, true);
            alert(t('messages.publishSuccess'));
        } else {
            alert("Erreur lors de la publication. Le brouillon n'a pas été supprimé.");
        }

        setProcessingId(null);
    };

    // FILTER LOGIC
    // Admin: Sees private drafts (draft_wip) AND public drafts (public_draft). Excludes Proposals.
    // Visitor: Sees ONLY public drafts (public_draft).
    // WORKSHOP: Filter by workshopId
    const myDrafts = drafts.filter(d => {
        const isProposal = d.status === 'pending_review' || d.titre?.includes('(Proposition)');
        if (isProposal) return false;

        // Context Filter
        if (currentWorkshopId) {
            // In a workshop: Only show drafts linked to this workshop
            if (String(d.workshopId) !== String(currentWorkshopId)) return false;
        } else {
            // Global: Only show drafts NOT linked to a workshop
            if (d.workshopId) return false;
        }

        if (isAdmin) return true;

        return d.status === 'public_draft';
    });

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{t('drafts.title')} ({myDrafts.length})</h2>
                <button
                    onClick={() => navigate('/app/create?mode=draft')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid black', padding: '8px', cursor: 'pointer', backgroundColor: 'var(--color-pink-darker)', color: 'white' }}
                >
                    <Plus size={16} /> {t('drafts.addIdea')}
                </button>
            </div>

            {/* LIST OF ADMIN DRAFTS */}
            <div>
                {myDrafts.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#888', textAlign: 'center' }}>{t('drafts.empty')}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {myDrafts.map(draft => (
                            <DraftItem
                                key={draft.id}
                                draft={draft}
                                isAdmin={isAdmin}
                                isProcessing={processingId === draft.id}
                                onPublish={() => handlePublish(draft)}
                                onDelete={() => deleteCartel(draft.id, true)}
                                onEdit={() => navigate(`/app/create?edit=${draft.id}&mode=draft`)}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DraftItem = ({ draft, onPublish, onDelete, onEdit, t, isAdmin, isProposal, isProcessing }) => {
    // Format timestamp
    const dateStr = draft.created_at
        ? new Date(draft.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : (draft.date || "Date inconnue");

    const canManage = isAdmin || draft.status === 'public_draft';

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', border: isProposal ? '1px solid orange' : '1px solid #eee', padding: '15px', borderRadius: '8px', position: 'relative' }}>
            {isProposal && <div style={{ position: 'absolute', top: 0, right: 0, background: 'orange', color: 'white', padding: '2px 8px', fontSize: '0.7em', borderBottomLeftRadius: '8px' }}>PROPOSITION</div>}

            <div style={{ flex: 1 }}>
                {isProposal && (
                    <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9em', color: '#666' }}>
                        <Clock size={14} /> Reçu le : <strong>{dateStr}</strong>
                    </div>
                )}
                <CartelPreview data={draft} isDraft />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {canManage && (
                    <button
                        onClick={onPublish}
                        disabled={isProcessing}
                        title={isAdmin ? t('drafts.publish') : "Envoyer Proposition"}
                        style={{ color: 'green', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: isProcessing ? 0.5 : 1 }}
                    >
                        <Rocket size={20} />
                        <span style={{ fontSize: '0.7em' }}>{isProcessing ? '...' : (isAdmin ? t('drafts.publish') : "Proposer")}</span>
                    </button>
                )}
                <button onClick={onEdit} title={t('drafts.edit')}>
                    <Edit size={20} />
                </button>
                {canManage && (
                    <button onClick={() => { if (confirm(t('messages.confirmDelete'))) onDelete(); }} style={{ color: 'red' }} title={t('drafts.delete')}>
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Drafts;
