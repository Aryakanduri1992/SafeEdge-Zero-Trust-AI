# ESP32 Certificate-Based Security Implementation

## 🔒 Zero-Trust Security Architecture

You're absolutely right - the current implementation lacks proper security. Here's the comprehensive certificate-based authentication and encryption system for IoT devices connecting to the ESP32 gateway.

---

## 🎯 Security Requirements

### Current Issues:
- ❌ No encryption on ESP32 code
- ❌ No certificate-based authentication
- ❌ No zero-trust model
- ❌ Any device can connect to ESP32

### Required Security:
- ✅ Certificate-based authentication for each IoT device
- ✅ TLS/mTLS encryption for all communications
- ✅ Zero-trust model (verify every device)
- ✅ Device provisioning with unique certificates
- ✅ Certificate revocation capability
- ✅ Encrypted data storage

---

## 🏗️ Security Architecture

### 1. Certificate Authority (CA) System

```
Root CA (Backend)
├── ESP32 Gateway Certificate
└── IoT Device Certificates
    ├── Device 1 Certificate
    ├── Device 2 Certificate
    └── Device N Certificate
```

### 2. Authentication Flow

```
IoT Device → ESP32 Gateway
1. Device presents certificate
2. ESP32 validates certificate against CA
3. ESP32 checks certificate revocation list
4. If valid, establish TLS connection
5. All data encrypted with AES-256-GCM
```

---

## 📋 Implementation Components

### Component 1: Certificate Manager (ESP32)

**File**: `esp32_secure/CertificateManager.h`

```cpp
#ifndef CERTIFICATE_MANAGER_H
#define CERTIFICATE_MANAGER_H

#include <mbedtls/x509_crt.h>
#include <mbedtls/pk.h>
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <SPIFFS.h>

class CertificateManager {
private:
    mbedtls_x509_crt ca_cert;
    mbedtls_x509_crt device_cert;
    mbedtls_pk_context device_key;
    mbedtls_x509_crl crl;  // Certificate Revocation List
    
    String ca_cert_path = "/certs/ca.crt";
    String device_cert_path = "/certs/device.crt";
    String device_key_path = "/certs/device.key";
    String crl_path = "/certs/crl.pem";

public:
    CertificateManager();
    ~CertificateManager();
    
    // Initialize certificate system
    bool init();
    
    // Load certificates from SPIFFS
    bool loadCACertificate();
    bool loadDeviceCertificate();
    bool loadDeviceKey();
    bool loadCRL();
    
    // Validate IoT device certificate
    bool validateDeviceCertificate(const char* cert_pem);
    bool checkCertificateRevocation(const char* serial_number);
    
    // Get certificate info
    String getDeviceFingerprint();
    String getCertificateSerial();
    bool isCertificateExpired();
    
    // Certificate storage
    bool storeCertificate(const char* cert_pem, const char* path);
    bool storePrivateKey(const char* key_pem, const char* path);
};

#endif
```

---

### Component 2: TLS Connection Manager

**File**: `esp32_secure/TLSConnectionManager.h`

```cpp
#ifndef TLS_CONNECTION_MANAGER_H
#define TLS_CONNECTION_MANAGER_H

#include <mbedtls/ssl.h>
#include <mbedtls/net_sockets.h>
#include "CertificateManager.h"

#define MAX_IOT_DEVICES 50

struct IoTDevice {
    String deviceId;
    String ipAddress;
    String macAddress;
    String certificateSerial;
    bool authenticated;
    unsigned long lastSeen;
    mbedtls_ssl_context ssl;
    mbedtls_net_context net;
};

class TLSConnectionManager {
private:
    CertificateManager* certManager;
    IoTDevice devices[MAX_IOT_DEVICES];
    int deviceCount;
    
    mbedtls_ssl_config ssl_conf;
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;

public:
    TLSConnectionManager(CertificateManager* cm);
    ~TLSConnectionManager();
    
    // Initialize TLS
    bool init();
    
    // Device connection management
    bool acceptDeviceConnection(const char* ip, int port);
    bool authenticateDevice(int deviceIndex);
    bool disconnectDevice(const char* deviceId);
    
    // Secure communication
    int sendEncrypted(int deviceIndex, const uint8_t* data, size_t len);
    int receiveEncrypted(int deviceIndex, uint8_t* buffer, size_t len);
    
    // Device management
    int findDevice(const char* deviceId);
    bool isDeviceAuthenticated(const char* deviceId);
    void removeInactiveDevices(unsigned long timeout);
    
    // Get device list
    int getAuthenticatedDeviceCount();
    IoTDevice* getDevice(int index);
};

#endif
```

