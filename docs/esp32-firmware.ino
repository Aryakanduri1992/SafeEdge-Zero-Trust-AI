
// -------------------------------------------------------------------------------- /
//
//  AuthStation - ESP32 Secure Sensor Data Uploader
//
//  This firmware is designed for an ESP32 microcontroller to securely read data
//  from DHT22 (temperature/humidity) and PIR (motion) sensors, encrypt it using
//  AES-128, and upload it to a Google Firebase Realtime Database.
//
//  Copyright (C) 2024, AuthStation.io - All Rights Reserved
//
//  Features:
//  - Connects to a specified Wi-Fi network.
//  - Synchronizes time using an NTP server for accurate timestamps.
//  - Reads from a DHT22 sensor and a PIR motion sensor.
//  - Encrypts sensor data payloads using AES-128 CBC.
//  - Authenticates with Firebase using a custom anonymous user account.
//  - Uploads encrypted data to specific paths in the Realtime Database.
//  - Includes robust error handling and serial monitor feedback.
//
//  Hardware Requirements:
//  - ESP32 Development Board
//  - DHT22 Temperature and Humidity Sensor (connected to GPIO 4)
//  - PIR Motion Sensor (connected to GPIO 5)
//
//  Dependencies:
//  - ArduinoJson by Benoit Blanchon
//  - Firebase Arduino Client Library for ESP32 & ESP8266 by Mobizt
//  - Adafruit Unified Sensor by Adafruit
//  - DHT sensor library by Adafruit
//
// -------------------------------------------------------------------------------- /


// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "OPPO A78"
#define WIFI_PASSWORD "Deepu@1306"
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// --- Device Path Configuration ---
// These paths must match the 'dbPath' of the corresponding device in your Firestore database.
#define DHT_SENSOR_PATH "devices/DHT22_Sensor"
#define PIR_SENSOR_PATH "devices/PIR_Sensor"

// --- Sensor Pin Configuration ---
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PIR_PIN 5

// --- Library Includes ---
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <mbedtls/aes.h>
#include <mbedtls/base64.h>

// --- Firebase Objects ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- Sensor Objects ---
DHT dht(DHT_PIN, DHT_TYPE);

// --- Time Synchronization ---
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

// --- AES Encryption Configuration ---
// IMPORTANT: These must match the key and IV in your web application's crypto-service.
unsigned char aes_key[16] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF, 0x10, 0x32, 0x54, 0x76, 0x98, 0xBA, 0xDC, 0xFE};
unsigned char aes_iv[16] = {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F};
mbedtls_aes_context aes_ctx;

// ================================================================================= //
//                                 TIME SYNCHRONIZATION
// ================================================================================= //

void syncTime() {
    Serial.print("⏳ Synchronizing time...");
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 10000)) { // 10-second timeout
        Serial.println("❌ FAILED to obtain time. Retrying via HTTP...");

        // Fallback to WorldTimeAPI if NTP fails
        WiFiClient client;
        HTTPClient http;
        http.begin(client, "http://worldtimeapi.org/api/ip");
        int httpCode = http.GET();

        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            StaticJsonDocument<512> doc;
            deserializeJson(doc, payload);
            long unixtime = doc["unixtime"];
            
            timeval tv;
            tv.tv_sec = unixtime;
            settimeofday(&tv, NULL);
            
            Serial.println("✅ Time synchronized via HTTP.");
        } else {
            Serial.println("❌ CRITICAL: HTTP Time synchronization failed. Cannot proceed.");
            while(1) delay(1000); // Halt execution
        }
        http.end();
    } else {
        Serial.println("✅ Time synchronized via NTP.");
    }
}


// ================================================================================= //
//                               DATA ENCRYPTION
// ================================================================================= //

