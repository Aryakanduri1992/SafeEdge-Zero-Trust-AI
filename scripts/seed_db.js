const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🌱 Seeding database with test organizations...\n');

const organizations = [
  { id: '3b13pncqkpnmjh8qt7y', email: 'admin@advancedtest.com', password: 'secure123', name: 'Advanced Test Corp', plan: 'enterprise', max_devices: 150 },
  { id: 'ukg9f2q0xlmjh3lsot', email: 'admin@techcorp.com', password: 'password123', name: 'TechCorp Industries', plan: 'pro', max_devices: 100 },
  { id: '8ua38kdx0tgmjh3lsuw', email: 'admin@healthplus.com', password: 'password123', name: 'HealthPlus Medical Center', plan: 'enterprise', max_devices: 150 },
  { id: 'x3cxdq7mg9bmjh3lszf', email: 'admin@edutech.com', password: 'password123', name: 'EduTech Solutions', plan: 'basic', max_devices: 50 },
  { id: 'crwi5k5uq5omjhbn58p', email: 'deva@test.com', password: 'Ajay@123', name: 'Devaclub', plan: 'pro', max_devices: 100 },
  { id: 'rguorl9w2u8mjh8mbqu', email: 'test@example.com', password: 'password123', name: 'Test Organization', plan: 'basic', max_devices: 50 },
  { id: 'jb3km8qopcmjh3odnw', email: 'test@wizard.com', password: 'password123', name: 'Test Wizard Org', plan: 'basic', max_devices: 50 },
  { id: 'hithfzfjaqmjh3owy4', email: 'deva@club.com', password: 'password123', name: 'Deva', plan: 'basic', max_devices: 50 }
];

const insertOrg = db.prepare(`
  INSERT OR REPLACE INTO organizations (id, email, password, name, plan, max_devices, created_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

const insertMany = db.transaction((orgs) => {
  for (const org of orgs) {
    insertOrg.run(org.id, org.email, org.password, org.name, org.plan, org.max_devices);
    console.log(`✅ Added: ${org.name} (${org.email})`);
  }
});

try {
  insertMany(organizations);
  console.log(`\n✨ Successfully seeded ${organizations.length} organizations!`);
  
  const count = db.prepare('SELECT COUNT(*) as count FROM organizations').get();
  console.log(`📊 Total organizations in database: ${count.count}`);
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
} finally {
  db.close();
}
