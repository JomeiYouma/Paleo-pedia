import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import { githubService } from '../services/github';
import { localService } from '../services/local';
import { phpService } from '../services/phpService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // ... (state vars same as before)
    const [cartels, setCartels] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({ token: '', owner: '', repo: '', openaiKey: '' });
    const [isConfigured, setIsConfigured] = useState(false);
    const [isLocalMode, setIsLocalMode] = useState(true); // Default to local
    const [isAdmin, setIsAdmin] = useState(false); // Admin state

    // Default categories
    const DEFAULT_CATEGORIES = [];
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    // Workshop Context Logic
    const [currentWorkshopId, setCurrentWorkshopId] = useState(null);
    const currentWorkshop = (currentWorkshopId && Array.isArray(workshops)) ? workshops.find(w => String(w.id) === String(currentWorkshopId)) : null;

    const location = useLocation();
    const navigate = useNavigate();

    // Load config... (keep existing useEffect)
    useEffect(() => {
        // ... (this useEffect body is same as original lines 28-58)
        const savedConfig = localStorage.getItem('paleo_config');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            setConfig(parsed);
            if (parsed.token && parsed.owner && parsed.repo) {
                githubService.initialize(parsed.token, parsed.owner, parsed.repo);
                setIsConfigured(true);
                setIsLocalMode(false);
            }
        }
        const sessionAdmin = sessionStorage.getItem('paleo_admin');
        if (sessionAdmin === 'true') setIsAdmin(true);
        const savedCats = localStorage.getItem('paleo_categories');
        if (savedCats) {
            try {
                const parsedCats = JSON.parse(savedCats);
                const uniqueCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsedCats]));
                setCategories(uniqueCats);
            } catch (e) { console.error(e); }
        }
        fetchData();
    }, [isAdmin]);


    // Reliable Workshop Detection via React Router
    useEffect(() => {
        const matchApp = matchPath({ path: "/app/workshop/:id" }, location.pathname);
        const matchRoot = matchPath({ path: "/workshop/:id" }, location.pathname);
        const match = matchApp || matchRoot;

        if (match && match.params.id) {
            console.log("DEBUG: Set Workshop ID:", match.params.id);
            setCurrentWorkshopId(match.params.id);
            sessionStorage.setItem('paleo_workshop_id', match.params.id);
        }
        // REMOVED ELSE: Do not auto-clear. Sticky session.
    }, [location]);



    // We also need to expose a way to set it from Router components
    const setWorkshopContext = (id) => setCurrentWorkshopId(id);


    // ... (login/logout unchanged)
    const login = async (password) => {
        const service = getActiveService();
        let isValid = false;
        if (service.login) {
            try {
                isValid = await service.login(password);
            } catch (e) {
                console.error("Login check failed", e);
                isValid = false;
            }
        } else {
            isValid = (password === 'admin');
        }

        if (isValid) {
            setIsAdmin(true);
            sessionStorage.setItem('paleo_admin', 'true');
            sessionStorage.setItem('paleo_token', password);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        sessionStorage.removeItem('paleo_admin');
        sessionStorage.removeItem('paleo_token');
    };

    const getActiveService = () => {
        if (isConfigured) return githubService;
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isDev ? localService : phpService;
    };

    const addLocalCategory = (newCat) => {
        if (!newCat || categories.includes(newCat)) return;
        const updatedCats = [...categories, newCat];
        setCategories(updatedCats);
        localStorage.setItem('paleo_categories', JSON.stringify(updatedCats));
    };

    const saveConfig = async (newConfig) => {
        // Local Save
        localStorage.setItem('paleo_config', JSON.stringify(newConfig));
        setConfig(newConfig);

        // Server Save (Share keys)
        if (isAdmin) {
            const service = getActiveService();
            try {
                // Save a subset of config or full?
                // We want to share openaiKey.
                await service.saveJson('db_config.json', newConfig, "Update shared config");
            } catch (e) {
                console.error("Failed to share config to server", e);
                alert("Attention: La configuration n'a pas pu être partagée avec les autres utilisateurs. Vérifiez votre connexion.");
            }
        }

        if (newConfig.token && newConfig.owner && newConfig.repo) {
            githubService.initialize(newConfig.token, newConfig.owner, newConfig.repo);
            setIsConfigured(true);
            setIsLocalMode(false);
        } else {
            setIsConfigured(false);
            setIsLocalMode(true);
        }
        setTimeout(fetchData, 100);
    };

    const fetchData = async () => {
        setLoading(true);
        const service = getActiveService();
        try {
            const cartelsData = await service.getFileContent('db_cartels.json');
            const draftsData = await service.getFileContent('db_drafts.json');

            // NEW: Fetch Workshops
            // If service doesn't support 'db_workshops.json' (legacy github?), it might fail or return empty.
            // Our phpService supports it now.
            let workshopsData = [];
            try {
                workshopsData = await service.getFileContent('db_workshops.json');
            } catch (e) {
                console.warn("Could not load workshops", e);
            }

            // NEW: Load Shared Config (API Keys)
            try {
                const serverConfig = await service.getFileContent('db_config.json');
                if (serverConfig && typeof serverConfig === 'object') {
                    // Merge with local config
                    setConfig(prev => ({
                        ...prev,
                        ...serverConfig,
                        // Ensure keys are populated
                        openaiKey: serverConfig.openaiKey || prev.openaiKey
                    }));
                    // Also update localStorage to keep in sync
                    localStorage.setItem('paleo_config', JSON.stringify({ ...config, ...serverConfig }));
                }
            } catch (e) {
                console.error("Failed to load config:", e);
                if (isAdmin) {
                    // Only alert if we expected to load it
                    console.warn("Admin logged in but config failed to load.");
                }
            }

            // Post-process data to resolve local images if needed
            const processImages = async (list) => {
                if (!Array.isArray(list)) return [];
                const promises = list.map(async (item) => {
                    if (!isConfigured && item.image_path) {
                        const localImg = await localService.getImageContent(item.image_path);
                        if (localImg) {
                            return { ...item, imageUrl: localImg };
                        }
                    }
                    return item;
                });
                return Promise.all(promises);
            };

            setCartels(Array.isArray(cartelsData) ? await processImages(cartelsData) : []);
            setDrafts(Array.isArray(draftsData) ? await processImages(draftsData) : []);
            // Self-Healing: Ensure Workshop Cartel Lists are complete
            if (Array.isArray(workshopsData) && Array.isArray(cartelsData)) {
                let workshopChanged = false;
                workshopsData = workshopsData.map(w => {
                    // Find cartels that belong to this workshop (by name)
                    const belongingCartels = cartelsData.filter(c => c.origin === w.name);
                    let currentIds = w.cartelIds || [];
                    // Normalize to strings for comparison
                    const currentIdsStr = currentIds.map(String);

                    const missingIds = belongingCartels
                        .map(c => String(c.id))
                        .filter(id => !currentIdsStr.includes(id));

                    if (missingIds.length > 0) {
                        workshopChanged = true;
                        return { ...w, cartelIds: [...currentIds, ...missingIds] };
                    }
                    return w;
                });

                if (workshopChanged) {
                    console.log("Auto-repair: Linked orphaned cartels to workshops.");
                    // We save this fix to the server to make it permanent
                    // Do not await to avoid blocking render, but ensure it saves
                    service.saveJson('db_workshops.json', workshopsData, "Auto-repair workshop links").catch(console.error);
                }
            }

            setWorkshops(Array.isArray(workshopsData) ? workshopsData : []);

            refreshCategories(cartelsData, draftsData);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshCategories = (currentCartels, currentDrafts) => {
        const usedCats = new Set([...DEFAULT_CATEGORIES]);
        if (Array.isArray(currentCartels)) {
            currentCartels.forEach(c => {
                if (Array.isArray(c.categories)) c.categories.forEach(cat => usedCats.add(cat));
            });
        }
        if (Array.isArray(currentDrafts)) {
            currentDrafts.forEach(d => {
                if (Array.isArray(d.categories)) d.categories.forEach(cat => usedCats.add(cat));
            });
        }
        const uniqueCats = Array.from(usedCats);
        setCategories(uniqueCats);
        localStorage.setItem('paleo_categories', JSON.stringify(uniqueCats));
    };

    const addCartel = async (entry, isDraft = false) => {
        setLoading(true);
        const service = getActiveService();
        try {
            if (isDraft) {
                const newDrafts = [...drafts, entry];
                await service.saveJson('db_drafts.json', newDrafts, `Add draft: ${entry.titre}`);
                await fetchData();
            } else {
                const newCartels = [...cartels, entry];
                await service.saveJson('db_cartels.json', newCartels, `Add cartel: ${entry.titre}`);

                // If in Workshop mode, we must update the workshop too!
                // But wait, the entry should already have 'origin' set by the caller (Create.jsx).
                // However, we need to add the ID to the workshop's 'cartelIds' list.
                if (currentWorkshopId) {
                    await linkCartelToWorkshop(entry.id, currentWorkshopId);
                }

                await fetchData();
            }
            return true;
        } catch (e) {
            console.error(e);
            alert("Erreur sauvegarde: " + e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // NEW: Add Workshop
    const addWorkshop = async (name, selectedIds = [], options = {}) => {
        setLoading(true);
        const service = getActiveService();
        try {
            const newWorkshop = {
                id: Date.now().toString(), // Simple ID
                name: name,
                cartelIds: selectedIds, // Initial selection
                createdAt: new Date().toISOString(),
                ...options // Spread options like { immersive: true }
            };

            const newWorkshops = [...workshops, newWorkshop];
            await service.saveJson('db_workshops.json', newWorkshops, `Create workshop: ${name}`);
            setWorkshops(newWorkshops); // Optimistic update
            return newWorkshop.id;
        } catch (e) {
            console.error(e);
            alert("Erreur création atelier: " + e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteWorkshop = async (id) => {
        setLoading(true);
        const service = getActiveService();
        try {
            const newWorkshops = workshops.filter(w => String(w.id) !== String(id));
            await service.saveJson('db_workshops.json', newWorkshops, `Delete workshop: ${id}`);
            setWorkshops(newWorkshops);
            if (currentWorkshopId === id) {
                setCurrentWorkshopId(null);
                window.location.hash = '#/'; // Redirect home
            }
            return true;
        } catch (e) {
            console.error(e);
            alert("Erreur suppression atelier: " + e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Helper to link
    const linkCartelToWorkshop = async (cartelId, workshopId) => {
        const service = getActiveService();
        const workshop = workshops.find(w => String(w.id) === String(workshopId));
        if (!workshop) return;

        // Check if already linked
        if (workshop.cartelIds && workshop.cartelIds.includes(cartelId)) return;

        const updatedWorkshop = {
            ...workshop,
            cartelIds: [...(workshop.cartelIds || []), cartelId]
        };

        const newWorkshops = workshops.map(w => String(w.id) === String(workshopId) ? updatedWorkshop : w);
        // We don't await this strictly to block UI, but good to wait
        await service.saveJson('db_workshops.json', newWorkshops, `Link cartel ${cartelId} to workshop ${workshopId}`);
        // No full refetch needed if we assume success, but safer to refetch eventually
    };

    const updateCartel = async (entry, isDraft = false) => {
        setLoading(true);
        const service = getActiveService();
        try {
            const cleanEntry = { ...entry };
            delete cleanEntry.imageUrl;

            if (isDraft) {
                const newDrafts = drafts.map(d => String(d.id) === String(entry.id) ? cleanEntry : d);
                await service.saveJson('db_drafts.json', newDrafts, `Update draft: ${entry.titre}`);
                await fetchData();
            } else {
                const newCartels = cartels.map(c => String(c.id) === String(entry.id) ? cleanEntry : c);
                await service.saveJson('db_cartels.json', newCartels, `Update cartel: ${entry.titre}`);
                await fetchData();
            }
            return true;
        } catch (e) {
            console.error(e);
            alert("Erreur m-a-j: " + e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteCartel = async (id, isDraft = false) => {
        return deleteCartels([id], isDraft);
    };

    const deleteCartels = async (ids, isDraft = false) => {
        if (!Array.isArray(ids) || ids.length === 0) return;

        setLoading(true);
        const service = getActiveService();
        try {
            const targetIds = ids.map(String);

            if (isDraft) {
                const newDrafts = drafts.filter(d => !targetIds.includes(String(d.id)));
                await service.saveJson('db_drafts.json', newDrafts, `Delete ${ids.length} drafts`);
                setDrafts(newDrafts);
            } else {
                const newCartels = cartels.filter(c => !targetIds.includes(String(c.id)));
                await service.saveJson('db_cartels.json', newCartels, `Delete ${ids.length} cartels`);
                setCartels(newCartels);
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file, path) => {
        const service = getActiveService();
        return service.uploadImage(file, path);
    };

    const quitWorkshop = () => {
        setCurrentWorkshopId(null);
        sessionStorage.removeItem('paleo_workshop_id');
        navigate('/'); // Use React Router navigation
    };



    return (
        <AppContext.Provider value={{
            cartels, drafts, workshops, loading, isConfigured, isLocalMode, config, categories, isAdmin,
            currentWorkshopId, currentWorkshop, setWorkshopContext,
            saveConfig, fetchData, addCartel, updateCartel, deleteCartel, deleteCartels, uploadImage, addLocalCategory,
            login, logout, addWorkshop, deleteWorkshop, quitWorkshop
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
