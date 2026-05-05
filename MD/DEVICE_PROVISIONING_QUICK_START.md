# Device Provisioning - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend Server
```bash
cd src/backend
python main.py
```

### Step 2: Open Frontend Dashboard
```bash
cd ../..
npm run dev
```
Navigate to: `http://localhost:3000`

### Step 3: Create Device
1. Click "Create Device" button
2. Fill in device information:
   - Device Name: "Temperature Sensor #1"
   - Device Type: "Temperature Sensor"
   - Location: "Ward A - Room 101"
3. Click "Next"
4. Wait for credentials to generate (2-3 seconds)
5. QR code appears!

### Step 4: Configure ESP32

#### Option A: Serial Upload (Easiest)
```cpp
#include "device_provisioning.h"

DeviceProvisioning provisioning;

void setup() {
  Serial.begin(115200);
  
  if (!provisioning.isProvisioned()) {
    Serial.println("📥 Paste configuration JSON:");
    provisioning.provisionFromSerial();
  }
  
  provisioning.loadConfig();
  provisioning.printStatus();
}
```

1. Upload firmware to ESP32
2. Open Serial Monitor
3. Copy config JSON from dashboard
4. Paste into Serial Monitor
5. Done! ✅

#### Option B: Download Config File
1. Click "Download Configuration File"
2. Save as `device_config.json`
3. Upload to ESP32 via Serial or SD card
4. ESP32 reads and stores in SPIFFS

#### Option C: QR Code (Requires Camera)
1. Scan QR code with ESP32 camera
2. ESP32 extracts config
3. Stores in SPIFFS automatically

---

## 📋 API Quick Reference

### Provision Device
```bash
curl -X POST http://localhost:8000/api/devices/provision \
  -H "Content-Type: application/json" \
  -d '{
    "device_name": "Temperature Sensor #1",
    "device_type": "temperature_sensor",
    "location": "Ward A - Room 101",
    "organization_id": "org_12345",
    "department_id": "dept_67890"
  }'
```

### Get Device Status
```bash
curl http://localhost:8000/api/devices/{device_id}/status
```

### List All Devices
```bash
curl http://localhost:8000/api/devices/list
```

### Deprovision Device
```bash
curl -X DELETE http://localhost:8000/api/devices/{device_id}
```

---

## 🧪 Test It

```bash
python test_device_provisioning.py
```

Expected output:
```
✅ Device provisioned: iot_temperature_sensor_20260410_abc123
✅ Provisioning data stored in Firebase
✅ Config retrieved successfully
✅ Status: pending
✅ All tests passed!
```

---

## 🔧 ESP32 Configuration

### Minimal Example
```cpp
#include "device_provisioning.h"

DeviceProvisioning provisioning;

void setup() {
  Serial.begin(115200);
  
  // Check if provisioned
  if (provisioning.isProvisioned()) {
    Serial.println("✅ Device already provisioned");
    provisioning.loadConfig();
  } else {
    Serial.println("❌ Device not provisioned");
    Serial.println("📥 Waiting for configuration...");
    provisioning.provisionFromSerial();
  }
  
  // Get config
  DeviceConfig config = provisioning.getConfig();
  Serial.printf("Device ID: %s\n", config.device_id.c_str());
  Serial.printf("Gateway: %s:%d\n", config.gateway_address.c_str(), config.gateway_port);
  
  // Load certificates for mTLS
  String caCert, deviceCert, deviceKey;
  if (provisioning.loadCertificates(caCert, deviceCert, deviceKey)) {
    Serial.println("✅ Certificates loaded");
    // Use for mTLS connection
  }
  
  // Load encryption key
  String encryptionKey = provisioning.loadEncryptionKey();
  Serial.printf("Encryption key: %s\n", encryptionKey.c_str());
}

void loop() {
  // Your device logic here
}
```

---

## 🔐 Security Features

✅ **Certificate-Based Authentication**
- Each device gets unique ECC certificate
- CA-signed certificates
- Certificate revocation support

✅ **Encryption**
- AES-256-GCM for data encryption
- Unique key per device
- Authenticated encryption

✅ **Zero-Trust**
- mTLS required
- Always verify, never trust
- Certificate validation on every connection

✅ **Secure Storage**
- Firebase for backend
- SPIFFS for ESP32
- No hardcoded credentials

---

## 📱 Frontend Integration

