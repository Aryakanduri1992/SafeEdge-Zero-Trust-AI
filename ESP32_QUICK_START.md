# ESP32 Quick Start Guide - 5 Minutes to Running System

## What You Need Right Now

### 1. Your Hardware (Already Built ✅)
- ESP32 DevKit v1 with all connections
- USB cable to connect to computer
- 12V power supply

### 2. Software to Install (15 minutes)
1. **Arduino IDE** - https://www.arduino.cc/en/software
2. **ESP32 Board Support** - Add in Arduino IDE
3. **Two Libraries**:
   - Firebase ESP Client
   - ArduinoJson

### 3. Firebase Account (10 minutes)
- Create free Firebase project
- Enable Realtime Database
- Get 3 credentials (explained below)

---

## Step-by-Step Setup

### STEP 1: Install Arduino IDE (5 minutes)

1. Download Arduino IDE 2.0+ from https://www.arduino.cc/en/software
2. Install and open it
3. Go to **File → Preferences**
4. In "Additional Board Manager URLs", paste:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Click OK
6. Go to **Tools → Board → Boards Manager**
7. Search "esp32"
8. Install "esp32 by Espressif Systems"

### STEP 2: Install Libraries (3 minutes)

1. Go to **Tools → Manage Libraries**
2. Search "Firebase ESP Client"
3. Install "Firebase ESP Client by Mobizt"
4. Search "ArduinoJson"
5. Install "ArduinoJson by Benoit Blanchon"

### STEP 3: Create Firebase Project (10 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "SafeEdge" (or anything you want)
4. Disable Google Analytics (optional)
5. Click "Create project"

**Enable Realtime Database**:
1. In left menu, click "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose your location
4. Start in "Test mode"
5. Click "Enable"

**Get Your Credentials**:

**Credential 1 - Database URL**:
- Look at the top of Realtime Database page
- Copy the URL (looks like: `your-project-default-rtdb.firebaseio.com`)
- Write it down!

