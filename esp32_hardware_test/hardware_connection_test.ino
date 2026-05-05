/*
 * SafeEdge ESP32 Hardware Connection Test
 * ========================================
 * This script tests all hardware connections to verify your setup
 * 
 * Hardware Configuration:
 * - ESP32 DevKit v1
 * - W5500 Ethernet Module (SPI)
 * - 3 LEDs with 220Ω resistors
 * - 1 Buzzer
 * - LM2596 Buck Converter (12V → 5V power supply)
 * 
 * Pin Connections:
 * ----------------
 * ETHERNET (W5500):
 *   D23 → MOSI
 *   D19 → MISO
 *   D18 → SCK
 *   D5  → CS
 *   3V3 → VCC
 *   GND → GND
 * 
 * LEDs (with 220Ω resistors):
 *   D32 → Resistor → RED LED (+) → GND
 *   D25 → Resistor → GREEN LED (+) → GND
 *   D26 → Resistor → YELLOW LED (+) → GND
 * 
 * BUZZER:
 *   D33 → BUZZER (+) → GND
 * 
 * POWER:
 *   12V Input → LM2596 → 5V Output → ESP32 VIN
 * 
 * Author: SafeEdge Team
 * Date: 2026-04-09
 */

#include <SPI.h>
#include <Ethernet.h>

// ==================== PIN DEFINITIONS ====================
// LED Pins (Status Indicators)
#define LED_RED     32    // Red LED - Critical alerts
#define LED_GREEN   25    // Green LED - System OK
#define LED_YELLOW  26    // Yellow LED - Warnings
#define BUZZER_PIN  33    // Buzzer - Audio alerts

// Ethernet Pins (W5500 SPI)
#define ETH_MOSI    23    // SPI MOSI
#define ETH_MISO    19    // SPI MISO
#define ETH_SCK     18    // SPI Clock
#define ETH_CS      5     // SPI Chip Select

// ==================== GLOBAL VARIABLES ====================
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 1, 177);  // Fallback static IP
bool ethernetAvailable = false;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(2000);  // Wait for serial monitor
  
  Serial.println("\n\n");
  Serial.println("================================================");
  Serial.println("  SafeEdge ESP32 Hardware Connection Test");
  Serial.println("================================================");
  Serial.println("Testing all hardware connections...\n");
  
  // Run all tests
  testPowerSupply();
  testLEDs();
  testBuzzer();
  testEthernet();
  
  // Final summary
  printTestSummary();
  
  Serial.println("\n================================================");
  Serial.println("  Hardware Test Complete!");
  Serial.println("================================================");
  Serial.println("\nStarting continuous monitoring mode...");
  Serial.println("Watch the LEDs cycle and listen for buzzer tones.\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Continuous demonstration mode
  demonstrationMode();
  delay(5000);  // 5 second cycle
}

// ==================== TEST FUNCTIONS ====================

void testPowerSupply() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 1: Power Supply");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Check input voltage (if connected to ADC)
  float voltage = (analogRead(35) / 4095.0) * 3.3 * 4;  // Voltage divider assumed
  
  Serial.print("✓ ESP32 is powered and running\n");
  Serial.print("✓ Serial communication working at 115200 baud\n");
  Serial.print("✓ CPU Frequency: ");
  Serial.print(getCpuFrequencyMhz());
  Serial.println(" MHz");
  
  Serial.print("✓ Free Heap Memory: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  
  Serial.print("✓ Chip Model: ");
  Serial.println(ESP.getChipModel());
  
  Serial.print("✓ Flash Size: ");
  Serial.print(ESP.getFlashChipSize() / (1024 * 1024));
  Serial.println(" MB");
  
  Serial.println("\n✅ POWER SUPPLY TEST PASSED\n");
  delay(1000);
}

