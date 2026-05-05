# ESP32 Setup Guide - SafeEdge Complete Firmware

## 🎯 Quick Start

This guide will help you upload and configure the complete SafeEdge firmware to your ESP32.

---

## 📋 Prerequisites

### Hardware Required:
- ✅ ESP32 DevKit v1
- ✅ W5500 Ethernet Module
- ✅ LEDs: Red, Green, Yellow (with 220Ω resistors)
- ✅ Buzzer
- ✅ Jumper wires
- ✅ USB cable
- ✅ 12V power supply (optional, for production)

### Software Required:
- ✅ Arduino IDE (1.8.19 or later) or PlatformIO
- ✅ ESP32 Board Support
- ✅ Required Libraries (see below)

---

## 🔌 Hardware Connections

### W5500 Ethernet Module:
```
W5500 → ESP32
--------------
MOSI  → GPIO 23
MISO  → GPIO 19
SCK   → GPIO 18
CS    → GPIO 5
VCC   → 3.3V
GND   → GND
```

### LEDs (with 220Ω resistors):
```
LED Color → ESP32 GPIO
-----------------------
Red       → GPIO 32
Green     → GPIO 25
Yellow    → GPIO 26
```

### Buzzer:
```
Buzzer → ESP32
--------------
+      → GPIO 33
-      → GND
```

### Power:
```
ESP32 VIN → 5V (from USB or external)
ESP32 GND → GND
```

---

## 📚 Required Libraries

Install these libraries in Arduino IDE:

1. **ESP32 Board Support**
   - Go to: File → Preferences
   - Add URL: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Go to: Tools → Board → Boards Manager
   - Search: "ESP32"
   - Install: "ESP32 by Espressif Systems"

2. **Firebase ESP Client**
   ```
   Library Manager → Search "Firebase ESP Client"
   Install: "Firebase Arduino Client Library for ESP8266 and ESP32"
   by Mobizt
   ```

3. **ArduinoJson**
   ```
   Library Manager → Search "ArduinoJson"
   Install: "ArduinoJson" by Benoit Blanchon
   Version: 6.x.x
   ```

4. **Ethernet Library**
   ```
   Library Manager → Search "Ethernet"
   Install: "Ethernet" by Various (built-in)
   ```

---

## ⚙️ Configuration Steps

### Step 1: Open the Firmware

1. Open Arduino IDE
2. File → Open
3. Navigate to: `esp32_secure/SafeEdge_Complete.ino`
4. Click Open

### Step 2: Configure WiFi (Optional - Only if using WiFi)

Find these lines in the code (around line 50):

```cpp
// WiFi Credentials (USER WILL ADD THESE)
const char* WIFI_SSID = "";  // <-- ADD YOUR WIFI SSID HERE
const char* WIFI_PASSWORD = "";  // <-- ADD YOUR WIFI PASSWORD HERE
```

**If using WiFi connection**, update to:

```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

**If using Ethernet only**, leave empty (default).

### Step 3: Configure Backend API URL

Find this line (around line 40):

```cpp
#define BACKEND_API_URL "http://192.168.1.100:8000"
```

Update with your backend server IP:

```cpp
#define BACKEND_API_URL "http://YOUR_BACKEND_IP:8000"
```

**Example**:
```cpp
#define BACKEND_API_URL "http://192.168.1.50:8000"
```

### Step 4: Select Board and Port

1. Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
2. Tools → Port → Select your ESP32 port (COM3, /dev/ttyUSB0, etc.)
3. Tools → Upload Speed → "115200"
4. Tools → Flash Size → "4MB (32Mb)"
5. Tools → Partition Scheme → "Default 4MB with spiffs"

### Step 5: Upload Firmware

1. Click the Upload button (→) or Sketch → Upload
2. Wait for compilation and upload
3. You should see: "Hard resetting via RTS pin..."
4. Upload complete! ✅

---

## 🧪 Testing

### Step 1: Open Serial Monitor

1. Tools → Serial Monitor
2. Set baud rate to: **115200**
3. You should see:

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
📡 WiFi AP: SafeEdge-XXYYZZ
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

### Step 2: Check LED Status

- **Yellow Blinking**: Provisioning mode (waiting for mobile)
- **Green Solid**: Connected and operational
- **Red Blinking**: Error or not connected

### Step 3: Test Web Interface

1. Connect your computer/phone to WiFi: `SafeEdge-XXYYZZ`
2. Password: `SafeEdge2026`
3. Open browser to: `http://192.168.4.1`
4. You should see the provisioning status page

---

## 📱 Mobile Provisioning Workflow

### Step 1: Create Device in Dashboard

1. Open SafeEdge Dashboard
2. Click "Create Device"
3. Fill in device information:
   - Device Name: "Temperature Sensor #1"
   - Device Type: "Temperature Sensor"
   - Location: "Ward A - Room 101"
   - Connection Type: "Ethernet" or "WiFi"
4. Click "Next"
5. Get QR code

### Step 2: Provision with Mobile App

1. Open SafeEdge Mobile App
2. Tap "Scan QR Code"
3. Scan the QR code from dashboard
4. Mobile app will:
   - Connect to ESP32 WiFi AP
   - Validate device with backend
   - Transfer credentials
   - ESP32 validates and stores

