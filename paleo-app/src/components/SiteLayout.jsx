import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

const SiteLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const links = [
        { path: '/', label: 'Accueil' },
        { path: '/app', label: 'La Frise' }, // Direct link to app
        { path: '/presentation', label: 'Présentation' },
        { path: '/prestations', label: 'Prestations' },
        { path: '/ouvrages', label: 'Ouvrages' },
        { path: '/museum', label: 'Museum' },
        { path: '/contact', label: 'Contact' },
    ];

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                background: 'white',
                padding: '20px 40px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Burger Menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                background: 'white', border: '1px solid #eee', borderRadius: '8px',
                                padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                            title="Menu"
                        >
                            {isMenuOpen ? <X size={24} color="#333" /> : <Menu size={24} color="#333" />}
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '120%', left: 0, zIndex: 2000,
                                background: 'white', border: '1px solid #eee', borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '220px',
                                display: 'flex', flexDirection: 'column', padding: '5px 0',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                {links.map(link => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="site-menu-item"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/" style={{ textDecoration: 'none', color: 'black', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--color-pink-darker, #C2185B)', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Paléo-Énergétique</span>
                    </Link>
                </div>
            </header>

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <footer style={{ background: '#f8f9fa', padding: '40px', marginTop: 'auto', borderTop: '1px solid #eee' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0' }}>Paléo-Énergétique</h3>
                        <p style={{ color: '#666', maxWidth: '300px' }}>Une contre-histoire de l'énergie pour inspirer le futur.</p>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0' }}>Liens</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <Link to="/app" style={{ color: '#666', textDecoration: 'none' }}>La Frise Chronologique</Link>
                            <Link to="/contact" style={{ color: '#666', textDecoration: 'none' }}>Nous contacter</Link>
                        </div>
                    </div>
                    <div>
                        <p style={{ color: '#999', fontSize: '0.9rem' }}>© {new Date().getFullYear()} Atelier 21</p>
                    </div>
                </div>
            </footer>

            <style>{`
                .site-menu-item {
                    display: block;
                    padding: 12px 20px;
                    text-decoration: none;
                    color: #333;
                    font-size: 1rem;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }
                .site-menu-item:hover {
                    background-color: #f9f9f9;
                    color: var(--color-pink-darker, #C2185B);
                    border-left-color: var(--color-pink-darker, #C2185B);
                    padding-left: 25px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SiteLayout;