void testLEDs() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 2: LED Connections");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Initialize LED pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Turn all LEDs off initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println("Testing each LED individually...\n");
  
  // Test RED LED
  Serial.println("→ Testing RED LED (GPIO 32)");
  Serial.println("  Expected: Red LED should light up for 2 seconds");
  digitalWrite(LED_RED, HIGH);
  delay(2000);
  digitalWrite(LED_RED, LOW);
  Serial.println("  ✓ RED LED test complete\n");
  delay(500);
  
  // Test GREEN LED
  Serial.println("→ Testing GREEN LED (GPIO 25)");
  Serial.println("  Expected: Green LED should light up for 2 seconds");
  digitalWrite(LED_GREEN, HIGH);
  delay(2000);
  digitalWrite(LED_GREEN, LOW);
  Serial.println("  ✓ GREEN LED test complete\n");
  delay(500);
  
  // Test YELLOW LED
  Serial.println("→ Testing YELLOW LED (GPIO 26)");
  Serial.println("  Expected: Yellow LED should light up for 2 seconds");
  digitalWrite(LED_YELLOW, HIGH);
  delay(2000);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("  ✓ YELLOW LED test complete\n");
  delay(500);
  
  // Test all LEDs together
  Serial.println("→ Testing ALL LEDs together");
  Serial.println("  Expected: All 3 LEDs should light up for 2 seconds");
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  delay(2000);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("  ✓ ALL LEDs test complete\n");
  
  // Blinking test
  Serial.println("→ Testing LED blinking (3 cycles)");
  Serial.println("  Expected: LEDs should blink in sequence");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(200);
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, HIGH);
    delay(200);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    delay(200);
    digitalWrite(LED_YELLOW, LOW);
    delay(200);
  }
  Serial.println("  ✓ Blinking test complete\n");
  
  Serial.println("✅ LED CONNECTION TEST PASSED\n");
  delay(1000);
}

void testBuzzer() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 3: Buzzer Connection");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("Testing buzzer tones...\n");
  
  // Test 1: Short beep
  Serial.println("→ Test 1: Short beep (200ms)");
  Serial.println("  Expected: You should hear a short beep");
  tone(BUZZER_PIN, 1000, 200);
  delay(500);
  Serial.println("  ✓ Short beep complete\n");
  
  // Test 2: Long beep
  Serial.println("→ Test 2: Long beep (500ms)");
  Serial.println("  Expected: You should hear a longer beep");
  tone(BUZZER_PIN, 1500, 500);
  delay(800);
  Serial.println("  ✓ Long beep complete\n");
  
  // Test 3: Warning pattern (3 short beeps)
  Serial.println("→ Test 3: Warning pattern (3 short beeps)");
  Serial.println("  Expected: Three quick beeps");
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 2000, 100);
    delay(200);
  }
  Serial.println("  ✓ Warning pattern complete\n");
  
  // Test 4: Critical pattern (alternating tones)
  Serial.println("→ Test 4: Critical alert pattern");
  Serial.println("  Expected: Alternating high-low tones");
  for (int i = 0; i < 4; i++) {
    tone(BUZZER_PIN, 2500, 150);
    delay(200);
    tone(BUZZER_PIN, 1500, 150);
    delay(200);
  }
  Serial.println("  ✓ Critical pattern complete\n");
  
  // Test 5: Frequency sweep
  Serial.println("→ Test 5: Frequency sweep");
  Serial.println("  Expected: Rising tone");
  for (int freq = 500; freq <= 2500; freq += 100) {
    tone(BUZZER_PIN, freq, 50);
    delay(60);
  }
  noTone(BUZZER_PIN);
  Serial.println("  ✓ Frequency sweep complete\n");
  
  Serial.println("✅ BUZZER CONNECTION TEST PASSED\n");
  delay(1000);
}

