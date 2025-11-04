#define FIREBASE_DISABLE_ALL_LOGS
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WiFiClientSecure.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <time.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

// ================== Wi-Fi Configuration ==================
#define WIFI_SSID "VivoY20"
#define WIFI_PASSWORD "12345678"

// ================== Firebase Configuration ==================
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ================== Pin Configuration ==================
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PIR_PIN 5

// ================== Firebase Paths ==================
#define PIR_PATH "devices/PIR_Sensor"
#define DHT_PATH "devices/DHT22_Sensor"

// ================== Firebase Objects ==================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClientSecure secureClient;

// ================== Sensor Objects ==================
DHT dht(DHT_PIN, DHT_TYPE);

// ================== AES Key & IV ==================
static const unsigned char aes_key[16] = {
  0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF,
  0x10,0x32,0x54,0x76,0x98,0xBA,0xDC,0xFE
};
static const unsigned char aes_iv[16] = {
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,
  0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F
};

// ================== Helper: ISO time ==================
String getISOTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00Z";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ================== Helper: base64 ==================
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

// ================== AES-CBC encrypt + base64 ==================
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

// ================== Robust NTP Sync ==================
bool waitForTime(int timeoutSeconds = 30) {
  Serial.print("⏳ Syncing time via NTP...");
  configTime(19800, 0, "time.google.com", "pool.ntp.org");

  unsigned long start = millis();
  while ((millis() - start) < (unsigned long)timeoutSeconds * 1000UL) {
    time_t now = time(nullptr);
    if (now > 1609459200) {
      Serial.println("✅ Time synced!");
      return true;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n⚠️ NTP Time sync failed.");
  return false;
}

// ================== Upload Encrypted Sensor Data ==================
void uploadSensorData() {
  if (!Firebase.ready()) return;

  // --- Read Sensors ---
  int pirValue = digitalRead(PIR_PIN);
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  String ts = getISOTime();

  // --- Upload PIR Data ---
  if (pirValue == 0 || pirValue == 1) {
    String encPIR = encryptData(String(pirValue));
    FirebaseJson pirJson;
    pirJson.set("encrypted_value", encPIR);
    pirJson.set("timestamp", ts);
    if (Firebase.RTDB.setJSON(&fbdo, PIR_PATH, &pirJson)) {
      Serial.println("✅ PIR data uploaded.");
    } else {
      Serial.printf("❌ PIR upload failed: %s\n", fbdo.errorReason().c_str());
    }
  }

  // --- Upload DHT22 Data ---
  if (!isnan(temperature) && !isnan(humidity)) {
    String encTemp = encryptData(String(temperature));
    String encHumid = encryptData(String(humidity));

    FirebaseJson dhtJson;
    dhtJson.set("encrypted_temperature", encTemp);
    dhtJson.set("encrypted_humidity", encHumid);
    dhtJson.set("timestamp", ts);
    if (Firebase.RTDB.setJSON(&fbdo, DHT_PATH, &dhtJson)) {
       Serial.println("✅ DHT22 data uploaded.");
    } else {
       Serial.printf("❌ DHT22 upload failed: %s\n", fbdo.errorReason().c_str());
    }
  } else {
    Serial.println("⚠️ Failed to read from DHT sensor.");
  }
  
  Serial.println("⏰ Timestamp: " + ts);
  Serial.println("----------------------------------");
}

// ================== Setup ==================
void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  dht.begin();
  delay(100);

  Serial.print("🔌 Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());
  
  waitForTime(30);

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // 🔓 Disable SSL certificate verification
  config.cert.data = nullptr;

  Firebase.reconnectWiFi(true);
  fbdo.setBSSLBufferSize(2048, 2048);

  Serial.println("🔐 Signing up with Firebase...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("✅ Firebase SignUp OK");
  } else {
    Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Serial.println("🔥 Firebase initialized!");
}

// ================== Loop ==================
void loop() {
  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase not ready — retrying...");
    delay(5000);
    return;
  }

  uploadSensorData();
  delay(7000);
}
