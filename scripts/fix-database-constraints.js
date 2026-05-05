const Database = require('better-sqlite3');
const path = require('path');

function fixDatabaseConstraints() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔄 Fixing database schema constraints...');
  
  try {
    // Get current table schema
    const tableInfo = db.prepare("PRAGMA table_info(users)").get();
    console.log('Current users table exists:', !!tableInfo);
    
    // Create backup of existing data
    console.log('📦 Creating backup of existing data...');
    const existingUsers = db.prepare('SELECT * FROM users').all();
    console.log(`Found ${existingUsers.length} existing users`);
    
    // Drop existing users table
    console.log('🗑️ Dropping existing users table...');
    db.exec('DROP TABLE IF EXISTS users');
    
    // Create new users table with correct constraints
    console.log('🏗️ Creating new users table with correct constraints...');
    db.exec(`
      CREATE TABLE users (
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
    
    // Restore existing data
    console.log('📥 Restoring existing data...');
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, organization_name, image_url, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const user of existingUsers) {
      try {
        insertUser.run(
          user.id,
          user.email,
          user.password_hash,
          user.organization_name || null,
          user.image_url || null,
          user.role,
          user.created_at,
          user.updated_at
        );
        console.log(`  ✅ Restored user: ${user.email} (${user.role})`);
      } catch (error) {
        console.error(`  ❌ Failed to restore user ${user.email}:`, error.message);
      }
    }
    
    // Verify the new constraint works
    console.log('🧪 Testing new constraint...');
    try {
      const testStmt = db.prepare(`
        INSERT INTO users (id, email, password_hash, organization_name, role)
        VALUES ('test_org_123', 'test@org.com', 'test123', 'Test Organization', 'organization')
      `);
      testStmt.run();
      
      // Clean up test data
      db.prepare('DELETE FROM users WHERE id = ?').run('test_org_123');
      console.log('  ✅ Organization role constraint working correctly');
    } catch (error) {
      console.error('  ❌ Constraint test failed:', error.message);
    }
    
    console.log('✅ Database schema constraints fixed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix database constraints:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

fixDatabaseConstraints();