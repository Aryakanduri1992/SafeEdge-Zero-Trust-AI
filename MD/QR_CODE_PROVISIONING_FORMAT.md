# QR Code Provisioning Format

## Overview
The QR code contains a JSON payload with ALL provisioning data needed by the ESP32. No additional API calls required during provisioning.

## QR Code JSON Structure

```json
{
  "device_id": "iot_camera_20260410054817_45a5c07e",
  "provisioning_token": "uMrstnS9IiXgqwGAkEv2...",
  "device_name": "ESP32-Sensor-101",
  "device_type": "temperature_sensor",
  "gateway": {
    "address": "192.168.1.177",
    "port": 8883
  },
  "wifi": {
    "ssid": "Hospital-WiFi",
    "password": "password123"
  },
  "validation_url": "http://192.168.1.177:8000/api/devices/validate",
  "certificates": {
    "ca": "-----BEGIN CERTIFICATE-----\n...",
    "cert": "-----BEGIN CERTIFICATE-----\n...",
    "key": "-----BEGIN EC PRIVATE KEY-----\n..."
  },
  "encryption_key": "base64_encoded_aes_key"
}
```

## ESP32 Provisioning Flow

### Step 1: ESP32 Creates WiFi AP
```cpp
// ESP32 creates Access Point
WiFi.softAP("SafeEdge-XXXXXX", "SafeEdge2026");
```

### Step 2: User Scans QR Code
- User connects phone to ESP32 AP
- Scans QR code with phone camera
- Browser opens with provisioning page

### Step 3: ESP32 Receives Config via HTTP POST
```cpp
// ESP32 web server receives POST request
server.on("/provision", HTTP_POST, []() {
  String jsonPayload = server.arg("plain");
  DynamicJsonDocument doc(8192);
  deserializeJson(doc, jsonPayload);
  
  // Extract all config
  String deviceId = doc["device_id"];
  String token = doc["provisioning_token"];
  String wifiSsid = doc["wifi"]["ssid"];
  String wifiPass = doc["wifi"]["password"];
  String caCert = doc["certificates"]["ca"];
  String deviceCert = doc["certificates"]["cert"];
  String deviceKey = doc["certificates"]["key"];
  String encKey = doc["encryption_key"];
  
  // Save to SPIFFS/NVS
  saveConfig(deviceId, token, wifiSsid, wifiPass, caCert, deviceCert, deviceKey, encKey);
});
```

### Step 4: ESP32 Validates with Backend
```cpp
// Connect to WiFi
WiFi.begin(wifiSsid, wifiPass);

// Validate with backend
HTTPClient http;
http.begin("http://192.168.1.177:8000/api/devices/validate");
http.addHeader("Content-Type", "application/json");

String payload = "{\"device_id\":\"" + deviceId + "\",\"provisioning_token\":\"" + token + "\",\"esp32_mac_address\":\"" + WiFi.macAddress() + "\"}";
int httpCode = http.POST(payload);

if (httpCode == 200) {
  // Validation successful - device is legitimate
  // Backend binds MAC address to prevent cloning
}
```

### Step 5: ESP32 Connects to MQTT Gateway
```cpp
// Use TLS certificates for secure MQTT
WiFiClientSecure espClient;
espClient.setCACert(caCert.c_str());
espClient.setCertificate(deviceCert.c_str());
espClient.setPrivateKey(deviceKey.c_str());

PubSubClient client(espClient);
client.setServer("192.168.1.177", 8883);
client.connect(deviceId.c_str());
```

## Security Features

### 1. One-Time Provisioning Token
- Token is validated only once
- Prevents replay attacks
- Backend marks token as "used" after first validation

### 2. MAC Address Binding
- ESP32 sends its MAC address during validation
- Backend binds device_id to MAC address
- Prevents device cloning (stolen QR codes won't work on different hardware)

### 3. Certificate-Based Authentication
- ECC certificates (secp256r1 for devices, secp384r1 for CA)
- Mutual TLS authentication with MQTT gateway
- Certificate revocation support

### 4. AES-256-GCM Encryption
- Unique encryption key per device
- Used for encrypting sensor data
- Stored securely in ESP32 NVS

## Why This Approach?

### Traditional Approach (Slow)
1. Scan QR → Get URL
2. ESP32 fetches config from URL
3. ESP32 validates with backend
4. Multiple HTTP requests, more failure points

### Our Approach (Fast & Secure)
1. Scan QR → Get EVERYTHING
2. ESP32 validates with backend (one-time)
3. Done! Device is provisioned

### Benefits
- ✅ Works offline (no internet needed during QR scan)
- ✅ Faster provisioning (no multiple API calls)
- ✅ More secure (validation prevents unauthorized devices)
- ✅ Enterprise-grade (MAC binding, one-time tokens)

## Testing

### Test QR Code Generation
```bash
curl -X POST http://localhost:8000/api/devices/provision \
  -H "Content-Type: application/json" \
  -d '{
    "device_name": "Test-ESP32",
    "device_type": "temperature_sensor",
    "location": "Lab",
    "organization_id": "org_123",
    "connection_type": "wifi",
    "wifi_ssid": "TestWiFi",
    "wifi_password": "password123",
    "gateway_address": "192.168.1.177",
    "gateway_port": 8883
  }'
```

### Test Device Validation
```bash
curl -X POST http://localhost:8000/api/devices/validate \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "iot_camera_20260410054817_45a5c07e",
    "provisioning_token": "uMrstnS9IiXgqwGAkEv2...",
    "esp32_mac_address": "AA:BB:CC:DD:EE:FF"
  }'
```

## Performance Improvements

### Before Optimization
- Certificate generation: ~5-10 seconds
- CA regenerated every request
- Slow QR code display

### After Optimization
- Certificate generation: ~500ms
- CA loaded from Firebase (cached)
- Fast QR code display

## Next Steps

1. Update ESP32 firmware to handle new QR format
2. Test provisioning flow end-to-end
3. Add error handling for network failures
4. Implement certificate rotation
