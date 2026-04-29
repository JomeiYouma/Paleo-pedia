/**
 * Smoke test du dispatcher d'événements :
 *   1. dispatch un event factice (sans email configuré, donc no-op email)
 *   2. relit la table event_logs et affiche la dernière ligne
 *   3. supprime la ligne de test pour ne pas polluer
 */
import 'dotenv/config';
import { dispatchEvent } from '../services/eventDispatcher.js';
import { EventLogModel } from '../models/EventLog.js';
import { query } from '../lib/db.js';

const before = (await query('SELECT COUNT(*) AS n FROM event_logs')).rows[0].n;
console.log('Lignes event_logs avant :', before);

await dispatchEvent({
  type: 'cartel.published',
  actorId: null,
  actorEmail: 'smoke-test@example.com',
  targetId: 'smoke-test-id',
  summary: 'Smoke test — DELETE ME',
  payload: { test: true, ts: Date.now() },
});

const { items, total } = await EventLogModel.list({ q: 'Smoke test', limit: 5 });
console.log('Recherche q=Smoke test :', total, 'résultat(s)');
items.forEach(it => console.log('  ·', it.created_at, '|', it.type, '|', it.summary, '| payload =', JSON.stringify(it.payload)));

// Cleanup
await query('DELETE FROM event_logs WHERE summary LIKE ?', ['%Smoke test%']);
const after = (await query('SELECT COUNT(*) AS n FROM event_logs')).rows[0].n;
console.log('Lignes event_logs après cleanup :', after, '(devrait être identique à avant)');

process.exit(0);
