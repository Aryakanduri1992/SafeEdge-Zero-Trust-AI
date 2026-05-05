const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

try {
  // Check what tables exist
  console.log('📋 TABLES:');
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
    console.log(`\nID: ${fp.id}`);
    console.log(`Org ID: ${fp.organization_id}`);
    console.log(`Name: ${fp.name}`);
    console.log(`Approved: ${fp.approved}`);
    console.log(`Total Floors: ${fp.total_floors}`);
    
    if (fp.floors) {
      try {
        const floors = JSON.parse(fp.floors);
        console.log(`Floors Data: ${floors.length} floors`);
        floors.forEach((floor, i) => {
          console.log(`  Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
          floor.rooms.forEach(room => {
            console.log(`    ${room.identifier}: ${room.name} (${room.type}) - ${room.size?.width || room.width}x${room.size?.height || room.height}ft`);
          });
        });
      } catch (e) {
        console.log('Floors: Invalid JSON');
      }
    }
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}