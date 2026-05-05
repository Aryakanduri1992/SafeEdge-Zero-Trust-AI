# Device ID Update - Quick Summary

---

## 🎯 What You Need to Do

After registering devices in dashboard, update the Python simulator with actual device IDs.

---

## 📁 Files Available

### For 2 Devices:
```bash
laptop2_simulator_2devices.py
```

### For 5 Devices:
```bash
laptop2_simulator_template.py
```

---

## ⚡ Quick Steps

### 1. Register Devices in Dashboard

```
Dashboard → Add Device → Fill Form → Generate QR Code
```

**Copy the Device ID** shown after registration (e.g., `temp_sensor_living_room_001`)

### 2. Update Python File

**Open:** `laptop2_simulator_2devices.py` (for 2 devices)

**Find:**
```python
"device_id": "PASTE_DEVICE_ID_HERE_1",  # ← UPDATE THIS
```

**Replace with:**
```python
"device_id": "temp_sensor_living_room_001",  # ← Your actual ID
```

**Save the file**

### 3. Run Simulator

```bash
python3 laptop2_simulator_2devices.py
```

---

## 📋 Example: 2 Devices

### Dashboard Registration:

**Device 1:**
- Name: Temperature Sensor - Living Room
- Type: Temperature Sensor
- **Device ID:** `temp_sensor_living_room_001` ← Copy this

**Device 2:**
- Name: Smart Door Lock - Main Entrance
- Type: Door Lock
- **Device ID:** `door_lock_main_entrance_001` ← Copy this

### Python File Update:

```python
DEVICES = [
    {
        "device_id": "temp_sensor_living_room_001",  # ← Paste here
        "device_name": "Temperature Sensor - Living Room",
        "device_type": "temperature_sensor",
        "location": "Living Room",
        "interval": 5
    },
    {
        "device_id": "door_lock_main_entrance_001",  # ← Paste here
        "device_name": "Smart Door Lock - Main Entrance",
        "device_type": "door_lock",
        "location": "Main Entrance",
        "interval": 10
    }
]
```

---

## ✅ Verification

### Before Running Simulator:

**Dashboard shows:**
```
Devices (2)
├─ temp_sensor_living_room_001 (Pending)
└─ door_lock_main_entrance_001 (Pending)
```

### After Running Simulator:

**Terminal shows:**
```
[14:30:15] ✅ temp_sensor_living_room_001 → 22.3 celsius
[14:30:25] ✅ door_lock_main_entrance_001 → 1 status
```

**Dashboard shows:**
```
Devices (2)
├─ temp_sensor_living_room_001 (Online) ✅
└─ door_lock_main_entrance_001 (Online) ✅
```

---

## 🚨 Important Notes

1. **Device IDs must match exactly** - Copy-paste from dashboard
2. **Case-sensitive** - `temp_sensor_001` ≠ `Temp_Sensor_001`
3. **No typos** - Use copy-paste, don't type manually
4. **Save file** after updating device IDs
5. **Hardware Gateway must be running** before starting simulator

---

## 📚 Detailed Guides

- **HOW_TO_UPDATE_DEVICE_IDS.md** - Complete step-by-step guide
- **DEVICE_REGISTRATION_WORKFLOW.md** - Dashboard registration process
- **LAPTOP2_MAC_COMMANDS.md** - Mac Ethernet setup

---

## 🎉 That's It!

1. Register devices in dashboard → Get device IDs
2. Update Python file → Paste device IDs
3. Run simulator → Watch dashboard update!

**Simple!** 🚀

---

**SafeEdge Team - Imagine Cup 2026** 🏆
