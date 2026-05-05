# Device Provisioning Workflow Design

## 🎯 Complete Flow: Frontend → Backend → Firebase → ESP32

---

## 📋 Workflow Overview

```
User clicks "Create Device" in Frontend
    ↓
Frontend sends device info to Backend
    ↓
Backend generates:
    - Device Certificate (ECC)
    - Private Key (ECC)
    - AES-256 Encryption Key
    - Device ID
    ↓
Backend stores in Firebase:
    - /certificates/issued/{serial}
    - /encryption_keys/{device_id}
    - /devices/{device_id}/provisioning
    ↓
Backend returns:
    - QR Code (contains all credentials)
    - Config JSON file
    - Manual configuration data
    ↓
User scans QR code with ESP32 or uploads config
    ↓
ESP32 stores credentials in SPIFFS
    ↓
ESP32 connects to gateway with mTLS
    ↓
Device authenticated and operational
```

---

## 🔧 Implementation Components

### 1. Backend API Endpoint
**File**: `src/backend/device_provisioning_api.py`

**Endpoint**: `POST /api/devices/provision`

**Request**:
```json
{
  "device_name": "Temperature Sensor #1",
  "device_type": "temperature_sensor",
  "location": "Ward A - Room 101",
  "organization_id": "org_12345",
  "department_id": "dept_67890"
}
```

**Response**:
```json
{
  "success": true,
  "device_id": "iot_temp_sensor_001",
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "encryption_key": "base64_encoded_aes_key",
  "ca_certificate": "-----BEGIN CERTIFICATE-----...",
  "qr_code": "data:image/png;base64,...",
  "config_file": {
    "device_id": "iot_temp_sensor_001",
    "certificate": "...",
    "private_key": "...",
    "encryption_key": "...",
    "ca_certificate": "...",
    "gateway_address": "192.168.1.177",
    "gateway_port": 8883
  }
}
```

### 2. Frontend Component
**File**: `src/components/DeviceProvisioningWizard.tsx`

**Features**:
- Multi-step wizard
- Device information form
- Automatic certificate generation
- QR code display
- Config file download
- Manual configuration view

### 3. Firebase Storage Structure
```
/devices/
  /{device_id}/
    /provisioning/
      - device_id
      - device_name
      - device_type
      - location
      - organization_id
      - department_id
      - provisioned_at
      - provisioned_by
      - status: "pending" | "active" | "revoked"
      - certificate_serial
      - encryption_key_id
    /info/
      - (same as ESP32 gateway structure)
    /current/
      - (sensor data)
    /security/
      - last_authenticated
      - authentication_failures
      - certificate_expires_at

/certificates/
  /issued/
    /{serial}/
      - device_id
      - certificate data
      
/encryption_keys/
  /{device_id}/
    - key
    - algorithm
```

### 4. ESP32 Configuration Methods

#### Method A: QR Code (Recommended)
- User scans QR code with ESP32
- ESP32 extracts credentials
- Stores in SPIFFS
- Connects automatically

#### Method B: Serial Upload
- User uploads config via Serial
- ESP32 receives JSON
- Stores in SPIFFS
- Connects automatically

#### Method C: Web Upload
- ESP32 creates temporary WiFi AP
- User connects and uploads config
- ESP32 stores and reboots
- Connects to gateway

---

## 📱 Frontend Implementation

### Step 1: Device Creation Form
```typescript
interface DeviceProvisioningForm {
  device_name: string;
  device_type: 'temperature_sensor' | 'door_lock' | 'camera' | 'medical_device';
  location: string;
  organization_id: string;
  department_id?: string;
}
```

### Step 2: API Call
```typescript
const provisionDevice = async (formData: DeviceProvisioningForm) => {
  const response = await fetch('/api/devices/provision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const data = await response.json();
  return data;
};
```

### Step 3: Display Results
- Show QR code
- Provide download button for config file
- Show manual configuration option
- Display device ID and credentials

---

