/**
 * ESP32 LED Test - Web Interface Synchronization
 * =============================================
 * Simple test to match web interface LED behavior exactly
 * 
 * LED Behavior (matching laptop2_web_complete.py):
 * - RED LED: ON when temperature > 35°C
 * - GREEN LED: ON when temperature <= 35°C  
 * - YELLOW LED: Continuous blink when running
 */

#include <Arduino.h>

// Hardware Pins (Your exact setup with DC-DC converters)
#define LED_RED 32     // GPIO 32 + Resistor + Capacitor + DC-DC
#define LED_GREEN 25   // GPIO 25 + Resistor + Capacitor + DC-DC  
#define LED_YELLOW 26  // GPIO 26 + Resistor + Capacitor + DC-DC

// Test variables
bool systemRunning = true;
bool attackMode = false;
float currentTemp = 25.0;  // Start with normal temperature

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 ESP32 LED Test - Web Interface Sync");
  Serial.println("🏆 Imagine Cup 2026 - LED Behavior Test");
  Serial.println("=" * 50);
  
  // Initialize GPIO pins for DC-DC converter circuits
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Extended LED test for DC-DC converter circuits
  Serial.println("🔄 Testing DC-DC converter LED circuits...");
  
  // Test each LED individually
  Serial.println("Testing RED LED...");
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);
  delay(500);
  
  Serial.println("Testing GREEN LED...");
  digitalWrite(LED_GREEN, HIGH);
  delay(1000);
  digitalWrite(LED_GREEN, LOW);
  delay(500);
  
  Serial.println("Testing YELLOW LED...");
  digitalWrite(LED_YELLOW, HIGH);
  delay(1000);
  digitalWrite(LED_YELLOW, LOW);
  delay(500);
  
  Serial.println("✅ Hardware test complete!");
  Serial.println("\n📱 Starting web interface LED simulation...");
  Serial.println("🌡️  Temperature simulation: 25°C → 40°C → 25°C");
  Serial.println("🔴 RED LED: ON when temp > 35°C");
  Serial.println("🟢 GREEN LED: ON when temp <= 35°C");
  Serial.println("🟡 YELLOW LED: Continuous blink when running");
  Serial.println("=" * 50);
}

void loop() {
  // Simulate temperature changes like web interface
  static unsigned long lastTempChange = 0;
  static int tempPhase = 0;
  
  if (millis() - lastTempChange > 5000) {  // Change every 5 seconds
    lastTempChange = millis();
    tempPhase++;
    
    switch (tempPhase % 4) {
      case 0:
        currentTemp = 25.0;  // Normal
        attackMode = false;
        Serial.println("\n🟢 NORMAL MODE: Temperature = 25.0°C");
        break;
      case 1:
        currentTemp = 30.0;  // Still normal
        attackMode = false;
        Serial.println("\n🟢 NORMAL MODE: Temperature = 30.0°C");
        break;
      case 2:
        currentTemp = 40.0;  // Attack!
        attackMode = true;
        Serial.println("\n🚨 ATTACK MODE: Temperature = 40.0°C");
        break;
      case 3:
        currentTemp = 45.0;  // High attack!
        attackMode = true;
        Serial.println("\n🚨 ATTACK MODE: Temperature = 45.0°C");
        break;
    }
  }
  
  // Update LEDs to match web interface behavior exactly
  updateLEDs();
  
  // Print status every 2 seconds
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 2000) {
    lastStatus = millis();
    printLEDStatus();
  }
  
  delay(100);
}

void updateLEDs() {
  // LED Logic matching laptop2_web_complete.py exactly:
  
  // RED LED: ON when temperature > 35°C (attack condition)
  if (currentTemp > 35.0) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);  // Green OFF during attack
  } else {
    digitalWrite(LED_RED, LOW);
    // GREEN LED: ON when temperature <= 35°C (normal condition)
    digitalWrite(LED_GREEN, HIGH);
  }
  
  // YELLOW LED: Continuous blink when system running (like web interface)
  if (systemRunning) {
    // Blink pattern: 500ms ON, 500ms OFF
    unsigned long currentTime = millis();
    if ((currentTime / 500) % 2 == 0) {
      digitalWrite(LED_YELLOW, HIGH);
    } else {
      digitalWrite(LED_YELLOW, LOW);
    }
  } else {
    digitalWrite(LED_YELLOW, LOW);
  }
}

void printLEDStatus() {
  Serial.printf("🌡️  Temp: %.1f°C | ", currentTemp);
  Serial.printf("🔴 RED: %s | ", (currentTemp > 35.0) ? "ON " : "OFF");
  Serial.printf("🟢 GREEN: %s | ", (currentTemp <= 35.0) ? "ON " : "OFF");
  Serial.printf("🟡 YELLOW: %s\n", systemRunning ? "BLINK" : "OFF");
}