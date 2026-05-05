const Database = require('better-sqlite3');

const db = new Database('./data/blackshield-x.db');

console.log('🔧 Session Issue Diagnostic Tool\n');

// Get all valid organization users
const validUsers = db.prepare('SELECT id, email, organization_name FROM users WHERE role = ?').all('organization');

console.log('✅ Valid Organization Users in Database:');
validUsers.forEach(user => {
  console.log(`   ${user.email} → ID: ${user.id} (${user.organization_name})`);
});

console.log('\n🚨 Common Session Issues:');
console.log('1. User ID in browser session doesn\'t match database');
console.log('2. Old/cached session data from previous tests');
console.log('3. Browser localStorage/sessionStorage corruption');

console.log('\n💡 Solutions:');
console.log('1. **Logout and Login Again**: Use the logout button in the app');
console.log('2. **Clear Browser Data**: Clear localStorage and sessionStorage');
console.log('3. **Use Correct Credentials**: Login with these working accounts:');

console.log('\n🎯 Recommended Test Accounts:');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ Email                    │ Password    │ Organization        │');
console.log('├─────────────────────────────────────────────────────────────┤');
console.log('│ admin@advancedtest.com   │ secure123   │ Advanced Test Corp  │');
console.log('│ admin@techcorp.com       │ password123 │ TechCorp Industries │');
console.log('│ admin@healthplus.com     │ password123 │ HealthPlus Medical  │');
console.log('│ deva@test.com            │ Ajay@123    │ Devaclub            │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\n🔍 If you\'re seeing user ID 9fqt9rru23bmjhbn58g:');
console.log('   This is an INVALID/OLD session ID that doesn\'t exist');
console.log('   The correct Devaclub user ID is: crwi5k5uq5omjhbn58p');
console.log('   → Solution: Logout and login again with deva@test.com / Ajay@123');

console.log('\n🛠️  Manual Fix (if needed):');
console.log('   1. Open browser DevTools (F12)');
console.log('   2. Go to Application/Storage tab');
console.log('   3. Clear localStorage and sessionStorage');
console.log('   4. Refresh page and login again');

db.close();