## 🔐 ESP32 Implementation

### Configuration Storage (SPIFFS)
```
/spiffs/
  /config/
    device_config.json
  /certs/
    ca.crt
    device.crt
    device.key
  /keys/
    encryption.key
```

### Device Config JSON
```json
{
  "device_id": "iot_temp_sensor_001",
  "device_name": "Temperature Sensor #1",
  "device_type": "temperature_sensor",
  "gateway": {
    "address": "192.168.1.177",
    "port": 8883,
    "protocol": "mqtts"
  },
  "certificates": {
    "ca_path": "/certs/ca.crt",
    "cert_path": "/certs/device.crt",
    "key_path": "/certs/device.key"
  },
  "encryption": {
    "key_path": "/keys/encryption.key",
    "algorithm": "AES-256-GCM"
  }
}
```

### ESP32 Provisioning Code
```cpp
// Load configuration from SPIFFS
bool loadDeviceConfig() {
  File configFile = SPIFFS.open("/config/device_config.json", "r");
  if (!configFile) {
    Serial.println("❌ Config file not found");
    return false;
  }
  
  StaticJsonDocument<2048> doc;
  DeserializationError error = deserializeJson(doc, configFile);
  configFile.close();
  
  if (error) {
    Serial.println("❌ Failed to parse config");
    return false;
  }
  
  // Extract configuration
  String deviceId = doc["device_id"];
  String gatewayAddress = doc["gateway"]["address"];
  int gatewayPort = doc["gateway"]["port"];
  
  Serial.println("✅ Configuration loaded");
  return true;
}

// Connect to gateway with mTLS
bool connectToGateway() {
  // Load certificates
  if (!loadCertificates()) {
    return false;
  }
  
  // Establish mTLS connection
  WiFiClientSecure client;
  client.setCACert(ca_cert);
  client.setCertificate(device_cert);
  client.setPrivateKey(device_key);
  
  if (client.connect(gateway_address, gateway_port)) {
    Serial.println("✅ Connected to gateway with mTLS");
    return true;
  }
  
  Serial.println("❌ Failed to connect to gateway");
  return false;
}
```

---

## 🎨 UI/UX Flow

### Frontend Wizard Steps:

**Step 1: Device Information**
```
┌─────────────────────────────────────┐
│  Create New IoT Device              │
├─────────────────────────────────────┤
│                                     │
│  Device Name: [________________]    │
│  Device Type: [▼ Temperature Sensor]│
│  Location:    [________________]    │
│  Department:  [▼ NICU             ] │
│                                     │
│  [Cancel]              [Next →]     │
└─────────────────────────────────────┘
```

**Step 2: Generating Credentials**
```
┌─────────────────────────────────────┐
│  Generating Security Credentials    │
├─────────────────────────────────────┤
│                                     │
│  ✅ Generating certificate...       │
│  ✅ Generating encryption key...    │
│  ✅ Storing in database...          │
│  ✅ Creating QR code...             │
│                                     │
│  [Please wait...]                   │
└─────────────────────────────────────┘
```

