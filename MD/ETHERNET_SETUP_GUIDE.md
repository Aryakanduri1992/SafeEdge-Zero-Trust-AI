# Ethernet Setup Guide - Laptop 2 to ESP32

## Correct Data Flow ✅
```
Laptop 2 (Mac) → USB-C Ethernet → ESP32 → WiFi → Firebase
```

## Hardware Setup Required

### 1. Connect USB-C Ethernet Adapter
- Plug Amazon Basics USB-C Ethernet adapter into your Mac
- Connect Ethernet cable from adapter to ESP32 Ethernet port

### 2. Check Ethernet Connection
After connecting, run:
```bash
ifconfig
```
Look for a new interface (usually `en5`, `en6`, etc.) with status "active"

### 3. Configure Static IP on Mac
Your ESP32 is configured for: `172.20.10.10`
Configure your Mac Ethernet to: `172.20.10.2`

**Option A: System Preferences**
1. System Preferences → Network
2. Select Ethernet adapter
3. Configure IPv4: Manually
4. IP Address: `172.20.10.2`
5. Subnet Mask: `255.255.255.240`
6. Router: `172.20.10.1`

**Option B: Command Line**
```bash
sudo ifconfig en5 172.20.10.2 netmask 255.255.255.240
```

### 4. Test Connection
```bash
ping 172.20.10.10
```
Should get responses from ESP32

## Current Configuration

### ESP32 (Gateway Mode)
- **Ethernet IP**: `172.20.10.10`
- **WiFi**: Connected to "office mobile"
- **Firebase**: Connected via WiFi
- **HTTP Server**: Port 80 (receives data from Laptop 2)

### Laptop 2 Script
- **Target IP**: `172.20.10.10:80`
- **Endpoint**: `/api/sensor-data`
- **Method**: POST with JSON data
- **No Firebase Access**: ESP32 handles Firebase

## Troubleshooting

### If Ethernet adapter not detected:
1. Check USB-C connection
2. Try different USB-C port
3. Check if adapter drivers are installed

### If can't ping ESP32:
1. Verify ESP32 is powered and running
2. Check Ethernet cable connection
3. Verify IP configuration matches
4. Check ESP32 serial output for Ethernet status

### If data sending fails:
1. Verify ESP32 HTTP server is running
2. Check firewall settings on Mac
3. Test with curl:
```bash
curl -X POST http://172.20.10.10:80/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Next Steps

1. **Connect Hardware**: USB-C Ethernet adapter + cable
2. **Configure Network**: Set Mac IP to 172.20.10.2
3. **Test Connection**: Ping ESP32 at 172.20.10.10
4. **Run Laptop 2 Script**: Should send data successfully
5. **Verify Firebase**: Check dashboard for incoming data

## Expected Output

**Laptop 2 Script:**
```
✅ ESP32: Data sent successfully → Firebase (#1)
✅ ESP32: Data sent successfully → Firebase (#2)
```

**ESP32 Serial Monitor:**
```
📥 Data from: iot_temperature_sensor_20260414185938_62fd12aa
✅ Forwarded to Firebase
```

**Firebase Dashboard:**
- Device appears online
- Sensor data updates every 5 seconds