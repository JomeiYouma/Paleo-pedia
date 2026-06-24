import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/apiClient';
import { useApp } from '../context/AppContext';
import { getHostSubsiteSlug, subsiteBasePath } from '../utils/subsiteHost';
import PartnerSelector from '../components/PartnerSelector';

// Page dédiée : gestion des partenaires d'un sous-site (recherche, rôle, ajout
// inline), en remplacement de la section dans l'éditeur de sous-site.
// Routée sur /site/:slug/admin/partners et /admin/partners (host dédié).
const SubsitePartnersAdmin = () => {
    const { t } = useTranslation();
    const { isAdmin } = useApp();
    const { slug: paramSlug } = useParams();
    const slug = paramSlug || getHostSubsiteSlug();
    const base = subsiteBasePath(slug);

    const [subsite, setSubsite] = useState(null);
    const [allPartners, setAllPartners] = useState([]);
    const [primaryIds, setPrimaryIds] = useState([]);
    const [regularIds, setRegularIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const [ss, ps] = await Promise.all([
                    api.subsites.getOne(slug),
                    api.partners.getAll(),
                ]);
                if (!alive) return;
                setSubsite(ss);
                setAllPartners(Array.isArray(ps) ? ps : []);
                setPrimaryIds((ss?.primary_partners ?? []).map(p => p.id));
                setRegularIds((ss?.partners ?? []).map(p => p.id));
            } catch (e) {
                if (alive) setError(e.message || 'Erreur de chargement.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [slug]);

    const setPartnerRole = (id, role) => {
        setPrimaryIds(prev => role === 'primary' ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
        setRegularIds(prev => role === 'regular' ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            await api.subsites.update(slug, { primary_partner_ids: primaryIds, partner_ids: regularIds });
            setSaved(true);
        } catch (e) {
            setError(e.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) {
        return <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>{t('subsitePartners.denied', "Accès réservé à l'administration.")}</div>;
    }
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>{t('common.loading', 'Chargement…')}</div>;
    }
    if (!subsite) {
        return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#c0392b' }}>{error || t('subsitePartners.notFound', 'Sous-site introuvable.')}</div>;
    }

    const color = subsite.primary_color || '#4A90D9';

    return (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px 80px' }}>
            {/* Fil d'Ariane */}
            <nav aria-label="Fil d'Ariane" style={{ fontSize: '0.82rem', color: '#999', marginBottom: '14px' }}>
                <Link to={`${base}/admin`} style={{ color: '#777', textDecoration: 'none' }}>{subsite.name} — {t('subsitePartners.adminCrumb', 'Admin')}</Link>
                <span style={{ margin: '0 6px' }}>/</span>
                <span style={{ color: '#444', fontWeight: 600 }}>{t('subsitePartners.title', 'Partenaires')}</span>
            </nav>

            <h1 style={{ margin: '0 0 6px', fontSize: '1.4rem' }}>{t('subsitePartners.heading', 'Partenaires du sous-site')}</h1>
            <p style={{ margin: '0 0 18px', color: '#888', fontSize: '0.9rem' }}>
                {t('subsiteEditor.partnersIntro2', "Choisissez le rôle de chaque partenaire (Principal = mis en avant, Standard, ou — pour ne pas l'afficher). Vous pouvez aussi en ajouter un.")}
            </p>

            <PartnerSelector
                allPartners={allPartners}
                onPartnersChanged={setAllPartners}
                primaryIds={primaryIds}
                regularIds={regularIds}
                onSetRole={setPartnerRole}
                subsiteId={subsite.id}
                color={color}
            />

            {error && <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.87rem', marginTop: '16px' }}>{error}</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                {saved && <span style={{ color: '#27ae60', fontSize: '0.85rem' }}>{t('subsitePartners.saved', 'Enregistré ✓')}</span>}
                <button onClick={handleSave} disabled={saving} style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: saving ? '#ccc' : color, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
                    {saving ? t('subsitePartners.saving', 'Enregistrement…') : t('subsitePartners.save', 'Enregistrer')}
                </button>
            </div>
        </div>
    );
};

export default SubsitePartnersAdmin;
