# ESP32 Implementation Requirements & Setup Guide

## Hardware Requirements

### ESP32 Components (Already Built)
✅ **You have these components connected:**

1. **ESP32 DevKit v1** - Main microcontroller
2. **W5500 Ethernet Module** - Network connectivity via SPI
3. **3x LEDs with 220Ω resistors**:
   - Red LED (GPIO 32) - Critical alerts
   - Green LED (GPIO 25) - System safe
   - Yellow LED (GPIO 26) - Warnings
4. **1x Active Buzzer** (GPIO 33) - Audio alerts
5. **LM2596 DC-DC Buck Converter** - 12V to 5V power regulation

### Verified Hardware Connections
```
ESP32 GPIO 32 → 220Ω Resistor → Red LED (+) → GND
ESP32 GPIO 25 → 220Ω Resistor → Green LED (+) → GND
ESP32 GPIO 26 → 220Ω Resistor → Yellow LED (+) → GND
ESP32 GPIO 33 → Buzzer (+) → GND

ESP32 GPIO 23 → W5500 MOSI
ESP32 GPIO 19 → W5500 MISO
ESP32 GPIO 18 → W5500 SCK
ESP32 GPIO 5  → W5500 CS
ESP32 3.3V    → W5500 VCC
ESP32 GND     → W5500 GND

12V DC Input → LM2596 Buck Converter → 5V Output → ESP32 VIN
                                                  → ESP32 GND
```

## Software Requirements

### Arduino IDE Setup

#### 1. Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Version: 2.0 or higher recommended

#### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32"
6. Install "esp32 by Espressif Systems" (version 3.0.0 or higher)

#### 3. Required Arduino Libraries

Install these libraries via **Tools → Manage Libraries**:

| Library Name | Version | Purpose |
|-------------|---------|---------|
| **Firebase ESP Client** | 4.4.14+ | Firebase Realtime Database connection |
| **ArduinoJson** | 7.0.0+ | JSON parsing and serialization |
| **Ethernet** | Built-in | W5500 Ethernet support |
| **SPI** | Built-in | SPI communication for W5500 |

**Installation Steps**:
1. Open **Tools → Manage Libraries**
2. Search for "Firebase ESP Client" by Mobizt
3. Click Install
4. Search for "ArduinoJson" by Benoit Blanchon
5. Click Install

### Firebase Setup

#### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: "SafeEdge-Production" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2. Enable Realtime Database
1. In Firebase Console, go to **Build → Realtime Database**
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **Test mode** (for development)
5. Click "Enable"

#### 3. Get Firebase Credentials

**Database URL**:
- Found in Realtime Database page
- Format: `your-project-id-default-rtdb.firebaseio.com`
- Example: `safeedge-prod-default-rtdb.firebaseio.com`

**API Key**:
1. Go to **Project Settings** (gear icon)
2. Under "General" tab, find "Web API Key"
3. Copy this key

**Legacy Token** (for ESP32 authentication):
1. Go to **Project Settings → Service accounts**
2. Click "Database secrets"
3. Click "Add secret" or use existing secret
4. Copy the secret token

#### 4. Firebase Security Rules (Development)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "devices": {
      "$deviceId": {
        "sensorHistory": {
          "readings": {
            "$index": {
              ".validate": "$index >= 0 && $index < 200"
            }
          }
        },
        "alerts": {
          "entries": {
            "$index": {
              ".validate": "$index >= 0 && $index < 200"
            }
          }
        }
      }
    }
  }
}
```

**Apply Rules**:
1. In Realtime Database, click "Rules" tab
2. Paste the rules above
3. Click "Publish"

## Firmware Configuration

### Update Configuration in Code

Open `safeedge_firebase_circular_buffer.ino` and update these lines:

```cpp
// Firebase Configuration
#define FIREBASE_HOST "YOUR-PROJECT-ID-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_LEGACY_TOKEN_HERE"
#define API_KEY "YOUR_WEB_API_KEY_HERE"

// Device Configuration
#define DEVICE_ID "esp32_gateway_001"  // Unique ID for this device
#define DEVICE_NAME "NICU Gateway #1"  // Friendly name
#define ORGANIZATION_ID "org_12345"    // Your organization ID

