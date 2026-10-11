/**
 * Klyia Technology — Hostinger Node.js Application Startup File
 * This file serves as the root entry point for Hostinger cPanel / hPanel Node.js Application Manager.
 * It automatically boots the compiled server bundle or runs the production build if needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServer = path.resolve(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distServer)) {
  console.log('[Hostinger Boot] dist/server.js not found. Running production build...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[Hostinger Boot] Build failed:', err);
    process.exit(1);
  }
}

// Launch the production server bundle
await import('./dist/server.js');
