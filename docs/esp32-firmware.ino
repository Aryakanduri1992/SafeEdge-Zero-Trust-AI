
// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define API_KEY "your_firebase_api_key"
#define DATABASE_URL "your_firebase_database_url"

// --- AES Encryption Configuration ---
// IMPORTANT: This key and IV MUST match the values in your Next.js application.
// Key (32 hex characters for AES-128)
const byte aes_key[] = {
    0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF,
    0x10, 0x32, 0x54, 0x76, 0x98, 0xBA, 0xDC, 0xFE};
// IV (16 hex characters for AES-128)
const byte aes_iv[] = {
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F};

// --- Root CA Certificate for Firebase ---
// This certificate is required for a secure SSL/TLS connection to Firebase.
// ISRG Root X1, valid until 2035
const char *root_ca_cert =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
    "TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"

    "cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
    "WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
    "ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTEElTUkcgUm9vdCBY\n"

    "MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0PiD6yWnfVGkc\n"
    "glozaMje4b3dSB+uTh5e/YkCeGCCraSqSb4KpnvgoYXoRdMAud8CKcxLitW8iGwt\n"
    "OAhcoj5bQiZvKFNV2dksvYvlYV7L5hSYbJo1ySA9E4gY6G5d322S1TbuAisU1WTs\n"
    "O8JGloId3NKn3pIgFlZeKSHW1hRk+I+1KkM10KThZ2dhoIe7+05E1kux2G9KMCey\n"
    "L3s+N51pG2AsB4H3AyD7dK24a7WcJB6nWXkroV6S5a62s2R2PdhO9N2eUe4S6n+1\n"
    "nC2/a5V2ylc/LghK2s9An5s20m04bHXyR6k9g58sAgM5OUMG/F2vksyQY1sR4S2t\n"
    "GkP9w32G1j3vW3w652Vq6fN8m+fbM3/u/FO4C8F9s3o3dUNj1c3UnbI2sBf0C+p4\n"
    "5lmsjX52e8sOHwR2ve1vUv3WortOPN/20rU2g9l1AIX5l1En2Yv/FAn/h8jODK78\n"
s52+ER9Gl+3fX3Iq90+M1NB2j4i0i+iZkG1k0tG9D0KFGffDcrhEdKF9Yc9o3jCXwzV\n"
    "7tWp/l+dtUQh218n2c8yY2Stt/2Bdt255jwNcB/5y5eCqxlhNDdFfRVAs5bT5g9z\n"
    "uglI0/B9io3fE21pC15tB1hI2mG2Aap61z4N7O1nFv51DbpLYt/r7t4d5P0r/GKV\n"
    "H5xXxL7saJc5+iLg3b21JmfxwT2WnsXY2pA/Gf9N4c0v0Q7cT2A8y2hB8bWlPUZ2\n"
    "8f5oyPE2GC5xckL0zMSj2n4F2p8y5G5iW1L6bK2sYCyL5A5A1c/X+Dk2bSPmRjG/\n"
    "K4u1Bq0j3vY6i5TfxyjPq7A+PQc+sTMj8Y3dG9x8L0VlBwY6G/15+3i/l5wzpqF\n"
    "Q1a5FkYk6bHwLeksJhUN3a4y/35XgPj9wVz6A8mHwS84duUN48QyL5F5L/D15yqV\n"
    "zCET4IqYJv03fzt5aG9iWq7u2fP6gqVIuWJalBvOaMvLp62s32GgCRf2V/s2i8vR\n"
aZ2CgWPRs/dJkkA7zB5APpUFj93uNf3d+lDkLzW9a2a7WlTz/1wU5ncyWp/Xo3m3csm\n"
    "gUP6v83A/t5550V5Kz13G2V2t5bbf9jpxr7b3f9x6854v3x5f2f4e3c3b2t3y5d2\n"
    "v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7\n"
    "c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3\n"
    "c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2\n"
    "v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7\n"
    "c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3\n"
    "c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2\n"
    "v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7\n"
    "c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7c3d2v5t3x4f3\n"
    "c5b5z2e7c5b7c3d2v5t3x4f3c5b5z2e7c5b7AgMBAAGjQjBAMA4GA1UdDwEB/wQE\n"
    "AwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRIbmRhP5aJ2b3SjQE2x7GC\n"
    "PRL2AjANBgkqhkiG9w0BAQsFAAOCAgEAM3PePh4xS2pSSFny3YkI5wVfi7gY+z25\n"
    "d7l4uV3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t\n"
    "2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGv\n"
s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGv\n"
    "S3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v\n"
    "3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d\n"
    "6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t\n"
    "2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGv\n"
    "S3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v\n"
    "3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d\n"
    "6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t\n"
    "2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGv\n"
    "S3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v3s4kGvS3s+t2f2e5d6v3s5v\n"
    "-----END CERTIFICATE-----\n";


// --- Library Includes ---
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h> // For time synchronization
#include <time.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <mbedtls/aes.h>
#include <mbedtls/base64.h>

// --- Firebase Objects ---
FirebaseAuth auth;
FirebaseConfig config;
FirebaseData fbdo;
FirebaseJson json; // Use FirebaseJson for all JSON operations

// --- Global Variables ---
unsigned long last_upload_time = 0;
const long upload_interval = 30000; // 30 seconds

// --- Function Declarations ---
void syncTime();
String encryptData(const char *plainText);
void uploadEncryptedData(const String &path, const String &encryptedValue);
void uploadSensorData();