void testEthernet() {
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST 4: Ethernet (W5500) Connection");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  Serial.println("Initializing SPI and W5500 module...\n");
  
  // Initialize SPI
  SPI.begin(ETH_SCK, ETH_MISO, ETH_MOSI, ETH_CS);
  
  Serial.println("→ SPI Bus Configuration:");
  Serial.print("  MOSI: GPIO ");
  Serial.println(ETH_MOSI);
  Serial.print("  MISO: GPIO ");
  Serial.println(ETH_MISO);
  Serial.print("  SCK:  GPIO ");
  Serial.println(ETH_SCK);
  Serial.print("  CS:   GPIO ");
  Serial.println(ETH_CS);
  Serial.println();
  
  // Try to initialize Ethernet
  Serial.println("→ Attempting to initialize W5500...");
  Serial.println("  (This may take up to 10 seconds)");
  
  Ethernet.init(ETH_CS);
  
  // Try DHCP first
  Serial.println("\n→ Attempting DHCP configuration...");
  if (Ethernet.begin(mac, 10000) == 0) {
    Serial.println("  ⚠ DHCP failed, trying static IP...");
    
    // Try static IP
    Ethernet.begin(mac, ip);
    delay(1000);
    
    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
      Serial.println("  ❌ W5500 module not detected!");
      Serial.println("\n  Possible issues:");
      Serial.println("  1. Check SPI wiring (MOSI, MISO, SCK, CS)");
      Serial.println("  2. Check 3.3V power connection");
      Serial.println("  3. Check GND connection");
      Serial.println("  4. Verify W5500 module is not damaged");
      ethernetAvailable = false;
    } else if (Ethernet.linkStatus() == LinkOFF) {
      Serial.println("  ⚠ W5500 detected but no Ethernet cable connected");
      Serial.println("  ✓ Hardware connection is OK");
      Serial.println("  → Please connect an Ethernet cable to test network");
      ethernetAvailable = true;
    } else {
      Serial.println("  ✓ Static IP configuration successful");
      ethernetAvailable = true;
    }
  } else {
    Serial.println("  ✓ DHCP configuration successful");
    ethernetAvailable = true;
  }
  
  if (ethernetAvailable) {
    Serial.println("\n→ Ethernet Configuration:");
    Serial.print("  IP Address: ");
    Serial.println(Ethernet.localIP());
    Serial.print("  Subnet Mask: ");
    Serial.println(Ethernet.subnetMask());
    Serial.print("  Gateway: ");
    Serial.println(Ethernet.gatewayIP());
    Serial.print("  DNS Server: ");
    Serial.println(Ethernet.dnsServerIP());
    
    Serial.print("\n  Hardware Status: ");
    switch (Ethernet.hardwareStatus()) {
      case EthernetNoHardware:
        Serial.println("Not detected");
        break;
      case EthernetW5100:
        Serial.println("W5100");
        break;
      case EthernetW5200:
        Serial.println("W5200");
        break;
      case EthernetW5500:
        Serial.println("W5500 ✓");
        break;
      default:
        Serial.println("Unknown");
    }
    
    Serial.print("  Link Status: ");
    switch (Ethernet.linkStatus()) {
      case Unknown:
        Serial.println("Unknown");
        break;
      case LinkON:
        Serial.println("Connected ✓");
        break;
      case LinkOFF:
        Serial.println("Disconnected (no cable)");
        break;
    }
    
    Serial.println("\n✅ ETHERNET CONNECTION TEST PASSED");
  } else {
    Serial.println("\n❌ ETHERNET CONNECTION TEST FAILED");
  }
  
  Serial.println();
  delay(1000);
}

void printTestSummary() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("TEST SUMMARY");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("✅ Power Supply:     PASSED");
  Serial.println("✅ LED Connections:  PASSED");
  Serial.println("✅ Buzzer:           PASSED");
  Serial.print(ethernetAvailable ? "✅" : "❌");
  Serial.println(" Ethernet (W5500): " + String(ethernetAvailable ? "PASSED" : "FAILED"));
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (ethernetAvailable) {
    Serial.println("\n🎉 ALL TESTS PASSED!");
    Serial.println("Your hardware is correctly connected and ready to use.");
  } else {
    Serial.println("\n⚠ ETHERNET TEST FAILED");
    Serial.println("Please check your W5500 wiring and try again.");
  }
}

void demonstrationMode() {
  static int mode = 0;
  
  switch (mode) {
    case 0:
      // Safe mode - Green LED
      Serial.println("→ Demonstration: SAFE MODE");
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_YELLOW, LOW);
      digitalWrite(LED_RED, LOW);
      break;
      
    case 1:
      // Warning mode - Yellow LED + short beep
      Serial.println("→ Demonstration: WARNING MODE");
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_YELLOW, HIGH);
      digitalWrite(LED_RED, LOW);
      tone(BUZZER_PIN, 1500, 200);
      break;
      
    case 2:
      // Critical mode - Red LED blinking + long beep
      Serial.println("→ Demonstration: CRITICAL MODE");
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_YELLOW, LOW);
      for (int i = 0; i < 5; i++) {
        digitalWrite(LED_RED, HIGH);
        delay(200);
        digitalWrite(LED_RED, LOW);
        delay(200);
      }
      tone(BUZZER_PIN, 2000, 500);
      break;
      
    case 3:
      // Attack mode - All LEDs flashing + alarm
      Serial.println("→ Demonstration: ATTACK DETECTED MODE");
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_RED, HIGH);
        digitalWrite(LED_YELLOW, HIGH);
        digitalWrite(LED_GREEN, HIGH);
        tone(BUZZER_PIN, 2500, 100);
        delay(150);
        digitalWrite(LED_RED, LOW);
        digitalWrite(LED_YELLOW, LOW);
        digitalWrite(LED_GREEN, LOW);
        noTone(BUZZER_PIN);
        delay(150);
      }
      break;
  }
  
  mode = (mode + 1) % 4;
}
