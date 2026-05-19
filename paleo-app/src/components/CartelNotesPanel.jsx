/**
 * CartelNotesPanel.jsx — gestion des notes admin internes d'un cartel.
 *
 * Visible uniquement en édition (un cartel doit déjà exister pour porter des
 * notes). Tous les admins (sous-site + superadmin) peuvent ajouter / consulter
 * / supprimer n'importe quelle note (cf. cartelNoteController côté serveur).
 */
import React, { useEffect, useState } from 'react';
import { Trash2, StickyNote, Send } from 'lucide-react';
import api from '../services/apiClient';

const formatDate = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return iso; }
};

const CartelNotesPanel = ({ cartelId, subsiteSlug }) => {
    const [notes, setNotes]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft]     = useState('');
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!cartelId) return;
        let cancelled = false;
        setLoading(true);
        api.cartels.listNotes(cartelId, subsiteSlug)
            .then(data => { if (!cancelled) setNotes(Array.isArray(data) ? data : []); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [cartelId, subsiteSlug]);

    const handleAdd = async () => {
        const body = draft.trim();
        if (!body || saving) return;
        setSaving(true); setError('');
        try {
            const note = await api.cartels.addNote(cartelId, body, subsiteSlug);
            setNotes(prev => [note, ...prev]);
            setDraft('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('Supprimer cette note ?')) return;
        try {
            await api.cartels.deleteNote(cartelId, noteId, subsiteSlug);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{
            border: '1px solid #e8e0c8', background: '#fffdf5',
            borderRadius: '12px', padding: '16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <StickyNote size={16} color="#8a7a3a" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#5a4d20' }}>
                    Notes admin internes
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#a08a4a' }}>
                    Visibles uniquement par les admins
                </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Ajouter une note…"
                    rows={2}
                    style={{
                        flex: 1, padding: '8px 10px', borderRadius: '8px',
                        border: '1px solid #e0d6b0', fontFamily: 'inherit', fontSize: '0.9rem',
                        resize: 'vertical', boxSizing: 'border-box', outline: 'none',
                    }}
                />
                <button type="button" onClick={handleAdd} disabled={!draft.trim() || saving}
                    style={{
                        padding: '8px 14px', borderRadius: '8px', border: 'none',
                        background: !draft.trim() || saving ? '#ccc' : '#8a7a3a',
                        color: 'white', cursor: !draft.trim() || saving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontWeight: 600,
                    }}>
                    <Send size={14} /> {saving ? '…' : 'Ajouter'}
                </button>
            </div>

            {error && (
                <div style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>
            )}

            {loading ? (
                <div style={{ color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>Chargement…</div>
            ) : notes.length === 0 ? (
                <div style={{ color: '#a08a4a', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Aucune note pour le moment.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notes.map(n => (
                        <div key={n.id} style={{
                            background: 'white', borderRadius: '8px', padding: '10px 12px',
                            border: '1px solid #f0e8c8', display: 'flex', gap: '10px', alignItems: 'flex-start',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: '4px' }}>
                                    <strong style={{ color: '#666' }}>{n.author_email || 'inconnu'}</strong>
                                    {' · '}
                                    {formatDate(n.created_at)}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', color: '#333', lineHeight: 1.5 }}>
                                    {n.body}
                                </div>
                            </div>
                            <button type="button" onClick={() => handleDelete(n.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#c0392b', padding: '4px', display: 'flex',
                                }}>
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CartelNotesPanel;
