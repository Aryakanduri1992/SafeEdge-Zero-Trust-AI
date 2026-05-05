/**
 * RED LED Debug Test - ESP32
 * ==========================
 * Simple test to debug RED LED hardware issues
 * Tests GPIO 32 specifically
 */

#include <Arduino.h>

// Hardware Pins
#define LED_RED 32     // GPIO 32 - RED LED (Problem pin)
#define LED_GREEN 25   // GPIO 25 - GREEN LED (Working)
#define LED_YELLOW 26  // GPIO 26 - YELLOW LED (Working)

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🔴 RED LED Debug Test");
  Serial.println("🏆 Imagine Cup 2026 - Hardware Troubleshooting");
  Serial.println("=" * 50);
  
  // Initialize pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println("🔧 Testing GPIO pins individually...");
  Serial.println();
}

void loop() {
  // Test 1: RED LED only
  Serial.println("🔴 Test 1: RED LED Only (GPIO 32)");
  Serial.println("   Expected: Only RED LED should be ON");
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  delay(3000);
  
  // Test 2: GREEN LED only (for comparison)
  Serial.println("🟢 Test 2: GREEN LED Only (GPIO 25)");
  Serial.println("   Expected: Only GREEN LED should be ON");
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  delay(3000);
  
  // Test 3: YELLOW LED only (for comparison)
  Serial.println("🟡 Test 3: YELLOW LED Only (GPIO 26)");
  Serial.println("   Expected: Only YELLOW LED should be ON");
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);
  delay(3000);
  
  // Test 4: All LEDs
  Serial.println("💡 Test 4: All LEDs ON");
  Serial.println("   Expected: RED, GREEN, YELLOW all ON");
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  delay(3000);
  
  // Test 5: RED LED rapid blink
  Serial.println("🔴 Test 5: RED LED Rapid Blink");
  Serial.println("   Expected: RED LED should blink rapidly");
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(200);
    digitalWrite(LED_RED, LOW);
    delay(200);
    Serial.print(".");
  }
  Serial.println();
  
  // Test 6: GPIO 32 voltage test
  Serial.println("⚡ Test 6: GPIO 32 Voltage Test");
  Serial.println("   Use multimeter to measure GPIO 32 voltage:");
  
  Serial.println("   Setting GPIO 32 HIGH (should be 3.3V)...");
  digitalWrite(LED_RED, HIGH);
  delay(5000);
  
  Serial.println("   Setting GPIO 32 LOW (should be 0V)...");
  digitalWrite(LED_RED, LOW);
  delay(2000);
  
  // All off
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println();
  Serial.println("🔄 Test cycle complete. Repeating in 3 seconds...");
  Serial.println("=" * 50);
  delay(3000);
}