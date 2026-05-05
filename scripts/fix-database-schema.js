const Database = require('better-sqlite3');
const path = require('path');

function fixDatabaseSchema() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔄 Fixing database schema...');
  
  try {
    // Check current users table structure
    const usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
    const userColumns = usersTableInfo.map(col => col.name);
    
    console.log('Current users table columns:', userColumns);
    
    // Add missing columns to users table
    if (!userColumns.includes('password')) {
      console.log('➕ Adding password column...');
      db.exec('ALTER TABLE users ADD COLUMN password TEXT');
    }
    
    // Check floor_plans table
    try {
      const floorPlansTableInfo = db.prepare("PRAGMA table_info(floor_plans)").all();
      const floorPlanColumns = floorPlansTableInfo.map(col => col.name);
      
      console.log('Current floor_plans table columns:', floorPlanColumns);
      
      if (!floorPlanColumns.includes('total_floors')) {
        console.log('➕ Adding total_floors column...');
        db.exec('ALTER TABLE floor_plans ADD COLUMN total_floors INTEGER DEFAULT 0');
      }
      
      if (!floorPlanColumns.includes('approved')) {
        console.log('➕ Adding approved column...');
        db.exec('ALTER TABLE floor_plans ADD COLUMN approved BOOLEAN DEFAULT 0');
      }
      
      if (!floorPlanColumns.includes('approved_by')) {
        console.log('➕ Adding approved_by column...');
        db.exec('ALTER TABLE floor_plans ADD COLUMN approved_by TEXT');
      }
      
      if (!floorPlanColumns.includes('approved_at')) {
        console.log('➕ Adding approved_at column...');
        db.exec('ALTER TABLE floor_plans ADD COLUMN approved_at DATETIME');
      }
      
    } catch (error) {
      console.log('Floor plans table does not exist, will be created by app initialization');
    }
    
    // Create some test organization users
    console.log('🏢 Creating test organization users...');
    
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'organization', datetime('now'), datetime('now'))
    `);
    
    const testOrgs = [
      {
        id: 'org1_' + Date.now(),
        email: 'admin@techcorp.com',
        password: 'password123',
        name: 'TechCorp Industries'
      },
      {
        id: 'org2_' + Date.now(),
        email: 'admin@healthplus.com', 
        password: 'password123',
        name: 'HealthPlus Medical'
      },
      {
        id: 'org3_' + Date.now(),
        email: 'admin@edutech.com',
        password: 'password123', 
        name: 'EduTech Solutions'
      }
    ];
    
    for (const org of testOrgs) {
      try {
        insertUser.run(org.id, org.email, org.password, org.name);
        console.log(`  ✅ Created organization: ${org.name} (${org.email})`);
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.log(`  ⚠️ Organization already exists: ${org.email}`);
        } else {
          console.error(`  ❌ Failed to create ${org.email}:`, error.message);
        }
      }
    }
    
    // Create test departments
    console.log('🏬 Creating test departments...');
    
    const orgs = db.prepare("SELECT id, organization_name FROM users WHERE role = 'organization'").all();
    
    if (orgs.length > 0) {
      const insertDept = db.prepare(`
        INSERT OR IGNORE INTO departments (id, organization_id, department_name, location, building, floor, devices, plan, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `);
      
      orgs.forEach((org, index) => {
        const deptId = 'dept_' + org.id + '_' + Date.now();
        try {
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
          console.log(`  ✅ Created department for ${org.organization_name}`);
        } catch (error) {
          console.error(`  ❌ Failed to create department for ${org.organization_name}:`, error.message);
        }
      });
    }
    
    console.log('✅ Database schema fixed and test data created!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

fixDatabaseSchema();