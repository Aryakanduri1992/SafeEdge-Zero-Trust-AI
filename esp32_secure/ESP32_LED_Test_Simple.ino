/**
 * ESP32 LED Test - Simple Attack Detection
 * =======================================
 * Simplified code to test LED changes based on received data
 * Focus: Receive data → Detect attack → Change LED
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Ethernet.h>
#include <driver/gpio.h>

// WiFi Configuration
const char* WIFI_SSID = "Mohitpas";
const char* WIFI_PASSWORD = "12345678";

// Ethernet Configuration
#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)

// Hardware Pins
#define LED_RED 32     // GPIO 32 - RED LED
#define LED_GREEN 25   // GPIO 25 - GREEN LED
#define LED_YELLOW 26  // GPIO 26 - YELLOW LED

#define ETH_CS 5

// Global Variables
EthernetServer ethServer(80);
bool attackDetected = false;
unsigned long dataCount = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🔴 ESP32 LED Test - Simple Attack Detection");
  Serial.println("🎯 Focus: Data Reception → Attack Detection → LED Control");
  Serial.println("============================================================");
  
  // Initialize LEDs
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Special GPIO 32 setup (modern ESP32 Arduino Core)
  esp_rom_gpio_pad_select_gpio(GPIO_NUM_32);
  gpio_set_direction(GPIO_NUM_32, GPIO_MODE_OUTPUT);
  
  // Initial LED state
  setLEDState(false);  // Start with normal mode
  
  // Connect WiFi
  Serial.println("📡 Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected: " + WiFi.localIP().toString());
  
  // Connect Ethernet
  Serial.println("📡 Connecting Ethernet...");
  Ethernet.init(ETH_CS);
  byte mac[6];
  WiFi.macAddress(mac);
  Ethernet.begin(mac, ETH_STATIC_IP);
  delay(3000);
  
  if (Ethernet.linkStatus() == LinkON) {
    Serial.println("✅ Ethernet connected: " + Ethernet.localIP().toString());
    ethServer.begin();
    Serial.println("✅ HTTP Server started on port 80");
  } else {
    Serial.println("❌ Ethernet failed");
  }
  
  Serial.println("============================================================");
  Serial.println("📊 Ready to receive data and change LEDs");
  Serial.println("🔴 Send attack data → RED LED ON");
  Serial.println("🟢 Send normal data → GREEN LED ON");
  Serial.println("============================================================");
}

void loop() {
  // Handle incoming data
  EthernetClient client = ethServer.available();
  
  if (client) {
    dataCount++;
    Serial.printf("\n📥 Data packet #%lu received\n", dataCount);
    
    String requestData = "";
    
    // Read the entire request
    while (client.connected()) {
      if (client.available()) {
        String line = client.readStringUntil('\n');
        requestData += line + "\n";
        
        // If we hit the end of headers, read the body
        if (line == "\r") {
          if (client.available()) {
            String body = client.readString();
            requestData += body;
          }
          break;
        }
      }
    }
    
    Serial.println("📊 Raw data received:");
    Serial.println(requestData.substring(0, 300) + "...");
    
    // Simple attack detection
    bool isAttack = detectAttack(requestData);
    
    // Update LED state if changed
    if (isAttack != attackDetected) {
      attackDetected = isAttack;
      setLEDState(attackDetected);
      
      if (attackDetected) {
        Serial.println("🚨 ATTACK MODE ACTIVATED - RED LED ON!");
      } else {
        Serial.println("✅ NORMAL MODE ACTIVATED - GREEN LED ON!");
      }
    } else {
      Serial.printf("🔄 Mode unchanged: %s\n", attackDetected ? "ATTACK" : "NORMAL");
    }
    
    // Send response
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();
    client.println("{\"success\":true,\"attack_detected\":" + String(attackDetected ? "true" : "false") + "}");
    
    client.stop();
    
    // Print current status
    printStatus();
  }
  
  delay(10);
}

bool detectAttack(String data) {
  Serial.println("🔍 Attack Detection Analysis:");
  
  // Method 1: Look for explicit attack indicators
  if (data.indexOf("\"attack_detected\":true") >= 0) {
    Serial.println("   ✅ Found: attack_detected:true");
    return true;
  }
  
  if (data.indexOf("\"data_mode\":\"attack\"") >= 0) {
    Serial.println("   ✅ Found: data_mode:attack");
    return true;
  }
  
  // Method 2: Check temperature
  if (data.indexOf("\"temperature\":") >= 0) {
    int tempStart = data.indexOf("\"temperature\":") + 14;
    int tempEnd = data.indexOf(",", tempStart);
    if (tempEnd == -1) tempEnd = data.indexOf("}", tempStart);
    
    String tempStr = data.substring(tempStart, tempEnd);
    tempStr.trim();
    float temp = tempStr.toFloat();
    
    Serial.printf("   Temperature: %.1f°C\n", temp);
    if (temp > 35.0) {
      Serial.println("   ✅ Temperature > 35°C → ATTACK");
      return true;
    }
  }
  
  // Method 3: Check threat level
  if (data.indexOf("\"threat_level\":\"critical\"") >= 0) {
    Serial.println("   ✅ Found: threat_level:critical");
    return true;
  }
  
  // Method 4: Check security score
  if (data.indexOf("\"security_score\":") >= 0) {
    int scoreStart = data.indexOf("\"security_score\":") + 17;
    int scoreEnd = data.indexOf(",", scoreStart);
    if (scoreEnd == -1) scoreEnd = data.indexOf("}", scoreStart);
    
    String scoreStr = data.substring(scoreStart, scoreEnd);
    scoreStr.trim();
    int score = scoreStr.toInt();
    
    Serial.printf("   Security Score: %d\n", score);
    if (score > 0 && score < 50) {
      Serial.println("   ✅ Security Score < 50 → ATTACK");
      return true;
    }
  }
  
  Serial.println("   ❌ No attack conditions found → NORMAL");
  return false;
}

void setLEDState(bool attack) {
  if (attack) {
    // ATTACK MODE: RED ON, GREEN OFF
    Serial.println("🔴 Setting RED LED ON (GPIO 32)");
    digitalWrite(LED_RED, HIGH);
    gpio_set_level(GPIO_NUM_32, 1);
    
    Serial.println("🟢 Setting GREEN LED OFF (GPIO 25)");
    digitalWrite(LED_GREEN, LOW);
  } else {
    // NORMAL MODE: GREEN ON, RED OFF
    Serial.println("🟢 Setting GREEN LED ON (GPIO 25)");
    digitalWrite(LED_GREEN, HIGH);
    
    Serial.println("🔴 Setting RED LED OFF (GPIO 32)");
    digitalWrite(LED_RED, LOW);
    gpio_set_level(GPIO_NUM_32, 0);
  }
  
  // YELLOW LED: Always blinking when system active
  static unsigned long lastBlink = 0;
  static bool yellowState = false;
  
  if (millis() - lastBlink > 500) {
    yellowState = !yellowState;
    digitalWrite(LED_YELLOW, yellowState ? HIGH : LOW);
    lastBlink = millis();
  }
}

void printStatus() {
  Serial.println("------------------------------------------------------------");
  Serial.printf("📊 Current Status (Data packets: %lu)\n", dataCount);
  Serial.printf("🔴 RED LED (GPIO 32):   %s\n", attackDetected ? "ON" : "OFF");
  Serial.printf("🟢 GREEN LED (GPIO 25): %s\n", !attackDetected ? "ON" : "OFF");
  Serial.printf("🟡 YELLOW LED (GPIO 26): BLINKING\n");
  Serial.printf("⚠️  Attack Mode:        %s\n", attackDetected ? "ACTIVE" : "INACTIVE");
  Serial.println("------------------------------------------------------------");
}