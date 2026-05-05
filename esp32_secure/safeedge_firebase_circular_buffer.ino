/*
 * SafeEdge ESP32 Firmware with Firebase Circular Buffer
 * ======================================================
 * Complete implementation with 200-entry circular buffer for sensor history and alerts
 * 
 * Features:
 * - Direct Firebase Realtime Database connection
 * - Circular buffer management (200 entries max)
 * - Automatic index wrapping and metadata updates
 * - LED and buzzer control for visual/audio alerts
 * - Attack detection and automatic response
 * - Ethernet connectivity (W5500 module)
 * 
 * Hardware:
 * - ESP32 DevKit v1
 * - W5500 Ethernet Module (SPI)
 * - 3x LEDs (Red=GPIO32, Yellow=GPIO26, Green=GPIO25)
 * - 1x Buzzer (GPIO33)
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 * Version: 4.0.0-FIREBASE-CIRCULAR-BUFFER
 */

#include <SPI.h>
#include <Ethernet.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ==================== CONFIGURATION ====================

// Firebase Configuration
#define FIREBASE_HOST "lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH ""  // Legacy token - Get from: Realtime Database > Rules > Legacy tab (if needed)
#define API_KEY "AIzaSyCqDY_gdfWwaFk6x8wMiEcUQOTuygvILfs"

// Device Configuration
#define DEVICE_ID "esp32_gateway_001"
#define DEVICE_NAME "NICU Gateway #1"
#define ORGANIZATION_ID "org_12345"
#define FIRMWARE_VERSION "4.0.0-FIREBASE-CB"

// Ethernet Configuration (W5500 SPI Pins)
#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// LED Pin Definitions
#define LED_RED 32      // Critical alerts
#define LED_GREEN 25    // System OK / Safe
#define LED_YELLOW 26   // Warnings

// Buzzer Pin
#define BUZZER_PIN 33   // Active buzzer for audio alerts

// Circular Buffer Configuration
#define MAX_BUFFER_ENTRIES 200
#define SENSOR_UPDATE_INTERVAL 3000  // 3 seconds
#define HEARTBEAT_INTERVAL 30000     // 30 seconds

// ==================== GLOBAL VARIABLES ====================

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Ethernet
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 1, 177);  // Static IP (adjust for your network)

// Circular buffer indices
int sensorBufferIndex = 0;
int alertBufferIndex = 0;
int totalSensorWrites = 0;
int totalAlerts = 0;

// Timing
unsigned long lastSensorUpdate = 0;
unsigned long lastHeartbeat = 0;

// Status
bool firebaseReady = false;
bool ethernetConnected = false;

// Sensor data structure
struct SensorData {
  float temperature;
  float humidity;
  float powerVoltage;
  int networkSignalStrength;
  float systemTemperature;
  bool ethernetConnected;
  String threatLevel;
  int securityScore;
  bool anomalyDetected;
  String timestamp;
};

// Alert data structure
struct AlertData {
  String alertId;
  String timestamp;
  String severity;
  String message;
  String attackType;
  String threatLevel;
  int securityScore;
  bool resolved;
  String actionTaken;
  String attackSource;
};

// ==================== FUNCTION DECLARATIONS ====================

// Setup functions
void setupLEDs();
void setupBuzzer();
bool setupEthernet();
bool setupFirebase();

// LED & Buzzer control
void setStatusLED(const char* status);
void playTone(int frequency, int duration);
void playWarningBeep();
void playCriticalBeep();
void playAttackAlarm();

// Sensor functions
SensorData generateSensorData();
float simulateTemperature();
float simulateHumidity();
float simulatePowerVoltage();
int getNetworkSignalStrength();

// Attack detection
int calculateSecurityScore(const SensorData& data);
String determineThreatLevel(int score);
bool detectAnomaly(const SensorData& data);

// Firebase circular buffer functions
bool initCircularBuffers();
bool pushSensorReading(const SensorData& data);
bool pushAlert(const AlertData& alert);
bool updateCurrentData(const SensorData& data);
bool updateDeviceInfo();
int getCircularBufferIndex(const char* bufferType);
bool updateCircularBufferMetadata(const char* bufferType, int newIndex, int totalWrites);
String getCurrentTimestamp();

