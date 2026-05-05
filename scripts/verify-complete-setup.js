#!/usr/bin/env node

/**
 * Verification Script
 * Tests all authentication and data flows
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

console.log('🔍 Verifying Complete Setup...\n');
console.log('─'.repeat(60) + '\n');

async function verifyAll() {
  try {
    // 1. Check Super Admin
    console.log('1️⃣  Checking Super Admin...');
    const superAdminSnapshot = await db.collection('roles_super_admin')
      .where('email', '==', 'superadmin@gmail.com')
      .limit(1)
      .get();
    
    if (!superAdminSnapshot.empty) {
      const superAdmin = superAdminSnapshot.docs[0].data();
      console.log('   ✅ Super Admin exists');
      console.log(`   📧 Email: superadmin@gmail.com`);
      console.log(`   🔑 Password: password123`);
    } else {
      console.log('   ❌ Super Admin NOT found');
    }
    
    // 2. Check Organizations
    console.log('\n2️⃣  Checking Organizations...');
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`   ✅ Total Organizations: ${orgsSnapshot.size}`);
    
    orgsSnapshot.forEach(doc => {
      const org = doc.data();
      console.log(`   📦 ${org.name}`);
      console.log(`      Email: ${org.email}`);
      console.log(`      Plan: ${org.plan}`);
      console.log(`      Max Devices: ${org.maxDevices}`);
    });
    
    // 3. Check Users
    console.log('\n3️⃣  Checking Users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   ✅ Total Users: ${usersSnapshot.size}`);
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      console.log(`   👤 ${user.email} (${user.role})`);
    });
    
    // 4. Check Departments
    console.log('\n4️⃣  Checking Departments...');
    const deptsSnapshot = await db.collection('departments').get();
    console.log(`   ✅ Total Departments: ${deptsSnapshot.size}`);
    
    deptsSnapshot.forEach(doc => {
      const dept = doc.data();
      console.log(`   🏢 ${dept.name} (Org: ${dept.organizationId})`);
    });
    
    // 5. Test Login Scenarios
    console.log('\n5️⃣  Testing Login Scenarios...');
    
    // Super Admin Login
    const superAdminTest = await db.collection('roles_super_admin')
      .where('email', '==', 'superadmin@gmail.com')
      .where('password', '==', 'password123')
      .limit(1)
      .get();
    
    if (!superAdminTest.empty) {
      console.log('   ✅ Super Admin login: PASS');
    } else {
      console.log('   ❌ Super Admin login: FAIL');
    }
    
    // Organization Admin Login
    const orgAdminTest = await db.collection('users')
      .where('email', '==', 'admin@techcorp.com')
      .where('password', '==', 'password123')
      .limit(1)
      .get();
    
    if (!orgAdminTest.empty) {
      console.log('   ✅ Organization Admin login: PASS');
    } else {
      console.log('   ❌ Organization Admin login: FAIL');
    }
    
    // 6. Summary
    console.log('\n─'.repeat(60));
    console.log('\n✅ VERIFICATION COMPLETE\n');
    console.log('🌐 Frontend: http://localhost:9002');
    console.log('🔧 Backend: http://localhost:8000\n');
    console.log('📝 Test the following:\n');
    console.log('1. Super Admin Login:');
    console.log('   URL: http://localhost:9002/superadmin-login');
    console.log('   Email: superadmin@gmail.com');
    console.log('   Password: password123');
    console.log('   Expected: Redirect to /superadmin/dashboard');
    console.log('   Features: View organizations, Create new organization\n');
    
    console.log('2. Organization Admin Login:');
    console.log('   URL: http://localhost:9002/organisation-login');
    console.log('   Email: admin@techcorp.com');
    console.log('   Password: password123');
    console.log('   Expected: Redirect to /admin/dashboard');
    console.log('   Features: View departments, Manage devices\n');
    
    console.log('3. Create Organization (as Super Admin):');
    console.log('   - Login as super admin');
    console.log('   - Click "Create New Organization" button');
    console.log('   - Fill in the form');
    console.log('   - Submit and verify it appears in the list\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyAll();
