
// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define API_KEY "your_firebase_api_key"
#define DATABASE_URL "your_firebase_database_url"

// --- Sensor & Encryption Configuration ---
#define AES_KEY "0123456789ABCDEF1032547698BADCFE" 
#define AES_IV  "000102030405060708090A0B0C0D0E0F"
#define PIR_SENSOR_PIN 23 
#define DHT_SENSOR_PIN 22
#define DHT_SENSOR_TYPE DHT22

// --- Root CA Certificate ---
// This is the Google Trust Services (GTS) Root R1 certificate.
// It is required to establish a secure SSL/TLS connection to Firebase services.
const char root_ca_cert[] = \
    "-----BEGIN CERTIFICATE-----\n" \
    "MIIFYjCCBEqgAwIBAgIQd70NbieR+DCQ/UMB4s9E6DAKBggqhkjOPQQDAzBMMQsw\n" \
    "CQYDVQQGEwJVUzEVMBMGA1UEChMMR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEZ\n" \
    "MBcGA1UEAxMQR1RTIFJvb3QgUjEgQ1JMMzAeFw0yMDA4MTMwMDAwMDBaFw0yNzA5\n" \
    "MzAwMDAwMDBaMEwxCzAJBgNVBAYTAlVTMRUwEwYDVQQKEwxHb29nbGUgVHJ1c3Qg\n" \
    "U2VydmljZXMgTExDMRkwFwYDVQQDExBHVFMgUm9vdCBSMSBDUkwzMIIBIjANBgkq\n" \
    "hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28A+23Y21P+nB5yg6b0+2g8iU0L/ujb2\n" \
    "i/iA+ET6yP5d42z3c+825s9prtocoYJ7LpEa9A+59v63nLwZdLDiy4s4MRXEpL2X\n" \
    "s5TV4x2fJ70bAC023t3wJzY37UaE8Ckr94EWfIuFby/m8a+uc4tWc/zPg1c8v3Js\n" \
    "o8f2S7MEzuZZtuM/V3LwXWfCAfYS4aDBsCO+kCRf1tJy5fvs1eGjP/5J3jQxnkxP\n" \
    "Fp1r/LffV0G3F2yNAdwecykEuJ6L//zHr04jMAshd51z5atqj4aGDxW3e8GS+pAc\n" \
    "2j8cZkG8x5Y13GyTO2p+lP0zR5O+t0UoSNTM/sYpM/FzGZ8wJ7P2EEwIDAQABo4IB\n" \
    "gDCCAXwwDgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0O\n" \
    "BBYEFIN5HQ320I+94zDBzsMAp2BL5rT3MFoGCCsGAQUFBwEBBE4wTDBKBggrBgEF\n" \
    "BQcwAoY+aHR0cDovL3BraS5nb29nL3JlcG8vZnVsbGNoYWluLmRlcjAhBgNVHREE\n" \
    "GjAYgRZhcHBsaWNhdGlvbi9vY3NwLWNybDAdBgNVHSAEFjAUMAgGBmeBDAECATAIB\n" \
    "gZngQwBBAjA/BgNVHR8EODA2MDSgMqAwhi5odHRwOi8vY3JsLnBraS5nb29nL2dz\n" \
    "cjEvZ3RzcjFjcmwzLmNybDCBggYDVR0jBIGBMH+AFDe639s2o5527i+y5+4y2v7v\n" \
    "IwjPoVekVDBRMA8GA1UEAwwIR2xvYmFsU2lnbjETMBEGA1UECgwKR2xvYmFsU2ln\n" \
    "bjETMBEGA1UEBwwKTmV3IEhhbXBzaGlyZTELMAkGA1UEBhMCVVMxEzARBgNVBAgM\n" \
    "Ck5ldyBIYW1wc2hpcmWCCQDo3+gL6913eDAKBggqhkjOPQQDAwNIADBFAiEA3Dkv\n" \
\n" \
\n" \
\n" \
\n" \
    "-----END CERTIFICATE-----\n";

// --- Includes ---
#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <mbedtls/aes.h>
#include "Adafruit_Sensor.h"
#include <DHT.h>

