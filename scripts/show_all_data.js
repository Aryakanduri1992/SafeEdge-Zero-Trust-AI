const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'blackshield-x.db');
const db = new Database(dbPath, { readonly: true });

console.log('=== DATABASE SCHEMA ===\n');

// Get all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('Tables:', tables.map(t => t.name).join(', '));
console.log('\n=== TABLE DATA ===\n');

// Show data from each table
tables.forEach(table => {
  const tableName = table.name;
  
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`\n📊 ${tableName.toUpperCase()} (${count.count} records)`);
    console.log('─'.repeat(60));
    
    if (count.count > 0 && count.count <= 20) {
      const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 10`).all();
      rows.forEach((row, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          if (key !== 'password') { // Don't show passwords
            console.log(`  ${key}: ${value}`);
          } else {
            console.log(`  ${key}: [HIDDEN]`);
          }
        });
      });
    } else if (count.count > 20) {
      console.log(`  (Too many records to display - showing first 5)`);
      const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
      rows.forEach((row, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          if (key !== 'password') {
            console.log(`  ${key}: ${value}`);
          } else {
            console.log(`  ${key}: [HIDDEN]`);
          }
        });
      });
    }
  } catch (error) {
    console.log(`  Error reading table: ${error.message}`);
  }
});

db.close();
console.log('\n\n=== END OF DATABASE DUMP ===');
