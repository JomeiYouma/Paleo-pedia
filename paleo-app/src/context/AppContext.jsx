import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import api from '../services/apiClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [cartels, setCartels] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({ token: '', owner: '', repo: '', openaiKey: '' });
    const [isConfigured, setIsConfigured] = useState(true);
    const [isLocalMode, setIsLocalMode] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const DEFAULT_CATEGORIES = [];
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    const [currentWorkshopId, setCurrentWorkshopId] = useState(null);
    const currentWorkshop = (currentWorkshopId && Array.isArray(workshops)) ? workshops.find(w => String(w.id) === String(currentWorkshopId)) : null;

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await api.auth.me();
                if (user) setIsAdmin(true);
            } catch (e) {
                setIsAdmin(false);
            }
        };
        checkAuth();
        fetchData();
    }, []);

    useEffect(() => {
        const matchApp = matchPath({ path: "/app/workshop/:id" }, location.pathname);
        const matchRoot = matchPath({ path: "/workshop/:id" }, location.pathname);
        const match = matchApp || matchRoot;

        if (match && match.params.id) {
            setCurrentWorkshopId(match.params.id);
            sessionStorage.setItem('paleo_workshop_id', match.params.id);
        }
    }, [location]);

    const setWorkshopContext = (id) => setCurrentWorkshopId(id);

    const login = async (password) => {
        try {
            // Note: the backend uses email/password. We assume password was used as a token in the old UI.
            // If the UI only provides password, we might need a dummy email or the user will have to adapt it.
            // For now, mapping admin / password:
            await api.auth.login('admin@paleo.local', password); // Placeholder adapter
            setIsAdmin(true);
            return true;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        }
    };

    const logout = () => {
        api.auth.logout();
        setIsAdmin(false);
    };

    const addLocalCategory = async (newCat) => {
        try {
            await api.categories.create({ name: newCat });
            await fetchData();
        } catch (e) {
            console.error("Error creating category", e);
        }
    };

    const saveConfig = async (newConfig) => {
        setConfig(newConfig);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const allCartels = await api.cartels.getAll();
            setCartels(allCartels.filter(c => c.status === 'published' || c.visible));
            setDrafts(allCartels.filter(c => c.status !== 'published' && c.status !== null));
            
            try {
                const cats = await api.categories.getAll();
                setCategories(cats);
            } catch (catErr) {
                console.warn("Could not fetch categories", catErr);
            }
            
            // Mocking workshops since they are not in the Node API yet
            setWorkshops([]);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const addCartel = async (entry, isDraft = false) => {
        setLoading(true);
        try {
            await api.cartels.create({
                ...entry,
                status: isDraft ? 'draft' : 'published',
                visible: !isDraft
            });
            await fetchData();
            return true;
        } catch (e) {
            console.error(e);
            alert("Erreur sauvegarde: " + e.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateCartel = async (entry, isDraft = false) => {
        setLoading(true);
        try {
            await api.cartels.update(entry.id, entry);
            await fetchData();
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
        try {
            for (const id of ids) {
                await api.cartels.delete(id);
            }
            await fetchData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file, path) => {
        // Not implemented in Node API yet, mock return
        return "images/" + file.name;
    };

    const addWorkshop = async () => null;
    const deleteWorkshop = async () => false;

    const quitWorkshop = () => {
        setCurrentWorkshopId(null);
        sessionStorage.removeItem('paleo_workshop_id');
        navigate('/');
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
