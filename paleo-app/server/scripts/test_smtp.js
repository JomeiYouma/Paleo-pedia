/** Vérifie la config SMTP (MAIL_* du .env) et envoie un email de test.
 *  Usage : node server/scripts/test_smtp.js destinataire@exemple.org
 *  Passe par le vrai mailer.js : ce qui marche ici marchera dans l'app. */
import 'dotenv/config';
import nodemailer from 'nodemailer';
import { sendMail } from '../services/mailer.js';

const to = process.argv[2];
if (!to) {
  console.error('Usage : node server/scripts/test_smtp.js destinataire@exemple.org');
  process.exit(1);
}

const host = process.env.MAIL_SMTP_HOST;
const user = process.env.MAIL_SMTP_USER;
const pass = process.env.MAIL_SMTP_PASS;
const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
const secure = String(process.env.MAIL_SMTP_SECURE || (port === 465)).toLowerCase() === 'true';

console.log('— Config lue dans le .env —');
console.log('  MAIL_SMTP_HOST :', host || '(vide)');
console.log('  MAIL_SMTP_PORT :', port, secure ? '(SSL/TLS)' : '(STARTTLS)');
console.log('  MAIL_SMTP_USER :', user || '(vide)');
console.log('  MAIL_SMTP_PASS :', pass ? `(${pass.length} caractères)` : '(vide)');
console.log('  MAIL_FROM      :', process.env.MAIL_FROM || `(vide → fallback sur ${user || 'MAIL_SMTP_USER'})`);

if (!host || !user || !pass) {
  console.error('\n✗ Config incomplète : sendMail() serait un no-op silencieux dans l\'app.');
  process.exit(1);
}

// 1) Connexion + authentification, sans rien envoyer.
try {
  await nodemailer.createTransport({ host, port, secure, auth: { user, pass } }).verify();
  console.log('\n✓ Connexion et authentification OK');
} catch (err) {
  console.error('\n✗ Échec de la connexion :', err.message);
  console.error('  · "Invalid login"      → mauvais identifiant ou mot de passe');
  console.error('  · "ECONNREFUSED"       → mauvais host/port, ou port bloqué en sortie');
  console.error('  · "self signed cert"   → mettre MAIL_SMTP_SECURE=true avec le port 465');
  process.exit(1);
}

// 2) Envoi réel via le mailer de l'app.
const result = await sendMail({
  to,
  subject: '[Paléo] Test SMTP',
  text: 'Si tu lis ceci, la configuration SMTP fonctionne.\n\n— Script test_smtp.js',
});

if (result.sent) {
  console.log('✓ Email accepté par le serveur, messageId :', result.messageId);
  console.log(`\nVérifie la boîte ${to} (pense à regarder les indésirables).`);
} else if (result.error) {
  console.error('✗ Envoi refusé :', result.error);
  console.error('  Un refus après une auth réussie vient souvent d\'un MAIL_FROM');
  console.error('  qui ne correspond pas à la boîte authentifiée.');
  process.exit(1);
} else {
  console.error('✗ Envoi ignoré (skipped) — destinataire vide ?');
  process.exit(1);
}
