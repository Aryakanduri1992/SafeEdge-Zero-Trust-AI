# Network Connectivity Test Guide

## Current Setup

### Laptop 1 (Backend/Frontend)
- **WiFi IP**: 192.168.206.105
- **Network**: "office mobile"
- **Backend**: http://192.168.206.105:8000 (listening on 0.0.0.0)
- **Frontend**: http://192.168.206.105:9002

### Laptop 2 (IoT Simulator)
- **Ethernet IP**: 172.20.10.2 (static)
- **Network**: Connected to ESP32 via Ethernet cable
- **Script**: `laptop2_provisioned_device.py`

### ESP32 Gateway
- **Ethernet IP**: 172.20.10.18 (dynamic)
- **WiFi IP**: 192.168.205.226
- **Network**: "office mobile"

## Data Flow

```
Laptop 2 (172.20.10.2) 
    ↓ Ethernet
ESP32 (172.20.10.18) 
    ↓ WiFi (192.168.205.226)
Laptop 1 Backend (192.168.206.105:8000)
    ↓
Firebase
    ↓
Frontend Dashboard
```

## Network Issue

ESP32 WiFi (192.168.205.226) and Laptop 1 WiFi (192.168.206.105) are on **different subnets** even though both are on "office mobile" network.

## Testing Steps

### Step 1: Test Backend Accessibility from Laptop 2

On **Laptop 2**, test if backend is reachable:

```bash
# Test via WiFi (if Laptop 2 has WiFi)
curl http://192.168.206.105:8000/health

# Test via Ethernet (if backend is accessible)
curl http://172.20.10.2:8000/health
```

### Step 2: Upload Firmware to ESP32

1. Open Arduino IDE on **Laptop 1**
2. Open `esp32_secure/SafeEdge_Unified.ino`
3. Verify backend URL is: `http://192.168.206.105:8000`
4. Upload to ESP32
5. Open Serial Monitor (115200 baud)

### Step 3: Check ESP32 Serial Output

Look for:
```
✅ WiFi connected
   IP: 192.168.205.226
✅ Ethernet connected
   IP: 172.20.10.18
✅ Gateway fully operational!
```

### Step 4: Run Laptop 2 Script

On **Laptop 2**:

```bash
cd /path/to/Blackshiled-X
python3 laptop2_provisioned_device.py
```

Expected output:
```
✅ ESP32: Data sent successfully → Firebase (#1)
```

### Step 5: Check ESP32 Serial Monitor

Look for:
```
📥 Ethernet client connected
📥 Data from: iot_temperature_sensor_20260414185938_62fd12aa
📤 Forwarding to Backend API...
✅ Backend response: 200
✅ Data forwarded to Backend → Firebase
```

## Troubleshooting

### If ESP32 shows "Backend connection failed"

**Option A: Use Ethernet for Backend Communication**

Change ESP32 firmware to use Laptop 1's Ethernet IP:

```cpp
#define BACKEND_API_URL "http://172.20.10.2:8000"
```

This requires Laptop 1 to have Ethernet configured with IP 172.20.10.2.

**Option B: Ensure Both Devices on Same Subnet**

1. Reconnect ESP32 to WiFi to get new IP
2. Check if it gets 192.168.206.x subnet
3. Or configure static IP on ESP32:

```cpp
IPAddress staticIP(192, 168, 206, 50);
IPAddress gateway(192, 168, 206, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(staticIP, gateway, subnet);
```

**Option C: Router Configuration**

Check if router allows inter-subnet communication (most do by default).

### If Laptop 2 shows "Connection failed to ESP32"

1. Check Ethernet cable connection
2. Verify ESP32 Ethernet IP: Should be 172.20.10.18
3. Ping ESP32 from Laptop 2:
   ```bash
   ping 172.20.10.18
   ```

### If Backend shows no incoming requests

1. Check firewall on Laptop 1:
   ```bash
   # macOS - Allow port 8000
   # System Preferences → Security & Privacy → Firewall → Firewall Options
   ```

2. Verify backend is listening on all interfaces:
   ```bash
   lsof -i :8000
   ```

## Success Indicators

✅ Laptop 2 script shows: "ESP32: Data sent successfully"
✅ ESP32 Serial shows: "Backend response: 200"
✅ Backend logs show: "POST /api/sensor-data 200"
✅ Firebase Realtime Database updates with new sensor data
✅ Frontend dashboard shows live data

## Quick Commands Reference

### Laptop 1 (Backend)
```bash
# Check backend status
curl http://localhost:8000/health

# Check backend logs
# (Already running in background process)
```

### Laptop 2 (Simulator)
```bash
# Run simulator
python3 laptop2_provisioned_device.py

# Test ESP32 connection
curl http://172.20.10.18/
```

### ESP32 (Serial Monitor)
- Baud rate: 115200
- Look for "✅ Backend response: 200"
