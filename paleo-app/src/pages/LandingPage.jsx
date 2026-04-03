import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Map, PenTool, Layers, X, ChevronRight } from 'lucide-react';
import { categories as categoriesApi } from '../services/apiClient';

const PINK = 'var(--color-pink-darker, #C2185B)';

const LandingPage = () => {
    const navigate = useNavigate();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [cats, setCats] = useState([]);
    const [loadingCats, setLoadingCats] = useState(false);

    // Charger les catégories à la demande
    const openCategoryModal = async () => {
        setShowCategoryModal(true);
        if (cats.length > 0) return;
        setLoadingCats(true);
        try {
            const data = await categoriesApi.getAll();
            setCats(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Impossible de charger les catégories', e);
        } finally {
            setLoadingCats(false);
        }
    };

    const handleCategoryClick = (cat) => {
        setShowCategoryModal(false);
        navigate(`/app?category=${encodeURIComponent(cat.name)}`);
    };

    // Fermer le modal sur Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setShowCategoryModal(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div>
            {/* ── Hero Section ─────────────────────────────────────── */}
            <section style={{
                background: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)',
                padding: '80px 20px',
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <h1 style={{
                    fontSize: '4rem',
                    marginBottom: '20px',
                    color: PINK,
                    maxWidth: '800px',
                    lineHeight: '1.1',
                }}>
                    Une contre-histoire de l'énergie
                </h1>
                <p style={{
                    fontSize: '1.5rem',
                    color: '#555',
                    maxWidth: '600px',
                    margin: '0 auto 48px auto',
                }}>
                    Ressusciter les techniques disparues pour réinventer notre futur énergétique.
                </p>

                {/* CTA buttons */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link
                        to="/app"
                        id="cta-explorer-frise"
                        style={{
                            background: PINK,
                            color: 'white',
                            padding: '15px 36px',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(194, 24, 91, 0.35)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Explorer la Frise <ArrowRight size={20} />
                    </Link>

                    <button
                        id="cta-explorer-thematique"
                        onClick={openCategoryModal}
                        style={{
                            background: 'white',
                            color: PINK,
                            padding: '15px 36px',
                            borderRadius: '50px',
                            border: `2px solid ${PINK}`,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(194, 24, 91, 0.12)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Layers size={20} /> Explorer une thématique
                    </button>
                </div>
            </section>

            {/* ── Quick Access Grid ────────────────────────────────── */}
            <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>Découvrir le projet</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    <div className="landing-card" style={{ padding: '30px', background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                        <div style={{ background: '#e3f2fd', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <BookOpen color="#1565c0" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>La Démarche</h3>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                            Comprendre notre mission d'exhumation des inventions oubliées et notre vision citoyenne.
                        </p>
                        <Link to="/presentation" style={{ color: '#1565c0', textDecoration: 'none', fontWeight: 'bold' }}>En savoir plus →</Link>
                    </div>

                    <div className="landing-card" style={{ padding: '30px', background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                        <div style={{ background: '#fff3e0', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Map color="#ef6c00" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Rétrofutur Museum</h3>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                            Visitez le premier musée des énergies alternatives où l'énergie est produite par les visiteurs.
                        </p>
                        <Link to="/museum" style={{ color: '#ef6c00', textDecoration: 'none', fontWeight: 'bold' }}>Découvrir →</Link>
                    </div>

                    <div className="landing-card" style={{ padding: '30px', background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                        <div style={{ background: '#e8f5e9', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <PenTool color="#2e7d32" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Nos Prestations</h3>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                            Challenges, ateliers, et conférences pour inspirer l'innovation dans votre organisation.
                        </p>
                        <Link to="/prestations" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 'bold' }}>Voir les offres →</Link>
                    </div>

                </div>
            </section>

            {/* ── Category Modal ───────────────────────────────────── */}
            {showCategoryModal && (
                <div
                    id="modal-thematiques"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowCategoryModal(false); }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 5000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '40px',
                        maxWidth: '560px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                        position: 'relative',
                    }}>
                        {/* Close */}
                        <button
                            onClick={() => setShowCategoryModal(false)}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: '#f5f5f5', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            title="Fermer"
                        >
                            <X size={18} color="#555" />
                        </button>

                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#1a1a1a' }}>Explorer une thématique</h2>
                        <p style={{ margin: '0 0 28px 0', color: '#777', fontSize: '0.95rem' }}>
                            Choisissez une catégorie pour voir uniquement les cartels associés.
                        </p>

                        {loadingCats && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Chargement…</div>
                        )}

                        {!loadingCats && cats.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Aucune thématique disponible pour le moment.</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cats.map(cat => (
                                <button
                                    key={cat.id}
                                    id={`cat-btn-${cat.id}`}
                                    onClick={() => handleCategoryClick(cat)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px 20px',
                                        borderRadius: '12px',
                                        border: '2px solid #f0f0f0',
                                        background: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = cat.color || PINK;
                                        e.currentTarget.style.background = '#fafafa';
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#f0f0f0';
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {/* Pastille couleur */}
                                        <div style={{
                                            width: '14px', height: '14px',
                                            borderRadius: '50%',
                                            background: cat.color || PINK,
                                            flexShrink: 0,
                                        }} />
                                        <span>Paléo {cat.name}</span>
                                    </div>
                                    <ChevronRight size={18} color="#ccc" />
                                </button>
                            ))}
                        </div>

                        {/* Lien vers tous les cartels sans filtre */}
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <Link
                                to="/app"
                                onClick={() => setShowCategoryModal(false)}
                                style={{ color: '#999', fontSize: '0.9rem', textDecoration: 'underline' }}
                            >
                                Voir tous les cartels sans filtre →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
