const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🏢 ORGANIZATIONS:');
const orgs = db.prepare('SELECT * FROM organizations').all();
orgs.forEach(org => console.log(`ID: ${org.id}, Name: ${org.name}`));

console.log('\n🏗️ FLOOR PLANS:');
const floorPlans = db.prepare('SELECT * FROM floor_plans').all();
floorPlans.forEach(fp => {
  console.log(`ID: ${fp.id}, Org: ${fp.organization_id}, Name: ${fp.name}, Approved: ${fp.approved}`);
  if (fp.floors) {
    try {
      const floors = JSON.parse(fp.floors);
      console.log(`  Floors: ${floors.length}, Total Rooms: ${floors.reduce((sum, f) => sum + f.rooms.length, 0)}`);
      floors.forEach((floor, i) => {
        console.log(`    Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
        floor.rooms.forEach(room => {
          console.log(`      ${room.identifier}: ${room.name} (${room.type}) - ${room.size?.width || room.width}x${room.size?.height || room.height}ft`);
        });
      });
    } catch (e) {
      console.log('  Floors: Invalid JSON');
    }
  }
});

console.log('\n👥 USERS (Organization Admins):');
const users = db.prepare('SELECT * FROM users WHERE role = ?').all('organization');
users.forEach(user => console.log(`ID: ${user.id}, Email: ${user.email}, Org: ${user.organization_name}`));

db.close();