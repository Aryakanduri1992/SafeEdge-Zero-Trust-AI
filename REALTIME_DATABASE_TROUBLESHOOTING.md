# Firebase Realtime Database - Device Data Not Visible Issue

## Problem
Device data is not visible in the UI even though data is being sent to Firebase Realtime Database.

## Data Flow Analysis

### 1. **Data Storage Path** ✅
- **Backend stores data at**: `devices/{device_id}/data/{timestamp_key}`
- **Backend reads data from**: `devices/{device_id}/data`
- **Paths match**: ✅ Correct

### 2. **Frontend Data Fetching**
```typescript
// Frontend: src/app/org-dashboard/devices/[deviceId]/page.tsx
// Calls: /api/sensor-data/${deviceInfo.esp32DeviceId}?hours=24

// Next.js API: src/app/api/sensor-data/[deviceId]/route.ts
// Forwards to: http://10.192.71.133:8000/api/sensor-data/${deviceId}/encrypted?hours=${hours}

// Python Backend: src/backend/main.py
// Reads from: db.reference(f'devices/{device_id}/data')
```

## Possible Issues & Solutions

### Issue 1: Backend Server Not Running ❌
**Check if Python backend is running on port 8000**

```bash
# Check if backend is running
curl http://10.192.71.133:8000/health

# Or check locally
curl http://localhost:8000/health
```

**Solution**: Start the backend server
```bash
cd src/backend
python3 main.py
```

---

### Issue 2: Wrong Backend URL in Frontend ❌
**Current frontend API route uses**: `http://10.192.71.133:8000`

**Check if this IP is correct**:
```bash
# Get your machine's IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Solution**: Update the backend URL in `src/app/api/sensor-data/[deviceId]/route.ts`
```typescript
// Change this line:
const backendUrl = `http://10.192.71.133:8000/api/sensor-data/${deviceId}/encrypted?hours=${hours}`;

// To your correct IP or localhost:
const backendUrl = `http://localhost:8000/api/sensor-data/${deviceId}/encrypted?hours=${hours}`;
```

---

### Issue 3: Device ID Mismatch ❌
**Frontend uses**: `deviceInfo.esp32DeviceId`
**Simulator sends data with**: `iot_temperature_sensor_20260414185938_62fd12aa`

**Check if device IDs match**:
1. Open browser console (F12)
2. Look for: `📡 Fetching sensor data for device: ...`
3. Compare with simulator device ID

**Solution**: Ensure the device in Firestore has the correct `esp32DeviceId` field

---

### Issue 4: Firebase Realtime Database Not Initialized ❌
**Check Firebase initialization in backend**

```bash
# Check backend logs for:
# ✅ Firebase initialized successfully
# ❌ Firebase initialization failed
```

**Solution**: Verify Firebase credentials
```bash
# Check if service account file exists
ls -la src/backend/safeedge-firebase-adminsdk.json

# Check .env file
cat src/backend/.env | grep FIREBASE
```

---

### Issue 5: No Data Being Sent ❌
**Check if simulator is actually sending data**

```bash
# Run the simulator
python3 laptop2_fixed_normal_data.py

# Look for:
# ✅ Sent to ESP32 → Firebase
# ❌ Failed to send
```

**Check ESP32 is running and forwarding data**:
- ESP32 should be online at `172.20.10.10`
- ESP32 receives data from laptop2 via Ethernet
- ESP32 forwards to backend via WiFi

---

### Issue 6: CORS or Network Issues ❌
**Check browser console for errors**:
- Open DevTools (F12) → Console tab
- Look for network errors or CORS errors

**Solution**: Check CORS settings in backend
```python
# src/backend/main.py should have:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Quick Diagnostic Steps

### Step 1: Check Backend Health
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", ...}
```

### Step 2: Check if Data Exists in Firebase
```bash
# Use Firebase Console
# Go to: https://console.firebase.google.com
# Navigate to: Realtime Database → devices → {device_id} → data
# Should see timestamped entries
```

### Step 3: Test Backend API Directly
```bash
# Replace with your actual device ID
curl "http://localhost:8000/api/sensor-data/iot_temperature_sensor_20260414185938_62fd12aa/encrypted?hours=24"

# Expected: {"device_id": "...", "count": X, "encrypted_data": [...]}
```

### Step 4: Check Frontend API Route
```bash
# Open browser and go to:
http://localhost:9002/api/sensor-data/iot_temperature_sensor_20260414185938_62fd12aa?hours=24

# Should return sensor data
```

### Step 5: Check Browser Console
1. Open the device details page in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for:
   - `📡 Fetching sensor data for device: ...`
   - `📊 Fetched sensor data: X entries`
   - Any error messages

---

## Most Likely Issues (Ranked)

### 🔴 #1: Backend Server Not Running
**Probability**: 80%
**Fix**: Start the backend server
```bash
cd src/backend
python3 main.py
```

### 🟡 #2: Wrong Backend URL
**Probability**: 15%
**Fix**: Update `src/app/api/sensor-data/[deviceId]/route.ts` with correct IP

### 🟢 #3: Device ID Mismatch
**Probability**: 5%
**Fix**: Verify device IDs match between Firestore and simulator

---

## Testing Commands

### Test Complete Data Flow
```bash
# Terminal 1: Start backend
cd src/backend
python3 main.py

# Terminal 2: Start frontend
npm run dev

# Terminal 3: Send test data
python3 laptop2_fixed_normal_data.py

# Browser: Open device details page
# http://localhost:9002/org-dashboard/devices/{deviceId}
```

### Check Firebase Realtime Database Directly
```python
# Quick Python script to check Firebase
import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate('src/backend/safeedge-firebase-adminsdk.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://safeedge-default-rtdb.firebaseio.com'
})

device_id = 'iot_temperature_sensor_20260414185938_62fd12aa'
data = db.reference(f'devices/{device_id}/data').get()
print(f"Data entries: {len(data) if data else 0}")
if data:
    print(f"Latest entry: {list(data.keys())[-1]}")
```

---

## Next Steps

1. **Start with Step 1**: Check if backend is running
2. **Check browser console**: Look for specific error messages
3. **Test backend API directly**: Verify data is being returned
4. **Check device ID**: Ensure IDs match between Firestore and Firebase Realtime DB

## Need More Help?

Run these commands and share the output:
```bash
# Check backend status
curl http://localhost:8000/health

# Check sensor data API
curl "http://localhost:8000/api/sensor-data/iot_temperature_sensor_20260414185938_62fd12aa/encrypted?hours=24"

# Check frontend API
curl "http://localhost:9002/api/sensor-data/iot_temperature_sensor_20260414185938_62fd12aa?hours=24"
```