String encryptData(const char* plaintext) {
    int inputLen = strlen(plaintext);
    int paddedLen = (inputLen / 16 + 1) * 16;
    unsigned char* padded_input = (unsigned char*)malloc(paddedLen);
    memset(padded_input, 0, paddedLen);
    memcpy(padded_input, plaintext, inputLen);

    // Custom PKCS7 padding
    int padding = paddedLen - inputLen;
    for (int i = 0; i < padding; i++) {
        padded_input[inputLen + i] = (unsigned char)padding;
    }

    unsigned char encrypted[paddedLen];
    
    mbedtls_aes_init(&aes_ctx);
    mbedtls_aes_setkey_enc(&aes_ctx, aes_key, 128);
    mbedtls_aes_crypt_cbc(&aes_ctx, MBEDTLS_AES_ENCRYPT, paddedLen, aes_iv, padded_input, encrypted);
    mbedtls_aes_free(&aes_ctx);

    free(padded_input);

    // Base64 encode the encrypted data
    size_t out_len = 0;
    // Calculate required buffer size for base64 encoding
    mbedtls_base64_encode(NULL, 0, &out_len, encrypted, paddedLen);
    unsigned char* base64_buf = (unsigned char*)malloc(out_len);

    mbedtls_base64_encode(base64_buf, out_len, &out_len, encrypted, paddedLen);
    
    String result = String((char*)base64_buf);
    free(base64_buf);
    
    return result;
}


// ================================================================================= //
//                               FIREBASE UPLOADER
// ================================================================================= //

void uploadJsonToFirebase(const String& path, const FirebaseJson& json) {
    Serial.printf("📡 Uploading data to %s... ", path.c_str());
    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
        Serial.println("✅ SUCCESS");
    } else {
        Serial.printf("❌ FAILED: %s\n", fbdo.errorReason().c_str());
    }
}


// ================================================================================= //
//                                  SENSOR LOGIC
// ================================================================================= //

void uploadSensorData() {
    if (!Firebase.ready()) {
        Serial.println("🔥 Firebase not ready. Skipping upload cycle.");
        return;
    }

    // --- DHT22 Sensor ---
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("🌡️ Failed to read from DHT sensor!");
    } else {
        StaticJsonDocument<128> dhtData;
        dhtData["temperature"] = String(temperature, 2);
        dhtData["humidity"] = String(humidity, 2);
        
        char jsonBuffer[128];
        serializeJson(dhtData, jsonBuffer);
        
        String encryptedDht = encryptData(jsonBuffer);
        
        FirebaseJson dhtJson;
        dhtJson.set("encrypted_value", encryptedDht);
        dhtJson.set("timestamp", Firebase.ServerValue.TIMESTAMP);
        uploadJsonToFirebase(DHT_SENSOR_PATH, dhtJson);
    }
    
    delay(1000); // Stagger sensor readings

    // --- PIR Sensor ---
    int motionDetected = digitalRead(PIR_PIN);
    String encryptedPir = encryptData(String(motionDetected).c_str());

    FirebaseJson pirJson;
    pirJson.set("encrypted_value", encryptedPir);
    pirJson.set("timestamp", Firebase.ServerValue.TIMESTAMP);
    uploadJsonToFirebase(PIR_SENSOR_PATH, pirJson);
}


// ================================================================================= //
//                                 SETUP & LOOP
// ================================================================================= //

void setup() {
    Serial.begin(115200);
    while (!Serial); // Wait for serial connection

    pinMode(PIR_PIN, INPUT);
    dht.begin();

    Serial.println("\n\n--- AuthStation ESP32 Secure Uploader ---");

    // --- Connect to Wi-Fi ---
    Serial.printf("📶 Connecting to %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ WiFi Connected.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    // --- Sync Time ---
    syncTime();

    // --- Configure Firebase ---
    Serial.println("🔥 Configuring Firebase...");
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    // Use a fixed anonymous UID for simplicity. In a real-world scenario, you might
    // use a device-specific ID or other secure method.
    auth.user.email = "device@authstation.com";
    auth.user.password = "device-password";

    config.token_status_callback = tokenStatusCallback;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // This is a workaround for some ESP32 cores. Handles sign-up on first boot.
    if (Firebase.signUp(&config, &auth, "", "")) {
        Serial.println("✅ Firebase sign-up successful (or user already exists).");
    } else {
        Serial.printf("❌ Firebase sign-up failed: %s\n", fbdo.errorReason().c_str());
    }

    Firebase.setDoubleDigits(5);
}

void loop() {
    uploadSensorData();
    
    // Wait for 30 seconds before the next upload cycle.
    Serial.println("...next update in 30 seconds...");
    delay(30000); 
}
