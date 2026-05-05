const Database = require('better-sqlite3');
const db = new Database('./data/blackshield-x.db');

console.log('Departments table schema:');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE name = 'departments'").get());

console.log('\nUsers table schema:');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE name = 'users'").get());

db.close();