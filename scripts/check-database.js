const Database = require('better-sqlite3');
const path = require('path');

function checkDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔍 Checking database contents...');
  
  try {
    // Check users table structure
    console.log('\n📋 Users table structure:');
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    tableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Check all users
    console.log('\n👥 All users:');
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`Found ${users.length} users`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, OrgName: ${user.organization_name || 'NULL'}`);
    });
    
    // Check departments
    console.log('\n🏢 All departments:');
    const departments = db.prepare('SELECT * FROM departments').all();
    console.log(`Found ${departments.length} departments`);
    departments.forEach(dept => {
      console.log(`  - ID: ${dept.id}, Name: ${dept.department_name}, OrgID: ${dept.organization_id}`);
    });
    
    // Check floor plans
    console.log('\n🏗️ All floor plans:');
    const floorPlans = db.prepare('SELECT id, organization_id, total_floors FROM floor_plans').all();
    console.log(`Found ${floorPlans.length} floor plans`);
    floorPlans.forEach(fp => {
      console.log(`  - ID: ${fp.id}, OrgID: ${fp.organization_id}, Floors: ${fp.total_floors}`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    db.close();
  }
}

checkDatabase();