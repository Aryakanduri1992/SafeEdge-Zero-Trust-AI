const Database = require('better-sqlite3');
const path = require('path');

// Try different database paths
const possiblePaths = [
  './database.sqlite',
  './data/blackshield-x.db',
  './blackshield-x.db'
];

let db = null;
for (const dbPath of possiblePaths) {
  try {
    db = new Database(dbPath);
    console.log(`✅ Connected to database: ${dbPath}`);
    break;
  } catch (e) {
    console.log(`❌ Failed to connect to: ${dbPath}`);
  }
}

if (!db) {
  console.log('❌ No database found');
  process.exit(1);
}

try {
  // Check what tables exist
  console.log('\n📋 TABLES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(`  - ${table.name}`));

  // Check users table (which might contain organizations)
  console.log('\n👥 USERS:');
  const users = db.prepare('SELECT * FROM users').all();
  users.forEach(user => console.log(`ID: ${user.id}, Email: ${user.email}, Org: ${user.organization_name}, Role: ${user.role}`));

  // Check floor plans
  console.log('\n🏗️ FLOOR PLANS:');
  const floorPlans = db.prepare('SELECT * FROM floor_plans').all();
  floorPlans.forEach(fp => {
    console.log(`ID: ${fp.id}, Org ID: ${fp.organization_id}, Name: ${fp.name}, Approved: ${fp.approved}`);
    if (fp.floors) {
      try {
        const floors = JSON.parse(fp.floors);
        console.log(`  Floors: ${floors.length}`);
        floors.forEach((floor, i) => {
          console.log(`    Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
          floor.rooms.slice(0, 2).forEach(room => {
            console.log(`      ${room.identifier}: ${room.name} (${room.type}) - ${room.size?.width || room.width}x${room.size?.height || room.height}ft`);
          });
        });
      } catch (e) {
        console.log('  Floors: Invalid JSON');
      }
    }
  });

  // Check departments
  console.log('\n🏢 DEPARTMENTS:');
  const departments = db.prepare('SELECT * FROM departments').all();
  departments.forEach(dept => console.log(`ID: ${dept.id}, Org ID: ${dept.organization_id}, Name: ${dept.department_name}`));

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}