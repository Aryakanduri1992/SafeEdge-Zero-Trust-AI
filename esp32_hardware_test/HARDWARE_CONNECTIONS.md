# ESP32 Hardware Connection Guide

## Hardware Components

1. **ESP32 DevKit v1** - Main microcontroller
2. **W5500 Ethernet Module** - Network connectivity
3. **3x LEDs** (Red, Green, Yellow) - Status indicators
4. **3x 220Ω Resistors** - Current limiting for LEDs
5. **1x Active Buzzer** - Audio alerts
6. **LM2596 DC-DC Buck Converter** - Power supply (12V → 5V)
7. **Breadboard and jumper wires**

## Pin Configuration

### Ethernet Module (W5500) - SPI Connection

| ESP32 Pin | W5500 Pin | Function |
|-----------|-----------|----------|
| D23       | MOSI      | SPI Data Out |
| D19       | MISO      | SPI Data In |
| D18       | SCK       | SPI Clock |
| D5        | CS        | Chip Select |
| 3V3       | VCC       | Power (3.3V) |
| GND       | GND       | Ground |

### LED Connections (with 220Ω resistors)

#### Red LED (Critical Alerts)
```
ESP32 GPIO 32 → 220Ω Resistor → LED Anode (+) → LED Cathode (-) → GND
```

#### Green LED (System OK)
```
ESP32 GPIO 25 → 220Ω Resistor → LED Anode (+) → LED Cathode (-) → GND
```

#### Yellow LED (Warnings)
```
ESP32 GPIO 26 → 220Ω Resistor → LED Anode (+) → LED Cathode (-) → GND
```

### Buzzer Connection

```
ESP32 GPIO 33 → Buzzer (+) → Buzzer (-) → GND
```

### Power Supply

```
12V DC Input → LM2596 Buck Converter → 5V Output → ESP32 VIN Pin
                                                  → GND → ESP32 GND
```

## Complete Wiring Diagram (Text Format)

```
                    ┌─────────────────────────────────┐
                    │      ESP32 DevKit v1            │
                    │                                 │
    ┌───────────────┤ D23 (MOSI)                      │
    │   ┌───────────┤ D19 (MISO)                      │
    │   │   ┌───────┤ D18 (SCK)                       │
    │   │   │   ┌───┤ D5  (CS)                        │
    │   │   │   │   │                                 │
    │   │   │   │   ├─────────────┐ D32               │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ D25               │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ D26               │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ D33               │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ 3V3               │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ VIN (5V)          │
    │   │   │   │   │             │                   │
    │   │   │   │   ├─────────────┤ GND               │
    │   │   │   │   └─────────────────────────────────┘
    │   │   │   │                 │
    │   │   │   │                 │
    ▼   ▼   ▼   ▼                 ▼
┌───────────────────┐         ┌────────┐
│   W5500 Module    │         │  LEDs  │
│                   │         │        │
│ MOSI  MISO  SCK  CS         │  D32 → [220Ω] → RED LED → GND
│                   │         │  D25 → [220Ω] → GREEN LED → GND
│ VCC (3.3V)        │         │  D26 → [220Ω] → YELLOW LED → GND
│ GND               │         │
└───────────────────┘         │  D33 → BUZZER → GND
                              └────────┘

┌──────────────────┐
│  Power Supply    │
│                  │
│  12V DC Input    │
│      ↓           │
│  LM2596 Buck     │
│  Converter       │
│      ↓           │
│  5V Output       │
│      ↓           │
│  ESP32 VIN       │
└──────────────────┘
```

## LED Indicator Meanings

| LED Color | State | Meaning |
|-----------|-------|---------|
| Green | Solid | System safe, no threats |
| Yellow | Solid | Warning level threat |
| Yellow | Blinking | Anomaly detected |
| Red | Blinking | Critical threat |
| All | Flashing | Active attack detected |

## Buzzer Alert Patterns

| Pattern | Duration | Meaning |
|---------|----------|---------|
| Short beep | 100ms | Warning alert |
| Long beep | 500ms | Critical alert |
| 3 short beeps | 100ms each | Attack warning |
| Continuous | Until stopped | Active attack blocking |
| Rising tone | 2 seconds | System startup |

