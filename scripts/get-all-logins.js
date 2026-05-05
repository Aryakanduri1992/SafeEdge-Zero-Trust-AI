const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🔐 All Available Login Credentials\n');

try {
  // Get all users
  const users = db.prepare('SELECT * FROM users ORDER BY role, created_at DESC').all();
  
  console.log('👥 AVAILABLE LOGIN ACCOUNTS:\n');
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.role.toUpperCase()} ACCOUNT`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password_hash}`);
    console.log(`   Organization: ${user.organization_name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.created_at}`);
    
    // Get associated organization data if it's an organization user
    if (user.role === 'organization') {
      const org = db.prepare('SELECT * FROM organizations WHERE name = ?').get(user.organization_name);
      if (org) {
        console.log(`   Organization ID: ${org.id}`);
        
        // Get floor plan info
        const floorPlan = db.prepare('SELECT * FROM floor_plans WHERE organization_id = ?').get(org.id);
        if (floorPlan) {
          const floors = JSON.parse(floorPlan.floors);
          const totalRooms = floors.reduce((total, floor) => total + floor.rooms.length, 0);
          console.log(`   Floor Plan: ${floorPlan.total_floors} floors, ${totalRooms} rooms`);
        }
        
        // Get department info
        const dept = db.prepare('SELECT * FROM departments WHERE organization_id = ?').get(user.id);
        if (dept) {
          console.log(`   Department: ${dept.department_name} (${dept.plan} plan)`);
        }
      }
    }
    
    console.log('');
  });

  console.log('🌐 LOGIN INSTRUCTIONS:');
  console.log('1. Make sure the dev server is running: npm run dev');
  console.log('2. Navigate to: http://localhost:9002');
  console.log('3. Use any email/password combination above');
  console.log('4. Organization users go to /admin/dashboard');
  console.log('5. SuperAdmin users go to /superadmin/dashboard');
  
  console.log('\n🎯 RECOMMENDED FOR TESTING ADVANCED ROOM MANAGEMENT:');
  console.log('   Email: admin@advancedtest.com');
  console.log('   Password: secure123');
  console.log('   → This organization has the complete advanced room setup!');

} catch (error) {
  console.error('❌ ERROR:', error.message);
} finally {
  db.close();
}