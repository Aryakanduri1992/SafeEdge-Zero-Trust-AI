# ESP32 Quick Reference Card

## 📌 Pin Configuration

```
┌─────────────────────────────────┐
│         ESP32 DevKit v1         │
├─────────────────────────────────┤
│ GPIO 32 → Red LED (Critical)    │
│ GPIO 25 → Green LED (Safe)      │
│ GPIO 26 → Yellow LED (Warning)  │
│ GPIO 33 → Buzzer (Audio)        │
│                                 │
│ GPIO 23 → W5500 MOSI            │
│ GPIO 19 → W5500 MISO            │
│ GPIO 18 → W5500 SCK             │
│ GPIO 5  → W5500 CS              │
│ 3.3V    → W5500 VCC             │
│ GND     → W5500 GND             │
│                                 │
│ VIN     → 5V (from LM2596)      │
│ GND     → Common Ground         │
└─────────────────────────────────┘
```

## 🚦 LED Status Indicators

| LED Color | State | Meaning |
|-----------|-------|---------|
| 🟢 Green | Solid | System Safe |
| 🟡 Yellow | Solid | Warning |
| 🟡 Yellow | Blink | Anomaly Detected |
| 🔴 Red | Blink | Critical Threat |
| 🔴🟡🟢 All | Flash | Attack Detected |
| 🟢 Green | Blink | No Network |

## 🔊 Buzzer Patterns

| Pattern | Frequency | Duration | Meaning |
|---------|-----------|----------|---------|
| Short beep | 1500 Hz | 100ms | Warning |
| Long beep | 2000 Hz | 200ms | Critical |
| Alarm | 2500 Hz | 100ms | Attack |
| Silent | - | - | Safe |

## 📁 Firmware Files

### Production Firmware:
1. **`src/hardware/esp32_demo_firmware.ino`**
   - Basic functionality
   - Firebase integration
   - Attack simulation
   - Use for: Development and demos

2. **`esp32_secure/esp32_tls_secure.ino`**
   - TLS/mTLS security
   - Certificate authentication
   - Secure handshake
   - Use for: Secure deployments

3. **`esp32_secure/safeedge_encrypted_firmware.ino`**
   - AES-256-GCM encryption
   - ECDH key exchange
   - End-to-end encryption
   - Use for: Maximum security

### Test Firmware:
4. **`esp32_hardware_test/hardware_connection_test.ino`**
   - Hardware verification
   - Component testing
   - Demonstration mode
   - Use for: Testing hardware

## 🌐 Network Configuration

### Ethernet Settings:
```cpp
MAC: DE:AD:BE:EF:FE:ED
Static IP: 192.168.1.177
DHCP: Enabled (tries first)
```

### Firebase Paths:
```
/devices/{id}/current     → Current data
/devices/{id}/info        → Device info
/sensorReadings/{time}    → History
/alerts/{time}            → Alerts
/commands/{id}            → Commands
```

## 🎮 Serial Commands

Send via Serial Monitor (115200 baud):

| Command | Action |
|---------|--------|
| `TEMP_ATTACK` | Simulate temperature attack |
| `POWER_ATTACK` | Simulate power attack |
| `NETWORK_ATTACK` | Simulate network attack |
| `STOP_ATTACK` | Stop attack simulation |
| `STATUS` | Print system status |
| `RESET` | Restart ESP32 |
| `PRESENTATION_MODE` | Toggle demo mode |

## 🔧 Arduino IDE Setup

### Board Configuration:
```
Board: ESP32 Dev Module
Upload Speed: 115200
CPU Frequency: 240MHz
Flash Size: 4MB
Port: (Your COM port)
```

### Required Libraries:
```
- Ethernet (by Various)
- FirebaseESP32
- ArduinoJson
- SPI (built-in)
```

## 📊 System Metrics

### Memory Usage:
- Flash: 325 KB (24%)
- RAM: 23 KB (7%)
- Free Heap: ~300 KB

### Timing:
- Sensor update: 3 seconds
- Heartbeat: 30 seconds
- Command poll: 100ms
- LED update: 500ms

## ⚡ Power Specifications

```
Input: 12V DC
Regulated: 5V (LM2596)
ESP32: ~500mA
Total: <1A
```

## 🔒 Security Features

- ✅ AES-256-GCM encryption
- ✅ ECDH key exchange
- ✅ mTLS authentication
- ✅ Certificate-based auth
- ✅ Timestamp validation
- ✅ Replay protection

## 🎯 Attack Detection

### Monitored Parameters:
- Temperature (35-40°C safe)
- Humidity (40-70% safe)
- Power voltage (11-13.5V safe)
- Network connectivity
- Security score (0-100)

### Threat Levels:
- **Safe**: Score ≥ 80
- **Warning**: Score 60-79
- **Critical**: Score < 60

## 📝 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Won't upload | Hold BOOT button |
| No serial output | Check baud: 115200 |
| LED not working | Check polarity |
| Buzzer silent | Check GPIO 33 |
| No Ethernet | Check SPI wiring |
| No IP address | Connect cable |

## 📞 Support Files

- `HARDWARE_CONNECTIONS.md` - Detailed wiring
- `QUICK_START.md` - Getting started
- `FIRMWARE_UPDATE_SUMMARY.md` - Change log
- `ESP32_HARDWARE_STATUS.md` - Status report

## ✅ Pre-Flight Checklist

Before powering on:
- [ ] All connections verified
- [ ] LM2596 output is 5V
- [ ] LED polarity correct
- [ ] No short circuits
- [ ] Ethernet cable connected
- [ ] Firmware uploaded

## 🚀 Quick Start

1. Upload firmware
2. Open Serial Monitor (115200)
3. Connect Ethernet cable
4. Verify IP address
5. Test with commands
6. Monitor LEDs and buzzer

---

**Keep this card handy for quick reference!**

**Version**: 1.0  
**Date**: 2026-04-09  
**Status**: Production Ready ✅
