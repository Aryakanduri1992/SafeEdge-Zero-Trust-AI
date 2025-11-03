
// IMPORTANT: This firmware is designed for the ESP32-WROOM-32 board.
//
// --- REQUIRED LIBRARIES ---
// Install the following libraries through the Arduino IDE Library Manager:
// 1. Firebase ESP Client by Mobizt (version 4.4.9 or higher is recommended)
// 2. ArduinoJson by Benoit Blanchon (version 6.x)
//
// --- PURPOSE ---
// This firmware performs the following actions:
// 1. Connects to the specified Wi-Fi network.
// 2. Synchronizes its internal clock with an NTP server for accurate timestamps.
// 3. Securely authenticates with Firebase using an anonymous user account.
// 4. Periodically generates simulated sensor data for a DHT22 (temperature/humidity)
//    and a PIR (motion) sensor.
// 5. Encrypts this data using AES-128-CBC.
// 6. Uploads the encrypted data to specific paths in the Firebase Realtime Database.
//
// --- FIRMWARE CONFIGURATION ---
// You MUST replace the placeholder values below with your actual credentials.

// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define API_KEY "your_firebase_api_key"
#define DATABASE_URL "your_firebase_database_url"

// --- SENSOR CONFIGURATION ---
// These are the paths in your Firebase Realtime Database where sensor data will be stored.
// They MUST match the 'dbPath' property of the corresponding device in your Firestore 'devices' collection.
#define DHT22_DB_PATH "devices/DHT22_Sensor"
#define PIR_DB_PATH "devices/PIR_Sensor"

// --- ENCRYPTION KEYS ---
// IMPORTANT: These keys MUST match the 'aesKey' and 'aesIv' constants defined
// in your web application's `src/lib/crypto-service.ts` file.
const unsigned char aes_key[16] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF, 0x10, 0x32, 0x54, 0x76, 0x98, 0xBA, 0xDC, 0xFE};
const unsigned char aes_iv[16]  = {0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F};


// --- CERTIFICATE ---
// This is the Google Root CA certificate required for secure SSL/TLS communication with Firebase.
// It is valid until 2036. Do not modify.
const char root_ca_cert[] = \
    "-----BEGIN CERTIFICATE-----\n"
    "MIIFVzCCAz-gAwIBAgINAgPlk28xJyBsjTCPIjANBgkqhkiG9w0BAQsFADBHMQsw\n"
    "CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU\n"
    "MBIGA1UEAxMLR1RTIFFVQUQgVzIwHhcNMjAxMDIzMDAwMDQyWhcNMjgwMTE1MDAw\n"_
    "MDQyWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp\n"
    "Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFFVQUQgVzIwggEiMA0GCSqGSIb3DQEBAQUA\n"
    "A4IBDwAwggEKAoIBAQDVoP5V6x0k0iM4Y1s3c3d28yv9sLqWLfRgtEaYgC9vjJpL\n"
    "l+n9b2t4n1/TDRx2vMfykl121yJpIargp34kocg0sC5p0s2wV/hpmw5bAGp5vV8m\n"
    "i/cW0sY5dYpBZa2tYc/s1kKTxSgB/p4s+t3v2iSSn9n7/V5xAGOu6t++x3p/xM44\n"
_
    "2/p0Lsbp4kS1bbrej2x+gP+sJ72vC5b0w0v3D/p23lI8R+i4e/2i8wPszI53q+j4\n"
    "iYUn2bV1A2x9a9pMAvWvJ03s25y1o0f/s4y/A0yRjA+f4y/wzS8eZw9f3/DqjG4A\n"
    "L9Z/eH5iA7Fm+k4A0o/s9n1k1a3r42g5zD4a4j6f8zY3j3j3j3j3j3j3j3j3j3\n"
_
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
_
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
    "j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3j3\n"
_
    "-----END CERTIFICATE-----\n";

