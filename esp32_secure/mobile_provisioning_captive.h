/**
 * ESP32 Mobile Provisioning with Captive Portal
 * ==============================================
 * Automatically opens browser when phone connects to ESP32 WiFi
 * Handles QR code data and provisions device
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

#ifndef MOBILE_PROVISIONING_CAPTIVE_H
#define MOBILE_PROVISIONING_CAPTIVE_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include "device_provisioning.h"

// WiFi AP Configuration
#define AP_SSID_PREFIX "SafeEdge-"
#define AP_PASSWORD "SafeEdge2026"
#define AP_CHANNEL 6
#define AP_MAX_CONNECTIONS 1

// Web Server & DNS
#define WEB_SERVER_PORT 80
#define DNS_PORT 53

// Backend API
#define BACKEND_API_URL "http://192.168.1.177:8000"  // Your backend IP

class MobileProvisioningCaptive {
private:
  WebServer server;
  DNSServer dnsServer;
  DeviceProvisioning* deviceProvisioning;
  String apSSID;
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
   * Captive Portal - Handles ALL requests and shows provisioning page
   */
  void handleCaptivePortal() {
    String html = R"(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SafeEdge Device Provisioning</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .status {
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
    }
    .status.waiting {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      color: #92400e;
    }
    .status.success {
      background: #d1fae5;
      border: 2px solid #10b981;
      color: #065f46;
    }
    .status.error {
      background: #fee2e2;
      border: 2px solid #ef4444;
      color: #991b1b;
    }
    .info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .info-item {
      margin: 12px 0;
      font-size: 14px;
    }
    .label {
      font-weight: 600;
      color: #374151;
      display: inline-block;
      width: 120px;
    }
    .value {
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }
    textarea {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      resize: vertical;
      margin: 10px 0;
    }
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    .instructions {
      background: #eff6ff;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
    }
    .instructions h3 {
      color: #1e40af;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .instructions ol {
      margin-left: 20px;
      color: #1e3a8a;
    }
    .instructions li {
      margin: 8px 0;
      font-size: 14px;
    }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 SafeEdge Provisioning</h1>
    <p class="subtitle">ESP32 Security Gateway</p>
    
    <div id="statusBox" class="status waiting">
      <strong>⏳ Ready to Provision</strong>
      <p>Paste the QR code data below and click Provision</p>
    </div>
    
    <div class="info">
      <div class="info-item">
        <span class="label">WiFi AP:</span>
        <span class="value">)";
    html += apSSID;
    html += R"(</span>
      </div>
      <div class="info-item">
        <span class="label">MAC Address:</span>
        <span class="value">)";
    html += getMACAddress();
    html += R"(</span>
      </div>
      <div class="info-item">
        <span class="label">Status:</span>
        <span class="value">)";
    html += provisioned ? "Provisioned ✅" : "Not Provisioned ❌";
    html += R"(</span>
      </div>
    </div>
    
    <div>
      <label for="configData" style="font-weight: 600; color: #374151; display: block; margin-bottom: 10px;">
        📋 Paste QR Code Data:
      </label>
      <textarea id="configData" placeholder='Paste the JSON data from QR code here...'></textarea>
      <button id="provisionBtn" onclick="provisionDevice()">🚀 Provision Device</button>
    </div>
    
    <div class="instructions">
      <h3>📱 How to Provision:</h3>
      <ol>
        <li>Open SafeEdge Dashboard on your computer</li>
        <li>Create a new device and generate QR code</li>
        <li>Scan QR code with your phone camera</li>
        <li>Copy the JSON text that appears</li>
        <li>Paste it in the text box above</li>
        <li>Click "Provision Device"</li>
      </ol>
    </div>
  </div>
  
  <script>
    function provisionDevice() {
      const configData = document.getElementById('configData').value.trim();
      const statusBox = document.getElementById('statusBox');
      const provisionBtn = document.getElementById('provisionBtn');
      
      if (!configData) {
        statusBox.className = 'status error';
        statusBox.innerHTML = '<strong>❌ Error</strong><p>Please paste the QR code data</p>';
        return;
      }
      
      // Validate JSON
      try {
        JSON.parse(configData);
      } catch (e) {
        statusBox.className = 'status error';
        statusBox.innerHTML = '<strong>❌ Invalid JSON</strong><p>Please check the data and try again</p>';
        return;
      }
      
      // Show loading
      statusBox.className = 'status waiting';
      statusBox.innerHTML = '<div class="spinner"></div><p>Provisioning device...</p>';
      provisionBtn.disabled = true;
      
      // Send to ESP32
      fetch('/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: configData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          statusBox.className = 'status success';
          statusBox.innerHTML = '<strong>✅ Success!</strong><p>' + data.message + '</p><p>ESP32 will restart in 3 seconds...</p>';
        } else {
          statusBox.className = 'status error';
          statusBox.innerHTML = '<strong>❌ Failed</strong><p>' + data.message + '</p>';
          provisionBtn.disabled = false;
        }
      })
      .catch(error => {
        statusBox.className = 'status error';
        statusBox.innerHTML = '<strong>❌ Error</strong><p>Failed to communicate with ESP32</p>';
        provisionBtn.disabled = false;
      });
    }
  </script>
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
    DynamicJsonDocument doc(8192);  // Larger buffer for certificates
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
      Serial.printf("❌ JSON parse error: %s\n", error.c_str());
      server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
      return;
    }
    
    // Extract device ID and token
    String deviceId = doc["device_id"].as<String>();
    String token = doc["provisioning_token"].as<String>();
    
    Serial.printf("   Device ID: %s\n", deviceId.c_str());
    Serial.printf("   Token: %s...\n", token.substring(0, 20).c_str());
    
    // Validate with backend
    if (!validateWithBackend(deviceId, token)) {
      Serial.println("❌ Backend validation failed");
      server.send(403, "application/json", 
                  "{\"success\":false,\"message\":\"Device validation failed - unauthorized device\"}");
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
      delay(3000);
      Serial.println("🔄 Restarting ESP32...");
      ESP.restart();
    } else {
      Serial.println("❌ Failed to store configuration");
      server.send(500, "application/json", 
                  "{\"success\":false,\"message\":\"Failed to store configuration\"}");
    }
  }