// Command polling
void pollCommands();
void executeCommand(const String& command);

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println();
  Serial.println("========================================================");
  Serial.println("SafeEdge ESP32 Firmware v4.0 - Firebase Circular Buffer");
  Serial.println("Imagine Cup 2026 - Hospital IoT Security");
  Serial.println("========================================================");
  Serial.println();
  
  // Setup hardware
  setupLEDs();
  setupBuzzer();
  setStatusLED("initializing");
  
  // Setup Ethernet
  Serial.println("Initializing Ethernet...");
  if (!setupEthernet()) {
    Serial.println("❌ Ethernet initialization failed!");
    setStatusLED("error");
    while(1) {
      delay(1000);
    }
  }
  Serial.println("✅ Ethernet connected");
  Serial.print("   IP Address: ");
  Serial.println(Ethernet.localIP());
  
  // Setup Firebase
  Serial.println("Connecting to Firebase...");
  if (!setupFirebase()) {
    Serial.println("❌ Firebase connection failed!");
    setStatusLED("error");
    while(1) {
      delay(1000);
    }
  }
  Serial.println("✅ Firebase connected");
  
  // Initialize circular buffers
  Serial.println("Initializing circular buffers...");
  if (!initCircularBuffers()) {
    Serial.println("⚠️  Warning: Could not initialize circular buffers");
  } else {
    Serial.println("✅ Circular buffers initialized");
  }
  
  // Update device info
  updateDeviceInfo();
  
  setStatusLED("safe");
  Serial.println();
  Serial.println("🚀 System ready! Starting monitoring...");
  Serial.println();
}

// ==================== MAIN LOOP ====================

void loop() {
  unsigned long currentTime = millis();
  
  // Maintain Ethernet connection
  Ethernet.maintain();
  
  // Update sensor data and push to circular buffer
  if (currentTime - lastSensorUpdate >= SENSOR_UPDATE_INTERVAL) {
    SensorData data = generateSensorData();
    
    // Update current data (always latest)
    updateCurrentData(data);
    
    // Push to circular buffer (history)
    if (pushSensorReading(data)) {
      Serial.print("📊 Sensor #");
      Serial.print(totalSensorWrites);
      Serial.print(" [Index ");
      Serial.print(sensorBufferIndex);
      Serial.print("/199] - ");
      Serial.print(data.threatLevel);
      Serial.print(" | Score: ");
      Serial.print(data.securityScore);
      Serial.print(" | Temp: ");
      Serial.print(data.temperature);
      Serial.println("°C");
      
      // Check if we completed a full cycle
      if (sensorBufferIndex == 0 && totalSensorWrites >= MAX_BUFFER_ENTRIES) {
        Serial.println("🔄 Circular buffer completed full cycle - rewrote from index 0");
      }
    }
    
    // Update LED based on threat level
    setStatusLED(data.threatLevel.c_str());
    
    // If critical threat detected, create alert
    if (data.threatLevel == "critical" && data.anomalyDetected) {
      AlertData alert;
      alert.alertId = String("alert_") + String(millis());
      alert.timestamp = getCurrentTimestamp();
      alert.severity = "CRITICAL";
      alert.message = "Critical anomaly detected - automatic response initiated";
      alert.attackType = "Anomaly Detection";
      alert.threatLevel = "critical";
      alert.securityScore = data.securityScore;
      alert.resolved = false;
      alert.actionTaken = "automatic_monitoring";
      alert.attackSource = "internal_sensors";
      
      pushAlert(alert);
      playAttackAlarm();
    }
    
    lastSensorUpdate = currentTime;
  }
  
  // Send heartbeat
  if (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    Serial.println("💓 Heartbeat");
    updateDeviceInfo();
    lastHeartbeat = currentTime;
  }
  
  // Poll for commands from dashboard
  pollCommands();
  
  delay(100);
}

// ==================== HARDWARE SETUP ====================

void setupLEDs() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Startup animation
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(100);
    digitalWrite(LED_GREEN, LOW);
    delay(100);
  }
}

void setupBuzzer() {
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);
  
  // Startup beep
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  noTone(BUZZER_PIN);
}

bool setupEthernet() {
  // Initialize SPI for W5500
  SPI.begin(ETH_SCK, ETH_MISO, ETH_MOSI, ETH_CS);
  
  // Initialize Ethernet with static IP
  Ethernet.init(ETH_CS);
  
  // Try DHCP first
  if (Ethernet.begin(mac, 10000, 4000) == 0) {
    Serial.println("DHCP failed, using static IP");
    Ethernet.begin(mac, ip);
  }
  
  delay(2000);
  
  // Check connection
  if (Ethernet.linkStatus() == LinkOFF) {
    Serial.println("Ethernet cable not connected");
    return false;
  }
  
  ethernetConnected = true;
  return true;
}