**Step 3: Configuration Options**
```
┌─────────────────────────────────────┐
│  Device Provisioning Complete       │
├─────────────────────────────────────┤
│                                     │
│  Device ID: iot_temp_sensor_001     │
│                                     │
│  Choose provisioning method:        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [QR Code Icon]          │   │
│  │  Scan with ESP32 Camera     │   │
│  │  (Recommended)              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [📥 Download Config File]          │
│  [📋 View Manual Configuration]     │
│                                     │
│  [Done]                             │
└─────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│  Dashboard   │
└──────┬───────┘
       │ POST /api/devices/provision
       │ {device_name, device_type, ...}
       ↓
┌──────────────┐
│   Backend    │
│     API      │
└──────┬───────┘
       │
       ├─→ Generate Certificate (ECC)
       ├─→ Generate Private Key (ECC)
       ├─→ Generate Encryption Key (AES-256)
       ├─→ Generate Device ID
       │
       ↓
┌──────────────┐
│   Firebase   │
│   Database   │
└──────┬───────┘
       │
       ├─→ /certificates/issued/{serial}
       ├─→ /encryption_keys/{device_id}
       ├─→ /devices/{device_id}/provisioning
       │
       ↓
┌──────────────┐
│   Backend    │
│   Response   │
└──────┬───────┘
       │
       ├─→ Generate QR Code
       ├─→ Create Config JSON
       ├─→ Return to Frontend
       │
       ↓
┌──────────────┐
│   Frontend   │
│   Display    │
└──────┬───────┘
       │
       ├─→ Show QR Code
       ├─→ Download Config
       ├─→ Manual Config
       │
       ↓
┌──────────────┐
│    ESP32     │
│    Device    │
└──────┬───────┘
       │
       ├─→ Scan QR / Load Config
       ├─→ Store in SPIFFS
       ├─→ Connect to Gateway
       │
       ↓
┌──────────────┐
│   ESP32      │
│   Gateway    │
└──────┬───────┘
       │
       ├─→ Validate Certificate
       ├─→ Check CRL
       ├─→ Establish mTLS
       │
       ↓
┌──────────────┐
│   Device     │
│  Operational │
└──────────────┘
```

---

## 📊 Firebase Data After Provisioning

```json
{
  "devices": {
    "iot_temp_sensor_001": {
      "provisioning": {
        "device_id": "iot_temp_sensor_001",
        "device_name": "Temperature Sensor #1",
        "device_type": "temperature_sensor",
        "location": "Ward A - Room 101",
        "organization_id": "org_12345",
        "department_id": "dept_67890",
        "provisioned_at": "2026-04-10T10:30:00Z",
        "provisioned_by": "admin_user_123",
        "status": "pending",
        "certificate_serial": "123456789",
        "encryption_key_id": "iot_temp_sensor_001"
      },
      "info": {
        "status": "offline",
        "last_seen": null,
        "firmware_version": null
      },
      "security": {
        "certificate_expires_at": "2027-04-10T10:30:00Z",
        "authentication_failures": 0
      }
    }
  },
  "certificates": {
    "issued": {
      "123456789": {
        "device_id": "iot_temp_sensor_001",
        "device_type": "temperature_sensor",
        "organization_id": "org_12345",
        "issued_at": "2026-04-10T10:30:00Z",
        "expires_at": "2027-04-10T10:30:00Z",
        "revoked": false,
        "serial_number": "123456789",
        "fingerprint": "AA:BB:CC:DD:...",
        "algorithm": "ECC secp256r1"
      }
    }
  },
  "encryption_keys": {
    "iot_temp_sensor_001": {
      "key": "base64_encoded_aes_256_key",
      "algorithm": "AES-256-GCM",
      "created_at": "2026-04-10T10:30:00Z"
    }
  }
}
```

---

## ✅ Implementation Checklist

### Backend:
- [ ] Create device provisioning API endpoint
- [ ] Integrate certificate generation
- [ ] Integrate encryption key generation
- [ ] Generate QR codes
- [ ] Create config JSON
- [ ] Store in Firebase
- [ ] Return provisioning data

### Frontend:
- [ ] Create device provisioning wizard
- [ ] Device information form
- [ ] API integration
- [ ] QR code display
- [ ] Config file download
- [ ] Manual configuration view
- [ ] Success confirmation

### ESP32:
- [ ] QR code scanner (optional)
- [ ] Serial config receiver
- [ ] SPIFFS storage
- [ ] Certificate loader
- [ ] mTLS connection
- [ ] Gateway authentication

---

## 🎯 Next Steps

1. **Implement Backend API** - Device provisioning endpoint
2. **Create Frontend Wizard** - Multi-step device creation
3. **Update ESP32 Firmware** - Configuration loader
4. **Test End-to-End** - Complete provisioning flow

Would you like me to implement any of these components?
