# 🚀 ESP32 Deployment Checklist - Tomorrow's Tasks

## 📋 Pre-Deployment Configuration

### Step 1: Find Your Backend IP Address

**On Mac** (your system):
```bash
# Option 1: Simple
ipconfig getifaddr en0

# Option 2: Detailed
ifconfig | grep "inet "

# Look for something like: 192.168.1.XXX
```

**Expected Output**: `192.168.1.177` (or similar)

---

### Step 2: Update ESP32 Code

**File**: `esp32_secure/SafeEdge_Complete.ino`

**Changes to Make**:

#### Change 1: Backend API URL (Line ~50)
```cpp
// BEFORE:
#define BACKEND_API_URL "http://192.168.1.100:8000"

// AFTER (use your actual IP):
#define BACKEND_API_URL "http://192.168.1.177:8000"  // <-- YOUR IP HERE
```

#### Change 2: WiFi Credentials (Line ~60) - ONLY if using WiFi
```cpp
// BEFORE:
const char* WIFI_SSID = "";
const char* WIFI_PASSWORD = "";

// AFTER (if using WiFi):
const char* WIFI_SSID = "Hospital-WiFi";  // <-- YOUR WIFI NAME
const char* WIFI_PASSWORD = "your-password";  // <-- YOUR WIFI PASSWORD

// NOTE: Leave empty if using Ethernet only
```

#### Change 3: Firebase URL (Line ~450 in loadConfiguration function)
```cpp
// FIND THIS LINE:
FIREBASE_DATABASE_URL = doc["gateway"]["address"].as<String>();

// REPLACE WITH:
FIREBASE_DATABASE_URL = "https://your-project-id.firebaseio.com";  // <-- YOUR FIREBASE URL

// To find your Firebase URL:
// 1. Go to Firebase Console
// 2. Project Settings
// 3. Realtime Database section
// 4. Copy the URL (looks like: https://xxx.firebaseio.com)
```

---

### Step 3: Verify Backend is Running

```bash
# Terminal 1: Start Backend
cd /path/to/project
python3 -m uvicorn src.backend.main:app --host 0.0.0.0 --port 8000 --reload

# Should see:
# ✅ Firebase Cloud Service initialized
# ✅ WebSocket Server initialized
# INFO: Uvicorn running on http://0.0.0.0:8000
```

**Test Backend**:
```bash
# Open browser:
http://localhost:8000/docs

# Should see FastAPI documentation page
```

---

### Step 4: Verify Frontend is Running

```bash
# Terminal 2: Start Frontend
cd /path/to/project
npm run dev

# Should see:
# ▲ Next.js 15.3.8
# - Local: http://localhost:9002
# ✓ Ready in XXXms
```

**Test Frontend**:
```bash
# Open browser:
http://localhost:9002

# Should see SafeEdge dashboard
```

---

## 🔧 Hardware Setup

### Required Components:
- [ ] ESP32 DevKit v1
- [ ] W5500 Ethernet Module (if using Ethernet)
- [ ] 3x LEDs (Red, Green, Yellow)
- [ ] 3x 220Ω Resistors
- [ ] 1x Buzzer
- [ ] Breadboard
- [ ] Jumper wires
- [ ] USB cable for ESP32

### Wiring Diagram:

```
ESP32 Pin Connections:
====================

Ethernet Module (W5500):
- MOSI → GPIO 23
- MISO → GPIO 19
- SCK  → GPIO 18
- CS   → GPIO 5
- VCC  → 3.3V
- GND  → GND

LEDs (with 220Ω resistors):
- Red LED    → GPIO 32 → Resistor → GND
- Green LED  → GPIO 25 → Resistor → GND
- Yellow LED → GPIO 26 → Resistor → GND

Buzzer:
- Positive → GPIO 33
- Negative → GND

Power:
- USB cable to computer
```

---

## 📦 Arduino IDE Setup

### Step 1: Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install ESP32 board support

### Step 2: Install Required Libraries

**In Arduino IDE**:
1. Go to: Tools → Manage Libraries
2. Install these libraries:

```
Required Libraries:
- Firebase ESP Client (by Mobizt) - v4.x or later
- ArduinoJson (by Benoit Blanchon) - v6.x
- Ethernet (built-in)
```

**Installation Commands** (if using Arduino CLI):
```bash
arduino-cli lib install "Firebase ESP Client"
arduino-cli lib install "ArduinoJson"
```

### Step 3: Configure Arduino IDE

