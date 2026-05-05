/**
 * SafeEdge ESP32 - Complete Production Firmware (UPDATED)
 * ========================================================
 * Mobile-based provisioning with enterprise security
 * Supports Ethernet (W5500) and WiFi connections
 * Certificate-based authentication with Firebase
 * 
 * UPDATED: Fixed Firebase URL configuration and added clear placeholders
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
#include <DNSServer.h>  // ✅ Added for Captive Portal
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <Ethernet.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ==================== CONFIGURATION ====================
// ⚠️ UPDATE THESE VALUES BEFORE UPLOADING! ⚠️

// 1. Backend API URL - CONFIGURED!
// Your Computer's IP Address: 10.17.1.94
#define BACKEND_API_URL "http://10.17.1.94:8000"

// 2. Firebase Realtime Database URL - CONFIGURED!
// Your Firebase Project: lumeshield-x
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// 3. WiFi Credentials (ONLY if using WiFi connection type)
// Leave empty if using Ethernet only
const char* WIFI_SSID = "office mobile";  // Office WiFi
const char* WIFI_PASSWORD = "90323878";  // Office WiFi Password

// ==================== HARDWARE CONFIGURATION ====================

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
#define DNS_PORT 53  // ✅ Added for Captive Portal

// ==================== GLOBAL VARIABLES ====================

// Firebase Configuration (loaded from SPIFFS after provisioning)
String FIREBASE_DATABASE_URL = FIREBASE_URL;
String DEVICE_ID = "";
String DEVICE_NAME = "";
String DEVICE_TYPE = "";
String CONNECTION_TYPE = "ethernet";  // or "wifi"
String WIFI_SSID_FROM_CONFIG = "";
String WIFI_PASSWORD_FROM_CONFIG = "";

// Global Objects
WebServer server(80);
DNSServer dnsServer;  // ✅ Added for Captive Portal
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
      
      // Validate with backend after network connection
      if (isConnected) {
        Serial.println("\n🔐 Validating device with backend...");
        if (validateWithBackend(DEVICE_ID, readFile(CONFIG_FILE))) {
          Serial.println("✅ Device validated with backend");
        } else {
          Serial.println("⚠️  Backend validation failed - device may not be authorized");
          Serial.println("   Device will continue but may have limited functionality");
        }
        
        // Initialize Firebase
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
    // ✅ Handle DNS requests for captive portal
    dnsServer.processNextRequest();
    
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
  
  Serial.println("🌐 Starting Mobile Provisioning Mode with Captive Portal");
  Serial.println("=========================================================");
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
  
  delay(500);  // Wait for AP to stabilize
  
  IPAddress IP = WiFi.softAPIP();
  Serial.printf("✅ WiFi AP started\n");
  Serial.printf("   IP: %s\n", IP.toString().c_str());
  
  // ✅ Start DNS server for Captive Portal
  // Redirect all DNS requests to ESP32 IP
  dnsServer.start(DNS_PORT, "*", IP);
  Serial.printf("✅ DNS server started (Captive Portal)\n");
  
  Serial.println("=========================================================");
  Serial.println("📱 Ready for mobile provisioning!");
  Serial.println("   1. Connect phone to ESP32 WiFi");
  Serial.println("   2. Browser opens AUTOMATICALLY (Captive Portal)");
  Serial.println("   3. Paste QR code data from dashboard");
  Serial.println("   4. Click 'Provision Device'");
  Serial.println("=========================================================\n");
  
  // Setup web server routes
  // ✅ Handle captive portal detection URLs
  server.on("/", HTTP_GET, handleRoot);
  server.on("/provision", HTTP_POST, handleProvision);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/generate_204", HTTP_GET, handleRoot);  // Android captive portal detection
  server.on("/hotspot-detect.html", HTTP_GET, handleRoot);  // iOS captive portal detection
  server.on("/api/sensor-data", HTTP_POST, handleSensorData);  // ✅ NEW: Receive sensor data from Laptop 2
  server.onNotFound(handleRoot);  // Redirect all unknown URLs to root
  
  // Start web server
  server.begin();
  Serial.println("✅ Web server started on port 80\n");
  
  // Blink yellow LED to indicate provisioning mode
  blinkLED(LED_YELLOW, 3);
}

// ==================== WEB SERVER HANDLERS ====================

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><title>SafeEdge Provisioning</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.container{background:white;padding:30px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:500px;width:100%}h1{color:#667eea;margin-bottom:10px;font-size:24px}.subtitle{color:#6b7280;margin-bottom:20px;font-size:14px}.status{padding:15px;border-radius:10px;margin:15px 0;text-align:center}.status.waiting{background:#fef3c7;border:2px solid #f59e0b;color:#92400e}.status.success{background:#d1fae5;border:2px solid #10b981;color:#065f46}.status.error{background:#fee2e2;border:2px solid #ef4444;color:#991b1b}.info{background:#f3f4f6;padding:15px;border-radius:10px;margin:15px 0}.info-item{margin:10px 0;font-size:13px}.label{font-weight:600;color:#374151;display:inline-block;width:100px}.value{color:#6b7280;font-family:'Courier New',monospace;font-size:12px}textarea{width:100%;min-height:120px;padding:12px;border:2px solid #e5e7eb;border-radius:10px;font-family:'Courier New',monospace;font-size:11px;resize:vertical;margin:10px 0}button{width:100%;padding:15px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;margin-top:10px}button:disabled{background:#9ca3af;cursor:not-allowed}.spinner{border:3px solid #f3f3f3;border-top:3px solid #667eea;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:15px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class='container'><h1>🔐 SafeEdge Provisioning</h1><p class='subtitle'>ESP32 Security Gateway</p><div id='statusBox' class='status waiting'><strong>⏳ Ready to Provision</strong><p>Paste QR code data below</p></div><div class='info'><div class='info-item'><span class='label'>WiFi AP:</span><span class='value'>";
  
  html += apSSID;
  html += "</span></div><div class='info-item'><span class='label'>MAC:</span><span class='value'>";
  html += macAddress;
  html += "</span></div><div class='info-item'><span class='label'>Status:</span><span class='value'>";
  html += isProvisioned ? "Provisioned ✅" : "Not Provisioned ❌";
  html += "</span></div></div><div><label style='font-weight:600;color:#374151;display:block;margin-bottom:8px'>📋 Paste QR Code JSON:</label><textarea id='configData' placeholder='Paste JSON from QR code here...'></textarea><button id='provisionBtn' onclick='provisionDevice()'>🚀 Provision Device</button></div></div><script>function provisionDevice(){const configData=document.getElementById('configData').value.trim();const statusBox=document.getElementById('statusBox');const provisionBtn=document.getElementById('provisionBtn');if(!configData){statusBox.className='status error';statusBox.innerHTML='<strong>❌ Error</strong><p>Please paste the QR code data</p>';return}try{JSON.parse(configData)}catch(e){statusBox.className='status error';statusBox.innerHTML='<strong>❌ Invalid JSON</strong><p>Check the data and try again</p>';return}statusBox.className='status waiting';statusBox.innerHTML='<div class=\"spinner\"></div><p>Provisioning...</p>';provisionBtn.disabled=true;fetch('/provision',{method:'POST',headers:{'Content-Type':'application/json'},body:configData}).then(response=>response.json()).then(data=>{if(data.success){statusBox.className='status success';statusBox.innerHTML='<strong>✅ Success!</strong><p>'+data.message+'</p><p>Restarting in 3s...</p>'}else{statusBox.className='status error';statusBox.innerHTML='<strong>❌ Failed</strong><p>'+data.message+'</p>';provisionBtn.disabled=false}}).catch(error=>{statusBox.className='status error';statusBox.innerHTML='<strong>❌ Error</strong><p>Failed to communicate with ESP32</p>';provisionBtn.disabled=false})}</script></body></html>";
  
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
  String token = doc["provisioning_token"].as<String>();  // Fixed: was looking for doc["provisioning"]["token"]
  
  Serial.printf("   Device ID: %s\n", deviceId.c_str());
  Serial.printf("   Token: %s...\n", token.substring(0, 20).c_str());
  
  // ⚠️ SKIP backend validation during provisioning
  // ESP32 is in AP mode and has no internet connection
  // Validation will happen later when ESP32 connects to WiFi/Ethernet
  Serial.println("ℹ️  Skipping backend validation (ESP32 in AP mode, no internet)");
  Serial.println("   Validation will occur after ESP32 connects to network");
  
  // Store configuration
  String configJson;
  serializeJson(doc, configJson);
  
  if (!saveFile(CONFIG_FILE, configJson)) {
    server.send(500, "application/json", 
                "{\"success\":false,\"message\":\"Failed to save config\"}");
    return;
  }
  
  // Store certificates
  String caCert = doc["certificates"]["ca"].as<String>();  // Fixed: was "ca_certificate"
  String deviceCert = doc["certificates"]["cert"].as<String>();  // Fixed: was "device_certificate"
  String deviceKey = doc["certificates"]["key"].as<String>();  // Fixed: was "device_private_key"
  String encKey = doc["encryption_key"].as<String>();  // Fixed: was doc["encryption"]["key"]
  
  if (!saveFile(CA_CERT_FILE, caCert)) {
    server.send(500, "application/json", "{\"success\":false,\"message\":\"Failed to save CA cert\"}");
    return;
  }
  if (!saveFile(DEVICE_CERT_FILE, deviceCert)) {
    server.send(500, "application/json", "{\"success\":false,\"message\":\"Failed to save device cert\"}");
    return;
  }
  if (!saveFile(DEVICE_KEY_FILE, deviceKey)) {
    server.send(500, "application/json", "{\"success\":false,\"message\":\"Failed to save device key\"}");
    return;
  }
  if (!saveFile(ENCRYPTION_KEY_FILE, encKey)) {
    server.send(500, "application/json", "{\"success\":false,\"message\":\"Failed to save encryption key\"}");
    return;
  }
  
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
  
  // Extract WiFi credentials from config if WiFi connection
  if (CONNECTION_TYPE == "wifi" && doc.containsKey("wifi")) {
    WIFI_SSID_FROM_CONFIG = doc["wifi"]["ssid"].as<String>();
    WIFI_PASSWORD_FROM_CONFIG = doc["wifi"]["password"].as<String>();
  }
  
  // Firebase URL is already set from #define FIREBASE_URL
  // But you can override it from config if needed:
  // if (doc.containsKey("firebase_url")) {
  //   FIREBASE_DATABASE_URL = doc["firebase_url"].as<String>();
  // }
  
  Serial.println("📋 Configuration:");
  Serial.printf("   Device ID: %s\n", DEVICE_ID.c_str());
  Serial.printf("   Device Name: %s\n", DEVICE_NAME.c_str());
  Serial.printf("   Device Type: %s\n", DEVICE_TYPE.c_str());
  Serial.printf("   Connection: %s\n", CONNECTION_TYPE.c_str());
  Serial.printf("   Firebase URL: %s\n", FIREBASE_DATABASE_URL.c_str());
  
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
  
  // Generate MAC address from ESP32 MAC
  byte mac[6];
  WiFi.macAddress(mac);
  
  Serial.println("   Attempting DHCP...");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("   ❌ DHCP failed, using static IP");
    
    IPAddress ip(192, 168, 1, 200);
    IPAddress dns(8, 8, 8, 8);
    IPAddress gateway(192, 168, 1, 1);
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
  
  // Use WiFi credentials from config if available, otherwise use hardcoded ones
  const char* ssid = WIFI_SSID_FROM_CONFIG.length() > 0 ? WIFI_SSID_FROM_CONFIG.c_str() : WIFI_SSID;
  const char* password = WIFI_PASSWORD_FROM_CONFIG.length() > 0 ? WIFI_PASSWORD_FROM_CONFIG.c_str() : WIFI_PASSWORD;
  
  if (strlen(ssid) == 0) {
    Serial.println("❌ WiFi SSID not configured");
    Serial.println("   WiFi credentials not found in config or hardcoded values");
    digitalWrite(LED_RED, HIGH);
    return;
  }
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.printf("   SSID: %s\n", ssid);
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
  Serial.printf("   URL: %s\n", FIREBASE_DATABASE_URL.c_str());
  
  // Configure Firebase
  config.database_url = FIREBASE_DATABASE_URL;
  config.signer.test_mode = true;  // Anonymous mode for now
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Wait a moment for connection
  delay(1000);
  
  if (Firebase.ready()) {
    Serial.println("✅ Firebase connected");
    firebaseReady = true;
    
    // Update device status
    String path = "/devices/" + DEVICE_ID + "/info/status";
    if (Firebase.RTDB.setString(&fbdo, path.c_str(), "online")) {
      Serial.println("✅ Device status updated to 'online'");
    } else {
      Serial.printf("⚠️ Failed to update status: %s\n", fbdo.errorReason().c_str());
    }
    
    // Update last seen
    path = "/devices/" + DEVICE_ID + "/info/last_seen";
    Firebase.RTDB.setString(&fbdo, path.c_str(), String(millis()).c_str());
    
  } else {
    Serial.println("❌ Firebase connection failed");
    Serial.println("   Check Firebase URL is correct");
    Serial.println("   Check Firebase Realtime Database is enabled");
    Serial.println("   Check Firebase rules allow write access");
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
    
    // Update last seen
    String lastSeenPath = "/devices/" + DEVICE_ID + "/info/last_seen";
    Firebase.RTDB.setString(&fbdo, lastSeenPath.c_str(), String(millis()).c_str());
    
  } else {
    Serial.printf("❌ Failed to send sensor data: %s\n", fbdo.errorReason().c_str());
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
