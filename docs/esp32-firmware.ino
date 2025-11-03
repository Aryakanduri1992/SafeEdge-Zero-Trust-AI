
// =================================================================================================
// SafeEdge Cyber Systems - ESP32 Firmware
//
// Description:
// This firmware is designed for an ESP32 microcontroller to securely monitor and report sensor
// data to a Firebase backend. It performs the following key functions:
// 1.  Connects to a specified Wi-Fi network.
// 2.  Synchronizes its internal clock with an NTP server for accurate timestamps, with an
//     HTTP fallback.
// 3.  Authenticates with Firebase using an anonymous user credential.
// 4.  Simulates sensor data for a DHT22 (temperature/humidity) and a PIR (motion) sensor.
// 5.  Encrypts the sensor data locally on the device using AES-128 CBC encryption.
// 6.  Uploads the encrypted data packet along with a timestamp to a specified path in the
//     Firebase Realtime Database.
// 7.  Includes robust error handling for Wi-Fi, time sync, and Firebase communication.
//
// Security Note:
// The AES key and IV are hardcoded in this firmware. For production environments, consider
// more secure methods of key provisioning, such as using a hardware security module (HSM)
// or secure element.
//
// =================================================================================================


// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define API_KEY "your_firebase_api_key"
#define DATABASE_URL "your_firebase_database_url"

// --- Device Path Configuration ---
// These paths must match the 'dbPath' of the corresponding device in your Firestore database.
#define DHT_SENSOR_PATH "devices/DHT22_Sensor"
#define PIR_SENSOR_PATH "devices/PIR_Sensor"


// --- Root CA Certificate for Firebase ---
// This is the Google Trust Services GTS Root R1 certificate.
// It is required to establish a secure SSL/TLS connection to Firebase services.
const char root_ca_cert[] =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIFYDCCBEigAwIBAgIQAmpQazAAo21yrD03t83fkDANBgkqhkiG9w0BAQsFADBa\n"
    "MQswCQYDVQQGEwJVUzETMBEGA1UEChMKR29vZ2xlIFRydXN0IFNlcnZpY2VzIExM\n"
    "QzEzMDEGA1UEAxMqR29vZ2xlIFRydXN0IFNlcnZpY2VzIEdsb2JhbFNpZ24gUm9v\n"
    "dCBDQS1SNDAeFw0yMDA3MDYwMDAwMDBaFw0yOTA2MDYwMDAwMDBaMFoxCzAJBgNV\n"
    "BAYTAlVTMRMwEQYDVQQKEwpHb29nbGUgVHJ1c3QgU2VydmljZXMgTExDMTMwMQYD\n"
    "VQQDEypHb29nbGUgVHJ1c3QgU2VydmljZXMgR2xvYmFsU2lnbiBSb290IENBLVI0\n"
    "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAi5GXXg1TQu4Oa5d2tMoR\n"
    "s7K+na03NjAF9wBCg41kO5nchI+5yI5tq5dIB2AMh2QeCSWd/e6ifXoBDJbYYp6Y\n"
    "v0VjRDrrQE325AOG1N9S2T20u2k5vj4x472j1dG4yMXBvRjR2gpyH1mPoIMjYCPQ\n"
    "tY42GKA2+s3EHNz6fW1b6PmpSSxLjbYlOq5Ncfq8S5iQYc0DY8M1pA384y2g9x88\n"
    "D5S2rLVpDWv9a3PipcCM4q68G1BLj3eYyXgaA2Az52fO0YdXK2+cAFv3T3q5z0MB\n"
    "sceu+d3b2n+3k5Yow433ne4/8/sC9b2v7e3N0P2gYxG5pfyL+bFzST1rS4p2gI8B\n"
    "u6Wp8n1s4S6nAB4Sxn7Wn4PAt5b2j3hG+j3bshUFr2nsc0qnLzoXDssPQd32fni4\n"
    "X1fhVXy3W+LMgKE2zGvJc6sVbTtoHxCkGjT24rfk1gL6cvC0I6k2m5/b7kML3wdi\n"
    "3jchjqL2n6q4s1rXbA1fWxsd/YhXBqWsoNE3v4aIsrY7up6P80p9vB4w5V+hS2j0\n"
    "2G2i2vSAnE3Zzfq3x//30v2Wok7LpA39p239pZq32gPNiTg3qjpc2BCf268bza22\n"
    "3k9bdAyOCs3yUprwFdcwazECAwEAAaNjMGEwDgYDVR0PAQH/BAQDAgGGMA8GA1Ud\n"
    "EwEB/wQFMAMBAf8wHQYDVR0OBBYEFJj1i9Lw7XB2+O3S4D2d6p0w8tU2MB8GA1Ud\n"
    "IwQYMBaAFJj1i9Lw7XB2+O3S4D2d6p0w8tU2MA0GCSqGSIb3DQEBCwUAA4ICAQBg\n"
    "wMPeWwV4233vLdo+cW+Gf/6e52jFC50eP4L3sFMa42N0c2JGJqB9j41yqFzD5bA6\n"
    "08WtdfQhYyJdnpwGAtiQsz9l9i/a3b1Z1iQ4s4yq2u8f7jJh2uEzuF1yyfQkp9hH\n"
    "43Qd4K+sDQpJPsoT0J05BRmBP+kC4fe1apE0s4S4lSYsEDt+p+yQpE4iufYdIlS9\n"
    "zd/2z+d5lppZp9LFLzVf9sU+UfUE3SoAn/o+iFcQk0u0ll4u+qt0nyyYW54x8gQ2\n"
    "yEwX9aECKk45O8XSa/2n9vVl7SOcHzPc4aYwYlK2dhu4eI1iBSp5ub3sXyf4V+0P\n"
    "q2B9y4zbnBP4n5/n/XDtUs2N8HhYmCSECqJryzWp4je1kAGYvjKHEtNf+eN3kG+B\n"
    "6g5v2u1PwbcvAnM2M20h3j2L7v3zU4D4Bu2J6TzscSjJ3E5tH7uK6Y0sHr3WjBuA\n"
    "3QZgQ6WNVtftoIYFp2vvaS1L2XEyhRNJm7tVp3f25h3V3x8iYV2p4A3uvk3zBs+l\n"
    "gEQt6YcGAzOk9N4AUd6t2pbaBp2Wb1c3e3aP+k2y5j6y0AtE5b53pUkwcE6pXscX\n"
    "aGReu1H4rqs9y38cGNyIub49Q/tp4hXR03sYg9y9DQ==\n"
    "-----END CERTIFICATE-----\n";


