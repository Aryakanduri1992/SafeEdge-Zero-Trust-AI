
// -------------------------------------------------------------------------------- /
//  AuthStation - ESP32 Secure Sensor Data Uploader (with TEST_MODE)
//  - Dummy Data Mode added for testing without hardware
//  - Switch between real sensors and simulated data easily
// -------------------------------------------------------------------------------- /

#define WIFI_SSID "OPPO A78"
#define WIFI_PASSWORD "Deepu@1306"
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

#define DHT_SENSOR_PATH "devices/DHT22_Sensor"
#define PIR_SENSOR_PATH "devices/PIR_Sensor"

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define PIR_PIN 5

// 🧠 Toggle this flag
#define TEST_MODE true   // 👉 true = dummy data, false = real sensors

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <mbedtls/aes.h>
#include <mbedtls/base64.h>

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Time sync
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

// AES key & IV (must match server)
unsigned char aes_key[16] = {
  0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF,0x10,0x32,0x54,0x76,0x98,0xBA,0xDC,0xFE
};
unsigned char aes_iv[16] = {
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F
};

// ------------------------------- Time sync -----------------------------------
void syncTime() {
  Serial.print("⏳ Synchronizing time...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 10000)) {
    Serial.println("❌ NTP failed — trying HTTP fallback...");
    WiFiClient client;
    HTTPClient http;
    http.begin(client, "http://worldtimeapi.org/api/ip");
    int httpCode = http.GET();
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      StaticJsonDocument<512> doc;
      if (!deserializeJson(doc, payload)) {
        long unixtime = doc["unixtime"];
        timeval tv = { unixtime, 0 };
        settimeofday(&tv, NULL);
        Serial.println("✅ Time synchronized via HTTP.");
      } else {
        Serial.println("❌ HTTP parse failed.");
      }
    } else Serial.println("❌ HTTP time sync failed.");
    http.end();
  } else {
    Serial.println("✅ Time synchronized via NTP.");
  }
  struct tm ti;
  if (getLocalTime(&ti)) Serial.printf("🕒 Local time: %s", asctime(&ti));
}

// ------------------------------- AES + Base64 --------------------------------
String encryptData(const char* plaintext) {
  int inputLen = strlen(plaintext);
  int paddedLen = ((inputLen / 16) + 1) * 16;
  unsigned char* padded_input = (unsigned char*)malloc(paddedLen);
  if (!padded_input) return "";

  memset(padded_input, 0, paddedLen);
  memcpy(padded_input, plaintext, inputLen);
  int padding = paddedLen - inputLen;
  for (int i = 0; i < padding; ++i) padded_input[inputLen + i] = (unsigned char)padding;

  unsigned char* encrypted = (unsigned char*)malloc(paddedLen);
  if (!encrypted) { free(padded_input); return ""; }

  mbedtls_aes_context aes_ctx;
  mbedtls_aes_init(&aes_ctx);
  mbedtls_aes_setkey_enc(&aes_ctx, aes_key, 128);

  unsigned char iv_copy[16];
  memcpy(iv_copy, aes_iv, 16);

  mbedtls_aes_crypt_cbc(&aes_ctx, MBEDTLS_AES_ENCRYPT, paddedLen, iv_copy, padded_input, encrypted);
  mbedtls_aes_free(&aes_ctx);
  free(padded_input);

  size_t out_len = 0;
  mbedtls_base64_encode(NULL, 0, &out_len, encrypted, paddedLen);
  unsigned char* base64_buf = (unsigned char*)malloc(out_len + 1);
  if (!base64_buf) { free(encrypted); return ""; }

  memset(base64_buf, 0, out_len + 1);
  size_t actual_out_len = 0;
  mbedtls_base64_encode(base64_buf, out_len + 1, &actual_out_len, encrypted, paddedLen);
  String result = String((char*)base64_buf);
  free(encrypted);
  free(base64_buf);
  return result;
}

// ---------------------------- Firebase uploader ------------------------------
void uploadJsonToFirebase(const String& path, const FirebaseJson& json) {
  Serial.printf("📡 Uploading to %s ... ", path.c_str());
  if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) Serial.println("✅ SUCCESS");
  else Serial.printf("❌ FAILED: %s\n", fbdo.errorReason().c_str());
}

// ------------------------------- Sensor logic --------------------------------
void uploadSensorData() {
  if (!Firebase.ready()) {
    Serial.println("🔥 Firebase not ready. Skipping upload.");
    return;
  }

  float humidity, temperature;
  int motionDetected;

  if (TEST_MODE) {
    // --- Dummy mode ---
    humidity = random(40, 90);     // %
    temperature = random(20, 35);  // °C
    motionDetected = random(0, 2); // 0 or 1
  } else {
    // --- Real sensors ---
    humidity = dht.readHumidity();
    temperature = dht.readTemperature();
    motionDetected = digitalRead(PIR_PIN);
  }

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("🌡️ DHT read failed.");
  } else {
    StaticJsonDocument<128> dhtData;
    dhtData["temperature"] = String(temperature, 2);
    dhtData["humidity"] = String(humidity, 2);
    char jsonBuffer[128];
    serializeJson(dhtData, jsonBuffer, sizeof(jsonBuffer));
    String encryptedDht = encryptData(jsonBuffer);

    if (encryptedDht.length() > 0) {
      FirebaseJson dhtJson;
      dhtJson.set("encrypted_value", encryptedDht);
      dhtJson.set("timestamp", Firebase.ServerValue.TIMESTAMP);
      uploadJsonToFirebase(DHT_SENSOR_PATH, dhtJson);
    }
  }

  delay(2000);

  char pirPlain[8];
  snprintf(pirPlain, sizeof(pirPlain), "%d", motionDetected);
  String encryptedPir = encryptData(pirPlain);

  if (encryptedPir.length() > 0) {
    FirebaseJson pirJson;
    pirJson.set("encrypted_value", encryptedPir);
    pirJson.set("timestamp", Firebase.ServerValue.TIMESTAMP);
    uploadJsonToFirebase(PIR_SENSOR_PATH, pirJson);
  }
}

// --------------------------------- Setup & Loop --------------------------------
void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  dht.begin();

  Serial.println("\n\n--- AuthStation ESP32 Secure Uploader (with TEST_MODE) ---");
  Serial.printf("📶 Connecting to %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\n❌ WiFi connect timeout. Restarting...");
      ESP.restart();
    }
  }

  Serial.println("\n✅ WiFi Connected.");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  syncTime();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.signUp(&config, &auth, "", ""))
    Serial.println("✅ Firebase anonymous sign-up successful.");
  else
    Serial.printf("⚠️ Firebase sign-up error: %s\n", fbdo.errorReason().c_str());

  Firebase.setDoubleDigits(5);
}

void loop() {
  uploadSensorData();
  Serial.println("...next update in 30 seconds...");
  delay(30000);
}
