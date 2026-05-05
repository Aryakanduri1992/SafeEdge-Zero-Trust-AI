/**
 * ESP32 Mobile Provisioning Module
 * =================================
 * Creates WiFi AP for mobile provisioning
 * Validates device with backend before accepting credentials
 * Supports both Ethernet and WiFi connections
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

#ifndef MOBILE_PROVISIONING_H
#define MOBILE_PROVISIONING_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include "device_provisioning.h"

// WiFi AP Configuration
#define AP_SSID_PREFIX "SafeEdge-"
#define AP_PASSWORD "SafeEdge2026"
#define AP_CHANNEL 6
#define AP_MAX_CONNECTIONS 1

// Web Server
#define WEB_SERVER_PORT 80

// Backend API
#define BACKEND_API_URL "http://192.168.1.100:8000"  // Update with your backend IP

class MobileProvisioning {
private:
  WebServer server;
  DeviceProvisioning* deviceProvisioning;
  String apSSID;
  String deviceId;
  String provisioningToken;
  bool provisioned;
  
  /**
   * Generate unique AP SSID based on MAC address
   */
  String generateAPSSID() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char ssid[32];
    snprintf(ssid, sizeof(ssid), "%s%02X%02X%02X", 
             AP_SSID_PREFIX, mac[3], mac[4], mac[5]);
    return String(ssid);
  }
  
  /**
   * Get ESP32 MAC address as string
   */
  String getMACAddress() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(macStr);
  }
  
  /**
   * Validate device with backend
   */
  bool validateWithBackend(const String& deviceId, const String& token) {
    HTTPClient http;
    
    String url = String(BACKEND_API_URL) + "/api/devices/validate";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["provisioning_token"] = token;
    doc["esp32_mac_address"] = getMACAddress();
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.println("🔍 Validating device with backend...");
    Serial.printf("   URL: %s\n", url.c_str());
    Serial.printf("   Device ID: %s\n", deviceId.c_str());
    Serial.printf("   MAC: %s\n", getMACAddress().c_str());
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 200) {
      String response = http.getString();
      Serial.printf("✅ Backend response: %s\n", response.c_str());
      
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        bool valid = responseDoc["valid"];
        String message = responseDoc["message"];
        
        if (valid) {
          Serial.println("✅ Device validated successfully!");
          http.end();
          return true;
        } else {
          Serial.printf("❌ Validation failed: %s\n", message.c_str());
        }
      }
    } else {
      Serial.printf("❌ HTTP error: %d\n", httpCode);
    }
    
    http.end();
    return false;
  }
  
  /**
   * Handle root page
   */
  void handleRoot() {
    String html = R"(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeEdge Device Provisioning</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      margin-bottom: 10px;
    }
    .status {
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .status.waiting {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
    }
    .status.success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
    }
    .info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .info-item {
      margin: 10px 0;
      font-family: monospace;
    }
    .label {
      font-weight: bold;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 SafeEdge Device Provisioning</h1>
    <p>ESP32 Security Gateway</p>
    
    <div class="status waiting">
      <strong>⏳ Waiting for provisioning...</strong>
      <p>Use SafeEdge Mobile App to scan QR code and provision this device.</p>
    </div>
    
    <div class="info">
      <div class="info-item">
        <span class="label">WiFi AP:</span> )";
    html += apSSID;
    html += R"(
      </div>
      <div class="info-item">
        <span class="label">MAC Address:</span> )";
    html += getMACAddress();
    html += R"(
      </div>
      <div class="info-item">
        <span class="label">Status:</span> )";
    html += provisioned ? "Provisioned ✅" : "Not Provisioned ❌";
    html += R"(
      </div>
    </div>
    
    <h3>Instructions:</h3>
    <ol>
      <li>Open SafeEdge Dashboard</li>
      <li>Create new device and get QR code</li>
      <li>Open SafeEdge Mobile App</li>
      <li>Scan QR code</li>
      <li>Mobile will connect to this ESP32 and provision automatically</li>
    </ol>
  </div>
