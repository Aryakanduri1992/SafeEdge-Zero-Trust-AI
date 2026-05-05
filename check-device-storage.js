const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();
const rtdb = admin.database();

async function checkDeviceStorage() {
  console.log('🔍 Checking Device Storage Locations...\n');
  console.log('=' .repeat(60));
  
  try {
    // Check Firestore - organizations/{orgId}/devices
    console.log('\n📋 FIRESTORE - organizations/{orgId}/devices:\n');
    const orgsSnapshot = await db.collection('organizations').get();
    
    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      console.log(`\n✅ Organization: ${orgData.name} (${orgDoc.id})`);
      
      const devicesSnapshot = await db.collection('organizations')
        .doc(orgDoc.id)
        .collection('devices')
        .get();
      
      console.log(`   Found ${devicesSnapshot.size} devices in subcollection`);
      
      devicesSnapshot.forEach(deviceDoc => {
        const deviceData = deviceDoc.data();
        console.log(`   - Device: ${deviceData.name || deviceData.device_name || 'N/A'}`);
        console.log(`     ID: ${deviceDoc.id}`);
        console.log(`     Type: ${deviceData.type || deviceData.device_type || 'N/A'}`);
        console.log(`     ESP32 ID: ${deviceData.esp32DeviceId || deviceData.device_id || 'N/A'}`);
      });
    }
    
    // Check Firestore - devices collection (top level)
    console.log('\n\n📋 FIRESTORE - devices (top level):\n');
    const topLevelDevices = await db.collection('devices').get();
    console.log(`Found ${topLevelDevices.size} devices in top-level collection`);
    
    topLevelDevices.forEach(deviceDoc => {
      const deviceData = deviceDoc.data();
      console.log(`\n- Device: ${deviceData.name || deviceData.device_name || 'N/A'}`);
      console.log(`  ID: ${deviceDoc.id}`);
      console.log(`  Organization: ${deviceData.organizationId || deviceData.organization_id || 'N/A'}`);
      console.log(`  Type: ${deviceData.type || deviceData.device_type || 'N/A'}`);
    });
    
    // Check Firebase Realtime Database
    console.log('\n\n📋 FIREBASE REALTIME DATABASE:\n');
    
    // Check devices path
    const devicesRef = rtdb.ref('devices');
    const devicesSnapshot = await devicesRef.once('value');
    const devicesData = devicesSnapshot.val();
    
    if (devicesData) {
      console.log(`Found ${Object.keys(devicesData).length} devices in /devices path`);
      Object.keys(devicesData).forEach(deviceId => {
        const device = devicesData[deviceId];
        console.log(`\n- Device ID: ${deviceId}`);
        console.log(`  Info:`, device.info || 'N/A');
        console.log(`  Has sensor_data: ${!!device.sensor_data}`);
        console.log(`  Has provisioning: ${!!device.provisioning}`);
      });
    } else {
      console.log('No devices found in /devices path');
    }
    
    // Check provisioning_tokens path
    const tokensRef = rtdb.ref('provisioning_tokens');
    const tokensSnapshot = await tokensRef.once('value');
    const tokensData = tokensSnapshot.val();
    
    if (tokensData) {
      console.log(`\n\nFound ${Object.keys(tokensData).length} provisioning tokens`);
      Object.keys(tokensData).slice(0, 3).forEach(token => {
        console.log(`- Token: ${token.substring(0, 20)}...`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Device storage check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDeviceStorage();
