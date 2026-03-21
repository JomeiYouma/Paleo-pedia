
import { db } from '../utils/db';

class LocalService {
    constructor() {
        this.prefix = "paleo_local_";
    }

    // Helper to simulate path-based storage
    _getKey(path) {
        return this.prefix + path;
    }

    async login(password) {
        // Local simulation: just check hardcoded
        return Promise.resolve(password === 'admin');
    }

    async getFileContent(path) {
        const key = this._getKey(path);

        // Try DB first
        let data = await db.get(key);

        // Fallback / Migration: If not in DB, try localStorage
        if (!data) {
            const localData = localStorage.getItem(key);
            if (localData) {
                console.log(`[Migration] Moving ${path} to IndexedDB`);
                try {
                    // Try to parse if it's JSON (files are JSON, images are ref strings usually?)
                    // Actually saveJson stores objects, uploadImage stores DataURLs (strings).
                    // We can just store raw value.
                    let valToStore = localData;
                    // Check if it's supposed to be JSON (db_ prefix)
                    if (path.startsWith('db_')) {
                        valToStore = JSON.parse(localData);
                    }

                    await db.set(key, valToStore);
                    data = valToStore;
                    // Optional: localStorage.removeItem(key);
                } catch (e) {
                    // If parse fails (maybe not JSON), just use raw
                    await db.set(key, localData);
                    data = localData;
                }
            }
        }

        if (!data) return []; // Default to empty list for JSONs
        return data;
    }

    async saveJson(path, data, message) {
        const key = this._getKey(path);
        // We store the object directly in IDB (it supports structured clones)
        // No need to JSON.stringify for IDB, but let's keep it consistent?
        // IDB handles objects fine.
        await db.set(key, data);
        console.log(`[Local+IDB] Saved ${path}: ${message}`);
        return true;
    }

    async uploadImage(file, path) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    // Generate a simulated path if not provided
                    const generatedPath = path || `images/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                    const key = this._getKey(generatedPath);

                    // Store the DataURL string in IDB
                    await db.set(key, reader.result);
                    console.log(`[Local+IDB] Uploaded image ${generatedPath}`);
                    resolve(generatedPath); // Return the path string as expected by UI
                } catch (e) {
                    reject(new Error("Erreur sauvegarde IDB: " + e.message));
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Now ASYNC because IDB is async
    async getImageContent(path) {
        const key = this._getKey(path);

        // Try DB
        let content = await db.get(key);

        // Fallback Migration
        if (!content) {
            const localContent = localStorage.getItem(key);
            if (localContent) {
                console.log(`[Migration] Moving Image ${path} to IndexedDB`);
                await db.set(key, localContent);
                content = localContent;
            }
        }

        return content;
    }
}

export const localService = new LocalService();
