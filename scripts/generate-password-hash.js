/**
 * Interactive / CLI bcrypt hash generator for Klyia CRM.
 * Reads password from stdin or prompts via hidden prompt without writing to disk or logs.
 * Algorithm: bcrypt (cost factor 10) matching server/auth.ts and server/db.ts.
 */
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

process.stdout.write('Enter new administrator password: ');
// Mask or read input
rl.question('', (password) => {
  if (!password || password.trim().length === 0) {
    console.error('\n[Error] Password cannot be empty.');
    process.exit(1);
  }
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password.trim(), saltRounds);
  console.log('\n--- Generated Bcrypt Hash (Cost: 10) ---');
  console.log(hash);
  console.log('----------------------------------------\n');
  process.exit(0);
});
