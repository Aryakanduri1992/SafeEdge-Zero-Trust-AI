# SafeEdge Imagine Cup 2026 - Design Document

## Overview

This design document outlines the "Firebase Now, Azure Later" strategy for transforming SafeEdge into a Microsoft Imagine Cup 2026 World Championship winner. The system will be built locally using Firebase and free AI services, with Azure-compatible architecture for seamless production migration post-competition.

## Architecture

### Current Architecture (Local MVP - Competition Phase)
```
ESP32 Incubator Sensors → Firebase Realtime DB → Next.js Dashboard
         ↓                        ↓                      ↓
   AES Encryption → Firestore Collections → React Components
         ↓                        ↓                      ↓
   Multi-Sensor Data → Firebase Auth → Role-based Access
         ↓                        ↓                      ↓
   Patient Safety → Real-time Updates → Live Monitoring
```

### Local AI Pipeline (Free Tier - Competition Phase)
```
Security Event → Attack Simulation → Groq API Analysis → ElevenLabs Voice → Phone Alert
      ↓               ↓                    ↓                   ↓              ↓
ESP32 Detection → Local Blocking → Incident Report → MP3 Generation → Multi-Channel
      ↓               ↓                    ↓                   ↓              ↓
Firebase Storage → Status Tracking → AI Response → Audio Files → Android/Bluetooth/Telegram
```

### Target Architecture (Azure Production - Post-Competition)
```
ESP32 Devices → Azure IoT Hub → Azure Functions → Azure Storage → Dashboard
     ↓              ↓              ↓               ↓              ↓
X.509 Certs → MQTT Protocol → Event Processing → Blob/Table → React UI
     ↓              ↓              ↓               ↓              ↓
TinyML → Azure ML Pipeline → Azure OpenAI → Cost Optimization → Real-time Updates
```

## Components and Interfaces

### 1. Azure Migration Documentation Component
**Purpose**: Provide detailed technical plans for transitioning to Azure services
**Interfaces**:
- Input: Current Firebase architecture analysis
- Output: Azure service mapping, cost projections, migration timeline
- Dependencies: Azure pricing calculator, service documentation

### 2. Active Security Response System
**Purpose**: Detect, block attacks, and provide intelligent status-based alerts
**Interfaces**:
- Input: Security anomaly events from ESP32 devices
- Processing: Attack blocking logic, Groq API for analysis, ElevenLabs for voice synthesis
- Output: Block success/failure status, context-aware incident reports, differentiated audio alerts
- Dependencies: Firewall/blocking mechanisms, Groq API (30 req/min), ElevenLabs API (10K chars/month)

### 3. ESP32 Incubator Monitoring System
**Purpose**: Monitor critical patient safety parameters and detect security threats to hospital incubators
**Interfaces**:
- Input: Multi-sensor readings (environmental, security, power, medical equipment status)
- Processing: AES-128-CBC encryption, MQTT/HTTP protocols, threshold monitoring
- Output: Encrypted sensor data and security alerts to Firebase or Azure IoT Hub
- Dependencies: WiFi connectivity, NTP synchronization, certificate storage

**Critical Patient Safety Parameters:**

**Environmental Control:**
- Temperature: 36.5-37.5°C (DHT22/DS18B20) - GPIO 2
- Humidity: 50-60% RH (DHT22/SHT30) - GPIO 2
- Air Pressure: 1013±5 hPa (BMP280/BME280) - I2C
- Oxygen Level: 21-40% O2 (Analog sensor) - GPIO 34
- CO2 Level: <0.5% (MQ-135) - GPIO 39

**Security & Access Control:**
- Motion Detection: PIR sensor - GPIO 4
- Vibration: ADXL345 accelerometer - GPIO 5 (SDA), GPIO 18 (SCL)
- Door/Panel Status: Magnetic reed switches - GPIO 21
- Sound Level: Microphone - GPIO 36

**Power & System Health:**
- Power Supply: 12V/24V monitoring - GPIO 35
- Battery Backup: UPS status monitoring
- Network: WiFi signal strength (built-in)
- System: ESP32 internal temperature

**Medical Equipment Status:**
- Heater Status: Current sensor - GPIO 22
- Fan Operation: RPM sensor - GPIO 23
- Alarm Integration: Built-in incubator alarms
- Display Status: Screen/LED functionality

### 4. Demo Infrastructure System
**Purpose**: Create professional presentation setup for live demonstrations
**Interfaces**:
- Input: Attack simulation scripts, ESP32 sensor networks
- Processing: Visual indicators (LED alerts), audio generation, phone integration
- Output: Live attack-response demonstration, backup presentation options
- Dependencies: 3D-printed enclosures, Android device, Bluetooth speakers

### 5. Phone Alert Integration
**Purpose**: Deliver critical security alerts via multiple communication channels
**Interfaces**:
- Input: AI-generated incident reports, MP3 audio files
- Processing: Android Intent, Telegram Bot API, Web Audio API
- Output: Phone calls, voice messages, browser audio playback
- Dependencies: Android device, Telegram bot token, network connectivity

## Data Models

### Azure Storage Mapping
```typescript
// Current Firestore Collections → Azure Table Storage
interface UserEntity {
  PartitionKey: string; // organizationId
  RowKey: string;       // userId
  role: 'superadmin' | 'admin';
  email: string;
  createdAt: string;
}

interface DeviceEntity {
  PartitionKey: string; // organizationId
  RowKey: string;       // deviceId
  type: 'sensor' | 'gateway' | 'camera';
  location: string;
  status: 'online' | 'offline' | 'alerting';
}

// Current Firestore Documents → Azure Blob Storage
interface IncubatorSensorData {
  deviceId: string;
  timestamp: string;
  encryptedData: string;
  
  // Environmental Control
  temperature: number;        // °C (36.5-37.5 safe range)
  humidity: number;          // % RH (50-60 safe range)
  airPressure: number;       // hPa (1013±5 safe range)
  oxygenLevel: number;       // % O2 (21-40 safe range)
  co2Level: number;          // % CO2 (<0.5 safe range)
  
  // Security & Access Control
  motionDetected: boolean;   // PIR sensor
  vibrationLevel: number;    // g-force from ADXL345
  doorStatus: boolean;       // Reed switch (true = open)
  soundLevel: number;        // dB from microphone
  
  // Power & System Health
  powerVoltage: number;      // V (12V/24V systems)
  batteryStatus: boolean;    // UPS backup status
  wifiSignalStrength: number; // RSSI
  systemTemperature: number; // ESP32 internal temp
  
  // Medical Equipment Status
  heaterCurrent: number;     // A (heating element)
  fanRPM: number;           // RPM (circulation fans)
  alarmStatus: boolean;      // Incubator built-in alarms
  displayStatus: boolean;    // Screen/LED functionality
  
  // Security Analysis
  threatLevel: 'safe' | 'warning' | 'critical';
  anomalyDetected: boolean;
  securityScore: number;     // 0-100 safety score
}
```

