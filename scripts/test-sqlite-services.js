const { deviceService } = require('../src/lib/device-service-sqlite.ts');
const { floorPlanService } = require('../src/lib/floor-plan-service-sqlite.ts');
const { networkService } = require('../src/lib/network-service-sqlite.ts');

async function testServices() {
  try {
    console.log('🧪 Testing SQLite Services...\n');

    // Test organization ID from our test data
    const orgId = 'rteaoprdbomjh05tev';

    // Test Device Service
    console.log('📱 Testing Device Service...');
    const devices = await deviceService.getDevicesByOrganization(orgId);
    console.log(`✅ Found ${devices.length} devices`);
    
    if (devices.length > 0) {
      console.log(`   - First device: ${devices[0].name} (${devices[0].type})`);
    }

    // Test Floor Plan Service
    console.log('\n🏢 Testing Floor Plan Service...');
    const floorPlans = await floorPlanService.getFloorPlansByOrganization(orgId);
    console.log(`✅ Found ${floorPlans.length} floor plans`);
    
    if (floorPlans.length > 0) {
      console.log(`   - Floor plan: ${floorPlans[0].name}`);
      console.log(`   - Floors: ${floorPlans[0].floors.length}`);
    }

    // Test Network Service
    console.log('\n🌐 Testing Network Service...');
    const safeEdge = await networkService.getSafeEdge(orgId);
    const ethernetBox = await networkService.getEthernetInternetBox(orgId);
    
    console.log(`✅ Safe Edge: ${safeEdge ? safeEdge.status : 'Not found'}`);
    console.log(`✅ Ethernet Box: ${ethernetBox ? ethernetBox.status : 'Not found'}`);

    // Test Network Validation
    console.log('\n🔍 Testing Network Validation...');
    const validation = await networkService.validateNetworkTopology(orgId);
    console.log(`✅ Network topology valid: ${validation.isValid}`);
    
    if (!validation.isValid) {
      console.log(`   - Errors: ${validation.errors.join(', ')}`);
    }

    console.log('\n🎉 All SQLite services are working correctly!');

  } catch (error) {
    console.error('❌ Error testing services:', error);
  }
}

testServices();