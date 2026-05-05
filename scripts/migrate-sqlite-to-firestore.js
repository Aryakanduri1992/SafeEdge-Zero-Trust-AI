#!/usr/bin/env node

/**
 * SQLite to Firestore Migration Script
 * Migrates all data from blackshield-x.db to Firebase Firestore
 */

const admin = require('firebase-admin');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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

console.log('🚀 Starting SQLite to Firestore Migration...\n');

// Migration statistics
const stats = {
  users: 0,
  organizations: 0,
  departments: 0,
  floorPlans: 0,
  rooms: 0,
  devices: 0,
  securityEvents: 0,
  errors: []
};

/**
 * Migrate Organizations
 */
async function migrateOrganizations() {
  console.log('📦 Migrating Organizations...');
  
  const organizations = sqlite.prepare(`
    SELECT * FROM organizations
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const org of organizations) {
    const docRef = db.collection('organizations').doc(org.id);
    batch.set(docRef, {
      email: org.email,
      name: org.name,
      plan: org.plan || 'basic',
      maxDevices: org.max_devices || 50,
      password: org.password, // Store for reference, will use Firebase Auth
      createdAt: org.created_at || new Date().toISOString(),
      role: 'admin'
    });
    count++;

    // Create Firebase Auth user for organization
    try {
      await auth.createUser({
        uid: org.id,
        email: org.email,
        password: org.password || 'ChangeMe123!',
        displayName: org.name
      });
      console.log(`  ✓ Created auth user for ${org.email}`);
    } catch (error) {
      if (error.code !== 'auth/uid-already-exists') {
        console.log(`  ⚠ Auth user exists or error: ${org.email}`);
      }
    }
  }

  await batch.commit();
  stats.organizations = count;
  console.log(`  ✅ Migrated ${count} organizations\n`);
}

/**
 * Migrate Users (including super admins)
 */
async function migrateUsers() {
  console.log('👥 Migrating Users...');
  
  const users = sqlite.prepare(`
    SELECT * FROM users
  `).all();

  let count = 0;

  for (const user of users) {
    try {
      // Create Firebase Auth user
      await auth.createUser({
        uid: user.id,
        email: user.email,
        password: user.password || 'ChangeMe123!',
        displayName: user.email
      });

      // If super admin, add to roles_super_admin collection
      if (user.role === 'admin' || user.role === 'super_admin') {
        await db.collection('roles_super_admin').doc(user.id).set({
          email: user.email,
          departmentName: 'System Administration',
          createdAt: user.created_at || new Date().toISOString()
        });
        console.log(`  ✓ Created super admin: ${user.email}`);
      }

      count++;
    } catch (error) {
      if (error.code !== 'auth/uid-already-exists') {
        console.log(`  ⚠ Error creating user ${user.email}: ${error.message}`);
        stats.errors.push(`User ${user.email}: ${error.message}`);
      }
    }
  }

  stats.users = count;
  console.log(`  ✅ Migrated ${count} users\n`);
}

/**
 * Migrate Departments
 */
async function migrateDepartments() {
  console.log('🏢 Migrating Departments...');
  
  const departments = sqlite.prepare(`
    SELECT * FROM departments
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const dept of departments) {
    const docRef = db.collection('departments').doc(dept.id);
    batch.set(docRef, {
      name: dept.name,
      organizationId: dept.organization_id,
      plan: dept.plan || 'basic',
      maxDevices: dept.max_devices || 50,
      floors: dept.floors || 1,
      rooms: dept.rooms || 5,
      totalArea: dept.total_area || 0,
      createdAt: dept.created_at || new Date().toISOString(),
      isActive: dept.is_active !== 0
    });
    count++;
  }

  await batch.commit();
  stats.departments = count;
  console.log(`  ✅ Migrated ${count} departments\n`);
}

/**
 * Migrate Floor Plans
 */
