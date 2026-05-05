# Firebase Setup Guide for ESP32 Integration

## 🔥 Firebase Realtime Database Configuration

Your Firebase Realtime Database URL:
```
https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/
```

---

## 📋 Step-by-Step Setup

### 1. Get Firebase Credentials

#### A. Get Web API Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **lumeshield-x**
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. Find **Web API Key** (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
6. Copy this key

#### B. Get Database Secret (Legacy Token)
1. In Firebase Console, go to **Project Settings**
2. Click **Service accounts** tab
3. Scroll down to **Database secrets**
4. Click **Show** to reveal the secret
5. Copy the secret token

**Note**: If you don't see "Database secrets", you may need to:
- Go to **Realtime Database** → **Rules** tab
- Click on the **Legacy** tab
- Generate a new secret

#### C. Download Service Account Key (for Backend)
1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file as `firebase-credentials.json`
4. Place it in the project root directory

---

### 2. Configure Backend (.env file)

Update your `.env` file with Firebase credentials:

```env
# Firebase Configuration (Production)
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_DATABASE_URL=https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/

# Cloud Provider
CLOUD_PROVIDER=firebase
```

**✅ Already Updated**: Your `.env` file has been updated with the correct database URL.

---

### 3. Configure Frontend (.env.local)

Create a `.env.local` file in the project root with your Firebase config:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumeshield-x.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumeshield-x
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumeshield-x.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/

# Cloud Provider
NEXT_PUBLIC_CLOUD_PROVIDER=firebase
```

**To get these values**:
1. Go to Firebase Console → Project Settings
2. Scroll to **Your apps** section
3. If no web app exists, click **Add app** → Web (</>) icon
4. Register app with nickname "SafeEdge Web"
5. Copy the config values from the code snippet

---

### 4. Configure ESP32 Firmware

Update `esp32_secure/safeedge_firebase_circular_buffer.ino`:

```cpp
// Firebase Configuration
#define FIREBASE_HOST "lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "your_database_secret_here"  // Legacy token from step 1B
#define API_KEY "your_web_api_key_here"            // Web API key from step 1A

// Device Configuration (customize for each device)
#define DEVICE_ID "esp32_gateway_001"
#define DEVICE_NAME "NICU Gateway #1"
#define ORGANIZATION_ID "org_12345"
#define FIRMWARE_VERSION "4.0.0-FIREBASE-CB"
```

**✅ Already Updated**: The firmware has been updated with your Firebase database URL.

---

### 5. Set Firebase Security Rules

Go to Firebase Console → Realtime Database → Rules tab:

```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "info": {
          ".validate": "newData.hasChildren(['deviceId', 'deviceName', 'status'])"
        },
        "current": {
          ".validate": "newData.hasChildren(['timestamp', 'threatLevel', 'securityScore'])"
        },
        "sensorHistory": {
          "metadata": {
            ".validate": "newData.hasChildren(['currentIndex', 'totalWrites'])",
            "currentIndex": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() < 200"
            }
          },
          "readings": {
            "$index": {
              ".validate": "$index.matches(/^(1?[0-9]{1,2})$/) && newData.hasChildren(['timestamp'])"
            }
          }
        },
        "alerts": {
          "metadata": {
            ".validate": "newData.hasChildren(['currentIndex', 'totalAlerts'])",
            "currentIndex": {
              ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() < 200"
            }
          },
          "entries": {
            "$index": {
              ".validate": "$index.matches(/^(1?[0-9]{1,2})$/) && newData.hasChildren(['timestamp', 'severity'])"
            }
          }
        }
      }
    },
    "commands": {
      "$deviceId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

**Key Features**:
- Requires authentication for read/write
- Validates circular buffer indices (0-199)
- Validates required fields in data structures
- Allows command queue access

---

### 6. Initialize Firebase Database Structure

You can manually create the initial structure in Firebase Console or let the ESP32 create it automatically on first connection.

**Manual Setup** (Optional):
1. Go to Firebase Console → Realtime Database
2. Click **+** to add data
3. Create this structure:

```json
{
  "devices": {
    "esp32_gateway_001": {
      "info": {
        "deviceId": "esp32_gateway_001",
        "deviceName": "NICU Gateway #1",
        "organizationId": "org_12345",
        "status": "offline",
        "firmwareVersion": "4.0.0-FIREBASE-CB",
        "createdAt": "2026-04-10T00:00:00Z"
      },
      "current": {
        "timestamp": "2026-04-10T00:00:00Z",
        "temperature": 0,
        "humidity": 0,
        "threatLevel": "safe",
        "securityScore": 100
      },
      "sensorHistory": {
        "metadata": {
          "currentIndex": 0,
          "totalWrites": 0,
          "oldestEntry": 0,
          "newestEntry": 0,
          "maxEntries": 200
        },
        "readings": {}
      },
      "alerts": {
        "metadata": {
          "currentIndex": 0,
          "totalAlerts": 0,
          "oldestEntry": 0,
          "newestEntry": 0,
          "maxEntries": 200
        },
        "entries": {}
      }
    }
  },
  "commands": {}
}
```

---

## 🧪 Testing Firebase Connection

### Test Backend Connection:

```bash
# Start backend server
cd src/backend
python -m uvicorn main:app --reload --port 9002

# Test health check
curl http://localhost:9002/health

# Test ESP32 status endpoint
curl http://localhost:9002/api/esp32/status
```

### Test ESP32 Connection:

1. Upload firmware to ESP32
2. Open Serial Monitor (115200 baud)
3. Look for these messages:
```
🔌 Connecting to Ethernet...
✅ Ethernet connected: 192.168.1.177
🔥 Connecting to Firebase...
✅ Firebase connected
📝 Device registered: esp32_gateway_001
```

### Test WebSocket Connection:

```javascript
// Open browser console on http://localhost:3000
const ws = new WebSocket('ws://localhost:9002/ws/devices/esp32_gateway_001');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onmessage = (e) => console.log('📨 Message:', JSON.parse(e.data));
```

---

## 📊 Verify Data Flow

### 1. Check Firebase Console
- Go to Realtime Database
- Navigate to `devices/esp32_gateway_001/current`
- You should see data updating every 3 seconds

### 2. Check Backend API
```bash
# Get current device data
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/current

# Get sensor history
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/history?limit=10

# Get alerts
curl http://localhost:9002/api/esp32/devices/esp32_gateway_001/alerts
```

### 3. Check Dashboard
- Navigate to `http://localhost:3000/org-dashboard/esp32`
- Device should appear in the list
- Real-time data should update automatically

---

## 🔧 Troubleshooting

### ESP32 Can't Connect to Firebase

**Problem**: `Firebase connection failed`

**Solutions**:
1. Check Firebase credentials in firmware
2. Verify Ethernet connection (ping test)
3. Check Firebase security rules allow write access
4. Verify database URL is correct (no trailing slash in firmware)

### Backend Can't Connect to Firebase

**Problem**: `Cloud service not initialized`

**Solutions**:
1. Verify `firebase-credentials.json` exists in project root
2. Check file permissions (should be readable)
3. Verify `FIREBASE_DATABASE_URL` in `.env` is correct
4. Check Firebase service account has Database Admin role

### WebSocket Not Receiving Updates

**Problem**: No real-time updates in dashboard

**Solutions**:
1. Check WebSocket connection in browser console
2. Verify backend WebSocket server is running
3. Check Firebase Event Bridge is listening
4. Verify ESP32 is writing data to Firebase

### Circular Buffer Not Wrapping

**Problem**: Data stops after 200 entries

**Solutions**:
1. Check `currentIndex` in Firebase metadata
2. Verify index calculation: `(currentIndex + 1) % 200`
3. Check Firebase security rules allow index 0-199
4. Review Serial Monitor for buffer wrap messages

---

## 📝 Quick Reference

### Firebase Database Structure
```
/devices/{device_id}/
├── info/                    # Device metadata
├── current/                 # Latest sensor reading
├── sensorHistory/
│   ├── metadata/           # Buffer metadata
│   └── readings/           # Circular buffer (0-199)
├── alerts/
│   ├── metadata/           # Buffer metadata
│   └── entries/            # Circular buffer (0-199)
├── connectedIoTDevices/    # Connected devices
└── blockedDevices/         # Blocked devices

/commands/{device_id}/
└── pending                 # Command queue
```

### API Endpoints
- `GET /api/esp32/devices` - List all devices
- `GET /api/esp32/devices/{id}` - Get device details
- `GET /api/esp32/devices/{id}/current` - Current data
- `GET /api/esp32/devices/{id}/history` - Sensor history
- `GET /api/esp32/devices/{id}/alerts` - Device alerts
- `POST /api/esp32/devices/{id}/command` - Send command

### WebSocket Endpoints
- `ws://localhost:9002/ws/devices/{device_id}` - Device updates
- `ws://localhost:9002/ws/organizations/{org_id}` - Org updates

---

## ✅ Checklist

Before deploying, ensure:

- [ ] Firebase credentials obtained (API key, database secret)
- [ ] Service account JSON downloaded
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured
- [ ] ESP32 firmware configured with credentials
- [ ] Firebase security rules deployed
- [ ] Backend server starts without errors
- [ ] ESP32 connects to Firebase successfully
- [ ] WebSocket connections working
- [ ] Real-time data flowing end-to-end

---

## 🚀 Next Steps

Once Firebase is configured:

1. **Upload ESP32 Firmware**
   - Configure credentials in firmware
   - Upload to ESP32 via Arduino IDE
   - Verify connection in Serial Monitor

2. **Start Backend Server**
   ```bash
   cd src/backend
   python -m uvicorn main:app --reload --port 9002
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Test End-to-End**
   - Open dashboard
   - Verify device appears
   - Check real-time updates
   - Send test command

---

**Last Updated**: 2026-04-10  
**Firebase Database**: lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app  
**Status**: Configuration Updated ✅
