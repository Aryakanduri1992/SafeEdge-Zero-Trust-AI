/**
 * SafeEdge ESP32 - Debug Attack Detection
 * =====================================
 * Debug version to see exactly what data is received and fix attack detection
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Ethernet.h>

// ==================== CONFIGURATION ====================

const char* WIFI_SSID = "Mohitpas";
const char* WIFI_PASSWORD = "12345678";

#define BACKEND_API_URL "http://10.192.71.133:8000"
#define BACKEND_SENSOR_ENDPOINT "/api/sensor-data"

#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)

// Hardware Pins
#define LED_RED 32     // GPIO 32 - RED LED
#define LED_GREEN 25   // GPIO 25 - GREEN LED
#define LED_YELLOW 26  // GPIO 26 - YELLOW LED
#define BUZZER 33      // GPIO 33 - BUZZER

#define ETH_CS 5

// ==================== GLOBAL VARIABLES ====================

WebServer server(80);
EthernetServer ethServer(80);

bool wifiConnected = false;
bool ethernetConnected = false;
bool systemReady = false;
bool attackDetected = false;

// Statistics
unsigned long totalDataReceived = 0;
unsigned long totalDataForwarded = 0;
unsigned long lastStatsUpdate = 0;

String macAddress = "";
String deviceId = "esp32_debug_attack";

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 SafeEdge ESP32 - Debug Attack Detection");
  Serial.println("🔍 Debug version to analyze received data and fix attack detection");
  Serial.println("============================================================");
  
  initHardware();
  
  macAddress = getMACAddress();
  Serial.printf("📱 Gateway MAC: %s\n", macAddress.c_str());
  
  connectWiFi();
  connectEthernet();
  
  if (ethernetConnected) {
    setupHTTPServer();
    ethServer.begin();
    Serial.println("✅ Ethernet HTTP Server started");
  }
  
  systemReady = wifiConnected && ethernetConnected;
  
  if (systemReady) {
    Serial.println("🎉 System Ready - Debug mode active!");
    setLEDState(false);  // Start in normal mode
  }
  
  Serial.println("============================================================");
  Serial.println("🔍 DEBUG MODE: Will show complete data received from web interface");
  Serial.println("📊 Send attack mode from web interface to see the data structure");
  Serial.println("============================================================");
}

// ==================== MAIN LOOP ====================

void loop() {
  if (ethernetConnected) {
    handleEthernetClient();
  }
  
  server.handleClient();
  updateLEDs();
  
  if (millis() - lastStatsUpdate > 30000) {
    printSystemStatus();
    lastStatsUpdate = millis();
  }
  
  delay(10);
}

// ==================== HARDWARE INITIALIZATION ====================

void initHardware() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(BUZZER, LOW);
  
  Serial.println("✅ Hardware initialized");
}

// ==================== WIFI & ETHERNET ====================

void connectWiFi() {
  Serial.println("📡 Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi failed");
  }
}

void connectEthernet() {
  Serial.println("📡 Connecting Ethernet...");
  Ethernet.init(ETH_CS);
  
  byte mac[6];
  WiFi.macAddress(mac);
  Ethernet.begin(mac, ETH_STATIC_IP);
  delay(3000);
  
  if (Ethernet.linkStatus() == LinkON) {
    ethernetConnected = true;
    Serial.println("✅ Ethernet connected: " + Ethernet.localIP().toString());
  } else {
    Serial.println("❌ Ethernet failed");
  }
}

// ==================== HTTP SERVER ====================

void setupHTTPServer() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.enableCORS(true);
  server.begin();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>SafeEdge Debug</title></head><body>";
  html += "<h1>SafeEdge ESP32 - Debug Attack Detection</h1>";
  html += "<h2>LED Status</h2>";
  html += "<p>RED LED (GPIO 32): " + String(attackDetected ? "ON" : "OFF") + "</p>";
  html += "<p>GREEN LED (GPIO 25): " + String(systemReady && !attackDetected ? "ON" : "OFF") + "</p>";
  html += "<p>YELLOW LED (GPIO 26): " + String(systemReady ? "BLINKING" : "OFF") + "</p>";
  html += "<h2>Debug Info</h2>";
  html += "<p>Attack Detected: " + String(attackDetected ? "YES" : "NO") + "</p>";
  html += "<p>Data Received: " + String(totalDataReceived) + "</p>";
  html += "<p>Check Serial Monitor for detailed data analysis</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  String response = "{";
  response += "\"attack_detected\":" + String(attackDetected ? "true" : "false") + ",";
  response += "\"led_red\":" + String(attackDetected ? "true" : "false") + ",";
  response += "\"led_green\":" + String((systemReady && !attackDetected) ? "true" : "false") + ",";
  response += "\"led_yellow\":" + String(systemReady ? "true" : "false") + ",";
  response += "\"total_data_received\":" + String(totalDataReceived);
  response += "}";
  
  server.send(200, "application/json", response);
}

// ==================== ETHERNET CLIENT HANDLER ====================

void handleEthernetClient() {
  EthernetClient client = ethServer.available();
  
  if (client) {
    totalDataReceived++;
    Serial.println("\n" + String('=', 80));
    Serial.printf("📥 DATA PACKET #%lu RECEIVED FROM LAPTOP 2\n", totalDataReceived);
    Serial.println(String('=', 80));
    
    String request = "";
    String body = "";
    bool isPost = false;
    int contentLength = 0;
    
    // Read HTTP request
    unsigned long timeout = millis();
    while (client.connected() && (millis() - timeout < 5000)) {
      if (client.available()) {
        String line = client.readStringUntil('\n');
        request += line + "\n";
        
        if (line.startsWith("POST")) {
          isPost = true;
          Serial.println("📤 HTTP Method: POST");
        }
        
        if (line.startsWith("Content-Length:")) {
          contentLength = line.substring(16).toInt();
          Serial.printf("📏 Content Length: %d bytes\n", contentLength);
        }
        
        if (line == "\r") {
          // Headers ended, read body
          if (contentLength > 0) {
            body = client.readString();
          }
          break;
        }
      }
    }
    
    if (isPost && body.length() > 0) {
      Serial.println("\n🔍 COMPLETE DATA ANALYSIS:");
      Serial.println("📊 Raw JSON Body (first 500 chars):");
      Serial.println(body.substring(0, 500));
      if (body.length() > 500) {
        Serial.println("... (truncated, total length: " + String(body.length()) + " chars)");
      }
      
      Serial.println("\n🔍 SEARCHING FOR ATTACK INDICATORS:");
      
      // Check all possible attack indicators
      bool foundAttackDetected = body.indexOf("\"attack_detected\":true") >= 0;
      bool foundDataModeAttack = body.indexOf("\"data_mode\":\"attack\"") >= 0;
      bool foundTempValue = body.indexOf("\"temperature_value\":") >= 0;
      bool foundPlainTemp = body.indexOf("\"temperature\":") >= 0;
      bool foundThreatCritical = body.indexOf("\"threat_level\":\"critical\"") >= 0;
      bool foundAttackSource = body.indexOf("laptop2_web_attack") >= 0;
      
      Serial.printf("   attack_detected:true     -> %s\n", foundAttackDetected ? "✅ FOUND" : "❌ NOT FOUND");
      Serial.printf("   data_mode:attack         -> %s\n", foundDataModeAttack ? "✅ FOUND" : "❌ NOT FOUND");
      Serial.printf("   temperature_value        -> %s\n", foundTempValue ? "✅ FOUND" : "❌ NOT FOUND");
      Serial.printf("   plain temperature        -> %s\n", foundPlainTemp ? "✅ FOUND" : "❌ NOT FOUND");
      Serial.printf("   threat_level:critical    -> %s\n", foundThreatCritical ? "✅ FOUND" : "❌ NOT FOUND");
      Serial.printf("   laptop2_web_attack       -> %s\n", foundAttackSource ? "✅ FOUND" : "❌ NOT FOUND");
      
      // Extract temperature values if found
      if (foundTempValue) {
        float tempValue = extractFloatValue(body, "temperature_value");
        Serial.printf("   📊 Temperature Value: %.1f°C\n", tempValue);
      }
      
      if (foundPlainTemp) {
        float plainTemp = extractFloatValue(body, "temperature");
        Serial.printf("   📊 Plain Temperature: %.1f°C\n", plainTemp);
      }
      
      // ENHANCED ATTACK DETECTION
      bool isAttack = detectAttackEnhanced(body);
      
      if (isAttack != attackDetected) {  // State changed
        attackDetected = isAttack;
        setLEDState(attackDetected);
        
        if (attackDetected) {
          Serial.println("\n🚨 ATTACK MODE ACTIVATED!");
          Serial.println("🔴 RED LED should turn ON now!");
          
          // Sound buzzer
          for (int i = 0; i < 3; i++) {
            digitalWrite(BUZZER, HIGH);
            delay(100);
            digitalWrite(BUZZER, LOW);
            delay(100);
          }
        } else {
          Serial.println("\n✅ NORMAL MODE ACTIVATED!");
          Serial.println("🟢 GREEN LED should turn ON now!");
        }
      } else {
        Serial.printf("\n🔄 Mode unchanged: %s\n", attackDetected ? "ATTACK" : "NORMAL");
      }
      
      // Forward to backend
      if (wifiConnected) {
        Serial.println("\n📤 Forwarding to backend...");
        HTTPClient http;
        http.begin(String(BACKEND_API_URL) + String(BACKEND_SENSOR_ENDPOINT));
        http.addHeader("Content-Type", "application/json");
        
        int httpCode = http.POST(body);
        Serial.printf("📥 Backend response: %d\n", httpCode);
        
        if (httpCode == 200) {
          totalDataForwarded++;
          Serial.println("✅ Data forwarded successfully");
        } else {
          Serial.println("❌ Backend forwarding failed");
        }
        http.end();
      } else {
        Serial.println("❌ WiFi not connected - cannot forward to backend");
      }
      
      // Send response
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: application/json");
      client.println("Connection: close");
      client.println();
      client.println("{\"success\":true,\"attack_detected\":" + String(attackDetected ? "true" : "false") + "}");
    }
    
    client.stop();
    Serial.println(String('=', 80));
  }
}

// ==================== ENHANCED ATTACK DETECTION ====================

bool detectAttackEnhanced(String jsonData) {
  Serial.println("\n🔍 ENHANCED ATTACK DETECTION:");
  
  // Method 1: Direct attack indicators (highest priority)
  if (jsonData.indexOf("\"attack_detected\":true") >= 0) {
    Serial.println("✅ Method 1: Found attack_detected:true → ATTACK!");
    return true;
  }
  
  if (jsonData.indexOf("\"data_mode\":\"attack\"") >= 0) {
    Serial.println("✅ Method 1: Found data_mode:attack → ATTACK!");
    return true;
  }
  
  // Method 2: Temperature value (from web interface)
  if (jsonData.indexOf("\"temperature_value\":") >= 0) {
    float temp = extractFloatValue(jsonData, "temperature_value");
    Serial.printf("   Method 2: Temperature value %.1f°C\n", temp);
    if (temp > 35.0) {
      Serial.println("✅ Method 2: Temperature > 35°C → ATTACK!");
      return true;
    }
  }
  
  // Method 3: Plain JSON temperature (for direct testing)
  if (jsonData.indexOf("\"temperature\":") >= 0) {
    float temp = extractFloatValue(jsonData, "temperature");
    Serial.printf("   Method 3: Plain temperature %.1f°C\n", temp);
    if (temp > 35.0) {
      Serial.println("✅ Method 3: Plain temperature > 35°C → ATTACK!");
      return true;
    }
  }
  
  // Method 4: Threat level
  if (jsonData.indexOf("\"threat_level\":\"critical\"") >= 0) {
    Serial.println("✅ Method 4: Found threat_level:critical → ATTACK!");
    return true;
  }
  
  // Method 5: Security score
  if (jsonData.indexOf("\"security_score\":") >= 0) {
    float score = extractFloatValue(jsonData, "security_score");
    Serial.printf("   Method 5: Security score %.0f\n", score);
    if (score > 0 && score < 50) {
      Serial.println("✅ Method 5: Security score < 50 → ATTACK!");
      return true;
    }
  }
  
  // Method 6: Data source
  if (jsonData.indexOf("laptop2_web_attack") >= 0) {
    Serial.println("✅ Method 6: Found attack data source → ATTACK!");
    return true;
  }
  
  Serial.println("❌ No attack conditions found → NORMAL");
  return false;
}

// ==================== LED CONTROL ====================

void setLEDState(bool attack) {
  if (attack) {
    // ATTACK MODE: RED ON, GREEN OFF
    Serial.println("🔴 Setting RED LED ON (GPIO 32)");
    digitalWrite(LED_RED, HIGH);
    
    Serial.println("🟢 Setting GREEN LED OFF (GPIO 25)");
    digitalWrite(LED_GREEN, LOW);
  } else {
    // NORMAL MODE: GREEN ON, RED OFF
    Serial.println("🟢 Setting GREEN LED ON (GPIO 25)");
    digitalWrite(LED_GREEN, HIGH);
    
    Serial.println("🔴 Setting RED LED OFF (GPIO 32)");
    digitalWrite(LED_RED, LOW);
  }
}

void updateLEDs() {
  // Update system status
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  ethernetConnected = (Ethernet.linkStatus() == LinkON);
  systemReady = wifiConnected && ethernetConnected;
  
  // YELLOW LED: Continuous blink when ready
  if (systemReady) {
    unsigned long currentTime = millis();
    if ((currentTime / 500) % 2 == 0) {
      digitalWrite(LED_YELLOW, HIGH);
    } else {
      digitalWrite(LED_YELLOW, LOW);
    }
  }
}

// ==================== UTILITY FUNCTIONS ====================

float extractFloatValue(String data, String key) {
  String searchKey = "\"" + key + "\":";
  int keyIndex = data.indexOf(searchKey);
  if (keyIndex >= 0) {
    int startIndex = data.indexOf(":", keyIndex) + 1;
    int endIndex = data.indexOf(",", startIndex);
    if (endIndex == -1) endIndex = data.indexOf("}", startIndex);
    
    String value = data.substring(startIndex, endIndex);
    value.trim();
    value.replace("\"", "");
    return value.toFloat();
  }
  return 25.0;  // Default normal temperature
}

String getMACAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

void printSystemStatus() {
  Serial.println("\n" + String('=', 60));
  Serial.println("📊 SYSTEM STATUS:");
  Serial.println(String('=', 60));
  Serial.printf("Attack Status:  %s\n", attackDetected ? "🚨 DETECTED" : "✅ Normal");
  Serial.printf("RED LED:        %s (GPIO 32)\n", attackDetected ? "ON" : "OFF");
  Serial.printf("GREEN LED:      %s (GPIO 25)\n", (systemReady && !attackDetected) ? "ON" : "OFF");
  Serial.printf("YELLOW LED:     %s (GPIO 26)\n", systemReady ? "BLINKING" : "OFF");
  Serial.printf("Data Received:  %lu\n", totalDataReceived);
  Serial.printf("Data Forwarded: %lu\n", totalDataForwarded);
  Serial.println(String('=', 60));
}