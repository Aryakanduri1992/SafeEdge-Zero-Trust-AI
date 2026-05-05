# 🔧 Fix: Sketch Too Big Error

## Error Message:
```
Sketch uses 1427527 bytes (108%) of program storage space. Maximum is 1310720 bytes.
Sketch too big; see https://support.arduino.cc/hc/en-us/articles/360013825179
text section exceeds available space in board
```

## ✅ Solution: Change Partition Scheme

The Firebase library is large. You need to change the partition scheme to allow more space for your program.

---

## 🎯 Quick Fix (30 seconds):

### Step 1: Open Tools Menu
```
Arduino IDE → Tools
```

### Step 2: Find "Partition Scheme"
```
Tools → Partition Scheme
```

### Step 3: Select Larger Partition
```
Change from: "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
Change to:   "Huge APP (3MB No OTA/1MB SPIFFS)"
```

### Step 4: Compile Again
```
Click Verify (✓) button
Should work now! ✅
```

---

## 📋 Detailed Steps with Screenshots

### Current Setting (Too Small):
```
Tools → Partition Scheme → Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)
                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                            Only 1.2MB for your program - TOO SMALL!
```

### New Setting (Larger):
```
Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)
                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                            3MB for your program - PERFECT!
```

---

## 🔍 Available Partition Schemes

Here are the options you'll see:

### Option 1: Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)
- App Space: 1.2MB ❌ TOO SMALL
- SPIFFS: 1.5MB
- OTA: Yes

### Option 2: Default 4MB with ffat (1.2MB APP/1.5MB FATFS)
- App Space: 1.2MB ❌ TOO SMALL
- FATFS: 1.5MB
- OTA: Yes

### Option 3: Default 4MB with spiffs (1.9MB APP with OTA/190KB SPIFFS)
- App Space: 1.9MB ⚠️ MIGHT WORK
- SPIFFS: 190KB (small)
- OTA: Yes

### Option 4: Huge APP (3MB No OTA/1MB SPIFFS) ⭐ RECOMMENDED
- App Space: 3MB ✅ PERFECT!
- SPIFFS: 1MB (enough for certificates)
- OTA: No (we don't need OTA for now)

### Option 5: Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)
- App Space: 1.9MB ⚠️ MIGHT WORK
- SPIFFS: 190KB (very small)
- OTA: Yes

### Option 6: No OTA (2MB APP/2MB SPIFFS)
- App Space: 2MB ✅ GOOD
- SPIFFS: 2MB
- OTA: No

### Option 7: No OTA (1MB APP/3MB SPIFFS)
- App Space: 1MB ❌ TOO SMALL
- SPIFFS: 3MB
- OTA: No

---

## 🎯 Recommended Settings

### For Your Project:
```
Board: ESP32 Dev Module
Partition Scheme: Huge APP (3MB No OTA/1MB SPIFFS) ⭐
Flash Size: 4MB
```

This gives you:
- ✅ 3MB for your program (plenty of space!)
- ✅ 1MB for SPIFFS (enough for certificates and config)
- ✅ No OTA updates (we don't need them for development)

---

## 📊 Size Comparison

### Your Sketch Size:
```
Current: 1,427,527 bytes (1.36 MB)
```

### Partition Schemes:
```
Default (1.2MB):     ❌ Too small (108% full)
Huge APP (3MB):      ✅ Perfect (45% full)
No OTA (2MB):        ✅ Good (68% full)
```

---

## ✅ Complete Configuration

### Tools Menu Settings:

```
Board: "ESP32 Dev Module"
Upload Speed: "115200"
CPU Frequency: "240MHz (WiFi/BT)"
Flash Frequency: "80MHz"
Flash Mode: "QIO"
Flash Size: "4MB (32Mb)"
Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)" ⭐
Core Debug Level: "None"
PSRAM: "Disabled"
Arduino Runs On: "Core 1"
Events Run On: "Core 1"
Port: (your ESP32 port)
```

---

## 🐛 Troubleshooting

### Issue: Can't Find "Partition Scheme" in Tools Menu

**Solution**:
1. Make sure you selected: **Tools → Board → ESP32 Dev Module**
2. Partition Scheme only appears for ESP32 boards
3. If still not visible, update ESP32 board package:
   - Tools → Board → Boards Manager
   - Search: ESP32
   - Update to latest version

### Issue: Still Too Big After Changing Partition

**Current Size**: 1.36 MB  
**Huge APP**: 3 MB  
**Should work!**

If still too big:
1. Check you selected "Huge APP (3MB No OTA/1MB SPIFFS)"
2. Restart Arduino IDE
3. Try compiling again

### Issue: Upload Fails After Changing Partition

**Solution**:
1. This is normal - partition changed
2. Hold BOOT button on ESP32 during upload
3. Release after "Connecting..." message
4. Upload should succeed

---

## 📝 Step-by-Step Checklist

- [ ] Open Arduino IDE
- [ ] Tools → Board → ESP32 Dev Module
- [ ] Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)
- [ ] Click Verify (✓)
- [ ] Should compile successfully ✅
- [ ] Connect ESP32 via USB
- [ ] Click Upload (→)
- [ ] Hold BOOT button if needed
- [ ] Upload successful ✅

---

## 🎉 After Fixing

### Compilation Output:
```
Sketch uses 1427527 bytes (45%) of program storage space. Maximum is 3145728 bytes.
Global variables use 52296 bytes (15%) of dynamic memory, leaving 275384 bytes for local variables.
Done compiling. ✅
```

### Upload Output:
```
Writing at 0x00010000... (100%)
Wrote 1427527 bytes (compressed)
Hash of data verified.

Leaving...
Hard resetting via RTS pin...
Done uploading. ✅
```

---

## 💡 Why This Happens

### Firebase Library is Large:
- Firebase ESP Client: ~800 KB
- SSL/TLS libraries: ~300 KB
- ArduinoJson: ~100 KB
- Your code: ~200 KB
- **Total**: ~1.4 MB

### Default Partition Too Small:
- Default partition: 1.2 MB
- Your sketch: 1.4 MB
- **Result**: Doesn't fit! ❌

### Solution:
- Use "Huge APP" partition: 3 MB
- Your sketch: 1.4 MB
- **Result**: Fits perfectly! ✅

---

## 🎯 Quick Reference

### The Fix:
```
Tools → Partition Scheme → Huge APP (3MB No OTA/1MB SPIFFS)
```

### Why It Works:
```
Default:  1.2 MB app space (too small)
Huge APP: 3.0 MB app space (perfect!)
```

### Trade-off:
```
✅ More space for your program (3MB)
❌ No OTA updates (we don't need them)
✅ Still have 1MB for SPIFFS (enough for certificates)
```

---

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026  
**Issue**: Sketch too big (108% of space)  
**Solution**: Change partition scheme to "Huge APP (3MB No OTA/1MB SPIFFS)"
