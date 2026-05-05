#!/usr/bin/env node

/**
 * Create Sample Organization in Firestore
 * Creates one complete organization with all necessary data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

console.log('🚀 Creating Sample Organization in Firestore...\n');
console.log(`🔥 Firebase Project: ${serviceAccount.project_id}\n`);
console.log('─'.repeat(60) + '\n');

// Sample organization data
const sampleOrg = {
  id: 'techcorp-2026',
  email: 'admin@techcorp.com',
  password: 'password123',
  name: 'TechCorp Industries',
  plan: 'pro',
  maxDevices: 100
};

/**
 * Create organization in Firestore
 */
async function createOrganization() {
  console.log('📦 Creating organization...');
  
  try {
    // Check if organization already exists
    const existingOrg = await db.collection('organizations').doc(sampleOrg.id).get();
    
    if (existingOrg.exists) {
      console.log(`  ⚠️  Organization already exists, updating...`);
    }
    
    // Create/Update organization document
    await db.collection('organizations').doc(sampleOrg.id).set({
      email: sampleOrg.email,
      password: sampleOrg.password,
      name: sampleOrg.name,
      plan: sampleOrg.plan,
      maxDevices: sampleOrg.maxDevices,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    console.log(`  ✅ Created organization: ${sampleOrg.name}`);
    console.log(`  📧 Email: ${sampleOrg.email}`);
    console.log(`  🔑 Password: ${sampleOrg.password}`);
    console.log(`  📋 Plan: ${sampleOrg.plan}`);
    console.log(`  📱 Max Devices: ${sampleOrg.maxDevices}\n`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating organization: ${error.message}`);
    return false;
  }
}

/**
 * Create user entry for authentication
 */
async function createUserEntry() {
  console.log('👤 Creating user entry for authentication...');
  
  try {
    // Check if user already exists
    const existingUser = await db.collection('users')
      .where('email', '==', sampleOrg.email)
      .limit(1)
      .get();
    
    if (!existingUser.empty) {
      console.log(`  ⚠️  User already exists, skipping...\n`);
      return true;
    }
    
    // Create user entry
    await db.collection('users').add({
      email: sampleOrg.email,
      password: sampleOrg.password,
      role: 'admin',
      organizationName: sampleOrg.name,
      organizationId: sampleOrg.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`  ✅ Created user entry for authentication\n`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating user entry: ${error.message}`);
    return false;
  }
}

/**
 * Create sample departments
 */
async function createDepartments() {
  console.log('🏢 Creating sample departments...');
  
  const departments = [
    {
      id: `${sampleOrg.id}-dept-it`,
      name: 'IT Department',
      organizationId: sampleOrg.id,
      plan: 'pro',
      maxDevices: 30,
      floors: 2,
      rooms: 10,
      totalArea: 500,
      isActive: true
    },
    {
      id: `${sampleOrg.id}-dept-security`,
      name: 'Security Department',
      organizationId: sampleOrg.id,
      plan: 'pro',
      maxDevices: 20,
      floors: 1,
      rooms: 5,
      totalArea: 300,
      isActive: true
    }
  ];
  
  try {
    const batch = db.batch();
    
    for (const dept of departments) {
      const docRef = db.collection('departments').doc(dept.id);
      batch.set(docRef, {
        ...dept,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log(`  ✅ Created ${departments.length} departments\n`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating departments: ${error.message}`);
    return false;
  }
}

/**
 * Verify creation
 */
async function verifyCreation() {
  console.log('✔️  Verifying creation...');
  
  try {
    // Check organization
    const orgDoc = await db.collection('organizations').doc(sampleOrg.id).get();
    if (orgDoc.exists) {
      console.log(`  ✅ Organization: ${orgDoc.data().name}`);
    }
    
    // Check user
    const userSnapshot = await db.collection('users')
      .where('email', '==', sampleOrg.email)
      .limit(1)
      .get();
    
    if (!userSnapshot.empty) {
      console.log(`  ✅ User entry: ${sampleOrg.email}`);
    }
    
    // Check departments
    const deptSnapshot = await db.collection('departments')
      .where('organizationId', '==', sampleOrg.id)
      .get();
    
    console.log(`  ✅ Departments: ${deptSnapshot.size}`);
    
    // Check super admin
    const superAdminSnapshot = await db.collection('roles_super_admin')
      .where('email', '==', 'superadmin@gmail.com')
      .limit(1)
      .get();
    
    if (!superAdminSnapshot.empty) {
      console.log(`  ✅ Super admin: superadmin@gmail.com\n`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error verifying: ${error.message}`);
    return false;
  }
}

/**
 * Display summary
 */
async function displaySummary() {
  console.log('─'.repeat(60));
  console.log('\n📊 FIRESTORE DATA SUMMARY\n');
  
  try {
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`Organizations: ${orgsSnapshot.size}`);
    
    const usersSnapshot = await db.collection('users').get();
    console.log(`Users: ${usersSnapshot.size}`);
    
    const deptsSnapshot = await db.collection('departments').get();
    console.log(`Departments: ${deptsSnapshot.size}`);
    
    const superAdminsSnapshot = await db.collection('roles_super_admin').get();
    console.log(`Super Admins: ${superAdminsSnapshot.size}`);
    
    console.log('\n🎉 Setup Complete!\n');
    console.log('📝 LOGIN CREDENTIALS:\n');
    console.log('Super Admin:');
    console.log('  Email: superadmin@gmail.com');
    console.log('  Password: password123');
    console.log('  URL: http://localhost:9002/superadmin-login\n');
    console.log('Organization Admin:');
    console.log(`  Email: ${sampleOrg.email}`);
    console.log(`  Password: ${sampleOrg.password}`);
    console.log('  URL: http://localhost:9002/organisation-login\n');
    console.log('✨ You can now:');
    console.log('  1. Login as super admin and create more organizations');
    console.log('  2. Login as organization admin and manage departments/devices');
    console.log('  3. Test the complete authentication flow\n');
    
  } catch (error) {
    console.error('Error displaying summary:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createOrganization();
    await createUserEntry();
    await createDepartments();
    await verifyCreation();
    await displaySummary();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run
main();
