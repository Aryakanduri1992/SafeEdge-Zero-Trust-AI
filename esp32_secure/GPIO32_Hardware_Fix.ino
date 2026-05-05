/**
 * GPIO 32 Hardware Fix - Definitive RED LED Test
 * =============================================
 * This code will definitively test and fix GPIO 32 RED LED issues
 * Tests multiple methods to control GPIO 32
 */

#include <Arduino.h>
#include <driver/gpio.h>

// Hardware Pins
#define LED_RED 32     // GPIO 32 - Problem pin
#define LED_GREEN 25   // GPIO 25 - Working pin (for comparison)
#define LED_YELLOW 26  // GPIO 26 - Working pin (for comparison)

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🔴 GPIO 32 Hardware Fix - Definitive Test");
  Serial.println("🏆 Imagine Cup 2026 - RED LED Troubleshooting");
  Serial.println("=" * 60);
  
  // Test 1: Standard Arduino pinMode
  Serial.println("🧪 Test 1: Standard Arduino pinMode");
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  Serial.println("   Setting all LEDs LOW...");
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  delay(2000);
  
  Serial.println("   Testing GREEN LED (GPIO 25) - Should work...");
  digitalWrite(LED_GREEN, HIGH);
  delay(2000);
  digitalWrite(LED_GREEN, LOW);
  
  Serial.println("   Testing YELLOW LED (GPIO 26) - Should work...");
  digitalWrite(LED_YELLOW, HIGH);
  delay(2000);
  digitalWrite(LED_YELLOW, LOW);
  
  Serial.println("   Testing RED LED (GPIO 32) - May not work...");
  digitalWrite(LED_RED, HIGH);
  delay(3000);  // Longer delay to see if it works
  digitalWrite(LED_RED, LOW);
  
  delay(2000);
  
  // Test 2: Direct GPIO register access
  Serial.println("\n🧪 Test 2: Direct GPIO Register Access");
  
  // Configure GPIO 32 using direct register access
  gpio_pad_select_gpio(GPIO_NUM_32);
  gpio_set_direction(GPIO_NUM_32, GPIO_MODE_OUTPUT);
  
  Serial.println("   GPIO 32 configured with direct register access");
  Serial.println("   Setting GPIO 32 HIGH...");
  gpio_set_level(GPIO_NUM_32, 1);
  delay(3000);
  
  Serial.println("   Setting GPIO 32 LOW...");
  gpio_set_level(GPIO_NUM_32, 0);
  delay(2000);
  
  // Test 3: Force GPIO 32 with multiple methods
  Serial.println("\n🧪 Test 3: Force GPIO 32 Multiple Methods");
  
  // Method A: ESP-IDF style
  Serial.println("   Method A: ESP-IDF gpio_set_level");
  gpio_set_level(GPIO_NUM_32, 1);
  delay(2000);
  gpio_set_level(GPIO_NUM_32, 0);
  delay(1000);
  
  // Method B: Arduino style
  Serial.println("   Method B: Arduino digitalWrite");
  digitalWrite(LED_RED, HIGH);
  delay(2000);
  digitalWrite(LED_RED, LOW);
  delay(1000);
  
  // Method C: Direct register manipulation
  Serial.println("   Method C: Direct register write");
  GPIO.out_w1ts = (1 << GPIO_NUM_32);  // Set bit
  delay(2000);
  GPIO.out_w1tc = (1 << GPIO_NUM_32);  // Clear bit
  delay(1000);
  
  // Test 4: Voltage measurement instructions
  Serial.println("\n📏 Test 4: Voltage Measurement Guide");
  Serial.println("   Use multimeter to measure voltage on GPIO 32:");
  Serial.println("   1. Set multimeter to DC voltage");
  Serial.println("   2. Connect black probe to ESP32 GND");
  Serial.println("   3. Connect red probe to GPIO 32 pin");
  
  for (int i = 0; i < 5; i++) {
    Serial.printf("   Setting GPIO 32 HIGH - Should read 3.3V (Test %d/5)\n", i+1);
    gpio_set_level(GPIO_NUM_32, 1);
    digitalWrite(LED_RED, HIGH);
    GPIO.out_w1ts = (1 << GPIO_NUM_32);
    delay(3000);
    
    Serial.printf("   Setting GPIO 32 LOW - Should read 0V (Test %d/5)\n", i+1);
    gpio_set_level(GPIO_NUM_32, 0);
    digitalWrite(LED_RED, LOW);
    GPIO.out_w1tc = (1 << GPIO_NUM_32);
    delay(2000);
  }
  
  Serial.println("\n" + String("=") * 60);
  Serial.println("📋 GPIO 32 Test Results:");
  Serial.println(String("=") * 60);
  Serial.println("If RED LED never turned ON in any test:");
  Serial.println("   🔧 HARDWARE ISSUE - GPIO 32 problem");
  Serial.println("   📍 Solution: Use different GPIO pin");
  Serial.println();
  Serial.println("If RED LED worked in some tests:");
  Serial.println("   ✅ HARDWARE OK - Software issue");
  Serial.println("   🔧 Solution: Use working method in main code");
  Serial.println();
  Serial.println("If multimeter shows 3.3V but LED doesn't light:");
  Serial.println("   🔌 LED WIRING ISSUE");
  Serial.println("   🔄 Check: LED polarity, resistor, connections");
  Serial.println(String("=") * 60);
}

void loop() {
  // Continuous test - cycle through all methods
  static unsigned long lastTest = 0;
  static int testMethod = 0;
  
  if (millis() - lastTest > 5000) {  // Every 5 seconds
    lastTest = millis();
    testMethod = (testMethod + 1) % 4;
    
    switch (testMethod) {
      case 0:
        Serial.println("🔄 Continuous Test: Arduino digitalWrite");
        digitalWrite(LED_RED, HIGH);
        break;
      case 1:
        Serial.println("🔄 Continuous Test: ESP-IDF gpio_set_level");
        gpio_set_level(GPIO_NUM_32, 1);
        break;
      case 2:
        Serial.println("🔄 Continuous Test: Direct register");
        GPIO.out_w1ts = (1 << GPIO_NUM_32);
        break;
      case 3:
        Serial.println("🔄 Continuous Test: All methods OFF");
        digitalWrite(LED_RED, LOW);
        gpio_set_level(GPIO_NUM_32, 0);
        GPIO.out_w1tc = (1 << GPIO_NUM_32);
        break;
    }
  }
  
  delay(100);
}