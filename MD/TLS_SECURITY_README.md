# SafeEdge ESP32 TLS/SSL Security Implementation

## Overview

This implementation provides secure TLS/SSL communication for ESP32 SafeEdge devices with:

- **TLS 1.2+** encrypted connections
- **Mutual TLS (mTLS)** - both server and device authenticate each other
- **Certificate Pinning** - prevents man-in-the-middle attacks
- **Secure Handshake Protocol** - custom protocol with anti-replay protection
- **Automatic Reconnection** - with exponential backoff

## Files

| File | Description |
|------|-------------|
| `tls_certificate_manager.py` | Certificate generation and management |
| `secure_handshake.py` | Server-side secure handshake implementation |
| `esp32_tls_firmware.py` | MicroPython firmware with TLS |
| `esp32_tls_secure.ino` | Arduino/C++ firmware with TLS |
| `setup_tls_certificates.py` | Automated setup script |

## Quick Start

### 1. Install Dependencies

```bash
pip install cryptography
```

### 2. Generate Certificates

```bash
cd Blackshield-X/esp32_secure
python setup_tls_certificates.py
```

This will create:
- Root CA certificate
- Server certificate
- Device certificates for 3 ESP32 devices
- Arduino header files (.h)
- MicroPython modules (.py)

### 3. Start the Secure Server

```bash
python secure_handshake.py server --port 8443
```

### 4. Flash ESP32

**For Arduino:**
1. Copy `certificates/devices/esp32_safeedge_001_certs.h` to your project
2. Update WiFi credentials in `esp32_tls_secure.ino`
3. Update `BACKEND_HOST` with your server IP
4. Flash to ESP32

**For MicroPython:**
1. Upload `certificates/devices/esp32_safeedge_001_certs.py` to ESP32
2. Upload `esp32_tls_firmware.py` to ESP32
3. Update configuration in the firmware
4. Run the firmware

## Security Architecture

### Certificate Chain

```
SafeEdge Root CA (4096-bit RSA, 10 years)
    │
    ├── Server Certificate (2048-bit RSA, 1 year)
    │   └── Used by backend server
    │
    └── Device Certificates (256-bit EC, 1 year)
        └── One per ESP32 device
```

### Handshake Protocol

```
ESP32 Device                          SafeEdge Server
     │                                      │
     │──────── TLS Connection ─────────────>│
     │                                      │
     │<─────── Challenge (nonce+ts) ────────│
     │                                      │
     │──────── Response (signed) ──────────>│
     │                                      │
     │<─────── Session Established ─────────│
     │                                      │
     │──────── Session Confirmed ──────────>│
     │                                      │
     │<═══════ Secure Channel ═════════════>│
```

### Security Features

1. **TLS 1.2 Minimum** - No support for older, vulnerable protocols
2. **Strong Cipher Suites** - ECDHE+AESGCM, DHE+AESGCM, CHACHA20
3. **Certificate Pinning** - SHA256 fingerprint verification
4. **Anti-Replay** - Nonce and timestamp verification
5. **Session Management** - Time-limited sessions with renewal
6. **Mutual Authentication** - Both parties verify certificates

## Certificate Management

### Generate New Device Certificate

```bash
python tls_certificate_manager.py device --device-id esp32_new_device
```

### Export for ESP32

```bash
python tls_certificate_manager.py export --device-id esp32_new_device
```

### View Certificate Info

```bash
python tls_certificate_manager.py info
```

### Regenerate All Certificates

```bash
python tls_certificate_manager.py init --force
```

## Configuration

### Server Configuration

Edit `secure_handshake.py`:

```python
BACKEND_HOST = "0.0.0.0"  # Listen on all interfaces
BACKEND_PORT = 8443       # TLS port
```

### ESP32 Configuration

Edit firmware files:

```python
# MicroPython
BACKEND_HOST = "192.168.1.100"  # Your server IP
BACKEND_PORT = 8443
DEVICE_ID = "esp32_safeedge_001"
```

```cpp
// Arduino
const char* BACKEND_HOST = "192.168.1.100";
const int BACKEND_PORT = 8443;
const char* DEVICE_ID = "esp32_safeedge_001";
```

## Troubleshooting

### Connection Refused
- Verify server is running: `python secure_handshake.py server`
- Check firewall allows port 8443
- Verify IP address is correct

### Certificate Verification Failed
- Regenerate certificates: `python setup_tls_certificates.py`
- Ensure device has correct certificate files
- Check certificate hasn't expired

### Handshake Timeout
- Check network connectivity
- Verify server is responding
- Increase timeout values if needed

### Memory Issues on ESP32
- Use EC certificates (smaller than RSA)
- Reduce buffer sizes
- Enable PSRAM if available

## Production Considerations

1. **Certificate Rotation** - Implement automatic certificate renewal
2. **Revocation** - Add CRL or OCSP support
3. **Hardware Security** - Use ESP32's secure boot and flash encryption
4. **Key Storage** - Store private keys in ESP32's eFuse or secure element
5. **Time Sync** - Use NTP for accurate timestamp verification
6. **Logging** - Log all security events for audit

## API Reference

### CertificateManager

```python
manager = CertificateManager()

# Generate CA
manager.generate_ca_certificate(force=False)

# Generate server cert
manager.generate_server_certificate(hostname, ip_addresses)

# Generate device cert
info = manager.generate_device_certificate(device_id)

# Export for ESP32
result = manager.export_for_esp32(device_id)

# Get fingerprint
fp = manager.get_certificate_fingerprint(cert)
```

### SecureHandshakeServer

```python
server = SecureHandshakeServer(host="0.0.0.0", port=8443)
server.start()
```

### SecureConnection (ESP32)

```python
conn = SecureConnection(host, port, device_id)
conn.connect()
conn.send_sensor_data(data)
conn.send_heartbeat()
conn.disconnect()
```

## License

SafeEdge Security - Imagine Cup 2026
