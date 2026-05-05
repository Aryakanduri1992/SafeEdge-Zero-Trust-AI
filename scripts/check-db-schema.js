const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'blackshield-x.db');
const db = new Database(dbPath);

console.log('🔍 Checking database schema...\n');

try {
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables in database:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  console.log('\n📊 Table schemas:');
  
  tables.forEach(table => {
    console.log(`\n🏗️  ${table.name.toUpperCase()} TABLE:`);
    const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
    schema.forEach(col => {
      const fk = col.pk ? ' (PRIMARY KEY)' : '';
      console.log(`   ${col.name}: ${col.type}${fk}`);
    });
    
    // Check foreign keys
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
    if (foreignKeys.length > 0) {
      console.log('   Foreign Keys:');
      foreignKeys.forEach(fk => {
        console.log(`     ${fk.from} -> ${fk.table}.${fk.to}`);
      });
    }
  });

  // Check if foreign keys are enabled
  const fkStatus = db.pragma('foreign_keys');
  console.log(`\n🔐 Foreign keys enabled: ${fkStatus ? 'YES' : 'NO'}`);

  // Check for any existing data
  console.log('\n📈 Data counts:');
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`   ${table.name}: ${count.count} records`);
    } catch (e) {
      console.log(`   ${table.name}: Error counting - ${e.message}`);
    }
  });

} catch (error) {
  console.error('❌ ERROR:', error.message);
} finally {
  db.close();
}