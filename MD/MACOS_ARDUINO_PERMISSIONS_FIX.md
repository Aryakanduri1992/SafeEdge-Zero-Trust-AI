# 🔧 macOS Arduino IDE Permissions Fix

## 🚨 **PROBLEM**
You clicked "Don't Allow" when Arduino IDE asked for file access permissions. Now Arduino IDE can't access libraries, causing:
```
fatal error: ArduinoJson.h: No such file or directory
```

## 🛠️ **SOLUTION: Grant File Access Permissions**

### **Method 1: System Preferences (Recommended)**

1. **Open System Preferences**
   - Click Apple menu → System Preferences
   - Or press Cmd+Space, type "System Preferences"

2. **Go to Security & Privacy**
   - Click "Security & Privacy"
   - Click "Privacy" tab

3. **Find Full Disk Access**
   - Scroll down and click "Full Disk Access" in left sidebar
   - Click the lock icon (🔒) to make changes
   - Enter your password

4. **Add Arduino IDE**
   - Click the "+" button
   - Navigate to Applications folder
   - Find and select "Arduino IDE"
   - Click "Open"
   - Make sure Arduino IDE has a checkmark ✅

5. **Alternative: Files and Folders**
   - If "Full Disk Access" doesn't work, try "Files and Folders"
   - Follow same steps but select "Files and Folders" instead

### **Method 2: Reset Arduino IDE Permissions**

1. **Quit Arduino IDE completely**
   - Arduino IDE → Quit Arduino IDE
   - Or press Cmd+Q

2. **Reset permissions database**
   ```bash
   # Open Terminal and run:
   sudo tccutil reset All com.arduino.IDE
   ```

3. **Restart Arduino IDE**
   - When it asks for permissions again, click "Allow"

### **Method 3: Manual Library Path Fix**

1. **Check Arduino IDE preferences**
   - Arduino IDE → Preferences
   - Look for "Sketchbook location"
   - Should be: `/Users/[username]/Documents/Arduino`

2. **Verify libraries folder exists**
   ```bash
   # Check if folder exists:
   ls -la ~/Documents/Arduino/libraries/
   
   # If not, create it:
   mkdir -p ~/Documents/Arduino/libraries/
   ```

3. **Set correct permissions**
   ```bash
   # Fix permissions:
   chmod -R 755 ~/Documents/Arduino/
   ```

## 🎯 **QUICK FIX STEPS**

### **Step 1: Grant Permissions**
1. System Preferences → Security & Privacy → Privacy
2. Click "Full Disk Access"
3. Click lock, enter password
4. Click "+", add Arduino IDE
5. Ensure Arduino IDE is checked ✅

### **Step 2: Restart Arduino IDE**
1. Quit Arduino IDE completely
2. Reopen Arduino IDE
3. Try compiling again

### **Step 3: Verify Library Installation**
1. Tools → Manage Libraries
2. Search "ArduinoJson"
3. Should show "INSTALLED" status
4. If not, click "Install"

## 🔍 **VERIFY THE FIX**

### **Test 1: Check Library Path**
```bash
# Should show ArduinoJson folder:
ls ~/Documents/Arduino/libraries/
```

### **Test 2: Compile Simple Code**
1. File → Examples → ArduinoJson → JsonDocument
2. Try to compile
3. Should work without errors

### **Test 3: Compile SafeEdge Code**
1. Open: esp32_secure/SafeEdge_Unified.ino
2. Select Board: ESP32 Dev Module
3. Compile: Should work now

## 🚨 **IF STILL NOT WORKING**

### **Alternative: Use Simplified Code**
I can create a version without ArduinoJson dependency:

```cpp
// Instead of ArduinoJson, use simple string parsing
// This avoids library dependency issues
```

### **Check Arduino IDE Version**
- Make sure you're using Arduino IDE 2.x
- Older versions have different permission requirements

### **Manual Library Installation**
```bash
# Download ArduinoJson manually:
cd ~/Documents/Arduino/libraries/
git clone https://github.com/bblanchon/ArduinoJson.git
```

## 🎉 **SUCCESS INDICATORS**

✅ **Arduino IDE can access files**  
✅ **Libraries folder is accessible**  
✅ **ArduinoJson compiles without errors**  
✅ **SafeEdge code compiles successfully**  

## 📞 **NEXT STEPS AFTER FIX**

1. **Compile SafeEdge_Unified.ino**
2. **Upload to ESP32**
3. **Test LED functionality**
4. **Run Laptop 2 simulator**
5. **Verify LED behavior with data**

The key is granting Arduino IDE proper file access permissions on macOS! 🚀