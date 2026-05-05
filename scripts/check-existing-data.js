const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🔍 Checking existing data relationships...\n');

try {
  // Check organizations
  console.log('🏢 ORGANIZATIONS:');
  const orgs = db.prepare('SELECT * FROM organizations LIMIT 3').all();
  orgs.forEach(org => {
    console.log(`   ID: ${org.id}, Name: ${org.name}`);
  });

  // Check users
  console.log('\n👥 USERS:');
  const users = db.prepare('SELECT * FROM users LIMIT 3').all();
  users.forEach(user => {
    console.log(`   ID: ${user.id}, Email: ${user.email}, Org: ${user.organization_name}, Role: ${user.role}`);
  });

  // Check floor_plans and their organization references
  console.log('\n🏗️  FLOOR PLANS:');
  const floorPlans = db.prepare('SELECT id, organization_id, name FROM floor_plans LIMIT 3').all();
  floorPlans.forEach(fp => {
    console.log(`   ID: ${fp.id}, Org ID: ${fp.organization_id}, Name: ${fp.name}`);
    
    // Check if org_id exists in organizations table
    const orgExists = db.prepare('SELECT name FROM organizations WHERE id = ?').get(fp.organization_id);
    console.log(`     -> References org: ${orgExists ? orgExists.name : 'NOT FOUND'}`);
  });

  // Check departments and their organization references
  console.log('\n🏢 DEPARTMENTS:');
  const depts = db.prepare('SELECT id, organization_id, department_name FROM departments LIMIT 3').all();
  depts.forEach(dept => {
    console.log(`   ID: ${dept.id}, Org ID: ${dept.organization_id}, Name: ${dept.department_name}`);
    
    // Check if org_id exists in users table
    const userExists = db.prepare('SELECT organization_name FROM users WHERE id = ?').get(dept.organization_id);
    console.log(`     -> References user: ${userExists ? userExists.organization_name : 'NOT FOUND'}`);
  });

  // Check for orphaned records
  console.log('\n🔍 CHECKING FOR ORPHANED RECORDS:');
  
  const orphanedFloorPlans = db.prepare(`
    SELECT fp.id, fp.name, fp.organization_id 
    FROM floor_plans fp 
    LEFT JOIN organizations o ON fp.organization_id = o.id 
    WHERE o.id IS NULL
  `).all();
  
  if (orphanedFloorPlans.length > 0) {
    console.log('   ❌ Orphaned floor plans:');
    orphanedFloorPlans.forEach(fp => {
      console.log(`     ${fp.name} (org_id: ${fp.organization_id})`);
    });
  } else {
    console.log('   ✅ No orphaned floor plans');
  }

  const orphanedDepts = db.prepare(`
    SELECT d.id, d.department_name, d.organization_id 
    FROM departments d 
    LEFT JOIN users u ON d.organization_id = u.id 
    WHERE u.id IS NULL
  `).all();
  
  if (orphanedDepts.length > 0) {
    console.log('   ❌ Orphaned departments:');
    orphanedDepts.forEach(dept => {
      console.log(`     ${dept.department_name} (org_id: ${dept.organization_id})`);
    });
  } else {
    console.log('   ✅ No orphaned departments');
  }

} catch (error) {
  console.error('❌ ERROR:', error.message);
} finally {
  db.close();
}