const Database = require('better-sqlite3');
const db = new Database('./data/blackshield-x.db');

console.log('All tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

console.log('\nForeign key constraints for floor_plans:');
const fks = db.prepare('PRAGMA foreign_key_list(floor_plans)').all();
console.log(fks);

console.log('\nChecking if organizations table exists:');
const orgTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'organizations'").get();
console.log('Organizations table exists:', !!orgTableExists);

console.log('\nChecking if users table exists:');
const usersTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
console.log('Users table exists:', !!usersTableExists);

db.close();