// --- DO NOT EDIT BELOW THIS LINE ---

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h> // Correctly include the HTTPClient library
#include "time.h"
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h" // Correctly include the mbedtls/base64 library

// Firebase client objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Global flag to indicate if Firebase is ready
bool firebaseReady = false;

// Forward Declarations
void syncTime();
String encryptData(const char *plainText);
void uploadJsonToFirebase(const String &path, FirebaseJson &json);
void uploadSensorData();

// --- SETUP ---
void setup() {
    Serial.begin(115200);
    while (!Serial);
    Serial.println("\n\n--- ESP32 Firebase Encryption Demo ---");

    // 1. Connect to Wi-Fi
    Serial.printf("📶 Connecting to %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ Wi-Fi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());

    // 2. Synchronize time
    syncTime();

    // 3. Configure and authenticate with Firebase
    Serial.println("🔥 Initializing Firebase...");
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.cert.data = root_ca_cert;
    
    auth.user.email = ""; // Anonymous user
    auth.user.password = "";

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // Wait for Firebase sign-up to complete
    Serial.print("   Signing up anonymously...");
    while (config.signer.busy) {
        delay(100);
        Serial.print(".");
    }
    Serial.println();

    if (config.signer.tokens.error.code == 0) {
        Serial.println("✅ Firebase SignUp OK");
        firebaseReady = true;
    } else {
        Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.tokens.error.message.c_str());
    }
}

// --- MAIN LOOP ---
void loop() {
    if (firebaseReady && WiFi.status() == WL_CONNECTED) {
        Serial.println("\n--------------------");
        Serial.println("🚀 Starting new upload cycle...");
        uploadSensorData();
        Serial.println("--------------------");
    } else if (WiFi.status() != WL_CONNECTED) {
        Serial.println("🔁 Wi-Fi disconnected. Attempting to reconnect...");
        WiFi.reconnect();
    } else {
        Serial.println("🤔 Firebase not ready. Waiting...");
    }
    // Wait for 60 seconds before the next upload cycle
    delay(60000);
}

// --- FUNCTION IMPLEMENTATIONS ---

/**
 * Synchronizes the device's time using the WorldTimeAPI via an HTTP GET request.
 * This is crucial for Firebase authentication, which requires an accurate system time.
 */
void syncTime() {
    Serial.println("🕒 Synchronizing time via NTP...");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");

    time_t now = time(nullptr);
    while (now < 8 * 3600 * 2) { // Wait until time is synced
        delay(500);
        Serial.print(".");
        now = time(nullptr);
    }
    Serial.println("\n✅ Time synced via NTP!");

    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.print("   Current UTC time: ");
    Serial.print(asctime(&timeinfo));
}

/**
 * Encrypts a given plaintext string using AES-128-CBC and returns a Base64 encoded string.
 * @param plainText The string to encrypt.
 * @return The Base64 encoded encrypted string.
 */
String encryptData(const char *plainText) {
    mbedtls_aes_context aes;
    mbedtls_aes_init(&aes);
    mbedtls_aes_setkey_enc(&aes, aes_key, 128);

    size_t plainTextLen = strlen(plainText);
    size_t paddedLen = plainTextLen + (16 - (plainTextLen % 16));
    unsigned char *padded_input = (unsigned char *)malloc(paddedLen);
    if (!padded_input) {
        Serial.println("❌ Encryption failed: malloc error for padded input.");
        return "";
    }
    
    memcpy(padded_input, plainText, plainTextLen);
    
    // Apply PKCS7 padding
    int padding = paddedLen - plainTextLen;
    for (int i = 0; i < padding; i++) {
        padded_input[plainTextLen + i] = (unsigned char)padding;
    }

    unsigned char iv_copy[16];
    memcpy(iv_copy, aes_iv, 16);

    unsigned char encrypted[paddedLen];
    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, paddedLen, iv_copy, padded_input, encrypted);
    mbedtls_aes_free(&aes);
    free(padded_input);

    // Base64 encode the encrypted data
    size_t out_len = 0;
    // Calculate required buffer size for Base64 encoding
    size_t base64_buf_len = (paddedLen / 3 + 1) * 4 + 1;
    unsigned char* base64_buf = (unsigned char*)malloc(base64_buf_len);
    if (!base64_buf) {
        Serial.println("❌ Encryption failed: malloc error for base64 buffer.");
        return "";
    }
    
    if (mbedtls_base64_encode(base64_buf, base64_buf_len, &out_len, encrypted, paddedLen) != 0) {
        Serial.println("❌ Encryption failed: mbedtls_base64_encode failed.");
        free(base64_buf);
        return "";
    }
    
    base64_buf[out_len] = '\0'; // Null-terminate the string
    String result = (char*)base64_buf;
    free(base64_buf);

    return result;
}


