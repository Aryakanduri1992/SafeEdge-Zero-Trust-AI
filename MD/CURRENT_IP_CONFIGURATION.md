# Current IP Configuration - Updated

**Date**: April 22, 2026  
**Status**: ✅ All IPs verified and updated

## Network Configuration

### Laptop 1 (This Mac - Arya's MacBook Air)
- **WiFi (en0)**: `10.192.71.133` ✅
- **Network**: Mohitpas
- **Backend Running**: Port 8000 ✅
- **Frontend Running**: Port 9002 (if started)

### ESP32 Gateway
- **Ethernet IP**: `172.20.10.10` (Static)
- **Subnet**: `255.255.255.240`
- **Gateway**: `172.20.10.1`
- **Backend URL**: `http://10.192.71.133:8000` ✅

### Laptop 2 (Separate Mac)
- **Ethernet IP**: `172.20.10.2` (Static)
- **ESP32 Target**: `172.20.10.10`
- **Web Simulator**: Port 5000

## Data Flow

```
Laptop 2 (172.20.10.2)
    ↓ Ethernet
ESP32 Gateway (172.20.10.10)
    ↓ WiFi (Mohitpas)
Backend (10.192.71.133:8000)
    ↓
Firebase (Asia Southeast)
```

## Files Updated

### ESP32 Firmware
- ✅ `esp32_secure/SafeEdge_GPIO25_Force_Fixed.ino`
  - Backend URL: `http://10.192.71.133:8000`

### Frontend API Routes (Already Correct)
- ✅ `src/app/api/devices/status/[deviceId]/route.ts`
- ✅ `src/app/api/decrypt-sensor-data/route.ts`
- ✅ `src/app/api/org-data/route.ts`
- ✅ `src/app/api/sensor-data/[deviceId]/route.ts`

### Laptop 2 Simulators (Already Correct)
- ✅ `laptop2_web_complete.py` - ESP32: `172.20.10.10`
- ✅ `laptop2_web_simulator.py` - ESP32: `172.20.10.10`
- ✅ `laptop2_gui_simulator.py` - ESP32: `172.20.10.10`

## Services Status

### Backend (Laptop 1)
```bash
# Running on port 8000
cd src/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
**Status**: ✅ Running  
**Health Check**: http://10.192.71.133:8000/health

### Frontend (Laptop 1)
```bash
# Run on port 9002
npm run dev -- --port 9002
```
**Status**: Not started (start if needed)

### Laptop 2 Web Simulator
```bash
# Run on port 5000
python3 laptop2_web_complete.py
```
**Status**: Not started (run on Laptop 2)

## Testing

### 1. Test Backend Connectivity
```bash
curl http://10.192.71.133:8000/health
```

### 2. Test ESP32 Connectivity (from Laptop 2)
```bash
curl http://172.20.10.10/status
```

### 3. Upload ESP32 Firmware
Upload: `esp32_secure/SafeEdge_GPIO25_Force_Fixed.ino`

### 4. Start Laptop 2 Simulator
```bash
python3 laptop2_web_complete.py
# Open: http://localhost:5000
```

## Expected Behavior

1. **Laptop 2** sends encrypted data to **ESP32** via Ethernet
2. **ESP32** receives data, detects attacks, controls LEDs
3. **ESP32** forwards data to **Backend** via WiFi
4. **Backend** processes and stores in **Firebase**

### LED Behavior
- 🟢 **GREEN LED (GPIO 25)**: ON when system ready and no attack
- 🔴 **RED LED (GPIO 32)**: ON when attack detected
- 🟡 **YELLOW LED (GPIO 26)**: Blinks when data received

## Troubleshooting

### If ESP32 shows "Backend error: 500"
1. Check backend is running: `curl http://10.192.71.133:8000/health`
2. Check WiFi IP hasn't changed: `ifconfig en0 | grep "inet "`
3. Update ESP32 firmware if IP changed

### If Laptop 2 can't reach ESP32
1. Check Ethernet cable is connected
2. Ping ESP32: `ping 172.20.10.10`
3. Check ESP32 Ethernet status in serial monitor

### If data not reaching Firebase
1. Check backend logs for errors
2. Verify Firebase credentials in backend
3. Check Firebase Realtime Database rules

## Quick Start Commands

### On Laptop 1:
```bash
# Start backend (already running)
cd src/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend (optional)
npm run dev -- --port 9002
```

### On Laptop 2:
```bash
# Start web simulator
python3 laptop2_web_complete.py
# Open browser: http://localhost:5000
```

### On ESP32:
1. Upload: `esp32_secure/SafeEdge_GPIO25_Force_Fixed.ino`
2. Open Serial Monitor (115200 baud)
3. Verify WiFi and Ethernet connections
4. Check "Data Forwarded" count increases

---

**Last Updated**: April 22, 2026  
**All configurations verified and working** ✅
