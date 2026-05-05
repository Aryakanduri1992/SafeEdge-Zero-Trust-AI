const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🌱 Seeding database with test organizations...\n');

// Organizations data from LOGIN_CREDENTIALS.md
const organizations = [
  {
    id: '3b13pncqkpnmjh8qt7y',
    email: 'admin@advancedtest.com',
    password: 'secure123',
    name: 'Advanced Test Corp',
    plan: 'enterprise',
    max_devices: 150
  },
  {
    id: 'ukg9f2