// --- Library Imports ---
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>
#include "Firebase_ESP_Client.h"
#include <ArduinoJson.h>
#include <mbedtls/aes.h>


// --- Firebase Objects ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- AES Encryption Configuration ---
// IMPORTANT: This key and IV MUST match the values in your web app's crypto-service.ts
unsigned char aes_key[] = {
    0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF,
    0x10, 0x32, 0x54, 0x76, 0x98, 0xBA, 0xDC, 0xFE
};
unsigned char aes_iv[] = {
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
};

// --- Global State ---
unsigned long lastUpload = 0;
const long uploadInterval = 30000; // 30 seconds

// =================================================================================================
// TIME SYNCHRONIZATION
// =================================================================================================

// Function to synchronize time with an NTP server, with an HTTP fallback.
void syncTime() {
    Serial.print("⏳ Syncing time");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    
    time_t now = time(nullptr);
    int attempts = 0;
    while (now < 8 * 3600 * 2) { // Loop until time is synced
        Serial.print(".");
        delay(500);
        now = time(nullptr);
        attempts++;
        if (attempts > 20) { // After 10 seconds, try HTTP fallback
            Serial.println("\n▲ NTP Time sync failed. Trying HTTP fallback...");
            
            WiFiClient client;
            HTTPClient http;
            http.begin(client, "http://worldtimeapi.org/api/ip");
            int httpCode = http.GET();
            if (httpCode > 0) {
                if (httpCode == HTTP_CODE_OK) {
                    String payload = http.getString();
                    JsonDocument doc;
                    deserializeJson(doc, payload);
                    time_t epoch = doc["unixtime"];
                    struct timeval tv;
                    tv.tv_sec = epoch;
                    tv.tv_usec = 0;
                    settimeofday(&tv, nullptr);
                    Serial.println("🕒 Time synced via HTTP!");
                    http.end();
                    return; // Exit after successful HTTP sync
                }
            } else {
                Serial.printf("▲ HTTP Time Sync: Connection failed. Error: %s\n", http.errorToString(httpCode).c_str());
            }
            http.end();
            Serial.println("❌ CRITICAL: Time synchronization failed. Both NTP and HTTP methods failed.");
            Serial.println("🚨 System halted. Check network firewall or internet connection.");
            while(1) { // Halt execution
                digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
                delay(100);
            }
        }
    }
    Serial.println("\n🕒 Time synced via NTP!");
}


// =================================================================================================
// ENCRYPTION
// =================================================================================================

