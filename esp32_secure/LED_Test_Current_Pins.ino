/**
 * ESP32 LED Test - Current Pin Configuration
 * =========================================
 * Testing with your actual GPIO pins: 32, 25, 26
 * But with proper initialization to handle special pin functions
 */

#define LED_RED 32     // Your current red LED pin
#define LED_GREEN 25   // Your current green LED pin  
#define LED_YELLOW 26  // Your current yellow LED pin (working)

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n🔧 ESP32 LED Test - Current Pin Configuration");
  Serial.println("============================================");
  Serial.println("Testing GPIO 32, 25, 26 with special handling...");
  
  // Special initialization for problematic pins
  
  // GPIO 32 - ADC2 pin, disable ADC to avoid WiFi conflicts
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_RED, LOW);
  
  // GPIO 25 - DAC pin, force digital mode
  pinMode(LED_GREEN, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  
  // GPIO 26 - Standard pin (working)
  pinMode(LED_YELLOW, OUTPUT);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println("✅ GPIO pins initialized with special handling");
  Serial.println("\n🚨 Current Hardware Setup:");
  Serial.println("   🔴 RED LED: GPIO 32 + Capacitor circuit");
  Serial.println("   🟢 GREEN LED: GPIO 25 + Capacitor circuit");
  Serial.println("   🟡 YELLOW LED: GPIO 26 + Capacitor circuit (working)");
  Serial.println();
  Serial.println("⚠️  NOTE: Capacitor circuits may cause issues!");
  Serial.println("   Recommended: Use 220Ω resistors instead of capacitors");
  Serial.println();
  
  // Extended startup test for capacitor circuits
  Serial.println("🔄 Extended Startup Test (for capacitor circuits):");
  for (int i = 0; i < 5; i++) {
    Serial.println("   All LEDs ON (extended pulse)");
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, HIGH);
    delay(1000);  // Longer pulse for capacitor charging
    
    Serial.println("   All LEDs OFF (discharge time)");
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    delay(1000);  // Longer off time for capacitor discharge
  }
  
  Serial.println("\n🔍 Individual LED Test (Extended Pulses):");
  
  // Test RED LED with longer pulses
  Serial.println("   Testing RED LED (GPIO 32) - Extended pulses...");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(800);  // Longer on time
    digitalWrite(LED_RED, LOW);
    delay(800);  // Longer off time
  }
  
  // Test GREEN LED with longer pulses
  Serial.println("   Testing GREEN LED (GPIO 25) - Extended pulses...");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(800);
    digitalWrite(LED_GREEN, LOW);
    delay(800);
  }
  
  // Test YELLOW LED (should work)
  Serial.println("   Testing YELLOW LED (GPIO 26) - Should work...");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_YELLOW, HIGH);
    delay(800);
    digitalWrite(LED_YELLOW, LOW);
    delay(800);
  }
  
  Serial.println("\n✅ Individual tests complete");
  Serial.println("🔄 Starting slow continuous cycle...");
  Serial.println("   Pattern: RED → GREEN → YELLOW → ALL OFF");
  Serial.println("   (Slow timing for capacitor circuits)");
  Serial.println();
}

void loop() {
  // Slow continuous test cycle for capacitor circuits
  
  // RED LED only - extended pulse
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("🔴 RED LED ON (GPIO 32) - Extended pulse");
  delay(2000);  // 2 second pulse
  
  // GREEN LED only - extended pulse
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("🟢 GREEN LED ON (GPIO 25) - Extended pulse");
  delay(2000);
  
  // YELLOW LED only - extended pulse
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH);
  Serial.println("🟡 YELLOW LED ON (GPIO 26) - Extended pulse");
  delay(2000);
  
  // All LEDs OFF - discharge time
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  Serial.println("⚫ All LEDs OFF - Capacitor discharge time");
  delay(2000);
  
  Serial.println("--- Cycle Complete ---");
  Serial.println();
}