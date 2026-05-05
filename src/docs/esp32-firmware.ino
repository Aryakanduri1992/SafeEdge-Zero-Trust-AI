#define FIREBASE_DISABLE_ALL_LOGS
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WiFiClientSecure.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <time.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_ADXL345_U.h>
#include <Adafruit_BMP280.h>

// ================== Wi-Fi Configuration ==================
#define WIFI_SSID "VivoY20"
#define WIFI_PASSWORD "12345678"

// ================== Firebase Configuration ==================
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ================== Pin Configuration ==================
// Environmental Sensors
#define DHT_PIN 4
#define DHT_TYPE DHT22

// Security Sensors
#define PIR_PIN 5          // Motion detection
#define DOOR_PIN 21        // Reed switch for door/panel status
#define SOUND_PIN 36       // Microphone for sound level

// Analog Sensors
#define OXYGEN_PIN 34      // Oxygen sensor (21-40% O2)
#define CO2_PIN 39         // CO2 sensor (<0.5% CO2)
#define POWER_PIN 35       // Power voltage monitoring

// I2C Sensors (SDA=GPIO 5, SCL=GPIO 18 for ADXL345)
// Note: DHT is on GPIO 4, so we use alternate I2C pins
#define I2C_SDA 5
#define I2C_SCL 18

// ================== Firebase Paths ==================
#define INCUBATOR_PATH "devices/incubator_monitor"

// ================== Firebase Objects ==================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClientSecure secureClient;

// ================== Sensor Objects ==================
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);
Adafruit_BMP280 bmp; // I2C

// ================== Patient Safety Thresholds ==================
#define TEMP_MIN 36.5
#define TEMP_MAX 37.5
#define HUMIDITY_MIN 50.0
#define HUMIDITY_MAX 60.0
#define VIBRATION_THRESHOLD 0.5  // g-force
#define POWER_MIN_VOLTAGE 11.0   // Minimum voltage before backup alert

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

// ================== Read All Sensors ==================
void readAllSensors(FirebaseJson &sensorData) {
  String ts = getISOTime();
  
  // Environmental Control Sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  float airPressure = bmp.readPressure() / 100.0F; // Convert to hPa
  
  // Analog Sensors (0-4095 ADC range, convert to meaningful values)
  int oxygenRaw = analogRead(OXYGEN_PIN);
  int co2Raw = analogRead(CO2_PIN);
  int powerRaw = analogRead(POWER_PIN);
  
  // Convert analog readings to actual values
  float oxygenLevel = map(oxygenRaw, 0, 4095, 0, 100) / 100.0 * 40.0; // 0-40% O2
  float co2Level = map(co2Raw, 0, 4095, 0, 100) / 100.0 * 1.0; // 0-1% CO2
  float powerVoltage = (powerRaw / 4095.0) * 3.3 * 4.0; // Assuming voltage divider
  
  // Security Sensors
  bool motionDetected = digitalRead(PIR_PIN);
  bool doorOpen = digitalRead(DOOR_PIN);
  int soundLevel = analogRead(SOUND_PIN);
  
  // Vibration Sensor (ADXL345)
  sensors_event_t event;
  accel.getEvent(&event);
  float vibrationLevel = sqrt(event.acceleration.x * event.acceleration.x + 
                              event.acceleration.y * event.acceleration.y + 
                              event.acceleration.z * event.acceleration.z) / 9.8; // Convert to g-force
  
  // System Health
  int wifiSignal = WiFi.RSSI();
  float systemTemp = temperatureRead(); // ESP32 internal temperature
  
  // Assess Patient Safety
  bool tempSafe = (temperature >= TEMP_MIN && temperature <= TEMP_MAX);
  bool humiditySafe = (humidity >= HUMIDITY_MIN && humidity <= HUMIDITY_MAX);
  bool powerSafe = (powerVoltage >= POWER_MIN_VOLTAGE);
  bool vibrationSafe = (vibrationLevel <= VIBRATION_THRESHOLD);
  bool accessSafe = (!motionDetected && !doorOpen);
  
  String threatLevel = "safe";
  if (!tempSafe || !humiditySafe || !powerSafe) {
    threatLevel = "critical";
  } else if (!vibrationSafe || !accessSafe) {
    threatLevel = "warning";
  }
  
  // Build Azure-compatible JSON structure
  sensorData.set("timestamp", ts);
  sensorData.set("deviceId", "incubator_001");
  
  // Environmental Control
  sensorData.set("temperature", temperature);
  sensorData.set("humidity", humidity);
  sensorData.set("airPressure", airPressure);
  sensorData.set("oxygenLevel", oxygenLevel);
  sensorData.set("co2Level", co2Level);
  
  // Security & Access Control
  sensorData.set("motionDetected", motionDetected);
  sensorData.set("vibrationLevel", vibrationLevel);
  sensorData.set("doorStatus", doorOpen);
  sensorData.set("soundLevel", soundLevel);
  
  // Power & System Health
  sensorData.set("powerVoltage", powerVoltage);
  sensorData.set("wifiSignalStrength", wifiSignal);
  sensorData.set("systemTemperature", systemTemp);
  
  // Security Analysis
  sensorData.set("threatLevel", threatLevel);
  sensorData.set("anomalyDetected", (threatLevel != "safe"));
  sensorData.set("tempSafe", tempSafe);
  sensorData.set("humiditySafe", humiditySafe);
  sensorData.set("powerSafe", powerSafe);
  sensorData.set("vibrationSafe", vibrationSafe);
  sensorData.set("accessSafe", accessSafe);
  
  // Calculate security score (0-100)
  int securityScore = 100;
  if (!tempSafe) securityScore -= 30;
  if (!humiditySafe) securityScore -= 20;
  if (!powerSafe) securityScore -= 25;
  if (!vibrationSafe) securityScore -= 15;
  if (!accessSafe) securityScore -= 10;
  sensorData.set("securityScore", securityScore);
}

