import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Map, BookOpen, PenTool } from 'lucide-react';

const LandingPage = () => {
    return (
        <div>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)',
                padding: '80px 20px',
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <h1 style={{
                    fontSize: '4rem',
                    marginBottom: '20px',
                    color: 'var(--color-pink-darker, #C2185B)',
                    maxWidth: '800px',
                    lineHeight: '1.1'
                }}>
                    Une contre-histoire de l'énergie
                </h1>
                <p style={{
                    fontSize: '1.5rem',
                    color: '#555',
                    maxWidth: '600px',
                    margin: '0 auto 40px auto'
                }}>
                    Ressusciter les techniques disparues pour réinventer notre futur énergétique.
                </p>
                <Link to="/app" style={{
                    background: 'var(--color-pink-darker, #C2185B)',
                    color: 'white',
                    padding: '15px 40px',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 15px rgba(194, 24, 91, 0.4)',
                    transition: 'transform 0.2s'
                }}>
                    Explorer la Frise <ArrowRight size={20} />
                </Link>
            </section>

            {/* Quick Access Grid */}
            <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>Découvrir le projet</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    {/* Card 1: Présentation */}
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

                    {/* Card 2: Museum */}
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

                    {/* Card 3: Prestations */}
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
        </div>
    );
};

export default LandingPage;
