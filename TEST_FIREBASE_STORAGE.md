# Test Firebase Storage for Certificates

## 🔍 Verify Certificates are Stored in Firebase Realtime Database

All certificates, encryption keys, and security data are now stored in Firebase Realtime Database (NOT Firestore).

---

## 🧪 Quick Test

### Step 1: Run Test Script

```bash
# Make sure you're in the project root
python test_certificate_firebase.py
```

**Expected Output**:
```
🔥 Firebase initialized
============================================================

📋 Certificate Authority Status:
   CA Certificate: ✅ Loaded
   Issued Certificates: 1
   Revoked Certificates: 0

🔐 Generating test certificate...
✅ Certificate generated
   Serial: 123456789
   Device ID: test_sensor_001

🔍 Checking Firebase Realtime Database...
✅ CA certificate found in Firebase
   Serial: 987654321
   Algorithm: ECC secp384r1
✅ Issued certificates found in Firebase: 1
   - test_sensor_001 (Serial: 123456789)
```

---

### Step 2: Check Firebase Console

1. Go to: https://console.firebase.google.com/project/lumeshield-x/database/lumeshield-x-default-rtdb/data

2. Navigate to the **Data** tab (not Rules)

3. You should see this structure:

```
lumeshield-x-default-rtdb
├── certificates/
│   ├── ca/
│   │   ├── certificate: "-----BEGIN CERTIFICATE-----..."
│   │   ├── private_key: "-----BEGIN PRIVATE KEY-----..."
│   │   ├── serial_number: "123456789"
│   │   ├── fingerprint: "AA:BB:CC:DD:..."
│   │   ├── created_at: "2026-04-10T..."
│   │   ├── valid_from: "2026-04-10T..."
│   │   ├── valid_until: "2036-04-10T..."
│   │   └── algorithm: "ECC secp384r1"
│   │
│   ├── issued/
│   │   └── 123456789/
│   │       ├── device_id: "test_sensor_001"
│   │       ├── device_type: "temperature_sensor"
│   │       ├── organization_id: "org_test"
│   │       ├── issued_at: "2026-04-10T..."
│   │       ├── expires_at: "2027-04-10T..."
│   │       ├── revoked: false
│   │       ├── serial_number: "123456789"
│   │       ├── fingerprint: "11:22:33:44:..."
│   │       └── algorithm: "ECC secp256r1"
│   │
│   └── revoked/
│       (empty initially)
│
├── encryption_keys/
│   └── test_sensor_001/
│       ├── key: "base64_encoded_key"
│       ├── algorithm: "AES-256-GCM"
│       └── created_at: "2026-04-10T..."
│
└── devices/
    └── esp32_gateway_001/
        (existing ESP32 data)
```

---

## 🚀 Test via API

### Step 1: Start Backend

```bash
cd src/backend
python -m uvicorn main:app --reload --port 9002
```

### Step 2: Generate Certificate via API

```bash
curl -X POST http://localhost:9002/api/certificates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "temp_sensor_002",
    "device_type": "temperature_sensor",
    "organization_id": "org_12345",
    "validity_days": 365
  }' | jq
```

### Step 3: Check Firebase Console Again

Refresh the Firebase Console and you should see:
- New entry under `/certificates/issued/` with the new serial number
- Certificate data stored

### Step 4: List All Certificates

```bash
curl http://localhost:9002/api/certificates/list | jq
```

### Step 5: Get Statistics

```bash
curl http://localhost:9002/api/certificates/statistics | jq
```

**Expected Response**:
```json
{
  "success": true,
  "total_issued": 2,
  "active_certificates": 2,
  "revoked_certificates": 0,
  "ca_valid_until": "2036-04-10T10:30:00Z"
}
```

---

## 🔍 Troubleshooting

### Issue: "No data in Firebase"

**Check**:
1. Firebase is initialized correctly
2. Service account JSON file is correct
3. Database URL is correct in `.env`

**Solution**:
```bash
# Verify Firebase connection
python test_certificate_firebase.py
```

### Issue: "Permission denied"

**Check Firebase Rules**:
```json
{
  "rules": {
    ".read": "now < 1778351400000",
    ".write": "now < 1778351400000"
  }
}
```

These rules allow read/write until May 10, 2026.

### Issue: "Data not appearing"

**Possible causes**:
1. Using wrong database (Firestore vs Realtime Database)
2. Looking at wrong project
3. Data is there but in different path

**Solution**:
1. Make sure you're looking at **Realtime Database** (not Firestore)
2. Check the correct project: `lumeshield-x`
3. Navigate to `/certificates` path

---

## 📊 Firebase Database Structure

### Certificates Path: `/certificates`

```json
{
  "certificates": {
    "ca": {
      "certificate": "-----BEGIN CERTIFICATE-----\n...",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...",
      "serial_number": "123456789",
      "fingerprint": "AA:BB:CC:DD:EE:FF:...",
      "created_at": "2026-04-10T10:30:00Z",
      "valid_from": "2026-04-10T10:30:00Z",
      "valid_until": "2036-04-10T10:30:00Z",
      "algorithm": "ECC secp384r1"
    },
    "issued": {
      "123456789": {
        "device_id": "temp_sensor_001",
        "device_type": "temperature_sensor",
        "organization_id": "org_12345",
        "issued_at": "2026-04-10T10:30:00Z",
        "expires_at": "2027-04-10T10:30:00Z",
        "revoked": false,
        "serial_number": "123456789",
        "fingerprint": "11:22:33:44:55:66:...",
        "algorithm": "ECC secp256r1"
      }
    },
    "revoked": {
      "987654321": {
        "serial_number": "987654321",
        "revoked_at": "2026-04-10T11:00:00Z",
        "reason": "Device compromised",
        "device_id": "temp_sensor_old",
        "device_type": "temperature_sensor"
      }
    }
  }
}
```

### Encryption Keys Path: `/encryption_keys`

```json
{
  "encryption_keys": {
    "temp_sensor_001": {
      "key": "base64_encoded_aes_256_key",
      "algorithm": "AES-256-GCM",
      "created_at": "2026-04-10T10:30:00Z"
    }
  }
}
```

---

## ✅ Verification Checklist

- [ ] Run `test_certificate_firebase.py` successfully
- [ ] See CA certificate in Firebase Console at `/certificates/ca`
- [ ] See issued certificates at `/certificates/issued`
- [ ] Generate certificate via API
- [ ] Verify new certificate appears in Firebase
- [ ] List certificates via API
- [ ] Check statistics via API
- [ ] Revoke a certificate
- [ ] See revoked certificate at `/certificates/revoked`

---

## 🎯 Quick Commands

```bash
# Test Firebase storage
python test_certificate_firebase.py

# Start backend
cd src/backend && python -m uvicorn main:app --reload --port 9002

# Generate certificate
curl -X POST http://localhost:9002/api/certificates/generate \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test_001","device_type":"sensor","organization_id":"org_12345"}' | jq

# List certificates
curl http://localhost:9002/api/certificates/list | jq

# Get statistics
curl http://localhost:9002/api/certificates/statistics | jq

# Get CA certificate
curl http://localhost:9002/api/certificates/ca | jq
```

---

## 📍 Firebase Console Links

- **Realtime Database**: https://console.firebase.google.com/project/lumeshield-x/database/lumeshield-x-default-rtdb/data
- **Navigate to**: `/certificates`
- **Project**: lumeshield-x
- **Region**: asia-southeast1

---

**Note**: Make sure you're looking at **Realtime Database** (not Firestore). They are different services!

- ✅ **Realtime Database**: JSON tree structure, path-based
- ❌ **Firestore**: Document/Collection structure

We're using **Realtime Database** for this project.
