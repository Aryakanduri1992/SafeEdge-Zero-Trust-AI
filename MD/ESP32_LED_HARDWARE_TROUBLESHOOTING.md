# ESP32 LED Hardware Troubleshooting Guide

## 🔍 **LED Connection Verification**

### **Step 1: Check Physical Connections**

#### **Required Components:**
- 3x LEDs (Red, Green, Yellow)
- 3x 220Ω Resistors (or 150Ω - 470Ω range)
- Jumper wires
- Breadboard

#### **Correct Wiring:**
```
ESP32 Pin → Resistor → LED Anode (+) → LED Cathode (-) → GND

GPIO32 → 220Ω → RED LED (+) → RED LED (-) → GND
GPIO25 → 220Ω → GREEN LED (+) → GREEN LED (-) → GND  
GPIO26 → 220Ω → YELLOW LED (+) → YELLOW LED (-) → GND
```

### **Step 2: LED Polarity Check**
LEDs only work in one direction:
- **Anode (+)**: Longer leg, connects to resistor
- **Cathode (-)**: Shorter leg, connects to GND

### **Step 3: Visual Inspection**
✅ Check these connections:
- [ ] ESP32 GPIO pins securely connected
- [ ] Resistors properly inserted
- [ ] LED polarity correct (long leg to resistor)
- [ ] GND connections secure
- [ ] No loose wires on breadboard

## 🧪 **LED Testing Code**

Create a simple test sketch to verify hardware:

```cpp
// LED Test Sketch
#define LED_RED 32
#define LED_GREEN 25
#define LED_YELLOW 26

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  Serial.println("LED Test Starting...");
}

void loop() {
  // Test RED LED
  Serial.println("Testing RED LED...");
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);
  delay(500);
  
  // Test GREEN LED
  Serial.println("Testing GREEN LED...");
  digitalWrite(LED_GREEN, HIGH);
  delay(1000);
  digitalWrite(LED_GREEN, LOW);
  delay(500);
  
  // Test YELLOW LED
  Serial.println("Testing YELLOW LED...");
  digitalWrite(LED_YELLOW, HIGH);
  delay(1000);
  digitalWrite(LED_YELLOW, LOW);
  delay(500);
  
  // Test ALL LEDs
  Serial.println("Testing ALL LEDs...");
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  delay(2000);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  delay(1000);
}
```

## 🔧 **Common Issues & Solutions**

### **Issue 1: No LEDs Light Up**
**Possible Causes:**
- Power supply problem
- All connections loose
- Wrong ESP32 pins

**Solutions:**
1. Check ESP32 power (USB connected, power LED on)
2. Verify 3.3V and GND pins working
3. Test with multimeter: GPIO pins should show 3.3V when HIGH

### **Issue 2: LEDs Very Dim**
**Possible Causes:**
- Resistor value too high
- Poor connections
- Low power supply

**Solutions:**
1. Try smaller resistor (150Ω instead of 220Ω)
2. Check all connection points
3. Ensure USB cable provides adequate power

### **Issue 3: LEDs Too Bright/Hot**
**Possible Causes:**
- No resistor (DANGER!)
- Resistor value too low

**Solutions:**
1. **IMMEDIATELY add resistors** (LEDs will burn out!)
2. Use 220Ω or higher resistors
3. Check resistor color codes

### **Issue 4: Only Some LEDs Work**
**Possible Causes:**
- Individual LED burned out
- Specific pin connections loose
- Wrong GPIO pin numbers

**Solutions:**
1. Swap LEDs to test if LED is faulty
2. Check specific GPIO connections
3. Verify pin numbers in code match wiring

### **Issue 5: LEDs Flicker/Erratic**
**Possible Causes:**
- Loose breadboard connections
- Interference from other components
- Power supply noise

**Solutions:**
1. Press connections firmly into breadboard
2. Use shorter jumper wires
3. Add capacitor across power rails (optional)

## 🔌 **Pin Verification**

### **ESP32 DevKit V1 Pinout:**
```
                    ESP32 DevKit V1
                   ┌─────────────────┐
                   │                 │
               3V3 │●               ●│ GND
               EN  │●               ●│ GPIO23
          GPIO36   │●               ●│ GPIO22
          GPIO39   │●               ●│ GPIO1
          GPIO34   │●               ●│ GPIO3
          GPIO35   │●               ●│ GPIO21
          GPIO32   │●               ●│ GND      ← RED LED
          GPIO33   │●               ●│ GPIO19
          GPIO25   │●               ●│ GPIO18   ← GREEN LED
          GPIO26   │●               ●│ GPIO5    ← YELLOW LED
          GPIO27   │●               ●│ GPIO17
                   │                 │
                   └─────────────────┘
```

### **Verify Your Connections:**
- **GPIO32** (RED LED) - Right side, 7th pin from top
- **GPIO25** (GREEN LED) - Left side, 9th pin from top  
- **GPIO26** (YELLOW LED) - Left side, 10th pin from top
- **GND** - Multiple GND pins available

## 🧰 **Troubleshooting Tools**

### **Multimeter Testing:**
1. **Voltage Test**: GPIO pins should show 3.3V when digitalWrite(pin, HIGH)
2. **Continuity Test**: Check wire connections
3. **Resistance Test**: Verify resistor values (220Ω ± 10%)

### **LED Testing Without ESP32:**
1. Connect LED + resistor directly to 3.3V and GND
2. LED should light up (if wiring correct)
3. If not, check LED polarity or LED is faulty

### **Breadboard Testing:**
1. Try different breadboard rows
2. Ensure breadboard power rails connected
3. Test with known working components

## 🎯 **Quick Hardware Test**

### **Method 1: Upload LED Test Code**
1. Upload the simple LED test sketch above
2. Watch Serial Monitor for test messages
3. Each LED should light for 1 second in sequence

### **Method 2: Manual Testing**
1. Connect each LED directly to 3.3V (with resistor)
2. If LED lights up → LED and resistor OK
3. If not → Check LED polarity or replace LED

### **Method 3: Swap Components**
1. Try different LEDs in same circuit
2. Try different resistors
3. Try different GPIO pins

## 📋 **Hardware Checklist**

Before running main code, verify:
- [ ] All 3 LEDs light up in test code
- [ ] Correct GPIO pins (32, 25, 26)
- [ ] Proper resistor values (220Ω)
- [ ] Secure breadboard connections
- [ ] ESP32 power stable
- [ ] Serial Monitor shows test messages

## 🚨 **Safety Notes**

⚠️ **NEVER connect LEDs without resistors!**
- LEDs will draw too much current
- LEDs will burn out immediately
- May damage ESP32 GPIO pins

✅ **Always use current-limiting resistors:**
- 150Ω - 470Ω range is safe
- 220Ω is recommended value
- Higher resistance = dimmer LED

## 🔄 **If Still Not Working**

### **Try This Minimal Test:**
```cpp
void setup() {
  pinMode(25, OUTPUT);  // Green LED
}

void loop() {
  digitalWrite(25, HIGH);
  delay(500);
  digitalWrite(25, LOW);
  delay(500);
}
```

If this simple blink doesn't work:
1. **Hardware problem** - check connections
2. **Wrong pin** - verify GPIO25 location
3. **Faulty LED** - try different LED
4. **No resistor** - add 220Ω resistor

Once basic blink works, the main SafeEdge code should control LEDs properly! 🚀