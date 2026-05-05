# Requirements Document: ESP32 Web Platform Integration

## 1. Overview

### 1.1 Purpose
Integrate ESP32 hardware security gateways with the SafeEdge web platform to enable secure device provisioning, real-time bidirectional communication, certificate-based authentication (mTLS), attack detection and response, and centralized dashboard monitoring for IoT security in hospital environments.

### 1.2 Scope
This feature encompasses the complete integration between ESP32 devices and the web platform, including:
- Device provisioning and certificate management
- Real-time data synchronization via Firebase
- WebSocket-based live updates
- Attack detection and automatic response
- Visual (LED) and audio (buzzer) alerts
- IoT device monitoring and traffic blocking
- Comprehensive API for device management
- Ethernet-based network connectivity

**Hardware Components:**
- ESP32 DevKit v1 microcontroller
- W5500 Ethernet module (SPI)
- 3x Status LEDs (Red, Green, Yellow) with resistors
- 1x Active buzzer for audio alerts
- LM2596 power supply (12V to 5V)

### 1.3 Target Users
- **Super Administrators**: Provision devices, manage certificates, view all organizations
- **Organization Administrators**: Provision devices for their organization, manage device settings
- **Department Administrators**: Monitor devices in their department, respond to alerts
- **Security Personnel**: Monitor threats, respond to attacks, block malicious devices
- **Facility Managers**: View device status, receive notifications

### 1.4 Success Criteria
- ESP32 devices can be provisioned in under 5 minutes
- Real-time sensor data updates with <1 second latency
- Attack detection and automatic blocking within 2 seconds
- 99.9% uptime for WebSocket connections
- Zero data loss during network interruptions
- All communications encrypted with AES-256-GCM
- Certificate-based authentication for all devices

## 2. Functional Requirements

### 2.1 Device Provisioning

#### FR-2.1.1 Device Creation
**Priority**: High  
**User Story**: As an organization administrator, I want to provision new ESP32 devices through the dashboard so that I can quickly deploy security gateways.

**Acceptance Criteria**:
- Admin can create new device with name, location, and organization
- System generates unique device ID automatically
- System creates device certificate signed by root CA
- System generates Firebase authentication token
- System creates QR code containing all configuration
- QR code can be downloaded as PNG image
- Configuration can be downloaded as JSON file
- Provisioning completes in under 10 seconds

#### FR-2.1.2 QR Code Configuration
**Priority**: High  
**User Story**: As a technician, I want to scan a QR code to configure my ESP32 device so that I don't have to manually enter credentials.

**Acceptance Criteria**:
- QR code contains device ID, certificate, private key, Firebase config, and WiFi credentials
- QR code is readable by ESP32 camera or serial input
- ESP32 can parse QR code and extract configuration
- Configuration is stored securely in SPIFFS
- Device automatically connects after scanning QR code

#### FR-2.1.3 Alternative Configuration Methods
**Priority**: Medium  
**User Story**: As a technician, I want multiple ways to configure my ESP32 device in case QR scanning is not available.

**Acceptance Criteria**:
- Configuration can be pasted via serial terminal
- Configuration can be uploaded as JSON file
- Configuration can be entered via web interface
- All methods result in identical device setup

#### FR-2.1.4 Device Registration
**Priority**: High  
**User Story**: As the system, I want to verify and register ESP32 devices when they first connect so that only authorized devices can access the platform.

**Acceptance Criteria**:
- Device sends certificate during registration
- System validates certificate signature
- System performs ECDH key exchange
- System derives shared secret for encryption
- System updates device status to "online"
- Dashboard receives real-time notification of new device

### 2.2 Real-Time Data Synchronization

#### FR-2.2.1 Firebase Integration
**Priority**: High  
**User Story**: As an ESP32 device, I want to push sensor data to Firebase so that the dashboard can display real-time information.

**Acceptance Criteria**:
- ESP32 connects to Firebase with authentication token
- Sensor data pushed every 3 seconds to `/devices/{id}/current`
- Historical data stored in `/sensorReadings/{timestamp}`
- Alerts pushed immediately to `/alerts/{timestamp}`
- Commands read from `/commands/{device_id}`
- Connection auto-reconnects on failure

#### FR-2.2.2 WebSocket Streaming
**Priority**: High  
**User Story**: As a dashboard user, I want to see live sensor data updates without refreshing the page so that I can monitor devices in real-time.

