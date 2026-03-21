// Service communicating with local PHP API
// Assumes /api/ scripts are available relative to root

const API_BASE = './api';

export const phpService = {
    // Load Check (Ping)
    async checkHealth() {
        try {
            const res = await fetch(`${API_BASE}/config.php`);
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // Alias for polymorphic usage
    async getFileContent(file) {
        return this.loadData(file);
    },

    async loadData(file) {
        // Determine file key
        // db_cartels.json -> 'cartels'
        // db_drafts.json -> 'drafts'
        // db_workshops.json -> 'workshops'
        let key = 'cartels';
        if (file.includes('drafts')) key = 'drafts';
        if (file.includes('workshops')) key = 'workshops';
        if (file.includes('config')) key = 'config';

        const token = sessionStorage.getItem('paleo_token');
        console.log(`[phpService] Loading ${key}, Token present: ${!!token}`);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let url = `${API_BASE}/get_data.php?file=${key}&t=${Date.now()}`;
        if (token) {
            url += `&token=${encodeURIComponent(token)}`;
        }

        console.log(`[phpService] Fetching: ${url}`);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error(`[phpService] HTTP Error ${response.status} for ${key}`);
            // If 404, return empty array to behave like new DB
            if (response.status === 404) return [];
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    async login(password) {
        // ... (unchanged)
        const response = await fetch(`${API_BASE}/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        return response.ok;
    },

    // Interface match: saveJson(file, content, message)
    async saveJson(file, data, message = '') {
        let key = 'cartels';
        if (file.includes('drafts')) key = 'drafts';
        if (file.includes('workshops')) key = 'workshops';
        if (file.includes('config')) key = 'config';

        let token = null;

        // Retrieve token from session storage directly here, or passed?
        // Service shouldn't access storage ideally, but for simplicity:
        if (key === 'cartels' || key === 'workshops' || key === 'config') {
            token = sessionStorage.getItem('paleo_token');
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let url = `${API_BASE}/save_data.php?file=${key}`;
        if (token) {
            // Send token in URL as fallback for header stripping
            url += `&token=${encodeURIComponent(token)}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Save failed: ${response.status} ${errText}`);
        }
        return await response.json();
    },

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const token = sessionStorage.getItem('paleo_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        const result = await response.json();
        return result.path; // "images/filename.jpg"
    }
};
