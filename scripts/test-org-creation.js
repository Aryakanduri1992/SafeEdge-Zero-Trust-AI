const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

console.log('🧪 Testing organization creation...\n');

try {
  const now = new Date().toISOString();
  
  // Test data
  const testOrg = {
    organizationName: 'Test Organization',
    email: 'test@example.com',
    password: 'test123',
    totalFloors: 2,
    buildingName: 'Test Building',
    floors: [
      {
        floorNumber: 1,
        floorName: 'Floor 1',
        rooms: [
          { name: 'Office 101', identifier: 'R101', width: 12, height: 10, type: 'Office' },
          { name: 'Conference A', identifier: 'R102', width: 20, height: 14, type: 'Conference Room' }
        ]
      },
      {
        floorNumber: 2,
        floorName: 'Floor 2',
        rooms: [
          { name: 'Office 201', identifier: 'R201', width: 12, height: 10, type: 'Office' }
        ]
      }
    ],
    departmentName: 'IT Department',
    location: 'Building A',
    plan: 'Pro',
    devices: 50
  };

  const transaction = db.transaction(() => {
    // 1. Create Organization in organizations table
    const organizationId = generateId();
    const createOrgStmt = db.prepare(`
      INSERT INTO organizations (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    
    console.log(`1️⃣ Creating organization with ID: ${organizationId}`);
    createOrgStmt.run(
      organizationId,
      testOrg.organizationName,
      now,
      now
    );
    console.log('   ✅ Organization created\n');

    // 2. Create Organization Admin User in users table
    const userAccountId = generateId();
    const createUserStmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'organization', ?, ?)
    `);
    
    console.log(`2️⃣ Creating user account with ID: ${userAccountId}`);
    createUserStmt.run(
      userAccountId,
      testOrg.email,
      testOrg.password,
      testOrg.organizationName,
      now,
      now
    );
    console.log('   ✅ User account created\n');

    // 3. Create Floor Plan (references organizations table)
    const floorPlanId = generateId();
    const processedFloors = testOrg.floors.map(floor => ({
      id: generateId(),
      floorNumber: floor.floorNumber,
      totalRooms: floor.rooms.length,
      rooms: floor.rooms.map(room => ({
        id: generateId(),
        floorId: generateId(),
        name: room.name,
        identifier: room.identifier,
        size: {
          width: room.width,
          height: room.height,
          area: room.width * room.height,
          unit: 'sqft'
        },
        position: { x: 0, y: 0, width: room.width, height: room.height },
        deviceIds: [],
        type: room.type
      }))
    }));

    processedFloors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.floorId = floor.id;
      });
    });

    console.log(`3️⃣ Creating floor plan with ID: ${floorPlanId}`);
    const createFloorPlanStmt = db.prepare(`
      INSERT INTO floor_plans (
        id, organization_id, name, floors, total_floors, approved, approved_by, approved_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 'system', ?, ?, ?)
    `);
    
    createFloorPlanStmt.run(
      floorPlanId,
      organizationId, // Reference organizations table
      `${testOrg.organizationName} Floor Plan`,
      JSON.stringify(processedFloors),
      testOrg.totalFloors,
      now,
      now,
      now
    );
    console.log('   ✅ Floor plan created\n');

    // 4. Create Department (references users table)
    const departmentId = generateId();
    console.log(`4️⃣ Creating department with ID: ${departmentId}`);
    const createDeptStmt = db.prepare(`
      INSERT INTO departments (
        id, organization_id, department_name, location, building, floor, devices, plan, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);
    
    createDeptStmt.run(
      departmentId,
      userAccountId, // Reference users table (organization admin)
      testOrg.departmentName,
      testOrg.location,
      testOrg.buildingName,
      1,
      testOrg.devices,
      testOrg.plan,
      now,
      now
    );
    console.log('   ✅ Department created\n');

    // 5. Create audit trail
    const auditId = generateId();
    console.log(`5️⃣ Creating audit trail entry`);
    const createAuditStmt = db.prepare(`
      INSERT INTO audit_trail (
        id, entity_type, entity_id, organization_id, action, user_id, user_role, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    createAuditStmt.run(
      auditId,
      'organization',
      organizationId,
      organizationId, // Reference organizations table
      'create',
      'system',
      'super_admin',
      JSON.stringify({
        organizationName: testOrg.organizationName,
        totalFloors: testOrg.totalFloors,
        totalRooms: processedFloors.reduce((total, floor) => total + floor.rooms.length, 0),
        departmentName: testOrg.departmentName,
        plan: testOrg.plan,
        setupType: 'test'
      }),
      now
    );
    console.log('   ✅ Audit trail created\n');

    return {
      organizationId,
      userAccountId,
      floorPlanId,
      departmentId,
      totalRooms: processedFloors.reduce((total, floor) => total + floor.rooms.length, 0)
    };
  });

  const result = transaction();

  console.log('✅ SUCCESS! Organization created successfully\n');
  console.log('📊 Summary:');
  console.log(`   - Organization ID: ${result.organizationId}`);
  console.log(`   - User Account ID: ${result.userAccountId}`);
  console.log(`   - Organization Name: ${testOrg.organizationName}`);
  console.log(`   - Floor Plan ID: ${result.floorPlanId}`);
  console.log(`   - Department ID: ${result.departmentId}`);
  console.log(`   - Total Floors: ${testOrg.totalFloors}`);
  console.log(`   - Total Rooms: ${result.totalRooms}`);
  console.log(`   - Email: ${testOrg.email}`);

  // Verify the data
  console.log('\n🔍 Verifying data in database...');
  
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.organizationId);
  console.log(`   ✅ Organization found: ${org.name}`);
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.userAccountId);
  console.log(`   ✅ User account found: ${user.email} (${user.organization_name})`);
  
  const floorPlan = db.prepare('SELECT * FROM floor_plans WHERE id = ?').get(result.floorPlanId);
  console.log(`   ✅ Floor plan found: ${floorPlan.name}`);
  
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.departmentId);
  console.log(`   ✅ Department found: ${dept.department_name}`);
  
  console.log('\n🎉 All tests passed!');

} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error);
  process.exit(1);
} finally {
  db.close();
}
