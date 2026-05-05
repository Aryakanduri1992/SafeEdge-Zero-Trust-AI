// Script to create Firebase Auth user for an organization
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

const auth = admin.auth();
const db = admin.firestore();

async function createAuthUser(email, password) {
  try {
    console.log(`🔍 Checking if user exists: ${email}`);
    
    // Check if user already exists in Auth
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`✅ User already exists in Firebase Auth: ${existingUser.uid}`);
      return existingUser.uid;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      console.log(`📝 User not found in Auth, creating new user...`);
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true,
    });

    console.log(`✅ Firebase Auth user created: ${userRecord.uid}`);

    // Get organization from Firestore
    const orgSnapshot = await db.collection('organizations')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!orgSnapshot.empty) {
      const orgDoc = orgSnapshot.docs[0];
      const orgData = orgDoc.data();
      
      // Create user profile in Firestore users collection
      await db.collection('users').doc(userRecord.uid).set({
        email: email,
        role: 'admin',
        organizationId: orgDoc.id,
        organizationName: orgData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ User profile created in Firestore`);
      console.log(`\n🎉 Success! You can now login with:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Organization: ${orgData.name}`);
    } else {
      console.log(`⚠️  Organization not found in Firestore for email: ${email}`);
    }

    return userRecord.uid;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node create-firebase-auth-user.js <email> <password>');
  console.log('Example: node create-firebase-auth-user.js rvu@gmail.com Arya@1992');
  process.exit(1);
}

createAuthUser(email, password)
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
