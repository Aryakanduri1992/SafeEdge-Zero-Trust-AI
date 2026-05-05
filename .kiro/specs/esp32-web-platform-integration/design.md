# Design Document: ESP32 Web Platform Integration

## Overview

This design document specifies the comprehensive integration between the SafeEdge web platform and ESP32 hardware security gateways. The system enables secure device provisioning, real-time bidirectional communication, certificate-based authentication (mTLS), attack detection and response, and centralized dashboard monitoring for IoT security in hospital environments. The ESP32 acts as a security gateway that monitors and protects multiple IoT devices, detecting cyber attacks in real-time and automatically blocking threats while providing visual/audio alerts through hardware indicators (LEDs and buzzer).

## Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Web Platform"
        Dashboard[Next.js Dashboard]
        API[FastAPI Backend]
        DB[(Azure SQL/SQLite)]
        Auth[Auth Service]
        Crypto[Crypto Service]
        CA[Certificate Authority]
    end
    
    subgraph "ESP32 Security Gateway"
        ESP32[ESP32 DevKit v1]
        Firmware[Encrypted Firmware]
        TLS[TLS/mTLS Stack]
        Monitor[Attack Monitor]
        LEDs[3 LEDs + Buzzer]
    end
    
    subgraph "IoT Devices"
        Device1[Temperature Sensor]
        Device2[Door Lock]
        Device3[Camera]
        Device4[Medical Device]
    end
    
    Dashboard -->|HTTPS| API
    API -->|Query/Update| DB
    API <-->|mTLS WebSocket| ESP32
    API -->|Encrypt/Decrypt| Crypto
    API -->|Issue Certs| CA
    
    ESP32 -->|Monitor Traffic| Device1
    ESP32 -->|Monitor Traffic| Device2
    ESP32 -->|Monitor Traffic| Device3
    ESP32 -->|Monitor Traffic| Device4
    
    ESP32 -->|Visual Alert| LEDs
    Monitor -->|Detect Anomaly| ESP32
    
    style ESP32 fill:#ff9999
    style Dashboard fill:#99ccff
    style API fill:#99ff99
```

### Communication Flow

```mermaid
sequenceDiagram
    participant Dashboard as Web Dashboard
    participant API as Backend API
    participant CA as Certificate Authority
    participant ESP32 as ESP32 Gateway
    participant IoT as IoT Device
    
    Note over Dashboard,ESP32: 1. Device Provisioning
    Dashboard->>API: Add new ESP32 device
    API->>CA: Generate device certificate
    CA-->>API: Return cert + private key
    API->>DB: Store device credentials
    API-->>Dashboard: Return provisioning data
    Dashboard-->>Admin: Display QR code / config
    
    Note over ESP32,API: 2. Device Registration
    ESP32->>API: Register with credentials
    API->>API: Validate certificate
    API->>API: Derive ECDH shared secret
    API-->>ESP32: Registration success + server cert
    ESP32->>ESP32: Establish mTLS connection
    
    Note over ESP32,IoT: 3. IoT Device Monitoring
    IoT->>ESP32: Network traffic
    ESP32->>ESP32: Analyze for anomalies
    ESP32->>ESP32: Detect attack pattern
    ESP32->>ESP32: Activate LED + Buzzer
    
    Note over ESP32,Dashboard: 4. Real-Time Attack Alert
    ESP32->>API: Send encrypted attack event
    API->>API: Decrypt with AES-256-GCM
    API->>DB: Store security event
    API->>Dashboard: WebSocket push notification
    Dashboard->>Dashboard: Display alert banner
    Dashboard->>Dashboard: Update device status
    
    Note over Dashboard,ESP32: 5. Remote Control
    Dashboard->>API: Block device command
    API->>ESP32: Send encrypted command
    ESP32->>ESP32: Execute block action
    ESP32->>IoT: Drop traffic from device
    ESP32-->>API: Confirm action
    API-->>Dashboard: Update UI
```

## Component Details

### 1. Backend API Endpoints

#### Device Management Endpoints

**POST /api/esp32/provision**
- **Purpose**: Provision a new ESP32 device in the system
- **Auth**: Super Admin or Organization Admin
- **Request Body**:
```json
{
  "deviceName": "NICU Gateway #1",
  "location": "Ward A - Room 101",
  "organizationId": "org_12345",
  "departmentId": "dept_67890",
  "deviceType": "ESP32_GATEWAY"
}
```
- **Response**:
```json
{
  "success": true,
  "deviceId": "esp32_gateway_001",
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "privateKey": "-----BEGIN EC PRIVATE KEY-----...",
  "firebaseConfig": {
    "host": "safeedge-prod.firebaseio.com",
    "authToken": "token_here"
  },
  "qrCode": "data:image/png;base64,..."
}
```

**GET /api/esp32/devices**
- **Purpose**: List all ESP32 devices for an organization
- **Auth**: Organization Admin, Department Admin
- **Query Params**: `organizationId`, `departmentId`, `status` (online/offline)
- **Response**:
```json
{
  "count": 5,
  "devices": [
    {
      "deviceId": "esp32_gateway_001",
      "deviceName": "NICU Gateway #1",
      "status": "online",
      "threatLevel": "safe",
      "securityScore": 100,
      "lastSeen": "2026-04-09T10:30:00Z",
      "connectedDevices": 4,
      "blockedDevices": 0
    }
  ]
}
```

**GET /api/esp32/devices/{deviceId}**
- **Purpose**: Get detailed information about a specific device
- **Auth**: Organization Admin, Department Admin
- **Response**:
```json
{
  "deviceId": "esp32_gateway_001",
  "deviceName": "NICU Gateway #1",
  "location": "Ward A - Room 101",
  "status": "online",
  "firmwareVersion": "v3.0.0",
  "ipAddress": "192.168.1.100",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "wifiSignalStrength": -45,
  "currentData": {
    "temperature": 37.2,
    "humidity": 55.5,
    "threatLevel": "safe",
    "securityScore": 100
  },
  "connectedIoTDevices": [
    {
      "deviceId": "iot_device_001",
      "deviceType": "temperature_sensor",
      "ipAddress": "192.168.1.101",
      "status": "active",
      "trafficBlocked": false
    }
  ]
}
```

**PUT /api/esp32/devices/{deviceId}**
- **Purpose**: Update device configuration
- **Auth**: Organization Admin
- **Request Body**:
```json
{
  "deviceName": "Updated Name",
  "location": "New Location",
  "enabled": true
}
```

**DELETE /api/esp32/devices/{deviceId}**
- **Purpose**: Remove device from system
- **Auth**: Super Admin, Organization Admin
- **Response**: `{ "success": true, "message": "Device removed" }`

#### Real-Time Data Endpoints

**GET /api/esp32/devices/{deviceId}/current**
- **Purpose**: Get current sensor data and status
- **Auth**: Organization Admin, Department Admin, Viewer
- **Response**:
```json
{
  "deviceId": "esp32_gateway_001",
  "timestamp": "2026-04-09T10:30:15Z",
  "temperature": 37.2,
  "humidity": 55.5,
  "airPressure": 1013.25,
  "oxygenLevel": 21.0,
  "co2Level": 0.04,
  "motionDetected": false,
  "doorStatus": false,
  "powerVoltage": 12.0,
  "wifiSignalStrength": -45,
  "threatLevel": "safe",
  "securityScore": 100,
  "anomalyDetected": false
}
```

**GET /api/esp32/devices/{deviceId}/history**
- **Purpose**: Get historical sensor data
- **Auth**: Organization Admin, Department Admin, Viewer
- **Query Params**: `startDate`, `endDate`, `limit`, `metric` (temperature, humidity, etc.)
- **Response**:
```json
{
  "deviceId": "esp32_gateway_001",
  "count": 100,
  "data": [
    {
      "timestamp": "2026-04-09T10:30:00Z",
      "temperature": 37.2,
      "securityScore": 100,
      "threatLevel": "safe"
    }
  ]
}
```

**WebSocket: /api/esp32/devices/{deviceId}/stream**
- **Purpose**: Real-time streaming of sensor data
- **Auth**: JWT token in connection params
- **Events**:
  - `sensor_update`: New sensor data
  - `alert`: Attack detected
  - `status_change`: Device online/offline
  - `device_blocked`: IoT device blocked

#### Alert Management Endpoints

**GET /api/esp32/alerts**
- **Purpose**: Get all security alerts
- **Auth**: Organization Admin, Department Admin
- **Query Params**: `organizationId`, `deviceId`, `severity`, `resolved`, `startDate`, `endDate`
- **Response**:
```json
{
  "count": 15,
  "alerts": [
    {
      "alertId": "alert_12345",
      "deviceId": "esp32_gateway_001",
      "timestamp": "2026-04-09T10:25:30Z",
      "severity": "CRITICAL",
      "message": "Temperature attack detected",
      "attackType": "Temperature Manipulation Attack",
      "threatLevel": "critical",
      "securityScore": 25,
      "resolved": false,
      "actionTaken": "automatic_block"
    }
  ]
}
```

**GET /api/esp32/alerts/{alertId}**
- **Purpose**: Get specific alert details
- **Auth**: Organization Admin, Department Admin
- **Response**: Single alert object with full details

**POST /api/esp32/alerts/{alertId}/resolve**
- **Purpose**: Mark alert as resolved
- **Auth**: Organization Admin, Department Admin
- **Request Body**:
```json
{
  "resolution": "False positive - maintenance work",
  "resolvedBy": "admin_user_id"
}
```

**GET /api/esp32/alerts/statistics**
- **Purpose**: Get alert statistics and trends
- **Auth**: Organization Admin
- **Response**:
```json
{
  "totalAlerts": 150,
  "criticalAlerts": 25,
  "warningAlerts": 75,
  "resolvedAlerts": 140,
  "averageResponseTime": "2.5 minutes",
  "topAttackTypes": [
    { "type": "Temperature Manipulation", "count": 45 },
    { "type": "Unauthorized Access", "count": 30 }
  ]
}
```

#### Remote Control Endpoints

**POST /api/esp32/devices/{deviceId}/command**
- **Purpose**: Send command to ESP32 device
- **Auth**: Organization Admin, Department Admin
- **Request Body**:
```json
{
  "command": "TEMP_ATTACK",  // or STOP_ATTACK, RESET, etc.
  "parameters": {}
}
```
- **Response**:
```json
{
  "success": true,
  "commandId": "cmd_12345",
  "status": "queued",
  "message": "Command sent to device"
}
```

**POST /api/esp32/devices/{deviceId}/iot-devices/{iotDeviceId}/block**
- **Purpose**: Block traffic from specific IoT device
- **Auth**: Organization Admin, Department Admin
- **Request Body**:
```json
{
  "reason": "Suspicious activity detected",
  "duration": 3600  // seconds, 0 = permanent
}
```

**POST /api/esp32/devices/{deviceId}/iot-devices/{iotDeviceId}/unblock**
- **Purpose**: Unblock previously blocked IoT device
- **Auth**: Organization Admin, Department Admin

**GET /api/esp32/devices/{deviceId}/iot-devices**
- **Purpose**: List all IoT devices connected to ESP32 gateway
- **Auth**: Organization Admin, Department Admin
- **Response**:
```json
{
  "count": 4,
  "devices": [
    {
      "deviceId": "iot_device_001",
      "deviceType": "temperature_sensor",
      "ipAddress": "192.168.1.101",
      "macAddress": "11:22:33:44:55:66",
      "status": "active",
      "trafficBlocked": false,
      "lastSeen": "2026-04-09T10:30:10Z",
      "trafficStats": {
        "packetsIn": 1500,
        "packetsOut": 1200,
        "bytesIn": 150000,
        "bytesOut": 120000
      }
    }
  ]
}
```

#### Certificate Management Endpoints

**POST /api/esp32/certificates/generate**
- **Purpose**: Generate new device certificate
- **Auth**: Super Admin, Organization Admin
- **Request Body**:
```json
{
  "deviceId": "esp32_gateway_001",
  "organizationId": "org_12345",
  "validityDays": 365
}
```

**POST /api/esp32/certificates/revoke**
- **Purpose**: Revoke compromised certificate
- **Auth**: Super Admin, Organization Admin
- **Request Body**:
```json
{
  "certificateId": "cert_12345",
  "reason": "Device compromised"
}
```

**GET /api/esp32/certificates/{deviceId}**
- **Purpose**: Get certificate information
- **Auth**: Organization Admin
- **Response**:
```json
{
  "certificateId": "cert_12345",
  "deviceId": "esp32_gateway_001",
  "fingerprint": "SHA256:abc123...",
  "issuedAt": "2026-04-01T08:00:00Z",
  "expiresAt": "2027-04-01T08:00:00Z",
  "status": "active"
}
```

#### Firebase Integration Endpoints

**GET /api/esp32/firebase/config**
- **Purpose**: Get Firebase configuration for device
- **Auth**: Internal (device provisioning)
- **Response**:
```json
{
  "host": "safeedge-prod.firebaseio.com",
  "authToken": "generated_token",
  "databaseURL": "https://safeedge-prod.firebaseio.com"
}
```

**POST /api/esp32/firebase/sync**
- **Purpose**: Manually trigger Firebase sync
- **Auth**: Organization Admin
- **Request Body**:
```json
{
  "deviceId": "esp32_gateway_001",
  "syncType": "full"  // or "incremental"
}
```

### 2. Frontend Components

#### Dashboard Components

**ESP32DeviceOverview.tsx**
- **Location**: `src/components/esp32-device-overview.tsx`
- **Purpose**: Main dashboard showing all ESP32 devices
- **Features**:
  - Grid/list view of devices
  - Real-time status indicators (online/offline)
  - Threat level badges (safe/warning/critical)
  - Security score display
  - Quick action buttons (view details, send command)
  - Filter by organization, department, status
  - Search functionality
- **Props**:
```typescript
interface ESP32DeviceOverviewProps {
  organizationId?: string;
  departmentId?: string;
  viewMode?: 'grid' | 'list';
}
```

**ESP32DeviceDetails.tsx**
- **Location**: `src/components/esp32-device-details.tsx`
- **Purpose**: Detailed view of single ESP32 device
- **Features**:
  - Real-time sensor data display
  - Live charts (temperature, humidity, security score)
  - LED status visualization (green/yellow/red indicators)
  - Connected IoT devices list
  - Alert history timeline
  - Device information (IP, MAC, firmware version)
  - Control panel (send commands, block devices)
- **Props**:
```typescript
interface ESP32DeviceDetailsProps {
  deviceId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}
