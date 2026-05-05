# 🎯 ESP32 Firmware Selection Guide

## Quick Decision Tree

```
Do you need to receive data from Laptop 2?
├─ YES → Use SafeEdge_Dual_Interface_Gateway.ino
│         (Hardware Gateway Mode)
│
└─ NO  → Do you need mobile provisioning?
          ├─ YES → Use SafeEdge_Complete_UPDATED.ino
          │         (IoT Device with Provisioning)
          │
          └─ NO  → Use SafeEdge_Dual_Interface_Gateway.ino
                    (Simple Gateway Mode)
```

---

## 📁 Available Firmware Files

### 1. **SafeEdge_Dual_Interface_Gateway.ino** ⭐ RECOMMENDED FOR LAPTOP 2

**Purpose**: Hardware Gateway that receives data from Laptop 2 and forwards to Firebase

**Features**:
- ✅ Dual network interfaces (WiFi + Ethernet)
- ✅ Receives HTTP POST from Laptop 2 via Ethernet
- ✅ Forwards data to Firebase via WiFi
- ✅ No provisioning needed (hardcoded config)
- ✅ Simple and reliable
- ✅ Status LEDs and buzzer feedback

**Use When**:
- Setting up Laptop 2 as IoT gateway
- Need to forward data from multiple virtual devices
- Want simple plug-and-play operation
- Don't need mobile provisioning

**Configuration Required**:
```cpp
// WiFi for Firebase/Internet
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";

// Firebase URL
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// Ethernet IP (static)
#define ETH_STATIC_IP IPAddress(192, 168, 100, 10)
```

**Network Setup**:
- WiFi: Connects to "office mobile" for Firebase access
- Ethernet: Static IP 192.168.100.10 for Laptop 2 connection
- Laptop 2: Must be configured as 192.168.100.12

**Data Flow**:
```
Laptop 2 (192.168.100.12)
    ↓ HTTP POST /api/sensor-data
ESP32 Gateway (192.168.100.10)
    ↓ WiFi
Firebase Realtime Database
    ↓
Dashboard
```

---

### 2. **SafeEdge_Complete_UPDATED.ino** ⭐ RECOMMENDED FOR IOT DEVICES

**Purpose**: Full-featured IoT device with mobile provisioning and enterprise security

**Features**:
- ✅ Mobile provisioning via QR code
- ✅ Captive portal for easy setup
- ✅ Certificate-based authentication
- ✅ AES-256-GCM encryption
- ✅ Backend validation
- ✅ One-time provisioning tokens
- ✅ MAC address binding
- ✅ Supports WiFi or Ethernet
- ✅ Circular buffer for sensor data

**Use When**:
- Deploying actual IoT devices
- Need secure provisioning workflow
- Want enterprise-grade security
- Need to provision multiple devices easily
- Want to use dashboard QR code provisioning

**Configuration Required**:
```cpp
// Backend API (your computer's IP)
#define BACKEND_API_URL "http://10.17.1.94:8000"

// Firebase URL
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// WiFi (optional, can be provided via QR code)
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";
```

**Provisioning Flow**:
1. Add device in dashboard
2. Generate QR code
3. Connect phone to ESP32 WiFi (SafeEdge-XXXXXX)
4. Browser opens automatically
5. Paste QR code data
6. Device provisions and restarts
7. Backend validates device
8. Device connects and sends data

---

### 3. **SafeEdge_BLE_Provisioning.ino**

**Purpose**: Alternative provisioning method using Bluetooth Low Energy

**Features**:
- ✅ BLE-based provisioning
- ✅ Phone stays connected to internet
- ✅ Web Bluetooth API support
- ✅ QR code scanner in browser

**Use When**:
- WiFi AP mode doesn't work well
- Want phone to stay connected to internet during provisioning
- Have devices that support BLE

**Note**: Requires compatible web browser with Web Bluetooth support

---

## 🎯 Your Current Setup

Based on your requirements, here's what you should use:

### Hardware Gateway (ESP32):
**File**: `SafeEdge_Dual_Interface_Gateway.ino`

**Why**: 
- Receives data from Laptop 2 via Ethernet
- Forwards to Firebase via WiFi
- No provisioning complexity needed
- Simple and reliable

