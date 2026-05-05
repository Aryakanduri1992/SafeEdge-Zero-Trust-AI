/**
 * Database Reset Script
 * Clears all data and creates a super admin account
 * 
 * Run with: node scripts/reset_database.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');

console.log('='.repeat(50));
console.log('SafeEdge Database Reset Script');
console.log('='.repeat(50));

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('Database file not found at:', dbPath);
  console.log('Creating new database...');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Open database
const db = new Database(dbPath);

console.log('\n1. Clearing all existing data...');

// Disable foreign keys temporarily
db.pragma('foreign_keys = OFF');

// Get all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

// Delete data from all tables
for (const table of tables) {
  try {
    db.exec(`DELETE FROM ${table.name}`);
    console.log(`   ✓ Cleared table: ${table.name}`);
  } catch (err) {
    console.log(`   ⚠ Could not clear table ${table.name}: ${err.message}`);
  }
}

// Re-enable foreign keys
db.pragma('foreign_keys = ON');

console.log('\n2. Creating super admin account...');

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Super admin credentials
const superAdminId = generateId();
const email = 'superadmin@gmail.com';
const password = 'password123';
const now = new Date().toISOString();

// Ensure users table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    organization_name TEXT,
    image_url TEXT,
    role TEXT NOT NULL DEFAULT 'organization' CHECK (role IN ('super_admin', 'organization', 'admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert super admin
try {
  db.prepare(`
    INSERT INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'super_admin', ?, ?)
  `).run(superAdminId, email, password, 'SafeEdge Admin', now, now);
  
  console.log('   ✓ Super admin account created successfully!');
} catch (err) {
  console.log('   ✗ Error creating super admin:', err.message);
}

// Verify the account was created
const admin = db.prepare('SELECT * FROM users WHERE role = ?').get('super_admin');

console.log('\n' + '='.repeat(50));
console.log('DATABASE RESET COMPLETE');
console.log('='.repeat(50));

if (admin) {
  console.log('\n📋 Super Admin Credentials:');
  console.log('   Email:    ' + email);
  console.log('   Password: ' + password);
  console.log('   Role:     super_admin');
  console.log('   ID:       ' + admin.id);
}

console.log('\n✅ You can now login at /login with these credentials.\n');

// Close database
db.close();