bool setupFirebase() {
  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = FIREBASE_HOST;
  
  // Set authentication
  auth.user.email = "";  // Not using email auth
  auth.user.password = "";
  
  // Use legacy token authentication
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(false);  // We're using Ethernet, not WiFi
  
  // Wait for Firebase to be ready
  int attempts = 0;
  while (!Firebase.ready() && attempts < 10) {
    Serial.print(".");
    delay(1000);
    attempts++;
  }
  
  if (Firebase.ready()) {
    firebaseReady = true;
    return true;
  }
  
  return false;
}

// ==================== LED & BUZZER CONTROL ====================

void setStatusLED(const char* status) {
  // Turn off all LEDs
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_GREEN, LOW);
  noTone(BUZZER_PIN);
  
  if (strcmp(status, "safe") == 0 || strcmp(status, "initializing") == 0) {
    digitalWrite(LED_GREEN, HIGH);
  } else if (strcmp(status, "warning") == 0) {
    digitalWrite(LED_YELLOW, HIGH);
    playWarningBeep();
  } else if (strcmp(status, "critical") == 0) {
    digitalWrite(LED_RED, HIGH);
    playCriticalBeep();
  } else if (strcmp(status, "error") == 0) {
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_YELLOW, HIGH);
  }
}

void playTone(int frequency, int duration) {
  tone(BUZZER_PIN, frequency, duration);
}

void playWarningBeep() {
  tone(BUZZER_PIN, 1500, 100);  // 1500Hz, 100ms
}

void playCriticalBeep() {
  tone(BUZZER_PIN, 2000, 200);  // 2000Hz, 200ms
}

void playAttackAlarm() {
  // Three short beeps
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 2500, 150);
    delay(200);
    noTone(BUZZER_PIN);
    delay(100);
  }
}

// ==================== SENSOR DATA GENERATION ====================

SensorData generateSensorData() {
  SensorData data;
  
  data.temperature = simulateTemperature();
  data.humidity = simulateHumidity();
  data.powerVoltage = simulatePowerVoltage();
  data.networkSignalStrength = getNetworkSignalStrength();
  data.systemTemperature = temperatureRead();  // ESP32 internal temp
  data.ethernetConnected = (Ethernet.linkStatus() == LinkON);
  data.timestamp = getCurrentTimestamp();
  
  // Calculate security metrics
  data.securityScore = calculateSecurityScore(data);
  data.threatLevel = determineThreatLevel(data.securityScore);
  data.anomalyDetected = detectAnomaly(data);
  
  return data;
}

float simulateTemperature() {
  // Simulate temperature around 37°C with some variation
  static float temp = 37.0;
  temp += (random(-10, 10) / 100.0);
  temp = constrain(temp, 35.0, 40.0);
  return temp;
}

float simulateHumidity() {
  // Simulate humidity around 55% with variation
  static float humidity = 55.0;
  humidity += (random(-20, 20) / 10.0);
  humidity = constrain(humidity, 40.0, 70.0);
  return humidity;
}

float simulatePowerVoltage() {
  // Simulate power voltage around 12V
  static float voltage = 12.0;
  voltage += (random(-5, 5) / 100.0);
  voltage = constrain(voltage, 11.0, 13.5);
  return voltage;
}

int getNetworkSignalStrength() {
  // For Ethernet, return link quality (0-100)
  return (Ethernet.linkStatus() == LinkON) ? 100 : 0;
}

// ==================== ATTACK DETECTION ====================

int calculateSecurityScore(const SensorData& data) {
  int score = 100;
  
  // Temperature anomaly (-30 points)
  if (data.temperature < 35.0 || data.temperature > 40.0) {
    score -= 30;
  }
  
  // Humidity anomaly (-20 points)
  if (data.humidity < 40.0 || data.humidity > 70.0) {
    score -= 20;
  }
  
  // Power anomaly (-25 points)
  if (data.powerVoltage < 11.0 || data.powerVoltage > 13.5) {
    score -= 25;
  }
  
  // Network connectivity (-30 points)
  if (!data.ethernetConnected) {
    score -= 30;
  }
  
  return max(0, score);
}

String determineThreatLevel(int score) {
  if (score >= 80) return "safe";
  if (score >= 60) return "warning";
  return "critical";
}

bool detectAnomaly(const SensorData& data) {
  return (data.securityScore < 80);
}

// ==================== FIREBASE CIRCULAR BUFFER ====================

