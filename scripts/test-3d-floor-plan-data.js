const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🧪 Testing 3D Floor Plan Data Integration\n');

// Get all organization users
const orgUsers = db.prepare('SELECT * FROM users WHERE role = ?').all('organization');

console.log('👥 Organization Users:');
orgUsers.forEach(user => {
  console.log(`  ${user.email} (${user.organization_name}) - ID: ${user.id}`);
});

console.log('\n🏗️ Testing Floor Plan Lookup for Each User:');

orgUsers.forEach(user => {
  console.log(`\n📋 User: ${user.email} (${user.organization_name})`);
  console.log(`   User ID: ${user.id}`);
  
  // Try to find floor plans by user ID
  let floorPlans = db.prepare('SELECT * FROM floor_plans WHERE organization_id = ?').all(user.id);
  
  if (floorPlans.length === 0 && user.organization_name) {
    // Try by organization name pattern
    floorPlans = db.prepare('SELECT * FROM floor_plans WHERE organization_id LIKE ?')
      .all(`%${user.organization_name.toLowerCase().replace(/\s+/g, '')}%`);
  }
  
  if (floorPlans.length === 0) {
    // Try organizations table
    const org = db.prepare('SELECT * FROM organizations WHERE name = ?').get(user.organization_name);
    if (org) {
      floorPlans = db.prepare('SELECT * FROM floor_plans WHERE organization_id = ?').all(org.id);
    }
  }
  
  if (floorPlans.length > 0) {
    const fp = floorPlans[0];
    console.log(`   ✅ Found Floor Plan: ${fp.name}`);
    console.log(`      Floor Plan ID: ${fp.id}`);
    console.log(`      Organization ID: ${fp.organization_id}`);
    console.log(`      Approved: ${fp.approved ? 'Yes' : 'No'}`);
    
    try {
      const floors = JSON.parse(fp.floors);
      const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);
      console.log(`      Floors: ${floors.length}, Total Rooms: ${totalRooms}`);
      
      floors.forEach(floor => {
        console.log(`        Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
      });
    } catch (e) {
      console.log(`      ❌ Invalid floor data`);
    }
  } else {
    console.log(`   ❌ No floor plan found`);
  }
});

console.log('\n🎯 Recommended Test Users for 3D Floor Plan:');
console.log('1. Advanced Test Corp: admin@advancedtest.com / secure123');
console.log('2. TechCorp Industries: admin@techcorp.com / password123');
console.log('3. HealthPlus Medical: admin@healthplus.com / password123');

db.close();