---

### Component 3: Encryption Manager

**File**: `esp32_secure/EncryptionManager.h`

```cpp
#ifndef ENCRYPTION_MANAGER_H
#define ENCRYPTION_MANAGER_H

#include <mbedtls/gcm.h>
#include <mbedtls/sha256.h>

#define AES_KEY_SIZE 32  // 256-bit
#define GCM_IV_SIZE 12
#define GCM_TAG_SIZE 16

class EncryptionManager {
private:
    mbedtls_gcm_context gcm_ctx;
    uint8_t aes_key[AES_KEY_SIZE];
    
    // Generate random IV
    void generateIV(uint8_t* iv, size_t len);
    
public:
    EncryptionManager();
    ~EncryptionManager();
    
    // Initialize with key
    bool init(const uint8_t* key);
    bool initWithPassword(const char* password);
    
    // Encryption/Decryption
    bool encrypt(
        const uint8_t* plaintext, size_t plaintext_len,
        uint8_t* ciphertext, size_t* ciphertext_len,
        uint8_t* iv, uint8_t* tag
    );
    
    bool decrypt(
        const uint8_t* ciphertext, size_t ciphertext_len,
        const uint8_t* iv, const uint8_t* tag,
        uint8_t* plaintext, size_t* plaintext_len
    );
    
    // Hash functions
    bool sha256(const uint8_t* data, size_t len, uint8_t* hash);
    
    // Key derivation
    bool deriveKey(const char* password, const uint8_t* salt, uint8_t* key);
};

#endif
```

---

### Component 4: Device Provisioning System

**File**: `esp32_secure/DeviceProvisioning.h`

```cpp
#ifndef DEVICE_PROVISIONING_H
#define DEVICE_PROVISIONING_H

#include "CertificateManager.h"
#include "EncryptionManager.h"

struct ProvisioningData {
    String deviceId;
    String deviceType;
    String certificate;
    String privateKey;
    String encryptionKey;
    unsigned long validUntil;
};

class DeviceProvisioning {
private:
    CertificateManager* certManager;
    EncryptionManager* encManager;
    
    // Provisioning storage
    bool storeProvisioningData(const ProvisioningData& data);
    bool loadProvisioningData(const char* deviceId, ProvisioningData& data);

public:
    DeviceProvisioning(CertificateManager* cm, EncryptionManager* em);
    
    // Provisioning workflow
    bool startProvisioningMode(unsigned long timeout);
    bool provisionDevice(const ProvisioningData& data);
    bool revokeDevice(const char* deviceId);
    
    // Certificate generation (via backend)
    bool requestCertificate(const char* deviceId, const char* csr);
    
    // Verify provisioning
    bool isDeviceProvisioned(const char* deviceId);
    int getProvisionedDeviceCount();
};

#endif
```

---

## 🔧 Enhanced ESP32 Firmware

**File**: `esp32_secure/safeedge_secure_gateway.ino`

### Key Features:

```cpp
// Security Configuration
#define ENABLE_CERTIFICATE_AUTH true
#define ENABLE_TLS_ENCRYPTION true
#define ENABLE_DATA_ENCRYPTION true
#define CERTIFICATE_VALIDATION_STRICT true

// Certificate paths in SPIFFS
#define CA_CERT_PATH "/certs/ca.crt"
#define GATEWAY_CERT_PATH "/certs/gateway.crt"
#define GATEWAY_KEY_PATH "/certs/gateway.key"
#define CRL_PATH "/certs/crl.pem"

// Global security objects
CertificateManager certManager;
TLSConnectionManager tlsManager(&certManager);
EncryptionManager encManager;
DeviceProvisioning provisioning(&certManager, &encManager);

void setup() {
    Serial.begin(115200);
    
    // Initialize SPIFFS for certificate storage
    if (!SPIFFS.begin(true)) {
        Serial.println("❌ SPIFFS initialization failed");
        return;
    }
    
    // Initialize certificate manager
    if (!certManager.init()) {
        Serial.println("❌ Certificate manager initialization failed");
        return;
    }
    
    // Load certificates
    if (!certManager.loadCACertificate()) {
        Serial.println("❌ Failed to load CA certificate");
        return;
    }
    
    if (!certManager.loadDeviceCertificate()) {
        Serial.println("❌ Failed to load gateway certificate");
        return;
    }
    
    // Initialize TLS manager
    if (!tlsManager.init()) {
        Serial.println("❌ TLS manager initialization failed");
        return;
    }
    
    // Initialize encryption
    uint8_t encryption_key[32];
    // Load or generate encryption key
    if (!encManager.init(encryption_key)) {
        Serial.println("❌ Encryption manager initialization failed");
        return;
    }
    
    Serial.println("✅ Security system initialized");
    Serial.println("🔒 Certificate-based authentication enabled");
    Serial.println("🔐 TLS encryption enabled");
}

void loop() {
    // Check for new device connections
    checkNewDeviceConnections();
    
    // Process authenticated devices
    processAuthenticatedDevices();
    
    // Remove inactive devices
    tlsManager.removeInactiveDevices(300000);  // 5 minutes timeout
    
    // Update Firebase with security status
    updateSecurityStatus();
}

void checkNewDeviceConnections() {
    // Listen for incoming TLS connections
    // Validate certificate
    // Authenticate device
    // Add to authenticated devices list
}

void processAuthenticatedDevices() {
    int deviceCount = tlsManager.getAuthenticatedDeviceCount();
    
    for (int i = 0; i < deviceCount; i++) {
        IoTDevice* device = tlsManager.getDevice(i);
        
        if (device && device->authenticated) {
            // Receive encrypted data
            uint8_t buffer[1024];
            int len = tlsManager.receiveEncrypted(i, buffer, sizeof(buffer));
            
            if (len > 0) {
                // Process device data
                processDeviceData(device, buffer, len);
            }
        }
    }
}
```

---

## 🔐 Backend Certificate Authority

**File**: `src/backend/certificate_authority.py`

```python
"""
Certificate Authority for ESP32 IoT Device Authentication
Generates and manages X.509 certificates for zero-trust security
"""

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.backends import default_backend
from datetime import datetime, timedelta
import secrets

class CertificateAuthority:
    def __init__(self):
        self.ca_private_key = None
        self.ca_certificate = None
        self.revoked_certificates = set()
    
    def generate_ca_certificate(self, organization: str, validity_days: int = 3650):
        """Generate root CA certificate"""
        # Generate CA private key
        self.ca_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096,
            backend=default_backend()
        )
        
        # Create CA certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
            x509.NameAttribute(NameOID.COMMON_NAME, f"{organization} Root CA"),
        ])
        
        self.ca_certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            self.ca_private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=validity_days)
        ).add_extension(
            x509.BasicConstraints(ca=True, path_length=0),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_cert_sign=True,
                crl_sign=True,
                key_encipherment=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
        
        return self.ca_certificate
    
    def generate_device_certificate(
        self,
        device_id: str,
        device_type: str,
        organization_id: str,
        validity_days: int = 365
    ):
        """Generate certificate for IoT device"""
        # Generate device private key (ECC for IoT efficiency)
        device_private_key = ec.generate_private_key(
            ec.SECP256R1(), default_backend()
        )
        
        # Create device certificate
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization_id),
            x509.NameAttribute(NameOID.COMMON_NAME, device_id),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, device_type),
        ])
        
        device_certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            self.ca_certificate.subject
        ).public_key(
            device_private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=validity_days)
        ).add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(f"{device_id}.iot.local"),
            ]),
            critical=False,
        ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
        
        return device_certificate, device_private_key
    
    def revoke_certificate(self, serial_number: int):
        """Revoke a device certificate"""
        self.revoked_certificates.add(serial_number)
    
    def generate_crl(self):
        """Generate Certificate Revocation List"""
        builder = x509.CertificateRevocationListBuilder()
        builder = builder.issuer_name(self.ca_certificate.subject)
        builder = builder.last_update(datetime.utcnow())
        builder = builder.next_update(datetime.utcnow() + timedelta(days=1))
        
        for serial in self.revoked_certificates:
            revoked_cert = x509.RevokedCertificateBuilder().serial_number(
                serial
            ).revocation_date(
                datetime.utcnow()
            ).build(default_backend())
            builder = builder.add_revoked_certificate(revoked_cert)
        
        crl = builder.sign(
            private_key=self.ca_private_key,
            algorithm=hashes.SHA256(),
            backend=default_backend()
        )
        
        return crl
```

---

## 📡 API Endpoints for Certificate Management

**File**: `src/backend/certificate_api.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .certificate_authority import CertificateAuthority

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

ca = CertificateAuthority()

class DeviceCertificateRequest(BaseModel):
    device_id: str
    device_type: str
    organization_id: str
    validity_days: int = 365

@router.post("/generate")
async def generate_device_certificate(request: DeviceCertificateRequest):
    """Generate certificate for new IoT device"""
    try:
        cert, key = ca.generate_device_certificate(
            request.device_id,
            request.device_type,
            request.organization_id,
            request.validity_days
        )
        
        # Serialize to PEM format
        cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode()
        key_pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        return {
            "success": True,
            "device_id": request.device_id,
            "certificate": cert_pem,
            "private_key": key_pem,
            "serial_number": str(cert.serial_number)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/revoke/{serial_number}")
async def revoke_certificate(serial_number: int):
    """Revoke a device certificate"""
    ca.revoke_certificate(serial_number)
    crl = ca.generate_crl()
    
    return {
        "success": True,
        "message": f"Certificate {serial_number} revoked",
        "crl": crl.public_bytes(serialization.Encoding.PEM).decode()
    }

@router.get("/ca")
async def get_ca_certificate():
    """Get CA certificate for distribution"""
    if not ca.ca_certificate:
        ca.generate_ca_certificate("SafeEdge")
    
    cert_pem = ca.ca_certificate.public_bytes(
        serialization.Encoding.PEM
    ).decode()
    
    return {
        "success": True,
        "certificate": cert_pem
    }
```

---

## 🔄 Device Provisioning Workflow

### Step 1: Generate Certificates (Backend)
```bash
curl -X POST http://localhost:9002/api/certificates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "temp_sensor_001",
    "device_type": "temperature_sensor",
    "organization_id": "org_12345"
  }'
```

### Step 2: Provision Device (ESP32)
```cpp
// Store certificate and key in SPIFFS
provisioning.provisionDevice({
    .deviceId = "temp_sensor_001",
    .deviceType = "temperature_sensor",
    .certificate = cert_pem,
    .privateKey = key_pem,
    .encryptionKey = aes_key,
    .validUntil = expiry_timestamp
});
```

### Step 3: Device Connects
```cpp
// Device presents certificate
// ESP32 validates against CA
// TLS connection established
// All data encrypted
```

---

## 📊 Security Monitoring

### Firebase Structure for Security Events

```json
{
  "devices": {
    "esp32_gateway_001": {
      "security": {
        "authenticatedDevices": {
          "temp_sensor_001": {
            "certificateSerial": "123456789",
            "lastAuthenticated": "2026-04-10T10:30:00Z",
            "tlsVersion": "TLS 1.3",
            "cipherSuite": "TLS_AES_256_GCM_SHA384"
          }
        },
        "rejectedConnections": {
          "0": {
            "timestamp": "2026-04-10T10:25:00Z",
            "reason": "Invalid certificate",
            "ipAddress": "192.168.1.100"
          }
        },
        "certificateRevocations": {
          "0": {
            "serialNumber": "987654321",
            "revokedAt": "2026-04-10T09:00:00Z",
            "reason": "Device compromised"
          }
        }
      }
    }
  }
}
```

---

## ✅ Implementation Checklist

- [ ] Install mbedTLS library for ESP32
- [ ] Create certificate manager class
- [ ] Create TLS connection manager
- [ ] Create encryption manager
- [ ] Implement device provisioning
- [ ] Create backend certificate authority
- [ ] Add certificate API endpoints
- [ ] Update ESP32 firmware with security
- [ ] Test certificate generation
- [ ] Test device authentication
- [ ] Test certificate revocation
- [ ] Update Firebase structure
- [ ] Add security monitoring dashboard

---

## 📚 Required Libraries

### ESP32:
```cpp
// Add to platformio.ini or Arduino IDE
mbedtls/mbedtls@^2.28.0
SPIFFS
ArduinoJson
```

### Backend:
```python
# Add to requirements.txt
cryptography>=41.0.0
pyOpenSSL>=23.0.0
```

---

## 🎯 Next Steps

1. **Implement Certificate Manager** - Create the certificate validation system
2. **Add TLS Support** - Enable encrypted connections
3. **Create Provisioning System** - Allow secure device onboarding
4. **Update Backend** - Add certificate authority endpoints
5. **Test Security** - Verify zero-trust implementation

Would you like me to implement any of these components in detail?

---

**Status**: Security Architecture Designed  
**Next**: Implementation of Certificate-Based Authentication  
**Priority**: HIGH - Security Critical