## Testing Your Hardware

### Step 1: Upload Test Firmware
1. Open `hardware_connection_test.ino` in Arduino IDE
2. Select board: "ESP32 Dev Module"
3. Select correct COM port
4. Upload the sketch

### Step 2: Open Serial Monitor
1. Set baud rate to 115200
2. Watch the test sequence

### Step 3: Verify Each Component

#### Power Supply Test
- ESP32 should boot and show system information
- Check voltage readings

#### LED Test
- Each LED should light up individually for 2 seconds
- All LEDs should light up together
- LEDs should blink in sequence

#### Buzzer Test
- Short beep (200ms)
- Long beep (500ms)
- Warning pattern (3 beeps)
- Critical pattern (alternating tones)
- Frequency sweep (rising tone)

#### Ethernet Test
- W5500 module should be detected
- IP address should be assigned (DHCP or static)
- Link status should show cable connection

### Step 4: Continuous Monitoring
After tests complete, the system enters demonstration mode:
- Cycles through: Safe → Warning → Critical → Attack
- Each mode shows appropriate LED and buzzer patterns
- Repeats every 20 seconds

## Troubleshooting

### LEDs Not Working
- ✓ Check GPIO pin numbers (D32, D25, D26)
- ✓ Verify 220Ω resistors are in series
- ✓ Check LED polarity (long leg = anode/+)
- ✓ Ensure common ground connection
- ✓ Test LED with multimeter

### Buzzer Not Working
- ✓ Check GPIO 33 connection
- ✓ Verify buzzer polarity (+ to GPIO, - to GND)
- ✓ Test with simple digitalWrite HIGH/LOW
- ✓ Try different buzzer if available

### Ethernet Not Detected
- ✓ Verify SPI pin connections (D23, D19, D18, D5)
- ✓ Check 3.3V power to W5500
- ✓ Ensure GND is connected
- ✓ Try different CS pin if needed
- ✓ Check W5500 module with multimeter

### Power Issues
- ✓ Verify LM2596 output is 5V (measure with multimeter)
- ✓ Check input voltage is 12V
- ✓ Ensure adequate current capacity (>500mA)
- ✓ Check all GND connections are common

## Safety Notes

⚠️ **IMPORTANT SAFETY WARNINGS:**

1. **Voltage Levels**
   - ESP32 GPIO pins are 3.3V tolerant
   - W5500 requires 3.3V power
   - Never connect 5V directly to GPIO pins
   - Use level shifters if needed

2. **Current Limits**
   - Each GPIO can source/sink max 40mA
   - LEDs with 220Ω resistors draw ~10mA (safe)
   - Total GPIO current should not exceed 200mA

3. **Power Supply**
   - LM2596 can get hot under load
   - Ensure adequate ventilation
   - Use heatsink if available
   - Check output voltage before connecting ESP32

4. **Electrostatic Discharge (ESD)**
   - ESP32 is sensitive to static electricity
   - Touch grounded metal before handling
   - Use ESD wrist strap if available

5. **Polarity**
   - Double-check LED polarity before powering on
   - Verify buzzer polarity
   - Confirm power supply polarity

## Next Steps

After verifying all connections work correctly:

1. ✅ Update firmware pin definitions to match your hardware
2. ✅ Update design.md with actual hardware configuration
3. ✅ Remove sensor references from code
4. ✅ Test with actual SafeEdge firmware
5. ✅ Connect to Firebase and web platform

## Pin Summary Table

| Component | ESP32 Pin | Notes |
|-----------|-----------|-------|
| Red LED | GPIO 32 | Via 220Ω resistor |
| Green LED | GPIO 25 | Via 220Ω resistor |
| Yellow LED | GPIO 26 | Via 220Ω resistor |
| Buzzer | GPIO 33 | Active buzzer |
| Ethernet MOSI | GPIO 23 | SPI |
| Ethernet MISO | GPIO 19 | SPI |
| Ethernet SCK | GPIO 18 | SPI |
| Ethernet CS | GPIO 5 | SPI |
| Ethernet VCC | 3.3V | Power |
| Power Input | VIN | 5V from LM2596 |
| Common Ground | GND | All components |

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-09  
**Hardware Verified**: Pending your test
