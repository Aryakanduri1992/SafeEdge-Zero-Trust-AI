/**
 * SafeEdge ESP32 - Dual Interface Gateway (CORRECT ARCHITECTURE)
 * ===============================================================
 * WiFi Interface: Connects to Firebase Cloud
 * Ethernet Interface: Receives data from Laptop 2 (virtual IoT devices)
 * 
 * Network Setup:
 * - WiFi: Connects to "office mobile" for internet/Firebase access
 * - Ethernet: Static IP 192.168.100.10 for receiving from Laptop 2
 * 
 * Data Flow:
 * Laptop 2 (192.168.100.12) → [Ethernet] → ESP32 → [WiFi] → Firebase → Dashboard
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
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ==================== CONFIGURATION ====================

// WiFi Configuration (for Firebase/Internet access)
const char* WIFI_SSID = "office mobile";
const char* WIFI_PASSWORD = "90323878";

// Firebase Configuration
#define FIREBASE_URL "https://lumeshield-x-default-rtdb.firebaseio.com"

// Ethernet Configuration (for Laptop 2)
#define ETH_STATIC_IP IPAddress(192, 168, 100, 10)
#define ETH_GATEWAY   IPAddress(192, 168, 100, 1)
#define ETH_SUBNET    IPAddress(255, 255, 255, 0)
#define ETH_DNS       IPAddress(8, 8, 8, 8)

// ==================== HARDWARE PINS ====================

// LED Pins
#define LED_RED 32
#define LED_GREEN 25
#define LED_YELLOW 26
#define BUZZER 33

// Ethernet (W5500) Pins
#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// ==================== GLOBAL VARIABLES ====================

// Web Server (runs on Ethernet interface)
WebServer server(80);

// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool firebaseReady = false;

// Network Status
bool wifiConnected = false;
bool ethernetConnected = false;

// Device Info
String macAddress = "";

// Circular Buffer
#define BUFFER_SIZE 200
int sensorBufferIndex = 0;

// ==================== FUNCTION DECLARATIONS ====================

void initHardware();
void initSPIFFS();
void connectWiFi();
void connectEthernet();
void initFirebase();
void setupHTTPServer();
void handleSensorData();
void handleDeviceStatus();
void handleRoot();
void blinkLED(int pin, int times);
void beep(int times);
String getMACAddress();

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n");
  Serial.println("╔════════════════════════════════════════════════════════╗");
  Serial.println("║     SafeEdge ESP32 - Dual Interface Gateway          ║");
  Serial.println("║     WiFi: Firebase | Ethernet: Laptop 2              ║");
  Serial.println("║     Imagine Cup 2026 - World Championship             ║");
  Serial.println("╚════════════════════════════════════════════════════════╝");
  Serial.println();
  
  // Initialize hardware
  initHardware();
  
  // Initialize SPIFFS
  initSPIFFS();
  
  // Get MAC address
  macAddress = getMACAddress();
  Serial.printf("📱 MAC Address: %s\n\n", macAddress.c_str());
  
  // Connect WiFi (for Firebase/Internet)
  connectWiFi();
  
  // Connect Ethernet (for Laptop 2)
  connectEthernet();
  
  // Initialize Firebase (via WiFi)
  if (wifiConnected) {
    initFirebase();
  }
  
  // Setup HTTP Server (on Ethernet)
  if (ethernetConnected) {
    setupHTTPServer();
  }
  
  // Status check
  Serial.println("\n" + String("=").repeat(60));
  Serial.println("Gateway Status:");
  Serial.println(String("=").repeat(60));
  Serial.printf("WiFi:     %s\n", wifiConnected ? "✅ Connected" : "❌ Disconnected");
  Serial.printf("Ethernet: %s\n", ethernetConnected ? "✅ Connected" : "❌ Disconnected");
  Serial.printf("Firebase: %s\n", firebaseReady ? "✅ Ready" : "❌ Not Ready");
  Serial.println(String("=").repeat(60) + "\n");
  
  if (wifiConnected && ethernetConnected && firebaseReady) {
    Serial.println("🎉 Gateway fully operational!");
    Serial.println("   Ready to receive data from Laptop 2 and forward to Firebase\n");
    blinkLED(LED_GREEN, 5);
    beep(2);
  } else {
    Serial.println("⚠️  Gateway partially operational");
    digitalWrite(LED_YELLOW, HIGH);
  }
}

// ==================== MAIN LOOP ====================

void loop() {
  // Handle HTTP requests from Laptop 2 (via Ethernet)
  if (ethernetConnected) {
    server.handleClient();
  }
  
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    Serial.println("⚠️  WiFi disconnected, attempting reconnect...");
    connectWiFi();
  } else {
    wifiConnected = true;
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, HIGH);
  }
  
  // Check Ethernet link
  if (Ethernet.linkStatus() != LinkON) {
    ethernetConnected = false;
    digitalWrite(LED_YELLOW, HIGH);
  } else {
    ethernetConnected = true;
    digitalWrite(LED_YELLOW, LOW);
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
  
  Serial.println("✅ SPIFFS initialized");
}

// ==================== WIFI CONNECTION ====================

void connectWiFi() {
  Serial.println("\n📡 Connecting to WiFi (for Firebase/Internet)...");
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
    Serial.printf("   IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Gateway: %s\n", WiFi.gatewayIP().toString().c_str());
    Serial.printf("   DNS: %s\n", WiFi.dnsIP().toString().c_str());
    Serial.printf("   Signal: %d dBm\n", WiFi.RSSI());
    blinkLED(LED_GREEN, 3);
  } else {
    wifiConnected = false;
    Serial.println("❌ WiFi connection failed");
    Serial.println("   Gateway will operate in limited mode");
    digitalWrite(LED_RED, HIGH);
  }
}

// ==================== ETHERNET CONNECTION ====================

void connectEthernet() {
  Serial.println("\n📡 Connecting Ethernet (for Laptop 2)...");
  
  Ethernet.init(ETH_CS);
  
  // Generate MAC address from ESP32
  byte mac[6];
  WiFi.macAddress(mac);
  
  // Use static IP for Ethernet
  Ethernet.begin(mac, ETH_STATIC_IP, ETH_DNS, ETH_GATEWAY, ETH_SUBNET);
  
  delay(2000);
  
  if (Ethernet.linkStatus() == LinkON) {
    ethernetConnected = true;
    Serial.println("✅ Ethernet connected");
    Serial.printf("   IP Address: %s\n", Ethernet.localIP().toString().c_str());
    Serial.printf("   Gateway: %s\n", ETH_GATEWAY.toString().c_str());
    Serial.printf("   Subnet: %s\n", ETH_SUBNET.toString().c_str());
    Serial.printf("   MAC: %02X:%02X:%02X:%02X:%02X:%02X\n", 
                  mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    blinkLED(LED_YELLOW, 3);
  } else {
    ethernetConnected = false;
    Serial.println("❌ Ethernet connection failed");
    Serial.println("   Check cable connection to Laptop 2");
    digitalWrite(LED_YELLOW, HIGH);
  }
}

// ==================== FIREBASE INITIALIZATION ====================

void initFirebase() {
  Serial.println("\n🔥 Initializing Firebase (via WiFi)...");
  Serial.printf("   URL: %s\n", FIREBASE_URL);
  
  config.database_url = FIREBASE_URL;
  config.signer.test_mode = true;  // Anonymous mode
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  delay(1000);
  
  if (Firebase.ready()) {
    firebaseReady = true;
    Serial.println("✅ Firebase connected");
    
    // Test write
    String testPath = "/gateway/status";
    if (Firebase.RTDB.setString(&fbdo, testPath.c_str(), "online")) {
      Serial.println("✅ Firebase write test successful");
    } else {
      Serial.printf("⚠️  Firebase write test failed: %s\n", fbdo.errorReason().c_str());
    }
  } else {
    firebaseReady = false;
    Serial.println("❌ Firebase connection failed");
    Serial.println("   Check WiFi connection and Firebase URL");
  }
}

// ==================== HTTP SERVER SETUP ====================

void setupHTTPServer() {
  Serial.println("\n🌐 Starting HTTP Server (on Ethernet)...");
  
  // Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/sensor-data", HTTP_POST, handleSensorData);
  server.on("/api/device-status", HTTP_GET, handleDeviceStatus);
  
  // Enable CORS
  server.enableCORS(true);
  
  // Start server
  server.begin();
  
  Serial.println("✅ HTTP Server started");
  Serial.printf("   Listening on: http://%s:80\n", Ethernet.localIP().toString().c_str());
  Serial.println("   Endpoints:");
  Serial.println("     POST /api/sensor-data    - Receive sensor data from Laptop 2");
  Serial.println("     GET  /api/device-status  - Get gateway status");
}

// ==================== HTTP HANDLERS ====================

void handleRoot() {
  String html = "<!DOCTYPE html><html><head><title>SafeEdge Gateway</title></head><body>";
  html += "<h1>SafeEdge ESP32 Gateway</h1>";
  html += "<p><strong>Status:</strong> Online</p>";
  html += "<p><strong>WiFi:</strong> " + String(wifiConnected ? "Connected" : "Disconnected") + "</p>";
  html += "<p><strong>Ethernet:</strong> " + String(ethernetConnected ? "Connected" : "Disconnected") + "</p>";
  html += "<p><strong>Firebase:</strong> " + String(firebaseReady ? "Ready" : "Not Ready") + "</p>";
  html += "<p><strong>Ethernet IP:</strong> " + Ethernet.localIP().toString() + "</p>";
  html += "<p><strong>WiFi IP:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleSensorData() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"success\":false,\"message\":\"Method not allowed\"}");
    return;
  }
  
  String body = server.arg("plain");
  
  // Parse JSON
  DynamicJsonDocument doc(4096);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    Serial.printf("❌ JSON parse error: %s\n", error.c_str());
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }
  
  // Extract device info
  String deviceId = doc["device_id"].as<String>();
  String deviceName = doc["device_name"] | "Unknown Device";
  String deviceType = doc["device_type"] | "unknown";
  
  Serial.println("\n📥 Received data from Laptop 2 (via Ethernet)");
  Serial.printf("   Device ID: %s\n", deviceId.c_str());
  Serial.printf("   Device Name: %s\n", deviceName.c_str());
  Serial.printf("   Device Type: %s\n", deviceType.c_str());
  
  // Forward to Firebase (via WiFi)
  if (firebaseReady) {
    // Add gateway metadata
    doc["gateway_mac"] = macAddress;
    doc["gateway_timestamp"] = millis();
    doc["received_via"] = "ethernet";
    
    // Create Firebase path
    String firebasePath = "/devices/" + deviceId + "/sensor_history/" + String(sensorBufferIndex);
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    Serial.println("📤 Forwarding to Firebase (via WiFi)...");
    
    if (Firebase.RTDB.setString(&fbdo, firebasePath.c_str(), jsonData.c_str())) {
      Serial.println("✅ Data forwarded to Firebase successfully");
      Serial.printf("   Path: %s\n", firebasePath.c_str());
      
      // Update buffer index
      sensorBufferIndex = (sensorBufferIndex + 1) % BUFFER_SIZE;
      
      // Update device status
      String statusPath = "/devices/" + deviceId + "/info/status";
      Firebase.RTDB.setString(&fbdo, statusPath.c_str(), "online");
      
      String lastSeenPath = "/devices/" + deviceId + "/info/last_seen";
      Firebase.RTDB.setString(&fbdo, lastSeenPath.c_str(), String(millis()).c_str());
      
      // Blink green LED
      blinkLED(LED_GREEN, 1);
      
      // Send success response to Laptop 2
      server.send(200, "application/json", 
                  "{\"success\":true,\"message\":\"Data received and forwarded to Firebase\"}");
    } else {
      Serial.printf("❌ Firebase write failed: %s\n", fbdo.errorReason().c_str());
      server.send(500, "application/json", 
                  "{\"success\":false,\"message\":\"Failed to forward to Firebase\"}");
    }
  } else {
    Serial.println("⚠️  Firebase not ready, data not forwarded");
    server.send(503, "application/json", 
                "{\"success\":false,\"message\":\"Firebase not available\"}");
  }
}

void handleDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["success"] = true;
  doc["gateway_mac"] = macAddress;
  doc["wifi_connected"] = wifiConnected;
  doc["wifi_ip"] = WiFi.localIP().toString();
  doc["ethernet_connected"] = ethernetConnected;
  doc["ethernet_ip"] = Ethernet.localIP().toString();
  doc["firebase_ready"] = firebaseReady;
  doc["uptime"] = millis();
  doc["free_memory"] = ESP.getFreeHeap();
  doc["buffer_index"] = sensorBufferIndex;
  
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