```typescript
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';

function DevicesPage() {
  const [showWizard, setShowWizard] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowWizard(true)}>
        Create Device
      </button>
      
      {showWizard && (
        <DeviceProvisioningWizard
          organizationId="org_12345"
          departmentId="dept_67890"
          onClose={() => setShowWizard(false)}
          onSuccess={(deviceId) => {
            console.log('Device created:', deviceId);
            setShowWizard(false);
            refreshDeviceList();
          }}
        />
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: "CA certificate not initialized"
```bash
# Solution: CA is auto-initialized on first run
# Just restart the backend
python src/backend/main.py
```

**Problem**: "Firebase not initialized"
```bash
# Solution: Check Firebase credentials
ls lumeshield-x-firebase-adminsdk-fbsvc-e88056ba46.json
# Should exist in project root
```

### ESP32 Issues

**Problem**: "SPIFFS initialization failed"
```cpp
// Solution: Format SPIFFS
SPIFFS.format();
SPIFFS.begin(true);  // true = format if mount fails
```

**Problem**: "Config file not found"
```cpp
// Solution: Device not provisioned yet
provisioning.provisionFromSerial();
```

**Problem**: "Failed to parse JSON"
```cpp
// Solution: Check JSON format
// Must be valid JSON, no line breaks in strings
```

### Frontend Issues

**Problem**: "Failed to provision device"
```javascript
// Solution: Check backend is running
// Check console for error details
console.log(error);
```

---

## 📊 What Gets Created

### In Firebase:
```
/devices/{device_id}/
  provisioning/    - Provisioning metadata
  info/           - Device information
  security/       - Security metadata

/certificates/issued/{serial}/
  - Certificate data

/encryption_keys/{device_id}/
  - Encryption key
```

### In ESP32 SPIFFS:
```
/config/device_config.json
/certs/ca.crt
/certs/device.crt
/certs/device.key
/keys/encryption.key
```

---

## ✅ Verification

### Check Backend
```bash
curl http://localhost:8000/api/devices/list
```

### Check Firebase
1. Open Firebase Console
2. Navigate to Realtime Database
3. Check `/devices` node
4. Check `/certificates` node
5. Check `/encryption_keys` node

### Check ESP32
```cpp
provisioning.printStatus();
```

Output:
```
📊 Device Provisioning Status
================================
Config File: ✅
CA Certificate: ✅
Device Certificate: ✅
Device Key: ✅
Encryption Key: ✅

📋 Device Configuration:
   Device ID: iot_temp_sensor_001
   Device Name: Temperature Sensor #1
   Device Type: temperature_sensor
   Gateway: 192.168.1.177:8883
   Organization: org_12345
================================
```

---

## 🎯 Common Use Cases

### Use Case 1: Provision 10 Temperature Sensors
```python
for i in range(1, 11):
    request = DeviceProvisioningRequest(
        device_name=f"Temperature Sensor #{i}",
        device_type="temperature_sensor",
        location=f"Ward A - Room {100 + i}",
        organization_id="org_hospital_001",
        department_id="dept_nicu_001"
    )
    response = await provision_device(request, ca, enc_manager)
    print(f"✅ {response.device_id}")
```

### Use Case 2: Bulk Provisioning from CSV
```python
import csv

with open('devices.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        request = DeviceProvisioningRequest(
            device_name=row['name'],
            device_type=row['type'],
            location=row['location'],
            organization_id=row['org_id'],
            department_id=row['dept_id']
        )
        response = await provision_device(request, ca, enc_manager)
        print(f"✅ {response.device_id}")
```

### Use Case 3: Factory Reset ESP32
```cpp
// Hold button for 5 seconds to factory reset
if (buttonHeldFor5Seconds()) {
  provisioning.clearProvisioning();
  Serial.println("🗑️  Factory reset complete");
  ESP.restart();
}
```

---

## 📚 Additional Resources

- **Full Documentation**: `DEVICE_PROVISIONING_COMPLETE.md`
- **Workflow Design**: `DEVICE_PROVISIONING_WORKFLOW.md`
- **Test Script**: `test_device_provisioning.py`
- **Backend API**: `src/backend/device_provisioning_api.py`
- **Frontend Wizard**: `src/components/DeviceProvisioningWizard.tsx`
- **ESP32 Module**: `esp32_secure/device_provisioning.h`

---

## 🎉 You're Ready!

1. ✅ Backend API running
2. ✅ Frontend dashboard open
3. ✅ ESP32 firmware uploaded
4. ✅ Click "Create Device"
5. ✅ Scan QR or paste config
6. ✅ Device operational!

**Total time**: ~5 minutes per device

---

**Need Help?**
- Check `DEVICE_PROVISIONING_COMPLETE.md` for detailed documentation
- Run `python test_device_provisioning.py` to verify setup
- Check Firebase Console for stored data

**Author**: SafeEdge Team - Imagine Cup 2026