**Configuration**:
```cpp
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"
```

### Laptop 2 (Virtual IoT Devices):
**File**: `laptop2_final_simulator.py`

**Configuration**:
- 5 virtual devices (Temperature, Door Lock, Motion, Camera, Thermostat)
- Each device registered in dashboard
- Sends data to ESP32 at 192.168.100.10

---

## 📊 Feature Comparison

| Feature | Dual Interface Gateway | Complete Updated | BLE Provisioning |
|---------|----------------------|------------------|------------------|
| **Laptop 2 Support** | ✅ Yes | ❌ No | ❌ No |
| **Mobile Provisioning** | ❌ No | ✅ Yes | ✅ Yes |
| **Captive Portal** | ❌ No | ✅ Yes | ❌ No |
| **Certificates** | ❌ Not needed | ✅ Yes | ✅ Yes |
| **Backend Validation** | ❌ Not needed | ✅ Yes | ✅ Yes |
| **WiFi** | ✅ For Firebase | ✅ For network | ✅ For network |
| **Ethernet** | ✅ For Laptop 2 | ✅ Optional | ✅ Optional |
| **Complexity** | 🟢 Low | 🟡 Medium | 🟡 Medium |
| **Setup Time** | 🟢 5 minutes | 🟡 15 minutes | 🟡 15 minutes |

---

## 🚀 Quick Start Instructions

### For Hardware Gateway (Laptop 2 Setup):

1. **Open Arduino IDE**
2. **Load**: `SafeEdge_Dual_Interface_Gateway.ino`
3. **Update WiFi credentials** (lines 20-21)
4. **Verify Firebase URL** (line 24)
5. **Upload to ESP32**
6. **Connect Ethernet cable** to Laptop 2
7. **Run**: `python3 laptop2_final_simulator.py`
8. **Check dashboard** for incoming data

### For IoT Device (Mobile Provisioning):

1. **Open Arduino IDE**
2. **Load**: `SafeEdge_Complete_UPDATED.ino`
3. **Update Backend API URL** (line 18)
4. **Update Firebase URL** (line 22)
5. **Upload to ESP32**
6. **Add device in dashboard**
7. **Scan QR code** with phone
8. **Provision device**
9. **Check dashboard** for device status

---

## 🔧 Hardware Requirements

### Both Firmware Options:
- ESP32 DevKit v1
- W5500 Ethernet Module
- 3x LEDs (Red, Green, Yellow) with 220Ω resistors
- 1x Buzzer
- Breadboard and jumper wires

### Connections:
```
ESP32          W5500
GPIO 23   →    MOSI
GPIO 19   →    MISO
GPIO 18   →    SCK
GPIO 5    →    CS
3.3V      →    VCC
GND       →    GND

ESP32          LEDs
GPIO 32   →    Red LED (220Ω → GND)
GPIO 25   →    Green LED (220Ω → GND)
GPIO 26   →    Yellow LED (220Ω → GND)

ESP32          Buzzer
GPIO 33   →    Buzzer (+)
GND       →    Buzzer (-)
```

---

## 📝 Configuration Checklist

### Before Uploading Any Firmware:

- [ ] WiFi SSID and password updated
- [ ] Firebase URL verified
- [ ] Backend API URL updated (if using provisioning)
- [ ] Ethernet connections verified (if using Ethernet)
- [ ] LED and buzzer connections tested
- [ ] Serial monitor baud rate set to 115200

### After Uploading:

- [ ] Serial monitor shows successful initialization
- [ ] WiFi connected (green LED blinks)
- [ ] Ethernet connected (yellow LED blinks) - if applicable
- [ ] Firebase connected (green LED stays on)
- [ ] Test data transmission

---

## 🎉 Summary

**For your current Laptop 2 setup:**
- ✅ Use `SafeEdge_Dual_Interface_Gateway.ino`
- ✅ Simple configuration
- ✅ No provisioning needed
- ✅ Ready to use with `laptop2_final_simulator.py`

**For future IoT devices:**
- ✅ Use `SafeEdge_Complete_UPDATED.ino`
- ✅ Mobile provisioning via QR code
- ✅ Enterprise security features
- ✅ Easy deployment at scale

Both firmware files are already in your `esp32_secure/` folder and ready to use!