// Network Configuration
IPAddress ip(192, 168, 1, 177);  // Adjust for your network
```

### Upload Firmware

1. **Connect ESP32 to Computer**:
   - Use USB cable
   - Install CH340 driver if needed (for DevKit v1)

2. **Select Board**:
   - Go to **Tools → Board → ESP32 Arduino**
   - Select "ESP32 Dev Module"

3. **Configure Upload Settings**:
   ```
   Upload Speed: 921600
   CPU Frequency: 240MHz
   Flash Frequency: 80MHz
   Flash Mode: QIO
   Flash Size: 4MB
   Partition Scheme: Default 4MB with spiffs
   Core Debug Level: None
   ```

4. **Select Port**:
   - Go to **Tools → Port**
   - Select the COM port (Windows) or /dev/ttyUSB0 (Linux/Mac)

5. **Upload**:
   - Click the Upload button (→)
   - Wait for "Done uploading" message

6. **Open Serial Monitor**:
   - Go to **Tools → Serial Monitor**
   - Set baud rate to **115200**
   - You should see startup messages

## Expected Serial Output

```
========================================================
SafeEdge ESP32 Firmware v4.0 - Firebase Circular Buffer
Imagine Cup 2026 - Hospital IoT Security
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
📊 Sensor #3 [Index 2/199] - warning | Score: 75 | Temp: 36.45°C
🚨 Alert #1 [Index 0/199] - CRITICAL
📊 Sensor #4 [Index 3/199] - critical | Score: 45 | Temp: 35.20°C
💓 Heartbeat
```

## Testing the System

### 1. Verify Firebase Connection
1. Open Firebase Console
2. Go to Realtime Database
3. You should see data appearing under `/devices/esp32_gateway_001/`

### 2. Check Circular Buffer
1. In Firebase, navigate to:
   ```
   /devices/esp32_gateway_001/sensorHistory/metadata/
   ```
2. You should see:
   - `currentIndex`: incrementing (0-199)
   - `totalWrites`: total number of writes
   - `maxEntries`: 200

### 3. Test LED Indicators
- **Green LED**: System safe (score ≥ 80)
- **Yellow LED**: Warning (score 60-79)
- **Red LED**: Critical (score < 60)

### 4. Test Buzzer
- **Short beep (1500Hz)**: Warning alert
- **Long beep (2000Hz)**: Critical alert
- **Three beeps (2500Hz)**: Attack detected

### 5. Send Commands from Firebase
1. In Firebase Console, go to Realtime Database
2. Navigate to `/commands/esp32_gateway_001/`
3. Add a child node:
   - Key: `pending`
   - Value: `STATUS` (or `TEMP_ATTACK`, `RESET`)
4. Watch Serial Monitor for command execution

## Troubleshooting

### Ethernet Not Connecting
- Check W5500 wiring (especially CS pin on GPIO 5)
- Verify Ethernet cable is connected
- Check network settings (IP address, gateway)
- Try different Ethernet cable

### Firebase Connection Failed
- Verify Firebase credentials (HOST, AUTH, API_KEY)
- Check Firebase security rules
- Ensure Realtime Database is enabled
- Check internet connectivity

### Compilation Errors
- Verify all libraries are installed
- Check ESP32 board package version (3.0.0+)
- Update Arduino IDE to latest version
- Clear Arduino cache: Delete `~/Arduino/libraries/` temp files

### Upload Failed
- Check USB cable connection
- Install CH340 driver (for DevKit v1)
- Try different USB port
- Reduce upload speed to 115200

### No Serial Output
- Check baud rate is set to 115200
- Press EN button on ESP32 to reset
- Check USB cable supports data transfer

## Next Steps

After successful firmware upload:

1. ✅ Verify data appears in Firebase
2. ✅ Check circular buffer is working (index wraps at 200)
3. ✅ Test LED and buzzer functionality
4. ✅ Send test commands from Firebase
5. ⏳ Set up web dashboard to display data
6. ⏳ Implement attack logging and report generation
7. ⏳ Add more ESP32 devices to system

## Additional Resources

- **ESP32 Documentation**: https://docs.espressif.com/projects/arduino-esp32/
- **Firebase ESP Client**: https://github.com/mobizt/Firebase-ESP-Client
- **W5500 Datasheet**: https://www.wiznet.io/product-item/w5500/
- **Arduino JSON**: https://arduinojson.org/

## Support

If you encounter issues:
1. Check Serial Monitor output for error messages
2. Verify all hardware connections
3. Test each component individually
4. Check Firebase Console for data
5. Review troubleshooting section above
