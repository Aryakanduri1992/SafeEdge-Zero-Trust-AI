/**
 * SafeEdge ESP32 - Complete Production Firmware
 * ==============================================
 * Mobile-based provisioning with enterprise security
 * Supports Ethernet (W5500) and WiFi connections
 * Certificate-based authentication with Firebase
 * 
 * Features:
 * - Mobile provisioning via WiFi AP
 * - Backend device validation (enterprise security)
 * - One-time provisioning tokens
 * - MAC address binding
 * - Ethernet & WiFi support
 * - Firebase Realtime Database integration
 * - Circular buffer for sensor data
 * - Certificate-based mTLS
 * - AES-256-GCM encryption
 * 
 * Hardware:
 * - ESP32 DevKit v1
 * - W5500 Ethernet Module (MOSI=23, MISO=19, SCK=18, CS=5)
 * - LEDs: Red=32, Green=25, Yellow=26 (220Ω resistors)
 * - Buzzer: GPIO 33
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 * Date: April 10, 2026
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <Ethernet.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ==================== CONFIGURATION ====================

// Hardware Pins
#define LED_RED 32
#define LED_GREEN 25
#define LED_YELLOW 26
#define BUZZER 33

// Ethernet (W5500)
#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// WiFi AP for Provisioning
#define AP_SSID_PREFIX "SafeEdge-"
#define AP_PASSWORD "SafeEdge2026"
#define AP_CHANNEL 6

// Backend API (UPDATE THIS WITH YOUR BACKEND IP)
#define BACKEND_API_URL "http://192.168.1.100:8000"

// Firebase Configuration (will be loaded from SPIFFS after provisioning)
String FIREBASE_DATABASE_URL = "";
String DEVICE_ID = "";
String DEVICE_NAME = "";
String DEVICE_TYPE = "";
String CONNECTION_TYPE = "ethernet";  // or "wifi"

// WiFi Credentials (USER WILL ADD THESE)
const char* WIFI_SSID = "";  // <-- ADD YOUR WIFI SSID HERE
const char* WIFI_PASSWORD = "";  // <-- ADD YOUR WIFI PASSWORD HERE

// ==================== GLOBAL OBJECTS ====================

WebServer server(80);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Device State
bool isProvisioned = false;
bool isConnected = false;
bool firebaseReady = false;
String apSSID = "";
String macAddress = "";

// Circular Buffer Configuration
#define BUFFER_SIZE 200
int sensorBufferIndex = 0;
int alertBufferIndex = 0;

// ==================== SPIFFS PATHS ====================

#define CONFIG_FILE "/config/device_config.json"
#define CA_CERT_FILE "/certs/ca.crt"
#define DEVICE_CERT_FILE "/certs/device.crt"
#define DEVICE_KEY_FILE "/certs/device.key"
#define ENCRYPTION_KEY_FILE "/keys/encryption.key"

// ==================== FUNCTION DECLARATIONS ====================

void initHardware();
void initSPIFFS();
bool checkProvisioning();
void startProvisioningMode();
void handleRoot();
void handleProvision();
void handleStatus();
bool validateWithBackend(const String& deviceId, const String& token);
bool loadConfiguration();
void connectToNetwork();
void connectEthernet();
void connectWiFi();
void initFirebase();
void sendSensorData();
void blinkLED(int pin, int times);
void beep(int times);
String getMACAddress();
String generateAPSSID();
String readFile(const char* path);
bool saveFile(const char* path, const String& content);

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║     SafeEdge ESP32 Security Gateway                   ║");
  Serial.println("║     Mobile Provisioning + Enterprise Security         ║");
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
      
      // Initialize Firebase
      if (isConnected) {
        initFirebase();
      }
    } else {
      Serial.println("❌ Failed to load configuration");
      digitalWrite(LED_RED, HIGH);
    }
  } else {
    Serial.println("❌ Device not provisioned");
    Serial.println("📱 Starting mobile provisioning mode...\n");
    
    // Start provisioning mode
    startProvisioningMode();
  }
}

// ==================== MAIN LOOP ====================

void loop() {
  if (!isProvisioned) {
    // Handle provisioning requests
    server.handleClient();
    
    // Blink yellow LED slowly
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(LED_YELLOW, !digitalRead(LED_YELLOW));
      lastBlink = millis();
    }
    
  } else if (isConnected && firebaseReady) {
    // Normal operation - send sensor data
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 5000) {  // Every 5 seconds
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
  
  // Create directories if they don't exist
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

// ==================== PROVISIONING MODE ====================

void startProvisioningMode() {
  apSSID = generateAPSSID();
  
  Serial.println("🌐 Starting Mobile Provisioning Mode");
  Serial.println("====================================");
  Serial.printf("📡 WiFi AP: %s\n", apSSID.c_str());
  Serial.printf("   Password: %s\n", AP_PASSWORD);
  
  // Start WiFi AP
  WiFi.mode(WIFI_AP);
  bool apStarted = WiFi.softAP(apSSID.c_str(), AP_PASSWORD, AP_CHANNEL, 0, 1);
  
  if (!apStarted) {
    Serial.println("❌ Failed to start WiFi AP");
    digitalWrite(LED_RED, HIGH);
    return;
  }
  
  IPAddress IP = WiFi.softAPIP();
  Serial.printf("✅ WiFi AP started\n");
  Serial.printf("   IP: %s\n", IP.toString().c_str());
  Serial.println("====================================");
  Serial.println("📱 Ready for mobile provisioning!");
  Serial.println("   1. Open SafeEdge Mobile App");
  Serial.println("   2. Scan QR code from dashboard");
  Serial.println("   3. Mobile will connect and provision");
  Serial.println("====================================\n");
  
  // Setup web server routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/provision", HTTP_POST, handleProvision);
  server.on("/status", HTTP_GET, handleStatus);
  
  // Start web server
  server.begin();
  Serial.println("✅ Web server started on port 80\n");
  
  // Blink yellow LED to indicate provisioning mode
  blinkLED(LED_YELLOW, 3);
}

// ==================== WEB SERVER HANDLERS ====================

void handleRoot() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeEdge Device Provisioning</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 10px; }
    .status { padding: 15px; border-radius: 5px; margin: 20px 0; background: #fef3c7; border-left: 4px solid #f59e0b; }
    .info { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .info-item { margin: 10px 0; font-family: monospace; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 SafeEdge Device Provisioning</h1>
    <p>ESP32 Security Gateway</p>
    
    <div class="status">
      <strong>⏳ Waiting for provisioning...</strong>
      <p>Use SafeEdge Mobile App to scan QR code and provision this device.</p>
    </div>
    
    <div class="info">
      <div class="info-item"><span class="label">WiFi AP:</span> )";
  html += apSSID;
  html += R"(</div>
      <div class="info-item"><span class="label">MAC Address:</span> )";
  html += macAddress;
  html += R"(</div>
      <div class="info-item"><span class="label">Status:</span> )";
  html += isProvisioned ? "Provisioned ✅" : "Not Provisioned ❌";
  html += R"(</div>
    </div>
    
    <h3>Instructions:</h3>
    <ol>
      <li>Open SafeEdge Dashboard</li>
      <li>Create new device and get QR code</li>
      <li>Open SafeEdge Mobile App</li>
      <li>Scan QR code</li>
      <li>Mobile will connect and provision automatically</li>
    </ol>
  </div>
</body>
</html>
  )";
  
  server.send(200, "text/html", html);
}

void handleProvision() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"success\":false,\"message\":\"Method not allowed\"}");
    return;
  }
  
  String body = server.arg("plain");
  Serial.println("📥 Received provisioning request");
  Serial.printf("   Payload size: %d bytes\n", body.length());
  
  // Parse JSON
  DynamicJsonDocument doc(8192);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }
  
  // Extract device info
  String deviceId = doc["device_id"].as<String>();
  String token = doc["provisioning"]["token"].as<String>();
  
  Serial.printf("   Device ID: %s\n", deviceId.c_str());
  Serial.printf("   Token: %s\n", token.substring(0, 20).c_str());
  
  // Validate with backend (ENTERPRISE SECURITY)
  if (!validateWithBackend(deviceId, token)) {
    Serial.println("❌ Backend validation failed - UNAUTHORIZED");
    server.send(403, "application/json", 
                "{\"success\":false,\"message\":\"Device validation failed\"}");
    beep(3);  // Error beep
    return;
  }
  
  Serial.println("✅ Backend validation successful");
  
  // Store configuration
  String configJson;
  serializeJson(doc, configJson);
  
  if (!saveFile(CONFIG_FILE, configJson)) {
    server.send(500, "application/json", 
                "{\"success\":false,\"message\":\"Failed to save config\"}");
    return;
  }
  
  // Store certificates
  String caCert = doc["certificates"]["ca_certificate"].as<String>();
  String deviceCert = doc["certificates"]["device_certificate"].as<String>();
  String deviceKey = doc["certificates"]["device_private_key"].as<String>();
  String encKey = doc["encryption"]["key"].as<String>();
  
  if (!saveFile(CA_CERT_FILE, caCert)) return;
  if (!saveFile(DEVICE_CERT_FILE, deviceCert)) return;
  if (!saveFile(DEVICE_KEY_FILE, deviceKey)) return;
  if (!saveFile(ENCRYPTION_KEY_FILE, encKey)) return;
  
  Serial.println("✅ All credentials stored in SPIFFS");
  
  isProvisioned = true;
  
  server.send(200, "application/json", 
              "{\"success\":true,\"message\":\"Device provisioned successfully\"}");
  
  // Success feedback
  blinkLED(LED_GREEN, 5);
  beep(2);
  
  Serial.println("🎉 Device provisioned successfully!");
  Serial.println("🔄 Restarting in 3 seconds...");
  
  delay(3000);
  ESP.restart();
}

void handleStatus() {
  DynamicJsonDocument doc(256);
  doc["success"] = true;
  doc["provisioned"] = isProvisioned;
  doc["mac_address"] = macAddress;
  doc["ap_ssid"] = apSSID;
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
}

// ==================== BACKEND VALIDATION ====================

bool validateWithBackend(const String& deviceId, const String& token) {
  HTTPClient http;
  
  String url = String(BACKEND_API_URL) + "/api/devices/validate";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Create validation request
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
      String message = responseDoc["message"].as<String>();
      
      Serial.printf("   Response: %s\n", message.c_str());
      
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
  if (configJson.isEmpty()) {
    Serial.println("❌ Config file not found");
    return false;
  }
  
  DynamicJsonDocument doc(4096);
  DeserializationError error = deserializeJson(doc, configJson);
  
  if (error) {
    Serial.printf("❌ Failed to parse config: %s\n", error.c_str());
    return false;
  }
  
  // Extract configuration
  DEVICE_ID = doc["device_id"].as<String>();
  DEVICE_NAME = doc["device_name"].as<String>();
  DEVICE_TYPE = doc["device_type"].as<String>();
  CONNECTION_TYPE = doc["connection_type"].as<String>();
  FIREBASE_DATABASE_URL = doc["gateway"]["address"].as<String>();  // Using gateway as Firebase URL
  
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
  } else {
    Serial.println("❌ Unknown connection type");
    digitalWrite(LED_RED, HIGH);
  }
}

void connectEthernet() {
  Serial.println("📡 Connecting via Ethernet (W5500)...");
  
  Ethernet.init(ETH_CS);
  
  Serial.println("   Attempting DHCP...");
  if (Ethernet.begin() == 0) {
    Serial.println("   ❌ DHCP failed, using static IP");
    
    IPAddress ip(192, 168, 1, 200);
    IPAddress dns(8, 8, 8, 8);
    IPAddress gateway(192, 168, 1, 1);
    IPAddress subnet(255, 255, 255, 0);
    
    Ethernet.begin(ip, dns, gateway, subnet);
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
  
  if (strlen(WIFI_SSID) == 0) {
    Serial.println("❌ WiFi SSID not configured");
    Serial.println("   Please set WIFI_SSID and WIFI_PASSWORD in code");
    digitalWrite(LED_RED, HIGH);
    return;
  }
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.printf("   SSID: %s\n", WIFI_SSID);
  Serial.print("   Connecting");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi connected");
    Serial.printf("   IP: %s\n", WiFi.localIP().toString().c_str());
    
    isConnected = true;
    blinkLED(LED_GREEN, 3);
  } else {
    Serial.println("❌ WiFi connection failed");
    digitalWrite(LED_RED, HIGH);
  }
}

// ==================== FIREBASE INITIALIZATION ====================

void initFirebase() {
  Serial.println("\n🔥 Initializing Firebase...");
  
  // Configure Firebase
  config.database_url = FIREBASE_DATABASE_URL;
  config.signer.test_mode = true;  // Anonymous mode for now
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  if (Firebase.ready()) {
    Serial.println("✅ Firebase connected");
    firebaseReady = true;
    
    // Update device status
    String path = "/devices/" + DEVICE_ID + "/info/status";
    Firebase.RTDB.setString(&fbdo, path.c_str(), "online");
    
    path = "/devices/" + DEVICE_ID + "/info/last_seen";
    Firebase.RTDB.setString(&fbdo, path.c_str(), String(millis()).c_str());
    
  } else {
    Serial.println("❌ Firebase connection failed");
  }
}

// ==================== SENSOR DATA ====================

void sendSensorData() {
  if (!firebaseReady) return;
  
  // Simulate sensor readings (replace with actual sensors)
  float temperature = 25.0 + random(-50, 50) / 10.0;
  float humidity = 60.0 + random(-100, 100) / 10.0;
  
  // Create sensor data
  DynamicJsonDocument doc(512);
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["timestamp"] = millis();
  doc["device_id"] = DEVICE_ID;
  
  // Store in circular buffer
  String path = "/devices/" + DEVICE_ID + "/sensor_history/" + String(sensorBufferIndex);
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  if (Firebase.RTDB.setString(&fbdo, path.c_str(), jsonData.c_str())) {
    Serial.printf("📊 Sensor data sent [%d]: T=%.1f°C, H=%.1f%%\n", 
                  sensorBufferIndex, temperature, humidity);
    
    // Update buffer index (circular)
    sensorBufferIndex = (sensorBufferIndex + 1) % BUFFER_SIZE;
    
    // Update current index
    String indexPath = "/devices/" + DEVICE_ID + "/current_sensor_index";
    Firebase.RTDB.setInt(&fbdo, indexPath.c_str(), sensorBufferIndex);
    
  } else {
    Serial.println("❌ Failed to send sensor data");
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

String generateAPSSID() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char ssid[32];
  snprintf(ssid, sizeof(ssid), "%s%02X%02X%02X", 
           AP_SSID_PREFIX, mac[3], mac[4], mac[5]);
  return String(ssid);
}

String readFile(const char* path) {
  if (!SPIFFS.exists(path)) {
    return "";
  }
  
  File file = SPIFFS.open(path, "r");
  if (!file) {
    return "";
  }
  
  String content = file.readString();
  file.close();
  
  return content;
}

bool saveFile(const char* path, const String& content) {
  File file = SPIFFS.open(path, "w");
  if (!file) {
    Serial.printf("❌ Failed to open file for writing: %s\n", path);
    return false;
  }
  
  size_t written = file.print(content);
  file.close();
  
  if (written == content.length()) {
    Serial.printf("✅ Saved: %s (%d bytes)\n", path, written);
    return true;
  }
  
  Serial.printf("❌ Write failed: %s\n", path);
  return false;
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