public:
  MobileProvisioningCaptive(DeviceProvisioning* devProv) 
    : server(WEB_SERVER_PORT), deviceProvisioning(devProv), provisioned(false) {
    apSSID = generateAPSSID();
  }
  
  /**
   * Start WiFi AP, DNS server (captive portal), and web server
   */
  bool begin() {
    Serial.println("\n🌐 Starting Mobile Provisioning with Captive Portal");
    Serial.println("===================================================");
    
    // Check if already provisioned
    if (deviceProvisioning->isProvisioned()) {
      Serial.println("✅ Device already provisioned");
      provisioned = true;
      return false;
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
    
    delay(500);
    
    IPAddress IP = WiFi.softAPIP();
    Serial.printf("✅ WiFi AP started\n");
    Serial.printf("   IP Address: %s\n", IP.toString().c_str());
    Serial.printf("   MAC Address: %s\n", getMACAddress().c_str());
    
    // Start DNS server for captive portal
    // Redirect all DNS requests to ESP32 IP
    dnsServer.start(DNS_PORT, "*", IP);
    Serial.printf("✅ DNS server started (Captive Portal)\n");
    
    // Setup web server routes - ALL routes go to captive portal
    server.onNotFound([this]() { handleCaptivePortal(); });
    server.on("/", HTTP_GET, [this]() { handleCaptivePortal(); });
    server.on("/provision", HTTP_POST, [this]() { handleProvision(); });
    server.on("/generate_204", HTTP_GET, [this]() { handleCaptivePortal(); });  // Android
    server.on("/hotspot-detect.html", HTTP_GET, [this]() { handleCaptivePortal(); });  // iOS
    
    // Start web server
    server.begin();
    Serial.printf("✅ Web server started on port %d\n", WEB_SERVER_PORT);
    Serial.println("===================================================");
    Serial.println("📱 Ready for mobile provisioning!");
    Serial.println("   1. Connect phone to ESP32 WiFi");
    Serial.println("   2. Browser opens automatically (Captive Portal)");
    Serial.println("   3. Paste QR code data and provision");
    Serial.println("===================================================\n");
    
    return true;
  }
  
  /**
   * Handle client requests (call in loop)
   */
  void handleClient() {
    dnsServer.processNextRequest();  // Handle DNS requests for captive portal
    server.handleClient();
  }
  
  /**
   * Stop AP mode and servers
   */
  void stop() {
    dnsServer.stop();
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

#endif // MOBILE_PROVISIONING_CAPTIVE_H
