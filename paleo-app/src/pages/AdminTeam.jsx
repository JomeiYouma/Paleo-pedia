import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus, Trash2, ArrowLeft, Mail, Crown, Users as UsersIcon,
    CheckCircle2, AlertCircle, Shield, Info, Home,
} from 'lucide-react';
import api from '../services/apiClient';

const ACCENT = '#6741d9';       // violet cohérent avec le lien d'AdminSettings
const ACCENT_BG = '#f3efff';
const ACCENT_BORDER = '#d9ccff';

// Sentinelle utilisée par le picker pour représenter « Site principal » (pas de sous-site)
const MAIN_SITE = { id: null, name: 'Site principal', slug: null, __main: true };

const Toggle = ({ value, onChange, label, hint, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        title={hint}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 11px', borderRadius: '16px',
            border: `1px solid ${value ? ACCENT : '#e0e0e0'}`,
            background: value ? ACCENT : '#f5f5f5',
            color: value ? 'white' : '#888',
            fontSize: '0.76rem', fontWeight: '700',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
        }}
    >
        {label}
    </button>
);

const AdminTeam = () => {
    const { user, isSuperadmin, isOwner, homeSubsiteId } = useApp();
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null); // sous-site courant ou MAIN_SITE
    const [subsites, setSubsites] = useState([]);
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

    const isMain = selected?.__main === true;

    // Chargement initial : liste des sous-sites + détermine la sélection par défaut
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const all = await api.subsites.getAll();
                const list = Array.isArray(all) ? all : [];
                setSubsites(list);
                // Owner : on pointe sur son propre sous-site
                const mine = list.find(s => s.id === homeSubsiteId);
                if (mine) setSelected(mine);
                // Superadmin sans sous-site d'attache : on pointe sur le site principal par défaut
                else if (isSuperadmin) setSelected(MAIN_SITE);
            } catch (e) {
                showToast('error', e.message || 'Erreur chargement');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [homeSubsiteId, isSuperadmin]);

    // Chargement des membres quand la sélection change
    useEffect(() => {
        if (!selected) return;
        setLoading(true);
        const fetcher = isMain
            ? api.users.getAll().then(d => (Array.isArray(d) ? d : []).filter(u => !u.home_subsite_id))
            : api.team.list(selected.slug);
        fetcher
            .then(d => setMembers(Array.isArray(d) ? d : []))
            .catch(e => showToast('error', e.message))
            .finally(() => setLoading(false));
    }, [selected, isMain]);

    const canManageCurrent = useMemo(() => {
        if (!selected) return false;
        if (isSuperadmin) return true;
        return isOwner && selected.id === homeSubsiteId;
    }, [selected, isSuperadmin, isOwner, homeSubsiteId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newEmail.trim() || !newPassword || newPassword.length < 8) {
            showToast('error', 'Email et mot de passe (8 caractères min.) requis');
            return;
        }
        setCreating(true);
        try {
            let created;
            if (isMain) {
                // Superadmin crée un compte rattaché au site principal (home_subsite_id = null)
                created = await api.users.create({
                    email: newEmail.trim(),
                    password: newPassword,
                    role: 'contributor',
                    can_create_cartel: true,
                    home_subsite_id: null,
                });
            } else {
                created = await api.team.create(selected.slug, {
                    email: newEmail.trim(),
                    password: newPassword,
                });
            }
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
            const payload = { [key]: !m[key] };
            const updated = isMain
                ? await api.users.update(m.id, payload)
                : await api.team.update(selected.slug, m.id, payload);
            setMembers(prev => prev.map(x => x.id === m.id ? updated : x));
        } catch (err) {
            showToast('error', err.message || 'Erreur modification');
        }
    };

    const handleDelete = async (m) => {
        if (!confirm(`Retirer ${m.email} ? Le compte sera supprimé.`)) return;
        try {
            if (isMain) await api.users.delete(m.id);
            else        await api.team.delete(selected.slug, m.id);
            setMembers(prev => prev.filter(x => x.id !== m.id));
            showToast('success', 'Compte supprimé');
        } catch (err) {
            showToast('error', err.message || 'Erreur suppression');
        }
    };

    if (!isSuperadmin && !isOwner) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
                <Shield size={32} style={{ marginBottom: '12px', color: '#ccc' }} />
                <p>Accès réservé aux owners de sous-sites et aux superadmins.</p>
            </div>
        );
    }

    // Options du picker (superadmin uniquement)
    const pickerOptions = isSuperadmin
        ? [MAIN_SITE, ...subsites]
        : subsites.filter(s => s.id === homeSubsiteId);

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
                    background: ACCENT_BG, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <UsersIcon size={20} color={ACCENT} />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1a1a1a' }}>
                    Gestion d'équipe
                </h1>
            </div>

            {/* Paragraphe explicatif */}
            <div style={{
                background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: '12px', padding: '16px 18px', marginBottom: '20px',
                color: '#3e2b72', fontSize: '0.88rem', lineHeight: '1.55',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong>À quoi sert cette page ?</strong><br />
                    Gérer les comptes utilisateurs <strong>d'un sous-site précis</strong> (ou du site principal si
                    vous êtes superadmin). Chaque compte créé ici est automatiquement rattaché au contexte choisi
                    dans le sélecteur ci-dessous.<br />
                    Les <em>owners</em> de sous-site peuvent inviter et gérer les membres de leur propre équipe.
                    Les <em>superadmins</em> peuvent en plus basculer entre le site principal et n'importe quel
                    sous-site, et déléguer la permission <strong>Owner</strong> (qui permet à son tour de gérer l'équipe du
                    sous-site).
                </div>
            </div>

            {/* Sélecteur (superadmin ou owner avec plusieurs options) */}
            {pickerOptions.length > 1 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {pickerOptions.map(opt => {
                        const active = opt.__main
                            ? isMain
                            : selected && !opt.__main && selected.id === opt.id;
                        const Icon = opt.__main ? Home : UsersIcon;
                        return (
                            <button
                                key={opt.id || 'main'}
                                onClick={() => setSelected(opt)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    border: `1px solid ${active ? ACCENT : '#e0e0e0'}`,
                                    background: active ? ACCENT : 'white',
                                    color: active ? 'white' : '#555',
                                    borderRadius: '20px', padding: '6px 12px',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    fontSize: '0.84rem', fontWeight: '600',
                                }}
                            >
                                <Icon size={13} />
                                {opt.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {selected && (
                <p style={{
                    background: '#fafafa', border: '1px solid #eee',
                    borderRadius: '8px', padding: '10px 14px',
                    fontSize: '0.85rem', color: '#555', margin: '0 0 20px',
                }}>
                    {isMain
                        ? <>Équipe du <strong>site principal</strong> ({members.length} membre{members.length > 1 ? 's' : ''})</>
                        : <>Équipe du sous-site <strong>{selected.name}</strong> ({members.length} membre{members.length > 1 ? 's' : ''})</>}
                </p>
            )}

            {/* Formulaire d'invitation */}
            {canManageCurrent && (
                <div style={{
                    background: 'white', border: '1px solid #eee', borderRadius: '14px',
                    padding: '18px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: ACCENT }}>
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
                                background: creating ? ACCENT_BORDER : ACCENT,
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
                        Le compte est créé avec un mot de passe temporaire. Le nouveau membre peut se connecter immédiatement ; pensez à lui demander de le changer.
                        Par défaut, il peut seulement <strong>créer des cartels</strong>. Ajoutez d'autres permissions ci-dessous.
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
                        Aucun membre dans ce contexte.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {members.map(m => {
                            const isSelf = m.id === user?.id;
                            const isSuper = !!m.can_manage_admin;
                            const readOnly = (isSuper && !isSuperadmin) || !canManageCurrent;

                            return (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    border: '1px solid #eee', borderRadius: '10px',
                                    padding: '10px 14px', background: '#fafafa',
                                    flexWrap: 'wrap',
                                }}>
                                    <Mail size={16} color={ACCENT} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.email}
                                            {isSelf && <span style={{ color: '#aaa', fontWeight: '400', marginLeft: '6px' }}>(vous)</span>}
                                        </div>
                                        {isSuper && (
                                            <div style={{ fontSize: '0.75rem', color: '#9c27b0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Crown size={11} /> Superadmin
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        <Toggle
                                            label="Créer cartels"
                                            hint="Peut créer de nouveaux cartels"
                                            value={!!m.can_create_cartel}
                                            onChange={() => handleTogglePerm(m, 'can_create_cartel')}
                                            disabled={readOnly}
                                        />
                                        <Toggle
                                            label="Publier"
                                            hint="Peut publier les cartels (sinon ils restent en brouillon / en attente)"
                                            value={!!m.can_publish_cartel}
                                            onChange={() => handleTogglePerm(m, 'can_publish_cartel')}
                                            disabled={readOnly}
                                        />
                                        <Toggle
                                            label="Gérer équipe"
                                            hint="Owner : peut inviter et gérer les autres membres du contexte courant"
                                            value={!!m.can_manage_team}
                                            onChange={() => handleTogglePerm(m, 'can_manage_team')}
                                            disabled={readOnly}
                                        />
                                        {isSuperadmin && (
                                            <Toggle
                                                label="Créer sous-sites"
                                                hint="Superadmin uniquement : peut créer de nouveaux sous-sites"
                                                value={!!m.can_create_subsite}
                                                onChange={() => handleTogglePerm(m, 'can_create_subsite')}
                                                disabled={readOnly}
                                            />
                                        )}
                                    </div>

                                    {canManageCurrent && !isSelf && !readOnly && (
                                        <button
                                            onClick={() => handleDelete(m)}
                                            style={{
                                                flexShrink: 0, border: '1px solid #fecaca', background: 'white',
                                                color: '#b42318', borderRadius: '6px', padding: '6px 8px',
                                                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                            }}
                                            title="Supprimer ce compte"
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
