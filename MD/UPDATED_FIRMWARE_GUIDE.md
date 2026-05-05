# Updated SafeEdge_Unified.ino - BLE Provisioning Integrated

## What's New

The `SafeEdge_Unified.ino` firmware now includes:

✅ **WiFi Always Connected** - Stays connected to WiFi for Firebase
✅ **BLE Provisioning** - Provision devices via Bluetooth
✅ **Multiple Devices** - Support up to 50 devices
✅ **Device Registry** - Tracks active devices with auto-cleanup
✅ **Simultaneous Operations** - Provision while forwarding data
✅ **Enhanced Status** - Web interface shows all provisioned devices

## How to Use

### 1. Upload Firmware

```
File: esp32_secure/SafeEdge_Unified.ino
Mode: GATEWAY (default)
Upload to ESP32
```

### 2. Expected Serial Output

```
╔════════════════════════════════════════════════════════╗
║     SafeEdge ESP32 - GATEWAY MODE + BLE              ║
║     WiFi: Always On | BLE: Provisioning | Ethernet   ║
║     Imagine Cup 2026 - World Championship             ║
╚════════════════════════════════════════════════════════╝

📱 MAC Address: XX:XX:XX:XX:XX:XX

🚀 Starting GATEWAY MODE with BLE Provisioning

📡 Connecting to WiFi...
✅ WiFi connected
   IP: 10.96.207.226

📡 Connecting Ethernet...
✅ Ethernet connected
   IP: 172.20.10.10

🔥 Initializing Firebase...
✅ Firebase connected

🌐 Starting HTTP Server...
✅ HTTP Server started

📱 Initializing BLE...
✅ BLE initialized
   Name: SafeEdge-Gateway
   Ready for provisioning

============================================================
Gateway Status:
============================================================
WiFi:     ✅ Connected
Ethernet: ✅ Connected
Firebase: ✅ Ready
BLE:      ✅ Advertising
Devices:  0 provisioned
============================================================

🎉 Gateway fully operational!
   ✅ WiFi connected for Firebase
   ✅ Ethernet ready for sensor data
   ✅ BLE ready for provisioning
```

### 3. Provision Devices via BLE

**Using nRF Connect App:**

1. Download nRF Connect (iOS/Android)
2. Scan for "SafeEdge-Gateway"
3. Connect to device
4. Find service: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
5. Write to characteristic: `beb5483e-36e1-4688-b7f5-ea07361b26a8`
6. Paste device JSON from dashboard
7. Read status from: `beb5483e-36e1-4688-b7f5-ea07361b26a9`
8. Should show "SUCCESS"

**ESP32 Serial Output:**
```
📱 BLE Client Connected
📥 Received provisioning data via BLE
📝 Provisioning: TEMP (iot_temperature_sensor_20260414185938_62fd12aa)
✅ Device provisioned (Total: 1)
✅ Device provisioned successfully
📱 BLE Client Disconnected
📡 BLE Advertising restarted
```

### 4. Device Sends Data

**Run Laptop 2 Script:**
```bash
python3 laptop2_provisioned_device.py
```

**ESP32 Serial Output:**
```
📥 Data from: iot_temperature_sensor_20260414185938_62fd12aa
✅ Forwarded to Firebase
```

### 5. Provision More Devices

While first device is sending data:
1. Connect via BLE again
2. Send second device config
3. ESP32 provisions without interrupting data flow
4. Run second laptop2 script
5. Both devices now active!

## Web Interface

Visit `http://172.20.10.10` in browser:

```html
SafeEdge ESP32 Gateway
Mode: GATEWAY with BLE Provisioning

Status
WiFi: Connected
Ethernet: Connected
Firebase: Ready
BLE: Advertising

Provisioned Devices (2)
• TEMP (iot_temperature_sensor_20260414185938_62fd12aa)
• HUMIDITY (iot_humidity_sensor_20260415120000_abc123)
```

## API Endpoints

### GET /
Web interface showing status and devices

### POST /api/sensor-data
Receive sensor data from devices
```json
{
  "device_id": "iot_temperature_sensor_...",
  "temperature": 24.5,
  "humidity": 45.2
}
```

### GET /api/device-status
Get gateway status
```json
{
  "success": true,
  "mode": "GATEWAY",
  "wifi": true,
  "ethernet": true,
  "firebase": true,
  "ble": false,
  "provisioned_devices": 2,
  "uptime": 123456
}
```

### GET /api/devices
List all provisioned devices
```json
{
  "devices": [
    {
      "device_id": "iot_temperature_sensor_...",
      "device_name": "TEMP",
      "device_type": "temperature_sensor",
      "last_seen": 123456
    }
  ]
}
```

## Device Registry Features

### Auto-Cleanup
- Devices inactive for 5+ minutes are removed
- Frees up registry space
- Can be re-provisioned anytime

### Last Seen Tracking
- Updates every time device sends data
- Visible in web interface
- Used for cleanup logic

### Maximum Devices
- Supports up to 50 devices
- Configurable via `MAX_DEVICES`
- Registry stored in RAM

## LED Indicators

- **Green**: WiFi connected / Data forwarded
- **Red**: WiFi disconnected
- **Yellow**: Ethernet status / BLE client connected (blinking)

## Advantages

✅ **No Mode Switching** - WiFi stays connected always
✅ **Continuous Operation** - Provision without interrupting data
✅ **Scalable** - Support many devices simultaneously
✅ **Flexible** - BLE or HTTP provisioning
✅ **Reliable** - Auto-cleanup of inactive devices
✅ **Monitored** - Web interface and API for status

## Troubleshooting

### BLE not advertising
- Check serial output for "✅ BLE initialized"
- Restart ESP32
- Check BLE is enabled in Arduino IDE

### Device not provisioning
- Check JSON format
- Verify BLE characteristic UUID
- Check serial output for errors

### Data not forwarding
- Verify WiFi connected
- Check Firebase status
- Verify device_id matches provisioned device

## Next Steps

1. Upload firmware to ESP32
2. Verify all systems operational
3. Test BLE provisioning with nRF Connect
4. Run Laptop 2 script
5. Provision additional devices as needed
