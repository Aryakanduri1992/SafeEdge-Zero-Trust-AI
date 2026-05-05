/**
 * SafeEdge ESP32 - BLE Provisioning + WiFi/Ethernet Operation
 * ============================================================
 * Provisioning: BLE (Bluetooth Low Energy)
 * Operation: WiFi or Ethernet
 * Data Reception: Ethernet from Laptop 2
 * 
 * Features:
 * - BLE provisioning (no WiFi AP needed)
 * - QR code scanning via mobile app/web
 * - Automatic switch to WiFi/Ethernet after provisioning
 * - Receives sensor data from Laptop 2 via Ethernet
 * - Forwards data to Firebase
 * - Certificate-based authentication
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 * Date: April 14, 2026
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <Ethernet.h>
#include <Firebase_ESP_Client.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ==================== CONFIGURATION ====================

// Backend API URL
#define BACKEND_API_URL "http://192.168.100.1:8000"

// Firebase URL
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// WiFi Credentials (fallback if not in config)
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";

// BLE UUIDs
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define DEVICE_NAME_PREFIX  "SafeEdge-"

// ==================== HARDWARE CONFIGURATION ====================

// LED Pins
#define LED_RED 32
#define LED_GREEN 25
#define LED_YELLOW 26
#define BUZZER 33

// Ethernet (W5500)
#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// ==================== GLOBAL VARIABLES ====================

// Device Configuration
String DEVICE_ID = "";
String DEVICE_NAME = "";
String DEVICE_TYPE = "";
String CONNECTION_TYPE = "ethernet";
String WIFI_SSID_FROM_CONFIG = "";
String WIFI_PASSWORD_FROM_CONFIG = "";
String FIREBASE_DATABASE_URL = FIREBASE_URL;

// BLE
BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool provisioningReceived = false;
String provisioningData = "";

// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Web Server (for Laptop 2 data)
WebServer server(80);

// Device State
bool isProvisioned = false;
bool isConnected = false;
bool firebaseReady = false;
String macAddress = "";
int sensorBufferIndex = 0;
#define BUFFER_SIZE 200

// ==================== SPIFFS PATHS ====================

#define CONFIG_FILE "/config/device_config.json"
#define CA_CERT_FILE "/certs/ca.crt"
#define DEVICE_CERT_FILE "/certs/device.crt"
#define DEVICE_KEY_FILE "/certs/device.key"
#define ENCRYPTION_KEY_FILE "/keys/encryption.key"

// ==================== BLE CALLBACKS ====================

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("📱 BLE Client Connected");
      digitalWrite(LED_YELLOW, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("📱 BLE Client Disconnected");
      digitalWrite(LED_YELLOW, LOW);
      
      // Restart advertising if not provisioned
      if (!isProvisioned) {
        delay(500);
        pServer->startAdvertising();
        Serial.println("🔄 BLE Advertising restarted");
      }
    }
};

class ProvisioningCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();

      if (value.length() > 0) {
        provisioningData = String(value.c_str());
        provisioningReceived = true;
        
        Serial.println("\n📥 Received provisioning data via BLE");
        Serial.printf("   Data size: %d bytes\n", provisioningData.length());
        
        // Blink yellow LED to indicate data received
        for (int i = 0; i < 3; i++) {
          digitalWrite(LED_YELLOW, HIGH);
          delay(100);
          digitalWrite(LED_YELLOW, LOW);
          delay(100);
        }
      }
    }
};

// ==================== FUNCTION DECLARATIONS ====================

void initHardware();
void initSPIFFS();
bool checkProvisioning();
void startBLEProvisioning();
void processProvisioning();
bool validateWithBackend(const String& deviceId, const String& token);
bool loadConfiguration();
void connectToNetwork();
void connectEthernet();
void connectWiFi();
void initFirebase();
void sendSensorData();
void setupDataServer();
void handleSensorDataFromLaptop2();
void handleDeviceStatus();
void blinkLED(int pin, int times);
void beep(int times);
String getMACAddress();
String readFile(const char* path);
bool saveFile(const char* path, const String& content);

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║     SafeEdge ESP32 - BLE Provisioning                 ║");
  Serial.println("║     Imagine Cup 2026 - World Championship             ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.println();
  
  // Initialize hardware
  initHardware();
  
  // Initialize SPIFFS
  initSPIFFS();
  
  // Get MAC address
  macAddress = getMACAddress();
  Serial.printf("📱 MAC Address: %s\n", macAddress.c_str());
  
  // Check if device is provisioned
  isProvisioned = checkProvisioning();
  
  if (isProvisioned) {
    Serial.println("✅ Device already provisioned");
    
    // Load configuration
    if (loadConfiguration()) {
      Serial.println("✅ Configuration loaded");
      
      // Connect to network
      connectToNetwork();
      
      // Validate with backend
      if (isConnected) {
        Serial.println("\n🔐 Validating device with backend...");
        if (validateWithBackend(DEVICE_ID, readFile(CONFIG_FILE))) {
          Serial.println("✅ Device validated with backend");
        } else {
          Serial.println("⚠️  Backend validation failed");
        }
        
        // Initialize Firebase
        initFirebase();
        
        // Setup HTTP server for Laptop 2
        setupDataServer();
      }
    }
  } else {
    Serial.println("❌ Device not provisioned");
    Serial.println("📱 Starting BLE provisioning mode...\n");
    
    // Start BLE provisioning
    startBLEProvisioning();
  }
}

// ==================== MAIN LOOP ====================

void loop() {
  if (!isProvisioned) {
    // Check if provisioning data received via BLE
    if (provisioningReceived) {
      processProvisioning();
      provisioningReceived = false;
    }
    
    // Blink yellow LED slowly
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(LED_YELLOW, !digitalRead(LED_YELLOW));
      lastBlink = millis();
    }
    
  } else if (isConnected && firebaseReady) {
    // Handle incoming HTTP requests from Laptop 2
    server.handleClient();
    
    // Send periodic sensor data
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 5000) {
      sendSensorData();
      lastSend = millis();
    }
    
    // Keep green LED on
    digitalWrite(LED_GREEN, HIGH);
    
  } else {
    // Provisioned but not connected
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 500) {
      digitalWrite(LED_RED, !digitalRead(LED_RED));
      lastBlink = millis();
    }
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
  
  Serial.println("✅ SPIFFS initialized");
}

// ==================== PROVISIONING CHECK ====================

bool checkProvisioning() {
  return SPIFFS.exists(CONFIG_FILE) &&
         SPIFFS.exists(CA_CERT_FILE) &&
         SPIFFS.exists(DEVICE_CERT_FILE) &&
         SPIFFS.exists(DEVICE_KEY_FILE) &&
         SPIFFS.exists(ENCRYPTION_KEY_FILE);
}

// ==================== BLE PROVISIONING ====================

void startBLEProvisioning() {
  // Generate BLE device name with MAC suffix
  uint8_t mac[6];
  WiFi.macAddress(mac);
  String bleName = String(DEVICE_NAME_PREFIX) + 
                   String(mac[4], HEX) + String(mac[5], HEX);
  bleName.toUpperCase();
  
  Serial.println("🔵 Starting BLE Provisioning");
  Serial.println("=========================================================");
  Serial.printf("📡 BLE Device Name: %s\n", bleName.c_str());
  Serial.printf("   Service UUID: %s\n", SERVICE_UUID);
  Serial.println("=========================================================");
  Serial.println("📱 Instructions:");
  Serial.println("   1. Open dashboard and generate QR code");
  Serial.println("   2. Scan QR code with mobile app/browser");
  Serial.println("   3. App will send config via Bluetooth");
  Serial.println("   4. Device will provision automatically");
  Serial.println("=========================================================\n");
  
  // Initialize BLE
  BLEDevice::init(bleName.c_str());
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new ProvisioningCallbacks());
  
  // Start service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("✅ BLE Advertising started");
  Serial.println("   Waiting for mobile device to connect...\n");
  
  // Blink yellow LED to indicate BLE mode
  blinkLED(LED_YELLOW, 5);
}

void processProvisioning() {
  Serial.println("\n🔄 Processing provisioning data...");
  
  // Parse JSON
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, provisioningData);
  
  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    
    // Send error response via BLE
    if (deviceConnected) {
      pCharacteristic->setValue("{\"success\":false,\"message\":\"Invalid JSON\"}");
      pCharacteristic->notify();
    }
    return;
  }
  
  // Extract device info
  String deviceId = doc["device_id"].as<String>();
  String token = doc["provisioning_token"].as<String>();
  
  Serial.printf("   Device ID: %s\n", deviceId.c_str());
  Serial.printf("   Token: %s...\n", token.substring(0, 20).c_str());
  
  // Store configuration
  if (!saveFile(CONFIG_FILE, provisioningData)) {
    Serial.println("❌ Failed to save config");
    if (deviceConnected) {
      pCharacteristic->setValue("{\"success\":false,\"message\":\"Failed to save config\"}");
      pCharacteristic->notify();
    }
    return;
  }
  
  // Store certificates
  String caCert = doc["certificates"]["ca"].as<String>();
  String deviceCert = doc["certificates"]["cert"].as<String>();
  String deviceKey = doc["certificates"]["key"].as<String>();
  String encKey = doc["encryption_key"].as<String>();
  
  if (!saveFile(CA_CERT_FILE, caCert) ||
      !saveFile(DEVICE_CERT_FILE, deviceCert) ||
      !saveFile(DEVICE_KEY_FILE, deviceKey) ||
      !saveFile(ENCRYPTION_KEY_FILE, encKey)) {
    Serial.println("❌ Failed to save certificates");
    if (deviceConnected) {
      pCharacteristic->setValue("{\"success\":false,\"message\":\"Failed to save certificates\"}");
      pCharacteristic->notify();
    }
    return;
  }
  
  Serial.println("✅ All credentials stored in SPIFFS");
  
  // Send success response via BLE
  if (deviceConnected) {
    pCharacteristic->setValue("{\"success\":true,\"message\":\"Device provisioned successfully\"}");
    pCharacteristic->notify();
  }
  
  isProvisioned = true;
  
  // Success feedback
  blinkLED(LED_GREEN, 5);
  beep(2);
  
  Serial.println("🎉 Device provisioned successfully!");
  Serial.println("🔄 Restarting in 3 seconds...");
  
  delay(3000);
  ESP.restart();
}

// ==================== BACKEND VALIDATION ====================

bool validateWithBackend(const String& deviceId, const String& token) {
  HTTPClient http;
  
  String url = String(BACKEND_API_URL) + "/api/devices/validate";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["provisioning_token"] = token;
  doc["esp32_mac_address"] = macAddress;
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("🔍 Validating with backend...");
  Serial.printf("   URL: %s\n", url.c_str());
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument responseDoc(512);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      bool valid = responseDoc["valid"];
      http.end();
      return valid;
    }
  } else {
    Serial.printf("❌ HTTP error: %d\n", httpCode);
  }
  
  http.end();
  return false;
}

// ==================== CONFIGURATION LOADING ====================

bool loadConfiguration() {
  String configJson = readFile(CONFIG_FILE);
  if (configJson.isEmpty()) return false;
  
  DynamicJsonDocument doc(4096);
  DeserializationError error = deserializeJson(doc, configJson);
  if (error) return false;
  
  DEVICE_ID = doc["device_id"].as<String>();
  DEVICE_NAME = doc["device_name"].as<String>();
  DEVICE_TYPE = doc["device_type"].as<String>();
  CONNECTION_TYPE = doc["connection_type"].as<String>();
  
  if (CONNECTION_TYPE == "wifi" && doc.containsKey("wifi")) {
    WIFI_SSID_FROM_CONFIG = doc["wifi"]["ssid"].as<String>();
    WIFI_PASSWORD_FROM_CONFIG = doc["wifi"]["password"].as<String>();
  }
  
  Serial.println("📋 Configuration:");
  Serial.printf("   Device ID: %s\n", DEVICE_ID.c_str());
  Serial.printf("   Device Name: %s\n", DEVICE_NAME.c_str());
  Serial.printf("   Connection: %s\n", CONNECTION_TYPE.c_str());
  
  return true;
}

// ==================== NETWORK CONNECTION ====================

void connectToNetwork() {
  Serial.println("\n🌐 Connecting to network...");
  
  if (CONNECTION_TYPE == "ethernet") {
    connectEthernet();
  } else if (CONNECTION_TYPE == "wifi") {
    connectWiFi();
  }
}

void connectEthernet() {
  Serial.println("📡 Connecting via Ethernet...");
  
  Ethernet.init(ETH_CS);
  byte mac[6];
  WiFi.macAddress(mac);
  
  if (Ethernet.begin(mac) == 0) {
    IPAddress ip(192, 168, 100, 10);
    IPAddress dns(192, 168, 100, 1);
    IPAddress gateway(192, 168, 100, 1);
    IPAddress subnet(255, 255, 255, 0);
    Ethernet.begin(mac, ip, dns, gateway, subnet);
  }
  
  delay(2000);
  
  if (Ethernet.linkStatus() == LinkON) {
    Serial.println("✅ Ethernet connected");
    Serial.printf("   IP: %s\n", Ethernet.localIP().toString().c_str());
    isConnected = true;
    blinkLED(LED_GREEN, 3);
  } else {
    Serial.println("❌ Ethernet connection failed");
    digitalWrite(LED_RED, HIGH);
  }
}

void connectWiFi() {
  Serial.println("📡 Connecting via WiFi...");
  
  const char* ssid = WIFI_SSID_FROM_CONFIG.length() > 0 ? 
                     WIFI_SSID_FROM_CONFIG.c_str() : WIFI_SSID;
  const char* password = WIFI_PASSWORD_FROM_CONFIG.length() > 0 ? 
                         WIFI_PASSWORD_FROM_CONFIG.c_str() : WIFI_PASSWORD;
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected");
    Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
    isConnected = true;
    blinkLED(LED_GREEN, 3);
  } else {
    Serial.println("\n❌ WiFi connection failed");
    digitalWrite(LED_RED, HIGH);
  }
}

// ==================== FIREBASE INITIALIZATION ====================

void initFirebase() {
  Serial.println("\n🔥 Initializing Firebase...");
  
  config.database_url = FIREBASE_DATABASE_URL;
  config.signer.test_mode = true;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  delay(1000);
  
  if (Firebase.ready()) {
    Serial.println("✅ Firebase connected");
    firebaseReady = true;
    
    String path = "/devices/" + DEVICE_ID + "/info/status";
    Firebase.RTDB.setString(&fbdo, path.c_str(), "online");
  }
}

// ==================== SENSOR DATA ====================

void sendSensorData() {
  if (!firebaseReady) return;
  
  float temperature = 25.0 + random(-50, 50) / 10.0;
  float humidity = 60.0 + random(-100, 100) / 10.0;
  
  DynamicJsonDocument doc(512);
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["timestamp"] = millis();
  doc["device_id"] = DEVICE_ID;
  
  String path = "/devices/" + DEVICE_ID + "/sensor_history/" + String(sensorBufferIndex);
  String jsonData;
  serializeJson(doc, jsonData);
  
  if (Firebase.RTDB.setString(&fbdo, path.c_str(), jsonData.c_str())) {
    Serial.printf("📊 Sensor data sent [%d]\n", sensorBufferIndex);
    sensorBufferIndex = (sensorBufferIndex + 1) % BUFFER_SIZE;
  }
}

// ==================== DATA SERVER FOR LAPTOP 2 ====================

void setupDataServer() {
  server.on("/api/sensor-data", HTTP_POST, handleSensorDataFromLaptop2);
  server.on("/api/device-status", HTTP_GET, handleDeviceStatus);
  server.begin();
  
  Serial.println("\n📡 HTTP Data Server Ready");
  Serial.printf("   POST http://%s/api/sensor-data\n", Ethernet.localIP().toString().c_str());
}

void handleSensorDataFromLaptop2() {
  String body = server.arg("plain");
  Serial.println("\n📥 Received data from Laptop 2");
  
  DynamicJsonDocument doc(2048);
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{\"success\":false}");
    return;
  }
  
  String sensorType = doc["sensor_type"].as<String>();
  float value = doc["value"];
  
  Serial.printf("   Type: %s, Value: %.2f\n", sensorType.c_str(), value);
  
  if (firebaseReady) {
    String path = "/devices/" + DEVICE_ID + "/sensor_history/" + String(sensorBufferIndex);
    String jsonData;
    serializeJson(doc, jsonData);
    
    if (Firebase.RTDB.setString(&fbdo, path.c_str(), jsonData.c_str())) {
      Serial.println("✅ Forwarded to Firebase");
      sensorBufferIndex = (sensorBufferIndex + 1) % BUFFER_SIZE;
      blinkLED(LED_GREEN, 2);
      server.send(200, "application/json", "{\"success\":true}");
    } else {
      server.send(500, "application/json", "{\"success\":false}");
    }
  } else {
    server.send(503, "application/json", "{\"success\":false}");
  }
}

void handleDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["device_id"] = DEVICE_ID;
  doc["status"] = isConnected ? "online" : "offline";
  doc["firebase_ready"] = firebaseReady;
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

// ==================== UTILITY FUNCTIONS ====================

String getMACAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

String readFile(const char* path) {
  if (!SPIFFS.exists(path)) return "";
  File file = SPIFFS.open(path, "r");
  if (!file) return "";
  String content = file.readString();
  file.close();
  return content;
}

bool saveFile(const char* path, const String& content) {
  File file = SPIFFS.open(path, "w");
  if (!file) return false;
  size_t written = file.print(content);
  file.close();
  return written == content.length();
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
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
