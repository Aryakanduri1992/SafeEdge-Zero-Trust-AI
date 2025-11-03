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

// ============ Onboard LED for Error Indication ============
#define ONBOARD_LED 2

// ============ Firebase Paths ============
#define PIR_PATH "devices/PIR_Sensor"
#define DHT_PATH "devices/DHT22_Sensor"

// ============ Root CA Certificate ============
// Google's Global Trust Services (GTS) Root R1 certificate. Valid until 2035.
const char* root_ca_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIQDU8baVtF5z0A8piD+v8EJjANBgkqhkiG9w0BAQsFADBH
MQswCQYDVQQGEwJVUzEWMBQGA1UEChMNR29vZ2xlIExMQy4xGDAWBgNVBAMTD0dU
UyBSb290IFIxMB4XDTIwMDkwOTE3NDQwMFoXDTM1MDkwOTE3NDQwMFowRzELMAkG
A1UEBhMCVVMxFjAUBgNVBAoTDUdvb2dsZSBMTEMuMRgwFgYDVQQDEw9HVFMgUm9v
dCBSMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALlr9E1uwK/CQyli
R6FcTZU+qF4ExOB1ldT6C0zp7Z7pmG/1vKILNIt7hUckig3c19KZnep6F2+NAB1a
wYd3x4mS/YZx7O3YhTn9WvNqkYGj4OTX85zG/Eh0N7dYB6W+BrYbCwqvbYPxuF7N
FKzQGzJslK8NnldZK7RplCWX2ttYyxVnLXMSix8rsYHmfVp+1O8m5Z7Ug5fn5VbR
M3B8bHiI4IPjjjytx6AgP4V3YzJ2dRikxZ2VfLPr5gVRH/3HMX/sxUdxCe3pl2Kd
zD2vX0Le86PGDPr4O1aXU7VRyFBxY9uOTG2Oyp+x2cuhUMR2S1uPYUDlRCN06L9Z
0Q0tIb8w7cx1bYcZ7Nvy3OeQL6Bb4X0mZ7HpUKBHLb3DYFZX03xZ4OeeFTbFyb1A
rTCV6mTjQ9K0ZOnY/AU13wRmyD1D2s5Eer8fG84P/8RFyJjFh3+0w7kY4yLJ2mEb
Uvzv3cRkj4Ze03RfD6zQ/v38mRgeCUdNNfCW1P8EQjaR09eUS2iKeBdr6xT2AJFd
7pRz5IPnxF8bKzR1sde4pJ0NEEGhvDviK91nDkKW2+9h3kP/w1VQOdfMF4i0jApm
iEwh5MndPuW4V2cVNfQrr5k6NE8scBfFzw6uHu2vOi1mXk+oDfp5LCpFIPLB+UlB
8dM7Z/zfDReuUg9O3fS7Z+H/wQIDAQABo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYD
VR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUQXpMj3nHDbcwXUqSgApq6Ryi0TIwDQYJ
KoZIhvcNAQELBQADggIBAEC0bCJhxyfH/6eQm1bEpL5N9nV2abPPoW1qYtI9zG2v
Zng6HuW6i4P3NCD7DN+YjDPl7oN4T0psvNyc0K6qZwwEXLW9eJelr0SHGBYoJYzn
Z5KHYFXL7m+doUoEb0Wo2ozEFvT6E7zqC+E/4VG31XY+yhUeWb3gA5kzNqWLGU/j
xvKTnw+0aLqQy0Cpqg6KWde3OMyZFeNAA5+bQW0Nvxr0eDq8l6dJCEi6G6mX4kPg
XkNfQjjV3rNQxOAGJ13nE2+FPaXxU+IgeU6RXOQx+RPb0vMWWRCEpEivDgk+TzFx
e+fJIoZ0hx5RzM24GmXhJTu77skON/LrO8HhRcsPqMu+P+gK/VoZr+XXLjqE1/zQ
LScAKqS2UFi5ZTfDq4b3HrO5X6cQEr8mYfbWDolKH5/oYSPRpAs8PqV2Jna8HfUg
r+6pQzWNGQJ9bJvDbqWhDqHCQp26nO76nQeE2G34r5PEnj5dl6zF0zknz2ykyxUz
szmQ7TnDjQqKXh6M3sUqScTwJtPOuWmFPjHxuvtYcPYcdyM/5q4d2fbrB2PQ2f7O
XkXEtS0MVKRLZ+3GHq/7b/3ADQG/HFlWzN7Rpf7oxDPvdkSBhXEGNHWVsWkHq8K+
IQ40qclGuZuv2zwF3y9P/zCLTwRkiX/hwOpgwOqh5IfONzwgE9EHW5/akBxteuhO
-----END CERTIFICATE-----
)EOF";

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