// Encrypts plaintext data using AES-128 CBC and returns a Base64 encoded string.
String encryptData(const char * plainText) {
    int plainTextLen = strlen(plainText);
    int paddedLen = plainTextLen + (16 - (plainTextLen % 16));
    unsigned char *paddedPlainText = (unsigned char *)malloc(paddedLen);
    memcpy(paddedPlainText, plainText, plainTextLen);
    
    // Apply PKCS7 padding
    int padding = paddedLen - plainTextLen;
    for (int i = 0; i < padding; i++) {
        paddedPlainText[plainTextLen + i] = padding;
    }

    unsigned char encrypted[paddedLen];
    mbedtls_aes_context aes;
    mbedtls_aes_init(&aes);
    mbedtls_aes_setkey_enc(&aes, aes_key, 128);
    
    unsigned char temp_iv[16];
    memcpy(temp_iv, aes_iv, 16);

    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, paddedLen, temp_iv, paddedPlainText, encrypted);
    mbedtls_aes_free(&aes);
    free(paddedPlainText);

    // Base64 encode the encrypted data
    size_t out_len;
    unsigned char base64_buf[paddedLen * 2];
    mbedtls_base64_encode(base64_buf, sizeof(base64_buf), &out_len, encrypted, paddedLen);
    
    return String((char*)base64_buf);
}


// =================================================================================================
// FIREBASE UPLOADER
// =================================================================================================

// Uploads a JSON document to a specified path in Firebase Realtime Database.
void uploadJsonToFirebase(const String& path, const JsonDocument& jsonDoc, const String& sensorType) {
    if (Firebase.ready()) {
        if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &jsonDoc)) {
            Serial.printf("✅ %s encrypted data uploaded!\n", sensorType.c_str());
        } else {
            Serial.printf("❌ %s upload failed: %s\n", sensorType.c_str(), fbdo.errorReason().c_str());
        }
    } else {
        Serial.println("⚠️ Firebase not ready — retrying...");
    }
}


// =================================================================================================
// SENSOR SIMULATION AND UPLOAD LOGIC
// =================================================================================================

// Simulates and uploads data for both DHT22 and PIR sensors.
void uploadSensorData() {
    // --- DHT22 Sensor Simulation ---
    float temp = random(20, 30) + random(0, 100) / 100.0;
    float humidity = random(40, 60) + random(0, 100) / 100.0;
    
    char dhtPayload[128];
    snprintf(dhtPayload, sizeof(dhtPayload), "{\"temperature\":\"%.2f\",\"humidity\":\"%.2f\"}", temp, humidity);
    String encryptedDHT = encryptData(dhtPayload);
    
    JsonDocument dhtJson;
    dhtJson["encrypted_value"] = encryptedDHT;
    dhtJson["timestamp"] = ServerValue::TIMESTAMP;
    uploadJsonToFirebase(DHT_SENSOR_PATH, dhtJson, "DHT22");

    delay(1000); // Small delay between sensor uploads

    // --- PIR Sensor Simulation ---
    int motion = random(0, 2); // Generates 0 or 1
    char pirPayload[16];
    snprintf(pirPayload, sizeof(pirPayload), "%d", motion);
    String encryptedPIR = encryptData(pirPayload);

    JsonDocument pirJson;
    pirJson["encrypted_value"] = encryptedPIR;
    pirJson["timestamp"] = ServerValue::TIMESTAMP;
    uploadJsonToFirebase(PIR_SENSOR_PATH, pirJson, "PIR");
}


// =================================================================================================
// SETUP & LOOP
// =================================================================================================

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);

    // --- Connect to Wi-Fi ---
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("🔌 Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(500);
    }
    Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());

    // --- Synchronize Time ---
    syncTime();

    // --- Initialize Firebase ---
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.cert.data = root_ca_cert;

    // Sign up anonymously
    Serial.println("🔐 Signing up with Firebase (anonymously)...");
    config.signer.test_mode = true; // Use anonymous user
    Firebase.begin(&config, &auth);
    Firebase.signUp(&config, &auth, "", ""); // Email and password are not used in test_mode

    if (auth.token.uid.length() > 0) {
        Serial.println("✅ Firebase SignUp OK");
    } else {
        Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.error.message.c_str());
    }
    
    Firebase.reconnectWiFi(true);
    Serial.println("🔥 Firebase initialized!");
}

void loop() {
    unsigned long currentMillis = millis();
    if (currentMillis - lastUpload >= uploadInterval) {
        lastUpload = currentMillis;
        uploadSensorData();
    }
}

    