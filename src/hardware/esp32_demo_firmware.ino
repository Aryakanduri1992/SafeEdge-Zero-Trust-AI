/*
 * SafeEdge ESP32 Demo Firmware
 * Task 7.1 & 7.2: Professional hospital demo infrastructure with attack simulation
 * 
 * Features:
 * - Multi-sensor monitoring (DHT22, PIR, ADXL345, analog sensors)
 * - Visual LED indicators for attack alerts and system status
 * - Software-triggered attack simulations for live demos
 * - Firebase integration with real-time monitoring
 * - Safety mechanisms and immediate recovery
 * 
 * Hardware Setup:
 * - ESP32 DevKit v1
 * - W5500 Ethernet Module - SPI (MOSI: GPIO 23, MISO: GPIO 19, SCK: GPIO 18, CS: GPIO 5)
 * - Status LEDs - GPIO 32 (Red), GPIO 25 (Green), GPIO 26 (Yellow) with 220Ω resistors
 * - Buzzer - GPIO 33 (Audio alerts)
 * - LM2596 Buck Converter - 12V to 5V power supply
 */

#include <SPI.h>
#include <Ethernet.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include <time.h>

// Ethernet Configuration
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 1, 177);  // Fallback static IP

// Firebase Configuration
#define FIREBASE_HOST "safeedge-demo-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your-firebase-auth-token"

// Hardware Pin Definitions - Ethernet (W5500)
#define ETH_MOSI 23
#define ETH_MISO 19
#define ETH_SCK 18
#define ETH_CS 5

// LED Pin Definitions (Status Indicators)
#define LED_RED 32      // Critical alerts
#define LED_GREEN 25    // System OK
#define LED_YELLOW 26   // Warnings

// Buzzer Pin Definition
#define BUZZER_PIN 33   // Audio alerts

// Device Configuration
const String DEVICE_ID = "incubator_demo_001";
const String DEVICE_NAME = "NICU Incubator Demo #1";
const String LOCATION = "Demo Ward - Presentation Setup";

// Firebase Objects
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

// Demo State Variables (Simulated sensor data for demo)
struct SensorData {
  float temperature = 37.0;
  float humidity = 55.0;
  float airPressure = 1013.25;
  float powerVoltage = 12.0;
  int networkSignalStrength = -45;
  float systemTemperature = 35.0;
  String threatLevel = "safe";
  bool anomalyDetected = false;
  int securityScore = 100;
};

struct AttackSimulation {
  bool temperatureAttack = false;
  bool accessAttack = false;
  bool powerAttack = false;
  bool networkAttack = false;
  unsigned long attackStartTime = 0;
  unsigned long attackDuration = 0;
  String attackType = "";
};

SensorData sensors;
AttackSimulation attack;

// Safety Limits (for simulated data)
const float TEMP_MIN_SAFE = 35.0;
const float TEMP_MAX_SAFE = 40.0;
const float HUMIDITY_MIN_SAFE = 40.0;
const float HUMIDITY_MAX_SAFE = 70.0;

// Demo Control Variables
bool demoMode = true;
bool presentationMode = false;
unsigned long lastSensorRead = 0;
unsigned long lastFirebaseUpdate = 0;
unsigned long lastLEDUpdate = 0;
const unsigned long SENSOR_INTERVAL = 2000;    // 2 seconds
const unsigned long FIREBASE_INTERVAL = 3000;  // 3 seconds
const unsigned long LED_INTERVAL = 500;        // 500ms for animations

void setup() {
  Serial.begin(115200);
  Serial.println("SafeEdge ESP32 Demo Firmware v2.1.0");
  Serial.println("Initializing hospital incubator monitoring system...");
  
  // Initialize hardware
  initializePins();
  initializeEthernet();
  initializeFirebase();
  
  // Demo startup sequence
  performStartupSequence();
  
  Serial.println("✅ SafeEdge Demo System Ready");
  Serial.println("🏥 Hospital NICU Incubator Protection Active");
  Serial.println("🛡️ AI Security Pipeline Connected");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readAllSensors();
    processAttackSimulations();
    calculateSecurityMetrics();
    lastSensorRead = currentTime;
  }
  
  // Update Firebase at regular intervals
  if (currentTime - lastFirebaseUpdate >= FIREBASE_INTERVAL) {
    updateFirebase();
    lastFirebaseUpdate = currentTime;
  }
  
  // Update LED indicators
  if (currentTime - lastLEDUpdate >= LED_INTERVAL) {
    updateLEDIndicators();
    lastLEDUpdate = currentTime;
  }
  
  // Check for demo commands
  checkDemoCommands();
  
  // Safety monitoring (always active)
  enforceSafetyLimits();
  
  delay(100); // Small delay for stability
}

