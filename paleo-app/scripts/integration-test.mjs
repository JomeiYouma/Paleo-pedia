/**
 * Integration test script — exercises the multi-tenant API surface with a
 * real superadmin login. Creates throw-away test users / cartels and cleans
 * up at the end.
 *
 * Usage: node scripts/integration-test.mjs
 */

const BASE = 'http://localhost:3001/api';
const SUPERADMIN = { email: 'admin@paleo.fr', password: 'admin' };
const SUBSITE_SLUG = 'paleo-h20';

// Test users — suffixe unique par run pour éviter les collisions
const STAMP = Date.now();
const OWNER   = { email: `test-owner-${STAMP}@paleo.local`,   password: 'testpass123' };
const CONTRIB = { email: `test-contrib-${STAMP}@paleo.local`, password: 'testpass123' };

const GREEN = '\x1b[32m', RED = '\x1b[31m', GRAY = '\x1b[90m', YELLOW = '\x1b[33m', RESET = '\x1b[0m';

let passed = 0, failed = 0;
const cleanupTasks = [];

function log(sym, color, msg) { console.log(`${color}${sym}${RESET} ${msg}`); }
function pass(msg) { passed++; log('✓', GREEN, msg); }
function fail(msg, detail) { failed++; log('✗', RED, `${msg}${detail ? `\n    ${GRAY}${detail}${RESET}` : ''}`); }
function info(msg) { log('·', GRAY, msg); }

async function req(method, path, { token, body, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(`${method} ${path} → got ${res.status}, expected ${expectStatus}. Body: ${text.slice(0,200)}`);
  }
  return { status: res.status, data };
}

