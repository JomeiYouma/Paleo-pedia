import { UserModel } from '../models/User.js';
import { query } from '../lib/db.js';

async function seedAdmin() {
  try {
    const existing = await UserModel.findByEmail('admin@paleo.local');
    if (!existing) {
      await UserModel.create({
        email: 'admin@paleo.local',
        password: 'admin',
        role: 'admin',
        can_create_cartel: true,
        can_publish_cartel: true,
        can_manage_admin: true
      });
      console.log("Admin user created (admin@paleo.local / admin)");
    } else {
      console.log("Admin user already exists");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