```

**ESP32ProvisioningWizard.tsx**
- **Location**: `src/components/esp32-provisioning-wizard.tsx`
- **Purpose**: Multi-step wizard for provisioning new devices
- **Steps**:
  1. Device Information (name, location, organization)
  2. Certificate Generation (automatic)
  3. QR Code Display (scan with ESP32)
  4. Connection Verification (wait for device to connect)
  5. Success Confirmation
- **Features**:
  - Step progress indicator
  - QR code generation and display
  - Download configuration file option
  - Copy credentials to clipboard
  - Real-time connection status
- **Props**:
```typescript
interface ESP32ProvisioningWizardProps {
  organizationId: string;
  departmentId?: string;
  onComplete: (deviceId: string) => void;
}
```

**ESP32AlertPanel.tsx**
- **Location**: `src/components/esp32-alert-panel.tsx`
- **Purpose**: Real-time alert notifications and management
- **Features**:
  - Live alert feed (WebSocket)
  - Alert severity badges (critical/warning/info)
  - Alert details modal
  - Quick actions (resolve, investigate, block device)
  - Alert filtering (by device, severity, date)
  - Alert statistics dashboard
  - Export alerts to CSV
- **Props**:
```typescript
interface ESP32AlertPanelProps {
  deviceId?: string;
  organizationId?: string;
  maxAlerts?: number;
  autoRefresh?: boolean;
}
```

**ESP32SensorChart.tsx**
- **Location**: `src/components/esp32-sensor-chart.tsx`
- **Purpose**: Visualize sensor data over time
- **Features**:
  - Line charts for temperature, humidity, etc.
  - Real-time updates
  - Time range selector (1h, 6h, 24h, 7d, 30d)
  - Multiple metrics on same chart
  - Threshold indicators
  - Export chart as image
- **Props**:
```typescript
interface ESP32SensorChartProps {
  deviceId: string;
  metrics: ('temperature' | 'humidity' | 'securityScore')[];
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  showThresholds?: boolean;
}
```

**ESP32IoTDeviceMonitor.tsx**
- **Location**: `src/components/esp32-iot-device-monitor.tsx`
- **Purpose**: Monitor IoT devices connected to ESP32 gateway
- **Features**:
  - List of connected devices
  - Device status (active/blocked/offline)
  - Traffic statistics (packets, bytes)
  - Block/unblock controls
  - Device details modal
  - Traffic visualization
- **Props**:
```typescript
interface ESP32IoTDeviceMonitorProps {
  esp32DeviceId: string;
  showTrafficStats?: boolean;
}
```

**ESP32LEDIndicator.tsx**
- **Location**: `src/components/esp32-led-indicator.tsx`
- **Purpose**: Visual representation of ESP32 LED status
- **Features**:
  - Animated LED indicators (green/yellow/red/attack)
  - Blinking animation for alerts
  - Tooltip with status description
  - Responsive design
- **Props**:
```typescript
interface ESP32LEDIndicatorProps {
  threatLevel: 'safe' | 'warning' | 'critical';
  anomalyDetected: boolean;
  attackActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**ESP32CommandPanel.tsx**
- **Location**: `src/components/esp32-command-panel.tsx`
- **Purpose**: Send remote commands to ESP32 device
- **Features**:
  - Command buttons (simulate attack, stop attack, reset)
  - Command history
  - Command status (queued, executing, completed, failed)
  - Confirmation dialogs for critical commands
- **Props**:
```typescript
interface ESP32CommandPanelProps {
  deviceId: string;
  allowedCommands?: string[];
  requireConfirmation?: boolean;
}
```

**ESP32SecurityScoreGauge.tsx**
- **Location**: `src/components/esp32-security-score-gauge.tsx`
- **Purpose**: Display security score as gauge/meter
- **Features**:
  - Circular gauge (0-100)
  - Color-coded (green/yellow/red)
  - Animated transitions
  - Score trend indicator (up/down arrow)
- **Props**:
```typescript
interface ESP32SecurityScoreGaugeProps {
  score: number;
  previousScore?: number;
  size?: number;
  showTrend?: boolean;
}
```

#### Page Components

**ESP32DashboardPage.tsx**
- **Location**: `src/app/dashboard/esp32/page.tsx`
- **Purpose**: Main ESP32 dashboard page
- **Layout**:
  - Header with filters and search
  - Device overview grid
  - Alert panel sidebar
  - Statistics cards (total devices, online, alerts)

**ESP32DevicePage.tsx**
- **Location**: `src/app/dashboard/esp32/[deviceId]/page.tsx`
- **Purpose**: Individual device detail page
- **Layout**:
  - Device header (name, status, actions)
  - Sensor data cards
  - Live charts
  - IoT device monitor
  - Alert history

**ESP32ProvisionPage.tsx**
- **Location**: `src/app/dashboard/esp32/provision/page.tsx`
- **Purpose**: Device provisioning page
- **Layout**:
  - Provisioning wizard
  - Help documentation sidebar

### 3. ESP32 Firmware Modules

#### Core Modules

#### ConnectionManager.cpp
- **Purpose**: Manage Ethernet and Firebase connectivity
- **Functions**:
```cpp
bool connectEthernet(byte* mac, IPAddress staticIP);
bool connectFirebase(const char* host, const char* auth);
void maintainEthernet();  // DHCP lease maintenance
void reconnectIfNeeded();
bool isConnected();
int getLinkStatus();
IPAddress getLocalIP();
```
- **Features**:
  - Auto-reconnect on connection loss
  - Exponential backoff for retries
  - DHCP with static IP fallback
  - Connection status monitoring
  - Ethernet link detection

#### SensorManager.cpp
- **Purpose**: Manage simulated sensor data for demo/testing
- **Functions**:
```cpp
void initializeSensors();
SensorData generateSimulatedData();
float simulateTemperature();
float simulateHumidity();
float simulatePowerVoltage();
int getNetworkSignalStrength();
```
- **Features**:
  - Realistic data simulation for demos
  - Configurable variation ranges
  - Network status monitoring
  - ESP32 internal temperature reading
  - Data smoothing and filtering

#### CircularBufferManager.cpp
- **Purpose**: Manage circular buffer for sensor history and alerts in Firebase
- **Functions**:
```cpp
void initCircularBuffer(const char* deviceId);
int pushSensorReading(SensorData data);
int pushAlert(AlertData alert);
int getCurrentIndex(const char* bufferType);
void updateMetadata(const char* bufferType, int newIndex);
bool shouldRewrite(int currentIndex);
```
- **Features**:
  - Circular buffer with 200 entry limit
  - Automatic index wrapping (0-199)
  - Metadata tracking (currentIndex, totalWrites, oldestEntry)
  - Efficient Firebase writes (single entry update)
  - Rewrite detection and handling
  - Separate buffers for sensor readings and alerts

**Implementation Details**:
```cpp
// CircularBufferManager.cpp

#define MAX_BUFFER_ENTRIES 200

// Push sensor reading to circular buffer
bool pushSensorReading(const String& deviceId, const SensorData& data) {
  // Get current index from Firebase
  String metadataPath = String("/devices/") + deviceId + "/sensorHistory/metadata/currentIndex";
  int currentIndex = Firebase.getInt(firebaseData, metadataPath);
  
  if (currentIndex < 0) currentIndex = 0;
  
  // Write data to current index
  String dataPath = String("/devices/") + deviceId + "/sensorHistory/readings/" + String(currentIndex);
  
  StaticJsonDocument<512> doc;
  doc["timestamp"] = data.timestamp;
  doc["temperature"] = data.temperature;
  doc["humidity"] = data.humidity;
  doc["powerVoltage"] = data.powerVoltage;
  doc["threatLevel"] = data.threatLevel;
  doc["securityScore"] = data.securityScore;
  doc["anomalyDetected"] = data.anomalyDetected;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  if (!Firebase.setJSON(firebaseData, dataPath, jsonData)) {
    Serial.println("Failed to write sensor reading");
    return false;
  }
  
  // Update metadata
  int nextIndex = (currentIndex + 1) % MAX_BUFFER_ENTRIES;
  int totalWrites = Firebase.getInt(firebaseData, String("/devices/") + deviceId + "/sensorHistory/metadata/totalWrites") + 1;
  
  Firebase.setInt(firebaseData, metadataPath, nextIndex);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/sensorHistory/metadata/totalWrites", totalWrites);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/sensorHistory/metadata/newestEntry", currentIndex);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/sensorHistory/metadata/oldestEntry", nextIndex);
  
  // Check if we just completed a full cycle (rewrite)
  if (nextIndex == 0 && totalWrites >= MAX_BUFFER_ENTRIES) {
    Firebase.setString(firebaseData, String("/devices/") + deviceId + "/sensorHistory/metadata/lastRewrite", getCurrentTimestamp());
    Serial.println("✓ Circular buffer completed full cycle - rewrote from index 0");
  }
  
  return true;
}

// Push alert to circular buffer
bool pushAlert(const String& deviceId, const AlertData& alert) {
  String metadataPath = String("/devices/") + deviceId + "/alerts/metadata/currentIndex";
  int currentIndex = Firebase.getInt(firebaseData, metadataPath);
  
  if (currentIndex < 0) currentIndex = 0;
  
  String alertPath = String("/devices/") + deviceId + "/alerts/entries/" + String(currentIndex);
  
  StaticJsonDocument<1024> doc;
  doc["alertId"] = alert.alertId;
  doc["timestamp"] = alert.timestamp;
  doc["severity"] = alert.severity;
  doc["message"] = alert.message;
  doc["attackType"] = alert.attackType;
  doc["threatLevel"] = alert.threatLevel;
  doc["securityScore"] = alert.securityScore;
  doc["resolved"] = alert.resolved;
  doc["actionTaken"] = alert.actionTaken;
  doc["attackSource"] = alert.attackSource;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  if (!Firebase.setJSON(firebaseData, alertPath, jsonData)) {
    return false;
  }
  
  int nextIndex = (currentIndex + 1) % MAX_BUFFER_ENTRIES;
  int totalAlerts = Firebase.getInt(firebaseData, String("/devices/") + deviceId + "/alerts/metadata/totalAlerts") + 1;
  
  Firebase.setInt(firebaseData, metadataPath, nextIndex);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/alerts/metadata/totalAlerts", totalAlerts);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/alerts/metadata/newestEntry", currentIndex);
  Firebase.setInt(firebaseData, String("/devices/") + deviceId + "/alerts/metadata/oldestEntry", nextIndex);
  
  return true;
}
```

#### AttackDetector.cpp
- **Purpose**: Analyze data for anomalies and calculate security metrics
- **Functions**:
```cpp
int calculateSecurityScore(SensorData data);
String determineThreatLevel(int score);
bool detectAnomaly(SensorData data);
String identifyAttackType(SensorData data);
bool checkTemperatureAnomaly(float temp);
bool checkPowerAnomaly(float voltage);
bool checkNetworkAnomaly(int linkStatus);
```
- **Features**:
  - Multi-factor threat analysis
  - Configurable thresholds
  - Pattern recognition
  - Attack classification
  - Real-time anomaly detection

**LEDController.cpp**
- **Purpose**: Control LED indicators
- **Functions**:
```cpp
void setupLEDs();
void setStatusLED(const char* status);
void blinkLED(int pin, int duration);
void updateLEDIndicators(String threatLevel, bool anomaly);
```
- **Features**:
  - Non-blocking LED animations
  - Blinking patterns for different states
  - Priority-based LED control
  - Power-efficient operation

#### BuzzerController.cpp
- **Purpose**: Control buzzer for audio alerts
- **Functions**:
```cpp
void setupBuzzer();
void playTone(int frequency, int duration);
void playWarningBeep();      // 1500Hz, 100ms
void playCriticalBeep();     // 2000Hz, 200ms
void playAttackAlarm();      // 2500Hz, continuous
void stopBuzzer();
void muteAlerts(bool mute);
```
- **Features**:
  - Non-blocking tone generation
  - Predefined alert patterns
  - Configurable frequencies and durations
  - Mute functionality
  - Priority-based alert system

**FirebaseSyncManager.cpp**
- **Purpose**: Bidirectional Firebase communication with circular buffer support
- **Functions**:
```cpp
bool registerDevice(DeviceInfo info);
bool pushSensorDataToCircularBuffer(SensorData data);
bool pushAlertToCircularBuffer(AlertData alert);
bool updateCurrentData(SensorData data);
String pollCommand();
bool updateDeviceStatus(String status);
int getCircularBufferIndex(const char* bufferType);
bool updateCircularBufferMetadata(const char* bufferType, int index);
```
- **Features**:
  - Automatic retry on failure
  - Data queuing for offline mode
  - Efficient JSON serialization
  - Rate limiting
  - Circular buffer management (200 entries max)
  - Automatic index wrapping and metadata updates
  - Separate paths for current data vs history

**IoTDeviceMonitor.cpp**
- **Purpose**: Monitor connected IoT devices
- **Functions**:
```cpp
void scanNetwork();
void addDevice(String ip, String mac);
void removeDevice(String deviceId);
bool isDeviceBlocked(String deviceId);
void blockDevice(String deviceId);
void unblockDevice(String deviceId);
TrafficStats getDeviceTraffic(String deviceId);
```
- **Features**:
  - ARP scanning for device discovery
  - mDNS service discovery
  - Traffic pattern analysis
  - MAC address filtering

**AttackResponseSystem.cpp**
- **Purpose**: Automatic threat response
- **Functions**:
```cpp
void handleThreatDetection(String threatLevel, int score);
void blockAttack(String attackType);
void unblockDevice(String deviceId);
String identifyAttackSource();
void logAttackEvent(AttackData data);
```
- **Features**:
  - Automatic blocking
  - Multi-level response (warning/critical)
  - Attack source identification
  - Response logging

**CertificateManager.cpp**
- **Purpose**: Manage device certificates
- **Functions**:
```cpp
bool loadCertificate();
bool storeCertificate(String cert, String key);
String getCertificateFingerprint();
bool validateServerCertificate(String serverCert);
bool performECDHKeyExchange();
```
- **Features**:
  - Secure storage in SPIFFS
  - Certificate validation
  - ECDH key exchange
  - Certificate renewal

**ConfigManager.cpp**
- **Purpose**: Device configuration management
- **Functions**:
```cpp
bool loadConfig();
bool saveConfig(Config config);
Config getConfig();
bool parseQRCode(String qrData);
void resetToDefaults();
```
- **Features**:
  - JSON configuration storage
  - QR code parsing
  - Factory reset
  - Configuration validation

### 1. ESP32 Hardware Components

#### Actual Hardware Configuration (Verified 2026-04-09)
```cpp
// Ethernet Module (W5500) - SPI Connection
#define ETH_MOSI 23     // SPI MOSI
#define ETH_MISO 19     // SPI MISO
#define ETH_SCK 18      // SPI Clock
#define ETH_CS 5        // SPI Chip Select

// LED Pin Definitions (Status Indicators with 220Ω resistors)
#define LED_RED 32      // Critical alerts
#define LED_GREEN 25    // System OK / Safe
#define LED_YELLOW 26   // Warnings

// Buzzer Pin (Audio alerts)
#define BUZZER_PIN 33   // Active buzzer for attack alerts

// Power Supply
// 12V DC Input → LM2596 Buck Converter → 5V Output → ESP32 VIN
```

#### Physical Hardware Components
- **ESP32 DevKit v1** - Main microcontroller (240MHz dual-core)
- **W5500 Ethernet Module** - Network connectivity via SPI
- **3x LEDs with 220Ω resistors** - Visual status indicators
  - Red LED (GPIO 32) - Critical alerts
  - Green LED (GPIO 25) - System safe
  - Yellow LED (GPIO 26) - Warnings
- **1x Active Buzzer** (GPIO 33) - Audio alerts
- **LM2596 DC-DC Buck Converter** - 12V to 5V power regulation

#### LED & Buzzer Control Logic
```cpp
// LED States
- GREEN (Solid): System safe, no threats detected
- YELLOW (Solid): Warning level threat
- YELLOW (Blinking): Anomaly detected
- RED (Blinking): Critical threat
- ALL LEDs (Flashing): Active attack detected/blocked

// Buzzer Patterns
- Short beep (1500Hz, 100ms): Warning alert
- Long beep (2000Hz, 200ms): Critical alert
- Continuous alarm (2500Hz): Active attack blocking
- Silent: Safe mode or muted
```

#### Circuit Diagram
```
ESP32 GPIO 32 → 220Ω Resistor → Red LED (+) → GND
ESP32 GPIO 25 → 220Ω Resistor → Green LED (+) → GND
ESP32 GPIO 26 → 220Ω Resistor → Yellow LED (+) → GND
ESP32 GPIO 33 → Buzzer (+) → GND

ESP32 GPIO 23 → W5500 MOSI
ESP32 GPIO 19 → W5500 MISO
ESP32 GPIO 18 → W5500 SCK
ESP32 GPIO 5  → W5500 CS
ESP32 3.3V    → W5500 VCC
ESP32 GND     → W5500 GND

12V DC Input → LM2596 Buck Converter → 5V Output → ESP32 VIN
                                                  → ESP32 GND
```

## Data Models

### 1. Firebase Realtime Database Structure

All data is stored in Firebase Realtime Database. The ESP32 connects directly to Firebase, and the web platform reads from the same Firebase instance. No Azure SQL or SQLite is used for ESP32 data.

#### Circular Buffer Pattern (200 Entry Limit)

To prevent unlimited data growth, we implement a circular buffer pattern:
- Sensor readings are stored with sequential keys (0-199)
- Alerts are stored with sequential keys (0-199)
- When reaching 200 entries, the system overwrites from index 0
- Current write position is tracked in metadata
- This ensures consistent storage size and predictable performance
- Each buffer type (sensor readings, alerts) has independent circular management

#### Complete Firebase Structure with Circular Buffer

```json
{
  "devices": {
    "{DEVICE_ID}": {
      "info": {
        "deviceId": "esp32_gateway_001",
        "deviceName": "NICU Gateway #1",
        "location": "Ward A - Room 101",
        "firmwareVersion": "v3.0.0",
        "organizationId": "org_12345",
        "departmentId": "dept_67890",
        "lastSeen": "2026-04-09T10:30:00Z",
        "status": "online",
        "ipAddress": "192.168.1.100",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "ethernetConnected": true,
        "networkSignalStrength": -45,
        "certificateFingerprint": "SHA256:abc123...",
        "registeredAt": "2026-04-01T08:00:00Z"
      },
      "current": {
        "deviceId": "esp32_gateway_001",
        "timestamp": "2026-04-09T10:30:15Z",
        "temperature": 37.2,
        "humidity": 55.5,
        "powerVoltage": 12.0,
        "networkSignalStrength": -45,
        "systemTemperature": 35.0,
        "ethernetConnected": true,
        "threatLevel": "safe",
        "anomalyDetected": false,
        "securityScore": 100,
        "attackSimulation": false,
        "attackType": "",
        "connectedDevices": 4,
        "blockedDevices": 0
      },
      "sensorHistory": {
        "metadata": {
          "maxEntries": 200,
          "currentIndex": 45,
          "totalWrites": 1245,
          "oldestEntry": 46,
          "newestEntry": 45,
          "lastRewrite": "2026-04-09T09:00:00Z"
        },
        "readings": {
          "0": {
            "timestamp": "2026-04-09T10:20:00Z",
            "temperature": 37.1,
            "humidity": 55.2,
            "powerVoltage": 12.1,
            "threatLevel": "safe",
            "securityScore": 100,
            "anomalyDetected": false
          },
          "1": {
            "timestamp": "2026-04-09T10:20:03Z",
            "temperature": 37.2,
            "humidity": 55.3,
            "powerVoltage": 12.0,
            "threatLevel": "safe",
            "securityScore": 100,
            "anomalyDetected": false
          },
          "...": "... entries 2-198 ...",
          "199": {
            "timestamp": "2026-04-09T10:30:00Z",
            "temperature": 37.2,
            "humidity": 55.5,
            "powerVoltage": 12.0,
            "threatLevel": "safe",
            "securityScore": 100,
            "anomalyDetected": false
          }
        }
      },
      "alerts": {
        "metadata": {
          "maxEntries": 200,
          "currentIndex": 12,
          "totalAlerts": 312,
          "oldestEntry": 13,
          "newestEntry": 12
        },
        "entries": {
          "0": {
            "alertId": "alert_001",
            "timestamp": "2026-04-09T08:25:30Z",
            "severity": "CRITICAL",
            "message": "Temperature attack detected",
            "attackType": "Temperature Manipulation Attack",
            "threatLevel": "critical",
            "securityScore": 25,
            "resolved": true,
            "resolvedAt": "2026-04-09T08:30:00Z",
            "actionTaken": "automatic_block",
            "attackSource": "192.168.1.105",
            "affectedDevices": ["iot_device_003"]
          },
          "...": "... entries 1-199 ..."
        }
      },
      "connectedIoTDevices": {
        "iot_device_001": {
          "deviceId": "iot_device_001",
          "deviceType": "temperature_sensor",
          "ipAddress": "192.168.1.101",
          "macAddress": "11:22:33:44:55:66",
          "status": "active",
          "lastSeen": "2026-04-09T10:30:10Z",
          "trafficBlocked": false,
          "firstSeen": "2026-04-01T08:00:00Z",
          "packetsIn": 15000,
          "packetsOut": 12000,
          "bytesIn": 1500000,
          "bytesOut": 1200000
        },
        "iot_device_002": {
          "deviceId": "iot_device_002",
          "deviceType": "door_lock",
          "ipAddress": "192.168.1.102",
          "macAddress": "22:33:44:55:66:77",
          "status": "active",
          "lastSeen": "2026-04-09T10:30:12Z",
          "trafficBlocked": false,
          "firstSeen": "2026-04-01T08:05:00Z",
          "packetsIn": 8000,
          "packetsOut": 7500,
          "bytesIn": 800000,
          "bytesOut": 750000
        }
      },
      "blockedDevices": {
        "iot_device_003": {
          "deviceId": "iot_device_003",
          "ipAddress": "192.168.1.105",
          "macAddress": "33:44:55:66:77:88",
          "blockedAt": "2026-04-09T08:25:35Z",
          "blockedBy": "automatic",
          "reason": "Temperature manipulation attack detected",
          "duration": 0,
          "permanent": true
        }
      }
    }
  },
  "commands": {
    "{DEVICE_ID}": {
      "pending": "TEMP_ATTACK",
      "timestamp": "2026-04-09T10:30:00Z",
      "parameters": {}
    }
  },
  "organizations": {
    "{ORG_ID}": {
      "name": "City Hospital",
      "devices": {
        "esp32_gateway_001": true,
        "esp32_gateway_002": true
      },
      "settings": {
        "alertRetention": 200,
        "sensorHistoryRetention": 200,
        "autoBlockEnabled": true
      }
    }
  },
  "certificates": {
    "{DEVICE_ID}": {
      "certificateId": "cert_12345",
      "fingerprint": "SHA256:abc123...",
      "issuedAt": "2026-04-01T08:00:00Z",
      "expiresAt": "2027-04-01T08:00:00Z",
      "status": "active",
      "algorithm": "ECC-secp256k1"
    }
  }
}
```

### 3. ESP32 Firmware Modules

#### Core Modules

**a. Connection Manager**
```cpp
// Handles WiFi and Firebase connectivity
- WiFi connection with auto-reconnect
- Firebase authentication with legacy token
- Connection status monitoring
- Automatic failover to offline mode
```

**b. Sensor Manager**
```cpp
// Reads all sensor data
- DHT22 temperature/humidity
- PIR motion detection
- Analog sensors (O2, CO2, power, sound)
- ADXL345 accelerometer for vibration
- ESP32 internal temperature
- WiFi signal strength (RSSI)
```

**c. Attack Detection Engine**
```cpp
// Analyzes sensor data for anomalies
- Temperature threshold monitoring
- Humidity range checking
- Power voltage anomalies
- Motion/access detection
- Network signal interference
- Vibration pattern analysis
- Security score calculation (0-100)
```

**d. LED & Buzzer Controller**
```cpp
// Visual and audio feedback
void setStatusLED(const char* status) {
  // Controls 3 LEDs based on threat level
  // Blinking patterns for different states
}

void triggerBuzzer(const char* pattern) {
  // Short beep: Warning
  // Long beep: Critical
  // Continuous: Active blocking
  // Three beeps: Attack blocked
}
```

**e. Firebase Sync Manager**
```cpp
// Bidirectional Firebase communication
- Push sensor data every 3 seconds
- Push alerts immediately on detection
- Poll for commands every loop
- Update device status
- Register device on startup
```

**f. IoT Device Monitor**
```cpp
// Monitors connected IoT devices
- Track connected devices via ARP/mDNS
- Monitor traffic patterns
- Detect anomalous behavior
- Block malicious devices
- Report device status to Firebase
```

**g. Attack Response System**
```cpp
// Automatic threat response
void blockAttack(String attackType) {
  // 1. Activate RED LED + ATTACK LED
  // 2. Trigger buzzer (continuous beep)
  // 3. Block malicious device traffic
  // 4. Send alert to Firebase
  // 5. Update dashboard via WebSocket
  // 6. Log attack details
}

void unblockDevice(String deviceId) {
  // 1. Remove traffic block
  // 2. Update LED to GREEN
  // 3. Stop buzzer
  // 4. Send confirmation to Firebase
}
```

### 4. Web Platform Components

#### Frontend Components (Next.js/React)

**a. ESP32 Device Management Dashboard**
```typescript
// src/components/esp32-device-dashboard.tsx
- Real-time device status display
- Live sensor data visualization
- Attack alert notifications
- Device control panel (block/unblock)
- Historical data charts
- LED status indicators (visual representation)
```

**b. Device Provisioning Wizard**
```typescript
// src/components/esp32-provisioning-wizard.tsx
- Step 1: Enter device details
- Step 2: Generate certificate
- Step 3: Display QR code with config
- Step 4: Verify connection
```

**c. Real-Time Alert Panel**
```typescript
// src/components/esp32-alert-panel.tsx
- Live attack notifications
- Alert severity badges
- Quick action buttons
- Alert history timeline
```

**d. IoT Device Monitor**
```typescript
// src/components/iot-device-monitor.tsx
- List of devices connected to ESP32
- Device status (active/blocked)
- Traffic statistics
- Block/unblock controls
```

#### Backend API Endpoints (FastAPI)

**a. Device Management**
```python
POST   /api/esp32/provision          # Provision new ESP32 device
GET    /api/esp32/devices            # List all ESP32 devices
GET    /api/esp32/devices/{id}       # Get device details
PUT    /api/esp32/devices/{id}       # Update device config
DELETE /api/esp32/devices/{id}       # Remove device
```

**b. Real-Time Data**
```python
GET    /api/esp32/devices/{id}/current    # Get current sensor data
GET    /api/esp32/devices/{id}/history    # Get historical data
WS     /api/esp32/devices/{id}/stream     # WebSocket for real-time updates
```

**c. Attack Management**
```python
GET    /api/esp32/alerts                  # Get all alerts
GET    /api/esp32/alerts/{id}             # Get specific alert
POST   /api/esp32/alerts/{id}/resolve     # Mark alert as resolved
```

**d. Remote Control**
```python
POST   /api/esp32/devices/{id}/command    # Send command to ESP32
POST   /api/esp32/devices/{id}/block      # Block IoT device
POST   /api/esp32/devices/{id}/unblock    # Unblock IoT device
```

**e. Firebase Integration**
```python
# Backend acts as Firebase client - ALL data stored in Firebase
- Reads device data from Firebase Realtime Database
- Writes commands to Firebase
- Listens for real-time updates
- NO local database (Azure SQL/SQLite) for ESP32 data
- Circular buffer management (200 entries per buffer)
- Metadata tracking for buffer indices
```

### 5. Certificate Management System

## Security Implementation

### 1. Certificate Management Architecture

#### Certificate Authority (CA) Structure

```
SafeEdge Root CA (Self-Signed)
├── Intermediate CA (Optional for large deployments)
│   ├── Server Certificate (Backend API)
│   ├── ESP32 Device Certificate 1
│   ├── ESP32 Device Certificate 2
│   └── ESP32 Device Certificate N
└── Direct Signing (Small deployments)
    ├── Server Certificate
    └── Device Certificates
```

#### Certificate Generation Process

**Step 1: Root CA Generation (One-Time Setup)**
```typescript
// src/lib/certificate-authority.ts

import crypto from 'crypto';
import forge from 'node-forge';

export class CertificateAuthority {
  private rootCA: {
    cert: forge.pki.Certificate;
    privateKey: forge.pki.PrivateKey;
  };

  // Generate Root CA (run once during system setup)
  async generateRootCA(): Promise<void> {
    const keys = forge.pki.rsa.generateKeyPair(4096);
    const cert = forge.pki.createCertificate();
    
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
    
    const attrs = [{
      name: 'commonName',
      value: 'SafeEdge Root CA'
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      name: 'organizationName',
      value: 'SafeEdge Security'
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    cert.setExtensions([{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      cRLSign: true
    }]);
    
    cert.sign(keys.privateKey, forge.md.sha256.create());
    
    this.rootCA = { cert, privateKey: keys.privateKey };
    
    // Store securely (Azure Key Vault, AWS KMS, or encrypted file)
    await this.storeRootCA(cert, keys.privateKey);
  }
}
```

**Step 2: Device Certificate Generation**
```typescript
// Generate certificate for ESP32 device
async generateDeviceCertificate(deviceId: string, organizationId: string): Promise<{
  certificate: string;
  privateKey: string;
  fingerprint: string;
}> {
  // Generate ECC key pair (secp256k1 for ESP32 compatibility)
  const keys = forge.pki.rsa.generateKeyPair(2048);
  
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = crypto.randomBytes(16).toString('hex');
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
  const attrs = [{
    name: 'commonName',
    value: deviceId
  }, {
    name: 'organizationName',
    value: organizationId
  }, {
    shortName: 'OU',
    value: 'ESP32 Gateway'
  }];
  
  cert.setSubject(attrs);
  cert.setIssuer(this.rootCA.cert.subject.attributes);
  
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: false
  }, {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 2, // DNS
      value: `${deviceId}.safeedge.local`
    }, {
      type: 7, // IP
      ip: '0.0.0.0' // Will be updated when device connects
    }]
  }]);
  
  // Sign with Root CA
  cert.sign(this.rootCA.privateKey, forge.md.sha256.create());
  
  // Convert to PEM format
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  
  // Calculate fingerprint
  const fingerprint = this.calculateFingerprint(cert);
  
  // Store in database
  await this.storeCertificate(deviceId, certPem, keyPem, fingerprint);
  
  return {
    certificate: certPem,
    privateKey: keyPem,
    fingerprint
  };
}

// Calculate SHA256 fingerprint
private calculateFingerprint(cert: forge.pki.Certificate): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const hash = crypto.createHash('sha256').update(der, 'binary').digest('hex');
  return hash.match(/.{2}/g)!.join(':').toUpperCase();
}
```

**Step 3: Certificate Validation**
```typescript
// Validate device certificate during connection
async validateDeviceCertificate(certPem: string): Promise<{
  valid: boolean;
  deviceId?: string;
  error?: string;
}> {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const rootCert = this.rootCA.cert;
    
    // Check if certificate is signed by our CA
    const caStore = forge.pki.createCaStore([rootCert]);
    
    try {
      forge.pki.verifyCertificateChain(caStore, [cert]);
    } catch (e) {
      return { valid: false, error: 'Certificate chain validation failed' };
    }
    
    // Check expiration
    const now = new Date();
    if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
      return { valid: false, error: 'Certificate expired or not yet valid' };
    }
    
    // Check revocation status
    const fingerprint = this.calculateFingerprint(cert);
    const isRevoked = await this.isCertificateRevoked(fingerprint);
    if (isRevoked) {
      return { valid: false, error: 'Certificate has been revoked' };
    }
    
    // Extract device ID from CN
    const cn = cert.subject.getField('CN');
    const deviceId = cn ? cn.value : undefined;
    
    return { valid: true, deviceId };
    
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
}
```

### 2. Encryption Implementation

#### AES-256-GCM Encryption (Data in Transit)

**Backend Encryption Service**
```typescript
// src/lib/safeedge-crypto.ts

import crypto from 'crypto';

const AES_ALGORITHM = 'aes-256-gcm';
const AES_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  devicePublicKey: string; // base64
  timestamp: number;
  deviceId: string;
}

// Encrypt data to send to ESP32
export function encryptForDevice(
  data: any,
  deviceId: string,
  sharedSecret: Buffer
): EncryptedPayload {
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(AES_ALGORITHM, sharedSecret, iv);
  
  const timestamp = Date.now();
  
  // Add AAD (Additional Authenticated Data)
  const aad = Buffer.from(`${deviceId}:${timestamp}`);
  cipher.setAAD(aad);
  
  // Encrypt
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  let encrypted = cipher.update(plaintext);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    devicePublicKey: getServerPublicKey(),
    timestamp,
    deviceId
  };
}

// Decrypt data from ESP32
export function decryptFromDevice(
  payload: EncryptedPayload,
  sharedSecret: Buffer
): { success: boolean; data?: any; error?: string } {
  try {
    // Validate timestamp (reject if older than 5 minutes)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000;
    if (Math.abs(now - payload.timestamp) > maxAge) {
      return {
        success: false,
        error: 'Message timestamp too old (replay protection)'
      };
    }
    
    // Decode base64
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, sharedSecret, iv);
    decipher.setAuthTag(authTag);
    
    // Add AAD
    const aad = Buffer.from(`${payload.deviceId}:${payload.timestamp}`);
    decipher.setAAD(aad);
    
    // Decrypt
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Parse JSON
    const data = JSON.parse(decrypted.toString('utf8'));
    
    return { success: true, data };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Decryption failed: ${error.message}`
    };
  }
}
```

**ESP32 Encryption Implementation**
```cpp
// ESP32 firmware - AES-256-GCM encryption

#include <mbedtls/gcm.h>
#include <mbedtls/md.h>
#include <esp_random.h>

const int AES_KEY_LENGTH = 32;  // 256 bits
const int IV_LENGTH = 12;       // 96 bits for GCM
const int AUTH_TAG_LENGTH = 16; // 128 bits

// Encrypt data before sending to server
String encryptData(const String& jsonData, const uint8_t* aesKey) {
  // Generate random IV
  uint8_t iv[IV_LENGTH];
  esp_fill_random(iv, IV_LENGTH);
  
  // Prepare plaintext
  const uint8_t* plaintext = (const uint8_t*)jsonData.c_str();
  size_t plaintextLen = jsonData.length();
  
  // Allocate ciphertext buffer
  uint8_t* ciphertext = (uint8_t*)malloc(plaintextLen);
  uint8_t authTag[AUTH_TAG_LENGTH];
  
  // Create AAD (Additional Authenticated Data)
  String aadStr = String(DEVICE_ID) + ":" + String(millis());
  const uint8_t* aad = (const uint8_t*)aadStr.c_str();
  size_t aadLen = aadStr.length();
  
  // Initialize GCM context
  mbedtls_gcm_context gcm;
  mbedtls_gcm_init(&gcm);
  
  int ret = mbedtls_gcm_setkey(&gcm, MBEDTLS_CIPHER_ID_AES, aesKey, AES_KEY_LENGTH * 8);
  if (ret != 0) {
    free(ciphertext);
    mbedtls_gcm_free(&gcm);
    return "";
  }
  
  // Encrypt with GCM
  ret = mbedtls_gcm_crypt_and_tag(
    &gcm,
    MBEDTLS_GCM_ENCRYPT,
    plaintextLen,
    iv, IV_LENGTH,
    aad, aadLen,
    plaintext, ciphertext,
    AUTH_TAG_LENGTH, authTag
  );
  
  mbedtls_gcm_free(&gcm);
  
  if (ret != 0) {
    free(ciphertext);
    return "";
  }
  
  // Build encrypted payload JSON
  StaticJsonDocument<2048> encryptedDoc;
  encryptedDoc["ciphertext"] = bytesToBase64(ciphertext, plaintextLen);
  encryptedDoc["iv"] = bytesToBase64(iv, IV_LENGTH);
  encryptedDoc["authTag"] = bytesToBase64(authTag, AUTH_TAG_LENGTH);
  encryptedDoc["devicePublicKey"] = devicePublicKeyBase64;
  encryptedDoc["timestamp"] = millis();
  encryptedDoc["deviceId"] = DEVICE_ID;
  
  free(ciphertext);
  
  String output;
  serializeJson(encryptedDoc, output);
  
  return output;
}
```

#### ECDH Key Exchange (Shared Secret Derivation)

**Backend ECDH Implementation**
```typescript
// Derive shared secret using ECDH
export function deriveSharedSecret(devicePublicKeyPem: string): Buffer {
  const serverKeys = getServerKeyPair();
  
  const serverPrivateKey = crypto.createPrivateKey(serverKeys.privateKey);
  const devicePublicKey = crypto.createPublicKey(devicePublicKeyPem);
  
  // Perform ECDH key agreement
  const sharedSecret = crypto.diffieHellman({
    privateKey: serverPrivateKey,
    publicKey: devicePublicKey
  });
  
  // Derive AES key from shared secret using HKDF
  const aesKey = crypto.hkdfSync(
    'sha256',
    sharedSecret,
    Buffer.from('SafeEdge-AES-Key'), // Salt
    Buffer.from('SafeEdge-ESP32-Encryption'), // Info
    AES_KEY_LENGTH
  );
  
  return Buffer.from(aesKey);
}
```

**ESP32 ECDH Implementation**
```cpp
// ESP32 firmware - ECDH key exchange

#include <mbedtls/ecdh.h>
#include <mbedtls/ecp.h>
#include <mbedtls/hkdf.h>

mbedtls_ecdh_context ecdhCtx;
uint8_t sharedSecret[32];
uint8_t aesKey[32];

// Perform ECDH key exchange with server
bool performECDHKeyExchange(const uint8_t* serverPublicKey, size_t keyLen) {
  int ret;
  
  // Import server's public key
  ret = mbedtls_ecp_point_read_binary(
    &ecdhCtx.grp,
    &ecdhCtx.Qp,
    serverPublicKey,
    keyLen
  );
  if (ret != 0) return false;
  
  // Compute shared secret
  ret = mbedtls_ecdh_compute_shared(
    &ecdhCtx.grp,
    &ecdhCtx.z,
    &ecdhCtx.Qp,
    &ecdhCtx.d,
    mbedtls_ctr_drbg_random,
    &ctrDrbg
  );
  if (ret != 0) return false;
  
  // Export shared secret
  ret = mbedtls_mpi_write_binary(&ecdhCtx.z, sharedSecret, 32);
  if (ret != 0) return false;
  
  // Derive AES key using HKDF
  const unsigned char salt[] = "SafeEdge-AES-Key";
  const unsigned char info[] = "SafeEdge-ESP32-Encryption";
  
  ret = mbedtls_hkdf(
    mbedtls_md_info_from_type(MBEDTLS_MD_SHA256),
    salt, sizeof(salt) - 1,
    sharedSecret, 32,
    info, sizeof(info) - 1,
    aesKey, 32
  );
  
  return (ret == 0);
}
```

### 3. mTLS Handshake Protocol

#### Complete mTLS Connection Flow

```mermaid
sequenceDiagram
    participant ESP32
    participant Server
    participant CA
    
    Note over ESP32,Server: Phase 1: TLS Handshake
    ESP32->>Server: ClientHello (TLS 1.2/1.3)
    Server->>ESP32: ServerHello + Server Certificate
    ESP32->>ESP32: Verify server certificate with CA
    ESP32->>Server: Client Certificate
    Server->>Server: Verify client certificate with CA
    Server->>ESP32: Certificate Verified
    
    Note over ESP32,Server: Phase 2: Key Exchange
    ESP32->>Server: Client Key Exchange (ECDH public key)
    Server->>ESP32: Server Key Exchange (ECDH public key)
    ESP32->>ESP32: Derive shared secret via ECDH
    Server->>Server: Derive shared secret via ECDH
    
    Note over ESP32,Server: Phase 3: Session Establishment
    ESP32->>Server: Finished (encrypted with session key)
    Server->>ESP32: Finished (encrypted with session key)
    
    Note over ESP32,Server: Phase 4: Secure Communication
    ESP32->>Server: Encrypted sensor data (AES-256-GCM)
    Server->>ESP32: Encrypted commands (AES-256-GCM)
```

#### ESP32 mTLS Client Implementation

```cpp
// ESP32 firmware - mTLS client

#include <WiFiClientSecure.h>

WiFiClientSecure secureClient;

// Configure mTLS
void setupMTLS() {
  // Load Root CA certificate
  secureClient.setCACert(ca_cert);
  
  // Load device certificate
  secureClient.setCertificate(device_cert);
  
  // Load device private key
  secureClient.setPrivateKey(device_key);
  
  // Enable certificate verification
  secureClient.setInsecure(false); // IMPORTANT: Verify server cert
}

// Establish mTLS connection
bool connectToServer() {
  Serial.println("Establishing mTLS connection...");
  
  if (!secureClient.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("mTLS connection failed!");
    return false;
  }
  
  Serial.println("mTLS connection established");
  
  // Verify server certificate fingerprint (certificate pinning)
  if (!verifyServerFingerprint()) {
    Serial.println("Server certificate verification failed!");
    secureClient.stop();
    return false;
  }
  
  return true;
}

// Verify server certificate fingerprint
bool verifyServerFingerprint() {
  // Get server certificate fingerprint
  const char* fingerprint = secureClient.getPeerCertFingerprint();
  
  // Compare with expected fingerprint
  if (strcmp(fingerprint, EXPECTED_SERVER_FINGERPRINT) != 0) {
    Serial.println("Fingerprint mismatch!");
    return false;
  }
  
  Serial.println("Server certificate verified");
  return true;
}
```

#### Backend mTLS Server Implementation

```python
# Backend API - mTLS server configuration

from fastapi import FastAPI, Request, HTTPException
import ssl

app = FastAPI()

# Configure SSL context for mTLS
def create_ssl_context():
    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    
    # Load server certificate and private key
    context.load_cert_chain(
        certfile="/path/to/server-cert.pem",
        keyfile="/path/to/server-key.pem"
    )
    
    # Load CA certificate for client verification
    context.load_verify_locations(cafile="/path/to/ca-cert.pem")
    
    # Require client certificate
    context.verify_mode = ssl.CERT_REQUIRED
    
    # Set minimum TLS version
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    
    return context

# Verify client certificate
@app.middleware("http")
async def verify_client_certificate(request: Request, call_next):
    # Get client certificate from request
    cert = request.scope.get("transport").get_extra_info("peercert")
    
    if not cert:
        raise HTTPException(status_code=401, detail="Client certificate required")
    
    # Extract device ID from certificate CN
    subject = dict(x[0] for x in cert['subject'])
    device_id = subject.get('commonName')
    
    # Validate certificate
    is_valid = await validate_device_certificate(device_id, cert)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid certificate")
    
    # Add device ID to request state
    request.state.device_id = device_id
    
    response = await call_next(request)
    return response
```

### 4. Security Best Practices

#### Key Storage

**Backend (Server)**
- Root CA private key: Azure Key Vault / AWS KMS
- Server private key: Encrypted file with HSM
- Device certificates: Database (encrypted at rest)
- Session keys: Redis with TTL

**ESP32 (Device)**
- Device certificate: SPIFFS (encrypted partition)
- Device private key: Secure storage (NVS encrypted)
- AES session key: RAM only (never persisted)
- Root CA cert: Flash memory (read-only)

#### Certificate Rotation

```typescript
// Automatic certificate renewal (30 days before expiration)
async function checkCertificateExpiration() {
  const devices = await getDevicesWithExpiringCerts(30); // 30 days
  
  for (const device of devices) {
    // Generate new certificate
    const newCert = await generateDeviceCertificate(
      device.deviceId,
      device.organizationId
    );
    
    // Send renewal notification to device
    await sendCertificateRenewal(device.deviceId, newCert);
    
    // Update database
    await updateDeviceCertificate(device.deviceId, newCert);
  }
}
```

#### Revocation Checking

```typescript
// Certificate Revocation List (CRL)
export class CertificateRevocationList {
  private revokedCerts: Set<string> = new Set();
  
  async revokeCertificate(fingerprint: string, reason: string) {
    this.revokedCerts.add(fingerprint);
    
    // Store in database
    await db.execute(
      `UPDATE certificates SET status = 'revoked', 
       revoked_at = NOW(), revocation_reason = ? 
       WHERE fingerprint = ?`,
      [reason, fingerprint]
    );
    
    // Notify all connected devices
    await broadcastCertificateRevocation(fingerprint);
  }
  
  isRevoked(fingerprint: string): boolean {
    return this.revokedCerts.has(fingerprint);
  }
}
```

---

## Real-Time Communication

### 1. WebSocket Architecture

#### System Overview

```mermaid
graph TB
    subgraph "Frontend Clients"
        Dashboard1[Dashboard Client 1]
        Dashboard2[Dashboard Client 2]
        Mobile[Mobile App]
    end
    
    subgraph "WebSocket Server"
        WSServer[WebSocket Server]
        ConnectionManager[Connection Manager]
        RoomManager[Room Manager]
        MessageBroker[Message Broker]
    end
    
    subgraph "Data Sources"
        Firebase[Firebase Realtime DB]
        API[Backend API]
        ESP32[ESP32 Devices]
    end
    
    Dashboard1 <-->|WSS| WSServer
    Dashboard2 <-->|WSS| WSServer
    Mobile <-->|WSS| WSServer
    
    WSServer --> ConnectionManager
    WSServer --> RoomManager
    WSServer --> MessageBroker
    
    Firebase -->|onChange| MessageBroker
    API -->|Event| MessageBroker
    ESP32 -->|Firebase| Firebase
    
    MessageBroker -->|Broadcast| WSServer
```

### 2. Backend WebSocket Server Implementation

#### FastAPI WebSocket Server

```python
# src/backend/websocket_server.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set, List
import asyncio
import json
from datetime import datetime

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        # Store active connections by device_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store connections by organization_id
        self.org_connections: Dict[str, Set[WebSocket]] = {}
        # Store user info for each connection
        self.connection_info: Dict[WebSocket, dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        device_id: str = None,
        organization_id: str = None,
        user_id: str = None
    ):
        await websocket.accept()
        
        # Store connection info
        self.connection_info[websocket] = {
            "device_id": device_id,
            "organization_id": organization_id,
            "user_id": user_id,
            "connected_at": datetime.now().isoformat()
        }
        
        # Add to device-specific connections
        if device_id:
            if device_id not in self.active_connections:
                self.active_connections[device_id] = set()
            self.active_connections[device_id].add(websocket)
        
        # Add to organization-wide connections
        if organization_id:
            if organization_id not in self.org_connections:
                self.org_connections[organization_id] = set()
            self.org_connections[organization_id].add(websocket)
        
        print(f"✅ WebSocket connected: device={device_id}, org={organization_id}, user={user_id}")
    
    def disconnect(self, websocket: WebSocket):
        info = self.connection_info.get(websocket)
        if not info:
            return
        
        device_id = info.get("device_id")
        organization_id = info.get("organization_id")
        
        # Remove from device connections
        if device_id and device_id in self.active_connections:
            self.active_connections[device_id].discard(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]
        
        # Remove from organization connections
        if organization_id and organization_id in self.org_connections:
            self.org_connections[organization_id].discard(websocket)
            if not self.org_connections[organization_id]:
                del self.org_connections[organization_id]
        
        # Remove connection info
        del self.connection_info[websocket]
        
        print(f"❌ WebSocket disconnected: device={device_id}, org={organization_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")
    
    async def broadcast_to_device(self, device_id: str, message: dict):
        """Send message to all clients watching a specific device"""
        if device_id not in self.active_connections:
            return
        
        disconnected = set()
        for connection in self.active_connections[device_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to device {device_id}: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_to_organization(self, organization_id: str, message: dict):
        """Send message to all clients in an organization"""
        if organization_id not in self.org_connections:
            return
        
        disconnected = set()
        for connection in self.org_connections[organization_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to org {organization_id}: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_all(self, message: dict):
        """Send message to all connected clients"""
        all_connections = set()
        for connections in self.active_connections.values():
            all_connections.update(connections)
        
        disconnected = set()
        for connection in all_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to all: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    def get_connection_count(self) -> dict:
        return {
            "total_connections": len(self.connection_info),
            "devices_monitored": len(self.active_connections),
            "organizations": len(self.org_connections)
        }

manager = ConnectionManager()

# WebSocket endpoint for device-specific updates
@app.websocket("/ws/devices/{device_id}")
async def websocket_device_endpoint(
    websocket: WebSocket,
    device_id: str,
    token: str = None  # JWT token for authentication
):
    # Verify authentication
    user_info = await verify_websocket_token(token)
    if not user_info:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Verify user has access to this device
    has_access = await check_device_access(user_info["user_id"], device_id)
    if not has_access:
        await websocket.close(code=1008, reason="Access denied")
        return
    
    await manager.connect(
        websocket,
        device_id=device_id,
        organization_id=user_info.get("organization_id"),
        user_id=user_info["user_id"]
    )
    
    try:
        # Send initial device state
        initial_state = await get_device_current_state(device_id)
        await manager.send_personal_message({
            "type": "initial_state",
            "data": initial_state
        }, websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle client messages
            await handle_client_message(websocket, device_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# WebSocket endpoint for organization-wide updates
@app.websocket("/ws/organizations/{organization_id}")
async def websocket_organization_endpoint(
    websocket: WebSocket,
    organization_id: str,
    token: str = None
):
    user_info = await verify_websocket_token(token)
    if not user_info:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Verify user belongs to organization
    if user_info.get("organization_id") != organization_id:
        await websocket.close(code=1008, reason="Access denied")
        return
    
    await manager.connect(
        websocket,
        organization_id=organization_id,
        user_id=user_info["user_id"]
    )
    
    try:
        # Send initial organization state
        initial_state = await get_organization_devices(organization_id)
        await manager.send_personal_message({
            "type": "initial_state",
            "data": initial_state
        }, websocket)
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await handle_client_message(websocket, organization_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Handle incoming client messages
async def handle_client_message(websocket: WebSocket, identifier: str, message: dict):
    msg_type = message.get("type")
    
    if msg_type == "ping":
        await manager.send_personal_message({"type": "pong"}, websocket)
    
    elif msg_type == "subscribe":
        # Subscribe to specific events
        events = message.get("events", [])
        # Store subscription preferences
        pass
    
    elif msg_type == "command":
        # Send command to device
        device_id = message.get("device_id")
        command = message.get("command")
        await send_device_command(device_id, command)
        await manager.send_personal_message({
            "type": "command_sent",
            "command": command
        }, websocket)

# Get WebSocket connection statistics
@app.get("/api/websocket/stats")
async def get_websocket_stats():
    return manager.get_connection_count()
```

#### Firebase Change Listener (Event Bridge)

```python
# src/backend/firebase_listener.py

import firebase_admin
from firebase_admin import credentials, db
import asyncio

class FirebaseEventBridge:
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        self.listeners = {}
    
    def start_listening(self):
        """Start listening to Firebase changes"""
        # Listen to device current data changes
        ref = db.reference('/devices')
        ref.listen(self.on_device_change)
        
        # Listen to alerts
        alerts_ref = db.reference('/alerts')
        alerts_ref.listen(self.on_alert_change)
        
        print("🔥 Firebase event bridge started")
    
    def on_device_change(self, event):
        """Handle device data changes from Firebase"""
        if event.event_type == 'put':
            path = event.path
            data = event.data
            
            # Extract device_id from path
            # Path format: /devices/{device_id}/current
            parts = path.strip('/').split('/')
            if len(parts) >= 2:
                device_id = parts[1]
                
                # Broadcast to all clients watching this device
                asyncio.create_task(
                    self.manager.broadcast_to_device(device_id, {
                        "type": "sensor_update",
                        "device_id": device_id,
                        "data": data,
                        "timestamp": datetime.now().isoformat()
                    })
                )
    
    def on_alert_change(self, event):
        """Handle new alerts from Firebase"""
        if event.event_type == 'put':
            data = event.data
            
            if isinstance(data, dict):
                device_id = data.get('deviceId')
                organization_id = await get_device_organization(device_id)
                
                # Broadcast alert to organization
                asyncio.create_task(
                    self.manager.broadcast_to_organization(organization_id, {
                        "type": "alert",
                        "alert": data,
                        "timestamp": datetime.now().isoformat()
                    })
                )

# Initialize Firebase event bridge
firebase_bridge = FirebaseEventBridge(manager)
firebase_bridge.start_listening()
```

### 3. Frontend WebSocket Client Implementation

#### React WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnect = true,
  reconnectInterval = 3000
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      // Add token to URL
      const wsUrl = `${url}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnection
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, reconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}
```

#### Device Monitor Component with WebSocket

```typescript
// src/components/ESP32DeviceMonitor.tsx

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface SensorData {
  temperature: number;
  humidity: number;
  threatLevel: string;
  securityScore: number;
  timestamp: string;
}

export function ESP32DeviceMonitor({ deviceId, token }: { deviceId: string; token: string }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const { isConnected, lastMessage, sendMessage } = useWebSocket({
    url: `wss://api.safeedge.com/ws/devices/${deviceId}`,
    token,
    onMessage: (message) => {
      console.log('Received message:', message);

      switch (message.type) {
        case 'initial_state':
          setSensorData(message.data);
          break;

        case 'sensor_update':
          setSensorData(message.data);
          // Show notification for critical changes
          if (message.data.threatLevel === 'critical') {
            showNotification('Critical Threat Detected!', message.data);
          }
          break;

        case 'alert':
          setAlerts(prev => [message.alert, ...prev]);
          // Show alert notification
          showAlertNotification(message.alert);
          break;

        case 'status_change':
          console.log('Device status changed:', message.data);
          break;

        case 'device_blocked':
          console.log('Device blocked:', message.data);
          break;
      }
    },
    onConnect: () => {
      console.log('Connected to device:', deviceId);
    },
    onDisconnect: () => {
      console.log('Disconnected from device:', deviceId);
    }
  });

  const sendCommand = (command: string) => {
    sendMessage({
      type: 'command',
      device_id: deviceId,
      command
    });
  };

  return (
    <div className="device-monitor">
      <div className="connection-status">
        {isConnected ? (
          <span className="text-green-500">● Connected</span>
        ) : (
          <span className="text-red-500">● Disconnected</span>
        )}
      </div>

      {sensorData && (
        <div className="sensor-data">
          <div className="metric">
            <label>Temperature</label>
            <span>{sensorData.temperature}°C</span>
          </div>
          <div className="metric">
            <label>Humidity</label>
            <span>{sensorData.humidity}%</span>
          </div>
          <div className="metric">
            <label>Security Score</label>
            <span>{sensorData.securityScore}/100</span>
          </div>
          <div className="metric">
            <label>Threat Level</label>
            <span className={`threat-${sensorData.threatLevel}`}>
              {sensorData.threatLevel}
            </span>
          </div>
        </div>
      )}

      <div className="controls">
        <button onClick={() => sendCommand('STATUS')}>
          Get Status
        </button>
        <button onClick={() => sendCommand('RESET')}>
          Reset Device
        </button>
      </div>

      <div className="alerts">
        <h3>Recent Alerts</h3>
        {alerts.map((alert, index) => (
          <div key={index} className={`alert alert-${alert.severity}`}>
            <span className="alert-time">{alert.timestamp}</span>
            <span className="alert-message">{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function showNotification(title: string, data: any) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: `Temperature: ${data.temperature}°C, Score: ${data.securityScore}`,
      icon: '/alert-icon.png'
    });
  }
}

function showAlertNotification(alert: any) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`${alert.severity} Alert`, {
      body: alert.message,
      icon: '/alert-icon.png',
      tag: alert.alertId
    });
  }
}
```

### 4. WebSocket Message Types

#### Client → Server Messages

```typescript
// Ping/Pong (keep-alive)
{
  "type": "ping"
}

// Subscribe to specific events
{
  "type": "subscribe",
  "events": ["sensor_update", "alert", "status_change"]
}

// Send command to device
{
  "type": "command",
  "device_id": "esp32_gateway_001",
  "command": "TEMP_ATTACK",
  "parameters": {}
}

// Request historical data
{
  "type": "get_history",
  "device_id": "esp32_gateway_001",
  "metric": "temperature",
  "timeRange": "1h"
}
```

#### Server → Client Messages

```typescript
// Initial state (sent on connection)
{
  "type": "initial_state",
  "data": {
    "deviceId": "esp32_gateway_001",
    "status": "online",
    "currentData": { /* sensor data */ }
  }
}

// Sensor data update
{
  "type": "sensor_update",
  "device_id": "esp32_gateway_001",
  "data": {
    "temperature": 37.2,
    "humidity": 55.5,
    "threatLevel": "safe",
    "securityScore": 100
  },
  "timestamp": "2026-04-09T10:30:15Z"
}

// Security alert
{
  "type": "alert",
  "alert": {
    "alertId": "alert_12345",
    "deviceId": "esp32_gateway_001",
    "severity": "CRITICAL",
    "message": "Temperature attack detected",
    "attackType": "Temperature Manipulation",
    "timestamp": "2026-04-09T10:25:30Z"
  }
}

// Device status change
{
  "type": "status_change",
  "device_id": "esp32_gateway_001",
  "status": "offline",
  "timestamp": "2026-04-09T10:30:00Z"
}

// IoT device blocked
{
  "type": "device_blocked",
  "device_id": "esp32_gateway_001",
  "iot_device": {
    "deviceId": "iot_device_001",
    "ipAddress": "192.168.1.101",
    "reason": "Suspicious activity"
  },
  "timestamp": "2026-04-09T10:30:00Z"
}

// Command acknowledgment
{
  "type": "command_sent",
  "command": "TEMP_ATTACK",
  "status": "queued"
}

// Pong response
{
  "type": "pong"
}
```

### 5. WebSocket Connection Management

#### Heartbeat/Keep-Alive

```typescript
// Client-side heartbeat
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // Every 30 seconds
```

```python
# Server-side heartbeat monitoring
async def monitor_connection_health():
    while True:
        await asyncio.sleep(60)  # Check every minute
        
        for websocket, info in list(manager.connection_info.items()):
            last_activity = info.get('last_activity')
            if last_activity:
                idle_time = (datetime.now() - last_activity).total_seconds()
                if idle_time > 120:  # 2 minutes idle
                    print(f"Closing idle connection: {info}")
                    await websocket.close(code=1000, reason="Idle timeout")
                    manager.disconnect(websocket)
```

#### Reconnection Strategy

```typescript
// Exponential backoff reconnection
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const baseDelay = 1000; // 1 second

function reconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }

  const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;

  setTimeout(() => {
    console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
    connect();
  }, delay);
}

ws.onclose = () => {
  reconnect();
};

ws.onopen = () => {
  reconnectAttempts = 0; // Reset on successful connection
};
```

### 6. Performance Optimization

#### Message Batching

```python
# Batch multiple sensor updates to reduce message frequency
class MessageBatcher:
    def __init__(self, interval: float = 0.5):
        self.interval = interval
        self.pending_messages: Dict[str, List[dict]] = {}
        self.task = asyncio.create_task(self.flush_loop())
    
    async def add_message(self, device_id: str, message: dict):
        if device_id not in self.pending_messages:
            self.pending_messages[device_id] = []
        self.pending_messages[device_id].append(message)
    
    async def flush_loop(self):
        while True:
            await asyncio.sleep(self.interval)
            await self.flush()
    
    async def flush(self):
        for device_id, messages in self.pending_messages.items():
            if messages:
                # Send batched update
                await manager.broadcast_to_device(device_id, {
                    "type": "batch_update",
                    "messages": messages,
                    "count": len(messages)
                })
        self.pending_messages.clear()
```

#### Connection Pooling

```python
# Limit connections per device
MAX_CONNECTIONS_PER_DEVICE = 10

async def connect(self, websocket: WebSocket, device_id: str, ...):
    if device_id in self.active_connections:
        if len(self.active_connections[device_id]) >= MAX_CONNECTIONS_PER_DEVICE:
            await websocket.close(code=1008, reason="Too many connections")
            return
    
    await websocket.accept()
    # ... rest of connection logic
```

---

## Hardware Integration

**a. Server-Side CA**
```typescript
// src/lib/certificate-authority.ts
- Generate root CA certificate (one-time)
- Issue device certificates signed by CA
- Store certificates in database
- Validate device certificates
- Revoke compromised certificates
- Certificate renewal
```

**b. Certificate Structure**
```
Root CA Certificate
├── Server Certificate (Backend API)
├── ESP32 Device Certificate 1
├── ESP32 Device Certificate 2
└── ESP32 Device Certificate N

Each ESP32 certificate contains:
- Device ID
- Organization ID
- Public Key (ECC secp256k1)
- Expiration date
- Certificate fingerprint (SHA256)
```

**c. Certificate Exchange Flow**
```mermaid
sequenceDiagram
    participant Admin as Admin Dashboard
    participant API as Backend API
    participant CA as Certificate Authority
    participant DB as Database
    participant ESP32 as ESP32 Device
    
    Admin->>API: Provision new device
    API->>CA: Generate device certificate
    CA->>CA: Create ECC key pair
    CA->>CA: Sign with root CA
    CA-->>API: Return cert + private key
    API->>DB: Store certificate metadata
    API-->>Admin: Return provisioning data
    
    Admin->>Admin: Display QR code
    Note over Admin: QR contains: deviceId, cert, key, Firebase config
    
    ESP32->>ESP32: Scan QR code
    ESP32->>ESP32: Store cert in SPIFFS
    ESP32->>API: Register with certificate
    API->>API: Validate certificate signature
    API->>API: Derive ECDH shared secret
    API-->>ESP32: Registration success
    ESP32->>Firebase: Connect with credentials
```

### 6. Real-Time Communication Architecture

#### Firebase Real-Time Sync

**a. ESP32 → Firebase → Web Dashboard**
```
ESP32 Device:
1. Read sensors every 2 seconds
2. Calculate security score
3. Detect anomalies
4. Push to Firebase: /devices/{id}/current
5. If attack detected: Push to /alerts/{timestamp}

Firebase:
- Real-time database triggers
- Data persistence
- Automatic sync to all clients

Web Dashboard:
1. Subscribe to Firebase path: /devices/{id}/current
2. Listen for changes
3. Update UI in real-time
4. Show notifications for alerts
```

**b. Web Dashboard → Firebase → ESP32**
```
Web Dashboard:
1. User clicks "Block Device" button
2. Write command to Firebase: /commands/{device_id}

Firebase:
- Stores command temporarily

ESP32:
1. Poll /commands/{device_id} every loop (100ms)
2. Read command
3. Execute action (block traffic)
4. Clear command from Firebase
5. Update status in /devices/{id}/current
```

#### WebSocket for Low-Latency Updates (Optional Enhancement)

```typescript
// For even faster updates, add WebSocket layer
// Backend WebSocket server listens to Firebase
// Pushes updates to connected dashboard clients
// Reduces latency from ~500ms to ~50ms
```

### 7. Attack Detection & Response Logic

#### Attack Detection Algorithm

```cpp
int calculateSecurityScore() {
  int score = 100;
  
  // Temperature anomaly (-20 points)
  if (temp < 35.0 || temp > 40.0) score -= 20;
  
  // Humidity anomaly (-10 points)
  if (humidity < 40.0 || humidity > 70.0) score -= 10;
  
  // Oxygen level anomaly (-15 points)
  if (oxygen < 18.0 || oxygen > 45.0) score -= 15;
  
  // Unauthorized access (-25 points)
  if (motionDetected || doorOpen) score -= 25;
  
  // Vibration anomaly (-15 points)
  if (vibration > 2.0) score -= 15;
  
  // Power anomaly (-20 points)
  if (voltage < 11.0 || voltage > 13.5) score -= 20;
  
  return max(0, score);
}

String determineThreatLevel(int score) {
  if (score >= 80) return "safe";      // GREEN LED
  if (score >= 60) return "warning";   // YELLOW LED
  return "critical";                    // RED LED + BUZZER
}
```

#### Automatic Attack Response

```cpp
void handleThreatDetection() {
  int score = calculateSecurityScore();
  String threat = determineThreatLevel(score);
  
  if (threat == "critical") {
    // 1. Activate visual alerts
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_ATTACK, HIGH);
    
    // 2. Activate buzzer
    tone(BUZZER_PIN, 1000, 500); // 1kHz for 500ms
    
    // 3. Identify malicious device
    String maliciousDevice = identifyAttackSource();
    
    // 4. Block device traffic
    blockDeviceTraffic(maliciousDevice);
    
    // 5. Send alert to Firebase
    sendAttackAlert("CRITICAL", "Attack blocked automatically");
    
    // 6. Log to serial
    Serial.println("🚨 ATTACK BLOCKED: " + maliciousDevice);
    
  } else if (threat == "warning") {
    // Yellow LED + short beep
    digitalWrite(LED_YELLOW, HIGH);
    tone(BUZZER_PIN, 800, 100);
    
    sendAttackAlert("WARNING", "Anomaly detected - monitoring");
  } else {
    // Green LED (safe)
    digitalWrite(LED_GREEN, HIGH);
  }
}
```

#### Traffic Blocking Implementation

```cpp
// Block device at network level
void blockDeviceTraffic(String deviceIP) {
  // Method 1: MAC address filtering
  addMACToBlocklist(deviceMAC);
  
  // Method 2: IP blocking via firewall rules
  addIPToBlocklist(deviceIP);
  
  // Method 3: Drop packets in ESP32 gateway
  enablePacketFiltering(deviceIP);
  
  // Update Firebase
  updateDeviceStatus(deviceIP, "blocked");
  
  // Visual confirmation
  digitalWrite(LED_ATTACK, HIGH);
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 1200, 100);
    delay(200);
  }
}
```

## Device Provisioning Flow

### 1. Provisioning Architecture

```mermaid
sequenceDiagram
    participant Admin as Admin Dashboard
    participant API as Backend API
    participant CA as Certificate Authority
    participant DB as Database
    participant Firebase as Firebase
    participant QR as QR Generator
    participant ESP32 as ESP32 Device
    
    Note over Admin,ESP32: Phase 1: Device Creation
    Admin->>API: POST /api/esp32/provision
    API->>CA: Generate device certificate
    CA-->>API: Certificate + Private Key
    API->>Firebase: Create device auth token
    Firebase-->>API: Auth token
    API->>DB: Store device record
    API->>QR: Generate QR code
    QR-->>API: QR code image
    API-->>Admin: Provisioning data + QR code
    
    Note over Admin,ESP32: Phase 2: Device Configuration
    Admin->>Admin: Display QR code
    ESP32->>ESP32: Scan QR code (Serial/Camera)
    ESP32->>ESP32: Parse configuration JSON
    ESP32->>ESP32: Store cert in SPIFFS
    ESP32->>ESP32: Store credentials
    
    Note over ESP32,Firebase: Phase 3: Device Registration
    ESP32->>ESP32: Connect to WiFi
    ESP32->>API: POST /api/esp32/register
    API->>API: Validate certificate
    API->>API: Derive ECDH shared secret
    API-->>ESP32: Registration success
    ESP32->>Firebase: Connect with auth token
    Firebase-->>ESP32: Connection established
    ESP32->>Firebase: Push device info
    
    Note over Admin,ESP32: Phase 4: Verification
    Firebase->>API: Device online event
    API->>Admin: WebSocket notification
    Admin->>Admin: Show "Device Connected" ✓
```

### 2. Backend Provisioning Implementation

#### Provisioning API Endpoint

```python
# src/backend/esp32_provisioning.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import qrcode
import io
import base64
from typing import Optional
import secrets

router = APIRouter(prefix="/api/esp32", tags=["ESP32 Provisioning"])

class ProvisionRequest(BaseModel):
    device_name: str
    location: str
    organization_id: str
    department_id: Optional[str] = None
    device_type: str = "ESP32_GATEWAY"
    wifi_ssid: Optional[str] = None
    wifi_password: Optional[str] = None

class ProvisionResponse(BaseModel):
    success: bool
    device_id: str
    device_name: str
    certificate: str
    private_key: str
    firebase_config: dict
    qr_code: str  # Base64 encoded PNG
    qr_code_url: str  # URL to download QR code
    config_json: str  # JSON string for manual configuration
    provisioning_url: str  # URL for web-based provisioning

@router.post("/provision", response_model=ProvisionResponse)
async def provision_device(
    request: ProvisionRequest,
    current_user = Depends(get_current_user)
):
    """
    Provision a new ESP32 device
    
    Steps:
    1. Generate unique device ID
    2. Create device certificate
    3. Generate Firebase auth token
    4. Create QR code with configuration
    5. Store device in database
    6. Return provisioning data
    """
    
    # Verify user has permission to provision devices
    if not await has_provisioning_permission(current_user, request.organization_id):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Generate unique device ID
    device_id = f"esp32_gateway_{secrets.token_hex(8)}"
    
    # Generate device certificate
    cert_data = await certificate_authority.generate_device_certificate(
        device_id=device_id,
        organization_id=request.organization_id
    )
    
    # Generate Firebase auth token
    firebase_token = await firebase_admin.create_custom_token(device_id)
    firebase_config = {
        "host": FIREBASE_HOST,
        "authToken": firebase_token,
        "databaseURL": f"https://{FIREBASE_HOST}"
    }
    
    # Create device record in database
    device_record = {
        "id": generate_uuid(),
        "device_id": device_id,
        "device_name": request.device_name,
        "device_type": request.device_type,
        "organization_id": request.organization_id,
        "department_id": request.department_id,
        "location": request.location,
        "certificate_id": cert_data["certificate_id"],
        "certificate_fingerprint": cert_data["fingerprint"],
        "public_key": cert_data["public_key"],
        "status": "provisioned",
        "registered_at": datetime.now()
    }
    
    await db.insert("esp32_devices", device_record)
    
    # Build configuration JSON
    config = {
        "deviceId": device_id,
        "deviceName": request.device_name,
        "organizationId": request.organization_id,
        "certificate": cert_data["certificate"],
        "privateKey": cert_data["private_key"],
        "serverPublicKey": get_server_public_key(),
        "firebase": firebase_config,
        "wifi": {
            "ssid": request.wifi_ssid or "",
            "password": request.wifi_password or ""
        },
        "backend": {
            "host": BACKEND_HOST,
            "port": BACKEND_PORT,
            "secure": True
        },
        "version": "1.0"
    }
    
    config_json = json.dumps(config, indent=2)
    
    # Generate QR code
    qr_code_data = await generate_qr_code(config)
    
    # Generate provisioning URL (for web-based setup)
    provisioning_url = f"https://dashboard.safeedge.com/provision/{device_id}?token={secrets.token_urlsafe(32)}"
    
    # Store provisioning token
    await store_provisioning_token(device_id, provisioning_url)
    
    return ProvisionResponse(
        success=True,
        device_id=device_id,
        device_name=request.device_name,
        certificate=cert_data["certificate"],
        private_key=cert_data["private_key"],
        firebase_config=firebase_config,
        qr_code=qr_code_data["base64"],
        qr_code_url=qr_code_data["url"],
        config_json=config_json,
        provisioning_url=provisioning_url
    )

async def generate_qr_code(config: dict) -> dict:
    """Generate QR code from configuration"""
    
    # Create QR code
    qr = qrcode.QRCode(
        version=None,  # Auto-size
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Add configuration data
    config_str = json.dumps(config)
    qr.add_data(config_str)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Save to storage and get URL
    qr_filename = f"qr_codes/{config['deviceId']}.png"
    qr_url = await upload_to_storage(buffer, qr_filename)
    
    return {
        "base64": f"data:image/png;base64,{img_base64}",
        "url": qr_url
    }
```

#### Device Registration Endpoint

```python
@router.post("/register")
async def register_device(
    device_id: str,
    certificate: str,
    public_key: str,
    firmware_version: str,
    mac_address: str,
    ip_address: str
):
    """
    Register ESP32 device after provisioning
    Called by ESP32 after scanning QR code
    """
    
    # Validate device certificate
    validation = await certificate_authority.validate_device_certificate(certificate)
    if not validation["valid"]:
        raise HTTPException(status_code=401, detail=validation["error"])
    
    # Verify device_id matches certificate
    if validation["deviceId"] != device_id:
        raise HTTPException(status_code=401, detail="Device ID mismatch")
    
    # Derive ECDH shared secret
    shared_secret = derive_shared_secret(public_key)
    
    # Store session key
    await store_device_session(device_id, shared_secret)
    
    # Update device record
    await db.update("esp32_devices", {
        "device_id": device_id
    }, {
        "status": "online",
        "ip_address": ip_address,
        "mac_address": mac_address,
        "firmware_version": firmware_version,
        "last_seen": datetime.now(),
        "registered_at": datetime.now()
    })
    
    # Send WebSocket notification to dashboard
    await websocket_manager.broadcast_to_organization(
        get_device_organization(device_id),
        {
            "type": "device_registered",
            "device_id": device_id,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    return {
        "success": True,
        "device_id": device_id,
        "server_public_key": get_server_public_key(),
        "server_time": datetime.now().isoformat(),
        "session_established": True
    }
```

### 3. Frontend Provisioning Wizard

#### Multi-Step Wizard Component

```typescript
// src/components/ESP32ProvisioningWizard.tsx

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ProvisioningWizardProps {
  organizationId: string;
  departmentId?: string;
  onComplete: (deviceId: string) => void;
}

export function ESP32ProvisioningWizard({
  organizationId,
  departmentId,
  onComplete
}: ProvisioningWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    wifiSsid: '',
    wifiPassword: ''
  });
  const [provisioningData, setProvisioningData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);

  // Step 1: Device Information
  const renderStep1 = () => (
    <div className="step-content">
      <h2>Device Information</h2>
      <p>Enter the details for your new ESP32 security gateway</p>
      
      <div className="form-group">
        <label>Device Name *</label>
        <input
          type="text"
          value={formData.deviceName}
          onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
          placeholder="e.g., NICU Gateway #1"
          required
        />
      </div>

      <div className="form-group">
        <label>Location *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Ward A - Room 101"
          required
        />
      </div>

      <div className="form-group">
        <label>WiFi SSID (Optional)</label>
        <input
          type="text"
          value={formData.wifiSsid}
          onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
          placeholder="Hospital_IoT_Network"
        />
        <small>Leave empty to configure manually on device</small>
      </div>

      <div className="form-group">
        <label>WiFi Password (Optional)</label>
        <input
          type="password"
          value={formData.wifiPassword}
          onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
          placeholder="••••••••"
        />
      </div>

      <button
        onClick={handleProvision}
        disabled={!formData.deviceName || !formData.location || isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Generating...' : 'Generate Configuration'}
      </button>
    </div>
  );

  // Step 2: QR Code Display
  const renderStep2 = () => (
    <div className="step-content">
      <h2>Scan QR Code</h2>
      <p>Scan this QR code with your ESP32 device to configure it</p>

      <div className="qr-code-container">
        <QRCodeSVG
          value={provisioningData?.config_json || ''}
          size={300}
          level="L"
          includeMargin={true}
        />
      </div>

      <div className="provisioning-options">
        <h3>Alternative Configuration Methods:</h3>

        <div className="option">
          <h4>1. Serial Configuration</h4>
          <p>Connect ESP32 via USB and paste this configuration:</p>
          <textarea
            readOnly
            value={provisioningData?.config_json}
            rows={10}
            className="config-textarea"
          />
          <button onClick={() => copyToClipboard(provisioningData?.config_json)}>
            Copy Configuration
          </button>
        </div>

        <div className="option">
          <h4>2. Download Configuration File</h4>
          <p>Download and upload to ESP32 via SD card or SPIFFS</p>
          <button onClick={downloadConfigFile}>
            Download config.json
          </button>
        </div>

        <div className="option">
          <h4>3. Download QR Code</h4>
          <p>Print QR code for physical scanning</p>
          <a href={provisioningData?.qr_code_url} download>
            <button>Download QR Code</button>
          </a>
        </div>
      </div>

      <div className="device-credentials">
        <h3>Device Credentials</h3>
        <div className="credential">
          <label>Device ID:</label>
          <code>{provisioningData?.device_id}</code>
        </div>
        <div className="credential">
          <label>Certificate Fingerprint:</label>
          <code>{provisioningData?.certificate_fingerprint}</code>
        </div>
      </div>

      <button onClick={() => setStep(3)} className="btn-primary">
        Continue to Verification
      </button>
    </div>
  );

  // Step 3: Connection Verification
  const renderStep3 = () => (
    <div className="step-content">
      <h2>Verify Connection</h2>
      <p>Waiting for device to connect...</p>

      <div className="connection-status">
        {deviceConnected ? (
          <div className="status-success">
            <span className="icon">✓</span>
            <h3>Device Connected Successfully!</h3>
            <p>Your ESP32 gateway is now online and ready to monitor IoT devices.</p>
          </div>
        ) : (
          <div className="status-waiting">
            <div className="spinner"></div>
            <h3>Waiting for Connection...</h3>
            <p>Make sure your ESP32 is powered on and has scanned the QR code.</p>
            
            <div className="troubleshooting">
              <h4>Troubleshooting:</h4>
              <ul>
                <li>Verify WiFi credentials are correct</li>
                <li>Check ESP32 serial monitor for errors</li>
                <li>Ensure device is within WiFi range</li>
                <li>Verify certificate was loaded correctly</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {deviceConnected && (
        <div className="next-steps">
          <h3>Next Steps:</h3>
          <ul>
            <li>View device dashboard</li>
            <li>Configure IoT device monitoring</li>
            <li>Set up alert notifications</li>
            <li>Test attack detection</li>
          </ul>

          <button
            onClick={() => onComplete(provisioningData?.device_id)}
            className="btn-primary"
          >
            Go to Device Dashboard
          </button>
        </div>
      )}
    </div>
  );

  // Handle provisioning
  const handleProvision = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/esp32/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_name: formData.deviceName,
          location: formData.location,
          organization_id: organizationId,
          department_id: departmentId,
          wifi_ssid: formData.wifiSsid,
          wifi_password: formData.wifiPassword
        })
      });

      const data = await response.json();
      setProvisioningData(data);
      setStep(2);

      // Start listening for device connection
      startConnectionListener(data.device_id);
    } catch (error) {
      console.error('Provisioning failed:', error);
      alert('Failed to provision device. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for device connection via WebSocket
  const startConnectionListener = (deviceId: string) => {
    const ws = new WebSocket(`wss://api.safeedge.com/ws/devices/${deviceId}?token=${getAuthToken()}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'device_registered' || message.type === 'initial_state') {
        setDeviceConnected(true);
        ws.close();
      }
    };

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!deviceConnected) {
        ws.close();
      }
    }, 300000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Configuration copied to clipboard!');
  };

  const downloadConfigFile = () => {
    const blob = new Blob([provisioningData?.config_json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${provisioningData?.device_id}_config.json`;
    a.click();
  };

  return (
    <div className="provisioning-wizard">
      <div className="wizard-header">
        <h1>Provision New ESP32 Gateway</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Device Info</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Configuration</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Verification</div>
        </div>
      </div>

      <div className="wizard-body">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
```

### 4. ESP32 Configuration Parser

```cpp
// ESP32 firmware - Configuration parser

#include <ArduinoJson.h>
#include <SPIFFS.h>

struct DeviceConfig {
  String deviceId;
  String deviceName;
  String organizationId;
  String certificate;
  String privateKey;
  String serverPublicKey;
  
  struct {
    String host;
    String authToken;
    String databaseURL;
  } firebase;
  
  struct {
    String ssid;
    String password;
  } wifi;
  
  struct {
    String host;
    int port;
    bool secure;
  } backend;
};

DeviceConfig config;

// Parse QR code data
bool parseQRCode(const String& qrData) {
  StaticJsonDocument<4096> doc;
  DeserializationError error = deserializeJson(doc, qrData);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return false;
  }
  
  // Extract configuration
  config.deviceId = doc["deviceId"].as<String>();
  config.deviceName = doc["deviceName"].as<String>();
  config.organizationId = doc["organizationId"].as<String>();
  config.certificate = doc["certificate"].as<String>();
  config.privateKey = doc["privateKey"].as<String>();
  config.serverPublicKey = doc["serverPublicKey"].as<String>();
  
  config.firebase.host = doc["firebase"]["host"].as<String>();
  config.firebase.authToken = doc["firebase"]["authToken"].as<String>();
  config.firebase.databaseURL = doc["firebase"]["databaseURL"].as<String>();
  
  config.wifi.ssid = doc["wifi"]["ssid"].as<String>();
  config.wifi.password = doc["wifi"]["password"].as<String>();
  
  config.backend.host = doc["backend"]["host"].as<String>();
  config.backend.port = doc["backend"]["port"];
  config.backend.secure = doc["backend"]["secure"];
  
  return true;
}

// Save configuration to SPIFFS
bool saveConfig() {
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed");
    return false;
  }
  
  // Save certificate
  File certFile = SPIFFS.open("/cert.pem", "w");
  if (!certFile) return false;
  certFile.print(config.certificate);
  certFile.close();
  
  // Save private key (encrypted)
  File keyFile = SPIFFS.open("/key.pem", "w");
  if (!keyFile) return false;
  keyFile.print(config.privateKey);
  keyFile.close();
  
  // Save configuration
  StaticJsonDocument<2048> doc;
  doc["deviceId"] = config.deviceId;
  doc["deviceName"] = config.deviceName;
  doc["organizationId"] = config.organizationId;
  doc["firebase"]["host"] = config.firebase.host;
  doc["firebase"]["authToken"] = config.firebase.authToken;
  doc["wifi"]["ssid"] = config.wifi.ssid;
  doc["wifi"]["password"] = config.wifi.password;
  doc["backend"]["host"] = config.backend.host;
  doc["backend"]["port"] = config.backend.port;
  
  File configFile = SPIFFS.open("/config.json", "w");
  if (!configFile) return false;
  serializeJson(doc, configFile);
  configFile.close();
  
  Serial.println("✓ Configuration saved to SPIFFS");
  return true;
}

// Load configuration from SPIFFS
bool loadConfig() {
  if (!SPIFFS.begin()) {
    Serial.println("SPIFFS mount failed");
    return false;
  }
  
  File configFile = SPIFFS.open("/config.json", "r");
  if (!configFile) {
    Serial.println("Config file not found");
    return false;
  }
  
  StaticJsonDocument<2048> doc;
  DeserializationError error = deserializeJson(doc, configFile);
  configFile.close();
  
  if (error) {
    Serial.println("Config parse error");
    return false;
  }
  
  config.deviceId = doc["deviceId"].as<String>();
  config.deviceName = doc["deviceName"].as<String>();
  // ... load rest of config
  
  // Load certificate
  File certFile = SPIFFS.open("/cert.pem", "r");
  if (certFile) {
    config.certificate = certFile.readString();
    certFile.close();
  }
  
  // Load private key
  File keyFile = SPIFFS.open("/key.pem", "r");
  if (keyFile) {
    config.privateKey = keyFile.readString();
    keyFile.close();
  }
  
  Serial.println("✓ Configuration loaded from SPIFFS");
  return true;
}

// Register device with backend
bool registerDevice() {
  HTTPClient http;
  String url = String("http://") + config.backend.host + ":" + 
               config.backend.port + "/api/esp32/register";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<1024> doc;
  doc["device_id"] = config.deviceId;
  doc["certificate"] = config.certificate;
  doc["public_key"] = devicePublicKeyBase64;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["mac_address"] = WiFi.macAddress();
  doc["ip_address"] = WiFi.localIP().toString();
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpCode = http.POST(requestBody);
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("✓ Device registered successfully");
    Serial.println(response);
    http.end();
    return true;
  } else {
    Serial.printf("✗ Registration failed: %d\n", httpCode);
    http.end();
    return false;
  }
}
```

### 8. Device Provisioning Flow

#### Step-by-Step Provisioning

**Step 1: Admin Creates Device in Dashboard**
```typescript
// Dashboard form
{
  deviceName: "NICU Gateway #1",
  location: "Ward A - Room 101",
  organizationId: "org_12345",
  departmentId: "dept_67890"
}
```

**Step 2: Backend Generates Credentials**
```python
# Backend API
1. Generate ECC key pair (secp256k1)
2. Create device certificate signed by CA
3. Generate Firebase auth token
4. Create device ID: esp32_gateway_{random}
5. Store in database
6. Return provisioning data
```

**Step 3: Display QR Code**
```json
// QR Code contains:
{
  "deviceId": "esp32_gateway_001",
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "privateKey": "-----BEGIN EC PRIVATE KEY-----...",
  "firebaseHost": "safeedge-prod.firebaseio.com",
  "firebaseAuth": "auth_token_here",
  "serverPublicKey": "-----BEGIN PUBLIC KEY-----...",
  "wifiSSID": "Hospital_IoT_Network",
  "wifiPassword": "encrypted_password"
}
```

**Step 4: ESP32 Scans QR Code**
```cpp
// ESP32 firmware
1. Scan QR code via serial or camera module
2. Parse JSON configuration
3. Store certificate in SPIFFS
4. Store private key in secure storage
5. Connect to WiFi
6. Register with Firebase
7. Perform ECDH key exchange with server
8. Start monitoring loop
```

**Step 5: Verification**
```
Dashboard shows:
✅ Device connected
✅ Certificate validated
✅ Receiving sensor data
✅ Ready to monitor IoT devices
```

### 9. Data Flow Diagrams

#### Sensor Data Flow
```
ESP32 Sensors → ESP32 Firmware → Firebase → Web Dashboard
     ↓              ↓                ↓            ↓
  Physical      Calculate        Real-time    Display
   Reading      Security         Sync         Charts
                 Score
```

#### Attack Detection Flow
```
IoT Device → ESP32 Monitor → Anomaly Detection → Attack Response
    ↓             ↓                  ↓                 ↓
 Network      Analyze           Identify          Block +
 Traffic      Patterns          Threat            Alert
```

#### Command Flow
```
Dashboard → Backend API → Firebase → ESP32 → IoT Device
    ↓           ↓            ↓         ↓          ↓
  User       Validate     Store     Execute    Traffic
  Action     Command      Temp      Action     Blocked
```

## API Specifications

### Complete API Documentation

#### Base URL
```
Production: https://api.safeedge.com
Development: http://localhost:9002
```

#### Authentication
All API endpoints require JWT authentication unless specified otherwise.

```http
Authorization: Bearer <jwt_token>
```

### 1. Device Management APIs

#### POST /api/esp32/provision
**Purpose**: Provision a new ESP32 device

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "device_name": "NICU Gateway #1",
  "location": "Ward A - Room 101",
  "organization_id": "org_12345",
  "department_id": "dept_67890",
  "device_type": "ESP32_GATEWAY",
  "wifi_ssid": "Hospital_IoT",
  "wifi_password": "secure_password"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "device_id": "esp32_gateway_a1b2c3d4",
  "device_name": "NICU Gateway #1",
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "private_key": "-----BEGIN EC PRIVATE KEY-----\n...",
  "firebase_config": {
    "host": "safeedge-prod.firebaseio.com",
    "authToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "databaseURL": "https://safeedge-prod.firebaseio.com"
  },
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "qr_code_url": "https://storage.safeedge.com/qr/esp32_gateway_a1b2c3d4.png",
  "config_json": "{\n  \"deviceId\": \"esp32_gateway_a1b2c3d4\",\n  ...\n}",
  "provisioning_url": "https://dashboard.safeedge.com/provision/esp32_gateway_a1b2c3d4?token=..."
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request data
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Device already exists
- `500 Internal Server Error`: Server error

---

#### GET /api/esp32/devices
**Purpose**: List all ESP32 devices

**Authentication**: Required

**Query Parameters**:
- `organization_id` (optional): Filter by organization
- `department_id` (optional): Filter by department
- `status` (optional): Filter by status (online, offline, error)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `sort` (optional, default: "last_seen"): Sort field
- `order` (optional, default: "desc"): Sort order (asc, desc)

**Response** (200 OK):
```json
{
  "success": true,
  "count": 25,
  "page": 1,
  "total_pages": 2,
  "devices": [
    {
      "device_id": "esp32_gateway_001",
      "device_name": "NICU Gateway #1",
      "location": "Ward A - Room 101",
      "status": "online",
      "threat_level": "safe",
      "security_score": 100,
      "temperature": 37.2,
      "humidity": 55.5,
      "connected_devices": 4,
      "blocked_devices": 0,
      "last_seen": "2026-04-09T10:30:00Z",
      "firmware_version": "v3.0.0",
      "ip_address": "192.168.1.100",
      "wifi_signal_strength": -45
    }
  ]
}
```

---

#### GET /api/esp32/devices/{device_id}
**Purpose**: Get detailed information about a specific device

**Authentication**: Required

**Path Parameters**:
- `device_id`: Device identifier

**Response** (200 OK):
```json
{
  "success": true,
  "device": {
    "device_id": "esp32_gateway_001",
    "device_name": "NICU Gateway #1",
    "device_type": "ESP32_GATEWAY",
    "organization_id": "org_12345",
    "department_id": "dept_67890",
    "location": "Ward A - Room 101",
    "status": "online",
    "firmware_version": "v3.0.0",
    "ip_address": "192.168.1.100",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "wifi_signal_strength": -45,
    "certificate_fingerprint": "SHA256:abc123...",
    "encryption_enabled": true,
    "registered_at": "2026-04-01T08:00:00Z",
    "last_seen": "2026-04-09T10:30:00Z",
    "current_data": {
      "temperature": 37.2,
      "humidity": 55.5,
      "air_pressure": 1013.25,
      "oxygen_level": 21.0,
      "co2_level": 0.04,
      "motion_detected": false,
      "door_status": false,
      "power_voltage": 12.0,
      "threat_level": "safe",
      "security_score": 100,
      "anomaly_detected": false,
      "timestamp": "2026-04-09T10:30:15Z"
    },
    "connected_iot_devices": [
      {
        "device_id": "iot_device_001",
        "device_type": "temperature_sensor",
        "ip_address": "192.168.1.101",
        "mac_address": "11:22:33:44:55:66",
        "status": "active",
        "traffic_blocked": false,
        "last_seen": "2026-04-09T10:30:10Z"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found`: Device not found
- `403 Forbidden`: Access denied

---

#### PUT /api/esp32/devices/{device_id}
**Purpose**: Update device configuration

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "device_name": "Updated Name",
  "location": "New Location",
  "enabled": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Device updated successfully",
  "device": { /* updated device object */ }
}
```

---

#### DELETE /api/esp32/devices/{device_id}
**Purpose**: Remove device from system

**Authentication**: Required (Super Admin or Org Admin)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Device removed successfully"
}
```

---

### 2. Real-Time Data APIs

#### GET /api/esp32/devices/{device_id}/current
**Purpose**: Get current sensor data

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "device_id": "esp32_gateway_001",
  "timestamp": "2026-04-09T10:30:15Z",
  "data": {
    "temperature": 37.2,
    "humidity": 55.5,
    "air_pressure": 1013.25,
    "oxygen_level": 21.0,
    "co2_level": 0.04,
    "motion_detected": false,
    "vibration_level": 0.1,
    "door_status": false,
    "sound_level": 45.0,
    "power_voltage": 12.0,
    "wifi_signal_strength": -45,
    "system_temperature": 35.0,
    "threat_level": "safe",
    "anomaly_detected": false,
    "security_score": 100
  }
}
```

---

#### GET /api/esp32/devices/{device_id}/history
**Purpose**: Get historical sensor data

**Authentication**: Required

**Query Parameters**:
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `metric` (optional): Specific metric (temperature, humidity, etc.)
- `interval` (optional): Data interval (1m, 5m, 15m, 1h, 1d)
- `limit` (optional, default: 100): Max records

**Response** (200 OK):
```json
{
  "success": true,
  "device_id": "esp32_gateway_001",
  "metric": "temperature",
  "interval": "5m",
  "count": 100,
  "data": [
    {
      "timestamp": "2026-04-09T10:30:00Z",
      "value": 37.2,
      "threat_level": "safe",
      "security_score": 100
    },
    {
      "timestamp": "2026-04-09T10:25:00Z",
      "value": 37.1,
      "threat_level": "safe",
      "security_score": 100
    }
  ]
}
```

---

#### WebSocket: /ws/devices/{device_id}
**Purpose**: Real-time streaming of sensor data

**Authentication**: JWT token in query parameter

**Connection**:
```javascript
const ws = new WebSocket('wss://api.safeedge.com/ws/devices/esp32_gateway_001?token=<jwt_token>');
```

**Incoming Messages**:
```json
// Initial state
{
  "type": "initial_state",
  "data": { /* current device state */ }
}

// Sensor update
{
  "type": "sensor_update",
  "device_id": "esp32_gateway_001",
  "data": { /* sensor readings */ },
  "timestamp": "2026-04-09T10:30:15Z"
}

// Alert
{
  "type": "alert",
  "alert": { /* alert details */ }
}
```

**Outgoing Messages**:
```json
// Ping
{
  "type": "ping"
}

// Subscribe to events
{
  "type": "subscribe",
  "events": ["sensor_update", "alert"]
}

// Send command
{
  "type": "command",
  "device_id": "esp32_gateway_001",
  "command": "STATUS"
}
```

---

### 3. Alert Management APIs

#### GET /api/esp32/alerts
**Purpose**: Get security alerts

**Authentication**: Required

**Query Parameters**:
- `organization_id` (optional): Filter by organization
- `device_id` (optional): Filter by device
- `severity` (optional): Filter by severity (CRITICAL, WARNING, INFO)
- `resolved` (optional): Filter by resolution status (true, false)
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "count": 15,
  "page": 1,
  "total_pages": 1,
  "alerts": [
    {
      "alert_id": "alert_12345",
      "device_id": "esp32_gateway_001",
      "device_name": "NICU Gateway #1",
      "severity": "CRITICAL",
      "alert_type": "Temperature Manipulation Attack",
      "message": "Temperature attack detected - implementing emergency cooling",
      "threat_level": "critical",
      "security_score": 25,
      "attack_source": "192.168.1.105",
      "action_taken": "automatic_block",
      "resolved": false,
      "detected_at": "2026-04-09T10:25:30Z",
      "created_at": "2026-04-09T10:25:31Z"
    }
  ]
}
```

---

#### GET /api/esp32/alerts/{alert_id}
**Purpose**: Get specific alert details

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "alert": {
    "alert_id": "alert_12345",
    "device_id": "esp32_gateway_001",
    "organization_id": "org_12345",
    "severity": "CRITICAL",
    "alert_type": "Temperature Manipulation Attack",
    "message": "Temperature attack detected",
    "threat_level": "critical",
    "security_score": 25,
    "attack_source": "192.168.1.105",
    "attack_vector": "Network manipulation",
    "affected_devices": ["iot_device_003"],
    "action_taken": "automatic_block",
    "resolved": false,
    "resolution": null,
    "resolved_by": null,
    "resolved_at": null,
    "detected_at": "2026-04-09T10:25:30Z"
  }
}
```

---

#### POST /api/esp32/alerts/{alert_id}/resolve
**Purpose**: Mark alert as resolved

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "resolution": "False positive - maintenance work in progress",
  "notes": "Verified with facility manager"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "alert": { /* updated alert object */ }
}
```

---

#### GET /api/esp32/alerts/statistics
**Purpose**: Get alert statistics

**Authentication**: Required

**Query Parameters**:
- `organization_id` (optional)
- `start_date` (optional)
- `end_date` (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "statistics": {
    "total_alerts": 150,
    "critical_alerts": 25,
    "warning_alerts": 75,
    "info_alerts": 50,
    "resolved_alerts": 140,
    "unresolved_alerts": 10,
    "average_response_time_minutes": 2.5,
    "alerts_by_type": [
      {
        "type": "Temperature Manipulation",
        "count": 45,
        "percentage": 30
      },
      {
        "type": "Unauthorized Access",
        "count": 30,
        "percentage": 20
      }
    ],
    "alerts_by_device": [
      {
        "device_id": "esp32_gateway_001",
        "device_name": "NICU Gateway #1",
        "count": 25
      }
    ],
    "alerts_timeline": [
      {
        "date": "2026-04-09",
        "count": 5
      }
    ]
  }
}
```

---

### 4. Remote Control APIs

#### POST /api/esp32/devices/{device_id}/command
**Purpose**: Send command to ESP32 device

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "command": "TEMP_ATTACK",
  "parameters": {
    "duration": 45000
  }
}
```

**Available Commands**:
- `STATUS`: Get device status
- `RESET`: Reset device
- `TEMP_ATTACK`: Simulate temperature attack
- `ACCESS_ATTACK`: Simulate access attack
- `POWER_ATTACK`: Simulate power attack
- `NETWORK_ATTACK`: Simulate network attack
- `STOP_ATTACK`: Stop attack simulation

**Response** (200 OK):
```json
{
  "success": true,
  "command_id": "cmd_12345",
  "device_id": "esp32_gateway_001",
  "command": "TEMP_ATTACK",
  "status": "queued",
  "message": "Command queued for device",
  "queued_at": "2026-04-09T10:30:00Z"
}
```

---

#### POST /api/esp32/devices/{device_id}/iot-devices/{iot_device_id}/block
**Purpose**: Block traffic from specific IoT device

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "reason": "Suspicious activity detected",
  "duration": 3600,
  "notify": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Device blocked successfully",
  "iot_device_id": "iot_device_001",
  "blocked_at": "2026-04-09T10:30:00Z",
  "expires_at": "2026-04-09T11:30:00Z"
}
```

---

#### POST /api/esp32/devices/{device_id}/iot-devices/{iot_device_id}/unblock
**Purpose**: Unblock previously blocked IoT device

**Authentication**: Required (Admin role)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Device unblocked successfully",
  "iot_device_id": "iot_device_001",
  "unblocked_at": "2026-04-09T10:35:00Z"
}
```

---

#### GET /api/esp32/devices/{device_id}/iot-devices
**Purpose**: List IoT devices connected to ESP32 gateway

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "device_id": "esp32_gateway_001",
  "count": 4,
  "devices": [
    {
      "device_id": "iot_device_001",
      "device_type": "temperature_sensor",
      "device_name": "Room Temp Sensor",
      "ip_address": "192.168.1.101",
      "mac_address": "11:22:33:44:55:66",
      "status": "active",
      "traffic_blocked": false,
      "first_seen": "2026-04-01T08:00:00Z",
      "last_seen": "2026-04-09T10:30:10Z",
      "traffic_stats": {
        "packets_in": 15000,
        "packets_out": 12000,
        "bytes_in": 1500000,
        "bytes_out": 1200000,
        "last_updated": "2026-04-09T10:30:00Z"
      }
    }
  ]
}
```

