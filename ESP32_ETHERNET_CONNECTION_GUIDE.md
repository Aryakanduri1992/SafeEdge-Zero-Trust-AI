# ESP32 Ethernet Connection Guide

## Physical Setup Required

### Hardware Connections
```
Mac (USB-C) → USB-C Ethernet Adapter → Ethernet Cable → ESP32 Ethernet Port
```

### ESP32 Ethernet Wiring
Your ESP32 needs an Ethernet module connected. Common options:

**Option A: ESP32 with Built-in Ethernet (ESP32-GATEWAY)**
- Direct Ethernet port on board

**Option B: ESP32 + W5500 Ethernet Module**
- Connect W5500 to ESP32 SPI pins:
  - MOSI → GPIO 23
  - MISO → GPIO 19  
  - SCK → GPIO 18
  - CS → GPIO 5
  - VCC → 3.3V
  - GND → GND

**Option C: ESP32 + ENC28J60 Ethernet Module**
- Similar SPI connection as W5500

## Network Configuration

### Current Network Setup
- **Mac IP**: `172.20.10.2`
- **Network**: `172.20.10.0/28`
- **Gateway**: `172.20.10.1`
- **ESP32 Target**: `172.20.10.10`

### ESP32 Firmware Configuration
The `SafeEdge_Unified.ino` is already configured for:
```cpp
#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)
```

## Upload Process

### 1. Upload Memory Fix First
```
File: esp32_memory_fix.ino
Purpose: Clear corrupted SPIFFS
```

### 2. Upload Main Firmware
```
File: esp32_secure/SafeEdge_Unified.ino
Purpose: Main gateway functionality
```

### 3. Monitor Serial Output
Expected output after upload:
```
╔════════════════════════════════════════════════════════╗
║     SafeEdge ESP32 - GATEWAY MODE                     ║
║     WiFi: Firebase | Ethernet: Laptop 2              ║
╚════════════════════════════════════════════════════════╝

📱 MAC Address: XX:XX:XX:XX:XX:XX
🚀 Starting GATEWAY MODE
📡 Connecting to WiFi...
✅ WiFi connected
📡 Connecting Ethernet...
✅ Ethernet connected
   IP: 172.20.10.10
🔥 Initializing Firebase...
✅ Firebase connected
🌐 Starting HTTP Server...
✅ HTTP Server started
🎉 Gateway fully operational!
```

## Troubleshooting

### If Ethernet doesn't connect:
1. **Check Hardware**: Verify Ethernet module wiring
2. **Check Cable**: Test Ethernet cable with another device
3. **Check Power**: Ensure ESP32 has sufficient power (5V recommended)
4. **Check Libraries**: Ensure Ethernet library is installed

### If IP assignment fails:
1. **Check Network Conflict**: Ensure 172.20.10.10 isn't used by another device
2. **Check Subnet**: Verify subnet mask matches
3. **Try DHCP First**: Comment out static IP, use DHCP to test

### If still no connection:
1. **Use Network Scanner**: Run the `find_esp32.py` script
2. **Check ARP Table**: `arp -a | grep "172.20.10"`
3. **Monitor Serial**: Watch ESP32 serial output for errors

## Testing Connection

### 1. Ping Test
```bash
ping 172.20.10.10
```

### 2. HTTP Test
```bash
curl http://172.20.10.10:80
```

### 3. Run Laptop 2 Script
```bash
python laptop2_provisioned_device.py
```

## Expected Data Flow
```
Laptop 2 (172.20.10.2) 
    ↓ HTTP POST
ESP32 (172.20.10.10:80)
    ↓ WiFi
Firebase
    ↓
Dashboard
```