### Step 3: ESP32 Connects

1. ESP32 receives credentials
2. ESP32 validates with backend (enterprise security)
3. ESP32 stores in SPIFFS
4. ESP32 restarts automatically
5. ESP32 connects to network (Ethernet or WiFi)
6. ESP32 connects to Firebase
7. Green LED turns on = Operational! ✅

---

## 🔐 Security Features

### Enterprise Security Checks:

1. ✅ **Device ID Validation**
   - Backend verifies device exists

2. ✅ **One-Time Token**
   - Token must match and not be used

3. ✅ **MAC Address Binding**
   - ESP32 MAC bound to device
   - Prevents device cloning

4. ✅ **Dual Validation**
   - Mobile validates first
   - ESP32 validates before storing

### If ANY check fails:
- ❌ Provisioning rejected
- 🔒 Credentials not stored
- 🚨 Error beeps (3 times)

---

## 📊 LED Indicators

| LED | Pattern | Meaning |
|-----|---------|---------|
| 🟡 | Blinking (1s) | Provisioning mode - waiting for mobile |
| 🟢 | Solid | Connected and operational |
| 🔴 | Blinking (0.5s) | Provisioned but not connected |
| 🔴 | Solid | Hardware error or initialization failed |
| 🟢 | Blink 3x | Network connected successfully |
| 🟢 | Blink 5x | Provisioning successful |

---

## 🔊 Buzzer Feedback

| Beeps | Meaning |
|-------|---------|
| 2 beeps | Provisioning successful |
| 3 beeps | Validation failed / Error |

---

## 🐛 Troubleshooting

### Problem: ESP32 won't upload

**Solutions**:
- Hold BOOT button while uploading
- Check USB cable (use data cable, not charge-only)
- Try different USB port
- Check driver installed (CP2102 or CH340)

### Problem: WiFi AP not visible

**Solutions**:
- Check Serial Monitor for SSID
- Look for "SafeEdge-" in WiFi list
- Restart ESP32
- Check antenna connected (if external)

### Problem: Validation failed

**Solutions**:
- Check backend is running
- Verify BACKEND_API_URL is correct
- Check network connectivity
- Ensure token not already used

### Problem: Won't connect after provisioning

**Solutions**:
- **Ethernet**: Check cable connected
- **WiFi**: Verify WIFI_SSID and WIFI_PASSWORD
- Check Serial Monitor for errors
- Verify network credentials

### Problem: Firebase not connecting

**Solutions**:
- Check FIREBASE_DATABASE_URL in config
- Verify network connection
- Check Firebase rules allow access
- Check Serial Monitor for Firebase errors

---

## 📁 SPIFFS File Structure

After provisioning, these files are stored:

```
/config/
  device_config.json       - Device configuration
/certs/
  ca.crt                   - CA certificate
  device.crt               - Device certificate
  device.key               - Device private key
/keys/
  encryption.key           - AES-256 encryption key
```

---

## 🔄 Factory Reset

To clear provisioning and start over:

1. Upload this code snippet:

```cpp
void setup() {
  Serial.begin(115200);
  SPIFFS.begin(true);
  
  // Remove all provisioning files
  SPIFFS.remove("/config/device_config.json");
  SPIFFS.remove("/certs/ca.crt");
  SPIFFS.remove("/certs/device.crt");
  SPIFFS.remove("/certs/device.key");
  SPIFFS.remove("/keys/encryption.key");
  
  Serial.println("✅ Factory reset complete");
  ESP.restart();
}

void loop() {}
```

2. Or use SPIFFS erase tool in Arduino IDE

---

## 📊 Serial Monitor Commands

Monitor these messages:

```
✅ = Success
❌ = Error
📱 = Mobile provisioning
🌐 = Network
🔥 = Firebase
📊 = Sensor data
🔍 = Validation
🔐 = Security
```

---

## 🎯 Production Checklist

Before deploying:

- [ ] Hardware connections verified
- [ ] WiFi credentials configured (if using WiFi)
- [ ] Backend API URL configured
- [ ] Firmware uploaded successfully
- [ ] Serial Monitor shows no errors
- [ ] LED indicators working
- [ ] Provisioning tested
- [ ] Network connection verified
- [ ] Firebase connection verified
- [ ] Sensor data sending

---

## 📞 Support

### Check Serial Monitor:
- Baud rate: 115200
- Look for error messages
- Check connection status

### Common Serial Messages:

**Success**:
```
✅ Hardware initialized
✅ SPIFFS initialized
✅ WiFi AP started
✅ Device provisioned successfully
✅ Ethernet connected
✅ Firebase connected
```

**Errors**:
```
❌ SPIFFS initialization failed
❌ Failed to start WiFi AP
❌ Backend validation failed
❌ Ethernet connection failed
❌ Firebase connection failed
```

---

## 🎉 You're Ready!

Once you see:
```
✅ Firebase connected
📊 Sensor data sent [0]: T=25.3°C, H=62.1%
```

Your ESP32 is fully operational! 🚀

---

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026  
**Version**: 1.0.0 - Production Ready
