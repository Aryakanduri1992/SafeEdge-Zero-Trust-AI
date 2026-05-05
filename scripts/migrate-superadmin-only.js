#!/usr/bin/env node

/**
 * Super Admin Only Migration Script
 * Creates super admin user in Firebase Auth and Firestore
 */

const admin = require('firebase-admin');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();
const auth = admin.auth();

// Open SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const sqlite = new Database(dbPath, { readonly: true });

console.log('🚀 Migrating Super Admin to Firebase...\n');
console.log(`📊 Database: ${dbPath}`);
console.log(`🔥 Firebase Project: ${serviceAccount.project_id}\n`);
console.log('─'.repeat(50) + '\n');

async function migrateSuperAdmin() {
  try {
    // Get super admin from SQLite
    const superAdmin = sqlite.prepare(`
      SELECT * FROM users WHERE role = 'super_admin' LIMIT 1
    `).get();

    if (!superAdmin) {
      console.log('❌ No super admin found in SQLite database');
      process.exit(1);
    }

    console.log('👤 Found Super Admin:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Role: ${superAdmin.role}\n`);

    // Create Firebase Auth user
    console.log('🔐 Creating Firebase Auth user...');
    try {
      const userRecord = await auth.createUser({
        uid: superAdmin.id,
        email: superAdmin.email,
        password: superAdmin.password || 'SuperAdmin123!',
        displayName: 'Super Administrator'
      });
      console.log(`   ✅ Created auth user: ${userRecord.email}`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.log(`   ⚠️  Auth user already exists, updating...`);
        await auth.updateUser(superAdmin.id, {
          email: superAdmin.email,
          displayName: 'Super Administrator'
        });
      } else if (error.code === 'auth/email-already-exists') {
        console.log(`   ⚠️  Email already exists in Firebase Auth`);
      } else {
        throw error;
      }
    }

    // Create Firestore document in roles_super_admin collection
    console.log('\n📝 Creating Firestore document...');
    await db.collection('roles_super_admin').doc(superAdmin.id).set({
      email: superAdmin.email,
      departmentName: 'System Administration',
      createdAt: superAdmin.created_at || new Date().toISOString(),
      role: 'superadmin'
    });
    console.log(`   ✅ Created roles_super_admin document`);

    console.log('\n' + '─'.repeat(50));
    console.log('\n✅ Super Admin Migration Complete!\n');
    console.log('🎯 Login Credentials:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${superAdmin.password || 'SuperAdmin123!'}`);
    console.log(`   Role: Super Admin\n`);
    console.log('📍 Next Steps:');
    console.log('   1. Start your frontend server');
    console.log('   2. Go to /superadmin-login');
    console.log('   3. Login with the credentials above');
    console.log('   4. Create organizations from the dashboard\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    sqlite.close();
    process.exit(0);
  }
}

// Run migration
migrateSuperAdmin();