// ============ HTTP Fallback Time Sync ============
bool httpTimeSync() {
  Serial.println("🌐 NTP failed. Attempting HTTP-based time sync...");
  WiFiClientSecure client;
  client.setInsecure(); // We can be insecure here as we only need a rough time
  if (!client.connect("worldtimeapi.org", 443)) {
    Serial.println("⚠️ HTTP Time Sync: Connection failed.");
    return false;
  }

  client.println("GET /api/timezone/Etc/UTC HTTP/1.1");
  client.println("Host: worldtimeapi.org");
  client.println("Connection: close");
  client.println();

  unsigned long httpTimeout = millis();
  while (client.connected() == 0) {
    if (millis() - httpTimeout > 5000) {
        Serial.println("Error: HTTP connection timeout");
        client.stop();
        return false;
    }
  }
  
  while (client.available() == 0) {
    if (millis() - httpTimeout > 10000) {
      Serial.println("Error: HTTP response timeout");
      client.stop();
      return false;
    }
  }

  // Find the JSON body
  while(client.available()){
    String line = client.readStringUntil('\n');
    if(line == "\r"){
      break;
    }
  }

  // Parse unixtime from JSON
  while(client.available()){
    String line = client.readStringUntil('\n');
    int unixtime_ix = line.indexOf("\"unixtime\":");
    if(unixtime_ix != -1) {
      String unixtime_str = line.substring(unixtime_ix + 11);
      long unixtime = unixtime_str.toInt();
      
      struct timeval tv;
      tv.tv_sec = unixtime;
      tv.tv_usec = 0;
      settimeofday(&tv, NULL);
      
      Serial.printf("✅ Time synced via HTTP: %s\n", getISOTime().c_str());
      client.stop();
      return true;
    }
  }

  Serial.println("⚠️ HTTP Time Sync: Failed to parse time from response.");
  return false;
}

// ============ Robust NTP Sync ============
bool synchronizeTime() {
  Serial.print("⏳ Syncing time via NTP...");
  configTime(19800, 0, "pool.ntp.org", "time.google.com");
  
  time_t now = time(nullptr);
  int retries = 0;
  while (now < 1609459200 && retries < 20) { // Jan 1, 2021
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }

  if (now < 1609459200) {
    Serial.println("\n⚠️ NTP Time sync failed. Trying HTTP fallback...");
    return httpTimeSync();
  }

  Serial.printf("\n🕒 Time synced via NTP: %s\n", getISOTime().c_str());
  return true;
}

// ============ Upload Encrypted Dummy Data ============
void uploadDataOnce() {
  int pirValue = random(0, 2);
  float temperature = random(20, 36);
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

// ============ Critical Error Halt ============
void halt_with_error(const char* message) {
    Serial.println(message);
    Serial.println("🚨 System halted. Please check configuration and reset.");
    pinMode(ONBOARD_LED, OUTPUT);
    while(true) {
        digitalWrite(ONBOARD_LED, HIGH);
        delay(200);
        digitalWrite(ONBOARD_LED, LOW);
        delay(200);
    }
}

// ============ Setup ============
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.print("🔌 Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifi_retries = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_retries < 30) {
    Serial.print(".");
    delay(500);
    wifi_retries++;
  }

  if (WiFi.status() != WL_CONNECTED) {
      halt_with_error("❌ Wi-Fi connection failed.");
  }
  Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());
  
  if (!synchronizeTime()) {
      halt_with_error("❌ CRITICAL: Time synchronization failed. Cannot proceed.");
  }

  secureClient.setCACert(root_ca_cert);

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.cert.data = root_ca_cert;
  fbdo.setBSSLBufferSize(4096, 4096); 

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