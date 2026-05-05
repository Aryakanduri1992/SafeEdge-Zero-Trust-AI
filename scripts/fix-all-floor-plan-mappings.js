const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🔧 Fixing ALL floor plan organization ID mappings...\n');

// Temporarily disable foreign key constraints
db.pragma('foreign_keys = OFF');

const users = db.prepare('SELECT id, email, organization_name FROM users WHERE role = ?').all('organization');
const floorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans').all();

console.log('👥 Valid Organization Users:');
users.forEach(user => {
  console.log(`   ${user.email} → ID: ${user.id} (${user.organization_name})`);
});

console.log('\n🏗️ Current Floor Plans:');
floorPlans.forEach(fp => {
  const matchingUser = users.find(u => u.id === fp.organization_id);
  console.log(`   ${fp.name} → OrgID: ${fp.organization_id} ${matchingUser ? '✅' : '❌'}`);
});

console.log('\n🔧 Fixing ALL mismatched floor plans...');

let fixedCount = 0;

// Create mappings based on organization names
const mappings = [
  { floorPlanName: 'Main Building Floor Plan', orgName: 'Advanced Test Corp' },
  { floorPlanName: 'Test Wizard Org Floor Plan', orgName: 'Test Wizard Org' },
  { floorPlanName: 'Deva Floor Plan', orgName: 'Deva' },
  { floorPlanName: 'Test Organization Floor Plan', orgName: 'Test Organization' }
];

mappings.forEach(mapping => {
  const user = users.find(u => u.organization_name === mapping.orgName);
  const floorPlan = floorPlans.find(fp => fp.name === mapping.floorPlanName);
  
  if (user && floorPlan && user.id !== floorPlan.organization_id) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(user.id, floorPlan.id);
    console.log(`✅ Fixed "${mapping.floorPlanName}" → ${user.id} (${user.email})`);
    fixedCount++;
  } else if (!user) {
    console.log(`⚠️ No user found for organization: ${mapping.orgName}`);
  } else if (!floorPlan) {
    console.log(`⚠️ No floor plan found: ${mapping.floorPlanName}`);
  } else {
    console.log(`ℹ️ Already correct: ${mapping.floorPlanName}`);
  }
});

// Handle orphaned floor plans - assign to a default user or delete
const orphanedFloorPlans = db.prepare(`
  SELECT fp.id, fp.name, fp.organization_id 
  FROM floor_plans fp 
  LEFT JOIN users u ON fp.organization_id = u.id 
  WHERE u.id IS NULL
`).all();

if (orphanedFloorPlans.length > 0) {
  console.log('\n🗑️ Found orphaned floor plans (no matching user):');
  orphanedFloorPlans.forEach(fp => {
    console.log(`   ${fp.name} → OrgID: ${fp.organization_id}`);
    
    // Try to find a suitable user based on name similarity
    let assignedUser = null;
    
    if (fp.name.toLowerCase().includes('advanced') || fp.name.toLowerCase().includes('test corp')) {
      assignedUser = users.find(u => u.organization_name === 'Advanced Test Corp');
    } else if (fp.name.toLowerCase().includes('deva')) {
      assignedUser = users.find(u => u.organization_name === 'Deva' || u.organization_name === 'Devaclub');
    } else if (fp.name.toLowerCase().includes('test')) {
      assignedUser = users.find(u => u.organization_name === 'Test Organization' || u.organization_name === 'Test Wizard Org');
    }
    
    if (assignedUser) {
      db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(assignedUser.id, fp.id);
      console.log(`   ✅ Assigned to: ${assignedUser.email} (${assignedUser.organization_name})`);
      fixedCount++;
    } else {
      console.log(`   ⚠️ Could not find suitable user - keeping as is`);
    }
  });
}

// Re-enable foreign key constraints
db.pragma('foreign_keys = ON');

console.log(`\n✅ Fixed ${fixedCount} floor plan organization IDs!`);

// Final verification
console.log('\n🔍 Final Verification - All floor plans:');
const finalFloorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans').all();
finalFloorPlans.forEach(fp => {
  const matchingUser = users.find(u => u.id === fp.organization_id);
  console.log(`   ${fp.name} → OrgID: ${fp.organization_id} ${matchingUser ? '✅' : '❌'}`);
  if (matchingUser) {
    console.log(`     → User: ${matchingUser.email} (${matchingUser.organization_name})`);
  }
});

// Show summary
const totalFloorPlans = finalFloorPlans.length;
const validFloorPlans = finalFloorPlans.filter(fp => users.find(u => u.id === fp.organization_id)).length;
console.log(`\n📊 Summary: ${validFloorPlans}/${totalFloorPlans} floor plans have valid organization mappings`);

db.close();