// ================== Upload Encrypted Sensor Data ==================
void uploadSensorData() {
  if (!Firebase.ready()) return;

  FirebaseJson sensorData;
  readAllSensors(sensorData);
  
  // Get raw JSON string for encryption
  String jsonStr;
  sensorData.toString(jsonStr, true);
  
  // Encrypt the entire sensor data payload
  String encryptedData = encryptData(jsonStr);
  
  // Create upload payload
  FirebaseJson uploadJson;
  uploadJson.set("encryptedData", encryptedData);
  uploadJson.set("timestamp", getISOTime());
  uploadJson.set("deviceId", "incubator_001");
  
  // Upload to Firebase (Azure-compatible structure)
  if (Firebase.RTDB.setJSON(&fbdo, INCUBATOR_PATH, &uploadJson)) {
    Serial.println("✅ Incubator sensor data uploaded.");
    
    // Print summary
    String threatLevel;
    sensorData.get(jsonStr, "threatLevel");
    Serial.println("🏥 Threat Level: " + threatLevel);
    
    float temp, humidity;
    sensorData.get(jsonStr, "temperature");
    sensorData.get(jsonStr, "humidity");
    Serial.printf("🌡️  Temp: %.1f°C, Humidity: %.1f%%\n", temp, humidity);
  } else {
    Serial.printf("❌ Upload failed: %s\n", fbdo.errorReason().c_str());
  }
  
  Serial.println("----------------------------------");
}

// ================== Setup ==================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("🏥 SafeEdge Incubator Monitor - Initializing...");
  
  // Initialize I2C for ADXL345 and BMP280
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Initialize sensors
  pinMode(PIR_PIN, INPUT);
  pinMode(DOOR_PIN, INPUT_PULLUP); // Reed switch with pullup
  pinMode(SOUND_PIN, INPUT);
  pinMode(OXYGEN_PIN, INPUT);
  pinMode(CO2_PIN, INPUT);
  pinMode(POWER_PIN, INPUT);
  
  dht.begin();
  
  // Initialize ADXL345
  if (!accel.begin()) {
    Serial.println("⚠️ ADXL345 not detected!");
  } else {
    Serial.println("✅ ADXL345 initialized");
    accel.setRange(ADXL345_RANGE_2_G); // Set range for patient safety monitoring
  }
  
  // Initialize BMP280
  if (!bmp.begin(0x76)) { // Try default I2C address
    Serial.println("⚠️ BMP280 not detected!");
  } else {
    Serial.println("✅ BMP280 initialized");
  }
  
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

  // 🔓 Disable SSL certificate verification (Firebase MVP)
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
  Serial.println("🏥 Hospital Incubator Monitoring Active");
  Serial.println("📊 Monitoring: Temperature, Humidity, Pressure, O2, CO2, Motion, Vibration, Door, Sound, Power");
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
