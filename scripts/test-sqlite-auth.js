// Test SQLite authentication system
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🔐 Testing SQLite Authentication System...\n');

// Test credentials from our database
const testCredentials = [
  { email: 'admin@advancedtest.com', password: 'secure123', expectedRole: 'organization' },
  { email: 'admin@test.com', password: 'hashed_password_123', expectedRole: 'admin' },
  { email: 'admin@techcorp.com', password: 'password123', expectedRole: 'organization' }
];

console.log('🧪 Testing authentication for each user...\n');

testCredentials.forEach((cred, index) => {
  console.log(`${index + 1}. Testing: ${cred.email}`);
  
  try {
    // Simulate the login process
    const user = db.prepare(`
      SELECT id, email, password_hash, organization_name, role 
      FROM users 
      WHERE email = ?
    `).get(cred.email);

    if (!user) {
      console.log(`   ❌ User not found`);
      return;
    }

    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔑 Password in DB: ${user.password_hash}`);
    console.log(`   🔑 Test Password: ${cred.password}`);
    console.log(`   👤 Role: ${user.role}`);
    console.log(`   🏢 Organization: ${user.organization_name || 'N/A'}`);

    // Check password
    if (user.password_hash === cred.password) {
      console.log(`   ✅ Password matches`);
      
      // Check role
      if (user.role === cred.expectedRole) {
        console.log(`   ✅ Role matches expected (${cred.expectedRole})`);
      } else {
        console.log(`   ⚠️  Role mismatch: expected ${cred.expectedRole}, got ${user.role}`);
      }

      // Get organization info if applicable
      if (user.role === 'organization' && user.organization_name) {
        const org = db.prepare(`
          SELECT id, name FROM organizations WHERE name = ?
        `).get(user.organization_name);
        
        if (org) {
          console.log(`   🏢 Organization ID: ${org.id}`);
          console.log(`   ✅ Organization found in database`);
        } else {
          console.log(`   ❌ Organization not found in database`);
        }
      }

    } else {
      console.log(`   ❌ Password mismatch`);
    }

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('🎯 RECOMMENDED LOGIN CREDENTIALS FOR TESTING:\n');

console.log('1. 🏢 ADVANCED TEST CORP (Best for testing new features)');
console.log('   Email: admin@advancedtest.com');
console.log('   Password: secure123');
console.log('   Features: 3 floors, 13 rooms, Enterprise plan\n');

console.log('2. 🔧 SUPER ADMIN ACCESS');
console.log('   Email: admin@test.com');
console.log('   Password: hashed_password_123');
console.log('   Access: Create organizations, manage all data\n');

console.log('3. 🏭 TECHCORP INDUSTRIES');
console.log('   Email: admin@techcorp.com');
console.log('   Password: password123');
console.log('   Features: 3 floors, 15 rooms, Pro plan\n');

console.log('🌐 LOGIN INSTRUCTIONS:');
console.log('1. Navigate to: http://localhost:9002');
console.log('2. You will be redirected to /organisation-login');
console.log('3. Use any of the credentials above');
console.log('4. The system now uses SQLite instead of Firebase!');

db.close();