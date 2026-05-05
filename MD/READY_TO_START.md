# 🚀 Ready to Start - ESP32 Web Platform Integration

## ✅ Configuration Complete!

All Firebase credentials have been configured. You're ready to start the system!

---

## 📋 What's Been Configured

### 1. Frontend Configuration ✅
**File**: `.env.local` (created)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumeshield-x
# ... all other Firebase config
```

### 2. Backend Configuration ✅
**File**: `.env`

```env
FIREBASE_DATABASE_URL=https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/
CLOUD_PROVIDER=firebase
```

### 3. ESP32 Firmware Configuration ✅
**File**: `esp32_secure/safeedge_firebase_circular_buffer.ino`

```cpp
#define FIREBASE_HOST "lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"
#define API_KEY "AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs"
```

### 4. Firebase Rules ✅
**File**: `firebase-realtime-database-rules.json` (created)

Ready to deploy to Firebase Console.

---

## ⚠️ One More Step: Database Secret

Your ESP32 needs a **Database Secret** to authenticate with Firebase.

### Quick Option (For Testing):

Set Firebase rules to allow unauthenticated access temporarily:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. Click **Publish**

Then ESP32 will work with empty `FIREBASE_AUTH`:
```cpp
#define FIREBASE_AUTH ""  // Empty for testing
```

### Production Option:

Get database secret from Firebase Console:
- See `FIREBASE_AUTH_TOKEN_INSTRUCTIONS.md` for detailed steps

---

## 🚀 Start the System

### Terminal 1: Start Backend

```bash
cd src/backend
python -m uvicorn main:app --reload --port 9002
```

**Expected output**:
```
🚀 SafeEdge Backend Starting...
✅ SafeEdge Backend started with firebase provider
INFO:     Uvicorn running on http://0.0.0.0:9002
```

**Verify**:
```bash
curl http://localhost:9002/health
```

---

### Terminal 2: Start Frontend

```bash
npm run dev
```

**Expected output**:
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

**Access**: http://localhost:3000

---

### Terminal 3: Upload ESP32 Firmware

1. **Open Arduino IDE**
2. **Open file**: `esp32_secure/safeedge_firebase_circular_buffer.ino`
3. **Verify configuration** (lines 33-35):
   ```cpp
   #define FIREBASE_HOST "lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"
   #define FIREBASE_AUTH ""  // Empty for testing, or add secret
   #define API_KEY "AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs"
   ```
4. **Select Board**: ESP32 Dev Module
5. **Select Port**: (your ESP32 port)
6. **Click Upload**
7. **Open Serial Monitor** (115200 baud)

**Expected Serial Output**:
```
🚀 SafeEdge ESP32 Gateway Starting...
📋 Device ID: esp32_gateway_001
📋 Device Name: NICU Gateway #1
📋 Organization: org_12345
📋 Firmware: 4.0.0-FIREBASE-CB

🔌 Connecting to Ethernet...
✅ Ethernet connected
📡 IP Address: 192.168.1.177
📡 MAC Address: DE:AD:BE:EF:FE:ED

🔥 Connecting to Firebase...
✅ Firebase connected
📝 Device registered: esp32_gateway_001

✅ System initialized successfully
🟢 Status: SAFE | Score: 100
```

---

## 🧪 Test the System

### 1. Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **lumeshield-x** project
3. Navigate to **Realtime Database**
4. You should see data appearing:

```
/devices/esp32_gateway_001/
├── info/
│   ├── deviceId: "esp32_gateway_001"
│   ├── deviceName: "NICU Gateway #1"
│   ├── status: "online"
│   └── lastSeen: "2026-04-10T..."
├── current/
│   ├── timestamp: "2026-04-10T..."
│   ├── temperature: 37.2
│   ├── humidity: 55.5
│   ├── threatLevel: "safe"
│   └── securityScore: 100
└── sensorHistory/
    ├── metadata/
    │   ├── currentIndex: 0
    │   └── totalWrites: 1
    └── readings/
        └── 0/ {...}
```

---

### 2. Test Backend API

```bash
# Get all devices
curl http://localhost:9002/api/esp32/devices

# Get device details
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001

# Get current sensor data
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/current

# Get sensor history
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/history?limit=5

# Get system status
curl http://localhost:9002/api/esp32/status
```

---

### 3. Test WebSocket (Browser Console)

Open browser console (F12) on http://localhost:3000:

```javascript
// Connect to device WebSocket
const ws = new WebSocket('ws://localhost:9002/ws/devices/esp32_gateway_001');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Message:', message);
};

// You should see real-time sensor updates every 3 seconds
```

---

### 4. Test Dashboard

1. Navigate to: http://localhost:3000/org-dashboard/esp32
2. You should see your ESP32 device in the list
3. Device status should show "online"
4. Real-time data should update automatically

---

### 5. Send Commands to ESP32

```bash
# Check device status
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STATUS"}'