async function section(title, fn) {
  console.log(`\n${YELLOW}── ${title} ──${RESET}`);
  try { await fn(); } catch (e) { fail(`section "${title}" crashed`, e.message); }
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────

let superToken, ownerToken, contribToken;
let subsiteId;
let ownerUserId, contribUserId;
let ownerCartelId, contribCartelId;

await section('Login superadmin', async () => {
  const r = await req('POST', '/auth/login', { body: SUPERADMIN, expectStatus: 200 });
  superToken = r.data.token;
  if (!superToken) return fail('no token returned');
  const me = await req('GET', '/auth/me', { token: superToken, expectStatus: 200 });
  if (me.data.can_manage_admin !== true) return fail('superadmin flag missing from JWT', JSON.stringify(me.data));
  if (!('home_subsite_id' in me.data)) return fail('home_subsite_id not in /auth/me payload');
  if (!('can_manage_team' in me.data)) return fail('can_manage_team not in /auth/me payload');
  pass('login + /auth/me exposes home_subsite_id & can_manage_team');
});

await section('Setup: resolve subsite + create tenant users', async () => {
  const subs = await req('GET', `/subsites/${SUBSITE_SLUG}`, { expectStatus: 200 });
  subsiteId = subs.data.id;
  pass(`subsite "${SUBSITE_SLUG}" resolved (id=${subsiteId.slice(0, 8)}…)`);

  // Owner via POST /s/:slug/users
  const ownerCreate = await req('POST', `/s/${SUBSITE_SLUG}/users`, {
    token: superToken, body: OWNER, expectStatus: 201,
  });
  ownerUserId = ownerCreate.data.id;
  cleanupTasks.push(() => req('DELETE', `/users/${ownerUserId}`, { token: superToken }));
  pass('owner créé via POST /s/:slug/users');

  // Élever owner → can_manage_team via PATCH global (superadmin only)
  const promote = await req('PATCH', `/users/${ownerUserId}`, {
    token: superToken, body: { can_manage_team: true, can_manage_cartels: true }, expectStatus: 200,
  });
  if (!promote.data.can_manage_team) return fail('can_manage_team toggle failed');
  pass('owner promu can_manage_team + can_manage_cartels');

  // Contrib via POST /s/:slug/users (pas owner)
  const contribCreate = await req('POST', `/s/${SUBSITE_SLUG}/users`, {
    token: superToken, body: CONTRIB, expectStatus: 201,
  });
  contribUserId = contribCreate.data.id;
  cleanupTasks.push(() => req('DELETE', `/users/${contribUserId}`, { token: superToken }));
  pass('contrib créé (sans can_manage_team)');

  // Login des deux
  ownerToken   = (await req('POST', '/auth/login', { body: OWNER, expectStatus: 200 })).data.token;
  contribToken = (await req('POST', '/auth/login', { body: CONTRIB, expectStatus: 200 })).data.token;
  pass('owner & contrib se connectent, tokens reçus');
});

await section('JWT payload tenant : home_subsite_id bien propagé', async () => {
  const me = await req('GET', '/auth/me', { token: ownerToken, expectStatus: 200 });
  if (me.data.home_subsite_id !== subsiteId) return fail(`home_subsite_id attendu ${subsiteId}, reçu ${me.data.home_subsite_id}`);
  if (me.data.can_manage_team !== true) return fail('can_manage_team absent dans le JWT owner');
  pass('owner /auth/me : home_subsite_id + can_manage_team corrects');
});

await section('Create cartel superadmin sur /api/cartels (pas d\'auto-submit)', async () => {
  const r = await req('POST', '/cartels', {
    token: superToken,
    body: { titre: `Superadmin test ${STAMP}`, description: 'main site cartel', status: 'published' },
    expectStatus: 201,
  });
  const id = r.data.id;
  cleanupTasks.push(() => req('DELETE', `/cartels/${id}`, { token: superToken }));
  if (r.data.subsite_id !== null) return fail(`superadmin cartel subsite_id attendu NULL, reçu ${r.data.subsite_id}`);
  if (r.data.submitted_to_main_at) return fail('superadmin cartel ne devrait PAS être en file de soumission');
  pass('cartel superadmin → subsite_id=NULL, pas de soumission auto');
});

await section('Create cartel owner en DRAFT (pas d\'auto-submit #5)', async () => {
  const r = await req('POST', `/s/${SUBSITE_SLUG}/cartels`, {
    token: ownerToken,
    body: { titre: `Owner draft ${STAMP}`, description: 'draft content', status: 'draft' },
    expectStatus: 201,
  });
  ownerCartelId = r.data.id;
  cleanupTasks.push(() => req('DELETE', `/cartels/${ownerCartelId}`, { token: superToken }));
  if (r.data.subsite_id !== subsiteId) return fail('owner cartel pas scopé au sous-site');
  if (r.data.submitted_to_main_at) return fail('draft NE devrait PAS être auto-submitted (fix #5)');
  pass('draft owner → scopé sous-site, PAS dans la file principale');
});

await section('Publish owner cartel → enters submissions', async () => {
  const r = await req('PATCH', `/s/${SUBSITE_SLUG}/cartels/${ownerCartelId}/status`, {
    token: ownerToken, body: { status: 'published' }, expectStatus: 200,
  });
  if (!r.data.submitted_to_main_at) return fail('publish devrait déclencher l\'auto-submit');
  if (r.data.visible_on_main) return fail('visible_on_main doit rester 0 avant approbation');
  pass('publish déclenche l\'auto-submit (submitted_to_main_at renseigné)');

  // Vérifie présence dans la file superadmin
  const queue = await req('GET', '/submissions', { token: superToken, expectStatus: 200 });
  const found = queue.data.find(c => c.id === ownerCartelId);
  if (!found) return fail('cartel absent de GET /submissions');
  pass('cartel visible dans la file /submissions côté superadmin');
});

await section('Idempotence (#9) : re-submit manuel ne change pas le timestamp', async () => {
  const before = (await req('GET', `/cartels/${ownerCartelId}`, { token: superToken })).data.submitted_to_main_at;
  await new Promise(r => setTimeout(r, 1100)); // dépasse la précision seconde
  const r = await req('POST', `/s/${SUBSITE_SLUG}/cartels/${ownerCartelId}/submit-to-main`, {
    token: ownerToken, expectStatus: 200,
  });
  if (r.data.submitted_to_main_at !== before) {
    return fail(`timestamp changé : ${before} → ${r.data.submitted_to_main_at}`);
  }
  pass('submitted_to_main_at préservé via IFNULL');
});

await section('Approve → visible_on_main=1', async () => {
  const r = await req('POST', `/submissions/${ownerCartelId}/approve`, { token: superToken, expectStatus: 200 });
  if (!r.data.visible_on_main) return fail('approve devrait mettre visible_on_main=1');
  pass('approve → visible_on_main=1');
});

await section('Fix #4 : edit d\'un cartel visible_on_main=1 ne le déqueue PAS', async () => {
  const r = await req('PATCH', `/s/${SUBSITE_SLUG}/cartels/${ownerCartelId}`, {
    token: ownerToken, body: { description: 'edited description' }, expectStatus: 200,
  });
  if (!r.data.visible_on_main) return fail('edit d\'un cartel approuvé a flippé visible_on_main à 0 (bug)');
  pass('edit d\'un cartel déjà approuvé préserve visible_on_main=1');
});

await section('Fix #1 : owner peut éditer un cartel de son équipe (non créateur)', async () => {
  // Contrib crée son propre cartel
  const r = await req('POST', `/s/${SUBSITE_SLUG}/cartels`, {
    token: contribToken,
    body: { titre: `Contrib draft ${STAMP}`, description: 'by contrib', status: 'draft' },
    expectStatus: 201,
  });
  contribCartelId = r.data.id;
  cleanupTasks.push(() => req('DELETE', `/cartels/${contribCartelId}`, { token: superToken }));
  pass('contrib crée son cartel');

  // Owner (non créateur) édite — devrait passer grâce à can_manage_team
  const edit = await req('PATCH', `/s/${SUBSITE_SLUG}/cartels/${contribCartelId}`, {
    token: ownerToken, body: { description: 'moderated by owner' },
  });
  if (edit.status !== 200) return fail(`owner should be able to moderate, got ${edit.status}`);
  pass('owner (can_manage_team) a édité un cartel d\'un équipier (fix #1)');
});

await section('v33 : membre can_manage_cartels édite les cartels de son sous-site (collaboratif)', async () => {
  // En v33, « Gérer les cartels » couvre TOUT le périmètre (édition collaborative).
  // Le contrib créé via POST /s/:slug/users a can_manage_cartels=true par défaut.
  const edit = await req('PATCH', `/s/${SUBSITE_SLUG}/cartels/${ownerCartelId}`, {
    token: contribToken, body: { description: 'edit collaboratif intra-sous-site' },
  });
  if (edit.status !== 200) return fail(`membre can_manage_cartels devrait éditer (200), reçu ${edit.status}`);
  pass('membre can_manage_cartels édite un cartel de son sous-site');
});

await section('v33 : sans can_manage_cartels, l\'édition est refusée (capacité = vrai garde)', async () => {
  // Révoque la capacité du contrib puis force une reconnexion (perms portées par le JWT).
  await req('PATCH', `/s/${SUBSITE_SLUG}/users/${contribUserId}`, {
    token: ownerToken, body: { can_manage_cartels: false }, expectStatus: 200,
  });
  const relog = await req('POST', '/auth/login', { body: CONTRIB, expectStatus: 200 });
  const edit = await req('PATCH', `/s/${SUBSITE_SLUG}/cartels/${ownerCartelId}`, {
    token: relog.data.token, body: { description: 'devrait échouer' },
  });
  if (edit.status !== 403) return fail(`membre sans capacité attendu 403, reçu ${edit.status}`);
  pass('membre sans can_manage_cartels bloqué (403) — la capacité gate bien l\'édition');
});

await section('Isolation : owner bloqué sur cartel du site principal', async () => {
  // Cherche spécifiquement un cartel avec subsite_id=NULL (le pool retourne
  // dans l'ordre created_at DESC, le premier peut être un cartel test récent)
  const all = (await req('GET', '/cartels?limit=50', { token: superToken })).data;
  const mainCartel = all.find(c => c.subsite_id === null);
  if (!mainCartel) return info('pas de cartel principal pour tester (skipped)');
  const edit = await req('PATCH', `/cartels/${mainCartel.id}`, {
    token: ownerToken, body: { description: 'cross-tenant hijack' },
  });
  if (edit.status !== 404) return fail(`cross-tenant devrait retourner 404 (non-disclosure), reçu ${edit.status}`);
  pass('owner reçoit 404 sur cartel principal (non-disclosure, pas 403)');
});

await section('Isolation tenant : owner bloqué sur route d\'un autre sous-site', async () => {
  const edit = await req('PATCH', `/s/autre-sous-site-inexistant/cartels/fake-id`, {
    token: ownerToken, body: {},
  });
  // 404 sur tenant inexistant
  if (edit.status !== 404) return fail(`attendu 404, reçu ${edit.status}`);
  pass('PATCH sur slug inexistant → 404');
});

await section('Privilège escalade : contrib ne peut pas créer de superadmin via /users', async () => {
  // Le contrib n'a pas can_manage_admin → POST /users interdit (requireAdmin)
  const r = await req('POST', '/users', {
    token: contribToken, body: { email: `hacker-${STAMP}@evil.local`, password: 'testpass123', can_manage_admin: 1 },
  });
  if (r.status !== 403) return fail(`attendu 403, reçu ${r.status}`);
  pass('non-superadmin bloqué sur POST /users');
});

await section('Privilège escalade : owner ne peut pas promouvoir en superadmin via team', async () => {
  // Owner PATCH un contrib avec can_manage_admin=true → la zod schema rejette ce champ
  const r = await req('PATCH', `/s/${SUBSITE_SLUG}/users/${contribUserId}`, {
    token: ownerToken, body: { can_manage_admin: true },
  });
  if (r.status !== 400) return fail(`zod devrait rejeter can_manage_admin (strict schema), reçu ${r.status}`);
  pass('owner bloqué par schema strict sur can_manage_admin');
});

await section('Cartel resolver : POST /cartels par owner → scopé à son sous-site', async () => {
  const r = await req('POST', '/cartels', {
    token: ownerToken, body: { titre: `Owner from main route ${STAMP}`, description: 'check scope' },
    expectStatus: 201,
  });
  cleanupTasks.push(() => req('DELETE', `/cartels/${r.data.id}`, { token: superToken }));
  if (r.data.subsite_id !== subsiteId) return fail(`subsite_id attendu ${subsiteId.slice(0,8)}…, reçu ${r.data.subsite_id}`);
  pass('owner → /cartels : cartel auto-scopé à son home_subsite_id');
});

await section('Upload anonyme autorisé + rate-limit (#2)', async () => {
  // Upload simple — besoin d'un FormData avec fichier
  const formData = new FormData();
  const blob = new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' });
  formData.append('image', blob, 'test.png');
  const r = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
  if (r.status !== 201 && r.status !== 200 && r.status !== 429) {
    return fail(`upload anon attendu 201 ou 429, reçu ${r.status}`);
  }
  pass(`upload anonyme accepté (${r.status}) — rate-limit en vigueur`);
});

// ════════════════════════════════════════════════════════════════════════
// Matrice de permissions v33 (modèle de capacités scopées)
// ════════════════════════════════════════════════════════════════════════

let mainContentUserId, exportOnlyUserId;
const MAINCONTENT = { email: `test-content-${STAMP}@paleo.local`,    password: 'testpass123' };
const EXPORTONLY  = { email: `test-exportonly-${STAMP}@paleo.local`, password: 'testpass123' };
let mainCartelId, mainContentToken, exportOnlyToken;

await section('v33 setup : comptes capacité (contenu principal, export seul)', async () => {
  // Compte principal « gérer les contenus » (home_subsite_id = null)
  const c = await req('POST', '/users', {
    token: superToken,
    body: { ...MAINCONTENT, can_manage_content: true, home_subsite_id: null },
    expectStatus: 201,
  });
  mainContentUserId = c.data.id;
  cleanupTasks.push(() => req('DELETE', `/users/${mainContentUserId}`, { token: superToken }));

  // Compte « exporter (langues du site) » uniquement, rattaché au sous-site
  const e = await req('POST', '/users', {
    token: superToken,
    body: { ...EXPORTONLY, can_export_cartels: true, home_subsite_id: subsiteId },
    expectStatus: 201,
  });
  exportOnlyUserId = e.data.id;
  cleanupTasks.push(() => req('DELETE', `/users/${exportOnlyUserId}`, { token: superToken }));

  mainContentToken = (await req('POST', '/auth/login', { body: MAINCONTENT, expectStatus: 200 })).data.token;
  exportOnlyToken  = (await req('POST', '/auth/login', { body: EXPORTONLY,  expectStatus: 200 })).data.token;
  pass('comptes capacité créés + connectés');

  // Un cartel principal publié (pour les tests de scope d'export)
  const m = await req('POST', '/cartels', {
    token: superToken,
    body: { titre: `Main export test ${STAMP}`, description: 'main', status: 'published' },
    expectStatus: 201,
  });
  mainCartelId = m.data.id;
  cleanupTasks.push(() => req('DELETE', `/cartels/${mainCartelId}`, { token: superToken }));
});

await section('v33 export scopé : l\'owner ne voit que les cartels de son sous-site', async () => {
  // image-check renvoie { total } = nb de cartels EN PÉRIMÈTRE parmi les ids.
  const asOwner = await req('GET', `/export/image-check?ids=${ownerCartelId},${mainCartelId}`, {
    token: ownerToken, expectStatus: 200,
  });
  if (asOwner.data.total !== 1) return fail(`owner devrait ne voir que SON cartel (total=1), reçu total=${asOwner.data.total}`);
  pass('owner : cartel principal filtré hors périmètre (total=1)');

  const asSuper = await req('GET', `/export/image-check?ids=${ownerCartelId},${mainCartelId}`, {
    token: superToken, expectStatus: 200,
  });
  if (asSuper.data.total !== 2) return fail(`superadmin devrait voir les 2 (total=2), reçu total=${asSuper.data.total}`);
  pass('superadmin : périmètre global (total=2)');
});

await section('v33 export : capacité requise (contrib sans export → 403)', async () => {
  const r = await req('GET', '/export/image-check', { token: contribToken });
  if (r.status !== 403) return fail(`contrib sans capacité export attendu 403, reçu ${r.status}`);
  pass('contrib (aucune capacité export) bloqué sur /export/image-check');
});

await section('v33 export traduit : capacité dédiée (export-seul → 403 sur /translate/bulk)', async () => {
  // Le garde requireExportTranslated bloque avant le contrôleur (pas besoin de clé OpenAI).
  const r = await req('POST', '/translate/bulk', {
    token: exportOnlyToken, body: { ids: [mainCartelId], sourceLang: 'fr', targetLanguage: 'Italiano' },
  });
  if (r.status !== 403) return fail(`export-seul (sans translated) attendu 403, reçu ${r.status}`);
  pass('compte « export langues du site » bloqué sur la frise traduite');
});

await section('v33 contenu principal : content-manager OK, owner de sous-site refusé', async () => {
  // Le content-manager principal peut créer un article de presse.
  const ok = await req('POST', '/press-articles', {
    token: mainContentToken, body: { title: `Press ${STAMP}`, url: 'https://example.org' },
  });
  if (ok.status !== 201) return fail(`content-manager principal attendu 201, reçu ${ok.status}`);
  cleanupTasks.push(() => req('DELETE', `/press-articles/${ok.data.id}`, { token: superToken }));
  pass('content-manager principal crée un article de presse');

  // L'owner d'un sous-site n'a PAS accès au contenu de NIVEAU PRINCIPAL.
  const denied = await req('POST', '/press-articles', {
    token: ownerToken, body: { title: `Press hack ${STAMP}`, url: 'https://evil.org' },
  });
  if (denied.status !== 403) return fail(`owner de sous-site attendu 403 sur presse principale, reçu ${denied.status}`);
  pass('owner de sous-site bloqué sur le contenu principal (403)');
});

await section('v33 traduction unitaire : capacité gérer-cartels requise', async () => {
  // content-manager (sans can_manage_cartels) → 403 sur /translate.
  const r = await req('POST', '/translate', {
    token: mainContentToken, body: { titre: 'Bonjour', description: 'desc', target: 'en' },
  });
  if (r.status !== 403) return fail(`content-manager (sans gérer-cartels) attendu 403 sur /translate, reçu ${r.status}`);
  pass('content-manager bloqué sur /translate (capacité gérer-cartels requise)');
});

// ────────────────────────────────────────────────────────────────────────
// Cleanup
// ────────────────────────────────────────────────────────────────────────

console.log(`\n${YELLOW}── Cleanup ──${RESET}`);
for (const task of cleanupTasks) {
  try { await task(); } catch (e) { log('!', YELLOW, `cleanup step failed: ${e.message}`); }
}
info(`${cleanupTasks.length} objets de test supprimés`);

console.log(`\n${passed > 0 ? GREEN : ''}${passed} pass${RESET} · ${failed > 0 ? RED : GRAY}${failed} fail${RESET}`);
process.exit(failed > 0 ? 1 : 0);
