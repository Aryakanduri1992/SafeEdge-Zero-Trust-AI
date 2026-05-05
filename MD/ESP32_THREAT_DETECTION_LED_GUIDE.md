# ESP32 Threat Detection LED System

## 🚨 Intelligent Security LED Indicators

The ESP32 Gateway now analyzes incoming sensor data in real-time and changes LED colors based on detected threat levels. This provides immediate visual feedback about the security status of your IoT environment.

## 🎯 LED Threat Indication System

### 🟢 GREEN LED - NORMAL CONDITIONS (Safe)
**Conditions:**
- Temperature: 15-30°C (normal range)
- Security Score: 70-100 (good security)
- Threat Level: "low" or "normal"
- No anomalies detected
- No motion or door alerts
- Sound levels: <50 dB (quiet)
- Vibration: <2.0 (minimal)
- Humidity: <65% (normal)

**LED Behavior:**
- **Solid GREEN ON** - All systems safe
- **2 Quick Green Flashes** - Transition to normal state

### 🟡 YELLOW LED - SUSPICIOUS ACTIVITY (Caution)
**Conditions:**
- Temperature: 30-35°C (elevated)
- Security Score: 50-70 (concerning)
- Threat Level: "medium"
- Anomaly detected: True
- Motion detected or door opened
- Sound levels: 50-70 dB (elevated)
- Vibration: 2.0-5.0 (moderate)
- Humidity: 65-80% (high)

**LED Behavior:**
- **Solid YELLOW ON** - Suspicious activity detected
- **3 Quick Yellow Flashes** - Transition to suspicious state
- **1 Beep** - Audio alert for attention

### 🔴 RED LED - CRITICAL THREAT (Danger)
**Conditions:**
- Temperature: >35°C (overheating attack)
- Security Score: <50 (critical)
- Threat Level: "critical"
- Security breach: Motion + Door + High Sound (>70 dB)
- Vibration: >5.0 (attack simulation)
- Humidity: >80% (environmental attack)

**LED Behavior:**
- **Fast Blinking RED** - Critical threat active
- **5 Rapid Red Flashes** - Transition to critical state
- **3 Beeps** - Urgent audio alarm

## 📊 Demo Scenarios

### Scenario 1: Normal Operation
```
Laptop 2 sends normal data:
- Temperature: 23°C
- Security Score: 94
- No motion, door closed
- Normal sound levels

ESP32 Response:
🟢 GREEN LED: Solid ON
Serial: "✅ NORMAL CONDITIONS → GREEN LED: All systems safe"
```

### Scenario 2: Attack Button Pressed (Temperature Attack)
```
Laptop 2 GUI "ATTACK" button pressed:
- Temperature: 45°C (overheating)
- Security Score: 25 (critical)
- Threat Level: "critical"

ESP32 Response:
🔴 RED LED: Fast Blinking
Serial: "🚨 CRITICAL THREAT DETECTED! → RED LED: Attack in progress"
Audio: 3 beeps (alarm)
```

### Scenario 3: Suspicious Activity
```
Laptop 2 sends borderline data:
- Temperature: 32°C (elevated)
- Motion detected: True
- Security Score: 65 (low)

ESP32 Response:
🟡 YELLOW LED: Solid ON
Serial: "⚠️ SUSPICIOUS ACTIVITY DETECTED! → YELLOW LED: Potential threat"
Audio: 1 beep (attention)
```

## 🔧 Technical Implementation

### Data Analysis Process:
1. **Data Received** - ESP32 receives encrypted sensor data
2. **Threat Analysis** - `analyzeSensorData()` function evaluates conditions
3. **Threat Classification** - Assigns NORMAL, SUSPICIOUS, or CRITICAL level
4. **LED Update** - `indicateThreatLevel()` provides immediate feedback
5. **Continuous Monitoring** - `updateThreatLEDs()` maintains current state

### Threat Detection Logic:
```cpp
// Critical Conditions (RED)
if (temperature > 35.0 || securityScore < 50 || threatLevel == "critical") {
    return THREAT_CRITICAL;
}

// Suspicious Conditions (YELLOW)  
else if (temperature > 30.0 || securityScore < 70 || anomalyDetected) {
    return THREAT_SUSPICIOUS;
}

// Normal Conditions (GREEN)
else {
    return THREAT_NORMAL;
}
```

## 🎬 Live Demo Instructions

### Setup for Imagine Cup Demo:

1. **Start System**: 
   - Power on ESP32
   - Watch startup sequence (all LEDs flash)
   - System settles to GREEN (normal state)

2. **Normal Operation Demo**:
   - Start Laptop 2 simulator
   - Show GREEN LED solid (safe conditions)
   - Point out serial monitor: "✅ NORMAL CONDITIONS"

3. **Attack Simulation**:
   - Press "ATTACK" button on Laptop 2 GUI
   - Watch LED change: GREEN → RED (blinking)
   - Point out serial monitor: "🚨 CRITICAL THREAT DETECTED!"
   - Listen for 3-beep alarm

4. **Recovery Demo**:
   - Press "RESET TO NORMAL" on Laptop 2 GUI
   - Watch LED change: RED → GREEN
   - Show system recovery

### Audience Interaction:
- **"What does GREEN mean?"** → "All systems safe, normal operation"
- **"What triggers RED?"** → "Critical threats like overheating, security breaches"
- **"What about YELLOW?"** → "Suspicious activity that needs attention"

## 📋 Troubleshooting

### Problem: LEDs don't change with data
- **Check**: Serial monitor for threat analysis output
- **Check**: Data is reaching ESP32 (should see "📥 Data from:" messages)
- **Check**: Laptop 2 is sending different sensor values

### Problem: Always shows RED LED
- **Check**: Sensor data values in serial monitor
- **Check**: Laptop 2 attack mode might be stuck on
- **Solution**: Reset Laptop 2 to normal mode

### Problem: No audio beeps
- **Check**: Buzzer connections (GPIO33)
- **Check**: Buzzer polarity and power

## 🏆 Competitive Advantages

### For Judges:
1. **Real-time Threat Detection** - Immediate visual feedback
2. **Intuitive Interface** - Anyone can understand the LED colors
3. **Proactive Security** - Detects attacks as they happen
4. **Professional Presentation** - Clear, obvious system status

### Technical Innovation:
- **Edge AI** - Threat analysis happens on the gateway, not cloud
- **Multi-parameter Analysis** - Considers temperature, motion, sound, etc.
- **Adaptive Thresholds** - Different threat levels for graduated response
- **Visual + Audio Alerts** - Multiple feedback channels

This system transforms complex IoT security data into simple, intuitive visual indicators that anyone can understand at a glance! 🚀