# Simulate temperature attack
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TEMP_ATTACK"}'
```

**Watch Serial Monitor** - you should see:
```
📨 Command received: TEMP_ATTACK
🚨 SIMULATING TEMPERATURE ATTACK
🔴 RED LED: ON (Critical)
🔊 BUZZER: Attack alarm
⚠️  Threat Level: CRITICAL
📊 Security Score: 25
```

**Watch Dashboard** - you should see:
- Device status changes to "critical"
- Security score drops to 25
- Red LED indicator appears
- Alert notification appears

**Stop the attack**:
```bash
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STOP_ATTACK"}'
```

---

## 📊 Monitor Everything

### Backend Logs (Terminal 1)
Watch for:
- API requests
- WebSocket connections
- Firebase operations

### Frontend Logs (Browser Console)
Watch for:
- WebSocket messages
- Component updates
- Real-time data

### ESP32 Logs (Serial Monitor)
Watch for:
- Sensor readings
- Firebase writes
- Command execution
- LED/buzzer status

### Firebase Console
Watch for:
- Data updates in real-time
- Circular buffer filling up
- Alert entries

---

## 🎯 Demo Scenario

### Complete Attack Simulation:

1. **Start with clean state**:
   ```bash
   curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
     -H "Content-Type: application/json" \
     -d '{"command": "STOP_ATTACK"}'
   ```

2. **Open dashboard**: http://localhost:3000/org-dashboard/esp32

3. **Trigger attack**:
   ```bash
   curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
     -H "Content-Type: application/json" \
     -d '{"command": "TEMP_ATTACK"}'
   ```

4. **Watch the magic happen**:
   - ✅ ESP32 LEDs change (Red blinks)
   - ✅ Buzzer sounds alarm
   - ✅ Dashboard updates in real-time
   - ✅ Alert appears in dashboard
   - ✅ Security score drops
   - ✅ Firebase data updates
   - ✅ WebSocket pushes notification

5. **Stop attack**:
   ```bash
   curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
     -H "Content-Type: application/json" \
     -d '{"command": "STOP_ATTACK"}'
   ```

6. **Watch recovery**:
   - ✅ LEDs return to green
   - ✅ Buzzer stops
   - ✅ Security score recovers
   - ✅ Dashboard shows "safe" status

---

## 📚 Documentation Reference

- **FIREBASE_SETUP_GUIDE.md** - Complete Firebase setup
- **FIREBASE_AUTH_TOKEN_INSTRUCTIONS.md** - Get database secret
- **QUICK_START_COMMANDS.md** - All commands
- **FIREBASE_CONFIGURATION_STATUS.md** - Configuration checklist
- **FIRMWARE_UPDATE_SUMMARY.md** - Implementation summary
- **IMPLEMENTATION_PROGRESS.md** - Current progress

---

## 🔧 Troubleshooting

### ESP32 Not Connecting to Firebase

**Check**:
1. Ethernet cable connected
2. IP address assigned (check Serial Monitor)
3. Firebase rules allow access
4. API key is correct

**Solution**:
- Set Firebase rules to allow all (for testing)
- Verify network connectivity
- Check Serial Monitor for error messages

### Backend Not Starting

**Check**:
1. Python dependencies installed
2. `.env` file exists
3. Port 9002 not in use

**Solution**:
```bash
pip install -r requirements.txt
lsof -ti:9002 | xargs kill  # Kill process on port 9002
```

### Frontend Not Connecting

**Check**:
1. `.env.local` file exists
2. Backend is running
3. Port 3000 not in use

**Solution**:
```bash
# Restart Next.js dev server
npm run dev
```

### WebSocket Not Working

**Check**:
1. Backend WebSocket server running
2. Browser console for errors
3. Firewall not blocking WebSocket

**Solution**:
- Check backend logs
- Try different browser
- Verify WebSocket URL

---

## ✅ Success Checklist

- [ ] Backend server running (port 9002)
- [ ] Frontend server running (port 3000)
- [ ] ESP32 connected to Ethernet
- [ ] ESP32 connected to Firebase
- [ ] Data appearing in Firebase Console
- [ ] Device visible in dashboard
- [ ] Real-time updates working
- [ ] WebSocket connected
- [ ] Commands working
- [ ] LEDs and buzzer responding

---

## 🎉 You're Ready!

Everything is configured and ready to go. Just:

1. **Start backend** (Terminal 1)
2. **Start frontend** (Terminal 2)
3. **Upload ESP32 firmware** (Arduino IDE)
4. **Open dashboard** (Browser)
5. **Test commands** (Terminal 3)

**Your system is now live with real-time ESP32 integration!**

---

**Firebase Project**: lumeshield-x  
**Database URL**: https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app  
**API Key**: AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs  
**Status**: ✅ Ready to Start!
