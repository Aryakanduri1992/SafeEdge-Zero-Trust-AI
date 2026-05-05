# Quick Start Commands - ESP32 Web Platform

## 🚀 Getting Started

### 1. Configure Firebase Credentials

**You need to get these from Firebase Console**:

1. **Web API Key**: Project Settings → Web API Key
2. **Database Secret**: Project Settings → Service accounts → Database secrets
3. **Service Account JSON**: Project Settings → Service accounts → Generate new private key

**Update these files**:
- `.env` (backend) - ✅ Already updated with database URL
- `.env.local` (frontend) - Create this file with Firebase config
- `esp32_secure/safeedge_firebase_circular_buffer.ino` - ✅ Already updated with database URL

---

## 🔧 Backend Setup

```bash
# Navigate to backend directory
cd src/backend

# Install dependencies (if not already done)
pip install -r requirements.txt

# Place firebase-credentials.json in project root
# (Download from Firebase Console → Service accounts)

# Start backend server
python -m uvicorn main:app --reload --port 9002

# Server will be available at: http://localhost:9002
```

**Verify Backend**:
```bash
# Health check
curl http://localhost:9002/health

# ESP32 system status
curl http://localhost:9002/api/esp32/status

# WebSocket stats
curl http://localhost:9002/api/websocket/stats
```

---

## 🎨 Frontend Setup

```bash
# Navigate to project root
cd /path/to/project

# Create .env.local file with Firebase config
# (See FIREBASE_SETUP_GUIDE.md for details)

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Frontend will be available at: http://localhost:3000
```

**Access Dashboard**:
- Main Dashboard: `http://localhost:3000`
- ESP32 Dashboard: `http://localhost:3000/org-dashboard/esp32`

---

## 🔌 ESP32 Firmware Upload

### Prerequisites:
- Arduino IDE installed
- ESP32 board support installed
- Required libraries installed:
  - Firebase ESP Client (v4.4.14+)
  - ArduinoJson (v7.0.0+)
  - Ethernet (built-in)
  - SPI (built-in)

### Steps:

1. **Open Firmware**:
   ```
   Open: esp32_secure/safeedge_firebase_circular_buffer.ino
   ```

2. **Configure Credentials** (lines 33-35):
   ```cpp
   #define FIREBASE_HOST "lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"
   #define FIREBASE_AUTH "your_database_secret_here"  // Get from Firebase Console
   #define API_KEY "your_web_api_key_here"            // Get from Firebase Console
   ```

3. **Configure Device** (lines 38-41):
   ```cpp
   #define DEVICE_ID "esp32_gateway_001"
   #define DEVICE_NAME "NICU Gateway #1"
   #define ORGANIZATION_ID "org_12345"
   ```

4. **Configure Network** (line 68):
   ```cpp
   IPAddress ip(192, 168, 1, 177);  // Adjust for your network
   ```

5. **Upload**:
   - Connect ESP32 via USB
   - Select Board: ESP32 Dev Module
   - Select Port: (your ESP32 port)
   - Click Upload
   - Open Serial Monitor (115200 baud)

### Expected Serial Output:
```
🚀 SafeEdge ESP32 Gateway Starting...
🔌 Connecting to Ethernet...
✅ Ethernet connected: 192.168.1.177
🔥 Connecting to Firebase...
✅ Firebase connected
📝 Device registered: esp32_gateway_001
✅ System initialized successfully
```

---

## 🧪 Testing Commands

### Test Backend API:

```bash
# List all devices
curl http://localhost:9002/api/esp32/devices

# Get specific device
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001

# Get current sensor data
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/current

# Get sensor history (last 10 readings)
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/history?limit=10

# Get alerts
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/alerts

# Send command to ESP32
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STATUS"}'

# Simulate attack
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TEMP_ATTACK"}'

# Stop attack
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STOP_ATTACK"}'

# Get device statistics
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/statistics

# Get alert statistics
curl http://localhost:9002/api/esp32/alerts/statistics

# Get system status
curl http://localhost:9002/api/esp32/status
```

### Test WebSocket (Browser Console):

```javascript
// Connect to device WebSocket
const ws = new WebSocket('ws://localhost:9002/ws/devices/esp32_gateway_001');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Message:', message);
  
  // Handle different message types
  switch(message.type) {
    case 'sensor_update':
      console.log('🌡️ Sensor data:', message.data);
      break;
    case 'alert':
      console.log('🚨 Alert:', message.alert);
      break;
    case 'status_change':
      console.log('📊 Status:', message.info);
      break;
  }
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('❌ WebSocket disconnected');
};

// Send ping to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping');
  }
}, 25000);
```

---

## 📊 Monitor Firebase Data

### Firebase Console:
1. Go to: https://console.firebase.google.com/
2. Select project: **lumeshield-x**
3. Navigate to: **Realtime Database**
4. Watch data update in real-time

### Expected Structure:
```
/devices/esp32_gateway_001/
├── info/
│   ├── deviceId: "esp32_gateway_001"
│   ├── deviceName: "NICU Gateway #1"
│   ├── status: "online"
│   └── lastSeen: "2026-04-10T10:30:00Z"
├── current/
│   ├── timestamp: "2026-04-10T10:30:15Z"
│   ├── temperature: 37.2
│   ├── humidity: 55.5
│   ├── threatLevel: "safe"
│   └── securityScore: 100
├── sensorHistory/
│   ├── metadata/
│   │   ├── currentIndex: 5
│   │   ├── totalWrites: 5
│   │   └── maxEntries: 200
│   └── readings/
│       ├── 0/ {...}
│       ├── 1/ {...}
│       └── 2/ {...}
└── alerts/
    ├── metadata/
    │   ├── currentIndex: 0
    │   └── totalAlerts: 0
    └── entries/ {}
```

---

## 🎯 Common Commands

### Send Commands to ESP32:

```bash
# Check device status
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STATUS"}'

# Simulate temperature attack
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TEMP_ATTACK"}'

# Stop attack simulation
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STOP_ATTACK"}'

# Reset device
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "RESET"}'
```

### View Logs:

```bash
# Backend logs (if running in terminal)
# Just watch the terminal where uvicorn is running

# ESP32 logs
# Open Serial Monitor in Arduino IDE (115200 baud)

# Frontend logs
# Open browser console (F12)
```

---

## 🔍 Troubleshooting Commands

### Check if services are running:

```bash
# Check if backend is running
curl http://localhost:9002/health

# Check if frontend is running
curl http://localhost:3000

# Check WebSocket server
curl http://localhost:9002/api/websocket/stats
```

### Check Firebase connection:

```bash
# Backend Firebase connection
curl http://localhost:9002/health

# ESP32 Firebase connection
# Check Serial Monitor for "✅ Firebase connected"
```

### Check network connectivity:

```bash
# Ping ESP32 (if you know its IP)
ping 192.168.1.177

# Check if ESP32 is on network
arp -a | grep 192.168.1.177
```

---

## 📝 Development Workflow

### Typical Development Session:

```bash
# Terminal 1: Start Backend
cd src/backend
python -m uvicorn main:app --reload --port 9002

# Terminal 2: Start Frontend
npm run dev

# Terminal 3: Monitor logs or run tests
curl http://localhost:9002/api/esp32/status

# Arduino IDE: Upload firmware and monitor Serial
```

### Making Changes:

1. **Backend Changes**:
   - Edit files in `src/backend/`
   - Server auto-reloads (--reload flag)
   - Test with curl commands

2. **Frontend Changes**:
   - Edit files in `src/`
   - Next.js auto-reloads
   - Check browser console for errors

3. **ESP32 Changes**:
   - Edit `esp32_secure/safeedge_firebase_circular_buffer.ino`
   - Re-upload to ESP32
   - Monitor Serial output

---

## 🎬 Demo Commands

### For Live Presentation:

```bash
# 1. Show system status
curl http://localhost:9002/api/esp32/status | jq

# 2. Show device details
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001 | jq

# 3. Trigger attack simulation
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "TEMP_ATTACK"}'

# 4. Watch real-time updates in dashboard
# Open: http://localhost:3000/org-dashboard/esp32

# 5. Stop attack
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STOP_ATTACK"}'

# 6. Show alert statistics
curl http://localhost:9002/api/esp32/alerts/statistics | jq
```

---

## 📚 Documentation Files

- `FIREBASE_SETUP_GUIDE.md` - Complete Firebase configuration guide
- `FIRMWARE_UPDATE_SUMMARY.md` - Implementation summary
- `IMPLEMENTATION_PROGRESS.md` - Current progress status
- `ESP32_QUICK_START.md` - ESP32 setup guide
- `ESP32_SECURITY_FEATURES.md` - Security architecture
- `.kiro/specs/esp32-web-platform-integration/design.md` - Complete design
- `.kiro/specs/esp32-web-platform-integration/tasks.md` - Implementation tasks

---

**Last Updated**: 2026-04-10  
**Status**: Ready for Firebase Configuration ✅  
**Next Step**: Get Firebase credentials and configure
