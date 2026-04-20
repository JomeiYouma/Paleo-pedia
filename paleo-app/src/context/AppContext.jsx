import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLocation, matchPath, useNavigate } from 'react-router-dom';
import api from '../services/apiClient';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [cartels, setCartels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [user, setUser] = useState(null); // { id, email, role, can_manage_admin, can_manage_team, home_subsite_id, ... }
    const isSuperadmin = !!user?.can_manage_admin;
    const isOwner      = !!user?.can_manage_team;
    const homeSubsiteId = user?.home_subsite_id ?? null;
    // isAdmin = accès à l'UI d'administration (superadmin OU owner d'un sous-site)
    const isAdmin = isSuperadmin || isOwner;

    const [currentWorkshopId, setCurrentWorkshopId] = useState(null);
    const currentWorkshop = (currentWorkshopId && Array.isArray(workshops))
        ? workshops.find(w => String(w.id) === String(currentWorkshopId))
        : null;

    const location = useLocation();
    const navigate = useNavigate();

    // Initialisation : restaurer session + charger données
    useEffect(() => {
        const init = async () => {
            // Tenter de restaurer la session depuis le token stocké
            try {
                const me = await api.auth.me();
                if (me) setUser(me);
            } catch {
                setUser(null);
            }
            fetchData();
        };
        init();
    }, []);

    // Détecter le workshop depuis l'URL
    useEffect(() => {
        const matchApp = matchPath({ path: '/app/workshop/:id' }, location.pathname);
        const match = matchApp;
        if (match?.params.id) {
            setCurrentWorkshopId(match.params.id);
        } else if (!location.pathname.includes('workshop')) {
            setCurrentWorkshopId(null);
        }
    }, [location]);

    // ── Auth ─────────────────────────────────────────────────
    const login = async (email, password) => {
        const data = await api.auth.login(email, password);
        setUser(data.user);
        return true;
    };

    const logout = () => {
        api.auth.logout();
        setUser(null);
    };

    // ── Data fetching ─────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            // L'API renverra tout si on est admin (token présent),
            // ou seulement les publiés si on est visiteur
            const allCartels = await api.cartels.getAll();
            setCartels(Array.isArray(allCartels) ? allCartels : []);

            const cats = await api.categories.getAll();
            setCategories(Array.isArray(cats) ? cats : []);

            const ws = await api.workshops.getAll();
            setWorkshops(Array.isArray(ws) ? ws : []);
        } catch (err) {
            console.error('fetchData error:', err.message);
            setCartels([]);
            setCategories([]);
            setWorkshops([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Cartels CRUD ─────────────────────────────────────────

    /**
     * Construire les données à envoyer à l'API :
     * - Mappe category_ids depuis les catégories sélectionnées par nom
     * - Nettoie les champs éphémères
     */
    const buildApiPayload = (entry) => {
        const payload = { ...entry };
        delete payload.imageUrl;       // champ éphémère React
        delete payload.category_objects; // objets complets non nécessaires
        delete payload.created_by_email;
        delete payload.origin;
        delete payload.workshopId;
        delete payload.workshop_objects;
        delete payload.workshops;

        if (payload.workshopIds && !payload.workshop_ids) {
            payload.workshop_ids = payload.workshopIds;
        }
        delete payload.workshopIds;

        // Construire category_ids depuis les noms si pas encore fait
        if (!payload.category_ids && payload.categories?.length) {
            payload.category_ids = categories
                .filter(c => payload.categories.includes(c.name))
                .map(c => c.id);
        }
        return payload;
    };

    const addCartel = async (entry) => {
        setLoading(true);
        try {
            const created = await api.cartels.create(buildApiPayload(entry));
            await fetchData();
            return created;
        } catch (e) {
            console.error(e);
            alert('Erreur sauvegarde : ' + e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /** Soumettre un cartel à un sous-site précis via la route scopée /s/:slug/cartels */
    const addCartelToSubsite = async (slug, entry) => {
        setLoading(true);
        try {
            const created = await api.cartels.createForSubsite(slug, buildApiPayload(entry));
            await fetchData();
            return created;
        } catch (e) {
            console.error(e);
            alert('Erreur sauvegarde : ' + e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateCartel = async (entry) => {
        setLoading(true);
        try {
            const updated = await api.cartels.update(entry.id, buildApiPayload(entry));
            await fetchData();
            return updated;
        } catch (e) {
            console.error(e);
            alert('Erreur mise à jour : ' + e.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteCartel = async (id) => {
        setLoading(true);
        try {
            await api.cartels.delete(id);
            await fetchData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteCartels = async (ids) => {
        if (!Array.isArray(ids) || !ids.length) return;
        setLoading(true);
        try {
            for (const id of ids) await api.cartels.delete(id);
            await fetchData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const translateCartel = async (cartelData) => {
        setLoading(true);
        try {
            const translated = await api.translate.cartel({
                titre: cartelData.titre, description: cartelData.description, location: cartelData.location,
            });
            const updated = await api.cartels.update(cartelData.id, translated);
            await fetchData();
            return updated;
        } catch (e) {
            console.error(e);
            throw e; // Laisser le composant gérer l'alerte
        } finally {
            setLoading(false);
        }
    };

    // ── Image upload (POST /api/upload) ────────────────────────────
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const t = localStorage.getItem('paleo_token');
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: t ? { Authorization: `Bearer ${t}` } : {},
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error ?? 'Erreur upload image');
        }
        const { url } = await res.json();
        return url; // ex: /api/images/1713456789-abc123.jpg
    };

    // ── Catégories ────────────────────────────────────────────
    const addLocalCategory = async (name) => {
        try {
            const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            await api.categories.create({ id: slug, name, description: '' });
            await fetchData();
        } catch (e) {
            console.error('Error creating category', e);
        }
    };

    // ── Workshops ─────────────────────────────────────────────
    const addWorkshop = async (name, cartelIds = [], options = {}) => {
        try {
            const ws = await api.workshops.create({ name, cartelIds, is_immersive: !!options.immersive });
            await fetchData();
            return ws.id;
        } catch (e) {
            console.error(e);
            alert('Erreur création atelier : ' + e.message);
            return null;
        }
    };

    const deleteWorkshop = async (id) => {
        try {
            await api.workshops.delete(id);
            await fetchData();
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const setWorkshopContext = (id) => setCurrentWorkshopId(id);

    const quitWorkshop = () => {
        setCurrentWorkshopId(null);
        navigate('/app');
    };

    return (
        <AppContext.Provider value={{
            // Data
            cartels, loading, categories, workshops, user,
            // Computed
            isAdmin, isSuperadmin, isOwner, homeSubsiteId,
            currentWorkshopId, currentWorkshop, setWorkshopContext,
            // Auth
            login, logout,
            // Cartels CRUD
            fetchData, addCartel, addCartelToSubsite, updateCartel, deleteCartel, deleteCartels, uploadImage, translateCartel,
            // Categories
            addLocalCategory,
            // Workshops
            addWorkshop, deleteWorkshop, quitWorkshop,
            // Legacy compatibility (certains composants utilisent encore drafts)
            drafts: cartels.filter(c => c.status === 'draft' || c.status === 'pending_review'),
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
