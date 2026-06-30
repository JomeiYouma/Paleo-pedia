import 'dotenv/config';
import { UserModel } from '../models/User.js';

// Crée le compte superadmin initial.
//
// Durcissement : plus de mot de passe « admin » en dur. On lit
// SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD dans l'environnement.
//   - En production : SEED_ADMIN_PASSWORD est OBLIGATOIRE (8+ caractères).
//     Le script refuse de créer un compte avec un mot de passe par défaut.
//   - En développement : repli sur admin@paleo.local / "admin" (avec un
//     avertissement bruyant), pour ne pas freiner le démarrage local.
async function seedAdmin() {
  const isProd = process.env.NODE_ENV === 'production';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@paleo.local';
  const password = process.env.SEED_ADMIN_PASSWORD || (isProd ? null : 'admin');

  if (!password) {
    console.error('❌ SEED_ADMIN_PASSWORD non défini.');
    console.error('   En production, le compte admin ne peut pas être créé avec un mot de passe par défaut.');
    console.error('   Définissez SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD (8+ caractères) dans le .env, puis relancez.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD trop court (8 caractères minimum).');
    process.exit(1);
  }

  try {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      console.log(`Admin user already exists (${email})`);
    } else {
      await UserModel.create({
        email,
        password,
        role: 'superadmin',
        // Superadmin : l'administration generale donne implicitement toutes
        // les capacites (cf. logique des gardes), inutile de les poser ici.
        can_manage_admin: true,
      });
      console.log(`✅ Admin user created (${email})`);
      if (!process.env.SEED_ADMIN_PASSWORD) {
        console.warn('⚠️  Mot de passe par défaut « admin » utilisé (développement). NE JAMAIS utiliser en production.');
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
