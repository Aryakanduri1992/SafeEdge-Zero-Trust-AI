const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '..', 'data', 'blackshield-x.db'));

console.log('=== Database Contents ===\n');

const users = db.prepare('SELECT id, email, role, organization_name FROM users').all();
console.log('Users:', users.length, 'records');
users.forEach(u => console.log('  -', u.email, '(' + u.role + ')'));

const depts = db.prepare('SELECT * FROM departments').all();
console.log('\nDepartments:', depts.length, 'records');

const devices = db.prepare('SELECT * FROM devices').all();
console.log('Devices:', devices.length, 'records');

const floors = db.prepare('SELECT * FROM floor_plans').all();
console.log('Floor plans:', floors.length, 'records');

const esp32 = db.prepare('SELECT * FROM esp32_devices').all();
console.log('ESP32 devices:', esp32.length, 'records');

const events = db.prepare('SELECT * FROM security_events').all();
console.log('Security events:', events.length, 'records');

db.close();
