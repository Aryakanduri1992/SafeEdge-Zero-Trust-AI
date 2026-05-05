const Database = require('better-sqlite3');
const path = require('path');

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function populateCompleteTestData() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🏗️ Populating complete test data...');
  
  try {
    // Disable foreign key constraints temporarily
    db.pragma('foreign_keys = OFF');
    
    const now = new Date().toISOString();
    
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    db.prepare("DELETE FROM devices WHERE organization_id LIKE 'test_%'").run();
    db.prepare("DELETE FROM departments WHERE organization_id LIKE 'test_%'").run();
    db.prepare("DELETE FROM floor_plans WHERE organization_id LIKE 'test_%'").run();
    db.prepare("DELETE FROM users WHERE id LIKE 'test_%'").run();
    
    const organizations = [
      {
        id: 'test_techcorp_' + Date.now(),
        name: 'TechCorp Industries',
        email: 'admin@techcorp.com',
        password: 'password123',
        floors: [
          {
            floorNumber: 1,
            floorName: 'Ground Floor',
            rooms: [
              { name: 'Main Lobby', identifier: 'R101', width: 30, height: 20, type: 'Lobby' },
              { name: 'Reception', identifier: 'R102', width: 15, height: 12, type: 'Office' },
              { name: 'Conference Room A', identifier: 'R103', width: 20, height: 16, type: 'Conference Room' },
              { name: 'Storage Room', identifier: 'R104', width: 10, height: 8, type: 'Storage' },
              { name: 'Security Office', identifier: 'R105', width: 12, height: 10, type: 'Office' }
            ]
          },
          {
            floorNumber: 2,
            floorName: 'Office Floor',
            rooms: [
              { name: 'Open Office Area', identifier: 'R201', width: 40, height: 30, type: 'Office' },
              { name: 'Manager Office 1', identifier: 'R202', width: 15, height: 12, type: 'Office' },
              { name: 'Manager Office 2', identifier: 'R203', width: 15, height: 12, type: 'Office' },
              { name: 'Meeting Room B', identifier: 'R204', width: 18, height: 14, type: 'Conference Room' },
              { name: 'Break Room', identifier: 'R205', width: 12, height: 10, type: 'Kitchen' },
              { name: 'IT Storage', identifier: 'R206', width: 8, height: 6, type: 'Storage' }
            ]
          },
          {
            floorNumber: 3,
            floorName: 'Server Floor',
            rooms: [
              { name: 'Main Server Room', identifier: 'R301', width: 25, height: 20, type: 'Server Room' },
              { name: 'Network Operations', identifier: 'R302', width: 20, height: 15, type: 'Office' },
              { name: 'Backup Server Room', identifier: 'R303', width: 15, height: 12, type: 'Server Room' },
              { name: 'Equipment Storage', identifier: 'R304', width: 10, height: 8, type: 'Storage' }
            ]
          }
        ],
        department: {
          name: 'IT Department',
          location: 'New York, NY',
          plan: 'Pro',
          devices: 50
        }
      },
      {
        id: 'test_healthplus_' + Date.now(),
        name: 'HealthPlus Medical Center',
        email: 'admin@healthplus.com',
        password: 'password123',
        floors: [
          {
            floorNumber: 1,
            floorName: 'Ground Floor',
            rooms: [
              { name: 'Main Entrance', identifier: 'H101', width: 25, height: 15, type: 'Lobby' },
              { name: 'Reception Desk', identifier: 'H102', width: 20, height: 12, type: 'Office' },
              { name: 'Waiting Area', identifier: 'H103', width: 30, height: 20, type: 'Other' },
              { name: 'Pharmacy', identifier: 'H104', width: 15, height: 12, type: 'Office' }
            ]
          },
          {
            floorNumber: 2,
            floorName: 'Medical Floor',
            rooms: [
              { name: 'Examination Room 1', identifier: 'H201', width: 12, height: 10, type: 'Office' },
              { name: 'Examination Room 2', identifier: 'H202', width: 12, height: 10, type: 'Office' },
              { name: 'Examination Room 3', identifier: 'H203', width: 12, height: 10, type: 'Office' },
              { name: 'Doctor Office 1', identifier: 'H204', width: 15, height: 12, type: 'Office' },
              { name: 'Doctor Office 2', identifier: 'H205', width: 15, height: 12, type: 'Office' },
              { name: 'Medical Storage', identifier: 'H206', width: 10, height: 8, type: 'Storage' }
            ]
          }
        ],
        department: {
          name: 'Medical Operations',
          location: 'Boston, MA',
          plan: 'Enterprise',
          devices: 75
        }
      },
      {
        id: 'test_edutech_' + Date.now(),
        name: 'EduTech Solutions',
        email: 'admin@edutech.com',
        password: 'password123',
        floors: [
          {
            floorNumber: 1,
            floorName: 'Main Floor',
            rooms: [
              { name: 'Reception Area', identifier: 'E101', width: 20, height: 15, type: 'Lobby' },
              { name: 'Classroom 1', identifier: 'E102', width: 25, height: 20, type: 'Office' },
              { name: 'Classroom 2', identifier: 'E103', width: 25, height: 20, type: 'Office' },
              { name: 'Teacher Lounge', identifier: 'E104', width: 15, height: 12, type: 'Kitchen' },
              { name: 'Admin Office', identifier: 'E105', width: 12, height: 10, type: 'Office' }
            ]
          }
        ],
        department: {
          name: 'Education Technology',
          location: 'San Francisco, CA',
          plan: 'Basic',
          devices: 20
        }
      }
    ];

    // Create organizations with complete setup
    for (const org of organizations) {
      console.log(`\n🏢 Creating organization: ${org.name}`);
      
      // 1. Create organization in organizations table
      const createOrgStmt = db.prepare(`
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      
      createOrgStmt.run(org.id, org.name, now, now);
      console.log(`  ✅ Created organization: ${org.name}`);

      // 2. Create organization user account
      const userAccountId = generateId();
      const createUserStmt = db.prepare(`
        INSERT INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'organization', ?, ?)
      `);
      
      createUserStmt.run(userAccountId, org.email, org.password, org.name, now, now);
      console.log(`  ✅ Created organization user: ${org.email}`);

      // 3. Create floor plan
      const floorPlanId = generateId();
      
      // Process floors to add IDs
      const processedFloors = org.floors.map(floor => ({
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
          position: {
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
            width: room.width,
            height: room.height
          },
          deviceIds: [],
          type: room.type
        }))
      }));

      // Update floor IDs in rooms
      processedFloors.forEach(floor => {
        floor.rooms.forEach(room => {
          room.floorId = floor.id;
        });
      });

      const createFloorPlanStmt = db.prepare(`
        INSERT INTO floor_plans (
          id, organization_id, name, floors, total_floors, approved, approved_by, approved_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, 'system', ?, ?, ?)
      `);
      
      createFloorPlanStmt.run(
        floorPlanId,
        org.id,
        `${org.name} Floor Plan`,
        JSON.stringify(processedFloors),
        org.floors.length,
        now,
        now,
        now
      );
      
      const totalRooms = processedFloors.reduce((total, floor) => total + floor.rooms.length, 0);
      console.log(`  ✅ Created floor plan: ${org.floors.length} floors, ${totalRooms} rooms`);

      // 4. Create department
      const departmentId = generateId();
      const createDeptStmt = db.prepare(`
        INSERT INTO departments (
          id, organization_id, department_name, location, building, floor, devices, plan, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `);
      
      createDeptStmt.run(
        departmentId,
        userAccountId, // Use user account ID for departments
        org.department.name,
        org.department.location,
        'Main Building',
        1,
        org.department.devices,
        org.department.plan,
        now,
        now
      );
      console.log(`  ✅ Created department: ${org.department.name} (${org.department.plan} plan)`);

      // 5. Create sample devices
      const deviceTypes = ['Sensor', 'Gateway', 'Camera', 'PIR', 'DHT22_Temp', 'DHT22_Humidity'];
      const deviceCount = Math.min(org.department.devices, totalRooms * 2); // Max 2 devices per room
      
      console.log(`  📱 Creating ${deviceCount} sample devices...`);
      
      const createDeviceStmt = db.prepare(`
        INSERT INTO devices (
          id, organization_id, floor_plan_id, room_id, name, type, status, 
          position_x, position_y, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `);
      
      let deviceIndex = 0;
      for (const floor of processedFloors) {
        for (const room of floor.rooms) {
          if (deviceIndex >= deviceCount) break;
          
          // Add 1-2 devices per room
          const devicesInRoom = Math.min(2, deviceCount - deviceIndex);
          
          for (let i = 0; i < devicesInRoom; i++) {
            const deviceId = generateId();
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const deviceName = `${deviceType}_${room.identifier}_${i + 1}`;
            
            createDeviceStmt.run(
              deviceId,
              userAccountId, // Use user account ID for devices
              floorPlanId,
              room.id,
              deviceName,
              deviceType,
              Math.floor(Math.random() * room.width),
              Math.floor(Math.random() * room.height),
              now,
              now
            );
            
            deviceIndex++;
          }
          
          if (deviceIndex >= deviceCount) break;
        }
        if (deviceIndex >= deviceCount) break;
      }
      
      console.log(`  ✅ Created ${deviceIndex} devices across ${totalRooms} rooms`);
    }

    // Verify data
    console.log('\n📊 Data Summary:');
    const orgCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'organization'").get().count;
    const deptCount = db.prepare("SELECT COUNT(*) as count FROM departments").get().count;
    const floorPlanCount = db.prepare("SELECT COUNT(*) as count FROM floor_plans").get().count;
    const deviceCount = db.prepare("SELECT COUNT(*) as count FROM devices").get().count;
    
    console.log(`  - Organizations: ${orgCount}`);
    console.log(`  - Departments: ${deptCount}`);
    console.log(`  - Floor Plans: ${floorPlanCount}`);
    console.log(`  - Devices: ${deviceCount}`);
    
    console.log('\n✅ Complete test data populated successfully!');
    
    // Re-enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
  } catch (error) {
    console.error('❌ Failed to populate test data:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

populateCompleteTestData();