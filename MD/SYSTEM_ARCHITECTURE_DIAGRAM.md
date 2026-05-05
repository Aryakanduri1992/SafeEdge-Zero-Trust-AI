# Device Provisioning System Architecture

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAFEEDGE PLATFORM                                │
│                    Imagine Cup 2026 - World Championship                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  DeviceProvisioningWizard.tsx                                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │  │
│  │  │  Step 1:   │→ │  Step 2:   │→ │  Step 3:   │                 │  │
│  │  │  Device    │  │  Generating│  │  Complete  │                 │  │
│  │  │  Info Form │  │  Progress  │  │  QR/Config │                 │  │
│  │  └────────────┘  └────────────┘  └────────────┘                 │  │
│  │                                                                   │  │
│  │  Features:                                                        │  │
│  │  • Form validation                                                │  │
│  │  • QR code display                                                │  │
│  │  • Config download                                                │  │
│  │  • Manual config view                                             │  │
│  │  • Error handling                                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ HTTP POST /api/devices/provision
                               │ {device_name, device_type, location, ...}
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  device_provisioning_api.py (FastAPI Router)                      │  │
│  │                                                                   │  │
│  │  POST /api/devices/provision                                     │  │
│  │  ├─→ Generate Device ID                                          │  │
│  │  ├─→ Generate ECC Certificate (secp256r1)                        │  │
│  │  ├─→ Generate AES-256 Encryption Key                             │  │
│  │  ├─→ Generate QR Code                                            │  │
│  │  ├─→ Store in Firebase                                           │  │
│  │  └─→ Return credentials                                          │  │
│  │                                                                   │  │
│  │  GET /api/devices/{device_id}/config                             │  │
│  │  GET /api/devices/{device_id}/status                             │  │
│  │  DELETE /api/devices/{device_id}                                 │  │
│  │  GET /api/devices/list                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  certificate_authority.py                                         │  │
│  │  • ECC Certificate Generation (secp256r1 for devices)            │  │
│  │  • CA Certificate (secp384r1)                                    │  │
│  │  • Certificate Revocation                                        │  │
│  │  • CRL Generation                                                │  │
│  │  • Firebase Storage Integration                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  encryption_manager.py                                            │  │
│  │  • AES-256-GCM Encryption                                        │  │
│  │  • Per-Device Encryption Keys                                    │  │
│  │  • Authenticated Encryption                                      │  │
│  │  • Firebase Storage Integration                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ Store/Retrieve
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE REALTIME DATABASE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /devices/{device_id}/                                                  │
│  ├─ provisioning/                                                       │
│  │  ├─ device_id                                                        │
│  │  ├─ device_name                                                      │
│  │  ├─ device_type                                                      │
│  │  ├─ location                                                         │
│  │  ├─ organization_id                                                  │
│  │  ├─ department_id                                                    │
│  │  ├─ provisioned_at                                                   │
│  │  ├─ status                                                           │
│  │  ├─ certificate_serial                                               │
│  │  └─ encryption_key_id                                                │
│  ├─ info/                                                               │
│  │  ├─ status (online/offline/pending)                                 │
│  │  ├─ last_seen                                                        │
│  │  └─ firmware_version                                                 │
│  └─ security/                                                           │
│     ├─ certificate_expires_at                                           │
│     ├─ authentication_failures                                          │
│     └─ last_authenticated                                               │
│                                                                          │
│  /certificates/                                                         │
│  ├─ ca/                                                                 │
│  │  ├─ certificate (PEM)                                               │
│  │  ├─ private_key (PEM)                                               │
│  │  └─ metadata                                                         │
│  ├─ issued/{serial}/                                                    │
│  │  ├─ device_id                                                        │
│  │  ├─ certificate (PEM)                                               │
│  │  ├─ issued_at                                                        │
│  │  ├─ expires_at                                                       │
│  │  └─ revoked (boolean)                                                │
│  └─ revoked/{serial}/                                                   │
│     ├─ revoked_at                                                       │
│     └─ reason                                                           │
│                                                                          │
│  /encryption_keys/{device_id}/                                          │
│  ├─ key (base64)                                                        │
│  ├─ algorithm (AES-256-GCM)                                             │
│  └─ created_at                                                          │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ Config Retrieved
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                           ESP32 DEVICE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  device_provisioning.h                                            │  │
│  │                                                                   │  │
│  │  Provisioning Methods:                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │  │
│  │  │ QR Code    │  │ Serial     │  │ File       │                 │  │
│  │  │ Scan       │  │ Upload     │  │ Upload     │                 │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                 │  │
│  │        └────────────────┴────────────────┘                       │  │
│  │                         │                                         │  │
│  │                         ↓                                         │  │
│  │              provisionFromJson()                                  │  │
│  │                         │                                         │  │
│  │                         ↓                                         │  │
│  │              Store in SPIFFS:                                     │  │
│  │              • /config/device_config.json                         │  │
│  │              • /certs/ca.crt                                      │  │
│  │              • /certs/device.crt                                  │  │
│  │              • /certs/device.key                                  │  │
│  │              • /keys/encryption.key                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Device Operations:                                               │  │
│  │  • loadConfig() - Load from SPIFFS                               │  │
│  │  • loadCertificates() - Load for mTLS                            │  │
│  │  • loadEncryptionKey() - Load for data encryption                │  │
│  │  • isProvisioned() - Check status                                │  │
│  │  • clearProvisioning() - Factory reset                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ mTLS Connection
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         ESP32 GATEWAY                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  mTLS Authentication:                                             │  │
│  │  1. Validate device certificate                                   │  │
│  │  2. Check certificate not revoked (CRL)                           │  │
│  │  3. Verify certificate chain                                      │  │
│  │  4. Establish encrypted connection                                │  │
│  │  5. Device authenticated ✅                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Data Flow:                                                       │  │
│  │  Device → [Encrypt with AES-256-GCM] → Gateway                   │  │
│  │  Gateway → [Decrypt with AES-256-GCM] → Process                  │  │
│  │  Gateway → [Encrypt] → Firebase                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ Sensor Data
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIREBASE REALTIME DATABASE                            │
│                    (Sensor Data & Alerts)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: Certificate-Based Authentication
┌──────────────────────────────────────────────────────────────────────┐
│  • ECC Certificates (secp256r1 for devices, secp384r1 for CA)       │
│  • X.509 Standard Compliance                                         │
│  • Certificate Revocation Support                                    │
│  • CRL Generation                                                    │
│  • Unique Certificate Per Device                                     │
└──────────────────────────────────────────────────────────────────────┘

