#!/usr/bin/env node

/**
 * Super Admin Firestore-Only Migration
 * Stores super admin data in Firestore without Firebase Auth
 * Authentication will be handled via Firestore queries
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

// Open SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const sqlite = new Database(dbPath, { readonly: true });

console.log('🚀 Migrating Super Admin to Firestore (Data Only)...\n');
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

    // Store in Firestore - roles_super_admin collection
    console.log('📝 Creating Firestore document in roles_super_admin...');
    await db.collection('roles_super_admin').doc(superAdmin.id).set({
      email: superAdmin.email,
      password: superAdmin.password_hash || 'password123', // Store password for authentication
      departmentName: superAdmin.organization_name || 'System Administration',
      role: 'superadmin',
      createdAt: superAdmin.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`   ✅ Created roles_super_admin/${superAdmin.id}`);

    // Also store in users collection for easier querying
    console.log('\n📝 Creating Firestore document in users...');
    await db.collection('users').doc(superAdmin.id).set({
      email: superAdmin.email,
      password: superAdmin.password_hash || 'password123',
      role: 'superadmin',
      organizationName: superAdmin.organization_name,
      organizationId: null,
      createdAt: superAdmin.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`   ✅ Created users/${superAdmin.id}`);

    console.log('\n' + '─'.repeat(50));
    console.log('\n✅ Super Admin Migration Complete!\n');
    console.log('📊 Data Stored in Firestore:');
    console.log(`   Collection: roles_super_admin`);
    console.log(`   Collection: users`);
    console.log(`   Document ID: ${superAdmin.id}\n`);
    console.log('🎯 Login Credentials:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${superAdmin.password_hash || 'password123'}`);
    console.log(`   Role: Super Admin\n`);
    console.log('📍 Next Steps:');
    console.log('   1. Update your app to use Firestore for authentication');
    console.log('   2. Start your frontend server');
    console.log('   3. Go to /superadmin-login');
    console.log('   4. Login with the credentials above\n');
    console.log('💡 Note: Authentication is handled via Firestore queries,');
    console.log('   not Firebase Auth. This is simpler and works immediately!\n');

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
