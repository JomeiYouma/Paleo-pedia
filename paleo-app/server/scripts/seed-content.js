/**
 * seed-content.js
 * Importe le contenu depuis ../../seed-content/ vers la BDD :
 *   - team_members (members.json + community.csv)
 *   - press_articles (articles.json + thumbnails)
 *   - prestations (prestations.json + images)
 *   - shop_items (items.json + book covers)
 *
 * Pour chaque entrée avec un fichier local (photo_file / thumbnail_file /
 * image_file), le fichier est copié de seed-content/<sub>/(photos|thumbnails|images)/
 * vers UPLOADS_DIR (= paleo-app/public/images/ en dev, ~/paleo-uploads en prod)
 * en suivant la convention du uploadController (Date-uuid8.ext), et l'URL
 * publique `/api/images/<filename>` est stockée dans le champ correspondant
 * du DB.
 *
 * Upsert par titre/nom (idempotent : on peut relancer sans dupliquer).
 * Si un asset local est absent et qu'un asset existant en DB existe déjà,
 * on garde l'existant — donc on peut relancer même sans tous les fichiers.
 *
 * Usage : node server/scripts/seed-content.js
 *
 * Prérequis : les 4 migrations (v10–v13) + v14 (prestation.image_path) doivent
 * être exécutées au préalable sur la BDD pointée par .env.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import pool from '../lib/db.js';
import { TeamMemberModel }  from '../models/TeamMember.js';
import { PressArticleModel } from '../models/PressArticle.js';
import { PrestationModel }  from '../models/Prestation.js';
import { ShopItemModel }    from '../models/ShopItem.js';
import { UPLOADS_DIR }      from '../controllers/uploadController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_ROOT = path.join(__dirname, '..', '..', '..', 'seed-content');

// ── Stats globales ───────────────────────────────────────────
const stats = {
    team:        { created: 0, updated: 0, skipped: 0 },
    press:       { created: 0, updated: 0, skipped: 0 },
    prestations: { created: 0, updated: 0, skipped: 0 },
    shop:        { created: 0, updated: 0, skipped: 0 },
    assets:      { copied: 0, missing: 0 },
};

// ── Helpers ──────────────────────────────────────────────────

/** Copie un fichier depuis seed-content vers UPLOADS_DIR, retourne l'URL publique ou null si manquant. */
async function copyAsset(srcPath, label) {
    try {
        const stat = await fs.stat(srcPath);
        if (!stat.isFile()) return null;
    } catch {
        console.warn(`    ⚠ asset manquant : ${label} (${path.relative(SEED_ROOT, srcPath)})`);
        stats.assets.missing++;
        return null;
    }
    const ext = path.extname(srcPath).toLowerCase();
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const targetPath = path.join(UPLOADS_DIR, filename);
    await fs.copyFile(srcPath, targetPath);
    stats.assets.copied++;
    return `/api/images/${filename}`;
}

/** SELECT … WHERE <field> = ? LIMIT 1 — retourne la row ou null. */
async function findExisting(table, field, value) {
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE \`${field}\` = ? LIMIT 1`, [value]);
    return rows[0] ?? null;
}