### AI Pipeline Data Models
```typescript
interface SecurityIncident {
  id: string;
  deviceId: string;
  timestamp: Date;
  threatType: 'brute_force' | 'unauthorized_access' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  rawData: string;
  aiAnalysis?: IncidentAnalysis;
}

interface IncidentAnalysis {
  summary: string;
  technicalDetails: string;
  blockingAttempted: boolean;
  blockingSuccessful: boolean;
  countermeasuresApplied: string[];
  recommendedActions: string[];
  confidence: number;
  alertType: 'safe' | 'urgent' | 'critical';
  voiceScript: string;
  audioUrl?: string;
  sirenRequired: boolean;
}

interface PhoneAlert {
  incidentId: string;
  phoneNumber: string;
  alertType: 'safe' | 'urgent' | 'critical';
  method: 'android_intent' | 'bluetooth' | 'telegram' | 'web_audio';
  status: 'pending' | 'delivered' | 'failed';
  audioFile: string;
  sirenFile?: string;
  blockingStatus: 'successful' | 'failed' | 'partial';
  timestamp: Date;
}

interface DashboardMetrics {
  totalDevices: number;
  activeThreats: number;
  blockedAttacks: number;
  blockingSuccessRate: number;
  estimatedCostSavings: number;
  averageResponseTime: number;
  criticalAlerts: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

interface EmergencyProtocol {
  id: string;
  triggeredBy: string;
  incidentId: string;
  severity: 'high' | 'critical';
  actions: EmergencyAction[];
  status: 'active' | 'resolved' | 'escalated';
  affectedSystems: string[];
  isolatedNetworks: string[];
  humanResponseRequired: boolean;
  timestamp: Date;
}

interface EmergencyAction {
  type: 'network_isolation' | 'system_backup' | 'human_escalation' | 'alternative_routing';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  description: string;
  executedAt?: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Azure Migration Completeness
*For any* Firebase service currently in use, there must exist a documented Azure equivalent with migration steps and cost projections
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Active Security Response Time
*For any* security incident detected, the complete security response pipeline (detection → blocking → analysis → voice → alert) must complete within 30 seconds
**Validates: Requirements 2.4**

### Property 3: Dual-Mode Firmware Compatibility
*For any* ESP32 device configuration, the firmware must successfully connect to either Firebase or Azure backend without data loss
**Validates: Requirements 4.1, 4.3**

### Property 4: Phone Alert Redundancy
*For any* critical security incident, if the primary phone alert method fails, the system must automatically attempt backup methods until successful delivery
**Validates: Requirements 6.3, 6.4, 6.5**

### Property 5: Cost Optimization Validation
*For any* data storage operation, the Azure Blob/Table Storage approach must demonstrate measurable cost savings compared to Cosmos DB equivalent
**Validates: Requirements 7.3, 9.2, 9.3**

### Property 6: Demo Reliability
*For any* live demonstration scenario, the system must complete the full attack-to-response cycle within 3 minutes with multiple backup options available
**Validates: Requirements 3.4, 3.5**

### Property 7: Free Service Compliance
*For any* AI service usage during MVP phase, the system must operate within free tier limits (Groq: 30 req/min, ElevenLabs: 10K chars/month)
**Validates: Requirements 2.5, 7.2**

### Property 8: Submission Package Completeness
*For any* Imagine Cup submission requirement, the system must provide complete documentation proving compliance with Microsoft AI services mandate
**Validates: Requirements 8.3, 1.5**

### Property 9: Real-Time Dashboard Responsiveness
*For any* security event or attack blocking action, the dashboard must update within 2 seconds to show current system status
**Validates: Requirements 11.1, 11.2**

### Property 10: Emergency Protocol Activation
*For any* failed attack blocking scenario, the emergency response protocol must activate within 10 seconds and maintain system availability
**Validates: Requirements 12.1, 12.2, 12.3**

## Error Handling

### AI Service Failures
- **Groq API Timeout**: Fallback to cached incident templates with device-specific details
- **ElevenLabs Quota Exceeded**: Use browser-based text-to-speech as backup
- **Network Connectivity Loss**: Queue incidents for processing when connection restored

### Phone Alert Failures
- **Android Intent Permission Denied**: Automatic fallback to Bluetooth speaker
- **Bluetooth Connection Failed**: Switch to Telegram Bot voice message
- **All Methods Failed**: Log incident and display critical alert in dashboard UI

### ESP32 Communication Errors
- **Firebase Connection Lost**: Retry with exponential backoff, cache data locally
- **Azure IoT Hub Certificate Invalid**: Fallback to Firebase mode, alert admin
- **Sensor Reading Corruption**: Validate data integrity, discard invalid readings

### Demo Infrastructure Failures
- **LED Indicators Malfunction**: Use software-based visual alerts in dashboard
- **Audio System Failure**: Have pre-recorded backup audio files ready
- **Network Dependency Issues**: Prepare offline demo mode with simulated data

## Testing Strategy

### Unit Testing Approach
- **Firebase Integration**: Test current authentication, data storage, real-time updates
- **AI Pipeline Components**: Mock Groq/ElevenLabs APIs for consistent testing
- **ESP32 Firmware**: Hardware-in-the-loop testing with actual sensor readings
- **Phone Alert Methods**: Test each communication channel independently

### Property-Based Testing Framework
Using **fast-check** (JavaScript) for property-based testing with minimum 100 iterations per property:

**Property Test Examples:**
```javascript
// Property 2: AI Pipeline Response Time
fc.assert(fc.property(
  fc.record({
    deviceId: fc.string(),
    threatType: fc.constantFrom('brute_force', 'unauthorized_access'),
    severity: fc.constantFrom('low', 'medium', 'high', 'critical')
  }),
  async (incident) => {
    const startTime = Date.now();
    const result = await aiPipeline.processIncident(incident);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(30000); // 30 seconds
    expect(result.audioUrl).toBeDefined();
    expect(result.phoneAlert.status).toEqual('delivered');
  }
), { numRuns: 100 });

// Property 4: Phone Alert Redundancy
fc.assert(fc.property(
  fc.record({
    incidentId: fc.string(),
    phoneNumber: fc.string(),
    primaryMethod: fc.constantFrom('android_intent', 'bluetooth', 'telegram')
  }),
  async (alertConfig) => {
    // Simulate primary method failure
    mockPhoneService.simulateFailure(alertConfig.primaryMethod);
    
    const result = await phoneAlert.sendAlert(alertConfig);
    
    // Should succeed via backup method
    expect(result.status).toEqual('delivered');
    expect(result.method).not.toEqual(alertConfig.primaryMethod);
  }
), { numRuns: 100 });
```

### Integration Testing
- **End-to-End Demo Flow**: ESP32 → Firebase → AI Analysis → Phone Alert
- **Azure Migration Simulation**: Test abstraction layer with mock Azure services
- **Multi-Device Scenarios**: Verify system performance with multiple ESP32 nodes
- **Competition Submission Validation**: Ensure all deliverables meet Imagine Cup requirements

### Performance Testing
- **Concurrent Device Load**: Test system with 50+ ESP32 devices simultaneously
- **AI Service Rate Limits**: Verify graceful handling of API quota limits
- **Database Query Performance**: Optimize Firestore queries for real-time dashboard updates
- **Network Resilience**: Test behavior under poor connectivity conditions

The testing strategy ensures reliability during live demonstrations while validating that the system meets all Imagine Cup technical requirements and can scale to production deployment on Azure infrastructure.