**Board Settings**:
```
Tools → Board → ESP32 Arduino → ESP32 Dev Module

Settings:
- Upload Speed: 115200
- CPU Frequency: 240MHz
- Flash Frequency: 80MHz
- Flash Mode: QIO
- Flash Size: 4MB
- Partition Scheme: Default 4MB with spiffs
- Core Debug Level: None
- Port: /dev/cu.usbserial-XXXX (select your ESP32 port)
```

---

## 🚀 Deployment Steps

### Step 1: Upload Code to ESP32

1. **Open Arduino IDE**
2. **Open File**: `esp32_secure/SafeEdge_Complete.ino`
3. **Verify Changes**:
   - Backend URL updated ✅
   - WiFi credentials added (if needed) ✅
   - Firebase URL set ✅
4. **Connect ESP32** via USB
5. **Select Port**: Tools → Port → (your ESP32 port)
6. **Upload**: Click Upload button (→)
7. **Wait**: Upload takes ~30 seconds

**Expected Output**:
```
Sketch uses XXXXX bytes (XX%) of program storage space.
Global variables use XXXXX bytes (XX%) of dynamic memory.
esptool.py v3.0
...
Writing at 0x00010000... (100%)
Wrote XXXXX bytes (XXXXX compressed) at 0x00010000 in X.X seconds
Hash of data verified.

Leaving...
Hard resetting via RTS pin...
```

### Step 2: Open Serial Monitor

1. **Open Serial Monitor**: Tools → Serial Monitor
2. **Set Baud Rate**: 115200
3. **Watch Output**

**Expected Output**:
```
╔════════════════════════════════════════════════════════╗
║     SafeEdge ESP32 Security Gateway                   ║
║     Mobile Provisioning + Enterprise Security         ║
║     Imagine Cup 2026 - World Championship             ║
╚════════════════════════════════════════════════════════╝

✅ Hardware initialized
✅ SPIFFS initialized
📱 MAC Address: AA:BB:CC:DD:EE:FF
❌ Device not provisioned
📱 Starting mobile provisioning mode...

🌐 Starting Mobile Provisioning Mode
====================================
📡 WiFi AP: SafeEdge-AABBCC
   Password: SafeEdge2026
✅ WiFi AP started
   IP: 192.168.4.1
====================================
📱 Ready for mobile provisioning!
   1. Open SafeEdge Mobile App
   2. Scan QR code from dashboard
   3. Mobile will connect and provision
====================================

✅ Web server started on port 80
```

### Step 3: Test Provisioning Mode

**Check LEDs**:
- Yellow LED should be blinking slowly (1 second interval)
- Red and Green LEDs should be off

**Check WiFi**:
- On your phone/laptop, look for WiFi network: `SafeEdge-XXXXXX`
- Connect to it (password: `SafeEdge2026`)
- Open browser: `http://192.168.4.1`
- Should see provisioning page

---

## 🧪 Testing the Complete Flow

### Test 1: Device Provisioning

1. **Open Dashboard**: http://localhost:9002
2. **Go to Devices Page**
3. **Click "Add Device"**
4. **Fill Form**:
   ```
   Name: ESP32-Test-001
   Type: Temperature Sensor
   Connection: Ethernet (or WiFi)
   Department: (select)
   Floor: (select)
   Room: (select)
   ```
5. **Click "Generate QR Code"**
6. **Wait for QR Code** (~2 seconds)

### Test 2: Mobile Provisioning

**Option A: Using Phone Camera** (Real Scenario):
1. Connect phone to ESP32 WiFi: `SafeEdge-XXXXXX`
2. Scan QR code with camera
3. Browser opens automatically
4. Config sent to ESP32

**Option B: Manual Testing** (For Development):
1. Connect laptop to ESP32 WiFi: `SafeEdge-XXXXXX`
2. Open: http://192.168.4.1
3. Use Postman/curl to send config:
   ```bash
   curl -X POST http://192.168.4.1/provision \
     -H "Content-Type: application/json" \
     -d @config.json
   ```

### Test 3: Verify Provisioning

**Serial Monitor Should Show**:
```
📥 Received provisioning request
   Payload size: XXXX bytes
   Device ID: iot_temperature_sensor_...
   Token: abc123...
🔍 Validating with backend...
   URL: http://192.168.1.177:8000/api/devices/validate
   Response: Device validated successfully
✅ Backend validation successful
✅ Saved: /config/device_config.json (XXXX bytes)
✅ Saved: /certs/ca.crt (XXXX bytes)
✅ Saved: /certs/device.crt (XXXX bytes)
✅ Saved: /certs/device.key (XXXX bytes)
✅ Saved: /keys/encryption.key (XXXX bytes)
✅ All credentials stored in SPIFFS
🎉 Device provisioned successfully!
🔄 Restarting in 3 seconds...
```

