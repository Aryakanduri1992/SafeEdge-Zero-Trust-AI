const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🧪 Testing 3D Floor Plan API for All Users\n');

const users = db.prepare('SELECT * FROM users WHERE role = ?').all('organization');

console.log(`Found ${users.length} organization users to test:\n`);

for (const user of users) {
  console.log(`👤 Testing: ${user.email} (${user.organization_name})`);
  console.log(`   User ID: ${user.id}`);
  
  try {
    // Simulate the API call
    const response = await fetch(`http://localhost:9002/api/floor-plans?organizationId=${user.id}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ API Success: Found ${data.floorPlans.length} floor plan(s)`);
      if (data.floorPlans.length > 0) {
        const fp = data.floorPlans[0];
        try {
          const floors = JSON.parse(fp.floors);
          const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);
          console.log(`      📋 ${fp.name}: ${floors.length} floors, ${totalRooms} rooms`);
        } catch (e) {
          console.log(`      📋 ${fp.name}: Invalid floor data`);
        }
      }
    } else {
      console.log(`   ❌ API Error: ${response.status} - ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Request Failed: ${error.message}`);
  }
  
  console.log('');
}

db.close();

console.log('🎯 Recommended Test Accounts:');
console.log('✅ Advanced Test Corp: admin@advancedtest.com / secure123');
console.log('✅ TechCorp Industries: admin@techcorp.com / password123');
console.log('✅ HealthPlus Medical: admin@healthplus.com / password123');
console.log('✅ Devaclub: deva@test.com / Ajay@123');
console.log('');
console.log('💡 If you see session issues in browser:');
console.log('   1. Logout completely');
console.log('   2. Clear browser cache/localStorage');
console.log('   3. Login again with correct credentials');