bool initCircularBuffers() {
  String devicePath = String("/devices/") + DEVICE_ID;
  
  // Initialize sensor history metadata
  String sensorMetaPath = devicePath + "/sensorHistory/metadata";
  Firebase.RTDB.setInt(&fbdo, sensorMetaPath + "/maxEntries", MAX_BUFFER_ENTRIES);
  Firebase.RTDB.setInt(&fbdo, sensorMetaPath + "/currentIndex", 0);
  Firebase.RTDB.setInt(&fbdo, sensorMetaPath + "/totalWrites", 0);
  Firebase.RTDB.setInt(&fbdo, sensorMetaPath + "/oldestEntry", 0);
  Firebase.RTDB.setInt(&fbdo, sensorMetaPath + "/newestEntry", 0);
  
  // Initialize alerts metadata
  String alertMetaPath = devicePath + "/alerts/metadata";
  Firebase.RTDB.setInt(&fbdo, alertMetaPath + "/maxEntries", MAX_BUFFER_ENTRIES);
  Firebase.RTDB.setInt(&fbdo, alertMetaPath + "/currentIndex", 0);
  Firebase.RTDB.setInt(&fbdo, alertMetaPath + "/totalAlerts", 0);
  Firebase.RTDB.setInt(&fbdo, alertMetaPath + "/oldestEntry", 0);
  Firebase.RTDB.setInt(&fbdo, alertMetaPath + "/newestEntry", 0);
  
  // Get current indices
  sensorBufferIndex = getCircularBufferIndex("sensorHistory");
  alertBufferIndex = getCircularBufferIndex("alerts");
  
  return true;
}

bool pushSensorReading(const SensorData& data) {
  if (!firebaseReady) return false;
  
  String devicePath = String("/devices/") + DEVICE_ID;
  String readingPath = devicePath + "/sensorHistory/readings/" + String(sensorBufferIndex);
  
  // Create JSON for sensor reading
  FirebaseJson json;
  json.set("timestamp", data.timestamp);
  json.set("temperature", data.temperature);
  json.set("humidity", data.humidity);
  json.set("powerVoltage", data.powerVoltage);
  json.set("networkSignalStrength", data.networkSignalStrength);
  json.set("systemTemperature", data.systemTemperature);
  json.set("ethernetConnected", data.ethernetConnected);
  json.set("threatLevel", data.threatLevel);
  json.set("securityScore", data.securityScore);
  json.set("anomalyDetected", data.anomalyDetected);
  
  // Write to Firebase
  if (!Firebase.RTDB.setJSON(&fbdo, readingPath, &json)) {
    Serial.println("Failed to write sensor reading");
    return false;
  }
  
  // Update metadata
  totalSensorWrites++;
  int nextIndex = (sensorBufferIndex + 1) % MAX_BUFFER_ENTRIES;
  
  updateCircularBufferMetadata("sensorHistory", nextIndex, totalSensorWrites);
  
  // Update local index
  sensorBufferIndex = nextIndex;
  
  return true;
}

bool pushAlert(const AlertData& alert) {
  if (!firebaseReady) return false;
  
  String devicePath = String("/devices/") + DEVICE_ID;
  String alertPath = devicePath + "/alerts/entries/" + String(alertBufferIndex);
  
  // Create JSON for alert
  FirebaseJson json;
  json.set("alertId", alert.alertId);
  json.set("timestamp", alert.timestamp);
  json.set("severity", alert.severity);
  json.set("message", alert.message);
  json.set("attackType", alert.attackType);
  json.set("threatLevel", alert.threatLevel);
  json.set("securityScore", alert.securityScore);
  json.set("resolved", alert.resolved);
  json.set("actionTaken", alert.actionTaken);
  json.set("attackSource", alert.attackSource);
  
  // Write to Firebase
  if (!Firebase.RTDB.setJSON(&fbdo, alertPath, &json)) {
    Serial.println("Failed to write alert");
    return false;
  }
  
  // Update metadata
  totalAlerts++;
  int nextIndex = (alertBufferIndex + 1) % MAX_BUFFER_ENTRIES;
  
  String metaPath = devicePath + "/alerts/metadata";
  Firebase.RTDB.setInt(&fbdo, metaPath + "/currentIndex", nextIndex);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/totalAlerts", totalAlerts);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/newestEntry", alertBufferIndex);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/oldestEntry", nextIndex);
  
  // Update local index
  alertBufferIndex = nextIndex;
  
  Serial.print("🚨 Alert #");
  Serial.print(totalAlerts);
  Serial.print(" [Index ");
  Serial.print(alertBufferIndex);
  Serial.print("/199] - ");
  Serial.println(alert.severity);
  
  return true;
}

