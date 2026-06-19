import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    UserPlus, Trash2, Mail, Crown, Users as UsersIcon,
    Shield, Home, HelpCircle, KeyRound,
} from 'lucide-react';
import api from '../services/apiClient';
import i18n from '../i18n';
import ExplainerBox from '../components/ExplainerBox';
import PasswordModal from '../components/PasswordModal';
import {
    AdminPageHeader, AdminSection, AdminToast, useAdminToast,
    primaryBtnStyle, ghostBtnStyle, dangerBtnStyle, inputStyle, labelStyle,
} from '../components/adminUI';

// Sentinelle utilisée par le picker pour représenter « Site principal »
const MAIN_SITE = { id: null, name: 'Site principal', slug: null, __main: true };

// ── Bouton-toggle (permission) ────────────────────────────────
const Toggle = ({ value, onChange, label, hint, disabled }) => (
    <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        title={hint}
        aria-pressed={!!value}
        style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 11px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${value ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: value ? 'var(--color-primary)' : 'var(--color-surface)',
            color: value ? 'var(--color-accent)' : 'var(--color-text-subtle)',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
        }}
    >
        {label}
    </button>
);

const AdminTeam = () => {
    const { user, isSuperadmin, isOwner, homeSubsiteId } = useApp();
    const { toast, showToast } = useAdminToast();

    const [selected, setSelected] = useState(null);
    const [subsites, setSubsites] = useState([]);
    const [members,  setMembers]  = useState([]);
    const [loading,  setLoading]  = useState(true);

    const [newEmail,    setNewEmail]    = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [creating,    setCreating]    = useState(false);
    const [resetTarget, setResetTarget] = useState(null);

    const isMain = selected?.__main === true;

    // Chargement initial
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const all = await api.subsites.getAll();
                const list = Array.isArray(all) ? all : [];
                setSubsites(list);
                const mine = list.find(s => s.id === homeSubsiteId);
                if (mine) setSelected(mine);
                else if (isSuperadmin) setSelected(MAIN_SITE);
            } catch (e) {
                showToast('error', e.message || i18n.t('errors.loading'));
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [homeSubsiteId, isSuperadmin]);

    // Chargement des membres
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
            showToast('error', i18n.t('toasts.emailPasswordRequired'));
            return;
        }
        setCreating(true);
        try {
            let created;
            if (isMain) {
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
            showToast('success', `Compte « ${created.email} » créé`);
        } catch (err) {
            showToast('error', err.message || i18n.t('errors.creating'));
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
            showToast('error', err.message || i18n.t('errors.updating'));
        }
    };

    const handleDelete = async (m) => {
        if (!confirm(`Retirer ${m.email} ? Le compte sera supprimé.`)) return;
        try {
            if (isMain) await api.users.delete(m.id);
            else        await api.team.delete(selected.slug, m.id);
            setMembers(prev => prev.filter(x => x.id !== m.id));
            showToast('success', i18n.t('toasts.accountDeleted'));
        } catch (err) {
            showToast('error', err.message || i18n.t('errors.deleting'));
        }
    };

    // Réinitialisation du mot de passe d'un membre (sans connaître l'actuel —
    // prérogative d'administration). La modale gère l'affichage des erreurs.
    const handleResetPassword = async ({ newPassword }) => {
        const m = resetTarget;
        if (isMain) await api.users.setPassword(m.id, newPassword);
        else        await api.team.setPassword(selected.slug, m.id, newPassword);
        showToast('success', `Mot de passe réinitialisé pour ${m.email}`);
    };

    if (!isSuperadmin && !isOwner) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-subtle)' }}>
                <Shield size={32} style={{ marginBottom: '12px', color: 'var(--color-border-strong)' }} />
                <p>Accès réservé aux owners de sous-sites et aux superadmins.</p>
            </div>
        );
    }

    const pickerOptions = isSuperadmin
        ? [MAIN_SITE, ...subsites]
        : subsites.filter(s => s.id === homeSubsiteId);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 80px' }}>
            <AdminToast toast={toast} />

            <AdminPageHeader icon={UsersIcon} title="Gestion d'équipe (comptes)" />

            <ExplainerBox title="À quoi sert cette page ?">
                Gérer les comptes utilisateurs <strong>d'un sous-site précis</strong> (ou du site principal si
                vous êtes superadmin). Chaque compte créé ici est automatiquement rattaché au contexte choisi
                dans le sélecteur ci-dessous.<br />
                Les <em>owners</em> de sous-site peuvent inviter et gérer les membres de leur propre équipe.
                Les <em>superadmins</em> peuvent en plus basculer entre le site principal et n'importe quel
                sous-site, et déléguer la permission <strong>Gérer équipe</strong>.
            </ExplainerBox>

            {/* Sélecteur (chips) */}
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
                                    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '7px 14px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px',
                                    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
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
                    background: 'var(--color-surface-2)',
                    borderLeft: '3px solid var(--color-accent)',
                    borderRadius: 0,
                    padding: '10px 16px',
                    fontSize: '0.85rem', color: 'var(--color-text-muted)',
                    margin: '0 0 20px',
                }}>
                    {isMain
                        ? <>Équipe du <strong>site principal</strong> ({members.length} membre{members.length > 1 ? 's' : ''})</>
                        : <>Équipe du sous-site <strong>{selected.name}</strong> ({members.length} membre{members.length > 1 ? 's' : ''})</>}
                </p>
            )}

            {/* Formulaire d'invitation */}
            {canManageCurrent && (
                <AdminSection>
                    <p style={{ margin: '0 0 14px', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                        Inviter un membre
                    </p>
                    <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 220px' }}>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="email@exemple.org"
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: '1 1 180px' }}>
                            <label style={labelStyle}>Mot de passe (8+ car.)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                ...primaryBtnStyle,
                                opacity: creating ? 0.5 : 1,
                                cursor: creating ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <UserPlus size={14} /> {creating ? 'Envoi…' : 'Inviter'}
                        </button>
                    </form>
                    <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>
                        Le compte est créé avec un mot de passe temporaire. Le nouveau membre peut se connecter immédiatement ;
                        pensez à lui demander de le changer. Par défaut, il peut seulement <strong>créer des cartels</strong>.
                        Ajoutez d'autres permissions ci-dessous.
                    </p>
                </AdminSection>
            )}

            {/* Légende des permissions */}
            {canManageCurrent && (
                <ExplainerBox icon={HelpCircle} title="Permissions disponibles">
                    <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.7' }}>
                        <li><strong>Créer cartels</strong> — le membre peut créer de nouveaux cartels (en brouillon par défaut).</li>
                        <li><strong>Publier</strong> — le membre peut faire passer un cartel en statut <em>publié</em> (sinon ils restent en brouillon ou en attente).</li>
                        <li><strong>Exporter cartels</strong> — accès <em>lecture seule</em> au gestionnaire : voir les cartels publiés, les sélectionner et les exporter / traduire (PDF, images, archive). Aucune autre action (ni édition, ni publication, ni modération).</li>
                        <li><strong>Gérer équipe</strong> — <em>owner</em> : le membre peut inviter, modifier et supprimer d'autres comptes dans le contexte courant.</li>
                        {isSuperadmin && (
                            <li><strong>Créer sous-sites</strong> — superadmin uniquement : le membre peut créer de nouveaux sous-sites.</li>
                        )}
                    </ul>
                </ExplainerBox>
            )}

            {/* Liste des membres */}
            <AdminSection>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0' }}>Chargement…</p>
                ) : members.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-subtle)', padding: '40px 0', fontSize: '0.9rem' }}>
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
                                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                    padding: '10px 14px', background: 'var(--color-surface-2)',
                                    flexWrap: 'wrap',
                                }}>
                                    <Mail size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {m.email}
                                            {isSelf && <span style={{ color: 'var(--color-text-subtle)', fontWeight: '400', marginLeft: '6px' }}>(vous)</span>}
                                        </div>
                                        {isSuper && (
                                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700' }}>
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
                                            label="Exporter cartels"
                                            hint="Accès lecture seule au gestionnaire : voir les cartels publiés et les exporter / traduire (PDF, images, archive). Aucune autre action."
                                            value={!!m.can_export_cartel}
                                            onChange={() => handleTogglePerm(m, 'can_export_cartel')}
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

                                    {canManageCurrent && !readOnly && (
                                        <button
                                            onClick={() => setResetTarget(m)}
                                            style={{ ...ghostBtnStyle, padding: '5px 10px' }}
                                            title="Réinitialiser le mot de passe"
                                        >
                                            <KeyRound size={13} />
                                        </button>
                                    )}
                                    {canManageCurrent && !isSelf && !readOnly && (
                                        <button
                                            onClick={() => handleDelete(m)}
                                            style={{ ...dangerBtnStyle, padding: '5px 10px' }}
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
            </AdminSection>

            {resetTarget && (
                <PasswordModal
                    mode="reset"
                    targetEmail={resetTarget.email}
                    onClose={() => setResetTarget(null)}
                    onSubmit={handleResetPassword}
                />
            )}
        </div>
    );
};

export default AdminTeam;
