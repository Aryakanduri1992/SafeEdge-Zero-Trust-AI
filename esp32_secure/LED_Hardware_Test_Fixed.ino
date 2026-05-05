/**
 * ESP32 LED Hardware Test - FIXED VERSION
 * ======================================
 * Using different GPIO pins that are more reliable for LED control
 * 
 * CHANGED PINS:
 * - RED LED: GPIO 2 (built-in LED pin, very reliable)
 * - GREEN LED: GPIO 4 (standard GPIO, no special functions)  
 * - YELLOW LED: GPIO 26 (working, keep same)
 * 
 * Why GPIO 32 and 25 might not work:
 * - GPIO 32: ADC2 channel, conflicts with WiFi
 * - GPIO 25: DAC channel, might have voltage issues
 */

#define LED_RED 2      // Changed from 32 to 2 (built-in LED)
#define LED_GREEN 4    // Changed from 25 to 4 (reliable GPIO)
#define LED_YELLOW 26  // Keep same (working)

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🔧 ESP32 LED Hardware Test - FIXED VERSION");
  Serial.println("==========================================");
  Serial.println("Using more reliable GPIO pins...");
  
  // Initialize LED pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Turn all LEDs OFF initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println("✅ GPIO pins initialized");
  Serial.println("\n🚨 NEW LED Connections:");
  Serial.println("   🔴 RED LED: GPIO 2 + 220Ω resistor → GND");
  Serial.println("   🟢 GREEN LED: GPIO 4 + 220Ω resistor → GND");
  Serial.println("   🟡 YELLOW LED: GPIO 26 + 220Ω resistor → GND (same)");
  Serial.println();
  Serial.println("📝 NOTE: Move RED LED from GPIO 32 to GPIO 2");
  Serial.println("📝 NOTE: Move GREEN LED from GPIO 25 to GPIO 4");
  Serial.println();
  
  // Startup test - all LEDs blink together
  Serial.println("🔄 Startup Test: All LEDs blink together");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, HIGH);
    Serial.println("   All LEDs ON");
    delay(500);
    
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    Serial.println("   All LEDs OFF");
    delay(500);
  }
  
  Serial.println("\n🔍 Individual LED Test:");
  
  // Test RED LED
  Serial.println("   Testing RED LED (GPIO 2)...");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(300);
    digitalWrite(LED_RED, LOW);
    delay(300);
  }
  
  // Test GREEN LED
  Serial.println("   Testing GREEN LED (GPIO 4)...");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(300);
    digitalWrite(LED_GREEN, LOW);
    delay(300);
  }
  
  // Test YELLOW LED
  Serial.println("   Testing YELLOW LED (GPIO 26)...");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_YELLOW, HIGH);
    delay(300);
    digitalWrite(LED_YELLOW, LOW);
    delay(300);
  }
  
  Serial.println("\n✅ Individual tests complete");
  Serial.println("🔄 Starting continuous cycle...");
  Serial.println("   Pattern: RED → GREEN → YELLOW → ALL OFF");
  Serial.println();
}

void loop() {
  // Continuous test cycle
  
  // RED LED only
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("🔴 RED LED ON (GPIO 2)");
  delay(1000);
  
  // GREEN LED only
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("🟢 GREEN LED ON (GPIO 4)");
  delay(1000);
  
  // YELLOW LED only
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);
  Serial.println("🟡 YELLOW LED ON (GPIO 26)");
  delay(1000);
  
  // All LEDs OFF
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("⚫ All LEDs OFF");
  delay(1000);
  
  Serial.println("---");
}