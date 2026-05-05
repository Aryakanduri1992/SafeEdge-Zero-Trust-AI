/**
 * ESP32 Device Provisioning Module
 * =================================
 * Handles loading device configuration from QR code, Serial, or SPIFFS
 * Stores certificates and keys securely in SPIFFS
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

#ifndef DEVICE_PROVISIONING_H
#define DEVICE_PROVISIONING_H

#include <Arduino.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>

// Configuration paths in SPIFFS
#define CONFIG_FILE_PATH "/config/device_config.json"
#define CA_CERT_PATH "/certs/ca.crt"
#define DEVICE_CERT_PATH "/certs/device.crt"
#define DEVICE_KEY_PATH "/certs/device.key"
#define ENCRYPTION_KEY_PATH "/keys/encryption.key"

// Device configuration structure
struct DeviceConfig {
  String device_id;
  String device_name;
  String device_type;
  String gateway_address;
  int gateway_port;
  String organization_id;
  String department_id;
  bool loaded;
};

class DeviceProvisioning {
private:
  DeviceConfig config;
  
  bool initSPIFFS() {
    if (!SPIFFS.begin(true)) {
      Serial.println("❌ SPIFFS initialization failed");
      return false;
    }
    Serial.println("✅ SPIFFS initialized");
    return true;
  }
  
  bool createDirectories() {
    // Create directory structure
    if (!SPIFFS.exists("/config")) {
      SPIFFS.mkdir("/config");
    }
    if (!SPIFFS.exists("/certs")) {
      SPIFFS.mkdir("/certs");
    }
    if (!SPIFFS.exists("/keys")) {
      SPIFFS.mkdir("/keys");
    }
    return true;
  }
  
  bool saveToFile(const char* path, const String& content) {
    File file = SPIFFS.open(path, "w");
    if (!file) {
      Serial.printf("❌ Failed to open file for writing: %s\n", path);
      return false;
    }
    
    size_t written = file.print(content);
    file.close();
    
    if (written == content.length()) {
      Serial.printf("✅ Saved to %s (%d bytes)\n", path, written);
      return true;
    } else {
      Serial.printf("❌ Write failed: %s\n", path);
      return false;
    }
  }
  
  String readFromFile(const char* path) {
    if (!SPIFFS.exists(path)) {
      Serial.printf("❌ File not found: %s\n", path);
      return "";
    }
    
    File file = SPIFFS.open(path, "r");
    if (!file) {
      Serial.printf("❌ Failed to open file: %s\n", path);
      return "";
    }
    
    String content = file.readString();
    file.close();
    
    Serial.printf("✅ Read from %s (%d bytes)\n", path, content.length());
    return content;
  }

public:
  DeviceProvisioning() {
    config.loaded = false;
  }
  
  /**
   * Load configuration from SPIFFS
   */
  bool loadConfig() {
    Serial.println("🔐 Loading device configuration...");
    
    if (!initSPIFFS()) {
      return false;
    }
    
    // Read config file
    String configJson = readFromFile(CONFIG_FILE_PATH);
    if (configJson.isEmpty()) {
      Serial.println("❌ No configuration found");
      return false;
    }
    
    // Parse JSON
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, configJson);
    
    if (error) {
      Serial.printf("❌ Failed to parse config: %s\n", error.c_str());
      return false;
    }
    
    // Extract configuration
    config.device_id = doc["device_id"].as<String>();
    config.device_name = doc["device_name"].as<String>();
    config.device_type = doc["device_type"].as<String>();
    config.gateway_address = doc["gateway"]["address"].as<String>();
    config.gateway_port = doc["gateway"]["port"].as<int>();
    config.organization_id = doc["organization_id"].as<String>();
    config.department_id = doc["department_id"].as<String>();
    config.loaded = true;
    
    Serial.println("✅ Configuration loaded successfully");
    Serial.printf("   Device ID: %s\n", config.device_id.c_str());
    Serial.printf("   Device Name: %s\n", config.device_name.c_str());
    Serial.printf("   Gateway: %s:%d\n", config.gateway_address.c_str(), config.gateway_port);
    
    return true;
  }
  
  /**
   * Provision device from JSON configuration
   * (received via Serial, QR code, or Web upload)
   */
  bool provisionFromJson(const String& jsonConfig) {
    Serial.println("🔐 Provisioning device from JSON...");
    
    if (!initSPIFFS()) {
      return false;
    }
    
    createDirectories();
    
    // Parse JSON
    StaticJsonDocument<4096> doc;
    DeserializationError error = deserializeJson(doc, jsonConfig);
    
    if (error) {
      Serial.printf("❌ Failed to parse JSON: %s\n", error.c_str());
      return false;
    }
    
    // Extract and save configuration
    config.device_id = doc["device_id"].as<String>();
    config.device_name = doc["device_name"].as<String>();
    config.device_type = doc["device_type"].as<String>();
    config.gateway_address = doc["gateway"]["address"].as<String>();
    config.gateway_port = doc["gateway"]["port"].as<int>();
    config.organization_id = doc["organization_id"].as<String>();
    config.department_id = doc["department_id"].as<String>();
    
    // Save main config
    StaticJsonDocument<1024> configDoc;
    configDoc["device_id"] = config.device_id;
    configDoc["device_name"] = config.device_name;
    configDoc["device_type"] = config.device_type;
    configDoc["gateway"]["address"] = config.gateway_address;
    configDoc["gateway"]["port"] = config.gateway_port;
    configDoc["organization_id"] = config.organization_id;
    configDoc["department_id"] = config.department_id;
    configDoc["certificates"]["ca_path"] = CA_CERT_PATH;
    configDoc["certificates"]["cert_path"] = DEVICE_CERT_PATH;
    configDoc["certificates"]["key_path"] = DEVICE_KEY_PATH;
    configDoc["encryption"]["key_path"] = ENCRYPTION_KEY_PATH;
    configDoc["encryption"]["algorithm"] = "AES-256-GCM";
    
    String configJson;
    serializeJson(configDoc, configJson);
    
    if (!saveToFile(CONFIG_FILE_PATH, configJson)) {
      return false;
    }
    
    // Save certificates and keys
    String caCert = doc["certificates"]["ca_certificate"].as<String>();
    String deviceCert = doc["certificates"]["device_certificate"].as<String>();
    String deviceKey = doc["certificates"]["device_private_key"].as<String>();
    String encryptionKey = doc["encryption"]["key"].as<String>();
    
    if (!saveToFile(CA_CERT_PATH, caCert)) return false;
    if (!saveToFile(DEVICE_CERT_PATH, deviceCert)) return false;
    if (!saveToFile(DEVICE_KEY_PATH, deviceKey)) return false;
    if (!saveToFile(ENCRYPTION_KEY_PATH, encryptionKey)) return false;
    
    config.loaded = true;
    
    Serial.println("✅ Device provisioned successfully!");
    Serial.printf("   Device ID: %s\n", config.device_id.c_str());
    Serial.printf("   Certificates stored in SPIFFS\n");
    
    return true;
  }
  
  /**
   * Provision device from Serial input
   */
  bool provisionFromSerial() {
    Serial.println("📥 Waiting for configuration JSON via Serial...");
    Serial.println("   Paste the complete JSON and press Enter");
    
    // Wait for serial input (with timeout)
    unsigned long startTime = millis();
    String jsonInput = "";
    
    while (millis() - startTime < 60000) {  // 60 second timeout
      if (Serial.available()) {
        char c = Serial.read();
        jsonInput += c;
        
        // Check if we have complete JSON
        if (c == '}' && jsonInput.indexOf('{') == 0) {
          return provisionFromJson(jsonInput);
        }
      }
      delay(10);
    }
    
    Serial.println("❌ Timeout waiting for configuration");
    return false;
  }
  
  /**
   * Load certificates from SPIFFS
   */
  bool loadCertificates(String& caCert, String& deviceCert, String& deviceKey) {
    caCert = readFromFile(CA_CERT_PATH);
    deviceCert = readFromFile(DEVICE_CERT_PATH);
    deviceKey = readFromFile(DEVICE_KEY_PATH);
    
    return !caCert.isEmpty() && !deviceCert.isEmpty() && !deviceKey.isEmpty();
  }
  
  /**
   * Load encryption key from SPIFFS
   */
  String loadEncryptionKey() {
    return readFromFile(ENCRYPTION_KEY_PATH);
  }
  
  /**
   * Check if device is provisioned
   */
  bool isProvisioned() {
    if (!initSPIFFS()) {
      return false;
    }
    
    return SPIFFS.exists(CONFIG_FILE_PATH) &&
           SPIFFS.exists(CA_CERT_PATH) &&
           SPIFFS.exists(DEVICE_CERT_PATH) &&
           SPIFFS.exists(DEVICE_KEY_PATH) &&
           SPIFFS.exists(ENCRYPTION_KEY_PATH);
  }
  
  /**
   * Clear all provisioning data (factory reset)
   */
  void clearProvisioning() {
    Serial.println("🗑️  Clearing provisioning data...");
    
    if (!initSPIFFS()) {
      return;
    }
    
    SPIFFS.remove(CONFIG_FILE_PATH);
    SPIFFS.remove(CA_CERT_PATH);
    SPIFFS.remove(DEVICE_CERT_PATH);
    SPIFFS.remove(DEVICE_KEY_PATH);
    SPIFFS.remove(ENCRYPTION_KEY_PATH);
    
    config.loaded = false;
    
    Serial.println("✅ Provisioning data cleared");
  }
  
  /**
   * Get device configuration
   */
  DeviceConfig getConfig() {
    return config;
  }
  
  /**
   * Print provisioning status
   */
  void printStatus() {
    Serial.println("\n📊 Device Provisioning Status");
    Serial.println("================================");
    
    if (!initSPIFFS()) {
      Serial.println("❌ SPIFFS not available");
      return;
    }
    
    Serial.printf("Config File: %s\n", SPIFFS.exists(CONFIG_FILE_PATH) ? "✅" : "❌");
    Serial.printf("CA Certificate: %s\n", SPIFFS.exists(CA_CERT_PATH) ? "✅" : "❌");
    Serial.printf("Device Certificate: %s\n", SPIFFS.exists(DEVICE_CERT_PATH) ? "✅" : "❌");
    Serial.printf("Device Key: %s\n", SPIFFS.exists(DEVICE_KEY_PATH) ? "✅" : "❌");
    Serial.printf("Encryption Key: %s\n", SPIFFS.exists(ENCRYPTION_KEY_PATH) ? "✅" : "❌");
    
    if (config.loaded) {
      Serial.println("\n📋 Device Configuration:");
      Serial.printf("   Device ID: %s\n", config.device_id.c_str());
      Serial.printf("   Device Name: %s\n", config.device_name.c_str());
      Serial.printf("   Device Type: %s\n", config.device_type.c_str());
      Serial.printf("   Gateway: %s:%d\n", config.gateway_address.c_str(), config.gateway_port);
      Serial.printf("   Organization: %s\n", config.organization_id.c_str());
    }
    
    Serial.println("================================\n");
  }
};

#endif // DEVICE_PROVISIONING_H
