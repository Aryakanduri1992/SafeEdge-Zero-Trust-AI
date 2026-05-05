# 🔐 SuperAdmin Login Credentials

## ✅ CORRECT SuperAdmin Credentials (Firebase)

### SuperAdmin Access
- **URL**: http://localhost:9002/superadmin-login
- **Email**: `superadmin@gmail.com`
- **Password**: `password123`
- **Role**: super_admin
- **Dashboard**: http://localhost:9002/superadmin/dashboard

## ⚠️ Important Notes

### The Login Form Shows Wrong Default Values
The SuperAdmin login form (`src/components/auth/super-admin-login-form.tsx`) has incorrect default values:
- ❌ Form shows: `super@blackshield-x.com` / `super-password`
- ✅ Actual credentials: `superadmin@gmail.com` / `password123`

**You need to manually change the email and password in the form!**

### Data Source
- ✅ **Using Firebase Firestore** (NOT SQLite)
- ✅ Project: `lumeshield-x`
- ✅ Collection: `roles_super_admin`
- ✅ Service Account: `firebase-adminsdk-fbsvc@lumeshield-x.iam.gserviceaccount.com`

## 🚀 How to Login

### Step 1: Open SuperAdmin Login
Navigate to: http://localhost:9002/superadmin-login

### Step 2: Clear the Form and Enter Correct Credentials
1. **Clear the pre-filled email** (it shows wrong default)
2. **Enter**: `superadmin@gmail.com`
3. **Clear the pre-filled password**
4. **Enter**: `password123`
5. **Click**: "Super Admin Login"

### Step 3: Access Dashboard
After successful login, you'll be redirected to:
- http://localhost:9002/superadmin/dashboard

## 🏢 Organization Admin Credentials (Also in Firebase)

### Advanced Test Corp (Recommended for Testing)
- **Email**: `admin@advancedtest.com`
- **Password**: `secure123`
- **URL**: http://localhost:9002/organisation-login

### TechCorp Industries
- **Email**: `admin@techcorp.com`
- **Password**: `password123`

### HealthPlus Medical Center
- **Email**: `admin@healthplus.com`
- **Password**: `password123`

### Devaclub
- **Email**: `deva@test.com`
- **Password**: `Ajay@123`

## 🔧 SuperAdmin Capabilities

Once logged in as SuperAdmin, you can:
- ✅ Create new organizations
- ✅ View all organizations
- ✅ Access advanced organization wizard
- ✅ Manage system-wide settings
- ✅ View all floor plans
- ✅ Monitor all devices across organizations

## 🐛 Troubleshooting

### "Invalid email or password" Error
**Cause**: Using the wrong credentials or the form's default values

**Solution**:
1. Make sure you're using: `superadmin@gmail.com` / `password123`
2. Clear the form completely before entering credentials
3. Don't use the pre-filled values in the form

### Firebase Connection Issues
**Check**:
1. Firebase service account file exists: `firebase-service-account.json`
2. Backend is running: http://localhost:8000
3. Frontend is running: http://localhost:9002

### Still Can't Login?
Run the verification script to check Firebase data:
```bash
node scripts/verify-complete-setup.js
```

This will show you:
- ✅ If SuperAdmin exists in Firebase
- ✅ Current credentials
- ✅ All test accounts

## 📊 Firebase Collections Structure

### roles_super_admin
```
{
  email: "superadmin@gmail.com",
  password: "password123",
  departmentName: "SafeEdge Admin",
  role: "super_admin"
}
```

### users (Organization Admins)
```
{
  email: "admin@advancedtest.com",
  password: "secure123",
  organizationName: "Advanced Test Corp",
  role: "organization"
}
```

## ✅ Quick Test

To verify SuperAdmin access works:
```bash
# 1. Make sure backend is running
npm run backend

# 2. Make sure frontend is running  
npm run dev

# 3. Open browser
open http://localhost:9002/superadmin-login

# 4. Login with:
# Email: superadmin@gmail.com
# Password: password123
```

---

**Remember**: The form shows wrong default values. Always use:
- ✅ `superadmin@gmail.com` / `password123`
- ❌ NOT `super@blackshield-x.com` / `super-password`
