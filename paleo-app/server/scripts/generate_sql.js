import fs from 'fs';
import path from 'path';

// Define paths
const CARTELS_PATH = path.resolve('../archives 17.02.2026/data/db_cartels.json');
const DRAFTS_PATH = path.resolve('../archives 17.02.2026/data/db_drafts.json');
const SQL_OUTPUT_PATH = path.resolve('./server/data_import.sql');

// Read JSON files
const cartelsRaw = fs.readFileSync(CARTELS_PATH, 'utf-8');
const draftsRaw = fs.readFileSync(DRAFTS_PATH, 'utf-8');

const cartels = JSON.parse(cartelsRaw);
const drafts = JSON.parse(draftsRaw);

// Category logic
const normalizeId = (name) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const categoriesMap = new Map();

// Helper to escape SQL string
const esc = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
};

const processedCartelIds = new Set();
let sqlOutput = `/* IMPORT SCRIPT GENERATED AUTOMATICALLY */\n`;
sqlOutput += `SET NAMES utf8mb4;\n`;
sqlOutput += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

sqlOutput += `DELETE FROM cartel_categories;\n`;
sqlOutput += `DELETE FROM categories;\n`;
sqlOutput += `DELETE FROM cartels;\n\n`;

// Extract and insert ALL unique categories first
const allItems = [...cartels, ...drafts];
allItems.forEach(item => {
    if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach((catName, index) => {
            const catId = normalizeId(catName);
            if (!categoriesMap.has(catId)) {
                // Try to find english translation
                const catEn = (item.categories_en && item.categories_en[index]) ? item.categories_en[index] : catName;
                categoriesMap.set(catId, { id: catId, name: catName, name_en: catEn });
            }
        });
    }
});

sqlOutput += `-- ========================\n`;
sqlOutput += `-- CATEGORIES (from JSONs)\n`;
sqlOutput += `-- ========================\n`;
categoriesMap.forEach(cat => {
    sqlOutput += `INSERT INTO categories (id, name, name_en, description, color, icon) VALUES (${esc(cat.id)}, ${esc(cat.name)}, ${esc(cat.name_en)}, '', '#888888', '');\n`;
});
sqlOutput += `\n`;

sqlOutput += `-- ========================\n`;
sqlOutput += `-- CARTELS (Published)\n`;
sqlOutput += `-- ========================\n`;

const generateCartelSQL = (item, status) => {
    const id = item.id;
    if (processedCartelIds.has(id)) return '';
    processedCartelIds.add(id);

    // Format dates
    let dateStr = 'NULL';
    if (item.date) {
        // e.g. "2026-02-10"
        dateStr = esc(item.date);
    }
    
    let createdAt = 'CURRENT_TIMESTAMP';
    if (item.created_at) {
        createdAt = esc(item.created_at.slice(0, 19).replace('T', ' ')); // Convert ISO to MySQL DATETIME
    }

    const loc = item.location || '';
    const locEn = item.location_en || '';
    const lat = item.coords && item.coords.lat ? item.coords.lat : 'NULL';
    const lng = item.coords && item.coords.lng ? item.coords.lng : 'NULL';
    const numLat = isNaN(parseFloat(lat)) ? 'NULL' : parseFloat(lat);
    const numLng = isNaN(parseFloat(lng)) ? 'NULL' : parseFloat(lng);

    let sql = `INSERT INTO cartels (id, titre, titre_en, annee, description, description_en, exhume_par, location, location_en, lat, lng, image_path, url_qr, date, status, visible, created_at, updated_at) VALUES (\n`;
    sql += `  ${esc(id)}, ${esc(item.titre)}, ${esc(item.titre_en)}, ${esc(item.annee)},\n`;
    sql += `  ${esc(item.description)}, ${esc(item.description_en)}, ${esc(item.exhume_par)},\n`;
    sql += `  ${esc(loc)}, ${esc(locEn)}, ${numLat}, ${numLng},\n`;
    sql += `  ${esc(item.image_path)}, ${esc(item.url_qr)}, ${dateStr}, ${esc(status)}, 1, ${createdAt}, ${createdAt}\n`;
    sql += `);\n`;

    if (item.categories && item.categories.length > 0) {
        item.categories.forEach(catName => {
            const catId = normalizeId(catName);
            sql += `INSERT INTO cartel_categories (cartel_id, category_id) VALUES (${esc(id)}, ${esc(catId)});\n`;
        });
    }

    return sql + '\n';
};

cartels.forEach(c => {
    sqlOutput += generateCartelSQL(c, 'published');
});

sqlOutput += `-- ========================\n`;
sqlOutput += `-- CARTELS (Drafts)\n`;
sqlOutput += `-- ========================\n`;
drafts.forEach(d => {
    // Only generate if not already in processedCartelIds
    if (!processedCartelIds.has(d.id)) {
        sqlOutput += generateCartelSQL(d, 'draft');
    }
});

sqlOutput += `SET FOREIGN_KEY_CHECKS = 1;\n`;

fs.writeFileSync(SQL_OUTPUT_PATH, sqlOutput, 'utf-8');
console.log(`Generated ${SQL_OUTPUT_PATH} successfully!`);