**LEDs Should**:
- Green LED blinks 5 times
- Buzzer beeps 2 times
- ESP32 restarts

### Test 4: Device Connection

**After Restart, Serial Monitor Should Show**:
```
✅ Device already provisioned
✅ Configuration loaded
📋 Configuration:
   Device ID: iot_temperature_sensor_...
   Device Name: ESP32-Test-001
   Connection: ethernet

🌐 Connecting to network...
📡 Connecting via Ethernet (W5500)...
   Attempting DHCP...
✅ Ethernet connected
   IP: 192.168.1.200

🔥 Initializing Firebase...
✅ Firebase connected
📊 Sensor data sent [0]: T=25.3°C, H=62.1%
📊 Sensor data sent [1]: T=24.8°C, H=61.5%
```

**LEDs Should**:
- Green LED stays ON (device online)
- Red and Yellow LEDs OFF

### Test 5: Verify in Dashboard

1. **Refresh Devices Page**
2. **Device Should Appear**:
   - Name: ESP32-Test-001
   - Status: 🟢 Online (after status sync)
   - Type: Temperature Sensor
   - Location: Floor X - Room XXX

---

## 🐛 Troubleshooting

### Issue 1: Upload Failed
**Error**: `Failed to connect to ESP32`

**Solutions**:
- Check USB cable connected
- Press and hold BOOT button during upload
- Try different USB port
- Install CH340 driver (if needed)

### Issue 2: WiFi AP Not Starting
**Error**: `❌ Failed to start WiFi AP`

**Solutions**:
- ESP32 might be in wrong mode
- Reset ESP32 (press RST button)
- Re-upload code

### Issue 3: Backend Validation Failed
**Error**: `❌ Backend validation failed - UNAUTHORIZED`

**Solutions**:
- Check backend is running on port 8000
- Verify BACKEND_API_URL is correct
- Check firewall not blocking port 8000
- Test backend: `curl http://YOUR_IP:8000/docs`

### Issue 4: Ethernet Not Connecting
**Error**: `❌ Ethernet connection failed`

**Solutions**:
- Check W5500 wiring (MOSI, MISO, SCK, CS)
- Check Ethernet cable connected
- Check router/switch working
- Try static IP instead of DHCP

### Issue 5: Firebase Connection Failed
**Error**: `❌ Firebase connection failed`

**Solutions**:
- Check FIREBASE_DATABASE_URL is correct
- Verify Firebase Realtime Database enabled
- Check Firebase rules allow write access
- Test Firebase URL in browser

---

## ✅ Success Indicators

### Hardware:
- [ ] Green LED stays ON
- [ ] No red LED blinking
- [ ] Serial monitor shows "online"
- [ ] Sensor data being sent every 5 seconds

### Backend:
- [ ] Backend logs show device validation
- [ ] Firebase Realtime DB has device data
- [ ] Device status shows "online"

### Frontend:
- [ ] Device appears in list
- [ ] Status shows online (after sync)
- [ ] Statistics updated

---

## 📝 Quick Reference

### Serial Monitor Commands:
- Baud Rate: **115200**
- Line Ending: **Both NL & CR**

### Network Info:
- Backend: **http://YOUR_IP:8000**
- Frontend: **http://localhost:9002**
- ESP32 AP: **SafeEdge-XXXXXX** (password: SafeEdge2026)
- ESP32 Web: **http://192.168.4.1**

### LED Indicators:
- **Yellow Blinking**: Provisioning mode
- **Green Blinking**: Provisioned but not connected
- **Green Solid**: Online and working
- **Red Blinking**: Error state

### Important Files:
- Firmware: `esp32_secure/SafeEdge_Complete.ino`
- Backend: `src/backend/device_provisioning_api.py`
- Frontend: `src/app/org-dashboard/devices/page.tsx`

---

## 🎯 Tomorrow's Workflow

1. ☕ **Morning**: Get coffee
2. 🔍 **Find IP**: Run `ipconfig getifaddr en0`
3. ✏️ **Update Code**: Change 3 lines in ESP32 code
4. 🚀 **Upload**: Flash ESP32 with Arduino IDE
5. 📺 **Monitor**: Watch Serial Monitor
6. 🌐 **Test**: Create device in dashboard
7. 📱 **Provision**: Connect to ESP32 and provision
8. ✅ **Verify**: Check device comes online
9. 🎉 **Celebrate**: It works!

---

**Good luck tomorrow! The system is ready, just needs your network configuration! 🚀**

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026  
**Status**: Ready for Hardware Deployment
