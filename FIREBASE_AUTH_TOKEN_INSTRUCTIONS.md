# Firebase Authentication Token Instructions

## ⚠️ Important: Database Secret for ESP32

Your ESP32 firmware needs a **Database Secret** (also called Legacy Token) to authenticate with Firebase Realtime Database.

## 🔑 How to Get Database Secret

### Option 1: From Realtime Database Rules (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **lumeshield-x**
3. Navigate to **Realtime Database**
4. Click **Rules** tab
5. Look for **Legacy** tab or **Secrets** section
6. Click **Show** to reveal the secret
7. Copy the secret token

### Option 2: From Project Settings

1. Go to Firebase Console → **Project Settings**
2. Click **Service accounts** tab
3. Scroll down to **Database secrets** section
4. Click **Show** to reveal secret
5. Copy the secret token

### Option 3: Generate New Secret (if not available)

If you don't see database secrets:

1. Go to **Realtime Database** → **Rules**
2. Click **Legacy** tab
3. Click **Generate new secret**
4. Copy the generated secret

## 📝 Update ESP32 Firmware

Once you have the secret, update the firmware:

**File**: `esp32_secure/safeedge_firebase_circular_buffer.ino`

**Line 34**:
```cpp
#define FIREBASE_AUTH "your_database_secret_here"
```

**Example**:
```cpp
#define FIREBASE_AUTH "abc123xyz789secrettoken"
```

## ✅ Current Configuration Status

### Already Configured:
- ✅ Firebase Database URL: `lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app`
- ✅ API Key: `AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs`
- ✅ Frontend `.env.local` created with all Firebase config
- ✅ Backend `.env` configured

### Still Needed:
- ⚠️ Database Secret (FIREBASE_AUTH) for ESP32

## 🔒 Alternative: Use Firebase Admin SDK (Recommended for Production)

For production, it's better to use Firebase Admin SDK with service account:

### Get Service Account JSON:

1. Firebase Console → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Save as `firebase-credentials.json`
4. Place in project root

This file is already configured in your backend `.env`:
```env
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
```

## 🚀 Testing Without Database Secret

If you want to test quickly, you can temporarily set Firebase rules to allow unauthenticated access:

**⚠️ WARNING: Only for testing, NOT for production!**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Then in ESP32 firmware, you can leave `FIREBASE_AUTH` empty:
```cpp
#define FIREBASE_AUTH ""
```

**Remember to secure your database before deploying!**

## 📊 Verify Configuration

### Check ESP32 Serial Monitor:

After uploading firmware, you should see:
```
🚀 SafeEdge ESP32 Gateway Starting...
🔌 Connecting to Ethernet...
✅ Ethernet connected: 192.168.1.177
🔥 Connecting to Firebase...
✅ Firebase connected
📝 Device registered: esp32_gateway_001
```

If you see `❌ Firebase connection failed`, check:
1. Database secret is correct
2. Firebase rules allow access
3. Network connectivity is working

## 🔧 Troubleshooting

### Error: "Authentication failed"
- Check database secret is correct
- Verify Firebase rules allow authenticated access
- Try generating a new secret

### Error: "Permission denied"
- Check Firebase Realtime Database rules
- Ensure rules allow read/write for authenticated users
- Verify database secret is valid

### Error: "Connection timeout"
- Check network connectivity
- Verify Firebase database URL is correct
- Check firewall settings

## 📚 Next Steps

1. Get database secret from Firebase Console
2. Update ESP32 firmware with secret
3. Upload firmware to ESP32
4. Verify connection in Serial Monitor
5. Test data flow end-to-end

---

**Your Firebase Configuration**:
- **Project**: lumeshield-x
- **Database URL**: https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app
- **API Key**: AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs
- **Region**: asia-southeast1

**Status**: 95% Complete - Just need database secret for ESP32
