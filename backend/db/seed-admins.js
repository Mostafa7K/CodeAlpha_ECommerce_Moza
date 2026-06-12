// Creates (or updates) the fixed admin accounts allowed to access the admin
// dashboard. Run with: npm run db:seed-admins
// The accounts authenticate through the normal /api/auth/login flow; access
// to /api/admin/* is then restricted via the ADMIN_EMAILS allowlist.

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

const ADMINS = [
  { name: 'Mostafa', email: 'most.kanaan7@gmail.com', password: 'mostafa2' },
  { name: 'Zeinab', email: 'zeinabajrouche123@gmail.com', password: 'zeinab2' }
];

async function run() {
  for (const admin of ADMINS) {
    const email = admin.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(admin.password, 10);

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      await pool.query('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [passwordHash, 'admin', email]);
      console.log(`Updated admin user: ${email}`);
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [admin.name, email, passwordHash, 'admin']
      );
      console.log(`Created admin user: ${email}`);
    }
  }

  console.log('Admin accounts ready.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed admins failed:', err);
  process.exit(1);
});