</body>
</html>
    )";
    
    server.send(200, "text/html", html);
  }
  
  /**
   * Handle provisioning request from mobile
   */
  void handleProvision() {
    if (server.method() != HTTP_POST) {
      server.send(405, "application/json", "{\"success\":false,\"message\":\"Method not allowed\"}");
      return;
    }
    
    String body = server.arg("plain");
    Serial.println("📥 Received provisioning request");
    Serial.printf("   Payload size: %d bytes\n", body.length());
    
    // Parse JSON
    StaticJsonDocument<4096> doc;
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
      Serial.printf("❌ JSON parse error: %s\n", error.c_str());
      server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
      return;
    }
    
    // Extract device ID and token
    String deviceId = doc["device_id"];
    String token = doc["provisioning"]["token"];
    
    Serial.printf("   Device ID: %s\n", deviceId.c_str());
    Serial.printf("   Token: %s\n", token.substring(0, 20).c_str());
    
    // Validate with backend
    if (!validateWithBackend(deviceId, token)) {
      Serial.println("❌ Backend validation failed");
      server.send(403, "application/json", 
                  "{\"success\":false,\"message\":\"Device validation failed\"}");
      return;
    }
    
    // Validation successful - store configuration
    String configJson;
    serializeJson(doc, configJson);
    
    if (deviceProvisioning->provisionFromJson(configJson)) {
      provisioned = true;
      Serial.println("✅ Device provisioned successfully!");
      
      server.send(200, "application/json", 
                  "{\"success\":true,\"message\":\"Device provisioned successfully\"}");
      
      // Restart ESP32 to apply configuration
      delay(2000);
      Serial.println("🔄 Restarting ESP32...");
      ESP.restart();
    } else {
      Serial.println("❌ Failed to store configuration");
      server.send(500, "application/json", 
                  "{\"success\":false,\"message\":\"Failed to store configuration\"}");
    }
  }
  
  /**
   * Handle status request
   */
  void handleStatus() {
    StaticJsonDocument<256> doc;
    doc["success"] = true;
    doc["provisioned"] = provisioned;
    doc["mac_address"] = getMACAddress();
    doc["ap_ssid"] = apSSID;
    
    String response;
    serializeJson(doc, response);
    
    server.send(200, "application/json", response);
  }

public:
  MobileProvisioning(DeviceProvisioning* devProv) 
    : server(WEB_SERVER_PORT), deviceProvisioning(devProv), provisioned(false) {
    apSSID = generateAPSSID();
  }
  
  /**
   * Start WiFi AP and web server
   */
  bool begin() {
    Serial.println("\n🌐 Starting Mobile Provisioning Mode");
    Serial.println("====================================");
    
    // Check if already provisioned
    if (deviceProvisioning->isProvisioned()) {
      Serial.println("✅ Device already provisioned");
      provisioned = true;
      return false;  // Don't start AP mode
    }
    
    // Start WiFi AP
    Serial.printf("📡 Starting WiFi AP: %s\n", apSSID.c_str());
    Serial.printf("   Password: %s\n", AP_PASSWORD);
    
    WiFi.mode(WIFI_AP);
    bool apStarted = WiFi.softAP(apSSID.c_str(), AP_PASSWORD, AP_CHANNEL, 0, AP_MAX_CONNECTIONS);
    
    if (!apStarted) {
      Serial.println("❌ Failed to start WiFi AP");
      return false;
    }
    
    IPAddress IP = WiFi.softAPIP();
    Serial.printf("✅ WiFi AP started\n");
    Serial.printf("   IP Address: %s\n", IP.toString().c_str());
    Serial.printf("   MAC Address: %s\n", getMACAddress().c_str());
    
    // Setup web server routes
    server.on("/", HTTP_GET, [this]() { handleRoot(); });
    server.on("/provision", HTTP_POST, [this]() { handleProvision(); });
    server.on("/status", HTTP_GET, [this]() { handleStatus(); });
    
    // Start web server
    server.begin();
    Serial.printf("✅ Web server started on port %d\n", WEB_SERVER_PORT);
    Serial.println("====================================");
    Serial.println("📱 Ready for mobile provisioning!");
    Serial.println("   1. Connect mobile to WiFi AP");
    Serial.println("   2. Open browser to http://192.168.4.1");
    Serial.println("   3. Or use SafeEdge Mobile App");
    Serial.println("====================================\n");
    
    return true;
  }
  
  /**
   * Handle client requests (call in loop)
   */
  void handleClient() {
    server.handleClient();
  }
  
  /**
   * Stop AP mode and web server
   */
  void stop() {
    server.stop();
    WiFi.softAPdisconnect(true);
    Serial.println("🛑 Mobile provisioning mode stopped");
  }
  
  /**
   * Check if provisioned
   */
  bool isProvisioned() {
    return provisioned;
  }
  
  /**
   * Get AP SSID
   */
  String getAPSSID() {
    return apSSID;
  }
};

#endif // MOBILE_PROVISIONING_H