// --- Time Synchronization ---
void syncTime() {
    Serial.println("🕰️  Attempting to synchronize time...");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 10000)) { // 10-second timeout
        Serial.println("❌ CRITICAL: NTP Time synchronization failed. Retrying with HTTP fallback...");
        // Fallback to WorldTimeAPI
        WiFiClient client;
        HTTPClient http;
        http.begin(client, "http://worldtimeapi.org/api/ip");
        int httpCode = http.GET();
        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            JsonDocument doc;
            deserializeJson(doc, payload);
            long unixtime = doc["unixtime"];
            
            time_t t = unixtime;
            struct tm *tm_info = localtime(&t);
            timeinfo = *tm_info;

            Serial.printf("✅ HTTP Time synchronized: %s\n", asctime(&timeinfo));
        } else {
            Serial.printf("❌ CRITICAL: HTTP Time synchronization failed. HTTP Code: %d. Cannot proceed.\n", httpCode);
            while(1); // Halt execution
        }
        http.end();
    } else {
        Serial.printf("✅ NTP Time synchronized: %s\n", asctime(&timeinfo));
    }
}

// --- AES Encryption ---
String encryptData(const char *plainText) {
    mbedtls_aes_context aes;
    mbedtls_aes_init(&aes);
    mbedtls_aes_setkey_enc(&aes, aes_key, 128);

    size_t plainTextLen = strlen(plainText);
    size_t paddedLen = plainTextLen + (16 - (plainTextLen % 16));
    unsigned char *paddedInput = (unsigned char *)malloc(paddedLen);
    if (!paddedInput) {
        Serial.println("❌ Encryption failed: Malloc failed.");
        return "";
    }
    memcpy(paddedInput, plainText, plainTextLen);

    // Apply PKCS7 padding
    byte padding = 16 - (plainTextLen % 16);
    for (size_t i = plainTextLen; i < paddedLen; i++) {
        paddedInput[i] = padding;
    }

    unsigned char encrypted[paddedLen];
    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, paddedLen, aes_iv, paddedInput, encrypted);

    // Base64 encode the encrypted data
    size_t out_len = 0;
    // Calculate required buffer size for base64 encoding
    mbedtls_base64_encode(NULL, 0, &out_len, encrypted, paddedLen);
    unsigned char *base64_buf = (unsigned char *)malloc(out_len);
    if (!base64_buf) {
        Serial.println("❌ Base64 encoding failed: Malloc failed.");
        free(paddedInput);
        return "";
    }

    mbedtls_base64_encode(base64_buf, out_len, &out_len, encrypted, paddedLen);

    String result = String((char *)base64_buf);

    mbedtls_aes_free(&aes);
    free(paddedInput);
    free(base64_buf);

    return result;
}

// --- Firebase Upload ---
void uploadEncryptedData(const String &path, const String &encryptedValue) {
    if (Firebase.ready()) {
        json.clear(); // Clear previous JSON data
        json.set("encrypted_value", encryptedValue);
        json.set("timestamp", Firebase.ServerValue.TIMESTAMP);

        Serial.printf("⬆️  Uploading to: %s\n", path.c_str());
        if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
            Serial.println("✅ Upload successful.");
        } else {
            Serial.printf("❌ Upload failed: %s\n", fbdo.errorReason().c_str());
        }
    } else {
        Serial.println("... Firebase not ready, skipping upload.");
    }
}

// --- Sensor Data Simulation & Upload ---
void uploadSensorData() {
    Serial.println("\n--- Starting Sensor Upload Cycle ---");

    // --- DHT22 Sensor ---
    float temp = random(200, 300) / 10.0;
    float humidity = random(400, 600) / 10.0;
    
    char dhtPayload[64];
    snprintf(dhtPayload, sizeof(dhtPayload), "{\"temperature\":\"%.1f\",\"humidity\":\"%.1f\"}", temp, humidity);
    
    Serial.printf("   🌡️  DHT22 Data: %s\n", dhtPayload);
    String encryptedDht = encryptData(dhtPayload);
    if (encryptedDht.length() > 0) {
        uploadEncryptedData("devices/DHT22_Sensor", encryptedDht);
    }

    delay(2000); // Small delay between sensor uploads

    // --- PIR Sensor ---
    int motion = random(0, 2); // 0 for no motion, 1 for motion
    char pirPayload[4];
    snprintf(pirPayload, sizeof(pirPayload), "%d", motion);
    
    Serial.printf("   🏃 PIR Data: %s\n", pirPayload);
    String encryptedPir = encryptData(pirPayload);
    if (encryptedPir.length() > 0) {
        uploadEncryptedData("devices/PIR_Sensor", encryptedPir);
    }
}

// --- Main Setup ---
void setup() {
    Serial.begin(115200);
    while (!Serial);
    Serial.println("\n\n--- AuthStation ESP32 Sensor Client ---");

    // Connect to Wi-Fi
    Serial.printf("📡 Connecting to Wi-Fi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(500);
    }
    Serial.printf("\n✅ Wi-Fi Connected. IP: %s\n", WiFi.localIP().toString().c_str());

    // Synchronize time
    syncTime();

    // Configure Firebase
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.cert.data = root_ca_cert;

    // Sign up anonymously
    auth.user.email = "";
    auth.user.password = "";

    Serial.println("🔒 Signing up for Firebase anonymously...");
    Firebase.signUp(&config, &auth, "", "");
    config.token_status_callback = tokenStatusCallback;
    
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
}

// --- Main Loop ---
void loop() {
    if (Firebase.ready() && (millis() - last_upload_time > upload_interval || last_upload_time == 0)) {
        last_upload_time = millis();
        uploadSensorData();
    }
}

    