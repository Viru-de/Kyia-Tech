/**
 * Klyia Technology — Dual-Module Production Bootstrap
 *
 * Designed to execute cleanly in BOTH environments:
 * 1. Hostinger Node.js Application Manager (CloudLinux / Passenger / lsnode.js) which
 *    executes startup files via CommonJS `require()`.
 * 2. Standard CLI / NPM start (`node server.js` / `npm start`) under `"type": "module"`.
 *
 * This eliminates:
 * - Error [ERR_REQUIRE_ASYNC_MODULE]: require() cannot be used on an ESM graph with top-level await
 * - ReferenceError: require is not defined in ES module scope
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServer = path.resolve(__dirname, 'dist', 'server.js');

// Auto-build fallback if dist/server.js does not exist yet
if (!fs.existsSync(distServer)) {
  console.log('[Hostinger Boot] dist/server.js not found. Running build step...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[Hostinger Boot] Production build failed during startup:', err);
    process.exit(1);
  }
}

// Convert dist path to standard file:// URL
const serverUrl = pathToFileURL(distServer).href;

// Import compiled ESM bundle without top-level await in the root entry file
import(serverUrl)
  .then(() => {
    console.log('[Hostinger Boot] Server successfully initialized and running.');
  })
  .catch((err) => {
    console.error('[Hostinger Boot] Fatal error loading server application:', err);
    process.exit(1);
  });
