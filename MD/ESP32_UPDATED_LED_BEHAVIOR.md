# ESP32 Updated LED Behavior Guide

## 🎯 **New LED Control System**

The ESP32 now implements a simplified, hardware-focused LED control system that provides clear visual feedback for IoT security monitoring.

## 🚦 **LED Behavior Rules**

### 🟢 **GREEN LED (Pin 25) - System Status**
- **Always ON**: When system is ready and no attacks detected
- **OFF**: When attack is detected or system not ready
- **Purpose**: Shows normal operation status

### 🔴 **RED LED (Pin 32) - Attack Detection**  
- **ON**: When temperature > 35°C or other attack conditions detected
- **OFF**: When conditions are normal
- **Purpose**: Immediate attack/threat indicator

### 🟡 **YELLOW LED (Pin 26) - Data Activity**
- **Blinks**: Every time data is received from Laptop 2 (500ms blink)
- **OFF**: When no data activity
- **Purpose**: Shows live data flow from IoT devices

## 📊 **Attack Detection Conditions**

The ESP32 will turn **RED LED ON** when any of these conditions are met:

### **Primary Condition:**
- **Temperature > 35°C** (main trigger for overheating attack)

### **Secondary Conditions:**
- Security Score < 50 (critical security)
- Threat Level = "critical" 
- Motion + Door Open + Sound > 70dB (security breach)
- Vibration Level > 5.0 (physical attack)
- Humidity > 80% (environmental attack)
- Anomaly Detected = True

## 🎬 **Demo Scenarios**

### **Scenario 1: Normal Operation**
```
Laptop 2 GUI: Normal Mode
Data Sent: Temperature 24°C, Security Score 92
ESP32 Response:
- 🟢 GREEN LED: ON (system ready)
- 🔴 RED LED: OFF (no attack)
- 🟡 YELLOW LED: Blinks when data received
Serial: "✅ Normal conditions - GREEN LED ON"
```

### **Scenario 2: Attack Mode**
```
Laptop 2 GUI: Attack Mode Button Pressed
Data Sent: Temperature 45°C, Security Score 28
ESP32 Response:
- 🟢 GREEN LED: OFF (attack detected)
- 🔴 RED LED: ON (attack condition met)
- 🟡 YELLOW LED: Blinks when data received
Serial: "🚨 ATTACK DETECTED - RED LED ON!"
```

### **Scenario 3: Data Flow Monitoring**
```
Every time Laptop 2 sends data:
- 🟡 YELLOW LED: Blinks for 500ms
- Shows live data activity
- Independent of attack status
```

## 🔧 **Technical Implementation**

### **Main Control Function:**
```cpp
void updateHardwareLEDs() {
  // GREEN: Always ON when ready, OFF when attack
  if (systemReady && !attackDetected) {
    digitalWrite(LED_GREEN, HIGH);
  } else {
    digitalWrite(LED_GREEN, LOW);
  }
  
  // RED: ON when attack detected
  if (attackDetected) {
    digitalWrite(LED_RED, HIGH);
  } else {
    digitalWrite(LED_RED, LOW);
  }
  
  // YELLOW: Blink on data received
  if (yellowBlinkActive) {
    // 500ms blink cycle
  }
}
```

### **Attack Detection:**
```cpp
bool checkForAttack(DynamicJsonDocument& doc) {
  float temperature = doc["temperature"].as<float>();
  
  if (temperature > 35.0) {
    Serial.println("🚨 ATTACK CONDITIONS MET!");
    return true;
  }
  
  Serial.println("✅ NORMAL CONDITIONS");
  return false;
}
```

### **Data Received Indicator:**
```cpp
void triggerYellowBlink() {
  yellowBlinkStart = millis();
  yellowBlinkActive = true;
  Serial.println("💛 Yellow LED: Data received blink");
}
```

## 🎯 **Expected Serial Output**

### **Normal Data:**
```
📥 Data from: iot_temperature_sensor_20260414185938_62fd12aa
💛 Yellow LED: Data received blink
🔍 Checking for attack conditions:
   Temperature: 24.3°C
   Security Score: 92
   Threat Level: low
✅ NORMAL CONDITIONS - All parameters safe
✅ Normal conditions - GREEN LED ON
📤 Forwarding to Backend API...
✅ Data forwarded to Backend → Firebase
```

### **Attack Data:**
```
📥 Data from: iot_temperature_sensor_20260414185938_62fd12aa
💛 Yellow LED: Data received blink
🔍 Checking for attack conditions:
   Temperature: 45.7°C
   Security Score: 28
   Threat Level: critical
🚨 ATTACK CONDITIONS MET!
   → Temperature: 45.7°C (CRITICAL)
   → Security Score: 28 (CRITICAL)
   → Threat Level: critical (CRITICAL)
🚨 ATTACK DETECTED - RED LED ON!
📤 Forwarding to Backend API...
✅ Data forwarded to Backend → Firebase
```

## 🏆 **Demo Advantages**

### **For Judges:**
1. **Clear Visual Feedback**: Green = Safe, Red = Danger, Yellow = Activity
2. **Real-time Response**: LEDs change instantly when attack button pressed
3. **Professional Appearance**: Clean, obvious status indicators
4. **Easy to Understand**: Traffic light system (Green/Yellow/Red)

### **Technical Benefits:**
1. **Hardware-based Detection**: Analysis happens on edge device
2. **Low Latency**: Immediate LED response to threats
3. **Reliable Operation**: Simple, robust LED control
4. **Live Monitoring**: Yellow blinks show data flow in real-time

## 🎮 **Demo Script**

### **Setup:**
1. Upload updated ESP32 firmware
2. Connect LEDs to pins 25 (Green), 32 (Red), 26 (Yellow)
3. Start Laptop 2 GUI simulator

### **Demo Flow:**
1. **"Watch the green LED - system is ready and secure"**
2. **"Yellow blinks show live data from our IoT sensor"**
3. **"Now I'll simulate a cyberattack..."** (press Attack button)
4. **"Red LED immediately detects the threat!"** (temperature > 35°C)
5. **"System automatically returns to safe state"** (press Normal button)

This LED system provides instant, visual security monitoring that anyone can understand at a glance! 🚀