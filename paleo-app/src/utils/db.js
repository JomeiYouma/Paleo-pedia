const DB_NAME = 'paleo_app_db';
const STORE_NAME = 'keyval';

// Simple Promisified IDB Wrapper
const getDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => reject("DB Open Error");

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
};

const withStore = (mode, callback) => {
    return getDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            const request = callback(store);

            transaction.oncomplete = () => resolve(request.result);
            transaction.onerror = () => reject(transaction.error);
        });
    });
};

export const db = {
    get: (key) => withStore('readonly', store => store.get(key)),
    set: (key, val) => withStore('readwrite', store => store.put(val, key)),
    del: (key) => withStore('readwrite', store => store.delete(key)),
    clear: () => withStore('readwrite', store => store.clear()),
    keys: () => withStore('readonly', store => store.getAllKeys())
};
