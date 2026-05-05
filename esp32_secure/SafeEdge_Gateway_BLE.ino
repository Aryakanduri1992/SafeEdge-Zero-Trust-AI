/**
 * SafeEdge ESP32 - Gateway with BLE Provisioning
 * ===============================================
 * - WiFi always connected (for Firebase)
 * - Bluetooth for device provisioning (multiple devices)
 * - Ethernet for receiving sensor data
 * - Simultaneous provisioning and data forwarding
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 * Date: April 15, 2026
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Ethernet.h>
#include <WebServer.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ==================== CONFIGURATION ====================

// WiFi Configuration (Always Connected)
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";

// Firebase Configuration
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// Backend API
#define BACKEND_API_URL "http://10.17.1.94:8000"

// Ethernet Configuration
#define ETH_STATIC_IP IPAddress(172, 20, 10, 10)
#define ETH_GATEWAY   IPAddress(172, 20, 10, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 240)
#define ETH_DNS       IPAddress(8, 8, 8, 8)

#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// BLE Configuration
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_PROVISION_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_STATUS_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Hardware Pins
#define LED_RED 32
#define LED_GREEN 25
#define LED_YELLOW 26
#define BUZZER 33

// ==================== GLOBAL VARIABLES ====================

WebServer server(80);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

BLEServer* pServer = NULL;
BLECharacteristic* pProvisionCharacteristic = NULL;
BLECharacteristic* pStatusCharacteristic = NULL;

bool wifiConnected = false;
bool ethernetConnected = false;
bool firebaseReady = false;
bool bleConnected = false;

String macAddress = "";
int provisionedDeviceCount = 0;
int sensorBufferIndex = 0;

#define BUFFER_SIZE 200
#define MAX_DEVICES 50

// Device Registry
struct ProvisionedDevice {
  String deviceId;
  String deviceName;
  String deviceType;
  unsigned long lastSeen;
  bool active;
};

ProvisionedDevice deviceRegistry[MAX_DEVICES];

// ==================== BLE CALLBACKS ====================

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
    
    // Restart advertising
    BLEDevice::startAdvertising();
    Serial.println("📡 BLE Advertising restarted");
  }
};

class ProvisionCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    
    if (value.length() > 0) {
      String jsonData = String(value.c_str());
      Serial.println("\n📥 Received provisioning data via BLE");
      
      // Parse and provision device
      if (provisionDevice(jsonData)) {
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

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║   SafeEdge ESP32 - Gateway with BLE Provisioning     ║");
  Serial.println("║   WiFi: Always On | BLE: Provisioning | Ethernet: Data║");
  Serial.println("║   Imagine Cup 2026 - World Championship               ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.println();
  
  initHardware();
  initSPIFFS();
  
  macAddress = getMACAddress();
  Serial.printf("📱 Gateway MAC: %s\n\n", macAddress.c_str());
  
  // Initialize device registry
  for (int i = 0; i < MAX_DEVICES; i++) {
    deviceRegistry[i].active = false;
  }
  
  // Connect WiFi (Always On)
  connectWiFi();
  
  // Initialize Firebase
  if (wifiConnected) {
    initFirebase();
  }
  
  // Connect Ethernet
  connectEthernet();
  
  // Setup HTTP Server
  if (ethernetConnected) {
    setupHTTPServer();
  }
  
  // Initialize BLE
  initBLE();
  
  printStatus();
  
  if (wifiConnected && ethernetConnected && firebaseReady) {
    Serial.println("🎉 Gateway fully operational!");
    Serial.println("   ✅ WiFi connected for Firebase");
    Serial.println("   ✅ Ethernet ready for sensor data");
    Serial.println("   ✅ BLE ready for provisioning");
    blinkLED(LED_GREEN, 5);
    beep(2);
  }
}

// ==================== MAIN LOOP ====================

void loop() {
  // Handle HTTP requests (sensor data)
  if (ethernetConnected) {
    server.handleClient();
  }
  
  // Monitor WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    digitalWrite(LED_RED, HIGH);
    Serial.println("⚠️  WiFi disconnected, reconnecting...");
    connectWiFi();
  } else {
    wifiConnected = true;
    digitalWrite(LED_RED, LOW);
  }
  
  // Monitor Ethernet connection
  if (Ethernet.linkStatus() != LinkON) {
    ethernetConnected = false;
  } else {
    ethernetConnected = true;
  }
  
  // BLE status indicator
  if (bleConnected) {
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(LED_YELLOW, !digitalRead(LED_YELLOW));
      lastBlink = millis();
    }
  }
  
  // Clean up inactive devices
  static unsigned long lastCleanup = 0;
  if (millis() - lastCleanup > 60000) { // Every minute
    cleanupInactiveDevices();
    lastCleanup = millis();
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

void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ SPIFFS initialization failed");
    digitalWrite(LED_RED, HIGH);
    while (1) delay(1000);
  }
  
  if (!SPIFFS.exists("/devices")) SPIFFS.mkdir("/devices");
  Serial.println("✅ SPIFFS initialized");
}

// ==================== WIFI CONNECTION ====================

void connectWiFi() {
  Serial.println("\n📡 Connecting to WiFi (Always On)...");
  Serial.printf("   SSID: %s\n", WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  Serial.print("   ");
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("✅ WiFi connected");
    Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Signal: %d dBm\n", WiFi.RSSI());
    blinkLED(LED_GREEN, 3);
  } else {
    wifiConnected = false;
    Serial.println("❌ WiFi connection failed");
    digitalWrite(LED_RED, HIGH);
  }
}

// ==================== ETHERNET CONNECTION ====================

void connectEthernet() {
  Serial.println("\n📡 Connecting Ethernet...");
  
  Ethernet.init(ETH_CS);
  
  byte mac[6];
  WiFi.macAddress(mac);
  
  Ethernet.begin(mac, ETH_STATIC_IP, ETH_DNS, ETH_GATEWAY, ETH_SUBNET);
  delay(2000);
  
  if (Ethernet.linkStatus() == LinkON) {
    ethernetConnected = true;
    Serial.println("✅ Ethernet connected");
    Serial.printf("   IP: %s\n", Ethernet.localIP().toString().c_str());
    blinkLED(LED_YELLOW, 3);
  } else {
    ethernetConnected = false;
    Serial.println("❌ Ethernet connection failed");
  }
}

// ==================== FIREBASE INITIALIZATION ====================

void initFirebase() {
  Serial.println("\n🔥 Initializing Firebase...");
  Serial.printf("   URL: %s\n", FIREBASE_URL);
  
  config.database_url = FIREBASE_URL;
  config.signer.test_mode = true;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  delay(1000);
  
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("✅ Firebase connected");
    
    String testPath = "/gateway/status";
    if (Firebase.RTDB.setString(&fbdo, testPath.c_str(), "online")) {
      Serial.println("✅ Firebase write test successful");
    }
  } else {
    firebaseReady = false;
    Serial.println("❌ Firebase connection failed");
  }
}

// ==================== BLE INITIALIZATION ====================

void initBLE() {
  Serial.println("\n📱 Initializing BLE...");
  
  BLEDevice::init("SafeEdge-Gateway");
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(BLE_SERVICE_UUID);
  
  // Provisioning characteristic (write)
  pProvisionCharacteristic = pService->createCharacteristic(
    BLE_PROVISION_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pProvisionCharacteristic->setCallbacks(new ProvisionCallbacks());
  
  // Status characteristic (read/notify)
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

// ==================== HTTP SERVER ====================

void setupHTTPServer() {
  Serial.println("\n🌐 Starting HTTP Server...");
  
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/sensor-data", HTTP_POST, handleSensorData);
  server.on("/api/device-status", HTTP_GET, handleDeviceStatus);
  server.on("/api/devices", HTTP_GET, handleDeviceList);
  server.enableCORS(true);
  server.begin();
  
  Serial.println("✅ HTTP Server started");
  Serial.printf("   Listening on: http://%s:80\n", Ethernet.localIP().toString().c_str());
}

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>SafeEdge Gateway</title></head><body>";
  html += "<h1>SafeEdge ESP32 Gateway</h1>";
  html += "<h2>Status</h2>";
  html += "<p><strong>WiFi:</strong> " + String(wifiConnected ? "Connected" : "Disconnected") + "</p>";
  html += "<p><strong>Ethernet:</strong> " + String(ethernetConnected ? "Connected" : "Disconnected") + "</p>";
  html += "<p><strong>Firebase:</strong> " + String(firebaseReady ? "Ready" : "Not Ready") + "</p>";
  html += "<p><strong>BLE:</strong> " + String(bleConnected ? "Client Connected" : "Advertising") + "</p>";
  html += "<h2>Provisioned Devices</h2>";
  html += "<p><strong>Count:</strong> " + String(provisionedDeviceCount) + "</p>";
  html += "<ul>";
  for (int i = 0; i < MAX_DEVICES; i++) {
    if (deviceRegistry[i].active) {
      html += "<li>" + deviceRegistry[i].deviceName + " (" + deviceRegistry[i].deviceId + ")</li>";
    }
  }
  html += "</ul>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleSensorData() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"success\":false}");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(4096);
  
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
    return;
  }
  
  String deviceId = doc["device_id"].as<String>();
  Serial.printf("\n📥 Data from: %s\n", deviceId.c_str());
  
  // Update device last seen
  updateDeviceLastSeen(deviceId);
  
  if (firebaseReady) {
    doc["gateway_mac"] = macAddress;
    doc["gateway_timestamp"] = millis();
    
    String path = "/devices/" + deviceId + "/sensor_history/" + String(sensorBufferIndex);
    String jsonData;
    serializeJson(doc, jsonData);
    
    if (Firebase.RTDB.setString(&fbdo, path.c_str(), jsonData.c_str())) {
      Serial.println("✅ Forwarded to Firebase");
      sensorBufferIndex = (sensorBufferIndex + 1) % BUFFER_SIZE;
      blinkLED(LED_GREEN, 1);
      server.send(200, "application/json", "{\"success\":true}");
    } else {
      Serial.println("❌ Firebase write failed");
      server.send(500, "application/json", "{\"success\":false,\"error\":\"Firebase write failed\"}");
    }
  } else {
    Serial.println("⚠️  Firebase not ready");
    server.send(503, "application/json", "{\"success\":false,\"error\":\"Firebase not ready\"}");
  }
}

void handleDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["success"] = true;
  doc["wifi"] = wifiConnected;
  doc["ethernet"] = ethernetConnected;
  doc["firebase"] = firebaseReady;
  doc["ble"] = bleConnected;
  doc["provisioned_devices"] = provisionedDeviceCount;
  doc["uptime"] = millis();
  
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

// ==================== DEVICE PROVISIONING ====================

bool provisionDevice(String jsonData) {
  DynamicJsonDocument doc(8192);
  
  if (deserializeJson(doc, jsonData)) {
    Serial.println("❌ Invalid JSON");
    return false;
  }
  
  String deviceId = doc["device_id"].as<String>();
  String deviceName = doc["device_name"].as<String>();
  String deviceType = doc["device_type"].as<String>();
  
  Serial.printf("📝 Provisioning: %s (%s)\n", deviceName.c_str(), deviceId.c_str());
  
  // Save to SPIFFS
  String filename = "/devices/" + deviceId + ".json";
  File file = SPIFFS.open(filename.c_str(), "w");
  if (!file) {
    Serial.println("❌ Failed to open file for writing");
    return false;
  }
  
  serializeJson(doc, file);
  file.close();
  
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
  
  // Validate with backend
  if (wifiConnected) {
    validateWithBackend(deviceId, jsonData);
  }
  
  Serial.printf("✅ Device provisioned (Total: %d)\n", provisionedDeviceCount);
  return true;
}

bool validateWithBackend(const String& deviceId, const String& token) {
  HTTPClient http;
  String url = String(BACKEND_API_URL) + "/api/devices/validate";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceId;
  doc["provisioning_token"] = token;
  doc["gateway_mac"] = macAddress;
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  bool valid = (httpCode == 200);
  
  http.end();
  return valid;
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

String getMACAddress() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    delay(100);
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

void printStatus() {
  Serial.println("\n============================================================");
  Serial.println("Gateway Status:");
  Serial.println("============================================================");
  Serial.printf("WiFi:     %s\n", wifiConnected ? "✅ Connected" : "❌ Disconnected");
  Serial.printf("Ethernet: %s\n", ethernetConnected ? "✅ Connected" : "❌ Disconnected");
  Serial.printf("Firebase: %s\n", firebaseReady ? "✅ Ready" : "❌ Not Ready");
  Serial.printf("BLE:      %s\n", "✅ Advertising");
  Serial.printf("Devices:  %d provisioned\n", provisionedDeviceCount);
  Serial.println("============================================================\n");
}
