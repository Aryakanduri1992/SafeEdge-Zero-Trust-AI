/*
 * SafeEdge ESP32 WiFi Connection Firmware
 * ========================================
 * This firmware connects ESP32 to WiFi and reports status.
 * 
 * WiFi credentials are loaded from wifi_credentials.secret file
 * during the flash process.
 * 
 * IMPORTANT: Do not hardcode WiFi credentials here!
 * They are injected during compilation.
 */

#include <WiFi.h>

// These will be replaced during flash process
// DO NOT EDIT - credentials come from secret file
#ifndef WIFI_SSID
#define WIFI_SSID "PLACEHOLDER_SSID"
#endif

#ifndef WIFI_PASSWORD  
#define WIFI_PASSWORD "PLACEHOLDER_PASSWORD"
#endif

// Device identification
const char* DEVICE_ID = "safeedge_esp32_001";
const char* FIRMWARE_VERSION = "1.0.0";

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("========================================");
    Serial.println("SafeEdge ESP32 - WiFi Connection");
    Serial.println("Firmware Version: " + String(FIRMWARE_VERSION));
    Serial.println("Device ID: " + String(DEVICE_ID));
    Serial.println("========================================");
    
    // Connect to WiFi
    connectToWiFi();
}

void loop() {
    // Check WiFi connection status
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected! Reconnecting...");
        connectToWiFi();
    }
    
    // Print status every 10 seconds
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 10000) {
        printStatus();
        lastPrint = millis();
    }
    
    delay(100);
}

void connectToWiFi() {
    Serial.print("Connecting to WiFi");
    
    // Don't print actual SSID for security
    String maskedSSID = String(WIFI_SSID).substring(0, 3) + "***";
    Serial.println(" (" + maskedSSID + ")");
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    Serial.println();
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("========================================");
        Serial.println("WiFi Connected!");
        Serial.println("IP Address: " + WiFi.localIP().toString());
        Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
        Serial.println("MAC Address: " + WiFi.macAddress());
        Serial.println("========================================");
    } else {
        Serial.println("WiFi Connection Failed!");
        Serial.println("Please check credentials in wifi_credentials.secret");
    }
}

void printStatus() {
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("STATUS: Connected | IP: " + WiFi.localIP().toString() + " | RSSI: " + String(WiFi.RSSI()) + " dBm");
    } else {
        Serial.println("STATUS: Disconnected");
    }
}
