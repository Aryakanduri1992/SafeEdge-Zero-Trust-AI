const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🔍 Fixing floor plan organization IDs safely...\n');

// Temporarily disable foreign key constraints
db.pragma('foreign_keys = OFF');

const users = db.prepare('SELECT id, email, organization_name FROM users WHERE role = ?').all('organization');
const floorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans').all();

console.log('👥 Valid Users:');
users.forEach(user => {
  console.log(`   ${user.email} → ID: ${user.id} (${user.organization_name})`);
});

console.log('\n🏗️ Current Floor Plans:');
floorPlans.forEach(fp => {
  const matchingUser = users.find(u => u.id === fp.organization_id);
  console.log(`   ${fp.name} → OrgID: ${fp.organization_id} ${matchingUser ? '✅' : '❌'}`);
});

console.log('\n🔧 Fixing mismatched floor plans...');

let fixedCount = 0;

// Fix HealthPlus floor plan
const healthPlusUser = users.find(u => u.organization_name === 'HealthPlus Medical Center');
if (healthPlusUser) {
  const healthPlusFloorPlan = floorPlans.find(fp => fp.organization_id === 'test_healthplus_1766404455284');
  if (healthPlusFloorPlan) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(healthPlusUser.id, healthPlusFloorPlan.id);
    console.log(`✅ Fixed HealthPlus floor plan: ${healthPlusFloorPlan.id} → ${healthPlusUser.id}`);
    fixedCount++;
  }
}

// Fix TechCorp floor plan
const techCorpUser = users.find(u => u.organization_name === 'TechCorp Industries');
if (techCorpUser) {
  const techCorpFloorPlan = floorPlans.find(fp => fp.organization_id === 'test_techcorp_1766404455284');
  if (techCorpFloorPlan) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(techCorpUser.id, techCorpFloorPlan.id);
    console.log(`✅ Fixed TechCorp floor plan: ${techCorpFloorPlan.id} → ${techCorpUser.id}`);
    fixedCount++;
  }
}

// Fix EduTech floor plan
const eduTechUser = users.find(u => u.organization_name === 'EduTech Solutions');
if (eduTechUser) {
  const eduTechFloorPlan = floorPlans.find(fp => fp.organization_id === 'test_edutech_1766404455284');
  if (eduTechFloorPlan) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(eduTechUser.id, eduTechFloorPlan.id);
    console.log(`✅ Fixed EduTech floor plan: ${eduTechFloorPlan.id} → ${eduTechUser.id}`);
    fixedCount++;
  }
}

// Fix Advanced Test Corp floor plan
const advancedTestUser = users.find(u => u.organization_name === 'Advanced Test Corp');
if (advancedTestUser) {
  const advancedTestFloorPlan = floorPlans.find(fp => fp.organization_id === '3b13pncqkpnmjh8qt7y');
  if (advancedTestFloorPlan) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(advancedTestUser.id, advancedTestFloorPlan.id);
    console.log(`✅ Fixed Advanced Test Corp floor plan: ${advancedTestFloorPlan.id} → ${advancedTestUser.id}`);
    fixedCount++;
  }
}

// Fix Devaclub floor plan
const devaclubUser = users.find(u => u.organization_name === 'Devaclub');
if (devaclubUser) {
  const devaclubFloorPlan = floorPlans.find(fp => fp.organization_id === '9fqt9rru23bmjhbn58g');
  if (devaclubFloorPlan) {
    db.prepare('UPDATE floor_plans SET organization_id = ? WHERE id = ?').run(devaclubUser.id, devaclubFloorPlan.id);
    console.log(`✅ Fixed Devaclub floor plan: ${devaclubFloorPlan.id} → ${devaclubUser.id}`);
    fixedCount++;
  }
}

// Re-enable foreign key constraints
db.pragma('foreign_keys = ON');

console.log(`\n✅ Fixed ${fixedCount} floor plan organization IDs!`);

// Verify the fixes
console.log('\n🔍 Verification - Updated floor plans:');
const updatedFloorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans').all();
updatedFloorPlans.forEach(fp => {
  const matchingUser = users.find(u => u.id === fp.organization_id);
  console.log(`   ${fp.name} → OrgID: ${fp.organization_id} ${matchingUser ? '✅' : '❌'}`);
  if (matchingUser) {
    console.log(`     → Matches: ${matchingUser.email} (${matchingUser.organization_name})`);
  }
});

db.close();