void initializePins() {
  // LED outputs
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  
  // Buzzer output
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Turn off all indicators initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("📌 GPIO pins initialized");
}

void initializeEthernet() {
  Serial.println("🌐 Initializing Ethernet...");
  
  // Initialize SPI for W5500
  SPI.begin(ETH_SCK, ETH_MISO, ETH_MOSI, ETH_CS);
  Ethernet.init(ETH_CS);
  
  // Try DHCP first
  Serial.print("Attempting DHCP configuration...");
  if (Ethernet.begin(mac, 10000) == 0) {
    Serial.println(" failed");
    Serial.println("Trying static IP configuration...");
    Ethernet.begin(mac, ip);
  } else {
    Serial.println(" success");
  }
  
  delay(1000);
  
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("❌ W5500 Ethernet module not found!");
  } else {
    Serial.println("✅ Ethernet initialized");
    Serial.print("📡 IP address: ");
    Serial.println(Ethernet.localIP());
    Serial.print("📶 Link status: ");
    Serial.println(Ethernet.linkStatus() == LinkON ? "Connected" : "No cable");
  }
}

void maintainEthernet() {
  // Maintain DHCP lease
  switch (Ethernet.maintain()) {
    case 1:
      Serial.println("⚠️  DHCP renew failed");
      break;
    case 2:
      Serial.println("✅ DHCP renewed");
      Serial.print("📡 New IP: ");
      Serial.println(Ethernet.localIP());
      break;
    case 3:
      Serial.println("⚠️  DHCP rebind failed");
      break;
    case 4:
      Serial.println("✅ DHCP rebound");
      Serial.print("📡 New IP: ");
      Serial.println(Ethernet.localIP());
      break;
  }
}

void initializeFirebase() {
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("⚠️  Firebase disabled - no Ethernet connection");
    return;
  }
  
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Test connection
  if (Firebase.ready()) {
    Serial.println("🔥 Firebase connected");
    
    // Register device
    registerDevice();
  } else {
    Serial.println("❌ Firebase connection failed");
  }
}

void performStartupSequence() {
  Serial.println("🚀 Performing startup sequence...");
  
  // LED startup animation
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(200);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    delay(200);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
    delay(200);
    digitalWrite(LED_RED, LOW);
  }
  
  // All LEDs on briefly
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  
  // Return to normal operation
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  
  Serial.println("✨ Startup sequence complete");
}

void readAllSensors() {
  // Simulated sensor data for demo purposes
  // In production, this would read from actual IoT devices via network
  
  // Add realistic variation for demo
  if (demoMode && !attack.temperatureAttack) {
    sensors.temperature = 37.0 + random(-10, 10) / 100.0; // ±0.1°C variation
    sensors.humidity = 55.0 + random(-20, 20) / 100.0;    // ±0.2% variation
  }
  
  sensors.airPressure = 1013.25 + random(-5, 5) / 10.0;
  sensors.powerVoltage = 12.0 + random(-5, 5) / 10.0;
  
  // System metrics
  sensors.systemTemperature = (temprature_sens_read() - 32) / 1.8; // ESP32 internal temp
  sensors.networkSignalStrength = Ethernet.linkStatus() == LinkON ? -45 : -90;
  
  // Maintain Ethernet connection
  maintainEthernet();
}

void processAttackSimulations() {
  unsigned long currentTime = millis();
  
  // Temperature Attack Simulation
  if (attack.temperatureAttack) {
    unsigned long elapsed = currentTime - attack.attackStartTime;
    
    if (elapsed < attack.attackDuration) {
      // Simulate temperature rising dangerously
      float progress = (float)elapsed / attack.attackDuration;
      sensors.temperature = 37.0 + (progress * 8.0); // Rise to 45°C
      sensors.anomalyDetected = true;
      sensors.threatLevel = "critical";
      sensors.securityScore = max(20, 100 - (int)(progress * 80));
      
      Serial.println("🔥 TEMPERATURE ATTACK SIMULATION: " + String(sensors.temperature) + "°C");
    } else {
      // Attack simulation complete - recovery
      endAttackSimulation();
    }
  }
  
  // Power Attack Simulation
  if (attack.powerAttack) {
    unsigned long elapsed = currentTime - attack.attackStartTime;
    
    if (elapsed < attack.attackDuration) {
      float progress = (float)elapsed / attack.attackDuration;
      sensors.powerVoltage = 12.0 - (progress * 4.0); // Drop to 8V
      sensors.anomalyDetected = true;
      sensors.threatLevel = "critical";
      sensors.securityScore = max(15, 100 - (int)(progress * 85));
      
      Serial.println("⚡ POWER ATTACK SIMULATION: Voltage drop to " + String(sensors.powerVoltage) + "V");
    } else {
      endAttackSimulation();
    }
  }
  
  // Network Attack Simulation
  if (attack.networkAttack) {
    unsigned long elapsed = currentTime - attack.attackStartTime;
    
    if (elapsed < attack.attackDuration) {
      sensors.networkSignalStrength = -90; // Weak signal
      sensors.anomalyDetected = true;
      sensors.threatLevel = "warning";
      sensors.securityScore = max(40, 100 - (int)((float)elapsed / attack.attackDuration * 60));
      
      Serial.println("📡 NETWORK ATTACK SIMULATION: Network interference detected");
    } else {
      endAttackSimulation();
    }
  }
}

