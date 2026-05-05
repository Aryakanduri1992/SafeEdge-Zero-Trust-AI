/*
 * SafeEdge ESP32 Encrypted Firmware (Arduino)
 * ============================================
 * Secure firmware with AES-256-GCM + ECC (ECDH) encryption
 * All data sent to cloud is encrypted before transmission
 * 
 * Security Features:
 * - AES-256-GCM for symmetric encryption (authenticated encryption)
 * - ECDH (secp256k1) for secure key exchange with server
 * - Per-message random IV for replay protection
 * - Timestamp validation for message freshness
 * - HKDF for key derivation
 * 
 * Hardware: ESP32
 * Author: SafeEdge Team - Imagine Cup 2026
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <mbedtls/aes.h>
#include <mbedtls/gcm.h>
#include <mbedtls/ecdh.h>
#include <mbedtls/ecp.h>
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/hkdf.h>
#include <mbedtls/md.h>
#include <esp_random.h>
#include <base64.h>

// ==================== CONFIGURATION ====================
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

// Backend server configuration
const char* BACKEND_HOST = "192.168.29.192";
const int BACKEND_PORT = 9002;
const char* DEVICE_ID = "esp32_safeedge_001";
const char* FIRMWARE_VERSION = "3.0.0-ENCRYPTED";

// Timing configuration
const int REPORT_INTERVAL_MS = 5000;
const int HEARTBEAT_INTERVAL_MS = 30000;

// Crypto configuration
const int AES_KEY_LENGTH = 32;  // 256 bits
const int IV_LENGTH = 12;       // 96 bits for GCM
const int AUTH_TAG_LENGTH = 16; // 128 bits

// ==================== GLOBAL VARIABLES ====================
// ECC key pair for this device
mbedtls_ecdh_context ecdhCtx;
mbedtls_entropy_context entropy;
mbedtls_ctr_drbg_context ctrDrbg;

// Device's key pair
uint8_t devicePrivateKey[32];
uint8_t devicePublicKey[65];  // Uncompressed format: 04 || x || y
String devicePublicKeyBase64;

// Server's public key (fetched from server)
uint8_t serverPublicKey[65];
bool hasServerKey = false;

// Shared secret (derived via ECDH)
uint8_t sharedSecret[32];
bool hasSharedSecret = false;

// AES key (derived from shared secret via HKDF)
uint8_t aesKey[AES_KEY_LENGTH];

// Status
bool isConnected = false;
unsigned long lastReportTime = 0;
unsigned long lastHeartbeatTime = 0;

// LED pins
const int LED_RED = 32;
const int LED_YELLOW = 26;
const int LED_GREEN = 25;
const int BUZZER_PIN = 33;

// ==================== FUNCTION DECLARATIONS ====================
void setupLEDs();
void setStatusLED(const char* status);
bool connectWiFi();
bool initializeCrypto();
bool fetchServerPublicKey();
bool deriveSharedSecret();
bool deriveAESKey();
String encryptData(const String& jsonData);
void sendEncryptedSensorData();
void sendEncryptedHeartbeat();
void generateRandomIV(uint8_t* iv, size_t length);
String bytesToBase64(const uint8_t* data, size_t length);
void base64ToBytes(const String& base64, uint8_t* output, size_t* outputLength);

// ==================== SETUP ====================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("================================================");
    Serial.println("SafeEdge ESP32 Encrypted Firmware v3.0");
    Serial.println("AES-256-GCM + ECDH Encryption");
    Serial.println("Imagine Cup 2026 - Hospital IoT Security");
    Serial.println("================================================");
    
    setupLEDs();
    setStatusLED("initializing");
    
    // Initialize cryptographic subsystem
    if (!initializeCrypto()) {
        Serial.println("FATAL: Crypto initialization failed!");
        setStatusLED("error");
        while(1) delay(1000);
    }
    Serial.println("✓ Crypto subsystem initialized");
    
    // Connect to WiFi
    if (!connectWiFi()) {
        Serial.println("FATAL: WiFi connection failed!");
        setStatusLED("error");
        while(1) delay(1000);
    }
    Serial.println("✓ WiFi connected");
    
    // Fetch server's public key
    if (!fetchServerPublicKey()) {
        Serial.println("FATAL: Could not fetch server public key!");
        setStatusLED("error");
        while(1) delay(1000);
    }
    Serial.println("✓ Server public key received");
    
    // Derive shared secret via ECDH
    if (!deriveSharedSecret()) {
        Serial.println("FATAL: ECDH key exchange failed!");
        setStatusLED("error");
        while(1) delay(1000);
    }
    Serial.println("✓ ECDH shared secret derived");
    
    // Derive AES key from shared secret
    if (!deriveAESKey()) {
        Serial.println("FATAL: AES key derivation failed!");
        setStatusLED("error");
        while(1) delay(1000);
    }
    Serial.println("✓ AES-256 key derived");
    
    setStatusLED("connected");
    Serial.println("\n🔐 Secure encrypted connection established!");
    Serial.println("All data will be encrypted before transmission.\n");
}

// ==================== MAIN LOOP ====================
void loop() {
    unsigned long currentTime = millis();
    
    // Send encrypted sensor data at regular intervals
    if (currentTime - lastReportTime >= REPORT_INTERVAL_MS) {
        sendEncryptedSensorData();
        lastReportTime = currentTime;
    }
    
    // Send encrypted heartbeat
    if (currentTime - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
        sendEncryptedHeartbeat();
        lastHeartbeatTime = currentTime;
    }
    
    delay(100);
}

// ==================== LED FUNCTIONS ====================
void setupLEDs() {
    pinMode(LED_RED, OUTPUT);
    pinMode(LED_YELLOW, OUTPUT);
    pinMode(LED_GREEN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_GREEN, HIGH);
        delay(100);
        digitalWrite(LED_GREEN, LOW);
        delay(100);
    }
}

void setStatusLED(const char* status) {
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_GREEN, LOW);
    noTone(BUZZER_PIN);
    
    if (strcmp(status, "connected") == 0 || strcmp(status, "safe") == 0) {
        digitalWrite(LED_GREEN, HIGH);
    } else if (strcmp(status, "warning") == 0 || strcmp(status, "initializing") == 0) {
        digitalWrite(LED_YELLOW, HIGH);
        tone(BUZZER_PIN, 1500, 100); // Short warning beep
    } else if (strcmp(status, "error") == 0 || strcmp(status, "critical") == 0) {
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER_PIN, 2000, 200); // Long critical beep
    }
}

// ==================== WIFI ====================
bool connectWiFi() {
    Serial.print("Connecting to WiFi");
    
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
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        return true;
    }
    
    return false;
}

// ==================== CRYPTO INITIALIZATION ====================
bool initializeCrypto() {
    int ret;
    
    // Initialize entropy source
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctrDrbg);
    
    // Seed the random number generator
    const char* pers = "safeedge_esp32";
    ret = mbedtls_ctr_drbg_seed(&ctrDrbg, mbedtls_entropy_func, &entropy,
                                 (const unsigned char*)pers, strlen(pers));
    if (ret != 0) {
        Serial.printf("ctr_drbg_seed failed: %d\n", ret);
        return false;
    }
    
    // Initialize ECDH context
    mbedtls_ecdh_init(&ecdhCtx);
    
    // Setup ECDH with secp256k1 curve
    ret = mbedtls_ecp_group_load(&ecdhCtx.grp, MBEDTLS_ECP_DP_SECP256K1);
    if (ret != 0) {
        Serial.printf("ecp_group_load failed: %d\n", ret);
        return false;
    }
    
    // Generate device's key pair
    ret = mbedtls_ecdh_gen_public(&ecdhCtx.grp, &ecdhCtx.d, &ecdhCtx.Q,
                                   mbedtls_ctr_drbg_random, &ctrDrbg);
    if (ret != 0) {
        Serial.printf("ecdh_gen_public failed: %d\n", ret);
        return false;
    }
    
    // Export device's public key (uncompressed format)
    size_t olen;
    ret = mbedtls_ecp_point_write_binary(&ecdhCtx.grp, &ecdhCtx.Q,
                                          MBEDTLS_ECP_PF_UNCOMPRESSED,
                                          &olen, devicePublicKey, sizeof(devicePublicKey));
    if (ret != 0) {
        Serial.printf("ecp_point_write_binary failed: %d\n", ret);
        return false;
    }
    
    // Convert to base64 for transmission
    devicePublicKeyBase64 = bytesToBase64(devicePublicKey, olen);
    
    Serial.println("Device ECC key pair generated");
    Serial.print("Public key (first 16 bytes): ");
    for (int i = 0; i < 16; i++) {
        Serial.printf("%02X", devicePublicKey[i]);
    }
    Serial.println("...");
    
    return true;
}

// ==================== KEY EXCHANGE ====================
bool fetchServerPublicKey() {
    HTTPClient http;
    String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + "/api/esp32/crypto-config";
    
    Serial.print("Fetching server public key from: ");
    Serial.println(url);
    
    http.begin(url);
    int httpCode = http.GET();
    
    if (httpCode != 200) {
        Serial.printf("HTTP GET failed: %d\n", httpCode);
        http.end();
        return false;
    }
    
    String response = http.getString();
    http.end();
    
    // Parse JSON response
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return false;
    }
    
    // Get server public key (hex format)
    const char* serverKeyHex = doc["crypto"]["serverPublicKeyHex"];
    if (!serverKeyHex) {
        Serial.println("Server public key not found in response");
        return false;
    }
    
    // Convert hex to bytes
    size_t keyLen = strlen(serverKeyHex) / 2;
    for (size_t i = 0; i < keyLen && i < sizeof(serverPublicKey); i++) {
        char hex[3] = { serverKeyHex[i*2], serverKeyHex[i*2+1], 0 };
        serverPublicKey[i] = strtol(hex, NULL, 16);
    }
    
    hasServerKey = true;
    
    Serial.print("Server public key received (first 16 bytes): ");
    for (int i = 0; i < 16; i++) {
        Serial.printf("%02X", serverPublicKey[i]);
    }
    Serial.println("...");
    
    return true;
}

bool deriveSharedSecret() {
    if (!hasServerKey) {
        Serial.println("No server public key available");
        return false;
    }
    
    int ret;
    
    // Import server's public key
    ret = mbedtls_ecp_point_read_binary(&ecdhCtx.grp, &ecdhCtx.Qp,
                                         serverPublicKey, 65);
    if (ret != 0) {
        Serial.printf("ecp_point_read_binary failed: %d\n", ret);
        return false;
    }
    
    // Compute shared secret
    ret = mbedtls_ecdh_compute_shared(&ecdhCtx.grp, &ecdhCtx.z,
                                       &ecdhCtx.Qp, &ecdhCtx.d,
                                       mbedtls_ctr_drbg_random, &ctrDrbg);
    if (ret != 0) {
        Serial.printf("ecdh_compute_shared failed: %d\n", ret);
        return false;
    }
    
    // Export shared secret
    ret = mbedtls_mpi_write_binary(&ecdhCtx.z, sharedSecret, 32);
    if (ret != 0) {
        Serial.printf("mpi_write_binary failed: %d\n", ret);
        return false;
    }
    
    hasSharedSecret = true;
    
    Serial.print("Shared secret derived (first 8 bytes): ");
    for (int i = 0; i < 8; i++) {
        Serial.printf("%02X", sharedSecret[i]);
    }
    Serial.println("...");
    
    return true;
}

bool deriveAESKey() {
    if (!hasSharedSecret) {
        Serial.println("No shared secret available");
        return false;
    }
    
    // Use HKDF to derive AES key from shared secret
    const unsigned char salt[] = "SafeEdge-AES-Key";
    const unsigned char info[] = "SafeEdge-ESP32-Encryption";
    
    int ret = mbedtls_hkdf(mbedtls_md_info_from_type(MBEDTLS_MD_SHA256),
                           salt, sizeof(salt) - 1,
                           sharedSecret, 32,
                           info, sizeof(info) - 1,
                           aesKey, AES_KEY_LENGTH);
    
    if (ret != 0) {
        Serial.printf("HKDF failed: %d\n", ret);
        return false;
    }
    
    Serial.print("AES-256 key derived (first 8 bytes): ");
    for (int i = 0; i < 8; i++) {
        Serial.printf("%02X", aesKey[i]);
    }
    Serial.println("...");
    
    return true;
}

// ==================== ENCRYPTION ====================
String encryptData(const String& jsonData) {
    // Generate random IV
    uint8_t iv[IV_LENGTH];
    generateRandomIV(iv, IV_LENGTH);
    
    // Prepare plaintext
    const uint8_t* plaintext = (const uint8_t*)jsonData.c_str();
    size_t plaintextLen = jsonData.length();
    
    // Allocate ciphertext buffer (same size as plaintext for GCM)
    uint8_t* ciphertext = (uint8_t*)malloc(plaintextLen);
    uint8_t authTag[AUTH_TAG_LENGTH];
    
    if (!ciphertext) {
        Serial.println("Memory allocation failed");
        return "";
    }
    
    // Create AAD (Additional Authenticated Data)
    String aadStr = String(DEVICE_ID) + ":" + String(millis());
    const uint8_t* aad = (const uint8_t*)aadStr.c_str();
    size_t aadLen = aadStr.length();
    
    // Initialize GCM context
    mbedtls_gcm_context gcm;
    mbedtls_gcm_init(&gcm);
    
    int ret = mbedtls_gcm_setkey(&gcm, MBEDTLS_CIPHER_ID_AES, aesKey, AES_KEY_LENGTH * 8);
    if (ret != 0) {
        Serial.printf("gcm_setkey failed: %d\n", ret);
        free(ciphertext);
        mbedtls_gcm_free(&gcm);
        return "";
    }
    
    // Encrypt with GCM
    ret = mbedtls_gcm_crypt_and_tag(&gcm, MBEDTLS_GCM_ENCRYPT,
                                     plaintextLen, iv, IV_LENGTH,
                                     aad, aadLen,
                                     plaintext, ciphertext,
                                     AUTH_TAG_LENGTH, authTag);
    
    mbedtls_gcm_free(&gcm);
    
    if (ret != 0) {
        Serial.printf("gcm_crypt_and_tag failed: %d\n", ret);
        free(ciphertext);
        return "";
    }
    
    // Build encrypted payload JSON
    StaticJsonDocument<2048> encryptedDoc;
    encryptedDoc["ciphertext"] = bytesToBase64(ciphertext, plaintextLen);
    encryptedDoc["iv"] = bytesToBase64(iv, IV_LENGTH);
    encryptedDoc["authTag"] = bytesToBase64(authTag, AUTH_TAG_LENGTH);
    encryptedDoc["devicePublicKey"] = devicePublicKeyBase64;
    encryptedDoc["timestamp"] = millis();
    encryptedDoc["deviceId"] = DEVICE_ID;
    
    free(ciphertext);
    
    String output;
    serializeJson(encryptedDoc, output);
    
    return output;
}

void generateRandomIV(uint8_t* iv, size_t length) {
    esp_fill_random(iv, length);
}

// ==================== SEND ENCRYPTED DATA ====================
void sendEncryptedSensorData() {
    // Generate sensor data
    float temperature = 36.8 + (random(-30, 30) / 100.0);
    float humidity = 55.0 + (random(-25, 25) / 10.0);
    bool motionDetected = random(100) < 5;
    bool doorOpen = random(100) < 2;
    
    // Determine threat level
    const char* threatLevel = "safe";
    int securityScore = 100;
    bool anomalyDetected = false;
    
    if (temperature < 36.5 || temperature > 37.5) {
        threatLevel = "critical";
        securityScore -= 30;
        anomalyDetected = true;
    }
    
    if (humidity < 50 || humidity > 60) {
        if (strcmp(threatLevel, "safe") == 0) {
            threatLevel = "warning";
        }
        securityScore -= 20;
        anomalyDetected = true;
    }
    
    // Update LED
    setStatusLED(threatLevel);
    
    // Build sensor data JSON
    StaticJsonDocument<512> sensorDoc;
    sensorDoc["type"] = "sensor_data";
    sensorDoc["device_id"] = DEVICE_ID;
    sensorDoc["temperature"] = temperature;
    sensorDoc["humidity"] = humidity;
    sensorDoc["air_pressure"] = 1013.0 + (random(-25, 25) / 10.0);
    sensorDoc["oxygen_level"] = 21.0 + (random(0, 50) / 100.0);
    sensorDoc["motion_detected"] = motionDetected;
    sensorDoc["door_status"] = doorOpen;
    sensorDoc["vibration_level"] = random(0, 30) / 100.0;
    sensorDoc["power_voltage"] = 12.0 + (random(-25, 25) / 100.0);
    sensorDoc["wifi_signal_strength"] = WiFi.RSSI();
    sensorDoc["threat_level"] = threatLevel;
    sensorDoc["anomaly_detected"] = anomalyDetected;
    sensorDoc["security_score"] = max(0, securityScore);
    sensorDoc["firmware_version"] = FIRMWARE_VERSION;
    sensorDoc["encrypted"] = true;
    
    String sensorJson;
    serializeJson(sensorDoc, sensorJson);
    
    // Encrypt the data
    String encryptedPayload = encryptData(sensorJson);
    
    if (encryptedPayload.length() == 0) {
        Serial.println("[ENCRYPTED] Failed to encrypt sensor data");
        return;
    }
    
    // Send to secure endpoint
    HTTPClient http;
    String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + "/api/esp32/secure-data";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(encryptedPayload);
    
    if (httpCode == 200) {
        Serial.print("[🔐 ENCRYPTED] ");
        if (strcmp(threatLevel, "critical") == 0) {
            Serial.print("🔴 CRITICAL");
        } else if (strcmp(threatLevel, "warning") == 0) {
            Serial.print("🟡 WARNING");
        } else {
            Serial.print("🟢 SAFE");
        }
        Serial.printf(" - Score: %d | Temp: %.2f°C | Encrypted: %d bytes\n", 
                      securityScore, temperature, encryptedPayload.length());
    } else {
        Serial.printf("[ENCRYPTED] Send failed: %d\n", httpCode);
    }
    
    http.end();
}

void sendEncryptedHeartbeat() {
    StaticJsonDocument<256> heartbeatDoc;
    heartbeatDoc["type"] = "heartbeat";
    heartbeatDoc["device_id"] = DEVICE_ID;
    heartbeatDoc["status"] = "online";
    heartbeatDoc["wifi_connected"] = WiFi.status() == WL_CONNECTED;
    heartbeatDoc["signal_strength"] = WiFi.RSSI();
    heartbeatDoc["uptime"] = millis() / 1000;
    heartbeatDoc["free_heap"] = ESP.getFreeHeap();
    heartbeatDoc["encrypted"] = true;
    
    String heartbeatJson;
    serializeJson(heartbeatDoc, heartbeatJson);
    
    String encryptedPayload = encryptData(heartbeatJson);
    
    if (encryptedPayload.length() == 0) {
        Serial.println("[ENCRYPTED] Failed to encrypt heartbeat");
        return;
    }
    
    HTTPClient http;
    String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + "/api/esp32/secure-data";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(encryptedPayload);
    
    if (httpCode == 200) {
        Serial.println("[🔐 ENCRYPTED] Heartbeat OK");
    } else {
        Serial.printf("[ENCRYPTED] Heartbeat failed: %d\n", httpCode);
    }
    
    http.end();
}

// ==================== UTILITY FUNCTIONS ====================
String bytesToBase64(const uint8_t* data, size_t length) {
    return base64::encode(data, length);
}

void base64ToBytes(const String& base64Str, uint8_t* output, size_t* outputLength) {
    String decoded = base64::decode(base64Str);
    *outputLength = decoded.length();
    memcpy(output, decoded.c_str(), *outputLength);
}
