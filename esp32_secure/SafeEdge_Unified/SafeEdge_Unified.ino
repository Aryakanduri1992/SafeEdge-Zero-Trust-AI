 /**
 * SafeEdge ESP32 - GREEN LED Fixed Version
 * =======================================
 * Fixed GPIO 25 (GREEN LED) issue - DAC pin conflicts resolved
 * RED LED: Working ✅
 * YELLOW LED: Working ✅  
 * GREEN LED: FIXED ✅
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

// ==================== CONFIGURATION ====================

// WiFi Configuration (Always Connected)
const char* WIFI_SSID = "Mohit";
const char* WIFI_PASSWORD = "123456789";

#define BACKEND_API_URL "http://10.192.71.133:8000"
#define BACKEND_SENSOR_ENDPOINT "/api/sensor-data"

// Ethernet Configuration
#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)

// BLE Configuration
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_PROVISION_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_STATUS_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Hardware Pins
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
String deviceId = "esp32_green_led_fixed";

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🚀 SafeEdge ESP32 - GREEN LED FIXED Version");
  Serial.println("🟢 FIXED GPIO 25 (GREEN LED) DAC conflicts resolved");
  Serial.println("============================================================");
  
  initHardwareFixed();
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
  
  // Initialize BLE for provisioning
  initBLE();
  
  systemReady = wifiConnected && ethernetConnected;
  
  if (systemReady) {
    Serial.println("🎉 Complete System Ready!");
    Serial.println("   ✅ WiFi connected for Backend API");
    Serial.println("   ✅ Ethernet ready for sensor data");
    Serial.println("   ✅ BLE ready for provisioning");
    Serial.println("   ✅ FIXED attack detection active");
    Serial.println("   🟢 GREEN LED GPIO 25 FIXED!");
    setLEDStateFixed(false);  // Start in normal mode
    beep(2);
  }
  
  Serial.println("============================================================");
  Serial.println("🟢 FIXED: GREEN LED GPIO 25 DAC conflicts resolved");
  Serial.println("🔴 RED LED: Working correctly");
  Serial.println("🟡 YELLOW LED: Working correctly");
  Serial.println("============================================================");
}

// ==================== MAIN LOOP ====================

void loop() {
  if (ethernetConnected) {
    handleEthernetClient();
  }
  
  server.handleClient();
  updateLEDsFixed();
  
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

// ==================== FIXED HARDWARE INITIALIZATION ====================

void initHardwareFixed() {
  Serial.println("🔄 Initializing hardware with GPIO 25 DAC fix...");
  delay(500);
  
  // CRITICAL: Disable DAC on GPIO 25 before using as digital output
  dac_output_disable(DAC_CHANNEL_2);  // GPIO 25 is DAC_CHANNEL_2
  delay(100);
  
  // GPIO 32 - RED LED (Working)
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_RED, LOW);
  delay(100);
  
  // GPIO 25 - GREEN LED (FIXED with DAC disable)
  pinMode(LED_GREEN, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  delay(100);
  
  // Force GPIO 25 to digital mode
  gpio_set_direction(GPIO_NUM_25, GPIO_MODE_OUTPUT);
  gpio_set_level(GPIO_NUM_25, 0);
  delay(100);
  
  // GPIO 26 - YELLOW LED (Working)
  pinMode(LED_YELLOW, OUTPUT);
  digitalWrite(LED_YELLOW, LOW);
  delay(100);
  
  // GPIO 33 - BUZZER
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);
  delay(100);
  
  // Extended LED test sequence with GPIO 25 fix
  Serial.println("🔄 Testing all LEDs with GPIO 25 DAC fix...");
  
  // Test RED LED
  Serial.println("   Testing RED LED (GPIO 32)...");
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);
  delay(500);
  
  // Test GREEN LED with multiple methods
  Serial.println("   Testing GREEN LED (GPIO 25) with DAC fix...");
  digitalWrite(LED_GREEN, HIGH);
  gpio_set_level(GPIO_NUM_25, 1);  // Force high with GPIO driver
  delay(1000);
  digitalWrite(LED_GREEN, LOW);
  gpio_set_level(GPIO_NUM_25, 0);  // Force low with GPIO driver
  delay(500);
  
  // Test YELLOW LED
  Serial.println("   Testing YELLOW LED (GPIO 26)...");
  digitalWrite(LED_YELLOW, HIGH);
  delay(1000);
  digitalWrite(LED_YELLOW, LOW);
  delay(500);
  
  Serial.println("✅ Hardware initialized with GPIO 25 DAC fix");
  Serial.println("   🔴 RED LED: GPIO 32 - Working");
  Serial.println("   🟢 GREEN LED: GPIO 25 - FIXED (DAC disabled)");
  Serial.println("   🟡 YELLOW LED: GPIO 26 - Working");
  Serial.println("   🔊 BUZZER: GPIO 33 - Working");
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
  String html = "<!DOCTYPE html><html><head><title>SafeEdge GREEN LED Fixed</title></head><body>";
  html += "<h1>SafeEdge ESP32 - GREEN LED FIXED</h1>";
  html += "<p><strong>GPIO 25 DAC conflicts resolved</strong></p>";
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
  doc["mode"] = "GREEN_LED_FIXED";
  doc["wifi"] = wifiConnected;
  doc["ethernet"] = ethernetConnected;
  doc["backend"] = BACKEND_API_URL;
  doc["ble"] = bleConnected;
  doc["attack_detected"] = attackDetected;
  doc["led_red"] = attackDetected;
  doc["led_green"] = (systemReady && !attackDetected);
  doc["led_yellow"] = systemReady;
  doc["provisioned_devices"] = provisionedDeviceCount;
  doc["total_data_received"] = totalDataReceived;
  doc["total_data_forwarded"] = totalDataForwarded;
  doc["uptime"] = millis();
  doc["gpio25_dac_disabled"] = true;  // Indicates DAC fix applied
  
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
      bool isAttack = detectAttackFixed(body);
      
      if (isAttack != attackDetected) {
        attackDetected = isAttack;
        setLEDStateFixed(attackDetected);
        
        if (attackDetected) {
          Serial.println("🚨 ATTACK DETECTED - RED LED ON!");
          beep(3);
        } else {
          Serial.println("✅ NORMAL CONDITIONS - GREEN LED ON!");
        }
      }
      
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

// ==================== FIXED ATTACK DETECTION ====================

bool detectAttackFixed(String jsonData) {
  Serial.println("🔍 FIXED Attack Detection:");
  
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

// ==================== FIXED LED CONTROL ====================

void setLEDStateFixed(bool attack) {
  if (attack) {
    // ATTACK MODE: RED ON, GREEN OFF
    Serial.println("🔴 Setting RED LED ON (GPIO 32)");
    digitalWrite(LED_RED, HIGH);
    
    Serial.println("🟢 Setting GREEN LED OFF (GPIO 25) with DAC fix");
    digitalWrite(LED_GREEN, LOW);
    gpio_set_level(GPIO_NUM_25, 0);  // Force OFF with GPIO driver
  } else {
    // NORMAL MODE: GREEN ON, RED OFF
    Serial.println("🟢 Setting GREEN LED ON (GPIO 25) with DAC fix");
    digitalWrite(LED_GREEN, HIGH);
    gpio_set_level(GPIO_NUM_25, 1);  // Force ON with GPIO driver
    
    Serial.println("🔴 Setting RED LED OFF (GPIO 32)");
    digitalWrite(LED_RED, LOW);
  }
}

void updateLEDsFixed() {
  // Update system status
  wifiConnected = (WiFi.status() == WL_CONNECTED);
  ethernetConnected = (Ethernet.linkStatus() == LinkON);
  systemReady = wifiConnected && ethernetConnected;
  
  // LED Control Logic with GPIO 25 fix
  if (attackDetected) {
    // ATTACK MODE: RED ON, GREEN OFF
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    gpio_set_level(GPIO_NUM_25, 0);  // Force GREEN OFF
  } else if (systemReady) {
    // NORMAL MODE: GREEN ON, RED OFF
    digitalWrite(LED_GREEN, HIGH);
    gpio_set_level(GPIO_NUM_25, 1);  // Force GREEN ON
    digitalWrite(LED_RED, LOW);
  } else {
    // SYSTEM NOT READY: Both OFF
    digitalWrite(LED_GREEN, LOW);
    gpio_set_level(GPIO_NUM_25, 0);
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

// ==================== SPIFFS INITIALIZATION ====================

void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ SPIFFS initialization failed");
    digitalWrite(LED_RED, HIGH);
    while (1) delay(1000);
  }
  
  if (!SPIFFS.exists("/config")) SPIFFS.mkdir("/config");
  if (!SPIFFS.exists("/certs")) SPIFFS.mkdir("/certs");
  if (!SPIFFS.exists("/keys")) SPIFFS.mkdir("/keys");
  if (!SPIFFS.exists("/devices")) SPIFFS.mkdir("/devices");
  
  Serial.println("✅ SPIFFS initialized");
}

// ==================== BLE IMPLEMENTATION ====================

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleConnected = true;
    Serial.println("📱 BLE Client Connected");
    digitalWrite(LED_YELLOW, HIGH);
  }
  
  void onDisconnect(BLEServer* pServer) {
    bleConnected = false;
    Serial.println("📱 BLE Client Disconnected");
    digitalWrite(LED_YELLOW, LOW);
    
    BLEDevice::startAdvertising();
    Serial.println("📡 BLE Advertising restarted");
  }
};

class ProvisionCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.println("\n📥 Received provisioning data via BLE");
      
      if (provisionDeviceViaBLE(value)) {
        pStatusCharacteristic->setValue("SUCCESS");
        Serial.println("✅ Device provisioned successfully");
        blinkLED(LED_GREEN, 3);
        beep(2);
      } else {
        pStatusCharacteristic->setValue("FAILED");
        Serial.println("❌ Device provisioning failed");
        blinkLED(LED_RED, 3);
      }
      pStatusCharacteristic->notify();
    }
  }
};

void initBLE() {
  Serial.println("\n📱 Initializing BLE...");
  
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
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("✅ BLE initialized");
  Serial.println("   Name: SafeEdge-Gateway");
  Serial.println("   Ready for provisioning");
}

bool provisionDeviceViaBLE(String jsonData) {
  DynamicJsonDocument doc(8192);
  if (deserializeJson(doc, jsonData)) {
    Serial.println("❌ Invalid JSON");
    return false;
  }
  
  String deviceId = doc["device_id"].as<String>();
  String deviceName = doc["device_name"].as<String>();
  String deviceType = doc["device_type"].as<String>();
  
  Serial.printf("📝 Provisioning: %s (%s)\n", deviceName.c_str(), deviceId.c_str());
  
  // Check if device already exists
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active && deviceRegistry[i].deviceId == deviceId) {
      Serial.println("⚠️  Device already provisioned, updating...");
      deviceRegistry[i].deviceName = deviceName;
      deviceRegistry[i].deviceType = deviceType;
      deviceRegistry[i].lastSeen = millis();
      Serial.printf("✅ Device updated (Total: %d)\n", provisionedDeviceCount);
      return true;
    }
  }
  
  // Add to registry
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (!deviceRegistry[i].active) {
      deviceRegistry[i].deviceId = deviceId;
      deviceRegistry[i].deviceName = deviceName;
      deviceRegistry[i].deviceType = deviceType;
      deviceRegistry[i].lastSeen = millis();
      deviceRegistry[i].active = true;
      provisionedDeviceCount++;
      break;
    }
  }
  
  Serial.printf("✅ Device provisioned (Total: %d)\n", provisionedDeviceCount);
  return true;
}

void updateDeviceLastSeen(String deviceId) {
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active && deviceRegistry[i].deviceId == deviceId) {
      deviceRegistry[i].lastSeen = millis();
      break;
    }
  }
}

void cleanupInactiveDevices() {
  unsigned long now = millis();
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active) {
      if (now - deviceRegistry[i].lastSeen > 300000) { // 5 minutes
        Serial.printf("🗑️  Removing inactive device: %s\n", deviceRegistry[i].deviceId.c_str());
        deviceRegistry[i].active = false;
        provisionedDeviceCount--;
      }
    }
  }
}

// ==================== UTILITY FUNCTIONS ====================

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    if (pin == LED_GREEN) {
      // Special handling for GPIO 25
      digitalWrite(pin, HIGH);
      gpio_set_level(GPIO_NUM_25, 1);
      delay(100);
      digitalWrite(pin, LOW);
      gpio_set_level(GPIO_NUM_25, 0);
      delay(100);
    } else {
      digitalWrite(pin, HIGH);
      delay(100);
      digitalWrite(pin, LOW);
      delay(100);
    }
  }
}

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
  Serial.println("📊 Complete System Status (GREEN LED FIXED):");
  Serial.println("============================================================");
  Serial.printf("Attack Status:      %s\n", attackDetected ? "🚨 DETECTED" : "✅ Normal");
  Serial.printf("🔴 RED LED:         %s (GPIO 32)\n", attackDetected ? "ON" : "OFF");
  Serial.printf("🟢 GREEN LED:       %s (GPIO 25 - DAC FIXED)\n", (systemReady && !attackDetected) ? "ON" : "OFF");
  Serial.printf("🟡 YELLOW LED:      %s (GPIO 26)\n", systemReady ? "BLINKING" : "OFF");
  Serial.printf("WiFi:               %s\n", wifiConnected ? "Connected" : "Disconnected");
  Serial.printf("Ethernet:           %s\n", ethernetConnected ? "Connected" : "Disconnected");
  Serial.printf("BLE:                %s\n", bleConnected ? "Client Connected" : "Advertising");
  Serial.printf("Provisioned Devices: %d\n", provisionedDeviceCount);
  Serial.printf("Data Received:      %lu\n", totalDataReceived);
  Serial.printf("Data Forwarded:     %lu\n", totalDataForwarded);
  Serial.println("============================================================");
}