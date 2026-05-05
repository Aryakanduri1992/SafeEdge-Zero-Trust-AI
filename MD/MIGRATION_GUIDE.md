# 🔄 SQLite to Firestore Migration Guide

This guide will help you migrate all data from your local SQLite database to Firebase Firestore.

## ✅ Prerequisites

1. ✅ Firebase service account key saved as `firebase-service-account.json`
2. ✅ Node.js installed
3. ✅ Firebase project created (lumeshield-x)

## 🚀 Migration Steps

### Step 1: Install Dependencies (if needed)

```bash
npm install firebase-admin better-sqlite3
```

### Step 2: Run the Migration Script

```bash
node scripts/migrate-sqlite-to-firestore.js
```

### Step 3: Monitor the Progress

The script will show real-time progress:
- 📦 Organizations
- 👥 Users (including super admins)
- 🏢 Departments
- 🗺️ Floor Plans
- 🚪 Rooms
- 📱 Devices
- 🔒 Security Events

## 📊 What Gets Migrated

### Collections Created in Firestore:

1. **organizations** - All organization data
   - Email, name, plan, max devices
   - Linked to Firebase Auth users

2. **users** - User accounts
   - Created in Firebase Auth
   - Super admins added to `roles_super_admin` collection

3. **roles_super_admin** - Super admin roles
   - Email, department name

4. **departments** - Department information
   - Name, organization link, plan details

5. **floor_plans** - Building floor plans
   - Floor number, name, area, room count

6. **rooms** - Room configurations
   - Room identifier, name, type, area, position

7. **devices** - IoT devices
   - Device ID, name, type, status, location

8. **security_events** - Security logs (latest 1000)
   - Event type, severity, description, timestamp

## 🔐 Firebase Authentication

The script will:
- Create Firebase Auth users for all organizations
- Create Firebase Auth users for all admin users
- Use existing passwords (users may need to reset)
- Link Auth UIDs to Firestore documents

## ⚠️ Important Notes

### After Migration:

1. **Update Firebase Security Rules**
   - Go to Firebase Console → Firestore Database → Rules
   - Update rules to match your security requirements

2. **Test Login**
   - Try logging in with existing credentials
   - Users may need to reset passwords

3. **Update Application Code**
   - Switch from SQLite auth to Firebase auth
   - Update `src/app/layout.tsx` to use Firebase AuthProvider
   - Change: `import { AuthProvider } from '@/contexts/auth-context-sqlite';`
   - To: `import { AuthProvider } from '@/contexts/auth-context';`

4. **Backup SQLite Database**
   - Keep `data/authstation.db` as backup
   - Don't delete until migration is verified

## 🔧 Troubleshooting

### Error: "auth/uid-already-exists"
- This is normal if running migration multiple times
- Users already exist in Firebase Auth

### Error: "Permission denied"
- Check Firebase security rules
- Ensure service account has proper permissions

### Error: "Module not found"
- Run: `npm install firebase-admin better-sqlite3`

## 📝 Test Credentials After Migration

Try logging in with:
- **Email**: `admin@advancedtest.com`
- **Password**: `secure123`

Or:
- **Email**: `admin@test.com` (Super Admin)
- **Password**: `hashed_password_123`

## 🎯 Next Steps

After successful migration:

1. ✅ Test all login credentials
2. ✅ Verify data in Firebase Console
3. ✅ Update security rules
4. ✅ Switch app to use Firebase auth
5. ✅ Deploy to production

## 📞 Support

If you encounter issues:
1. Check the error messages in the console
2. Verify Firebase service account permissions
3. Check Firebase Console for data
4. Review Firestore security rules

---

**Project**: SafeEdge Hospital IoT Security Platform  
**Firebase Project**: lumeshield-x
