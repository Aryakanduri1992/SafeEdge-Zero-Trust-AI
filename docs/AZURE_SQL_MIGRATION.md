# Azure SQL Database Migration Guide

## Overview

This document describes the migration from SQLite to Azure SQL Database for the SafeEdge application.

## Architecture

The application now supports both SQLite (local development) and Azure SQL (production):

```
┌─────────────────────────────────────────────────────────────┐
│                    SafeEdge Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────┐      ┌─────────────────────────────┐  │
│   │   API Routes    │──────│     db-service.ts           │  │
│   │  (Next.js API)  │      │  (Unified Database Service) │  │
│   └─────────────────┘      └──────────────┬──────────────┘  │
│                                           │                  │
│                            ┌──────────────┴──────────────┐  │
│                            │    USE_AZURE_SQL=true?      │  │
│                            └──────────────┬──────────────┘  │
│                                           │                  │
│              ┌────────────────────────────┼────────────────┐│
│              │                            │                ││
│              ▼                            ▼                ││
│   ┌─────────────────┐          ┌─────────────────────┐    ││
│   │     SQLite      │          │     Azure SQL       │    ││
│   │  (better-sqlite3)│          │      (mssql)        │    ││
│   │                 │          │                     │    ││
│   │  Local file:    │          │  Server:            │    ││
│   │  data/          │          │  lume-sql-server.   │    ││
│   │  authstation.db │          │  database.windows.  │    ││
│   │                 │          │  net                │    ││
│   └─────────────────┘          └─────────────────────┘    ││
│                                                            ││
└────────────────────────────────────────────────────────────┘│
```

## Files Changed

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/azure-sql.ts` | Azure SQL connection pool and query utilities |
| `src/lib/database-azure.ts` | Azure SQL database wrapper (mimics SQLite API) |
| `src/lib/db-service.ts` | Unified async database service for both SQLite and Azure SQL |
| `scripts/init-azure-sql.js` | Script to initialize Azure SQL tables and super admin |

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/database.ts` | Added Azure SQL support toggle |
| `src/app/api/auth/login/route.ts` | Updated to use async db-service |
| `src/app/api/floor-plans/route.ts` | Updated to use async db-service |
| `src/app/api/devices/route.ts` | Updated to use async db-service |
| `src/app/api/superadmin/organizations/route.ts` | Updated to use async db-service |
| `.env.example` | Added Azure SQL configuration variables |
| `package.json` | Added mssql dependency |

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Database Selection
USE_AZURE_SQL=true  # Set to 'true' for Azure SQL, 'false' for SQLite

# Azure SQL Configuration
AZURE_SQL_SERVER=lume-sql-server.database.windows.net
AZURE_SQL_DATABASE=LUME
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
```

### Azure SQL Server Requirements

1. **Firewall Rules**: Add your IP address to Azure SQL firewall
2. **Encryption**: TLS encryption is required (handled automatically)
3. **Authentication**: SQL authentication (username/password)

## Migration Steps

### Step 1: Install Dependencies

```bash
cd AuthStation
npm install mssql @types/mssql --legacy-peer-deps
```

### Step 2: Configure Environment

Create or update `.env`:

```bash
USE_AZURE_SQL=true
AZURE_SQL_SERVER=lume-sql-server.database.windows.net
AZURE_SQL_DATABASE=LUME
AZURE_SQL_USER=your_sql_username
AZURE_SQL_PASSWORD=your_sql_password
```

### Step 3: Initialize Azure SQL Database

```bash
node scripts/init-azure-sql.js
```

This will:
- Create all required tables
- Create the super admin account
- Verify the connection

### Step 4: Start the Application

```bash
npm run dev
```

### Step 5: Verify

1. Login with super admin credentials:
   - Email: `superadmin@gmail.com`
   - Password: `password123`

2. Create a test organization
3. Verify floor plans and devices work

## Schema Comparison

### SQLite vs Azure SQL Data Types

| SQLite | Azure SQL |
|--------|-----------|
| TEXT | NVARCHAR(n) or NVARCHAR(MAX) |
| INTEGER | INT |
| REAL | FLOAT |
| BOOLEAN | BIT |
| DATETIME | DATETIME |

### Key Differences

1. **Auto-increment**: SQLite uses `AUTOINCREMENT`, Azure SQL uses `IDENTITY`
2. **Boolean**: SQLite uses 0/1, Azure SQL uses BIT
3. **JSON**: Both store as text (NVARCHAR(MAX) in Azure SQL)
4. **Timestamps**: Azure SQL uses `GETDATE()` instead of `CURRENT_TIMESTAMP`

## Query Conversion Examples

### Login Query

**SQLite:**
```sql
SELECT id, email, password_hash, organization_name, role 
FROM users WHERE email = ?
```

**Azure SQL:**
```sql
SELECT id, email, password_hash, organization_name, role 
FROM users WHERE email = @email
```

### Insert with Parameters

**SQLite:**
```javascript
db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(id, email);
```

**Azure SQL:**
```javascript
await execute(
  'INSERT INTO users (id, email) VALUES (@id, @email)',
  { id, email }
);
```

## Rollback to SQLite

To switch back to SQLite:

1. Set `USE_AZURE_SQL=false` in `.env`
2. Restart the application
3. The SQLite database will be used automatically

## Troubleshooting

### Connection Errors

**Error: ELOGIN**
- Check username and password
- Verify SQL authentication is enabled on Azure SQL server

**Error: ESOCKET**
- Check server address
- Verify firewall rules allow your IP
- Check if Azure SQL server is running

### Query Errors

**Error: Invalid column name**
- Column names are case-sensitive in some configurations
- Check table schema matches expected columns

**Error: Conversion failed**
- Check data types match between application and database
- Ensure proper type casting in queries

## Performance Considerations

1. **Connection Pooling**: The `azure-sql.ts` module uses connection pooling (max 10 connections)
2. **Query Timeout**: Default 30 seconds, configurable in `azure-sql.ts`
3. **Indexes**: Consider adding indexes for frequently queried columns

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Enable Azure SQL auditing** for production
4. **Use managed identities** when deploying to Azure App Service
5. **Rotate passwords** regularly

## Azure App Service Deployment

When deploying to Azure App Service:

1. Set environment variables in App Service Configuration
2. Enable managed identity for passwordless authentication (recommended)
3. Configure connection strings in Azure portal
4. Enable Always On for production workloads

## Support

For issues related to this migration, check:
1. Azure SQL connection logs
2. Application console output
3. Azure SQL query performance insights

---

**Author:** SafeEdge Team - Imagine Cup 2026
