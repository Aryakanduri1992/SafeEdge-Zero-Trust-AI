const Database = require('better-sqlite3');
const path = require('path');

function migrateDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔄 Starting database migration...');
  
  try {
    // Check if organization_name column exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasOrgNameColumn = tableInfo.some(col => col.name === 'organization_name');
    
    if (!hasOrgNameColumn) {
      console.log('➕ Adding organization_name column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN organization_name TEXT');
      console.log('✅ Added organization_name column');
    } else {
      console.log('✅ organization_name column already exists');
    }
    
    // Check if image_url column exists
    const hasImageUrlColumn = tableInfo.some(col => col.name === 'image_url');
    
    if (!hasImageUrlColumn) {
      console.log('➕ Adding image_url column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN image_url TEXT');
      console.log('✅ Added image_url column');
    } else {
      console.log('✅ image_url column already exists');
    }
    
    // Update existing users to have organization names if they don't
    const usersWithoutOrgName = db.prepare(`
      SELECT id, email FROM users 
      WHERE role = 'organization' AND (organization_name IS NULL OR organization_name = '')
    `).all();
    
    if (usersWithoutOrgName.length > 0) {
      console.log(`🔄 Updating ${usersWithoutOrgName.length} users with organization names...`);
      const updateStmt = db.prepare('UPDATE users SET organization_name = ? WHERE id = ?');
      
      for (const user of usersWithoutOrgName) {
        // Generate organization name from email
        const orgName = user.email.split('@')[0].replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + ' Organization';
        
        updateStmt.run(orgName, user.id);
        console.log(`  ✅ Updated ${user.email} -> ${orgName}`);
      }
    }
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrateDatabase();