# Testing Backend Implementation

## What's Been Implemented

### ✅ Backend Services
1. **Firebase ESP32 Service** (`src/backend/firebase_esp32_service.py`)
   - Complete Firebase integration
   - Circular buffer support (200 entries)
   - Device management
   - Alert management
   - Command system

2. **ESP32 API Endpoints** (`src/backend/esp32_api.py`)
   - 12 REST API endpoints
   - Firebase-backed
   - Circular buffer aware
   - Query parameters support

## How to Test

### 1. Start Backend Server
```bash
cd src/backend
python main.py
```

### 2. Test API Endpoints

#### Get All Devices
```bash
curl http://localhost:9002/api/esp32/devices
```

**Expected Response**:
```json
{
  "success": true,
  "count": 1,
  "devices": [
    {
      "deviceId": "esp32_gateway_001",
      "deviceName": "NICU Gateway #1",
      "status": "online",
      "threatLevel": "safe",
      "securityScore": 100,
      ...
    }
  ]
}
```

#### Get Device Details
```bash
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001
```

#### Get Current Sensor Data
```bash
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/current
```

#### Get Sensor History (Circular Buffer)
```bash
curl "http://localhost:9002/api/esp32/devices/esp32_gateway_001/history?limit=10"
```

**Expected Response**:
```json
{
  "success": true,
  "deviceId": "esp32_gateway_001",
  "count": 10,
  "data": [
    {
      "timestamp": "2026-04-09T10:30:15",
      "temperature": 37.2,
      "humidity": 55.5,
      "threatLevel": "safe",
      "securityScore": 100
    },
    ...
  ],
  "metadata": {
    "currentIndex": 45,
    "totalWrites": 1245,
    "maxEntries": 200
  }
}
```

#### Get Alerts
```bash
curl "http://localhost:9002/api/esp32/devices/esp32_gateway_001/alerts?limit=5"
```

#### Send Command to ESP32
```bash
curl -X POST http://localhost:9002/api/esp32/devices/esp32_gateway_001/command \
  -H "Content-Type: application/json" \
  -d '{"command": "STATUS"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Command 'STATUS' sent to device esp32_gateway_001",
  "command": "STATUS",
  "deviceId": "esp32_gateway_001"
}
```

#### Get System Status
```bash
curl http://localhost:9002/api/esp32/status
```

**Expected Response**:
```json
{
  "success": true,
  "totalDevices": 1,
  "online": 1,
  "offline": 0,
  "threatLevels": {
    "safe": 1,
    "warning": 0,
    "critical": 0
  },
  "averageSecurityScore": 100.0,
  "systemStatus": "healthy"
}
```

## Integration with ESP32 Firmware

### ESP32 → Firebase → Backend Flow

1. **ESP32 writes to Firebase**:
   ```
   /devices/esp32_gateway_001/current/
   /devices/esp32_gateway_001/sensorHistory/readings/45/
   ```

2. **Backend reads from Firebase**:
   ```python
   firebase_service.get_device_current_data("esp32_gateway_001")
   firebase_service.get_sensor_history("esp32_gateway_001", limit=50)
   ```

3. **Dashboard calls Backend API**:
   ```javascript
   fetch('/api/esp32/devices/esp32_gateway_001/current')
   ```

### Backend → Firebase → ESP32 Flow

1. **Dashboard sends command**:
   ```javascript
   fetch('/api/esp32/devices/esp32_gateway_001/command', {
     method: 'POST',
     body: JSON.stringify({ command: 'TEMP_ATTACK' })
   })
   ```

2. **Backend writes to Firebase**:
   ```python
   firebase_service.send_command("esp32_gateway_001", "TEMP_ATTACK")
   # Writes to: /commands/esp32_gateway_001/pending
   ```

3. **ESP32 reads from Firebase**:
   ```cpp
   String command = Firebase.getString("/commands/esp32_gateway_001/pending");
   executeCommand(command);
   ```

## Verify Circular Buffer

### Test Circular Buffer Wrapping

1. **Check metadata**:
```bash
# This should show currentIndex, totalWrites, etc.
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/history?limit=1
```

2. **Verify wrap-around**:
   - If `totalWrites` > 200, buffer has wrapped
   - `currentIndex` should be between 0-199
   - `oldestEntry` = `currentIndex`
   - `newestEntry` = `(currentIndex - 1 + 200) % 200`

## Next Steps

### To Complete Implementation:

1. **Create WebSocket Server** (High Priority)
   - Real-time updates
   - Firebase change listeners
   - Connection management

2. **Update Frontend Components** (High Priority)
   - Connect to new API endpoints
   - Display circular buffer data
   - Show real-time updates

3. **Create Dashboard Pages** (Medium Priority)
   - Device overview page
   - Device details page
   - Provisioning wizard

4. **Testing** (High Priority)
   - End-to-end testing
   - Load testing
   - WebSocket testing

## Current Architecture

```
┌─────────────┐
│   ESP32     │
│  Firmware   │
└──────┬──────┘
       │ (writes data)
       ↓
┌─────────────┐
│  Firebase   │
│  Realtime   │
│  Database   │
└──────┬──────┘
       │ (reads data)
       ↓
┌─────────────┐
│  Backend    │
│  FastAPI    │
│  + Firebase │
│   Service   │
└──────┬──────┘
       │ (REST API)
       ↓
┌─────────────┐
│  Frontend   │
│  Next.js    │
│  Dashboard  │
└─────────────┘
```

## Success Criteria

- [x] Backend can read from Firebase
- [x] Circular buffer handled correctly
- [x] API endpoints functional
- [x] Commands can be sent
- [ ] WebSocket real-time updates
- [ ] Frontend displays data
- [ ] End-to-end flow working

**Status**: Backend 60% Complete ✅