async function migrateFloorPlans() {
  console.log('🗺️  Migrating Floor Plans...');
  
  const floorPlans = sqlite.prepare(`
    SELECT * FROM floor_plans
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const plan of floorPlans) {
    const docRef = db.collection('floor_plans').doc(plan.id);
    batch.set(docRef, {
      organizationId: plan.organization_id,
      departmentId: plan.department_id,
      floorNumber: plan.floor_number,
      floorName: plan.floor_name,
      totalArea: plan.total_area || 0,
      roomCount: plan.room_count || 0,
      createdAt: plan.created_at || new Date().toISOString()
    });
    count++;
  }

  await batch.commit();
  stats.floorPlans = count;
  console.log(`  ✅ Migrated ${count} floor plans\n`);
}

/**
 * Migrate Rooms
 */
async function migrateRooms() {
  console.log('🚪 Migrating Rooms...');
  
  const rooms = sqlite.prepare(`
    SELECT * FROM rooms
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const room of rooms) {
    const docRef = db.collection('rooms').doc(room.id);
    batch.set(docRef, {
      floorPlanId: room.floor_plan_id,
      roomIdentifier: room.room_identifier,
      roomName: room.room_name,
      roomType: room.room_type,
      area: room.area || 0,
      capacity: room.capacity || 0,
      position: room.position ? JSON.parse(room.position) : { x: 0, y: 0 },
      size: room.size ? JSON.parse(room.size) : { width: 100, height: 100 },
      createdAt: room.created_at || new Date().toISOString()
    });
    count++;

    // Commit in batches of 500 (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  📦 Committed batch of 500 rooms...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  stats.rooms = count;
  console.log(`  ✅ Migrated ${count} rooms\n`);
}

/**
 * Migrate Devices
 */
async function migrateDevices() {
  console.log('📱 Migrating Devices...');
  
  const devices = sqlite.prepare(`
    SELECT * FROM devices
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const device of devices) {
    const docRef = db.collection('devices').doc(device.id);
    batch.set(docRef, {
      organizationId: device.organization_id,
      departmentId: device.department_id,
      deviceId: device.device_id,
      name: device.name,
      type: device.type,
      status: device.status || 'offline',
      ipAddress: device.ip_address,
      macAddress: device.mac_address,
      location: device.location,
      lastSeen: device.last_seen,
      createdAt: device.created_at || new Date().toISOString()
    });
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  📦 Committed batch of 500 devices...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  stats.devices = count;
  console.log(`  ✅ Migrated ${count} devices\n`);
}

/**
 * Migrate Security Events
 */
async function migrateSecurityEvents() {
  console.log('🔒 Migrating Security Events...');
  
  const events = sqlite.prepare(`
    SELECT * FROM security_events
    ORDER BY timestamp DESC
    LIMIT 1000
  `).all();

  const batch = db.batch();
  let count = 0;

  for (const event of events) {
    const docRef = db.collection('security_events').doc(event.id);
    batch.set(docRef, {
      organizationId: event.organization_id,
      deviceId: event.device_id,
      eventType: event.event_type,
      severity: event.severity,
      description: event.description,
      timestamp: event.timestamp,
      resolved: event.resolved !== 0,
      createdAt: event.created_at || new Date().toISOString()
    });
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  📦 Committed batch of 500 events...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  stats.securityEvents = count;
  console.log(`  ✅ Migrated ${count} security events (latest 1000)\n`);
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log(`📊 Database: ${dbPath}\n`);
    console.log(`🔥 Firebase Project: ${serviceAccount.project_id}\n`);
    console.log('─'.repeat(50) + '\n');

    await migrateOrganizations();
    await migrateUsers();
    await migrateDepartments();
    await migrateFloorPlans();
    await migrateRooms();
    await migrateDevices();
    await migrateSecurityEvents();

    console.log('─'.repeat(50));
    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Statistics:');
    console.log(`   Organizations: ${stats.organizations}`);
    console.log(`   Users: ${stats.users}`);
    console.log(`   Departments: ${stats.departments}`);
    console.log(`   Floor Plans: ${stats.floorPlans}`);
    console.log(`   Rooms: ${stats.rooms}`);
    console.log(`   Devices: ${stats.devices}`);
    console.log(`   Security Events: ${stats.securityEvents}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n🎉 All data has been migrated to Firestore!');
    console.log('\n⚠️  IMPORTANT: Update your Firebase security rules!');
    console.log('   Users may need to reset their passwords in Firebase Auth.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    process.exit(0);
  }
}

// Run migration
migrate();