void calculateSecurityMetrics() {
  if (!attack.temperatureAttack && !attack.accessAttack && 
      !attack.powerAttack && !attack.networkAttack) {
    
    // Normal operation - calculate security score based on available metrics
    int score = 100;
    
    // Temperature check
    if (sensors.temperature < TEMP_MIN_SAFE || sensors.temperature > TEMP_MAX_SAFE) {
      score -= 30;
    }
    
    // Humidity check
    if (sensors.humidity < HUMIDITY_MIN_SAFE || sensors.humidity > HUMIDITY_MAX_SAFE) {
      score -= 20;
    }
    
    // Power check
    if (sensors.powerVoltage < 11.0 || sensors.powerVoltage > 13.5) {
      score -= 30;
    }
    
    // Network connectivity check
    if (Ethernet.linkStatus() != LinkON) {
      score -= 20;
    }
    
    sensors.securityScore = max(0, score);
    
    // Determine threat level
    if (sensors.securityScore >= 80) {
      sensors.threatLevel = "safe";
      sensors.anomalyDetected = false;
    } else if (sensors.securityScore >= 60) {
      sensors.threatLevel = "warning";
      sensors.anomalyDetected = true;
    } else {
      sensors.threatLevel = "critical";
      sensors.anomalyDetected = true;
    }
  }
}

void updateFirebase() {
  if (!Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  // Create sensor data JSON
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["location"] = LOCATION;
  doc["timestamp"] = getTimestamp();
  
  // Sensor readings (simulated for demo)
  doc["temperature"] = sensors.temperature;
  doc["humidity"] = sensors.humidity;
  doc["airPressure"] = sensors.airPressure;
  doc["powerVoltage"] = sensors.powerVoltage;
  doc["networkSignalStrength"] = sensors.networkSignalStrength;
  doc["systemTemperature"] = sensors.systemTemperature;
  doc["ethernetConnected"] = (Ethernet.linkStatus() == LinkON);
  
  // Security metrics
  doc["threatLevel"] = sensors.threatLevel;
  doc["anomalyDetected"] = sensors.anomalyDetected;
  doc["securityScore"] = sensors.securityScore;
  
  // Attack simulation status
  doc["attackSimulation"] = attack.temperatureAttack || attack.accessAttack || 
                           attack.powerAttack || attack.networkAttack;
  doc["attackType"] = attack.attackType;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Update Firebase
  String path = "/devices/" + DEVICE_ID + "/current";
  if (Firebase.setString(firebaseData, path, jsonString)) {
    Serial.println("📤 Firebase updated: " + sensors.threatLevel + " (Score: " + 
                   String(sensors.securityScore) + ")");
  } else {
    Serial.println("❌ Firebase update failed: " + firebaseData.errorReason());
  }
  
  // Also update sensor history
  String historyPath = "/sensorReadings/" + String(millis());
  Firebase.setString(firebaseData, historyPath, jsonString);
}

void updateLEDIndicators() {
  static bool blinkState = false;
  blinkState = !blinkState;
  
  // Clear all LEDs first
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  noTone(BUZZER_PIN);
  
  // Status LEDs and buzzer based on threat level
  if (sensors.threatLevel == "safe") {
    digitalWrite(LED_GREEN, HIGH);
  } else if (sensors.threatLevel == "warning") {
    digitalWrite(LED_YELLOW, HIGH);
    if (sensors.anomalyDetected) {
      digitalWrite(LED_YELLOW, blinkState ? HIGH : LOW); // Blink for anomaly
      if (blinkState) {
        tone(BUZZER_PIN, 1500, 100); // Short warning beep
      }
    }
  } else if (sensors.threatLevel == "critical") {
    digitalWrite(LED_RED, blinkState ? HIGH : LOW); // Blink red for critical
    if (blinkState) {
      tone(BUZZER_PIN, 2000, 200); // Long critical beep
    }
  }
  
  // Attack mode - all LEDs flash with continuous alarm
  if (attack.temperatureAttack || attack.accessAttack || 
      attack.powerAttack || attack.networkAttack) {
    digitalWrite(LED_RED, blinkState ? HIGH : LOW);
    digitalWrite(LED_YELLOW, blinkState ? HIGH : LOW);
    digitalWrite(LED_GREEN, blinkState ? HIGH : LOW);
    if (blinkState) {
      tone(BUZZER_PIN, 2500, 100); // Attack alarm
    }
  }
  
  // Network status indicator (green LED blinks if no connection)
  if (Ethernet.linkStatus() != LinkON && sensors.threatLevel == "safe") {
    digitalWrite(LED_GREEN, blinkState ? HIGH : LOW);
  }
}

void checkDemoCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    Serial.println("📝 Demo command received: " + command);
    
    if (command == "TEMP_ATTACK") {
      startTemperatureAttack();
    } else if (command == "ACCESS_ATTACK") {
      startAccessAttack();
    } else if (command == "POWER_ATTACK") {
      startPowerAttack();
    } else if (command == "NETWORK_ATTACK") {
      startNetworkAttack();
    } else if (command == "STOP_ATTACK") {
      endAttackSimulation();
    } else if (command == "PRESENTATION_MODE") {
      presentationMode = !presentationMode;
      Serial.println("🎯 Presentation mode: " + String(presentationMode ? "ON" : "OFF"));
    } else if (command == "STATUS") {
      printSystemStatus();
    } else if (command == "RESET") {
      ESP.restart();
    }
  }
  
  // Check Firebase for remote commands
  checkFirebaseCommands();
}

