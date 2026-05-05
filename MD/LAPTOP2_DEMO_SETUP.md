# Laptop 2 Demo Setup Guide
**SafeEdge IoT System - Imagine Cup 2026**

## Overview
This guide helps you run the demo script on a separate laptop to show live data updates in the SafeEdge dashboard.

## Prerequisites
- Python 3.7 or higher
- Internet connection
- Access to the same network as Laptop 1 (or internet access to reach the backend)

## Quick Setup

### 1. Install Python Dependencies
```bash
pip3 install requests cryptography
```

### 2. Download the Demo Script
Copy the `laptop2_demo_direct_backend.py` file to your laptop.

### 3. Verify Backend Connection
Test if you can reach the backend API:
```bash
curl -s "http://192.168.206.105:8000/health"
```

If this fails, the backend might be on a different IP. Check with the main laptop.

### 4. Run the Demo
```bash
python3 laptop2_demo_direct_backend.py
```

## What You'll See

### Demo Script Output:
```
🚀 SafeEdge Demo - Direct Backend Communication
🏆 Imagine Cup 2026 - World Championship
======================================================================
📱 Target Device: TEMP (iot_temperature_sensor_20260414185938_62fd12aa)
🌐 Backend API: http://192.168.206.105:8000/api/sensor-data
📡 Data Flow: Demo Script → Backend API → Firebase → UI
🔒 Encryption: AES-256-GCM End-to-End
⏱️  Send Interval: 3 seconds
======================================================================

📊 Demo Data #1:
   🌡️  Temperature: 23.4°C
   💧 Humidity: 47.2%
   🔒 Security Score: 94
   ⚡ Motion: No
   → Encrypting sensor data...
   → Sending encrypted data to http://192.168.206.105:8000/api/sensor-data...
✅ Backend: Encrypted data stored successfully → Firebase (#1)
   🔒 Algorithm: AES-256-GCM
   📊 Device should now show as ONLINE in UI
```

### In the Web Dashboard:
1. **Device Status**: Changes from "🔴 Offline" to "🟢 Online"
2. **Live Data**: New encrypted sensor readings appear every 3 seconds
3. **Real-time Updates**: Temperature, humidity, and other sensor values update automatically
4. **Encryption Status**: Shows "🔒 Encrypted" with AES-256-GCM algorithm

## Data Flow Architecture

```
Laptop 2 (Demo Script)
         ↓ (Encrypted Data)
Backend API (192.168.206.105:8000)
         ↓
Firebase Realtime Database
         ↓
Web Dashboard (Auto-refresh every 5s)
```

## Troubleshooting

### Connection Issues
If you get connection errors:
1. Check if the backend IP is correct
2. Ensure both laptops are on the same network
3. Try pinging the backend: `ping 192.168.206.105`

### Backend Not Responding
If the backend is down:
1. Check with Laptop 1 if the backend is running
2. Restart the backend: `cd src/backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### No Data in UI
If data isn't appearing:
1. Check the demo script shows "✅ Backend: Encrypted data stored successfully"
2. Refresh the web dashboard
3. Check browser console for errors

## Demo Features

### Realistic Sensor Data
- **Temperature**: 15-35°C with realistic trends
- **Humidity**: 20-80% with inverse temperature correlation
- **Motion Detection**: Random events (15% chance)
- **Security Metrics**: Threat levels and security scores
- **Anomalies**: Occasional security events (3% chance)

### Encryption Security
- **Algorithm**: AES-256-GCM with PBKDF2 key derivation
- **Unique Keys**: Each message has unique salt and IV
- **Authentication**: Device ID used as additional authenticated data
- **Integrity**: SHA-256 hash verification

### Live Dashboard Updates
- **Auto-refresh**: Every 5 seconds
- **Status Changes**: Device goes online when data is received
- **Encrypted Display**: Shows encrypted data with decrypt option
- **Real-time Metrics**: Live sensor readings and security scores

## Stopping the Demo
Press `Ctrl+C` to stop the demo script. The device will remain online in the UI until the auto-refresh detects no new data.

## Network Configuration
- **Backend IP**: 192.168.206.105:8000
- **Device ID**: iot_temperature_sensor_20260414185938_62fd12aa
- **Encryption Key**: Stored in Firebase (automatically retrieved)
- **Send Interval**: 3 seconds (faster than production for demo)

## Success Indicators
✅ Demo script shows successful encryption and transmission
✅ Backend responds with HTTP 200 and success: true
✅ Web dashboard shows device as "🟢 Online"
✅ New encrypted data appears in the sensor history table
✅ Auto-refresh updates the data every 5 seconds

---
**SafeEdge Team - Imagine Cup 2026 World Championship**