/** Parser CSV minimal qui supporte les champs entre guillemets et les virgules embarquées. */
function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
        const cols = parseLine(line);
        return Object.fromEntries(headers.map((h, i) => [h, cols[i] || null]));
    });
}
function parseLine(line) {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuote = !inQuote; }
        } else if (ch === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

/** Si new == null mais l'existant a une valeur, on garde l'existant (pour ne pas écraser un asset déjà uploadé). */
function keepExistingIfNull(payload, existing, fields) {
    for (const f of fields) {
        if (payload[f] == null && existing[f] != null) payload[f] = existing[f];
    }
}

async function upsert(model, table, dedupField, value, payload, label, group) {
    const existing = await findExisting(table, dedupField, value);
    if (existing) {
        keepExistingIfNull(payload, existing, ['photo_path', 'thumbnail_path', 'image_path']);
        await model.update(existing.id, payload);
        console.log(`  ↻ updated: ${label}`);
        stats[group].updated++;
    } else {
        await model.create(payload);
        console.log(`  + created: ${label}`);
        stats[group].created++;
    }
}

// ── Seeders ──────────────────────────────────────────────────

async function seedTeam() {
    console.log('\n▶ team_members (members.json)');
    const file = path.join(SEED_ROOT, 'team', 'members.json');
    try {
        const data = JSON.parse(await fs.readFile(file, 'utf8'));
        for (const m of data) {
            const photo_path = m.photo_file
                ? await copyAsset(path.join(SEED_ROOT, 'team', 'photos', m.photo_file), m.name)
                : null;
            const payload = {
                category:     m.category || 'main',
                name:         m.name,
                role:         m.role         ?? null,
                bio:          m.bio          ?? null,
                photo_path,
                url_linkedin: m.url_linkedin ?? null,
                url_website:  m.url_website  ?? null,
                url_other:    m.url_other    ?? null,
                display_order: m.display_order ?? 0,
            };
            await upsert(TeamMemberModel, 'team_members', 'name', m.name, payload, m.name, 'team');
        }
    } catch (e) {
        if (e.code === 'ENOENT') console.log('  (pas de members.json, skip)');
        else throw e;
    }
}

async function seedCommunity() {
    console.log('\n▶ team_members (community.csv)');
    const file = path.join(SEED_ROOT, 'team', 'community.csv');
    let csv;
    try { csv = await fs.readFile(file, 'utf8'); }
    catch (e) {
        if (e.code === 'ENOENT') { console.log('  (pas de community.csv, skip)'); return; }
        throw e;
    }
    const rows = parseCsv(csv);
    for (const row of rows) {
        if (!row.name) continue;
        const payload = {
            category: 'community',
            name:     row.name,
            role:     row.role         || null,
            bio:      null,
            photo_path: null,
            url_linkedin: row.url_linkedin || null,
            url_website:  row.url_website  || null,
            url_other:    row.url_other    || null,
            display_order: 0,
        };
        await upsert(TeamMemberModel, 'team_members', 'name', row.name, payload, row.name, 'team');
    }
}

async function seedPress() {
    console.log('\n▶ press_articles');
    const file = path.join(SEED_ROOT, 'press', 'articles.json');
    try {
        const data = JSON.parse(await fs.readFile(file, 'utf8'));
        for (const a of data) {
            const thumbnail_path = a.thumbnail_file
                ? await copyAsset(path.join(SEED_ROOT, 'press', 'thumbnails', a.thumbnail_file), a.title)
                : null;
            const payload = {
                title:          a.title,
                source:         a.source         ?? null,
                published_date: a.published_date ?? null,
                url:            a.url            ?? null,
                thumbnail_path,
                excerpt:        a.excerpt        ?? null,
                display_order:  a.display_order  ?? 0,
                is_published:   a.is_published !== false,
            };
            await upsert(PressArticleModel, 'press_articles', 'title', a.title, payload, a.title, 'press');
        }
    } catch (e) {
        if (e.code === 'ENOENT') console.log('  (pas d\'articles.json, skip)');
        else throw e;
    }
}

async function seedPrestations() {
    console.log('\n▶ prestations');
    const file = path.join(SEED_ROOT, 'prestations', 'prestations.json');
    try {
        const data = JSON.parse(await fs.readFile(file, 'utf8'));
        for (const p of data) {
            const image_path = p.image_file
                ? await copyAsset(path.join(SEED_ROOT, 'prestations', 'images', p.image_file), p.title)
                : null;
            const payload = {
                title:         p.title,
                intro:         p.intro         ?? null,
                description:   p.description   ?? null,
                bullet_points: p.bullet_points ?? null,
                image_path,
                icon_name:     p.icon_name     ?? null,
                pdf_path:      p.pdf_url       ?? null,  // pdf_url dans le JSON → pdf_path en DB
                pdf_label:     p.pdf_label     ?? null,
                display_order: p.display_order ?? 0,
                is_published:  p.is_published !== false,
            };
            await upsert(PrestationModel, 'prestations', 'title', p.title, payload, p.title, 'prestations');
        }
    } catch (e) {
        if (e.code === 'ENOENT') console.log('  (pas de prestations.json, skip)');
        else throw e;
    }
}

async function seedShop() {
    console.log('\n▶ shop_items');
    const file = path.join(SEED_ROOT, 'shop', 'items.json');
    try {
        const data = JSON.parse(await fs.readFile(file, 'utf8'));
        for (const it of data) {
            let image_path = null;
            if (it.image_file) {
                image_path = await copyAsset(path.join(SEED_ROOT, 'shop', 'images', it.image_file), it.title);
            } else if (it.image_url) {
                image_path = it.image_url; // URL externe → stockée telle quelle
            }
            const payload = {
                category:     it.category     || 'book',
                title:        it.title,
                subtitle:     it.subtitle     ?? null,
                description:  it.description  ?? null,
                image_path,
                external_url: it.external_url ?? null,
                price_text:   it.price_text   ?? null,
                display_order: it.display_order ?? 0,
                is_published:  it.is_published !== false,
            };
            await upsert(ShopItemModel, 'shop_items', 'title', it.title, payload, it.title, 'shop');
        }
    } catch (e) {
        if (e.code === 'ENOENT') console.log('  (pas d\'items.json, skip)');
        else throw e;
    }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Seed depuis seed-content/ →', UPLOADS_DIR);
    try {
        await seedTeam();
        await seedCommunity();
        await seedPress();
        await seedPrestations();
        await seedShop();

        console.log('\n──────────────────────────────────────────');
        for (const [group, s] of Object.entries(stats)) {
            if (group === 'assets') {
                console.log(`📁 assets       : ${s.copied} copiés, ${s.missing} manquants`);
            } else {
                console.log(`✓ ${group.padEnd(12)} : ${s.created} créés, ${s.updated} mis à jour`);
            }
        }
        console.log('──────────────────────────────────────────');
        console.log('✅ Done.');
    } finally {
        await pool.end();
    }
}

main().catch(err => {
    console.error('❌ Seed failed:', err);
    pool.end().finally(() => process.exit(1));
});
