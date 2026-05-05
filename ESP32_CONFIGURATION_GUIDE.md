# 🔧 ESP32 Configuration Guide - Updated Code

## 📁 File Location
**Updated Firmware**: `esp32_secure/SafeEdge_Complete_UPDATED.ino`

---

## ⚙️ Configuration Required (3 Changes)

### 1️⃣ Backend API URL (Line 42)

**Find your backend IP**:
```bash
# On Mac:
ipconfig getifaddr en0

# Expected output: 192.168.1.XXX
```

**Update in code**:
```cpp
// Line 42 - CHANGE THIS!
#define BACKEND_API_URL "http://192.168.1.177:8000"  // <-- YOUR IP HERE
```

**Example**:
```cpp
// If your IP is 192.168.1.100:
#define BACKEND_API_URL "http://192.168.1.100:8000"
```

---

### 2️⃣ Firebase Realtime Database URL (Line 46)

**Find your Firebase URL**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to: Build → Realtime Database
4. Copy the URL (looks like: `https://your-project-id.firebaseio.com`)

**Update in code**:
```cpp
// Line 46 - CHANGE THIS!
#define FIREBASE_URL "https://your-project-id.firebaseio.com"  // <-- YOUR FIREBASE URL
```

**Example**:
```cpp
// If your project ID is "safeedge-2026":
#define FIREBASE_URL "https://safeedge-2026.firebaseio.com"
```

---

### 3️⃣ WiFi Credentials (Lines 50-51) - OPTIONAL

**Only needed if using WiFi connection type!**

If you're using Ethernet only, leave these empty.

**Update in code**:
```cpp
// Lines 50-51 - ADD YOUR WIFI (if using WiFi)
const char* WIFI_SSID = "Hospital-WiFi";  // <-- YOUR WIFI NAME
const char* WIFI_PASSWORD = "your-password";  // <-- YOUR WIFI PASSWORD
```

**Note**: WiFi credentials can also come from the provisioning config (QR code), so these are just fallback values.

---

## ✅ What's Fixed in Updated Code

### 1. Firebase URL Configuration ✅
- **Before**: Tried to get Firebase URL from `gateway.address` (wrong!)
- **After**: Uses `#define FIREBASE_URL` at the top (correct!)

### 2. WiFi Credentials from Config ✅
- **Before**: Only used hardcoded WiFi credentials
- **After**: Uses WiFi credentials from provisioning config if available, falls back to hardcoded

### 3. Better Error Messages ✅
- Added more detailed error messages for Firebase connection
- Shows Firebase URL being used
- Better debugging output

### 4. Improved Firebase Connection ✅
- Added delay before checking Firebase.ready()
- Better error handling
- Updates last_seen timestamp

---

## 📋 Quick Configuration Checklist

Before uploading to ESP32:

- [ ] Find your backend IP: `ipconfig getifaddr en0`
- [ ] Update `BACKEND_API_URL` (Line 42)
- [ ] Find your Firebase URL from Firebase Console
- [ ] Update `FIREBASE_URL` (Line 46)
- [ ] Add WiFi credentials if using WiFi (Lines 50-51)
- [ ] Save the file
- [ ] Upload to ESP32

---

## 🚀 Upload Instructions

### 1. Open Arduino IDE
- File → Open → `esp32_secure/SafeEdge_Complete_UPDATED.ino`

### 2. Verify Configuration
Check these 3 lines are updated:
```cpp
Line 42: #define BACKEND_API_URL "http://YOUR_IP:8000"
Line 46: #define FIREBASE_URL "https://your-project.firebaseio.com"
Lines 50-51: WiFi credentials (if needed)
```

### 3. Select Board
- Tools → Board → ESP32 Arduino → ESP32 Dev Module

### 4. Select Port
- Tools → Port → (your ESP32 port)

### 5. Upload
- Click Upload button (→)
- Wait ~30 seconds

### 6. Open Serial Monitor
- Tools → Serial Monitor
- Set baud rate: 115200

---

## 📺 Expected Serial Output

### On First Boot (Not Provisioned):
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
   1. Connect phone to ESP32 WiFi
   2. Scan QR code from dashboard
   3. Browser opens automatically
   4. Config sent to ESP32
====================================

✅ Web server started on port 80
```

### After Provisioning:
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

### After Restart (Provisioned):
```
✅ Device already provisioned
✅ Configuration loaded
📋 Configuration:
   Device ID: iot_temperature_sensor_...
   Device Name: ESP32-Test-001
   Device Type: temperature_sensor
   Connection: ethernet
   Firebase URL: https://your-project.firebaseio.com

🌐 Connecting to network...
📡 Connecting via Ethernet (W5500)...
   Attempting DHCP...
✅ Ethernet connected
   IP: 192.168.1.200

🔥 Initializing Firebase...
   URL: https://your-project.firebaseio.com
✅ Firebase connected
✅ Device status updated to 'online'
📊 Sensor data sent [0]: T=25.3°C, H=62.1%
📊 Sensor data sent [1]: T=24.8°C, H=61.5%
```

---

## 🐛 Troubleshooting

### Issue: "Backend validation failed"
**Cause**: Backend URL is wrong or backend not running

**Fix**:
1. Check backend is running: `http://YOUR_IP:8000/docs`
2. Verify `BACKEND_API_URL` matches your IP
3. Check firewall not blocking port 8000

### Issue: "Firebase connection failed"
**Cause**: Firebase URL is wrong or Firebase not configured

**Fix**:
1. Check `FIREBASE_URL` is correct
2. Verify Firebase Realtime Database is enabled
3. Check Firebase rules allow write access:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

### Issue: "WiFi connection failed"
**Cause**: WiFi credentials wrong or not set

**Fix**:
1. Check `WIFI_SSID` and `WIFI_PASSWORD` are correct
2. Verify WiFi network is available
3. Check WiFi password has no special characters issues

### Issue: "Ethernet connection failed"
**Cause**: W5500 wiring wrong or cable not connected

**Fix**:
1. Check W5500 wiring (MOSI=23, MISO=19, SCK=18, CS=5)
2. Check Ethernet cable connected
3. Check router/switch is working
4. Try static IP instead of DHCP

---

## 🎯 Summary

### What You Need to Change:
1. **Line 42**: Backend API URL → Your backend IP
2. **Line 46**: Firebase URL → Your Firebase Realtime Database URL
3. **Lines 50-51**: WiFi credentials (optional, only if using WiFi)

### That's It!
After these 3 changes, the code is ready to upload to ESP32!

---

## 📞 Quick Reference

### Configuration Lines:
```cpp
Line 42: #define BACKEND_API_URL "http://192.168.1.177:8000"
Line 46: #define FIREBASE_URL "https://your-project-id.firebaseio.com"
Line 50: const char* WIFI_SSID = "Your-WiFi";
Line 51: const char* WIFI_PASSWORD = "Your-Password";
```

### Find Your Values:
```bash
# Backend IP:
ipconfig getifaddr en0

# Firebase URL:
Firebase Console → Realtime Database → Copy URL

# WiFi:
Your WiFi network name and password
```

---

**Ready to deploy! Just update those 3 values and upload! 🚀**

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026
