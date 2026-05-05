const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🔍 Current Database State Check...\n');

// Check all users
const users = db.prepare('SELECT id, email, organization_name FROM users WHERE role = ?').all('organization');
console.log('👥 Valid Organization Users:');
users.forEach(user => {
  console.log(`   ${user.email} → ID: ${user.id} (${user.organization_name})`);
});

// Check floor plans
const floorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans').all();
console.log('\n🏗️ Floor Plans:');
floorPlans.forEach(fp => {
  const matchingUser = users.find(u => u.id === fp.organization_id);
  console.log(`   ${fp.name} → OrgID: ${fp.organization_id} ${matchingUser ? '✅' : '❌'}`);
  if (matchingUser) {
    console.log(`     → User: ${matchingUser.email}`);
  }
});

// Test API call for HealthPlus user
const healthPlusUser = users.find(u => u.organization_name === 'HealthPlus Medical Center');
if (healthPlusUser) {
  console.log(`\n🧪 Testing API for HealthPlus user: ${healthPlusUser.id}`);
  console.log(`   Email: ${healthPlusUser.email}`);
  console.log(`   Organization: ${healthPlusUser.organization_name}`);
  
  const floorPlan = floorPlans.find(fp => fp.organization_id === healthPlusUser.id);
  if (floorPlan) {
    console.log(`   ✅ Floor plan found: ${floorPlan.name}`);
    console.log(`   Floor plan ID: ${floorPlan.id}`);
    
    // Check floor plan content
    const fpDetails = db.prepare('SELECT floors FROM floor_plans WHERE id = ?').get(floorPlan.id);
    if (fpDetails && fpDetails.floors) {
      const floors = JSON.parse(fpDetails.floors);
      console.log(`   📊 Floors: ${floors.length} floors`);
      floors.forEach((floor, i) => {
        console.log(`     Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
      });
    }
  } else {
    console.log(`   ❌ No floor plan found for user ID: ${healthPlusUser.id}`);
  }
}

// Test Advanced Test Corp user
const advancedTestUser = users.find(u => u.organization_name === 'Advanced Test Corp');
if (advancedTestUser) {
  console.log(`\n🧪 Testing API for Advanced Test Corp user: ${advancedTestUser.id}`);
  console.log(`   Email: ${advancedTestUser.email}`);
  console.log(`   Organization: ${advancedTestUser.organization_name}`);
  
  const floorPlan = floorPlans.find(fp => fp.organization_id === advancedTestUser.id);
  if (floorPlan) {
    console.log(`   ✅ Floor plan found: ${floorPlan.name}`);
    console.log(`   Floor plan ID: ${floorPlan.id}`);
    
    // Check floor plan content
    const fpDetails = db.prepare('SELECT floors FROM floor_plans WHERE id = ?').get(floorPlan.id);
    if (fpDetails && fpDetails.floors) {
      const floors = JSON.parse(fpDetails.floors);
      console.log(`   📊 Floors: ${floors.length} floors`);
      floors.forEach((floor, i) => {
        console.log(`     Floor ${floor.floorNumber}: ${floor.rooms.length} rooms`);
      });
    }
  } else {
    console.log(`   ❌ No floor plan found for user ID: ${advancedTestUser.id}`);
  }
}

console.log('\n🔧 Recommended Test:');
console.log('Try logging in with: admin@advancedtest.com / secure123');
console.log('This should give you user ID:', advancedTestUser ? advancedTestUser.id : 'NOT FOUND');

db.close();