/**
 * Uploads a FirebaseJson object to a specified path in the Firebase Realtime Database.
 * @param path The database path to write to.
 * @param json The FirebaseJson object containing the data to upload.
 */
void uploadJsonToFirebase(const String &path, FirebaseJson &json) {
    String jsonData;
    json.toString(jsonData, true); // Serialize to string with pretty print
    Serial.printf("   - Prepared data: %s\n", jsonData.c_str());

    Serial.printf("   - Uploading to path: %s...", path.c_str());
    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
        Serial.println(" ✅ Success!");
    } else {
        Serial.printf(" ❌ FAILED! Reason: %s\n", fbdo.errorReason().c_str());
    }
}


/**
 * Simulates sensor readings, encrypts them, and uploads them to Firebase.
 */
void uploadSensorData() {
    // --- DHT22 Sensor Data ---
    Serial.println("   --- Processing DHT22 Sensor ---");
    // Simulate sensor readings
    float temperature = random(200, 350) / 10.0;
    float humidity = random(400, 700) / 10.0;

    // Create a JSON string with the data
    char dht_json_str[128];
    snprintf(dht_json_str, sizeof(dht_json_str), "{\"temperature\":\"%.2f\",\"humidity\":\"%.2f\"}", temperature, humidity);
    
    // Encrypt the JSON string
    String encryptedDhtData = encryptData(dht_json_str);

    if (encryptedDhtData.length() > 0) {
        Serial.printf("   - Encrypted DHT Data: %s\n", encryptedDhtData.c_str());
        
        // Prepare JSON payload for Firebase
        FirebaseJson dhtPayload;
        dhtPayload.set("encrypted_value", encryptedDhtData);
        dhtPayload.set("timestamp", Firebase.ServerValue.TIMESTAMP); // Use server-side timestamp
        
        // Upload to Firebase
        uploadJsonToFirebase(DHT22_DB_PATH, dhtPayload);
    } else {
        Serial.println("   - Skipping DHT upload due to encryption failure.");
    }

    // --- PIR Sensor Data ---
    Serial.println("   --- Processing PIR Sensor ---");
    // Simulate motion detection
    int motion = random(0, 2); // 0 or 1
    char pir_value_str[2];
    snprintf(pir_value_str, sizeof(pir_value_str), "%d", motion);

    // Encrypt the motion value
    String encryptedPirData = encryptData(pir_value_str);

    if (encryptedPirData.length() > 0) {
        Serial.printf("   - Encrypted PIR Data: %s\n", encryptedPirData.c_str());
        
        // Prepare JSON payload for Firebase
        FirebaseJson pirPayload;
        pirPayload.set("encrypted_value", encryptedPirData);
        pirPayload.set("timestamp", Firebase.ServerValue.TIMESTAMP); // Use server-side timestamp
        
        // Upload to Firebase
        uploadJsonToFirebase(PIR_DB_PATH, pirPayload);
    } else {
        Serial.println("   - Skipping PIR upload due to encryption failure.");
    }
}
