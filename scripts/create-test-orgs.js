const Database = require('better-sqlite3');
const path = require('path');

function createTestOrganizations() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🏢 Creating test organizations...');
  
  try {
    // First, delete any existing test organizations
    db.prepare("DELETE FROM users WHERE email LIKE '%@techcorp.com' OR email LIKE '%@healthplus.com' OR email LIKE '%@edutech.com'").run();
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'organization', datetime('now'), datetime('now'))
    `);
    
    const testOrgs = [
      {
        id: 'org_techcorp_' + Date.now(),
        email: 'admin@techcorp.com',
        password: 'password123',
        name: 'TechCorp Industries'
      },
      {
        id: 'org_healthplus_' + Date.now(),
        email: 'admin@healthplus.com', 
        password: 'password123',
        name: 'HealthPlus Medical'
      },
      {
        id: 'org_edutech_' + Date.now(),
        email: 'admin@edutech.com',
        password: 'password123', 
        name: 'EduTech Solutions'
      }
    ];
    
    for (const org of testOrgs) {
      insertUser.run(org.id, org.email, org.password, org.name);
      console.log(`  ✅ Created: ${org.name} (${org.email})`);
    }
    
    // Create departments for each organization
    const insertDept = db.prepare(`
      INSERT INTO departments (id, organization_id, department_name, location, building, floor, devices, plan, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `);
    
    testOrgs.forEach((org, index) => {
      const deptId = 'dept_' + org.id;
      insertDept.run(
        deptId,
        org.id,
        'IT Department',
        'New York',
        'Main Building',
        index + 1,
        25,
        'Pro'
      );
      console.log(`  ✅ Created department for ${org.name}`);
    });
    
    // Verify the data
    const orgs = db.prepare("SELECT id, email, organization_name FROM users WHERE role = 'organization'").all();
    const depts = db.prepare("SELECT id, department_name, organization_id FROM departments").all();
    
    console.log(`\n📊 Created ${orgs.length} organizations and ${depts.length} departments`);
    orgs.forEach(org => {
      console.log(`  - ${org.organization_name} (${org.email})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to create test organizations:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

createTestOrganizations();