void startTemperatureAttack() {
  Serial.println("🔥 STARTING TEMPERATURE ATTACK SIMULATION");
  attack.temperatureAttack = true;
  attack.attackStartTime = millis();
  attack.attackDuration = 45000; // 45 seconds
  attack.attackType = "Temperature Manipulation Attack";
  
  // Send alert to Firebase immediately
  sendAttackAlert("CRITICAL", "Temperature attack detected - implementing emergency cooling");
}

void startAccessAttack() {
  Serial.println("🚪 STARTING ACCESS ATTACK SIMULATION");
  attack.accessAttack = true;
  attack.attackStartTime = millis();
  attack.attackDuration = 30000; // 30 seconds
  attack.attackType = "Unauthorized Physical Access";
  
  sendAttackAlert("WARNING", "Unauthorized access detected - security protocols activated");
}

void startPowerAttack() {
  Serial.println("⚡ STARTING POWER ATTACK SIMULATION");
  attack.powerAttack = true;
  attack.attackStartTime = millis();
  attack.attackDuration = 35000; // 35 seconds
  attack.attackType = "Power Supply Manipulation";
  
  sendAttackAlert("CRITICAL", "Power supply attack detected - activating backup systems");
}

void startNetworkAttack() {
  Serial.println("📡 STARTING NETWORK ATTACK SIMULATION");
  attack.networkAttack = true;
  attack.attackStartTime = millis();
  attack.attackDuration = 40000; // 40 seconds
  attack.attackType = "Network Intrusion Attempt";
  
  sendAttackAlert("WARNING", "Network anomaly detected - implementing security measures");
}

void endAttackSimulation() {
  Serial.println("✅ ENDING ATTACK SIMULATION - SYSTEM RECOVERY");
  
  // Reset attack flags
  attack.temperatureAttack = false;
  attack.accessAttack = false;
  attack.powerAttack = false;
  attack.networkAttack = false;
  attack.attackType = "";
  
  // Reset sensor values to normal
  sensors.temperature = 37.0 + random(-5, 5) / 10.0;
  sensors.humidity = 55.0 + random(-20, 20) / 10.0;
  sensors.powerVoltage = 12.0 + random(-5, 5) / 10.0;
  sensors.networkSignalStrength = Ethernet.linkStatus() == LinkON ? -45 : -90;
  sensors.anomalyDetected = false;
  sensors.threatLevel = "safe";
  sensors.securityScore = 100;
  
  sendAttackAlert("INFO", "Threat neutralized - all systems secure");
}

