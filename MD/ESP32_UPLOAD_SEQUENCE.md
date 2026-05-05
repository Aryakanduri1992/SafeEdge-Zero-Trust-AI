# ESP32 Upload Sequence - Memory Fix + Main Firmware

## Current Situation
- ESP32 has memory corruption: `assert failed: xQueueGenericTake queue.c:1370`
- SPIFFS filesystem is corrupted
- Need to clean memory before uploading main firmware

## Step 1: Upload Memory Fix Tool ⚠️ UPLOAD THIS FIRST

**File:** `esp32_memory_fix.ino`

**What it does:**
- Initializes SPIFFS with format flag
- Completely formats SPIFFS filesystem
- Clears all corrupted data
- Restarts ESP32 with clean memory

**Upload Process:**
1. Open Arduino IDE
2. Load `esp32_memory_fix.ino`
3. Select your ESP32 board
4. Upload and monitor Serial output
5. Wait for "ESP32 will restart in 3 seconds..."
6. ESP32 will restart automatically

**Expected Output:**
```
🔧 ESP32 Memory Fix Tool
========================
✅ SPIFFS initialized
🗑️ Formatting SPIFFS...
✅ SPIFFS formatted
✅ SPIFFS is clean (no files)
🔄 Restarting ESP32...
```

## Step 2: Upload Main Firmware

**File:** `esp32_secure/SafeEdge_Unified.ino`

**Current Configuration:**
- Mode: `#define OPERATION_MODE "GATEWAY"`
- WiFi: "office mobile" / "90323878"
- Firebase URL: "https://lumeshield-x-default-rtdb.firebaseio.com"
- Static IP: 192.168.100.10

**Upload Process:**
1. Wait for ESP32 to restart from memory fix
2. Load `SafeEdge_Unified.ino`
3. Verify configuration matches your network
4. Upload and monitor Serial output

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║     SafeEdge ESP32 - GATEWAY MODE                     ║
║     WiFi: Firebase | Ethernet: Laptop 2              ║
║     Imagine Cup 2026 - World Championship             ║
╚════════════════════════════════════════════════════════╝

📱 MAC Address: XX:XX:XX:XX:XX:XX
🚀 Starting GATEWAY MODE
📡 Connecting to WiFi...
✅ WiFi connected
📡 Connecting Ethernet...
✅ Ethernet connected
🔥 Initializing Firebase...
✅ Firebase connected
🌐 Starting HTTP Server...
✅ HTTP Server started
🎉 Gateway fully operational!
```

## Step 3: Test Complete System

After both uploads:

1. **Start Backend:**
   ```bash
   cd src/backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Laptop 2 Simulator:**
   ```bash
   python laptop2_provisioned_device.py
   ```

3. **Verify Data Flow:**
   - Laptop 2 → ESP32 Gateway → Firebase
   - Check Serial monitor for data reception
   - Check Firebase dashboard for data

## Why This Sequence?

**DON'T combine them because:**
- Memory corruption needs to be cleared first
- SPIFFS formatting requires a dedicated upload
- Main firmware expects clean filesystem
- Combining could cause upload failures

**DO upload separately because:**
- Memory fix tool is lightweight and focused
- Ensures complete filesystem cleanup
- Main firmware can initialize properly
- Easier to debug if issues occur

## Troubleshooting

If memory fix fails:
- Try uploading twice
- Use "Erase Flash" option in Arduino IDE
- Check ESP32 power supply

If main firmware fails after memory fix:
- Verify WiFi credentials
- Check Ethernet connections
- Monitor Serial output for specific errors