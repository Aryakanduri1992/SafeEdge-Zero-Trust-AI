const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function testFirestoreLogin() {
  console.log('🔍 Testing Firestore Authentication...\n');
  
  try {
    // Check organizations collection
    console.log('📋 Checking organizations collection...');
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`Found ${orgsSnapshot.size} organizations:\n`);
    
    orgsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`✅ Organization: ${data.name || 'N/A'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Password: ${data.password ? '***' : 'NOT SET'}`);
      console.log('');
    });
    
    // Check users collection
    console.log('\n📋 Checking users collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users:\n`);
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`✅ User: ${data.email || 'N/A'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Organization: ${data.organizationName || 'N/A'}`);
      console.log(`   Password: ${data.password ? '***' : 'NOT SET'}`);
      console.log('');
    });
    
    // Check super admin collection
    console.log('\n📋 Checking roles_super_admin collection...');
    const superAdminSnapshot = await db.collection('roles_super_admin').get();
    console.log(`Found ${superAdminSnapshot.size} super admins:\n`);
    
    superAdminSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`✅ Super Admin: ${data.email || 'N/A'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Department: ${data.departmentName || 'N/A'}`);
      console.log(`   Password: ${data.password ? '***' : 'NOT SET'}`);
      console.log('');
    });
    
    console.log('\n✅ Firestore connection successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testFirestoreLogin();
