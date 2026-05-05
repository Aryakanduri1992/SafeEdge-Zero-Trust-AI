/**
 * SafeEdge ESP32 - FINAL WORKING VERSION
 * =====================================
 * FIXED: GREEN LED stays ON when system ready and no attack
 * FIXED: All compilation errors resolved
 * FIXED: Perfect LED synchronization with web interface
 * 
 * LED Behavior:
 * 🟢 GREEN LED (GPIO 25): ON when system ready and normal data
 * 🔴 RED LED (GPIO 32): ON when attack detected
 * 🟡 YELLOW LED (GPIO 26): Blinks when data received
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Ethernet.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <driver/dac.h>
#include <driver/gpio.h>

// ==================== CONFIGURATION ====================

const char* WIFI_SSID = "Mohitpas";
const char* WIFI_PASSWORD = "12345678";

#define BACKEND_API_URL "http://10.192.71.133:8000"
#define BACKEND_SENSOR_ENDPOINT "/api/sensor-data"

#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)

// BLE Configuration
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_PROVISION_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_STATUS_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Hardware Pins - KEEP YOUR EXISTING WIRING
#define LED_RED 32     // GPIO 32 - RED LED (Working ✅)
#define LED_GREEN 25   // GPIO 25 - GREEN LED (FIXED ✅)
#define LED_YELLOW 26  // GPIO 26 - YELLOW LED (Working ✅)
#define BUZZER 33      // GPIO 33 - BUZZER

#define ETH_CS 5

// ==================== GLOBAL VARIABLES ====================

WebServer server(80);
EthernetServer ethServer(80);

// BLE Variables
BLEServer* pServer = NULL;
BLECharacteristic* pProvisionCharacteristic = NULL;
BLECharacteristic* pStatusCharacteristic = NULL;
bool bleConnected = false;

bool wifiConnected = false;
bool ethernetConnected = false;
bool systemReady = false;
bool attackDetected = false;

// Device Registry
#define MAX_DEVICES 50
struct ProvisionedDevice {
  String deviceId;
  String deviceName;
  String deviceType;
  unsigned long lastSeen;
  bool active;
};
ProvisionedDevice deviceRegistry[MAX_DEVICES];
int provisionedDeviceCount = 0;

// LED Control
unsigned long lastDataReceived = 0;
unsigned long yellowBlinkStart = 0;
bool yellowBlinkActive = false;

// Statistics
unsigned long totalDataReceived = 0;
unsigned long totalDataForwarded = 0;
unsigned long lastStatsUpdate = 0;

String macAddress = "";
String deviceId = "esp32_final_working";

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 SafeEdge ESP32 - FINAL WORKING VERSION");
  Serial.println("🟢 GREEN LED logic FIXED - stays ON when ready");
  Serial.println("🔧 All compilation errors resolved");
  Serial.println("============================================================");
  
  initHardware();
  initSPIFFS();
  
  macAddress = getMACAddress();
  Serial.printf("📱 Gateway MAC: %s\n", macAddress.c_str());
  
  // Initialize device registry
  for (int i = 0; i < MAX_DEVICES; i++) {
    deviceRegistry[i].active = false;
  }
  
  connectWiFi();
  connectEthernet();
  
  if (ethernetConnected) {
    setupHTTPServer();
    ethServer.begin();
    Serial.println("✅ Ethernet HTTP Server started");
  }
  
  initBLE();
  
  systemReady = wifiConnected && ethernetConnected;
  
  if (systemReady) {
    Serial.println("🎉 Complete System Ready!");
    Serial.println("   ✅ WiFi connected for Backend API");
    Serial.println("   ✅ Ethernet ready for sensor data");
    Serial.println("   ✅ BLE ready for provisioning");
    Serial.println("   🟢 GREEN LED will stay ON when ready!");
    
    // Test all LEDs
    testAllLEDs();
    
    // Set initial state: GREEN ON (system ready, no attack)
    setLEDState(false);  // false = no attack = GREEN ON
    beep(2);
  }
  
  Serial.println("============================================================");
  Serial.println("🟢 GREEN LED: ON when system ready and no attack");
  Serial.println("🔴 RED LED: ON when attack detected");
  Serial.println("🟡 YELLOW LED: Blinks when data received");
  Serial.println("============================================================");
}

// ==================== MAIN LOOP ====================

void loop() {
  if (ethernetConnected) {
    handleEthernetClient();
  }
  
  server.handleClient();
  updateLEDs();
  
  // Clean up inactive devices every minute
  static unsigned long lastCleanup = 0;
  if (millis() - lastCleanup > 60000) {
    cleanupInactiveDevices();
    lastCleanup = millis();
  }
  
  if (millis() - lastStatsUpdate > 30000) {
    printSystemStatus();
    lastStatsUpdate = millis();
  }
  
  delay(10);
}

// ==================== HARDWARE INITIALIZATION ====================

void initHardware() {
  Serial.println("🔄 Initializing hardware...");
  
  // Initialize GPIO 25 (GREEN LED) - Fix DAC conflict
  dac_output_disable(DAC_CHANNEL_2);  // GPIO 25 is DAC_CHANNEL_2
  delay(100);
  
  // Initialize all pins
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Set all LEDs OFF initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(BUZZER, LOW);
  
  Serial.println("✅ Hardware initialized");
  Serial.println("   🔴 RED LED: GPIO 32");
  Serial.println("   🟢 GREEN LED: GPIO 25 (DAC disabled)");
  Serial.println("   🟡 YELLOW LED: GPIO 26");
  Serial.println("   🔊 BUZZER: GPIO 33");
}

void testAllLEDs() {
  Serial.println("🔄 Testing all LEDs...");
  
  // Test RED LED
  Serial.println("   Testing RED LED (GPIO 32)...");
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);
  delay(500);
  
  // Test GREEN LED
  Serial.println("   Testing GREEN LED (GPIO 25)...");
  digitalWrite(LED_GREEN, HIGH);
  delay(1000);
  digitalWrite(LED_GREEN, LOW);
  delay(500);
  
  // Test YELLOW LED
  Serial.println("   Testing YELLOW LED (GPIO 26)...");
  digitalWrite(LED_YELLOW, HIGH);
  delay(1000);
  digitalWrite(LED_YELLOW, LOW);
  delay(500);
  
  Serial.println("✅ All LEDs tested successfully");
}

// ==================== WIFI & ETHERNET ====================

void connectWiFi() {
  Serial.println("\n📡 Connecting WiFi...");
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
  Serial.println("\n📡 Connecting Ethernet...");
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
  server.on("/api/devices", HTTP_GET, handleDeviceList);
  server.enableCORS(true);
  server.begin();
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>SafeEdge Final Working</title></head><body>";
  html += "<h1>SafeEdge ESP32 - FINAL WORKING VERSION</h1>";
  html += "<p><strong>GREEN LED logic FIXED - stays ON when ready</strong></p>";
  html += "<h2>LED Status</h2>";
  html += "<p>🔴 RED LED (GPIO 32): " + String(attackDetected ? "ON" : "OFF") + "</p>";
  html += "<p>🟢 GREEN LED (GPIO 25): " + String(systemReady && !attackDetected ? "ON" : "OFF") + " - FIXED!</p>";
  html += "<p>🟡 YELLOW LED (GPIO 26): " + String(systemReady ? "BLINKING" : "OFF") + "</p>";
  html += "<h2>System Status</h2>";
  html += "<p>Attack Detected: " + String(attackDetected ? "YES" : "NO") + "</p>";
  html += "<p>Data Received: " + String(totalDataReceived) + "</p>";
  html += "<p>Data Forwarded: " + String(totalDataForwarded) + "</p>";
  html += "<p>Provisioned Devices: " + String(provisionedDeviceCount) + "</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  DynamicJsonDocument doc(512);
  doc["success"] = true;
  doc["mode"] = "FINAL_WORKING";
  doc["wifi"] = wifiConnected;
  doc["ethernet"] = ethernetConnected;
  doc["backend"] = BACKEND_API_URL;
  doc["ble"] = bleConnected;
  doc["attack_detected"] = attackDetected;
  doc["led_red"] = attackDetected;
  doc["led_green"] = (systemReady && !attackDetected);  // GREEN ON when ready and no attack
  doc["led_yellow"] = systemReady;
  doc["provisioned_devices"] = provisionedDeviceCount;
  doc["total_data_received"] = totalDataReceived;
  doc["total_data_forwarded"] = totalDataForwarded;
  doc["uptime"] = millis();
  doc["green_led_fixed"] = true;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleDeviceList() {
  DynamicJsonDocument doc(4096);
  JsonArray devices = doc.createNestedArray("devices");
  
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active) {
      JsonObject device = devices.createNestedObject();
      device["device_id"] = deviceRegistry[i].deviceId;
      device["device_name"] = deviceRegistry[i].deviceName;
      device["device_type"] = deviceRegistry[i].deviceType;
      device["last_seen"] = deviceRegistry[i].lastSeen;
    }
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// ==================== ETHERNET CLIENT HANDLER ====================

void handleEthernetClient() {
  EthernetClient client = ethServer.available();
  
  if (client) {
    totalDataReceived++;
    Serial.printf("\n📥 Data packet #%lu received from Laptop 2\n", totalDataReceived);
    
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
        }
        
        if (line.startsWith("Content-Length:")) {
          contentLength = line.substring(16).toInt();
        }
        
        if (line == "\r") {
          if (contentLength > 0) {
            body = client.readString();
          }
          break;
        }
      }
    }
    
    if (isPost && body.length() > 0) {
      Serial.println("📊 Processing sensor data...");
      
      // Parse JSON for device management
      DynamicJsonDocument doc(4096);
      DeserializationError error = deserializeJson(doc, body);
      
      String deviceId = "unknown";
      if (!error) {
        deviceId = doc["device_id"].as<String>();
        updateDeviceLastSeen(deviceId);
      }
      
      // FIXED ATTACK DETECTION
      bool isAttack = detectAttack(body);
      
      if (isAttack != attackDetected) {
        attackDetected = isAttack;
        setLEDState(attackDetected);
        
        if (attackDetected) {
          Serial.println("🚨 ATTACK DETECTED - RED LED ON!");
          beep(3);
        } else {
          Serial.println("✅ NORMAL CONDITIONS - GREEN LED ON!");
        }
      }
      
      // Trigger yellow blink for data activity
      triggerYellowBlink();
      
      // Forward to backend
      if (wifiConnected) {
        HTTPClient http;
        http.begin(String(BACKEND_API_URL) + String(BACKEND_SENSOR_ENDPOINT));
        http.addHeader("Content-Type", "application/json");
        
        int httpCode = http.POST(body);
        if (httpCode == 200) {
          totalDataForwarded++;
          Serial.println("✅ Data forwarded to backend");
        } else {
          Serial.printf("❌ Backend error: %d\n", httpCode);
        }
        http.end();
      }
      
      // Send response
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: application/json");
      client.println("Connection: close");
      client.println();
      client.println("{\"success\":true,\"attack_detected\":" + String(attackDetected ? "true" : "false") + "}");
    }
    
    client.stop();
  }
}

// ==================== ATTACK DETECTION ====================

bool detectAttack(String jsonData) {
  Serial.println("🔍 Attack Detection:");
  
  // Method 1: Check for "attack_detected":true
  int attackDetectedPos = jsonData.indexOf("\"attack_detected\":");
  if (attackDetectedPos >= 0) {
    int valueStart = jsonData.indexOf(":", attackDetectedPos) + 1;
    String valueStr = jsonData.substring(valueStart, valueStart + 10);
    valueStr.trim();
    
    if (valueStr.startsWith("true")) {
      Serial.println("✅ Found attack_detected:true → ATTACK!");
      return true;
    } else if (valueStr.startsWith("false")) {
      Serial.println("   Found attack_detected:false → NORMAL");
    }
  }
  
  // Method 2: Check for "data_mode":"attack"
  int dataModePos = jsonData.indexOf("\"data_mode\":");
  if (dataModePos >= 0) {
    int valueStart = jsonData.indexOf(":", dataModePos) + 1;
    String valueStr = jsonData.substring(valueStart, valueStart + 20);
    valueStr.trim();
    
    if (valueStr.indexOf("\"attack\"") >= 0) {
      Serial.println("✅ Found data_mode:attack → ATTACK!");
      return true;
    }
  }
  
  // Method 3: Check temperature_value
  int tempValuePos = jsonData.indexOf("\"temperature_value\":");
  if (tempValuePos >= 0) {
    int valueStart = jsonData.indexOf(":", tempValuePos) + 1;
    int valueEnd = jsonData.indexOf(",", valueStart);
    if (valueEnd == -1) valueEnd = jsonData.indexOf("}", valueStart);
    
    String tempStr = jsonData.substring(valueStart, valueEnd);
    tempStr.trim();
    float temp = tempStr.toFloat();
    
    Serial.printf("   Temperature value: %.1f°C\n", temp);
    if (temp > 35.0) {
      Serial.println("✅ Temperature > 35°C → ATTACK!");
      return true;
    }
  }
  
  Serial.println("❌ No attack conditions found → NORMAL");
  return false;
}

// ==================== LED CONTROL - FIXED ====================

void setLEDState(bool attack) {
  if (attack) {
    // ATTACK MODE: RED ON, GREEN OFF
    Serial.println("🔴 ATTACK MODE: RED LED ON, GREEN LED OFF");
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
  } else {
    // NORMAL MODE: GREEN ON, RED OFF
    Serial.println("🟢 NORMAL MODE: GREEN LED ON, RED LED OFF");
    digitalWrite(LED_GREEN, HIGH);  // GREEN stays ON when system ready and no attack
    digitalWrite(LED_RED, LOW);
  }
}

void updateLEDs() {
  // Update system status
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  ethernetConnected = (Ethernet.linkStatus() == LinkON);
  systemReady = wifiConnected && ethernetConnected;
  
  // FIXED LED Control Logic
  if (systemReady) {
    if (attackDetected) {
      // ATTACK MODE: RED ON, GREEN OFF
      digitalWrite(LED_RED, HIGH);
      digitalWrite(LED_GREEN, LOW);
    } else {
      // NORMAL MODE: GREEN ON, RED OFF - GREEN STAYS ON WHEN READY
      digitalWrite(LED_GREEN, HIGH);  // This is the FIX - GREEN stays ON
      digitalWrite(LED_RED, LOW);
    }
  } else {
    // SYSTEM NOT READY: Both LEDs OFF
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, LOW);
  }
  
  // YELLOW LED: Extended blink for data activity
  if (yellowBlinkActive) {
    unsigned long elapsed = millis() - yellowBlinkStart;
    if (elapsed < 600) {
      digitalWrite(LED_YELLOW, HIGH);
    } else if (elapsed < 1200) {
      digitalWrite(LED_YELLOW, LOW);
    } else {
      yellowBlinkActive = false;
      digitalWrite(LED_YELLOW, LOW);
    }
  } else if (systemReady) {
    // Continuous blink when ready
    unsigned long currentTime = millis();
    if ((currentTime / 500) % 2 == 0) {
      digitalWrite(LED_YELLOW, HIGH);
    } else {
      digitalWrite(LED_YELLOW, LOW);
    }
  }
}

void triggerYellowBlink() {
  yellowBlinkStart = millis();
  yellowBlinkActive = true;
  lastDataReceived = millis();
  Serial.println("💛 Yellow LED: Data received blink");
}

// ==================== SPIFFS & BLE ====================

void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ SPIFFS initialization failed");
    digitalWrite(LED_RED, HIGH);
    while (1) delay(1000);
  }
  Serial.println("✅ SPIFFS initialized");
}

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleConnected = true;
    Serial.println("📱 BLE Client Connected");
  }
  
  void onDisconnect(BLEServer* pServer) {
    bleConnected = false;
    Serial.println("📱 BLE Client Disconnected");
    BLEDevice::startAdvertising();
  }
};

class ProvisionCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.println("📥 BLE provisioning data received");
      pStatusCharacteristic->setValue("SUCCESS");
      pStatusCharacteristic->notify();
    }
  }
};

void initBLE() {
  Serial.println("📱 Initializing BLE...");
  
  BLEDevice::init("SafeEdge-Gateway");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(BLE_SERVICE_UUID);
  
  pProvisionCharacteristic = pService->createCharacteristic(
    BLE_PROVISION_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pProvisionCharacteristic->setCallbacks(new ProvisionCallbacks());
  
  pStatusCharacteristic = pService->createCharacteristic(
    BLE_STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusCharacteristic->addDescriptor(new BLE2902());
  pStatusCharacteristic->setValue("READY");
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  BLEDevice::startAdvertising();
  
  Serial.println("✅ BLE initialized");
}

void updateDeviceLastSeen(String deviceId) {
  // Find existing device or add new one
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active && deviceRegistry[i].deviceId == deviceId) {
      deviceRegistry[i].lastSeen = millis();
      return;
    }
  }
  
  // Add new device
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (!deviceRegistry[i].active) {
      deviceRegistry[i].deviceId = deviceId;
      deviceRegistry[i].deviceName = "IoT Device";
      deviceRegistry[i].deviceType = "sensor";
      deviceRegistry[i].lastSeen = millis();
      deviceRegistry[i].active = true;
      provisionedDeviceCount++;
      Serial.printf("📱 New device registered: %s\n", deviceId.c_str());
      break;
    }
  }
}

void cleanupInactiveDevices() {
  unsigned long currentTime = millis();
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active) {
      if (currentTime - deviceRegistry[i].lastSeen > 300000) { // 5 minutes
        deviceRegistry[i].active = false;
        provisionedDeviceCount--;
        Serial.printf("📱 Device timeout: %s\n", deviceRegistry[i].deviceId.c_str());
      }
    }
  }
}

// ==================== UTILITY FUNCTIONS ====================

void beep(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER, HIGH);
    delay(100);
    digitalWrite(BUZZER, LOW);
    delay(100);
  }
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
  Serial.println("============================================================");
  Serial.println("📊 System Status (FINAL WORKING VERSION):");
  Serial.println("============================================================");
  Serial.printf("Attack Status:      %s\n", attackDetected ? "🚨 DETECTED" : "✅ Normal");
  Serial.printf("🔴 RED LED:         %s (GPIO 32)\n", attackDetected ? "ON" : "OFF");
  Serial.printf("🟢 GREEN LED:       %s (GPIO 25 - FIXED)\n", (systemReady && !attackDetected) ? "ON" : "OFF");
  Serial.printf("🟡 YELLOW LED:      %s (GPIO 26)\n", systemReady ? "BLINKING" : "OFF");
  Serial.printf("WiFi:               %s\n", wifiConnected ? "Connected" : "Disconnected");
  Serial.printf("Ethernet:           %s\n", ethernetConnected ? "Connected" : "Disconnected");
  Serial.printf("Data Received:      %lu\n", totalDataReceived);
  Serial.printf("Data Forwarded:     %lu\n", totalDataForwarded);
  Serial.println("============================================================");
}