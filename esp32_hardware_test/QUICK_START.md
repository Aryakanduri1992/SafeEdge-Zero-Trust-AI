# Quick Start Guide - ESP32 Hardware Test

## Before You Connect

### Required Items Checklist
- [ ] ESP32 DevKit v1
- [ ] W5500 Ethernet Module
- [ ] 3x LEDs (Red, Green, Yellow)
- [ ] 3x 220Ω Resistors
- [ ] 1x Active Buzzer
- [ ] LM2596 Buck Converter
- [ ] 12V Power Supply
- [ ] Breadboard
- [ ] Jumper wires
- [ ] USB cable for programming
- [ ] Ethernet cable (for network test)

## Connection Steps

### 1. Power Supply First (IMPORTANT!)
```
12V Input → LM2596 → Adjust to 5V → ESP32 VIN + GND
```
⚠️ **Measure LM2596 output with multimeter BEFORE connecting to ESP32!**
⚠️ **Must be 5V, not more!**

### 2. Ethernet Module (W5500)
```
ESP32 D23 → W5500 MOSI
ESP32 D19 → W5500 MISO
ESP32 D18 → W5500 SCK
ESP32 D5  → W5500 CS
ESP32 3V3 → W5500 VCC
ESP32 GND → W5500 GND
```

### 3. LEDs (with 220Ω resistors)
```
ESP32 D32 → [220Ω] → Red LED (+) → GND
ESP32 D25 → [220Ω] → Green LED (+) → GND
ESP32 D26 → [220Ω] → Yellow LED (+) → GND
```
💡 **LED long leg = Anode (+), short leg = Cathode (-)**

### 4. Buzzer
```
ESP32 D33 → Buzzer (+) → GND
```

## Upload Test Firmware

### Arduino IDE Setup
1. Install ESP32 board support:
   - File → Preferences
   - Additional Board URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. Install Ethernet Library:
   - Sketch → Include Library → Manage Libraries
   - Search "Ethernet" → Install "Ethernet by Various"

3. Configure Board:
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
   - Tools → Upload Speed → 115200
   - Tools → Port → (Select your COM port)

### Upload Steps
1. Open `hardware_connection_test.ino`
2. Click "Verify" (✓) to compile
3. Click "Upload" (→) to flash
4. Wait for "Done uploading"

### Open Serial Monitor
1. Tools → Serial Monitor
2. Set baud rate: **115200**
3. Watch the test output

## Expected Test Results

### ✅ Success Indicators
- All 4 tests show "PASSED"
- Each LED lights up when tested
- Buzzer makes different tones
- W5500 shows IP address
- Demo mode cycles through states

### ❌ Failure Indicators
- "FAILED" message in any test
- LEDs don't light up
- No buzzer sound
- "W5500 not detected"
- No IP address assigned

## Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| ESP32 won't upload | Press and hold BOOT button during upload |
| No serial output | Check baud rate is 115200 |
| LED doesn't light | Check polarity (long leg to resistor) |
| All LEDs dim | Check resistor values (should be 220Ω) |
| Buzzer silent | Check polarity, try reversing wires |
| W5500 not detected | Check 3.3V power and SPI wiring |
| No IP address | Connect Ethernet cable to router |

## After Testing

Once all tests pass:
1. ✅ Note down any issues in Serial Monitor
2. ✅ Take a photo of your setup (optional)
3. ✅ Share test results with me
4. ✅ We'll update the main firmware with correct pins

## Safety Reminders

⚠️ **Before powering on:**
- Double-check all connections
- Verify LM2596 output is 5V
- Ensure no short circuits
- Check LED and buzzer polarity

⚠️ **While testing:**
- Don't touch components while powered
- Watch for hot components (LM2596)
- Disconnect power if you smell burning
- Keep liquids away from electronics

## Need Help?

If you encounter issues:
1. Check the detailed troubleshooting in `HARDWARE_CONNECTIONS.md`
2. Take a photo of your wiring
3. Copy the Serial Monitor output
4. Share with me for assistance

---

**Ready to test?** Connect everything, upload the sketch, and let me know the results! 🚀
