import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CartelPreview from '../components/CartelPreview';
import { Trash2, Rocket, Clock, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translationService } from '../services/translation';

const Proposals = () => {
    const { drafts, addCartel, deleteCartel, updateCartel, isAdmin, config } = useApp();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [processingId, setProcessingId] = useState(null);

    // Filter ONLY Proposals
    const proposals = drafts.filter(d => d.status === 'pending_review' || (d.titre && d.titre.includes('(Proposition)')));

    const handlePublish = async (draft, isVisible = true) => {
        if (!confirm(t('messages.publishConfirm', { title: draft.titre }))) return;

        setProcessingId(draft.id);
        const entry = { ...draft };

        // 1. AUTO-TRANSLATION
        if (config && config.openaiKey) {
            try {
                const needsEn = !entry.titre_en;
                const needsFr = !entry.titre;

                // ... (Logic shared with Drafts/Create) ...
                // Re-using simplified check
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
                alert("Auto-translation warning: " + err.message);
            }
        }

        // 2. CLEANUP
        if (entry.titre) entry.titre = entry.titre.replace(/\s*\(Proposition\)$/i, '');
        if (entry.titre_en) entry.titre_en = entry.titre_en.replace(/\s*\(Proposal\)$/i, '');

        // New Official Entry
        const newEntry = {
            ...entry,
            id: String(Date.now()),
            date: new Date().toISOString().split('T')[0],
            created_at: undefined
        };
        if (newEntry.status) delete newEntry.status;
        if (newEntry.imageUrl) delete newEntry.imageUrl; // Cleanup ephemeral image data

        // 3. EXECUTE SAFE MOVE
        // Explicitly cast to String to ensure deletion works even if ID is numeric
        // Set visibility based on argument
        newEntry.visible = isVisible;

        // First ADD to cartels. If success, THEN delete from drafts.
        const addSuccess = await addCartel(newEntry, false);

        if (addSuccess) {
            await deleteCartel(String(draft.id), true);
            alert(isVisible ? t('messages.publishSuccess') : "Publié mais masqué (Visible dans l'admin).");
        } else {
            alert("Erreur lors de la publication. La proposition n'a pas été supprimée.");
        }
        setProcessingId(null);
    };

    const handleRevert = async (draft) => {
        if (!confirm("Renvoyer ce cartel en Brouillon Public (visible et modifiable par le visiteur) ?")) return;

        const entry = { ...draft };
        entry.status = 'public_draft'; // Revert status
        if (entry.titre) entry.titre = entry.titre.replace(/\s*\(Proposition\)$/i, '');

        await updateCartel(entry, true);
        alert("Renvoyé en Brouillon Public !");
    };

    if (!isAdmin) {
        return <div className="container"><p>Access Denied</p></div>;
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <h2 style={{ borderBottom: '2px solid orange', paddingBottom: '10px', color: 'orange', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📥 Propositions / Contributions ({proposals.length})
            </h2>

            {proposals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '10px' }}>
                    <p>{t('drafts.empty')}</p>
                    <small>Les propositions des visiteurs apparaîtront ici.</small>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {proposals.map(draft => (
                        <ProposalItem
                            key={draft.id}
                            draft={draft}
                            isProcessing={processingId === draft.id}
                            onPublish={() => handlePublish(draft, true)} // True = visible
                            onPublishHidden={() => handlePublish(draft, false)} // False = hidden
                            onDelete={() => deleteCartel(draft.id, true)}
                            onRevert={() => handleRevert(draft)}
                            onEdit={() => navigate(`/app/create?edit=${draft.id}&mode=draft&source=proposals`)}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ProposalItem = ({ draft, onPublish, onPublishHidden, onDelete, onEdit, onRevert, t, isProcessing }) => {
    const dateStr = draft.created_at
        ? new Date(draft.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : (draft.date || "Date inconnue");

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', border: '1px solid orange', padding: '15px', borderRadius: '8px', background: 'white' }}>
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9em', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> Reçu le : <strong>{dateStr}</strong>
                    </span>
                    <span style={{ background: '#eee', padding: '2px 8px', borderRadius: '10px', fontSize: '0.85em' }}>
                        Source : <strong>{draft.origin || 'Accès Général'}</strong>
                    </span>
                </div>
                <CartelPreview data={draft} isDraft />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    onClick={onPublish}
                    disabled={isProcessing}
                    title="Publier (Visible)"
                    style={{
                        color: 'white', backgroundColor: 'green', border: 'none', borderRadius: '5px',
                        padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        opacity: isProcessing ? 0.5 : 1, cursor: 'pointer'
                    }}
                >
                    <Rocket size={18} />
                    <span style={{ fontSize: '0.65em', marginTop: '2px' }}>Publier</span>
                </button>

                <button
                    onClick={onPublishHidden}
                    disabled={isProcessing}
                    title="Publier (Masqué)"
                    style={{
                        color: 'white', backgroundColor: '#555', border: 'none', borderRadius: '5px',
                        padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        opacity: isProcessing ? 0.5 : 1, cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.2em' }}>👁️‍🗨️</span>
                    <span style={{ fontSize: '0.65em', marginTop: '2px' }}>Caché</span>
                </button>

                <button
                    onClick={onRevert}
                    title="Renvoyer au visiteur (Brouillon Public)"
                    style={{
                        color: 'white', backgroundColor: 'orange', border: 'none', borderRadius: '5px',
                        padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'
                    }}
                >
                    <span style={{ fontSize: '1.2em' }}>↩️</span>
                </button>

                <button onClick={onEdit} title={t('drafts.edit')} style={{ padding: '10px', cursor: 'pointer' }}>
                    <Edit size={18} />
                </button>

                <button onClick={() => { if (confirm(t('messages.confirmDelete'))) onDelete(); }} style={{ color: 'red', padding: '10px', cursor: 'pointer' }} title={t('drafts.delete')}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default Proposals;
