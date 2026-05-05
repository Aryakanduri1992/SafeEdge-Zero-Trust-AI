const Database = require('better-sqlite3');
const path = require('path');

function updateOrganizationNames() {
  const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
  const db = new Database(dbPath);
  
  console.log('🔄 Updating organization names...');
  
  try {
    // Get all users with organization role but missing organization_name
    const users = db.prepare(`
      SELECT id, email, organization_name FROM users 
      WHERE role = 'organization'
    `).all();
    
    console.log(`Found ${users.length} organization users`);
    
    const updateStmt = db.prepare('UPDATE users SET organization_name = ? WHERE id = ?');
    
    for (const user of users) {
      if (!user.organization_name || user.organization_name.trim() === '') {
        // Generate organization name from email
        const orgName = user.email.split('@')[0].replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + ' Organization';
        
        updateStmt.run(orgName, user.id);
        console.log(`  ✅ Updated ${user.email} -> ${orgName}`);
      } else {
        console.log(`  ✓ ${user.email} already has organization name: ${user.organization_name}`);
      }
    }
    
    // Verify the updates
    const updatedUsers = db.prepare(`
      SELECT id, email, organization_name FROM users 
      WHERE role = 'organization'
    `).all();
    
    console.log('\n📊 Final organization list:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.organization_name} (${user.email})`);
    });
    
    console.log('\n✅ Organization names updated successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

updateOrganizationNames();