**Acceptance Criteria**:
- WebSocket connection established with JWT authentication
- Initial device state sent on connection
- Sensor updates pushed within 1 second of change
- Alerts pushed immediately when detected
- Connection auto-reconnects with exponential backoff
- Heartbeat/ping-pong keeps connection alive

#### FR-2.2.3 Data Caching
**Priority**: Medium  
**User Story**: As the system, I want to cache sensor data in the database so that historical analysis is possible even if Firebase is unavailable.

**Acceptance Criteria**:
- Sensor data synced from Firebase to Azure SQL/SQLite
- Data retained for 90 days minimum
- Sync happens every 5 minutes
- Failed syncs are retried with backoff
- Cache can be queried via API

### 2.3 Security and Encryption

#### FR-2.3.1 Certificate Management
**Priority**: High  
**User Story**: As a super administrator, I want to manage device certificates so that I can ensure secure communication and revoke compromised devices.

**Acceptance Criteria**:
- Root CA certificate generated during system setup
- Device certificates signed by root CA
- Certificates use ECC secp256k1 algorithm
- Certificates valid for 1 year
- Certificates can be renewed 30 days before expiry
- Certificates can be revoked immediately
- Revoked certificates rejected by system

#### FR-2.3.2 End-to-End Encryption
**Priority**: High  
**User Story**: As the system, I want all data encrypted in transit so that sensitive hospital data is protected from interception.

**Acceptance Criteria**:
- All ESP32 ↔ Backend communication uses AES-256-GCM
- ECDH key exchange for shared secret derivation
- Unique IV for each message (replay protection)
- Timestamp validation (5-minute window)
- Authentication tag verified on decryption
- Failed decryption logged and alerted

#### FR-2.3.3 mTLS Authentication
**Priority**: High  
**User Story**: As the system, I want mutual TLS authentication so that both client and server identities are verified.

**Acceptance Criteria**:
- Server presents certificate to ESP32
- ESP32 presents certificate to server
- Both certificates validated against CA
- Certificate fingerprint pinning enabled
- TLS 1.2 or higher required
- Weak ciphers disabled

### 2.4 Attack Detection and Response

#### FR-2.4.1 Anomaly Detection
**Priority**: High  
**User Story**: As an ESP32 device, I want to detect anomalies in system metrics so that I can identify potential attacks.

**Acceptance Criteria**:
- Temperature anomalies detected (outside 35-40°C range)
- Humidity anomalies detected (outside 40-70% range)
- Power voltage anomalies detected (outside 11-13.5V range)
- Network connectivity anomalies detected
- Security score calculated (0-100) based on multiple factors
- Threat level determined (safe/warning/critical)
- Anomaly detection runs continuously
- Results logged and reported to dashboard

#### FR-2.4.2 Automatic Attack Response
**Priority**: High  
**User Story**: As an ESP32 device, I want to automatically block attacks so that threats are neutralized immediately without human intervention.

**Acceptance Criteria**:
- Critical threats trigger automatic blocking
- Malicious device traffic dropped
- RED LED activated
- Buzzer sounds continuous beep
- Alert sent to Firebase immediately
- Dashboard notified via WebSocket
- Attack details logged

#### FR-2.4.3 Visual and Audio Alerts
**Priority**: High  
**User Story**: As facility staff, I want visual and audio alerts when attacks are detected so that I can respond quickly even without looking at the dashboard.

**Acceptance Criteria**:
- GREEN LED (GPIO 25): System safe (solid)
- YELLOW LED (GPIO 26): Warning (solid or blinking)
- RED LED (GPIO 32): Critical threat (blinking)
- ALL LEDs: Active attack (flashing together)
- Buzzer patterns:
  - Short beep (1500Hz, 100ms): Warning
  - Long beep (2000Hz, 200ms): Critical
  - Continuous alarm (2500Hz): Active attack
- LEDs and buzzer controlled by threat level
- Audio can be muted via command
- Visual indicators always active
- Non-blocking LED/buzzer control

#### FR-2.4.4 IoT Device Monitoring
**Priority**: High  
**User Story**: As an ESP32 device, I want to monitor all connected IoT devices so that I can detect and block malicious devices.

**Acceptance Criteria**:
- Discover devices via ARP scanning
- Track device IP and MAC addresses
- Monitor traffic patterns (packets, bytes)
- Detect anomalous behavior
- Block malicious devices at network level
- Report blocked devices to dashboard
- Unblock devices via dashboard command

### 2.5 Dashboard and User Interface

#### FR-2.5.1 Device Overview Dashboard
**Priority**: High  
**User Story**: As an administrator, I want to see all my ESP32 devices at a glance so that I can quickly assess system health.