void sendAttackAlert(String severity, String message) {
  if (!Firebase.ready()) return;
  
  DynamicJsonDocument alert(512);
  alert["deviceId"] = DEVICE_ID;
  alert["timestamp"] = getTimestamp();
  alert["severity"] = severity;
  alert["message"] = message;
  alert["attackType"] = attack.attackType;
  alert["threatLevel"] = sensors.threatLevel;
  alert["securityScore"] = sensors.securityScore;
  
  String alertJson;
  serializeJson(alert, alertJson);
  
  String alertPath = "/alerts/" + String(millis());
  Firebase.setString(firebaseData, alertPath, alertJson);
  
  Serial.println("🚨 ALERT SENT: " + severity + " - " + message);
}

void checkFirebaseCommands() {
  if (!Firebase.ready()) return;
  
  String commandPath = "/commands/" + DEVICE_ID;
  if (Firebase.getString(firebaseData, commandPath)) {
    String command = firebaseData.stringData();
    
    if (command.length() > 0 && command != "null") {
      Serial.println("🔥 Firebase command: " + command);
      
      // Process command
      if (command == "TEMP_ATTACK") startTemperatureAttack();
      else if (command == "ACCESS_ATTACK") startAccessAttack();
      else if (command == "POWER_ATTACK") startPowerAttack();
      else if (command == "NETWORK_ATTACK") startNetworkAttack();
      else if (command == "STOP_ATTACK") endAttackSimulation();
      
      // Clear command
      Firebase.setString(firebaseData, commandPath, "");
    }
  }
}

void enforceSafetyLimits() {
  // Hardware safety limits - always enforced regardless of simulation
  bool safetyViolation = false;
  
  if (sensors.temperature > 42.0) { // Absolute maximum
    Serial.println("🚨 SAFETY LIMIT: Temperature too high - emergency shutdown");
    safetyViolation = true;
  }
  
  if (sensors.temperature < 32.0) { // Absolute minimum
    Serial.println("🚨 SAFETY LIMIT: Temperature too low - emergency heating");
    safetyViolation = true;
  }
  
  if (safetyViolation) {
    // In a real system, this would trigger hardware safety mechanisms
    // For demo, we just log and recover
    endAttackSimulation();
    Serial.println("🛡️ Safety systems activated - attack simulation terminated");
  }
}

void registerDevice() {
  DynamicJsonDocument deviceInfo(512);
  deviceInfo["deviceId"] = DEVICE_ID;
  deviceInfo["deviceName"] = DEVICE_NAME;
  deviceInfo["location"] = LOCATION;
  deviceInfo["firmwareVersion"] = "v2.1.0";
  deviceInfo["lastSeen"] = getTimestamp();
  deviceInfo["status"] = "online";
  deviceInfo["demoMode"] = demoMode;
  
  String deviceJson;
  serializeJson(deviceInfo, deviceJson);
  
  String devicePath = "/devices/" + DEVICE_ID + "/info";
  Firebase.setString(firebaseData, devicePath, deviceJson);
  
  Serial.println("📋 Device registered in Firebase");
}

void printSystemStatus() {
  Serial.println("\n=== SafeEdge Demo System Status ===");
  Serial.println("Device ID: " + DEVICE_ID);
  Serial.println("Location: " + LOCATION);
  Serial.println("Ethernet: " + String(Ethernet.linkStatus() == LinkON ? "Connected" : "Disconnected"));
  Serial.println("IP Address: " + Ethernet.localIP().toString());
  Serial.println("Firebase: " + String(Firebase.ready() ? "Connected" : "Disconnected"));
  Serial.println("Demo Mode: " + String(demoMode ? "ON" : "OFF"));
  Serial.println("Presentation Mode: " + String(presentationMode ? "ON" : "OFF"));
  Serial.println("\n--- Sensor Readings (Simulated) ---");
  Serial.println("Temperature: " + String(sensors.temperature) + "°C");
  Serial.println("Humidity: " + String(sensors.humidity) + "%");
  Serial.println("Air Pressure: " + String(sensors.airPressure) + " hPa");
  Serial.println("Power: " + String(sensors.powerVoltage) + "V");
  Serial.println("Security Score: " + String(sensors.securityScore));
  Serial.println("Threat Level: " + sensors.threatLevel);
  Serial.println("\n--- Attack Simulation ---");
  Serial.println("Temperature Attack: " + String(attack.temperatureAttack ? "ACTIVE" : "OFF"));
  Serial.println("Access Attack: " + String(attack.accessAttack ? "ACTIVE" : "OFF"));
  Serial.println("Power Attack: " + String(attack.powerAttack ? "ACTIVE" : "OFF"));
  Serial.println("Network Attack: " + String(attack.networkAttack ? "ACTIVE" : "OFF"));
  Serial.println("=====================================\n");
}

String getTimestamp() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis()); // Fallback to millis if NTP not available
  }
  
  char timestamp[64];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(timestamp);
}