Layer 2: Mutual TLS (mTLS)
┌──────────────────────────────────────────────────────────────────────┐
│  • Client Certificate Required                                       │
│  • Server Certificate Validation                                     │
│  • Certificate Chain Verification                                    │
│  • Revocation Checking                                               │
│  • Encrypted Transport                                               │
└──────────────────────────────────────────────────────────────────────┘

Layer 3: Data Encryption
┌──────────────────────────────────────────────────────────────────────┐
│  • AES-256-GCM Encryption                                            │
│  • Authenticated Encryption (prevents tampering)                     │
│  • Unique Key Per Device                                             │
│  • Nonce-Based (prevents replay attacks)                             │
│  • Additional Authenticated Data (AAD) Support                       │
└──────────────────────────────────────────────────────────────────────┘

Layer 4: Zero-Trust Model
┌──────────────────────────────────────────────────────────────────────┐
│  • Never Trust, Always Verify                                        │
│  • Validate Every Connection                                         │
│  • Check Certificate on Every Request                                │
│  • No Implicit Trust (even inside network)                           │
│  • Continuous Authentication                                         │
└──────────────────────────────────────────────────────────────────────┘

Layer 5: Secure Storage
┌──────────────────────────────────────────────────────────────────────┐
│  • Firebase (Encrypted at Rest)                                      │
│  • ESP32 SPIFFS (Secure File System)                                 │
│  • No Hardcoded Credentials                                          │
│  • Key Rotation Support                                              │
│  • Secure Key Derivation (PBKDF2)                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEVICE PROVISIONING FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: User Initiates Provisioning
┌──────────┐
│  User    │ Clicks "Create Device"
│ Dashboard│
└────┬─────┘
     │
     ↓