**Credential 2 - API Key**:
1. Click gear icon (⚙️) → "Project settings"
2. Under "General" tab, find "Web API Key"
3. Copy it (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
4. Write it down!

**Credential 3 - Legacy Token**:
1. Still in Project Settings, click "Service accounts" tab
2. Click "Database secrets" at bottom
3. You'll see a secret token (or click "Add secret")
4. Copy the token (long string)
5. Write it down!

### STEP 4: Configure Firmware (2 minutes)

1. Open `esp32_secure/safeedge_firebase_circular_buffer.ino` in Arduino IDE
2. Find these lines near the top:

```cpp
// Firebase Configuration
#define FIREBASE_HOST "safeedge-prod-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_FIREBASE_AUTH_TOKEN"
#define API_KEY "YOUR_FIREBASE_API_KEY"
```

3. Replace with YOUR credentials:
```cpp
#define FIREBASE_HOST "your-project-default-rtdb.firebaseio.com"  // Your Database URL
#define FIREBASE_AUTH "your_legacy_token_here"                     // Your Legacy Token
#define API_KEY "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"              // Your API Key
```

4. Update network settings (find this line):
```cpp
IPAddress ip(192, 168, 1, 177);  // Change to match your network
```
Change to an available IP on your network (e.g., `192, 168, 1, 200`)

5. Save the file (Ctrl+S or Cmd+S)

### STEP 5: Upload to ESP32 (3 minutes)

1. **Connect ESP32**:
   - Plug USB cable into ESP32
   - Connect other end to computer
   - Wait for driver installation (if needed)

2. **Select Board**:
   - Go to **Tools → Board → esp32**
   - Select "ESP32 Dev Module"

3. **Select Port**:
   - Go to **Tools → Port**
   - Select the port (COM3, COM4, etc. on Windows or /dev/ttyUSB0 on Linux)

4. **Upload**:
   - Click the Upload button (→ arrow icon)
   - Wait for "Done uploading" message (takes ~30 seconds)

5. **Open Serial Monitor**:
   - Go to **Tools → Serial Monitor**
   - Set baud rate to **115200** (bottom right)
   - Press EN button on ESP32 to restart

### STEP 6: Verify It's Working (2 minutes)

**In Serial Monitor, you should see**:
```
========================================================
SafeEdge ESP32 Firmware v4.0 - Firebase Circular Buffer
========================================================

Initializing Ethernet...
✅ Ethernet connected
   IP Address: 192.168.1.177

Connecting to Firebase...
✅ Firebase connected

Initializing circular buffers...
✅ Circular buffers initialized

🚀 System ready! Starting monitoring...

📊 Sensor #1 [Index 0/199] - safe | Score: 100 | Temp: 37.12°C
📊 Sensor #2 [Index 1/199] - safe | Score: 100 | Temp: 37.08°C
💓 Heartbeat
```

**In Firebase Console**:
1. Go to Realtime Database
2. You should see data appearing under `/devices/esp32_gateway_001/`
3. Click to expand and see:
   - `info/` - Device information
   - `current/` - Latest sensor reading
   - `sensorHistory/` - Circular buffer with readings

**LEDs**:
- Green LED should be ON (system safe)
- Yellow/Red LEDs off

---

## Quick Tests

### Test 1: Check Data in Firebase
1. Open Firebase Console → Realtime Database
2. Navigate to `/devices/esp32_gateway_001/current/`
3. You should see temperature, humidity, etc. updating every 3 seconds

### Test 2: Check Circular Buffer
1. In Firebase, go to `/devices/esp32_gateway_001/sensorHistory/metadata/`
2. Watch `currentIndex` increment: 0, 1, 2, 3... up to 199, then back to 0
3. Watch `totalWrites` keep increasing

### Test 3: Send a Command
1. In Firebase Console, navigate to `/commands/`
2. Click the "+" button to add a child
3. Enter:
   - Key: `esp32_gateway_001`
   - Click "+" to add child
   - Key: `pending`
   - Value: `STATUS`
4. Click "Add"
5. Watch Serial Monitor - you should see device status printed

### Test 4: Trigger an Alert
1. In Firebase, go to `/commands/esp32_gateway_001/`
2. Set `pending` to `TEMP_ATTACK`
3. Watch:
   - Serial Monitor shows "🔥 Simulating temperature attack..."
   - Red LED turns on
   - Buzzer sounds
   - Alert appears in `/devices/esp32_gateway_001/alerts/entries/0/`

---

## Troubleshooting

### "Ethernet connection failed"
- Check Ethernet cable is plugged in
- Verify W5500 wiring (especially GPIO 5 for CS)
- Try different Ethernet cable

### "Firebase connection failed"
- Double-check all 3 credentials (HOST, AUTH, API_KEY)
- Make sure Realtime Database is enabled
- Check Firebase security rules are in "Test mode"

### "Upload failed" or "Port not found"
- Install CH340 driver for ESP32 DevKit v1
- Try different USB cable (must support data, not just power)
- Try different USB port
- Press and hold BOOT button while uploading

### "Compilation error"
- Make sure both libraries are installed (Firebase ESP Client, ArduinoJson)
- Check ESP32 board package is installed
- Restart Arduino IDE

### No data in Firebase
- Check Serial Monitor for error messages
- Verify Firebase credentials are correct
- Make sure Ethernet is connected (check Serial Monitor)
- Try pressing EN button on ESP32 to restart

---

## What's Next?

Now that your ESP32 is running:

1. ✅ **Monitor Data**: Watch Firebase Console for real-time data
2. ✅ **Test Commands**: Send STATUS, TEMP_ATTACK, RESET commands
3. ✅ **Check Circular Buffer**: Verify it wraps at 200 entries
4. ⏳ **Build Web Dashboard**: Display data in web interface
5. ⏳ **Add More Devices**: Provision additional ESP32 gateways
6. ⏳ **Implement Attack Logging**: Add detailed attack reports
7. ⏳ **Generate Security Reports**: PDF reports for incidents

---

## Need Help?

### Common Questions

**Q: How do I change the device ID?**
A: In the firmware, change `#define DEVICE_ID "esp32_gateway_001"` to your desired ID

**Q: How often does it send data?**
A: Every 3 seconds (configurable via `SENSOR_UPDATE_INTERVAL`)

**Q: How many entries in circular buffer?**
A: 200 entries (configurable via `MAX_BUFFER_ENTRIES`)

**Q: Can I use WiFi instead of Ethernet?**
A: Yes, but you'll need to modify the firmware to use WiFi library instead of Ethernet

**Q: How do I update firmware?**
A: Just upload new code via Arduino IDE (same process as initial upload)

### Resources

- **Full Requirements**: See `ESP32_IMPLEMENTATION_REQUIREMENTS.md`
- **Security Details**: See `ESP32_SECURITY_FEATURES.md`
- **Design Document**: See `.kiro/specs/esp32-web-platform-integration/design.md`

---

## Success Checklist

- [ ] Arduino IDE installed
- [ ] ESP32 board support installed
- [ ] Libraries installed (Firebase ESP Client, ArduinoJson)
- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] All 3 credentials obtained
- [ ] Firmware configured with credentials
- [ ] Firmware uploaded successfully
- [ ] Serial Monitor shows "System ready"
- [ ] Data appearing in Firebase
- [ ] Circular buffer working (index incrementing)
- [ ] LEDs working (Green = Safe)
- [ ] Commands working (STATUS command tested)

**If all checked ✅ - Congratulations! Your ESP32 is fully operational!**

---

**Estimated Total Time**: 30-40 minutes  
**Difficulty**: Beginner-Friendly  
**Support**: Check troubleshooting section or review detailed docs