// --- Firebase Objects ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- Time and State Objects ---
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");
unsigned long lastUploadTime = 0;
const unsigned long uploadInterval = 30000; // 30 seconds

// --- Sensor Objects ---
DHT dht(DHT_SENSOR_PIN, DHT_SENSOR_TYPE);
volatile bool motionDetected = false;
unsigned long lastMotionTime = 0;
const long motionDebounceTime = 2000; // 2 seconds

// --- Function Prototypes ---
void syncTime();
String encryptData(const String& plainText);
String base64Encode(byte* data, int len);
void IRAM_ATTR detectsMovement();
void uploadDataOnce();


void setup() {
    Serial.begin(115200);
    while (!Serial) { continue; }
    Serial.println("\n\n🚀 Starting up...");

    // Initialize sensors
    pinMode(PIR_SENSOR_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIR_SENSOR_PIN), detectsMovement, RISING);
    dht.begin();
    
    // Connect to Wi-Fi
    Serial.printf("📡 Connecting to Wi-Fi: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(500);
    }
    Serial.printf("\n✅ Wi-Fi connected: %s\n", WiFi.localIP().toString().c_str());

    // Sync time (critical for SSL)
    syncTime();
    
    // Assign the API key and database URL
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    // Assign the certificate
    config.cert.data = root_ca_cert;

    // Sign up anonymously
    Serial.println("🔐 Signing up with Firebase (anonymously)...");
    if (Firebase.signUp(&config, &auth, "", "")) {
        Serial.println("✅ Firebase SignUp OK");
        config.token_status_callback = tokenStatusCallback;
    } else {
        Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.signupError.message.c_str());
    }

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    Serial.println("🔥 Firebase initialized!");
}

void loop() {
    if (Firebase.ready() && (millis() - lastUploadTime > uploadInterval)) {
        lastUploadTime = millis();
        uploadDataOnce();
    } else if (!Firebase.ready()) {
         Serial.println("⚠️ Firebase not ready — retrying...");
         delay(2000);
    }
    delay(100);
}

void syncTime() {
    Serial.print("⏳ Syncing time...");
    timeClient.begin();
    if (timeClient.forceUpdate()) {
        Serial.println("\n🕒 Time synced via NTP!");
        time_t now = time(nullptr);
        Serial.printf("   Current time: %s", ctime(&now));
        return;
    } 
    Serial.println("\n▲ NTP Time sync failed. Trying HTTP fallback...");
    
    HTTPClient http;
    http.begin("http://worldtimeapi.org/api/timezone/Etc/UTC");
    int httpCode = http.GET();
    if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            JsonDocument doc;
            deserializeJson(doc, payload);
            long unixtime = doc["unixtime"];
            
            timeval tv;
            tv.tv_sec = unixtime;
            tv.tv_usec = 0;
            settimeofday(&tv, nullptr);
            
            Serial.println("\n🕒 Time synced via HTTP!");
            time_t now = time(nullptr);
            Serial.printf("   Current time: %s", ctime(&now));
        } else {
            Serial.printf("\n▲ HTTP Time Sync: HTTP Error %d\n", httpCode);
        }
    } else {
        Serial.printf("▲ HTTP Time Sync: Connection failed. Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();

    time_t checkTime = time(nullptr);
    // Check if time is reasonable (e.g., after 2024). 1704067200 is Jan 1, 2024.
    if (checkTime < 1704067200) { 
        Serial.println("❌ CRITICAL: Time synchronization failed. Cannot proceed.");
        Serial.println("🚨 System halted. Check network connection and firewall settings.");
        while(1) {
          digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
          delay(100);
        } // Halt
    }
}

// Interrupt service routine for motion detection
void IRAM_ATTR detectsMovement() {
  if ((millis() - lastMotionTime) > motionDebounceTime) {
    motionDetected = true;
    lastMotionTime = millis();
  }
}

// Function to upload sensor data once
void uploadDataOnce() {
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }

    // Create a JSON object for both readings
    JsonDocument dhtDoc;
    dhtDoc["temperature"] = String(temperature, 2);
    dhtDoc["humidity"] = String(humidity, 2);
    String dhtJsonString;
    serializeJson(dhtDoc, dhtJsonString);
    
    // Encrypt the combined JSON string
    String encryptedDhtData = encryptData(dhtJsonString);
    
    FirebaseJson json;
    json.set("encrypted_value", encryptedDhtData.c_str());
    json.set("timestamp", ".sv", "timestamp");

    String path = "devices/DHT22_Sensor";
    Serial.printf("⬆️ Uploading encrypted DHT data to %s... ", path.c_str());
    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
        Serial.println("✅ OK");
    } else {
        Serial.printf("❌ DHT upload failed: %s\n", fbdo.errorReason().c_str());
    }

    // Handle PIR sensor data
    if (motionDetected) {
        Serial.println("🏃 Motion detected! Uploading status.");
        String encryptedPirData = encryptData("1"); // 1 for motion detected
        
        FirebaseJson pirJson;
        pirJson.set("encrypted_value", encryptedPirData.c_str());
        pirJson.set("timestamp", ".sv", "timestamp");
        
        String pirPath = "devices/PIR_Sensor";
        Serial.printf("⬆️ Uploading encrypted PIR data to %s... ", pirPath.c_str());
        if(Firebase.RTDB.setJSON(&fbdo, pirPath.c_str(), &pirJson)) {
            Serial.println("✅ OK");
        } else {
            Serial.printf("❌ PIR upload failed: %s\n", fbdo.errorReason().c_str());
        }
        motionDetected = false; // Reset flag
    }
}


