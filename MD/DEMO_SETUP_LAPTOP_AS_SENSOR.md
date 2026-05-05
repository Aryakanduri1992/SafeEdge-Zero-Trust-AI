# Demo Setup: Laptop 2 as IoT Sensor Device

## Overview

This is a demonstration setup where Laptop 2 simulates an IoT sensor device sending data to the Hardware Box (ESP32), which then forwards the data to Firebase for display on the dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Main Laptop (Laptop 1)                      │
│                      192.168.100.1                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Backend    │  │   Frontend   │  │   Dashboard  │         │
│  │  Port 8000   │  │  Port 3000   │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                                     │                 │
│         └─────────────────┬───────────────────┘                │
│                           │ Internet                            │
│                           ▼                                     │
│                    ┌─────────────┐                             │
│                    │   Firebase  │                             │
│                    │   Realtime  │                             │
│                    │   Database  │                             │
│                    └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │ Ethernet
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│              Hardware Box (192.168.100.10)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                       ESP32                              │  │
│  │  • Receives data from Laptop 2 (port 8080)              │  │
│  │  • Processes and validates data                         │  │
│  │  • Forwards to Firebase                                 │  │
│  │  • Controls LEDs and Buzzer                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Ethernet │  │ Voltage  │  │  Buzzer  │  │   LEDs   │      │
│  │  Module  │  │Regulator │  │          │  │ R/G/Y    │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│       ▲                                                         │
│       │ Ethernet Cable                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │
        │
┌───────┼─────────────────────────────────────────────────────────┐
│       │         Laptop 2 (192.168.100.12)                       │
│       │         IoT Sensor Simulator                            │
│  ┌────▼──────────────────────────────────────────────────────┐ │
│  │  Python Script: Simulates sensor readings                 │ │
│  │  • Temperature, Humidity, Pressure, etc.                  │ │
│  │  • Sends data to ESP32 via HTTP POST                      │ │
│  │  • Continuous or interval-based transmission              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Laptop 2** generates simulated sensor data (temperature, humidity, etc.)
2. **Laptop 2** sends data to **Hardware Box** via HTTP POST to `http://192.168.100.10:8080/api/data`
3. **ESP32** receives data, validates it, and controls LEDs/buzzer based on thresholds
4. **ESP32** forwards data to **Firebase** via Main Laptop's internet connection
5. **Dashboard** on Main Laptop displays real-time data from Firebase

---

## Setup Instructions

### STEP 1: Main Laptop Setup

```bash
# 1. Enable Internet Sharing
# System Settings → General → Sharing → Internet Sharing

# 2. Set static IP
sudo ifconfig en0 192.168.100.1 netmask 255.255.255.0

# 3. Start Backend
cd /path/to/project
source venv/bin/activate
python src/backend/main.py --host 0.0.0.0 --port 8000

# 4. Start Frontend (in new terminal)
npm run dev -- --hostname 0.0.0.0 --port 3000
```

### STEP 2: Hardware Box Setup

1. **Erase old config**: Arduino IDE → Tools → Erase Flash → All Flash Contents
2. **Upload firmware**: Upload `ESP32_Sensor_Gateway.ino` (see below)
3. **Connect Ethernet**: W5500 module to Main Laptop
4. **Verify**: Check Serial Monitor for "✅ Ready to receive sensor data"

### STEP 3: Laptop 2 Setup

```bash
# 1. Set static IP
sudo ifconfig en0 192.168.100.12 netmask 255.255.255.0
sudo route add default 192.168.100.1

# 2. Test connectivity
ping 192.168.100.10

# 3. Install Python dependencies
pip3 install requests

# 4. Run sensor simulator
python3 laptop2_sensor_simulator.py
```

---

## ESP32 Firmware: Sensor Gateway

This firmware receives sensor data from Laptop 2 and forwards it to Firebase.
