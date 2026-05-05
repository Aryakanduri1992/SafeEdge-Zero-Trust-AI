// Test the complete organization creation wizard API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:9002';

async function testCompleteWizard() {
  console.log('🧪 Testing Complete Organization Creation Wizard...\n');

  const testData = {
    // Step 1: Organization Info
    organizationName: 'Advanced Test Corp',
    email: 'admin@advancedtest.com',
    password: 'secure123',
    description: 'Testing advanced room management features',
    
    // Step 2: Building Structure
    totalFloors: 3,
    buildingName: 'Advanced Tech Building',
    buildingAddress: '123 Innovation Drive, Tech City',
    
    // Step 3: Floor & Room Data (using advanced features)
    floors: [
      {
        floorNumber: 1,
        floorName: 'Ground Floor',
        rooms: [
          // Using room templates and presets
          { name: 'Reception Area', identifier: 'R101', width: 20, height: 15, type: 'Lobby' },
          { name: 'Conference Room Alpha', identifier: 'R102', width: 20, height: 14, type: 'Conference Room' },
          { name: 'Open Office Space', identifier: 'R103', width: 30, height: 20, type: 'Office' },
          { name: 'Storage Room', identifier: 'R104', width: 8, height: 6, type: 'Storage' }
        ]
      },
      {
        floorNumber: 2,
        floorName: 'Second Floor',
        rooms: [
          // Bulk created rooms
          { name: 'Office 201', identifier: 'R201', width: 12, height: 10, type: 'Office' },
          { name: 'Office 202', identifier: 'R202', width: 12, height: 10, type: 'Office' },
          { name: 'Office 203', identifier: 'R203', width: 12, height: 10, type: 'Office' },
          { name: 'Meeting Room Beta', identifier: 'R204', width: 16, height: 12, type: 'Conference Room' },
          { name: 'Server Room', identifier: 'R205', width: 10, height: 8, type: 'Server Room' }
        ]
      },
      {
        floorNumber: 3,
        floorName: 'Third Floor',
        rooms: [
          // Mixed room types
          { name: 'Executive Office', identifier: 'R301', width: 16, height: 12, type: 'Office' },
          { name: 'Board Room', identifier: 'R302', width: 24, height: 16, type: 'Conference Room' },
          { name: 'Kitchen', identifier: 'R303', width: 12, height: 8, type: 'Kitchen' },
          { name: 'Break Room', identifier: 'R304', width: 14, height: 10, type: 'Other' }
        ]
      }
    ],
    
    // Step 4: Department
    departmentName: 'Advanced Technology Division',
    location: 'Building A, Floor 2',
    plan: 'Enterprise',
    devices: 150
  };

  try {
    console.log('📤 Sending organization creation request...');
    console.log(`   Organization: ${testData.organizationName}`);
    console.log(`   Floors: ${testData.totalFloors}`);
    console.log(`   Total Rooms: ${testData.floors.reduce((total, floor) => total + floor.rooms.length, 0)}`);
    console.log(`   Plan: ${testData.plan}`);
    console.log(`   Devices: ${testData.devices}\n`);

    const response = await fetch(`${API_BASE}/api/superadmin/organizations/complete-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCCESS! Organization created successfully\n');
      console.log('📊 Response Data:');
      console.log(`   - Organization ID: ${result.data.organizationId}`);
      console.log(`   - User Account ID: ${result.data.userAccountId}`);
      console.log(`   - Organization Name: ${result.data.organizationName}`);
      console.log(`   - Floor Plan ID: ${result.data.floorPlanId}`);
      console.log(`   - Department ID: ${result.data.departmentId}`);
      console.log(`   - Total Floors: ${result.data.totalFloors}`);
      console.log(`   - Total Rooms: ${result.data.totalRooms}`);
      console.log(`   - Email: ${result.data.email}`);

      // Calculate some statistics
      const totalArea = testData.floors.reduce((total, floor) => 
        total + floor.rooms.reduce((floorTotal, room) => 
          floorTotal + (room.width * room.height), 0
        ), 0
      );

      const avgRoomSize = Math.round(totalArea / result.data.totalRooms);
      const roomTypes = {};
      testData.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          roomTypes[room.type] = (roomTypes[room.type] || 0) + 1;
        });
      });

      console.log('\n📈 Statistics:');
      console.log(`   - Total Area: ${totalArea.toLocaleString()} sq ft`);
      console.log(`   - Average Room Size: ${avgRoomSize} sq ft`);
      console.log(`   - Room Types:`);
      Object.entries(roomTypes).forEach(([type, count]) => {
        console.log(`     • ${type}: ${count} rooms`);
      });

      console.log('\n🎉 Complete Organization Creation Wizard Test - PASSED');
      
      return result.data;
    } else {
      console.log('❌ FAILED! Organization creation failed');
      console.log('Error:', result.error || 'Unknown error');
      console.log('Response:', result);
      return null;
    }

  } catch (error) {
    console.log('❌ ERROR! Request failed');
    console.log('Error:', error.message);
    return null;
  }
}

// Run the test
testCompleteWizard()
  .then(result => {
    if (result) {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });