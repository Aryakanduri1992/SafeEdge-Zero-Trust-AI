# ESP32 LED Status Indicators Guide

## SafeEdge Gateway Hardware Status LEDs

The ESP32 Gateway uses three LEDs to provide visual feedback about system status and operations:

### 🔴 RED LED (Pin 32) - WiFi Status & Errors
- **Solid ON**: WiFi disconnected or connection failed
- **OFF**: WiFi connected successfully
- **3 Quick Flashes**: Error occurred (backend failure, data send error, etc.)

### 🟢 GREEN LED (Pin 25) - System Ready & Data Success
- **Solid ON**: System fully operational (WiFi + Ethernet connected)
- **Slow Blink**: WiFi connected but Ethernet not ready
- **OFF**: System not ready or WiFi disconnected
- **Quick Flash**: Data successfully forwarded to backend/Firebase

### 🟡 YELLOW LED (Pin 26) - Ethernet Status & BLE Activity
- **Solid ON**: Ethernet connected and ready for data
- **OFF**: Ethernet not connected
- **Fast Blink**: BLE client connected (provisioning active)
- **Double Flash**: Data received from Laptop 2 via Ethernet

## LED Status Patterns

### Startup Sequence
1. **All LEDs ON** (1 second) - Hardware test
2. **Sequential OFF** (Red → Yellow → Green) - System initialization
3. **Final State** - Normal operation indicators

### Normal Operation States

#### ✅ Fully Operational
- 🔴 RED: OFF
- 🟢 GREEN: Solid ON
- 🟡 YELLOW: Solid ON

#### ⚠️ WiFi Only (No Ethernet)
- 🔴 RED: OFF
- 🟢 GREEN: Slow Blink
- 🟡 YELLOW: OFF

#### ❌ WiFi Disconnected
- 🔴 RED: Solid ON
- 🟢 GREEN: OFF
- 🟡 YELLOW: Ethernet status (ON/OFF)

#### 📱 BLE Provisioning Active
- 🔴 RED: WiFi status
- 🟢 GREEN: System status
- 🟡 YELLOW: Fast Blink

### Data Flow Indicators

#### 📥 Data Received (from Laptop 2)
- 🟡 YELLOW: Double flash (50ms ON, 50ms OFF, 50ms ON, 50ms OFF)

#### 📤 Data Forwarded (to Backend/Firebase)
- 🟢 GREEN: Quick flash (50ms OFF, 100ms ON, 50ms OFF, back to normal)

#### ❌ Error Occurred
- 🔴 RED: 3 quick flashes (100ms ON, 100ms OFF, repeat 3 times)

## Troubleshooting with LEDs

### Problem: All LEDs OFF
- **Cause**: Power issue or hardware failure
- **Solution**: Check power supply and connections

### Problem: RED LED Solid ON
- **Cause**: WiFi connection failed
- **Solution**: Check WiFi credentials and network availability

### Problem: YELLOW LED OFF (but system running)
- **Cause**: Ethernet not connected
- **Solution**: Check Ethernet cable and adapter connections

### Problem: No LED Activity During Data Send
- **Cause**: Data not reaching ESP32 or processing error
- **Solution**: Check Laptop 2 network configuration and ESP32 logs

## Demo Scenarios

### 🎯 Normal Demo Flow
1. **Startup**: All LEDs flash, then settle to operational state
2. **Data Reception**: Yellow double-flash when Laptop 2 sends data
3. **Data Forwarding**: Green flash when data sent to backend
4. **Continuous Operation**: Steady green and yellow LEDs

### 🚨 Attack Simulation
1. **High Frequency Data**: Rapid yellow flashes (data received)
2. **Anomaly Detection**: Could trigger error patterns (red flashes)
3. **System Recovery**: Return to normal LED patterns

### 📱 Device Provisioning Demo
1. **BLE Connection**: Yellow LED starts fast blinking
2. **Provisioning Success**: Green flashes + 2 beeps
3. **Provisioning Failure**: Red flashes
4. **BLE Disconnect**: Yellow returns to solid (if Ethernet connected)

## Hardware Connections

```
ESP32 Pin Assignments:
- Pin 32: RED LED (+ 220Ω resistor to GND)
- Pin 25: GREEN LED (+ 220Ω resistor to GND)  
- Pin 26: YELLOW LED (+ 220Ω resistor to GND)
- Pin 33: BUZZER (optional audio feedback)
```

## Integration with System Monitoring

The LED indicators work alongside:
- **Serial Monitor**: Detailed text output for debugging
- **Web Interface**: HTTP status pages at ESP32 IP addresses
- **BLE Status**: Provisioning feedback via mobile app
- **Backend Logs**: Complete data flow tracking

This visual feedback system allows for quick system status assessment during demonstrations and troubleshooting without needing to check serial output or web interfaces.