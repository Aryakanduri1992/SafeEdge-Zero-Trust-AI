# Quick Start Guide - SafeEdge IoT Platform
## Get Running in 15 Minutes

---

## 🎯 What You're Building

```
Main Laptop (WiFi) → Internet → Firebase
                                   ↑
                                   │ WiFi
                        Hardware Gateway (ESP32)
                                   ↑
                                   │ Ethernet Cable
                                Laptop 2
                          (5 Virtual IoT Devices)
```

---

## ⚡ Quick Setup (4 Steps)

### STEP 1: Main Laptop (2 min)

```bash
# Terminal 1
python src/backend/main.py --host 0.0.0.0 --port 8000

# Terminal 2
npm run dev -- --hostname 0.0.0.0 --port 3000

# Browser
http://localhost:3000
```

---

### STEP 2: Register Devices (3 min)

Click "Add Device" **5 times** in dashboard:

1. **Temperature Sensor - Living Room** → temp_sensor_living_room_001
2. **Smart Door Lock - Main Entrance** → door_lock_main_entrance_001
3. **Motion Sensor - Hallway** → motion_sensor_hallway_001
4. **Security Camera - Front Door** → camera_front_door_001
5. **Smart Thermostat - HVAC** → thermostat_hvac_001

**Result:** 5 devices with status "Pending"

---

### STEP 3: Hardware Gateway (5 min)

```bash
# 1. Upload firmware
Arduino IDE → Open: esp32_secure/SafeEdge_Dual_Interface_Gateway.ino
Select Board: ESP32 Dev Module
Click Upload

# 2. Verify WiFi credentials in code
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";

# 3. Connect Ethernet cable to Laptop 2

# 4. Power on (12V supply)

# 5. Check Serial Monitor (115200 baud)
Should see:
✅ WiFi connected (192.168.1.150)
✅ Ethernet connected (192.168.100.10)
✅ Firebase ready
🎉 Gateway fully operational!
```

**LED Status:**
- 🟢 Green = WiFi connected
- 🟡 Yellow OFF = Ethernet connected
- 🔴 Red OFF = No errors

---

### STEP 4: Laptop 2 (5 min)

```bash
# 1. Configure static IP
# macOS:
sudo ifconfig en0 192.168.100.12 netmask 255.255.255.0

# Windows:
Network Settings → Ethernet → Properties → IPv4
IP: 192.168.100.12
Subnet: 255.255.255.0
Gateway: 192.168.100.1

# Linux:
sudo ip addr add 192.168.100.12/24 dev eth0

# 2. Test connection
ping 192.168.100.10
# Should get replies

# 3. Install dependencies
pip3 install requests

# 4. Run simulator
python3 laptop2_final_simulator.py

# Should see:
✅ Connected to Hardware Gateway
🚀 Started: Temperature Sensor - Living Room
🚀 Started: Smart Door Lock - Main Entrance
🚀 Started: Motion Sensor - Hallway
🚀 Started: Security Camera - Front Door
🚀 Started: Smart Thermostat - HVAC
✅ All devices running!
[14:30:15] ✅ temp_sensor_living_room → 22.3 celsius
[14:30:16] ✅ motion_sensor_hallway → 0 boolean
```

---

## ✅ Verify Dashboard

Open `http://localhost:3000`

**Should see:**
- 5 devices with 🟢 **Online** status
- Real-time data updating every few seconds
- Temperature, door lock status, motion, camera alerts, thermostat

---

## 🔧 Quick Troubleshooting

### Hardware Gateway WiFi not connecting?
```cpp
// Check credentials in firmware:
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";
```

### Laptop 2 can't ping 192.168.100.10?
```bash
# Check IP
ifconfig  # Should show 192.168.100.12

# Check cable
# - Connected to both ends?
# - Hardware Gateway powered on?
# - Green LED ON?
```

### Dashboard shows "Pending"?
```bash
# Check Laptop 2 simulator is running
python3 laptop2_final_simulator.py

# Check Hardware Gateway Serial Monitor
# Should show: ✅ Data forwarded to Firebase
```

---

## 📊 Network Configuration

| Component | IP Address | Connection |
|-----------|------------|------------|
| Main Laptop | 192.168.1.x | WiFi |
| Hardware Gateway WiFi | 192.168.1.150 | WiFi |
| Hardware Gateway Ethernet | 192.168.100.10 | Ethernet |
| Laptop 2 | 192.168.100.12 | Ethernet |

---

## 🎯 Success Checklist

- [ ] Main Laptop: Backend + Frontend running
- [ ] Dashboard: 5 devices registered
- [ ] Hardware Gateway: Green LED ON, Serial shows "operational"
- [ ] Laptop 2: IP = 192.168.100.12, can ping gateway
- [ ] Laptop 2: Simulator running, data streaming
- [ ] Dashboard: All 5 devices show 🟢 Online

---

## 🎉 Done!

Your IoT Security Platform is now running with:
- ✅ 5 virtual IoT devices
- ✅ Real-time dashboard
- ✅ Hardware Gateway bridge
- ✅ Secure data transmission

**Total Time:** ~15 minutes

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and architecture:
- `COMPLETE_SETUP_FINAL_CORRECT.md` - Complete guide
- `FINAL_ARCHITECTURE_CORRECT.md` - Architecture details
- `DEVICE_REGISTRATION_WORKFLOW.md` - Device registration

---

**SafeEdge Team - Imagine Cup 2026** 🏆
