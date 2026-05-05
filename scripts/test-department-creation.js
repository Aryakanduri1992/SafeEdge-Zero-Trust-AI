const testData = {
  organizationId: "jb3km8qopcmjh3odnw", // Use the user account ID from our test
  departmentName: "Test Department API",
  location: "Test City",
  building: "Test Building",
  floor: 1,
  devices: 15,
  plan: "Basic"
};

async function testDepartmentAPI() {
  try {
    console.log('🧪 Testing department creation API...');
    
    const response = await fetch('http://localhost:9002/api/superadmin/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Department API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Department API test failed!');
      console.log('Error:', result);
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testDepartmentAPI();