bool updateCurrentData(const SensorData& data) {
  if (!firebaseReady) return false;
  
  String devicePath = String("/devices/") + DEVICE_ID + "/current";
  
  FirebaseJson json;
  json.set("deviceId", DEVICE_ID);
  json.set("timestamp", data.timestamp);
  json.set("temperature", data.temperature);
  json.set("humidity", data.humidity);
  json.set("powerVoltage", data.powerVoltage);
  json.set("networkSignalStrength", data.networkSignalStrength);
  json.set("systemTemperature", data.systemTemperature);
  json.set("ethernetConnected", data.ethernetConnected);
  json.set("threatLevel", data.threatLevel);
  json.set("securityScore", data.securityScore);
  json.set("anomalyDetected", data.anomalyDetected);
  json.set("connectedDevices", 0);
  json.set("blockedDevices", 0);
  
  return Firebase.RTDB.setJSON(&fbdo, devicePath, &json);
}

bool updateDeviceInfo() {
  if (!firebaseReady) return false;
  
  String devicePath = String("/devices/") + DEVICE_ID + "/info";
  
  FirebaseJson json;
  json.set("deviceId", DEVICE_ID);
  json.set("deviceName", DEVICE_NAME);
  json.set("organizationId", ORGANIZATION_ID);
  json.set("firmwareVersion", FIRMWARE_VERSION);
  json.set("status", "online");
  json.set("lastSeen", getCurrentTimestamp());
  json.set("ipAddress", Ethernet.localIP().toString());
  json.set("ethernetConnected", ethernetConnected);
  json.set("networkSignalStrength", getNetworkSignalStrength());
  
  return Firebase.RTDB.setJSON(&fbdo, devicePath, &json);
}

int getCircularBufferIndex(const char* bufferType) {
  String devicePath = String("/devices/") + DEVICE_ID;
  String metaPath = devicePath + "/" + String(bufferType) + "/metadata/currentIndex";
  
  if (Firebase.RTDB.getInt(&fbdo, metaPath)) {
    return fbdo.intData();
  }
  
  return 0;
}

bool updateCircularBufferMetadata(const char* bufferType, int newIndex, int totalWrites) {
  String devicePath = String("/devices/") + DEVICE_ID;
  String metaPath = devicePath + "/" + String(bufferType) + "/metadata";
  
  Firebase.RTDB.setInt(&fbdo, metaPath + "/currentIndex", newIndex);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/totalWrites", totalWrites);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/newestEntry", (newIndex - 1 + MAX_BUFFER_ENTRIES) % MAX_BUFFER_ENTRIES);
  Firebase.RTDB.setInt(&fbdo, metaPath + "/oldestEntry", newIndex);
  
  // Check if we completed a full cycle
  if (newIndex == 0 && totalWrites >= MAX_BUFFER_ENTRIES) {
    Firebase.RTDB.setString(&fbdo, metaPath + "/lastRewrite", getCurrentTimestamp());
  }
  
  return true;
}

String getCurrentTimestamp() {
  // Simple timestamp based on millis (replace with RTC if available)
  unsigned long seconds = millis() / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  char timestamp[32];
  sprintf(timestamp, "2026-04-09T%02lu:%02lu:%02lu", hours % 24, minutes % 60, seconds % 60);
  
  return String(timestamp);
}

// ==================== COMMAND POLLING ====================

void pollCommands() {
  if (!firebaseReady) return;
  
  String commandPath = String("/commands/") + DEVICE_ID + "/pending";
  
  if (Firebase.RTDB.getString(&fbdo, commandPath)) {
    String command = fbdo.stringData();
    
    if (command.length() > 0 && command != "null") {
      Serial.print("📥 Command received: ");
      Serial.println(command);
      
      executeCommand(command);
      
      // Clear command
      Firebase.RTDB.deleteNode(&fbdo, commandPath);
    }
  }
}

void executeCommand(const String& command) {
  if (command == "TEMP_ATTACK") {
    Serial.println("🔥 Simulating temperature attack...");
    // Simulate attack for next reading
    setStatusLED("critical");
    playAttackAlarm();
    
  } else if (command == "STOP_ATTACK") {
    Serial.println("✅ Stopping attack simulation");
    setStatusLED("safe");
    
  } else if (command == "RESET") {
    Serial.println("🔄 Resetting device...");
    delay(1000);
    ESP.restart();
    
  } else if (command == "STATUS") {
    Serial.println("📊 Device Status:");
    Serial.print("   Firmware: ");
    Serial.println(FIRMWARE_VERSION);
    Serial.print("   Uptime: ");
    Serial.print(millis() / 1000);
    Serial.println(" seconds");
    Serial.print("   Free Heap: ");
    Serial.println(ESP.getFreeHeap());
    Serial.print("   Sensor Writes: ");
    Serial.println(totalSensorWrites);
    Serial.print("   Total Alerts: ");
    Serial.println(totalAlerts);
  }
}