// --- Encryption and Encoding Functions ---

// PKCS7 padding function
String pkcs7_pad(const String& data, int block_size) {
    int pad_len = block_size - (data.length() % block_size);
    char pad_char = (char)pad_len;
    String padded_data = data;
    for (int i = 0; i < pad_len; i++) {
        padded_data += pad_char;
    }
    return padded_data;
}

// Encrypts a string using AES-128 CBC
String encryptData(const String& plainText) {
    byte key[16], iv[16];
    sscanf(AES_KEY, "%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx",
           &key[0], &key[1], &key[2], &key[3], &key[4], &key[5], &key[6], &key[7],
           &key[8], &key[9], &key[10], &key[11], &key[12], &key[13], &key[14], &key[15]);

    sscanf(AES_IV, "%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx%2hhx",
           &iv[0], &iv[1], &iv[2], &iv[3], &iv[4], &iv[5], &iv[6], &iv[7],
           &iv[8], &iv[9], &iv[10], &iv[11], &iv[12], &iv[13], &iv[14], &iv[15]);

    String paddedText = pkcs7_pad(plainText, 16);
    int input_len = paddedText.length();
    byte* input = (byte*)paddedText.c_str();
    byte output[input_len];

    mbedtls_aes_context aes;
    mbedtls_aes_init(&aes);
    mbedtls_aes_setkey_enc(&aes, key, 128);

    byte temp_iv[16];
    memcpy(temp_iv, iv, 16);

    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, input_len, temp_iv, input, output);
    mbedtls_aes_free(&aes);

    return base64Encode(output, input_len);
}

// Base64 encoding function
String base64Encode(byte* data, int len) {
    const char* b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    String encoded = "";
    int i = 0;
    byte chunk[3];
    
    while (len > 0) {
        chunk[0] = data[i++];
        chunk[1] = len > 1 ? data[i++] : 0;
        chunk[2] = len > 2 ? data[i++] : 0;
        
        encoded += b64_table[chunk[0] >> 2];
        encoded += b64_table[((chunk[0] & 0x03) << 4) | (chunk[1] >> 4)];
        
        if (len > 1) {
            encoded += b64_table[((chunk[1] & 0x0F) << 2) | (chunk[2] >> 6)];
        } else {
            encoded += '=';
        }
        
        if (len > 2) {
            encoded += b64_table[chunk[2] & 0x3F];
        } else {
            encoded += '=';
        }
        
        len -= 3;
    }
    return encoded;
}

    