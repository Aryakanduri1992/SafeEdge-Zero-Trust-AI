const Database = require('better-sqlite3');
const path = require('path');

function debugTestData() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔍 Debugging test data...');
  
  try {
    // Check if organizations exist
    const orgs = db.prepare("SELECT * FROM users WHERE role = 'organization'").all();
    console.log('Organizations in database:', orgs.length);
    orgs.forEach(org => {
      console.log(`  - ${org.organization_name} (${org.id})`);
    });
    
    // Check floor plans
    const floorPlans = db.prepare("SELECT * FROM floor_plans").all();
    console.log('Floor plans in database:', floorPlans.length);
    
    // Check departments
    const departments = db.prepare("SELECT * FROM departments").all();
    console.log('Departments in database:', departments.length);
    
    // Check devices
    const devices = db.prepare("SELECT * FROM devices").all();
    console.log('Devices in database:', devices.length);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    db.close();
  }
}

debugTestData();