**Acceptance Criteria**:
- Grid or list view of all devices
- Real-time status indicators (online/offline)
- Threat level badges (safe/warning/critical)
- Security score display
- Filter by organization, department, status
- Search by device name or ID
- Sort by various fields

#### FR-2.5.2 Device Detail View
**Priority**: High  
**User Story**: As an administrator, I want to see detailed information about a specific device so that I can monitor its performance and troubleshoot issues.

**Acceptance Criteria**:
- Real-time sensor data display
- Live charts (temperature, humidity, security score)
- LED status visualization
- Connected IoT devices list
- Alert history timeline
- Device information (IP, MAC, firmware)
- Control panel for commands

#### FR-2.5.3 Provisioning Wizard
**Priority**: High  
**User Story**: As an administrator, I want a guided wizard to provision new devices so that the process is simple and error-free.

**Acceptance Criteria**:
- Step 1: Enter device information
- Step 2: Display QR code and alternatives
- Step 3: Verify device connection
- Progress indicator shows current step
- Can go back to previous steps
- Clear error messages if provisioning fails
- Success confirmation with next steps

#### FR-2.5.4 Alert Management
**Priority**: High  
**User Story**: As a security personnel, I want to view and manage security alerts so that I can respond to threats and track incidents.

**Acceptance Criteria**:
- Live alert feed with WebSocket updates
- Alert severity badges (critical/warning/info)
- Filter by device, severity, date
- Mark alerts as resolved
- Add resolution notes
- Export alerts to CSV
- Alert statistics dashboard

#### FR-2.5.5 Real-Time Notifications
**Priority**: Medium  
**User Story**: As a dashboard user, I want browser notifications for critical alerts so that I'm immediately aware of threats even when not actively viewing the dashboard.

**Acceptance Criteria**:
- Browser notification permission requested
- Critical alerts trigger notifications
- Notification shows device name and threat
- Clicking notification opens device details
- Notifications can be enabled/disabled
- Sound can be enabled/disabled

### 2.6 Remote Control

#### FR-2.6.1 Device Commands
**Priority**: High  
**User Story**: As an administrator, I want to send commands to ESP32 devices so that I can control them remotely.

**Acceptance Criteria**:
- Commands: STATUS, RESET, TEMP_ATTACK, ACCESS_ATTACK, POWER_ATTACK, NETWORK_ATTACK, STOP_ATTACK
- Commands queued in Firebase `/commands/{device_id}`
- ESP32 polls for commands every 100ms
- Command execution confirmed to dashboard
- Command history logged
- Confirmation dialogs for critical commands

#### FR-2.6.2 IoT Device Blocking
**Priority**: High  
**User Story**: As an administrator, I want to block/unblock IoT devices from the dashboard so that I can manually control network access.

**Acceptance Criteria**:
- Block button on IoT device list
- Block reason required
- Block duration configurable (temporary/permanent)
- Unblock button for blocked devices
- Block status visible in real-time
- Block/unblock logged in audit trail

### 2.7 API and Integration

#### FR-2.7.1 RESTful API
**Priority**: High  
**User Story**: As a developer, I want a comprehensive REST API so that I can integrate ESP32 functionality into other systems.

**Acceptance Criteria**:
- 25+ endpoints for device management, alerts, commands
- JWT authentication required
- Role-based access control
- Request/response in JSON format
- Comprehensive error messages
- Rate limiting (100 requests/minute)
- API documentation (OpenAPI/Swagger)

#### FR-2.7.2 WebSocket API
**Priority**: High  
**User Story**: As a developer, I want WebSocket endpoints so that I can build real-time applications.

**Acceptance Criteria**:
- Device-specific endpoint: `/ws/devices/{id}`
- Organization-wide endpoint: `/ws/organizations/{id}`
- JWT authentication in query parameter
- Message types: sensor_update, alert, status_change, device_blocked
- Ping/pong keep-alive
- Auto-reconnect on disconnect

## 3. Non-Functional Requirements

### 3.1 Performance

#### NFR-3.1.1 Response Time
- API endpoints respond within 200ms (95th percentile)
- WebSocket messages delivered within 1 second
- Dashboard loads within 3 seconds
- QR code generation within 5 seconds

#### NFR-3.1.2 Throughput
- Support 1000+ concurrent WebSocket connections
- Handle 10,000 API requests per minute
- Process 100 sensor updates per second per device

