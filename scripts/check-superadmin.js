// Script to check SuperAdmin credentials from Firestore
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for SuperAdmin credentials in Firestore...\n');

    // Check users collection
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'superadmin')
      .limit(10)
      .get();

    if (!usersSnapshot.empty) {
      console.log('✅ Found SuperAdmin(s) in "users" collection:\n');
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📧 Email: ${data.email || 'N/A'}`);
        console.log(`🔑 Password: ${data.password ? '[HASHED]' : 'N/A'}`);
        console.log(`👤 Role: ${data.role || 'N/A'}`);
        console.log(`🆔 User ID: ${doc.id}`);
        console.log(`📅 Created: ${data.createdAt || 'N/A'}`);
        console.log('---');
      });
    } else {
      console.log('❌ No SuperAdmin found in "users" collection');
    }

    // Check admins collection
    const adminsSnapshot = await db.collection('admins').limit(10).get();
    
    if (!adminsSnapshot.empty) {
      console.log('\n✅ Found admin(s) in "admins" collection:\n');
      adminsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📧 Email: ${data.email || 'N/A'}`);
        console.log(`🔑 Password: ${data.password ? '[HASHED]' : 'N/A'}`);
        console.log(`👤 Role: ${data.role || 'N/A'}`);
        console.log(`🆔 Admin ID: ${doc.id}`);
        console.log('---');
      });
    } else {
      console.log('\n❌ No documents found in "admins" collection');
    }

    // Check organizations collection for superadmin
    const orgsSnapshot = await db.collection('organizations')
      .where('email', '==', 'admin@test.com')
      .limit(1)
      .get();

    if (!orgsSnapshot.empty) {
      console.log('\n✅ Found SuperAdmin in "organizations" collection:\n');
      orgsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📧 Email: ${data.email || 'N/A'}`);
        console.log(`🔑 Password: ${data.password ? '[HASHED]' : 'N/A'}`);
        console.log(`🏢 Name: ${data.name || 'N/A'}`);
        console.log(`🆔 Org ID: ${doc.id}`);
        console.log('---');
      });
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking SuperAdmin:', error);
    process.exit(1);
  }
}

checkSuperAdmin();
