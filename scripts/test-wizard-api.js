const testData = {
  organizationName: "Test Wizard Org",
  email: "test@wizard.com",
  password: "password123",
  description: "Test organization created via wizard",
  totalFloors: 1,
  buildingName: "Test Building",
  floors: [
    {
      floorNumber: 1,
      floorName: "Ground Floor",
      rooms: [
        {
          name: "Test Room",
          identifier: "TR001",
          width: 10,
          height: 8,
          type: "Office"
        }
      ]
    }
  ],
  departmentName: "Test Department",
  location: "Test City",
  plan: "Basic",
  devices: 5
};

async function testWizardAPI() {
  try {
    console.log('🧪 Testing wizard API...');
    
    const response = await fetch('http://localhost:9002/api/superadmin/organizations/complete-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Wizard API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Wizard API test failed!');
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testWizardAPI();