/**
 * Azure SQL Database Initialization Script
 * =========================================
 * Creates all tables and inserts the super admin user
 * 
 * Run with: node scripts/init-azure-sql.js
 * 
 * Required environment variables:
 * - AZURE_SQL_SERVER
 * - AZURE_SQL_DATABASE
 * - AZURE_SQL_USER
 * - AZURE_SQL_PASSWORD
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.AZURE_SQL_SERVER || 'lume-sql-server.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'LUME',
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

async function initializeDatabase() {
  console.log('='.repeat(60));
  console.log('Azure SQL Database Initialization');
  console.log('='.repeat(60));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log('');

  if (!config.user || !config.password) {
    console.error('❌ Error: AZURE_SQL_USER and AZURE_SQL_PASSWORD must be set');
    console.log('');
    console.log('Set these in your .env file:');
    console.log('  AZURE_SQL_SERVER=lume-sql-server.database.windows.net');
    console.log('  AZURE_SQL_DATABASE=LUME');
    console.log('  AZURE_SQL_USER=your_username');
    console.log('  AZURE_SQL_PASSWORD=your_password');
    process.exit(1);
  }

  let pool;
  
  try {
    console.log('🔄 Connecting to Azure SQL...');
    pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Create tables
    console.log('🔄 Creating tables...\n');

    // Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        organization_name NVARCHAR(255),
        image_url NVARCHAR(500),
        role NVARCHAR(50) NOT NULL DEFAULT 'organization',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ users table');

    // Departments table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='departments' AND xtype='U')
      CREATE TABLE departments (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        department_name NVARCHAR(255) NOT NULL,
        location NVARCHAR(255) DEFAULT '',
        building NVARCHAR(255) DEFAULT '',
        floor INT DEFAULT 1,
        devices INT DEFAULT 10,
        [plan] NVARCHAR(50) DEFAULT 'Basic',
        status NVARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ departments table');

    // Floor plans table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='floor_plans' AND xtype='U')
      CREATE TABLE floor_plans (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        floors NVARCHAR(MAX) NOT NULL,
        total_floors INT DEFAULT 0,
        approved BIT DEFAULT 0,
        approved_by NVARCHAR(50),
        approved_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ floor_plans table');

    // Devices table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='devices' AND xtype='U')
      CREATE TABLE devices (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        department_id NVARCHAR(50),
        floor_plan_id NVARCHAR(50),
        room_id NVARCHAR(50),
        name NVARCHAR(255) NOT NULL,
        type NVARCHAR(100) NOT NULL,
        location NVARCHAR(255) DEFAULT '',
        description NVARCHAR(500) DEFAULT '',
        status NVARCHAR(50) NOT NULL DEFAULT 'online',
        last_seen DATETIME DEFAULT GETDATE(),
        position_x FLOAT,
        position_y FLOAT,
        network_connection NVARCHAR(MAX),
        db_path NVARCHAR(500) DEFAULT '',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ devices table');

    // Safe edges table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safe_edges' AND xtype='U')
      CREATE TABLE safe_edges (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'online',
        connected_boxes NVARCHAR(MAX) NOT NULL DEFAULT '[]',
        cloud_endpoint NVARCHAR(500),
        last_sync DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ safe_edges table');

    // Ethernet boxes table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ethernet_boxes' AND xtype='U')
      CREATE TABLE ethernet_boxes (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        safe_edge_id NVARCHAR(50) NOT NULL,
        connected_devices NVARCHAR(MAX) NOT NULL DEFAULT '[]',
        status NVARCHAR(50) NOT NULL DEFAULT 'active',
        max_capacity INT NOT NULL DEFAULT 50
      )
    `);
    console.log('   ✓ ethernet_boxes table');

    // Security events table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='security_events' AND xtype='U')
      CREATE TABLE security_events (
        id NVARCHAR(50) PRIMARY KEY,
        organization_id NVARCHAR(50) NOT NULL,
        event_type NVARCHAR(100) NOT NULL,
        severity NVARCHAR(50) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        metadata NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ security_events table');

    // Audit trail table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_trail' AND xtype='U')
      CREATE TABLE audit_trail (
        id NVARCHAR(50) PRIMARY KEY,
        entity_type NVARCHAR(100) NOT NULL,
        entity_id NVARCHAR(50) NOT NULL,
        organization_id NVARCHAR(50) NOT NULL,
        action NVARCHAR(100) NOT NULL,
        user_id NVARCHAR(50) NOT NULL,
        user_role NVARCHAR(50) NOT NULL,
        metadata NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ audit_trail table');

    // ESP32 devices table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='esp32_devices' AND xtype='U')
      CREATE TABLE esp32_devices (
        id NVARCHAR(50) PRIMARY KEY,
        device_id NVARCHAR(100) UNIQUE NOT NULL,
        device_type NVARCHAR(100) DEFAULT 'ESP32',
        firmware_version NVARCHAR(50) DEFAULT '1.0.0',
        wifi_connected BIT DEFAULT 0,
        ip_address NVARCHAR(50) DEFAULT '',
        signal_strength INT DEFAULT 0,
        mac_address NVARCHAR(50) DEFAULT '',
        capabilities NVARCHAR(MAX) DEFAULT '[]',
        status NVARCHAR(50) DEFAULT 'offline',
        uptime INT DEFAULT 0,
        last_seen DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        last_sensor_data NVARCHAR(MAX),
        threat_level NVARCHAR(50) DEFAULT 'safe',
        security_score INT DEFAULT 100,
        last_threat NVARCHAR(MAX),
        encryption_enabled BIT DEFAULT 0,
        public_key NVARCHAR(MAX)
      )
    `);
    console.log('   ✓ esp32_devices table');

    // Organizations table (for backward compatibility)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='organizations' AND xtype='U')
      CREATE TABLE organizations (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        [plan] NVARCHAR(50) DEFAULT 'Basic',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('   ✓ organizations table');

    console.log('\n✅ All tables created successfully!\n');

    // Clear existing data and create super admin
    console.log('🔄 Setting up super admin account...\n');

    // Delete existing super admin if exists
    await pool.request()
      .input('email', sql.NVarChar, 'superadmin@gmail.com')
      .query(`DELETE FROM users WHERE email = @email`);

    // Generate ID
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date();

    // Insert super admin
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('email', sql.NVarChar, 'superadmin@gmail.com')
      .input('password', sql.NVarChar, 'password123')
      .input('orgName', sql.NVarChar, 'SafeEdge Admin')
      .input('role', sql.NVarChar, 'super_admin')
      .input('createdAt', sql.DateTime, now)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        INSERT INTO users (id, email, password_hash, organization_name, role, created_at, updated_at)
        VALUES (@id, @email, @password, @orgName, @role, @createdAt, @updatedAt)
      `);

    console.log('   ✓ Super admin account created');

    // Verify
    const result = await pool.request()
      .input('role', sql.NVarChar, 'super_admin')
      .query(`SELECT id, email, role FROM users WHERE role = @role`);

    console.log('\n' + '='.repeat(60));
    console.log('INITIALIZATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📋 Super Admin Credentials:');
    console.log('   Email:    superadmin@gmail.com');
    console.log('   Password: password123');
    console.log('   Role:     super_admin');
    console.log('   ID:       ' + result.recordset[0].id);
    console.log('\n✅ You can now set USE_AZURE_SQL=true in .env and restart the app.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ELOGIN') {
      console.log('\nAuthentication failed. Check your credentials.');
    } else if (error.code === 'ESOCKET') {
      console.log('\nConnection failed. Check server address and firewall rules.');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initializeDatabase();
