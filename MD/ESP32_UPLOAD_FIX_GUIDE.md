# ESP32 Upload Error Fix Guide

## 🚨 **Current Issue**
```
A fatal error occurred: The chip stopped responding.
Hard resetting via RTS pin...
Failed uploading: uploading error: exit status 2
```

## 🔧 **Quick Fixes (Try in Order)**

### **Fix 1: Hold BOOT Button During Upload**
1. **Press and HOLD** the BOOT button on ESP32
2. Click **Upload** in Arduino IDE
3. **Keep holding BOOT** until "Connecting..." appears
4. **Release BOOT** when upload starts (you'll see progress %)
5. Wait for upload to complete

### **Fix 2: Manual Reset Sequence**
1. **Press and HOLD** BOOT button
2. **Press and RELEASE** EN (Reset) button (while still holding BOOT)
3. **Release BOOT** button
4. **Immediately click Upload** in Arduino IDE

### **Fix 3: Lower Upload Speed**
1. In Arduino IDE: **Tools → Upload Speed**
2. Change from **921600** to **115200**
3. Try uploading again

### **Fix 4: Change USB Port/Cable**
1. Try different USB port
2. Use shorter, high-quality USB cable
3. Avoid USB hubs - connect directly to computer

### **Fix 5: Restart Everything**
1. **Unplug ESP32** from USB
2. **Close Arduino IDE**
3. **Restart Arduino IDE**
4. **Reconnect ESP32**
5. **Select correct port** (Tools → Port)
6. Try upload again

## 🎯 **Recommended Upload Sequence**

### **Step 1: Upload Simple Test First**
Upload the simple test code: `LED_Test_Web_Sync.ino`
- Smaller code size = less likely to fail
- Tests hardware functionality
- Confirms upload process works

### **Step 2: Verify Test Code Works**
1. Open Serial Monitor (115200 baud)
2. Should see LED test messages
3. LEDs should blink in sequence
4. Temperature simulation should run

### **Step 3: Upload Main Code**
Once test code works, upload `SafeEdge_Simple.ino`
- Use same upload method that worked for test
- Hold BOOT button if needed

## 🔍 **Troubleshooting Steps**

### **Check Serial Port**
```bash
# On Mac, list available ports:
ls /dev/cu.*

# Should see something like:
/dev/cu.usbserial-0001
/dev/cu.SLAB_USBtoUART
```

### **Verify ESP32 Board Selection**
- **Board**: "ESP32 Dev Module"
- **Upload Speed**: 115200 (not 921600)
- **CPU Frequency**: 240MHz
- **Flash Frequency**: 80MHz
- **Flash Mode**: QIO
- **Flash Size**: 4MB
- **Port**: /dev/cu.usbserial-XXXX

### **Check USB Connection**
1. ESP32 power LED should be ON
2. Computer should recognize USB device
3. Try different USB cable (data cable, not charging-only)

## 🚀 **Upload Success Indicators**

### **During Upload:**
```
Connecting........_____.....
Chip is ESP32-D0WD-V3 (revision v3.1)
Features: WiFi, BT, Dual Core, 240MHz
Uploading stub...
Running stub...
Stub running...
Writing at 0x00001000... (100%)
```

### **After Upload:**
```
Hard resetting via RTS pin...
Done uploading.
```

### **Serial Monitor Output:**
```
🚀 ESP32 LED Test - Web Interface Sync
🏆 Imagine Cup 2026 - LED Behavior Test
==================================================
🔄 Testing DC-DC converter LED circuits...
Testing RED LED...
Testing GREEN LED...
Testing YELLOW LED...
✅ Hardware test complete!
```

## 🔄 **If Still Failing**

### **Try Erase Flash First**
1. **Tools → Erase Flash**: "All Flash Contents"
2. Upload simple Blink example first
3. Then upload your code

### **Check for Hardware Issues**
1. **Disconnect all LEDs** temporarily
2. Try uploading with **no external connections**
3. If upload works, reconnect LEDs one by one

### **Alternative Upload Method**
1. Use **ESP32 Flash Download Tool** (official Espressif tool)
2. Or try **PlatformIO** instead of Arduino IDE

## 📱 **Quick Test Commands**

### **Test 1: Simple Blink (No External Components)**
```cpp
void setup() {
  pinMode(2, OUTPUT);  // Built-in LED
}
void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}
```

### **Test 2: Serial Communication**
```cpp
void setup() {
  Serial.begin(115200);
}
void loop() {
  Serial.println("ESP32 is working!");
  delay(1000);
}
```

## ✅ **Success Checklist**

Before uploading main SafeEdge code:
- [ ] Simple LED test uploads successfully
- [ ] Serial Monitor shows test messages
- [ ] All 3 LEDs work in test code
- [ ] No upload errors or timeouts
- [ ] ESP32 responds to reset properly

Once these work, the main SafeEdge code should upload without issues! 🎉

## 🆘 **Emergency Recovery**

If ESP32 becomes completely unresponsive:
1. **Hold BOOT + EN buttons** together
2. **Release EN** first, then **release BOOT**
3. ESP32 should enter **download mode**
4. Try uploading immediately

This puts ESP32 in forced download mode for recovery.