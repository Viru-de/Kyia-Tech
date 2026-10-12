import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const TARGET_EMAIL = 'klyiatechnology@gmail.com';

async function run() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('[Error] ADMIN_PASSWORD environment variable is not defined.');
    console.error('Usage: ADMIN_PASSWORD="<your-password>" npx tsx scripts/update-admin-password.ts');
    process.exit(1);
  }

  console.log(`[Script] Preparing secure password update for administrator: ${TARGET_EMAIL}`);
  const newHash = bcrypt.hashSync(adminPassword, 10);

  // 1. MySQL direct connection (if credentials provided)
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  let mysqlUpdated = false;

  if (host && user && database) {
    try {
      console.log(`[Script] Testing connection to Hostinger MySQL at ${host}:${port}/${database}...`);
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password: password || '',
        database,
        connectTimeout: 5000,
      });

      console.log('[Script] Connected to MySQL successfully.');

      // Pre-check
      const [rows]: any = await conn.query(
        'SELECT id, name, email, role, status FROM users WHERE LOWER(email) = ?',
        [TARGET_EMAIL.toLowerCase()]
      );

      if (!rows || rows.length === 0) {
        console.error(`[Script] Error: Administrator account not found in MySQL for ${TARGET_EMAIL}.`);
        process.exit(1);
      } else if (rows.length > 1) {
        console.error(`[Script] Error: Multiple matching user records found (${rows.length}). Aborting.`);
        process.exit(1);
      } else {
        const adminUser = rows[0];
        console.log(`[Script] Found single administrator: ID=${adminUser.id}, Email=${adminUser.email}, Role=${adminUser.role}`);

        // Update password hash
        const [updateResult]: any = await conn.query(
          'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = ? LIMIT 1',
          [newHash, TARGET_EMAIL.toLowerCase()]
        );
        console.log(`[Script] MySQL users UPDATE affected rows: ${updateResult.affectedRows}`);

        // Invalidate active sessions
        const [sessionResult]: any = await conn.query(
          'DELETE FROM user_sessions WHERE user_id = ?',
          [adminUser.id]
        );
        console.log(`[Script] MySQL invalidated active sessions: ${sessionResult.affectedRows}`);

        mysqlUpdated = true;
      }

      await conn.end();
    } catch (err: any) {
      console.warn(`[Script] Hostinger MySQL connection unreachable (${err.code || err.message}).`);
    }
  } else {
    console.warn('[Script] Hostinger MySQL credentials not configured in environment.');
  }

  // 2. Synchronize local persistent store
  const jsonPath = path.resolve(process.cwd(), 'data', 'klyia_db.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(data.users)) {
        const u = data.users.find((user: any) => user.email.toLowerCase() === TARGET_EMAIL.toLowerCase());
        if (u) {
          u.password_hash = newHash;
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
          console.log('[Script] Local JSON persistence synchronized with new bcrypt hash.');
        }
      }
    } catch (e: any) {
      console.error('[Script] Error syncing local JSON store:', e.message);
    }
  }

  console.log(`[Script] Finished. MySQL Updated: ${mysqlUpdated}`);
}

run().catch((e) => {
  console.error('[Script] Fatal error:', e);
  process.exit(1);
});
