#!/usr/bin/env node

/**
 * Complete Organization Migration Script
 * Seeds one organization in SQLite and migrates it to Firestore
 */

const admin = require('firebase-admin');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

// Open SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const sqlite = new Database(dbPath);

console.log('🚀 Starting Complete Organization Migration...\n');
console.log(`📊 SQLite Database: ${dbPath}`);
console.log(`🔥 Firebase Project: ${serviceAccount.project_id}\n`);
console.log('─'.repeat(60) + '\n');

// Sample organization data
const sampleOrg = {
  id: 'ukg9f2q0xlmjh3lsot',
  email: 'admin@techcorp.com',
  password: 'password123',
  name: 'TechCorp Industries',
  plan: 'pro',
  max_devices: 100
};

/**
 * Step 1: Seed organization in SQLite
 */
function seedOrganizationInSQLite() {
  console.log('📦 Step 1: Seeding organization in SQLite...');
  
  try {
    const insertOrg = sqlite.prepare(`
      INSERT OR REPLACE INTO organizations (id, email, password, name, plan, max_devices, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    insertOrg.run(
      sampleOrg.id,
      sampleOrg.email,
      sampleOrg.password,
      sampleOrg.name,
      sampleOrg.plan,
      sampleOrg.max_devices
    );
    
    console.log(`  ✅ Seeded: ${sampleOrg.name} (${sampleOrg.email})`);
    console.log(`  📧 Email: ${sampleOrg.email}`);
    console.log(`  🔑 Password: ${sampleOrg.password}`);
    console.log(`  📋 Plan: ${sampleOrg.plan}`);
    console.log(`  📱 Max Devices: ${sampleOrg.max_devices}\n`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error seeding organization: ${error.message}`);
    return false;
  }
}

/**
 * Step 2: Migrate organization to Firestore
 */
async function migrateOrganizationToFirestore() {
  console.log('🔥 Step 2: Migrating organization to Firestore...');
  
  try {
    // Get organization from SQLite
    const org = sqlite.prepare('SELECT * FROM organizations WHERE id = ?').get(sampleOrg.id);
    
    if (!org) {
      throw new Error('Organization not found in SQLite');
    }
    
    // Check if organization already exists in Firestore
    const existingOrg = await db.collection('organizations').doc(org.id).get();
    
    if (existingOrg.exists) {
      console.log(`  ⚠️  Organization already exists in Firestore, updating...`);
    }
    
    // Create/Update organization document in Firestore
    await db.collection('organizations').doc(org.id).set({
      email: org.email,
      password: org.password,
      name: org.name,
      plan: org.plan || 'basic',
      maxDevices: org.max_devices || 50,
      createdAt: org.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
    
    console.log(`  ✅ Migrated organization to Firestore`);
    
    // Also add to users collection for unified authentication
    await db.collection('users').add({
      email: org.email,
      password: org.password,
      role: 'admin',
      organizationName: org.name,
      organizationId: org.id,
      createdAt: new Date().toISOString()
    });
    
    console.log(`  ✅ Created user entry for authentication\n`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error migrating to Firestore: ${error.message}`);
    return false;
  }
}

/**
 * Step 3: Verify migration
 */
async function verifyMigration() {
  console.log('✔️  Step 3: Verifying migration...');
  
  try {
    // Check SQLite
    const sqliteOrg = sqlite.prepare('SELECT * FROM organizations WHERE id = ?').get(sampleOrg.id);
    console.log(`  ✅ SQLite: Found organization "${sqliteOrg.name}"`);
    
    // Check Firestore organizations collection
    const firestoreOrg = await db.collection('organizations').doc(sampleOrg.id).get();
    if (firestoreOrg.exists) {
      console.log(`  ✅ Firestore (organizations): Found organization "${firestoreOrg.data().name}"`);
    } else {
      console.log(`  ❌ Firestore (organizations): Organization not found`);
    }
    
    // Check Firestore users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', sampleOrg.email)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      console.log(`  ✅ Firestore (users): Found user entry for authentication`);
    } else {
      console.log(`  ❌ Firestore (users): User entry not found`);
    }
    
    // Check super admin still exists
    const superAdminSnapshot = await db.collection('roles_super_admin')
      .where('email', '==', 'superadmin@gmail.com')
      .limit(1)
      .get();
    
    if (!superAdminSnapshot.empty) {
      console.log(`  ✅ Firestore: Super admin still exists\n`);
    } else {
      console.log(`  ⚠️  Firestore: Super admin not found\n`);
    }
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error verifying migration: ${error.message}`);
    return false;
  }
}

/**
 * Step 4: Display summary
 */
async function displaySummary() {
  console.log('─'.repeat(60));
  console.log('\n📊 MIGRATION SUMMARY\n');
  
  try {
    // Count organizations in Firestore
    const orgsSnapshot = await db.collection('organizations').get();
    console.log(`Organizations in Firestore: ${orgsSnapshot.size}`);
    
    // Count users in Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`Users in Firestore: ${usersSnapshot.size}`);
    
    // Count super admins in Firestore
    const superAdminsSnapshot = await db.collection('roles_super_admin').get();
    console.log(`Super Admins in Firestore: ${superAdminsSnapshot.size}`);
    
    console.log('\n🎉 Migration Complete!\n');
    console.log('📝 LOGIN CREDENTIALS:\n');
    console.log('Super Admin:');
    console.log('  Email: superadmin@gmail.com');
    console.log('  Password: password123');
    console.log('  URL: http://localhost:9002/superadmin-login\n');
    console.log('Organization Admin:');
    console.log(`  Email: ${sampleOrg.email}`);
    console.log(`  Password: ${sampleOrg.password}`);
    console.log('  URL: http://localhost:9002/organisation-login\n');
    
  } catch (error) {
    console.error('Error displaying summary:', error.message);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    // Step 1: Seed in SQLite
    const seeded = seedOrganizationInSQLite();
    if (!seeded) {
      throw new Error('Failed to seed organization in SQLite');
    }
    
    // Step 2: Migrate to Firestore
    const migrated = await migrateOrganizationToFirestore();
    if (!migrated) {
      throw new Error('Failed to migrate to Firestore');
    }
    
    // Step 3: Verify
    await verifyMigration();
    
    // Step 4: Summary
    await displaySummary();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
    process.exit(0);
  }
}

// Run migration
migrate();
