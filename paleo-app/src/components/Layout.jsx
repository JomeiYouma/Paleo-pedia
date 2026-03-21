import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navigation from './Navigation';
import { useApp } from '../context/AppContext';
import { Settings, Lock, Unlock, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { isConfigured, config, saveConfig, cartels, updateCartel, isAdmin, login, logout, currentWorkshop, quitWorkshop } = useApp();
    const [showConfig, setShowConfig] = useState(false);
    const [showSiteMenu, setShowSiteMenu] = useState(false);
    const [tokenInput, setTokenInput] = useState(config.token || '');
    const [ownerInput, setOwnerInput] = useState(config.owner || '');
    const [repoInput, setRepoInput] = useState(config.repo || '');
    const [openaiKeyInput, setOpenaiKeyInput] = useState(config.openaiKey || '');

    const { t } = useTranslation();

    const handleAdminToggle = async () => {
        if (isAdmin) {
            logout();
            setShowConfig(false); // Close config if open
        } else {
            const pwd = window.prompt("Password (Admin):");
            if (pwd) {
                const success = await login(pwd);
                if (!success) alert("Wrong password!");
            }
        }
    };

    const handleSaveConfig = (e) => {
        e.preventDefault();
        saveConfig({
            token: tokenInput,
            owner: ownerInput,
            repo: repoInput,
            openaiKey: openaiKeyInput
        });
        setShowConfig(false);
    };

    // ... (handleAdminToggle, handleSaveConfig)

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
            {/* Workshop Banner */}
            {currentWorkshop && !currentWorkshop.immersive && (
                <div style={{ background: '#e0f7fa', color: '#006064', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    Mode Atelier : {currentWorkshop.name}
                    <button onClick={quitWorkshop} style={{ marginLeft: '20px', fontSize: '0.8em', color: '#006064', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}> Quitter</button>
                </div>
            )}

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
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowSiteMenu(!showSiteMenu)}
                            style={{
                                background: 'white', border: '1px solid #eee', borderRadius: '8px',
                                padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                            title="Menu du Site"
                        >
                            {showSiteMenu ? <X size={24} color="#333" /> : <Menu size={24} color="#333" />}
                        </button>
                        {showSiteMenu && (
                            <div style={{
                                position: 'absolute', top: '120%', left: 0, zIndex: 2000,
                                background: 'white', border: '1px solid #eee', borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '220px',
                                display: 'flex', flexDirection: 'column', padding: '5px 0',
                                animation: 'fadeIn 0.2s ease-out'
                            }}>
                                <Link to="/" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Accueil</Link>
                                <Link to="/presentation" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Présentation</Link>
                                <Link to="/prestations" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Prestations</Link>
                                <Link to="/ouvrages" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Ouvrages</Link>
                                <Link to="/museum" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Museum</Link>
                                <Link to="/contact" className="site-menu-item" onClick={() => setShowSiteMenu(false)}>Contact</Link>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: 0, fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                            {currentWorkshop ? currentWorkshop.name : 'Paléo-Énergétique'}
                        </h1>
                    </div>
                </div>

                <Navigation />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LanguageSwitcher />

                    {!currentWorkshop && (
                        <button onClick={handleAdminToggle} style={{ background: 'none', border: 'none' }} title={isAdmin ? "Logout" : "Admin Login"}>
                            {isAdmin ? <Unlock size={24} color="black" /> : <Lock size={24} color="#ccc" />}
                        </button>
                    )}

                    {isAdmin && !currentWorkshop && (
                        <button onClick={() => setShowConfig(!showConfig)} style={{ background: 'none', border: 'none' }}>
                            <Settings size={24} color={isConfigured ? 'green' : 'black'} />
                        </button>
                    )}
                </div>
            </header>

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

            <div className="container" style={{ flex: 1, paddingBottom: '50px', paddingTop: '20px' }}>
                {showConfig && (
                    <div className="card" style={{ marginBottom: '20px', border: '2px solid var(--color-red-accent)' }}>
                        <h3>{t('setup.configTitle')}</h3>
                        <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* ... inputs ... */}
                            <div>
                                <label>{t('setup.tokenLabel')}</label>
                                <input
                                    type="password"
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div>
                                <label>{t('setup.openaiLabel')}</label>
                                <input
                                    type="password"
                                    value={openaiKeyInput}
                                    onChange={(e) => setOpenaiKeyInput(e.target.value)}
                                    placeholder="sk-... (OpenAI) or ...:fx (DeepL)"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>{t('setup.ownerLabel')}</label>
                                    <input
                                        type="text"
                                        value={ownerInput}
                                        onChange={(e) => setOwnerInput(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>{t('setup.repoLabel')}</label>
                                    <input
                                        type="text"
                                        value={repoInput}
                                        onChange={(e) => setRepoInput(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: 'black',
                                    color: 'white',
                                    padding: '10px',
                                    border: 'none',
                                    marginTop: '10px'
                                }}
                            >
                                {t('setup.saveBtn')}
                            </button>
                            <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("Voulez-vous vraiment réinitialiser les catégories personnalisées ?")) {
                                            localStorage.removeItem('paleo_categories');
                                            window.location.reload();
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        color: 'orange',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        fontSize: '0.8rem',
                                        flex: 1
                                    }}
                                >
                                    ⚠️ Réinitialiser liste catégories
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!window.confirm("Corriger les doublons anglais (ex: 'Wind Power' -> 'Eolien') dans les cartels existants ?")) return;

                                        const mapping = {
                                            "Wind Power": "Eolien",
                                            "Solar Power": "Solaire",
                                            "Water": "H2O",
                                            "Mobility": "Mobilité",
                                            "Food": "Alimentation",
                                            "Energy": "Énergie"
                                        };

                                        let count = 0;
                                        for (const c of cartels) {
                                            let changed = false;
                                            let newCats = [...(c.categories || [])];
                                            let newCatsEn = [...(c.categories_en || [])];

                                            // Check FR categories for EN intruders
                                            for (const [en, fr] of Object.entries(mapping)) {
                                                if (newCats.includes(en)) {
                                                    // Remove EN term from FR list
                                                    newCats = newCats.filter(x => x !== en);
                                                    // Add FR term if not present
                                                    if (!newCats.includes(fr)) newCats.push(fr);

                                                    // Ensure EN list has the EN term
                                                    if (!newCatsEn.includes(en)) newCatsEn.push(en);

                                                    changed = true;
                                                }
                                            }

                                            if (changed) {
                                                await updateCartel({ ...c, categories: newCats, categories_en: newCatsEn });
                                                count++;
                                            }
                                        }
                                        alert(`Migration terminée : ${count} cartels corrigés.`);
                                        window.location.reload();
                                    }}
                                    style={{
                                        backgroundColor: '#f0f0f0',
                                        color: 'red',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        fontSize: '0.8rem',
                                        flex: 1
                                    }}
                                    id="migration-btn"
                                >
                                    🛠️ Corriger Données (Migration)
                                </button>
                            </div>
                        </form>
                    </div>
                )}


                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