---

### 5. Certificate Management APIs

#### POST /api/esp32/certificates/generate
**Purpose**: Generate new device certificate

**Authentication**: Required (Super Admin or Org Admin)

**Request Body**:
```json
{
  "device_id": "esp32_gateway_001",
  "organization_id": "org_12345",
  "validity_days": 365
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "certificate_id": "cert_12345",
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "private_key": "-----BEGIN EC PRIVATE KEY-----\n...",
  "fingerprint": "SHA256:abc123...",
  "issued_at": "2026-04-09T10:30:00Z",
  "expires_at": "2027-04-09T10:30:00Z"
}
```

---

#### POST /api/esp32/certificates/revoke
**Purpose**: Revoke compromised certificate

**Authentication**: Required (Super Admin or Org Admin)

**Request Body**:
```json
{
  "certificate_id": "cert_12345",
  "reason": "Device compromised"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "certificate_id": "cert_12345",
  "revoked_at": "2026-04-09T10:30:00Z"
}
```

---

#### GET /api/esp32/certificates/{device_id}
**Purpose**: Get certificate information

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "certificate": {
    "certificate_id": "cert_12345",
    "device_id": "esp32_gateway_001",
    "fingerprint": "SHA256:abc123...",
    "algorithm": "ECC-secp256k1",
    "issued_at": "2026-04-01T08:00:00Z",
    "expires_at": "2027-04-01T08:00:00Z",
    "status": "active",
    "days_until_expiry": 357
  }
}
```

---

### 6. Firebase Integration APIs

#### GET /api/esp32/firebase/config
**Purpose**: Get Firebase configuration for device

**Authentication**: Internal (device provisioning)

**Response** (200 OK):
```json
{
  "success": true,
  "config": {
    "host": "safeedge-prod.firebaseio.com",
    "authToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "databaseURL": "https://safeedge-prod.firebaseio.com",
    "projectId": "safeedge-prod"
  }
}
```

---

#### POST /api/esp32/firebase/sync
**Purpose**: Manually trigger Firebase sync

**Authentication**: Required (Admin role)

**Request Body**:
```json
{
  "device_id": "esp32_gateway_001",
  "sync_type": "full"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Sync initiated",
  "sync_id": "sync_12345",
  "started_at": "2026-04-09T10:30:00Z"
}
```

---

### 7. System APIs

#### GET /api/esp32/status
**Purpose**: Get overall ESP32 system status

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "system_status": {
    "total_devices": 25,
    "online_devices": 23,
    "offline_devices": 2,
    "devices_with_alerts": 3,
    "average_signal_strength": -42,
    "total_iot_devices": 100,
    "blocked_iot_devices": 2,
    "system_health": "healthy",
    "last_update": "2026-04-09T10:30:00Z"
  }
}
```

---

#### GET /api/websocket/stats
**Purpose**: Get WebSocket connection statistics

**Authentication**: Required (Admin role)

**Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "total_connections": 45,
    "devices_monitored": 23,
    "organizations": 5,
    "active_streams": 45,
    "messages_per_second": 120
  }
}
```

---

### Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Device with ID 'esp32_gateway_999' not found",
    "details": {
      "device_id": "esp32_gateway_999"
    }
  },
  "timestamp": "2026-04-09T10:30:00Z"
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `DEVICE_OFFLINE`: Device is not connected
- `CERTIFICATE_INVALID`: Certificate validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Implementation Priority

### Phase 1: Core Integration (Week 1-2)
1. ✅ ESP32 Firebase connection (already implemented)
2. ✅ LED & Buzzer control (already implemented)
3. ✅ Attack detection logic (already implemented)
4. 🔨 Web dashboard Firebase integration
5. 🔨 Real-time data display
6. 🔨 Alert notifications

### Phase 2: Security & Certificates (Week 3-4)
1. 🔨 Certificate Authority implementation
2. 🔨 Device provisioning wizard
3. 🔨 QR code generation
4. 🔨 mTLS handshake
5. 🔨 ECDH key exchange

### Phase 3: Advanced Features (Week 5-6)
1. 🔨 IoT device monitoring
2. 🔨 Traffic blocking implementation
3. 🔨 Remote control commands
4. 🔨 Historical data analytics
5. 🔨 Attack pattern learning

### Phase 4: Testing & Optimization (Week 7-8)
1. 🔨 End-to-end testing
2. 🔨 Performance optimization
3. 🔨 Security audit
4. 🔨 Documentation
5. 🔨 Demo preparation

## Technology Stack Summary

### ESP32 Firmware
- **Language**: C++ (Arduino framework)
- **Libraries**: 
  - FirebaseESP32 (Firebase client)
  - ArduinoJson (JSON parsing)
  - mbedTLS (Cryptography)
  - WiFiClientSecure (TLS/mTLS)
  - DHT, Adafruit_ADXL345 (Sensors)

### Web Platform
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), Node.js
- **Database**: Azure SQL / SQLite
- **Real-time**: Firebase Realtime Database
- **Auth**: Firebase Authentication

### Security
- **Encryption**: AES-256-GCM, ECDH (secp256k1)
- **Certificates**: X.509, mTLS
- **Key Management**: HKDF, secure storage

### Infrastructure
- **Cloud**: Azure (SQL, Blob Storage, Functions)
- **Firebase**: Realtime Database, Authentication
- **Deployment**: Vercel (Frontend), Azure (Backend)

---

**Design Status**: ✅ Complete - Ready for implementation

**Next Steps**: 
1. Review design with team
2. Create implementation tasks
3. Begin Phase 1 development