#### NFR-3.1.3 Scalability
- Support 10,000+ ESP32 devices
- Support 100,000+ IoT devices
- Horizontal scaling for WebSocket servers
- Database partitioning for sensor history

### 3.2 Reliability

#### NFR-3.2.1 Availability
- 99.9% uptime for API and WebSocket servers
- Automatic failover for critical services
- Graceful degradation when Firebase unavailable
- Offline mode for ESP32 devices

#### NFR-3.2.2 Data Integrity
- Zero data loss during network interruptions
- Atomic database transactions
- Data validation on all inputs
- Checksums for certificate transfers

#### NFR-3.2.3 Fault Tolerance
- Auto-reconnect for WebSocket connections
- Retry logic for failed API calls
- Circuit breakers for external services
- Fallback to cached data when Firebase down

### 3.3 Security

#### NFR-3.3.1 Authentication
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry
- Multi-factor authentication for admins
- Certificate-based device authentication

#### NFR-3.3.2 Authorization
- Role-based access control (RBAC)
- Organization-level data isolation
- Department-level access restrictions
- Audit logging for all actions

#### NFR-3.3.3 Data Protection
- AES-256-GCM encryption in transit
- AES-256 encryption at rest
- TLS 1.2+ for all connections
- Secure key storage (Azure Key Vault)

### 3.4 Usability

#### NFR-3.4.1 User Interface
- Responsive design (mobile, tablet, desktop)
- Accessibility compliant (WCAG 2.1 Level AA)
- Intuitive navigation
- Consistent design language

#### NFR-3.4.2 Documentation
- User guide for provisioning devices
- API documentation with examples
- Troubleshooting guide
- Video tutorials

### 3.5 Maintainability

#### NFR-3.5.1 Code Quality
- TypeScript for frontend (type safety)
- Python type hints for backend
- Unit test coverage >80%
- Integration test coverage >60%

#### NFR-3.5.2 Monitoring
- Application performance monitoring (APM)
- Error tracking and alerting
- WebSocket connection metrics
- Device health monitoring

#### NFR-3.5.3 Logging
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Centralized log aggregation
- Log retention: 90 days

### 3.6 Compatibility

#### NFR-3.6.1 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### NFR-3.6.2 Device Support
- ESP32 DevKit v1
- ESP32-WROOM-32
- ESP32-WROVER
- Firmware: Arduino framework

#### NFR-3.6.3 Database Support
- Azure SQL Database
- SQLite (development)
- Firebase Realtime Database

## 4. Constraints

### 4.1 Technical Constraints
- ESP32 has limited memory (520 KB SRAM)
- ESP32 has limited storage (4 MB flash)
- Firebase free tier limits (100 concurrent connections)
- WebSocket connections limited by server resources

### 4.2 Business Constraints
- Must comply with HIPAA regulations
- Must comply with GDPR for EU deployments
- Budget constraints for cloud infrastructure
- Timeline: 8 weeks for MVP

### 4.3 Regulatory Constraints
- Medical device data must be encrypted
- Audit trail required for all access
- Data retention policies must be enforced
- Incident response procedures required

## 5. Assumptions and Dependencies

### 5.1 Assumptions
- Hospital WiFi networks are secure and reliable
- Administrators have basic technical knowledge
- ESP32 devices have stable power supply
- Internet connectivity is available

### 5.2 Dependencies
- Firebase Realtime Database service
- Azure cloud infrastructure
- Certificate Authority implementation
- Existing SafeEdge web platform

## 6. Acceptance Criteria

### 6.1 MVP Acceptance
- [ ] 10 ESP32 devices provisioned successfully
- [ ] Real-time sensor data visible on dashboard
- [ ] Attack detection and blocking functional
- [ ] LEDs and buzzer working correctly
- [ ] WebSocket connections stable for 24 hours
- [ ] All API endpoints functional
- [ ] Certificate management working
- [ ] Documentation complete

### 6.2 Production Acceptance
- [ ] 100+ ESP32 devices deployed
- [ ] 99.9% uptime achieved for 30 days
- [ ] Zero security incidents
- [ ] User training completed
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Load testing passed

## 7. Out of Scope

The following items are explicitly out of scope for this feature:

- Mobile app development (future phase)
- Email/SMS notifications (future phase)
- Machine learning for attack prediction (future phase)
- Integration with third-party SIEM systems (future phase)
- Custom firmware development for other microcontrollers (future phase)
- Video surveillance integration (future phase)
- Automated incident response playbooks (future phase)

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-09  
**Status**: Approved
