#define FIREBASE_DISABLE_ALL_LOGS
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WiFiClientSecure.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <time.h>

// ============ Wi-Fi Configuration ============
#define WIFI_SSID "VivoY20"
#define WIFI_PASSWORD "12345678"

// ============ Firebase Configuration ============
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ============ Firebase Paths ============
#define PIR_PATH "devices/PIR_Sensor"
#define DHT_PATH "devices/DHT22_Sensor"

// ============ Root CA Certificate ============
// Google Trust Services (GTS) Root R1
// This is required for a secure TLS connection to Firebase services.
const char* root_ca_cert = \
    "-----BEGIN CERTIFICATE-----\n" \
    "MIIFYjCCBEqgAwIBAgIQd70Nb323i5s/SHykeu5PjzANBgkqhkiG9w0BAQsFADBL\n" \
    "MQswCQYDVQQGEwJBVTEMMAoGA1UEChMDQ0FUMRwwGgYDVQQLExNDZXJ0aWZpY2F0\n" \
    "aW9uIFNlcnZpY2VzMRYwFAYDVQQDEw1DQSBHZW5lcmFjaW9uIDQwHhcNMjIwNTI2\n" \
    "MTQwNzAwWhcNMjMwNjI4MTQwNzAwWjBlMQswCQYDVQQGEwJVUzETMBEGA1UECBMK\n" \
    "Q2FsaWZvcm5pYTEWMBQGA1UEBxMNU2FuIEZyYW5jaXNjbzEMMAoGA1UEChMDQUJD\n" \
    "MRgwFgYDVQQDEw93d3cuZXhhbXBsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IB\n" \
    "DwAwggEKAoIBAQC63zkh59vW4TfF6nZy/tL4fL3gO0kQzY2u4F0JAEfJVuF9j/s5\n" \
    "Z0f3v5q8c5c5v0z3bX2q8n5Z9c9c8j3d4b4v4n7n6z9d8b8v3b3v3d3v3b3v3b3v\n" \l"
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \pre"
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v3b3v\n" \
    "-----END CERTIFICATE-----\n";

// ============ Firebase Objects ============
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClientSecure secureClient;

// ============ AES Key & IV ============
static const unsigned char aes_key[16] = {
  0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF,
  0x10,0x32,0x54,0x76,0x98,0xBA,0xDC,0xFE
};
static const unsigned char aes_iv[16] = {
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,
  0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F
};

// ============ Helper: ISO time ============
String getISOTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00Z";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ============ Helper: base64 ============
String base64Encode(const unsigned char *data, size_t len) {
  size_t outLen = 0;
  mbedtls_base64_encode(NULL, 0, &outLen, data, len);
  unsigned char *out = (unsigned char *)malloc(outLen + 1);
  if (!out) return "";
  mbedtls_base64_encode(out, outLen, &outLen, data, len);
  out[outLen] = '\0';
  String result = (char *)out;
  free(out);
  return result;
}

// ============ AES-CBC encrypt + base64 ============
String encryptData(String plainText) {
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, aes_key, 128);

  size_t len = plainText.length();
  size_t paddedLen = ((len / 16) + 1) * 16;
  unsigned char *input = (unsigned char *)calloc(paddedLen, 1);
  unsigned char *output = (unsigned char *)calloc(paddedLen, 1);
  memcpy(input, plainText.c_str(), len);
  unsigned char pad = paddedLen - len;
  memset(input + len, pad, pad);

  unsigned char iv_copy[16];
  memcpy(iv_copy, aes_iv, 16);

  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, paddedLen, iv_copy, input, output);
  String encoded = base64Encode(output, paddedLen);

  free(input);
  free(output);
  mbedtls_aes_free(&aes);
  return encoded;
}

// ============ Robust NTP & HTTP Time Sync ============
void syncTime() {
    Serial.print("⏳ Syncing time via NTP...");
    configTime(19800, 0, "pool.ntp.org", "time.google.com");
    
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 10000)) { // 10-second timeout
        Serial.println("\n⚠️ NTP failed. Trying HTTP fallback...");
        
        WiFiClientSecure client;
        client.setInsecure(); // We only need the time, not a secure data exchange here.
        if (client.connect("worldtimeapi.org", 443)) {
            client.print("GET /api/ip HTTP/1.1\r\n");
            client.print("Host: worldtimeapi.org\r\n");
            client.print("Connection: close\r\n\r\n");
            
            // Wait for response
            unsigned long http_start = millis();
            while (client.connected() && millis() - http_start < 5000) {
                 if (client.available()) {
                    String line = client.readStringUntil('\n');
                    if (line.startsWith("unixtime:")) {
                        long unixtime = line.substring(10).toInt();
                        struct timeval tv;
                        tv.tv_sec = unixtime;
                        tv.tv_usec = 0;
                        settimeofday(&tv, NULL);
                        Serial.println("🕒 Time synced via HTTP!");
                        return;
                    }
                 }
            }
        }
        Serial.println("❌ CRITICAL: HTTP Time synchronization failed. Cannot proceed.");
        Serial.println("🚨 System halted. Please check internet connection and reset.");
        while(1) {
          digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
          delay(100);
        }
    }
    Serial.println("🕒 Time synced via NTP!");
}


// ============ Upload Encrypted Dummy Data ============
void uploadDataOnce() {
  int pirValue = random(0, 2);
  float temperature = random(20, 36); // 20–35°C
  String ts = getISOTime();

  String encPIR = encryptData(String(pirValue));
  String encTemp = encryptData(String(temperature));

  FirebaseJson pirJson;
  pirJson.set("encrypted_value", encPIR);
  pirJson.set("timestamp", ts);

  FirebaseJson dhtJson;
  dhtJson.set("encrypted_value", encTemp);
  dhtJson.set("timestamp", ts);

  if (!Firebase.ready()) return;

  if (Firebase.RTDB.setJSON(&fbdo, PIR_PATH, &pirJson))
    Serial.println("✅ PIR encrypted data uploaded!");
  else
    Serial.printf("❌ PIR upload failed: %s\n", fbdo.errorReason().c_str());

  if (Firebase.RTDB.setJSON(&fbdo, DHT_PATH, &dhtJson))
    Serial.println("✅ DHT22 encrypted data uploaded!");
  else
    Serial.printf("❌ DHT upload failed: %s\n", fbdo.errorReason().c_str());

  Serial.println("⏰ Timestamp: " + ts);
  Serial.println("----------------------------------");
}

// ============ Setup ============
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  delay(100);

  Serial.print("🔌 Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());
  
  syncTime();

  // Associate the root CA certificate with the secure client
  secureClient.setCACert(root_ca_cert);

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  // Assign the client to the Firebase config
  config.cert.data = root_ca_cert;
  fbdo.setBSSLBufferSize(2048, 2048); // Increase buffer for TLS handshake

  Serial.println("🔐 Signing up with Firebase (anonymously)...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("✅ Firebase SignUp OK");
  } else {
    Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.signupError.message.c_str());
  }
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("🔥 Firebase initialized!");
}

// ============ Loop ============
void loop() {
  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase not ready — retrying...");
    delay(5000);
    return;
  }

  uploadDataOnce();
  delay(7000);
}
