# SafeEdge End-to-End Encryption System

## Overview

SafeEdge implements end-to-end encryption for all ESP32 device communications using:
- **AES-256-GCM** for symmetric encryption (authenticated encryption)
- **ECDH (secp256k1)** for secure key exchange
- **HKDF** for key derivation

All data (sensor readings, alerts, threats, device status changes) is encrypted on the ESP32 before transmission to the cloud.

## Security Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│   ESP32 Device  │                    │  SafeEdge Cloud │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ Generate  │  │                    │  │ Generate  │  │
│  │ ECC Keys  │  │                    │  │ ECC Keys  │  │
│  └─────┬─────┘  │                    │  └─────┬─────┘  │
│        │        │                    │        │        │
│        ▼        │   Public Keys      │        ▼        │
│  ┌───────────┐  │◄──────────────────►│  ┌───────────┐  │
│  │   ECDH    │  │                    │  │   ECDH    │  │
│  │Key Exchange│ │                    │  │Key Exchange│ │
│  └─────┬─────┘  │                    │  └─────┬─────┘  │
│        │        │                    │        │        │
│        ▼        │                    │        ▼        │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │   HKDF    │  │  Same Shared       │  │   HKDF    │  │
│  │  Derive   │  │◄────Secret────────►│  │  Derive   │  │
│  │ AES Key   │  │                    │  │ AES Key   │  │
│  └─────┬─────┘  │                    │  └─────┬─────┘  │
│        │        │                    │        │        │
│        ▼        │                    │        ▼        │
│  ┌───────────┐  │   Encrypted Data   │  ┌───────────┐  │
│  │ AES-256   │  │──────────────────►│  │ AES-256   │  │
│  │   GCM     │  │                    │  │   GCM     │  │
│  │ Encrypt   │  │                    │  │ Decrypt   │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

## Encryption Flow

### 1. Key Exchange (One-time setup)

1. ESP32 generates ECC key pair (secp256k1 curve)
2. ESP32 fetches server's public key from `/api/esp32/crypto-config`
3. Both sides compute shared secret using ECDH
4. AES-256 key is derived from shared secret using HKDF

### 2. Data Encryption (Every message)

1. ESP32 generates random 12-byte IV
2. Data is encrypted using AES-256-GCM
3. Authentication tag is generated (16 bytes)
4. Encrypted payload is sent to `/api/esp32/secure-data`

### 3. Data Decryption (Server side)

1. Server receives encrypted payload
2. Server derives shared secret from device's public key
3. Server decrypts data using AES-256-GCM
4. Server verifies authentication tag
5. Server validates timestamp (replay protection)

## Encrypted Payload Format

```json
{
  "ciphertext": "base64_encoded_encrypted_data",
  "iv": "base64_encoded_12_byte_iv",
  "authTag": "base64_encoded_16_byte_tag",
  "devicePublicKey": "base64_encoded_device_public_key",
  "timestamp": 1234567890,
  "deviceId": "esp32_safeedge_001"
}
```

## API Endpoints

### GET /api/esp32/crypto-config
Returns server's public key and crypto parameters for ESP32 initialization.

**Response:**
```json
{
  "success": true,
  "crypto": {
    "serverPublicKey": "-----BEGIN PUBLIC KEY-----...",
    "serverPublicKeyHex": "04abc123...",
    "curve": "secp256k1",
    "aesKeyLength": 32,
    "ivLength": 12,
    "algorithm": "AES-256-GCM",
    "keyExchange": "ECDH"
  }
}
```

### POST /api/esp32/secure-data
Receives encrypted data from ESP32 devices.

**Request:** Encrypted payload (see format above)

**Response:**
```json
{
  "success": true,
  "encrypted": true,
  "decrypted": true,
  "dataType": "sensor_data",
  "deviceId": "esp32_safeedge_001",
  "processingTime": 15
}
```

## Firmware Files

### Arduino (C++)
- `safeedge_encrypted_firmware.ino` - Full Arduino implementation with mbedTLS

### MicroPython
- `safeedge_encrypted_micropython.py` - MicroPython implementation

## Security Features

1. **Authenticated Encryption (AES-GCM)**
   - Provides both confidentiality and integrity
   - Detects any tampering with encrypted data

2. **Perfect Forward Secrecy**
   - Each device generates unique key pair
   - Compromise of one device doesn't affect others

3. **Replay Protection**
   - Timestamp validation (5-minute window)
   - Per-message random IV

4. **Key Derivation (HKDF)**
   - Secure key derivation from ECDH shared secret
   - Uses SHA-256 for key expansion

## Configuration

### ESP32 Configuration
Edit the firmware file to set:
```cpp
const char* BACKEND_HOST = "your-server-ip";
const int BACKEND_PORT = 9002;
const char* DEVICE_ID = "your-device-id";
```

### Server Configuration (Optional)
Set environment variables for persistent keys:
```bash
SAFEEDGE_SERVER_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----..."
SAFEEDGE_SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

## Testing

1. Flash the encrypted firmware to ESP32
2. Start the SafeEdge backend server
3. ESP32 will automatically:
   - Fetch server's public key
   - Establish ECDH shared secret
   - Start sending encrypted data

4. Check server logs for decryption status:
```
[Secure Data] Decrypted sensor_data from device: esp32_safeedge_001
```

## Troubleshooting

### "Failed to fetch server public key"
- Check network connectivity
- Verify backend server is running
- Check firewall settings

### "Decryption failed"
- Ensure ESP32 and server are using same curve (secp256k1)
- Check timestamp synchronization
- Verify IV and auth tag are correctly transmitted

### "Invalid signature"
- Device public key may have changed
- Clear device session on server and re-register

## Author
SafeEdge Team - Imagine Cup 2026