┌──────────────────────────────────────────────────────────────────────┐
│  DeviceProvisioningWizard                                             │
│  • User fills: device_name, device_type, location                    │
│  • Validates input                                                    │
│  • Sends POST /api/devices/provision                                 │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 2: Backend Generates Credentials
┌──────────────────────────────────────────────────────────────────────┐
│  device_provisioning_api.py                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 1. Generate Device ID                                          │  │
│  │    iot_{type}_{timestamp}_{random}                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 2. Generate ECC Certificate                                    │  │
│  │    • Call certificate_authority.generate_device_certificate()  │  │
│  │    • Algorithm: ECC secp256r1                                  │  │
│  │    • Validity: 365 days                                        │  │
│  │    • Returns: (certificate, private_key)                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 3. Generate Encryption Key                                     │  │
│  │    • Call encryption_manager.add_device()                      │  │
│  │    • Algorithm: AES-256-GCM                                    │  │
│  │    • Returns: encryption_key (base64)                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 4. Generate QR Code                                            │  │
│  │    • Create config JSON                                        │  │
│  │    • Generate QR code image                                    │  │
│  │    • Convert to base64                                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 3: Store in Firebase
┌──────────────────────────────────────────────────────────────────────┐
│  Firebase Realtime Database                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ /devices/{device_id}/provisioning                              │  │
│  │ • device_id, device_name, device_type                          │  │
│  │ • location, organization_id, department_id                     │  │
│  │ • provisioned_at, status, certificate_serial                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ /certificates/issued/{serial}                                  │  │
│  │ • device_id, certificate (PEM)                                 │  │
│  │ • issued_at, expires_at, revoked                               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ /encryption_keys/{device_id}                                   │  │
│  │ • key (base64), algorithm, created_at                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 4: Return to Frontend
┌──────────────────────────────────────────────────────────────────────┐
│  Response JSON                                                        │
│  {                                                                    │
│    "success": true,                                                   │
│    "device_id": "iot_temp_sensor_001",                               │
│    "certificate": "-----BEGIN CERTIFICATE-----...",                  │
│    "private_key": "-----BEGIN PRIVATE KEY-----...",                  │
│    "encryption_key": "base64_encoded_key",                           │
│    "ca_certificate": "-----BEGIN CERTIFICATE-----...",               │
│    "qr_code": "data:image/png;base64,...",                           │
│    "config_json": { ... }                                            │
│  }                                                                    │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 5: Display to User
┌──────────────────────────────────────────────────────────────────────┐
│  DeviceProvisioningWizard - Step 3                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Device Provisioned Successfully!                            │  │
│  │                                                                │  │
│  │ Device ID: iot_temp_sensor_001                                 │  │
│  │                                                                │  │
│  │ ┌──────────────────────────────────────────────────────────┐  │  │
│  │ │         [QR CODE IMAGE]                                  │  │  │
│  │ │  Scan with ESP32 Camera                                  │  │  │
│  │ └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │ [📥 Download Configuration File]                              │  │
│  │ [📋 View Manual Configuration]                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 6: ESP32 Provisioning
┌──────────────────────────────────────────────────────────────────────┐
│  ESP32 Device                                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Option A: Scan QR Code                                         │  │
│  │ • Camera scans QR code                                         │  │
│  │ • Extract JSON config                                          │  │
│  │ • Call provisionFromJson()                                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Option B: Serial Upload                                        │  │
│  │ • User pastes JSON via Serial                                  │  │
│  │ • Call provisionFromSerial()                                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Option C: File Upload                                          │  │
│  │ • User uploads config file                                     │  │
│  │ • Read JSON from file                                          │  │
│  │ • Call provisionFromJson()                                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ↓ All options lead to:                                              │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Store in SPIFFS:                                               │  │
│  │ • /config/device_config.json                                   │  │
│  │ • /certs/ca.crt                                                │  │
│  │ • /certs/device.crt                                            │  │
│  │ • /certs/device.key                                            │  │
│  │ • /keys/encryption.key                                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
└────┬─────────────────────────────────────────────────────────────────┘
     │
     ↓

Step 7: Device Operational
┌──────────────────────────────────────────────────────────────────────┐
│  ESP32 → Gateway Connection                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ 1. Load certificates from SPIFFS                               │  │
│  │ 2. Establish mTLS connection to gateway                        │  │
│  │ 3. Gateway validates certificate                               │  │
│  │ 4. Gateway checks CRL (not revoked)                            │  │
│  │ 5. Connection established ✅                                   │  │
│  │ 6. Device sends encrypted sensor data                          │  │
│  │ 7. Gateway decrypts and processes                              │  │
│  │ 8. Data stored in Firebase                                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

✅ DEVICE OPERATIONAL
```

---

## 🎯 Component Interaction Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTERACTIONS                           │
└────────────────────────────────────────────────────────────────────┘

Frontend ←→ Backend API
├─ POST /api/devices/provision
├─ GET /api/devices/{device_id}/config
├─ GET /api/devices/{device_id}/status
├─ DELETE /api/devices/{device_id}
└─ GET /api/devices/list

Backend API ←→ Certificate Authority
├─ generate_device_certificate()
├─ revoke_certificate()
├─ generate_crl()
├─ export_ca_certificate()
└─ get_statistics()

Backend API ←→ Encryption Manager
├─ add_device()
├─ get_device_manager()
├─ remove_device()
└─ get_device_key_base64()

Backend API ←→ Firebase
├─ Store device provisioning data
├─ Store certificates
├─ Store encryption keys
├─ Retrieve device config
└─ Update device status

ESP32 ←→ SPIFFS
├─ Store device config
├─ Store certificates
├─ Store encryption keys
├─ Load config on boot
└─ Factory reset (clear all)

ESP32 ←→ Gateway
├─ mTLS connection
├─ Certificate validation
├─ Encrypted data transmission
└─ Continuous authentication

Gateway ←→ Firebase
├─ Store sensor data
├─ Store alerts
├─ Retrieve device info
└─ Update device status
```

---

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026  
**Status**: Production Ready ✅
