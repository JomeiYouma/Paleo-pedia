import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus, Trash2, ArrowLeft, Mail, Crown, Users as UsersIcon,
    CheckCircle2, AlertCircle, Shield,
} from 'lucide-react';
import api from '../services/apiClient';

const Toggle = ({ value, onChange, label, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '14px',
            border: `1px solid ${value ? '#00897b' : '#e0e0e0'}`,
            background: value ? '#00897b' : '#f5f5f5',
            color: value ? 'white' : '#888',
            fontSize: '0.76rem', fontWeight: '700',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'inherit',
        }}
        title={label}
    >
        {label}
    </button>
);

const AdminTeam = () => {
    const { user, isSuperadmin, isOwner, homeSubsiteId } = useApp();
    const navigate = useNavigate();

    const [subsite,  setSubsite]  = useState(null);
    const [subsites, setSubsites] = useState([]); // pour le picker superadmin
    const [members,  setMembers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [toast,    setToast]    = useState(null);

    // Création
    const [newEmail,    setNewEmail]    = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [creating,    setCreating]    = useState(false);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const resolvedSlug = subsite?.slug || null;

    // Charger le sous-site géré (par homeSubsiteId pour owner, via picker pour superadmin)
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const all = await api.subsites.getAll();
                const list = Array.isArray(all) ? all : [];
                setSubsites(list);
                const mine = list.find(s => s.id === homeSubsiteId);
                if (mine) setSubsite(mine);
                else if (isSuperadmin && list.length) setSubsite(list[0]); // par défaut premier
            } catch (e) {
                showToast('error', e.message || 'Erreur chargement');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [homeSubsiteId, isSuperadmin]);

    // Charger les membres quand le sous-site courant change
    useEffect(() => {
        if (!resolvedSlug) return;
        setLoading(true);
        api.team.list(resolvedSlug)
            .then(d => setMembers(Array.isArray(d) ? d : []))
            .catch(e => showToast('error', e.message))
            .finally(() => setLoading(false));
    }, [resolvedSlug]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newEmail.trim() || !newPassword || newPassword.length < 8) {
            showToast('error', 'Email et mot de passe (8 caractères min.) requis');
            return;
        }
        setCreating(true);
        try {
            const created = await api.team.create(resolvedSlug, {
                email: newEmail.trim(),
                password: newPassword,
            });
            setMembers(prev => [created, ...prev]);
            setNewEmail('');
            setNewPassword('');
            showToast('success', `Compte "${created.email}" créé`);
        } catch (err) {
            showToast('error', err.message || 'Erreur création');
        } finally {
            setCreating(false);
        }
    };

    const handleTogglePerm = async (m, key) => {
        try {
            const updated = await api.team.update(resolvedSlug, m.id, { [key]: !m[key] });
            setMembers(prev => prev.map(x => x.id === m.id ? updated : x));
        } catch (err) {
            showToast('error', err.message || 'Erreur modification');
        }
    };

    const handleDelete = async (m) => {
        if (!confirm(`Retirer ${m.email} de l'équipe ? Le compte sera supprimé.`)) return;
        try {
            await api.team.delete(resolvedSlug, m.id);
            setMembers(prev => prev.filter(x => x.id !== m.id));
            showToast('success', 'Membre retiré');
        } catch (err) {
            showToast('error', err.message || 'Erreur suppression');
        }
    };

    const canManageThisTenant = useMemo(() => {
        if (!subsite) return false;
        if (isSuperadmin) return true;
        return isOwner && subsite.id === homeSubsiteId;
    }, [subsite, isSuperadmin, isOwner, homeSubsiteId]);

    if (!isSuperadmin && !isOwner) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                <Shield size={32} style={{ marginBottom: '12px', color: '#ccc' }} />
                <p>Accès réservé aux owners de sous-sites et aux superadmins.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>

            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
                    background: toast.type === 'error' ? '#fee' : '#efe',
                    color: toast.type === 'error' ? '#c00' : '#080',
                    border: `1px solid ${toast.type === 'error' ? '#fcc' : '#cfc'}`,
                    borderRadius: '10px', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '0.88rem', fontWeight: '600',
                }}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/app/admin')}
                    style={{
                        background: '#f5f5f5', border: '1px solid #e0e0e0',
                        borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.84rem', color: '#666', fontFamily: 'inherit',
                    }}
                >
                    <ArrowLeft size={14} /> Retour
                </button>
                <div style={{
                    width: '40px', height: '40px',
                    background: '#e0f2f1', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <UsersIcon size={20} color="#00897b" />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1a1a1a' }}>
                    Gestion d'équipe
                </h1>
            </div>

            {/* Sélecteur de sous-site (superadmin sans home_subsite_id) */}
            {isSuperadmin && !homeSubsiteId && subsites.length > 1 && (
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '6px' }}>Sous-site géré</label>
                    <select
                        value={subsite?.id || ''}
                        onChange={e => setSubsite(subsites.find(s => s.id === e.target.value) || null)}
                        style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.9rem', background: 'white', minWidth: '240px' }}
                    >
                        {subsites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}

            {subsite && (
                <p style={{
                    background: '#e0f2f1', color: '#00695c',
                    borderRadius: '8px', padding: '10px 16px',
                    fontSize: '0.85rem', fontWeight: '600', margin: '0 0 20px',
                }}>
                    Équipe du sous-site <strong>{subsite.name}</strong> ({members.length} membre{members.length > 1 ? 's' : ''})
                </p>
            )}

            {/* Formulaire d'invitation */}
            {canManageThisTenant && (
                <div style={{
                    background: 'white', border: '1px solid #eee', borderRadius: '14px',
                    padding: '18px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#00897b' }}>
                        Inviter un membre
                    </p>
                    <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="email@exemple.org"
                            required
                            style={{ flex: '1 1 220px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mot de passe (8+ car.)"
                            required
                            minLength={8}
                            style={{ flex: '1 1 180px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '0.88rem' }}
                        />
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                flexShrink: 0, border: 'none', borderRadius: '8px', padding: '9px 16px',
                                background: creating ? '#b2dfdb' : '#00897b',
                                color: 'white', fontWeight: '700',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', fontSize: '0.88rem',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            <UserPlus size={14} /> Inviter
                        </button>
                    </form>
                    <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#888' }}>
                        Le compte est créé avec un mot de passe temporaire. Le nouveau membre peut se connecter immédiatement et devrait le changer par la suite.
                    </p>
                </div>
            )}

            {/* Liste des membres */}
            <div style={{
                background: 'white', border: '1px solid #eee', borderRadius: '14px',
                padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>Chargement…</p>
                ) : members.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '0.9rem' }}>
                        Aucun membre dans ce sous-site.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {members.map(m => {
                            const isSelf = m.id === user?.id;
                            const isProtectedSuperadmin = !!m.can_manage_admin && !isSuperadmin;
                            return (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid #eee', borderRadius: '10px',
                                    padding: '10px 14px', background: '#fafafa',
                                    flexWrap: 'wrap',
                                }}>
                                    <Mail size={16} color="#00897b" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.email}
                                            {isSelf && <span style={{ color: '#aaa', fontWeight: '400', marginLeft: '6px' }}>(vous)</span>}
                                        </div>
                                        {m.can_manage_admin && (
                                            <div style={{ fontSize: '0.75rem', color: '#9c27b0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Crown size={11} /> Superadmin
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        <Toggle
                                            label="Créer"
                                            value={!!m.can_create_cartel}
                                            onChange={v => handleTogglePerm(m, 'can_create_cartel')}
                                            disabled={isProtectedSuperadmin || !canManageThisTenant}
                                        />
                                        <Toggle
                                            label="Publier"
                                            value={!!m.can_publish_cartel}
                                            onChange={v => handleTogglePerm(m, 'can_publish_cartel')}
                                            disabled={isProtectedSuperadmin || !canManageThisTenant}
                                        />
                                        <Toggle
                                            label="Owner"
                                            value={!!m.can_manage_team}
                                            onChange={v => handleTogglePerm(m, 'can_manage_team')}
                                            disabled={isProtectedSuperadmin || !canManageThisTenant}
                                        />
                                    </div>

                                    {canManageThisTenant && !isSelf && !isProtectedSuperadmin && (
                                        <button
                                            onClick={() => handleDelete(m)}
                                            style={{
                                                flexShrink: 0, border: '1px solid #fecaca', background: 'white',
                                                color: '#b42318', borderRadius: '6px', padding: '6px 8px',
                                                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                            }}
                                            title="Retirer de l'équipe"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTeam;
