# Web Platform to ESP32 via BLE - Complete Guide

## Overview

Your web dashboard can send device configuration directly to ESP32 via Bluetooth using **Web Bluetooth API**.

```
Dashboard (Browser) → Bluetooth → ESP32 Gateway → Provision Device
```

## How It Works

### Step 1: User Creates Device in Dashboard
```
1. User logs into dashboard (localhost:9002)
2. Clicks "Add Device"
3. Fills in device details
4. Clicks "Generate QR Code"
5. Dashboard generates JSON config
```

### Step 2: Dashboard Connects to ESP32 via Bluetooth
```
1. User clicks "Provision via Bluetooth"
2. Browser shows Bluetooth device picker
3. User selects "SafeEdge-Gateway"
4. Browser connects via Bluetooth
```

### Step 3: Dashboard Sends Config to ESP32
```
1. Dashboard sends JSON via Bluetooth
2. ESP32 receives and saves config
3. ESP32 adds device to registry
4. ESP32 sends success response
5. Dashboard shows "Device Provisioned!"
```

## Implementation

### Part 1: Add Web Bluetooth to Dashboard

Create a new component for BLE provisioning:

```typescript
// src/components/BLEProvisioning.tsx

import React, { useState } from 'react';

const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const BLE_PROVISION_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const BLE_STATUS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

interface BLEProvisioningProps {
  deviceConfig: string; // JSON string from QR code generation
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const BLEProvisioning: React.FC<BLEProvisioningProps> = ({
  deviceConfig,
  onSuccess,
  onError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('');

  const provisionViaBLE = async () => {
    try {
      setIsConnecting(true);
      setStatus('Scanning for ESP32 Gateway...');

      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth not supported in this browser');
      }

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'SafeEdge-Gateway' }],
        optionalServices: [BLE_SERVICE_UUID]
      });

      setStatus('Connecting to ESP32...');

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      setStatus('Getting service...');

      // Get service
      const service = await server.getPrimaryService(BLE_SERVICE_UUID);

      // Get characteristics
      const provisionChar = await service.getCharacteristic(BLE_PROVISION_CHAR_UUID);
      const statusChar = await service.getCharacteristic(BLE_STATUS_CHAR_UUID);

      setStatus('Sending device configuration...');

      // Convert JSON string to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(deviceConfig);

      // Send data in chunks (BLE has 512 byte limit per write)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await provisionChar.writeValue(chunk);
      }

      setStatus('Waiting for confirmation...');

      // Read status
      const statusValue = await statusChar.readValue();
      const decoder = new TextDecoder();
      const statusText = decoder.decode(statusValue);

      if (statusText === 'SUCCESS') {
        setStatus('Device provisioned successfully!');
        onSuccess();
      } else {
        throw new Error('Provisioning failed: ' + statusText);
      }

      // Disconnect
      device.gatt?.disconnect();

    } catch (error: any) {
      console.error('BLE Provisioning Error:', error);
      setStatus('');
      onError(error.message || 'Failed to provision device');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="ble-provisioning">
      <button
        onClick={provisionViaBLE}
        disabled={isConnecting}
        className="btn btn-primary"
      >
        {isConnecting ? 'Provisioning...' : '📱 Provision via Bluetooth'}
      </button>
      
      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      <div className="info-box">
        <h4>Requirements:</h4>
        <ul>
          <li>Chrome, Edge, or Opera browser</li>
          <li>Bluetooth enabled on your computer</li>
          <li>ESP32 Gateway powered on and nearby</li>
        </ul>
      </div>
    </div>
  );
};
```

### Part 2: Integrate into Device Provisioning Wizard

Update your existing `DeviceProvisioningWizard.tsx`:

```typescript
// src/components/DeviceProvisioningWizard.tsx

import { BLEProvisioning } from './BLEProvisioning';

// ... existing code ...

// After QR code generation, add BLE provisioning option
const handleProvisionComplete = () => {
  // Show success message
  toast.success('Device provisioned successfully!');
  
  // Refresh device list
  fetchDevices();
  
  // Close wizard
  onClose();
};

return (
  <div className="provisioning-wizard">
    {/* ... existing steps ... */}
    
    {step === 'qr-generated' && (
      <div className="provisioning-options">
        <h3>Provisioning Options</h3>
        
        {/* Option 1: QR Code (existing) */}
        <div className="option">
          <h4>📱 Scan QR Code</h4>
          <QRCodeSVG value={deviceConfig} size={256} />
          <button onClick={copyToClipboard}>Copy JSON</button>
        </div>

        {/* Option 2: Bluetooth (NEW) */}
        <div className="option">
          <h4>🔵 Bluetooth Provisioning</h4>
          <p>Send directly to ESP32 via Bluetooth</p>
          <BLEProvisioning
            deviceConfig={deviceConfig}
            onSuccess={handleProvisionComplete}
            onError={(error) => toast.error(error)}
          />
        </div>
      </div>
    )}
  </div>
);
```

### Part 3: ESP32 Firmware (Already Implemented!)

Your `SafeEdge_Unified.ino` already has BLE support:

```cpp
// BLE Service and Characteristics
#define BLE_SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_PROVISION_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_STATUS_CHAR_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// Receives data via BLE
class ProvisionCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    String jsonData = String(value.c_str());
    
    if (provisionDeviceViaBLE(jsonData)) {
      pStatusCharacteristic->setValue("SUCCESS");
    } else {
      pStatusCharacteristic->setValue("FAILED");
    }
  }
};
```

## User Flow

### Step-by-Step Process

1. **User Opens Dashboard**
   ```
   http://localhost:9002
   Login: admin@techcorp.com / password123
   ```

2. **User Creates New Device**
   ```
   Click: "Add Device"
   Fill in:
   - Device Name: "TEMP"
   - Device Type: "temperature_sensor"
   - Connection: "ethernet"
   Click: "Generate QR Code"
   ```

3. **Dashboard Generates Config**
   ```json
   {
     "device_id": "iot_temperature_sensor_...",
     "device_name": "TEMP",
     "device_type": "temperature_sensor",
     "certificates": {...},
     "encryption_key": "..."
   }
   ```

4. **User Clicks "Provision via Bluetooth"**
   ```
   Browser shows: "SafeEdge-Gateway wants to pair"
   User clicks: "Pair"
   ```

5. **Browser Sends Data to ESP32**
   ```
   Dashboard → Bluetooth → ESP32
   Status: "Sending device configuration..."
   Status: "Waiting for confirmation..."
   ```

6. **ESP32 Provisions Device**
   ```
   ESP32 Serial Monitor:
   📥 Received provisioning data via BLE
   📝 Provisioning: TEMP (iot_temperature_sensor_...)
   ✅ Device provisioned (Total: 1)
   ```

7. **Dashboard Shows Success**
   ```
   Status: "Device provisioned successfully!"
   Device appears in device list
   ```

## Browser Compatibility

### ✅ Supported Browsers
- **Chrome** (Desktop & Android)
- **Edge** (Desktop)
- **Opera** (Desktop & Android)
- **Samsung Internet** (Android)

### ❌ Not Supported
- Safari (iOS/macOS) - No Web Bluetooth support
- Firefox - Disabled by default

### Workaround for Safari
For Safari users, provide alternative:
1. Use Chrome/Edge instead
2. Use mobile app with native Bluetooth
3. Use Captive Portal method (WiFi)

## Advantages of BLE Provisioning

### ✅ Direct Communication
- No WiFi password needed
- No network configuration
- Direct browser → ESP32

### ✅ User Friendly
- One-click provisioning
- No manual copy/paste
- Automatic device pairing

### ✅ Secure
- Bluetooth encryption
- Short range (10 meters)
- Paired devices only

### ✅ Fast
- Instant connection
- Quick data transfer
- Immediate confirmation

## Testing

### Test in Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to Console
3. Test Web Bluetooth:

```javascript
// Test if Web Bluetooth is available
console.log('Web Bluetooth:', navigator.bluetooth ? 'Supported' : 'Not supported');

// Test scanning
navigator.bluetooth.requestDevice({
  filters: [{ name: 'SafeEdge-Gateway' }]
}).then(device => {
  console.log('Found device:', device.name);
}).catch(error => {
  console.error('Error:', error);
});
```

### Test with ESP32

1. Upload `SafeEdge_Unified.ino` to ESP32
2. Open Serial Monitor
3. Should see: "✅ BLE initialized"
4. Open dashboard in Chrome
5. Create device and click "Provision via Bluetooth"
6. Watch Serial Monitor for provisioning messages

## Complete Example

### Dashboard Component

```typescript
// Complete example with error handling
const ProvisioningPage = () => {
  const [deviceConfig, setDeviceConfig] = useState('');
  const [showBLE, setShowBLE] = useState(false);

  const generateDevice = async () => {
    // Generate device config
    const config = await api.generateDevice({
      name: 'TEMP',
      type: 'temperature_sensor'
    });
    
    setDeviceConfig(JSON.stringify(config));
    setShowBLE(true);
  };

  return (
    <div>
      <button onClick={generateDevice}>
        Create Device
      </button>

      {showBLE && (
        <BLEProvisioning
          deviceConfig={deviceConfig}
          onSuccess={() => {
            alert('Device provisioned!');
            setShowBLE(false);
          }}
          onError={(error) => {
            alert('Error: ' + error);
          }}
        />
      )}
    </div>
  );
};
```

## Summary

**Question:** How to paste data from web platform and send to ESP32?

**Answer:** Use Web Bluetooth API!

1. **Dashboard generates** device config JSON
2. **User clicks** "Provision via Bluetooth"
3. **Browser connects** to ESP32 via Bluetooth
4. **Dashboard sends** JSON data via BLE
5. **ESP32 receives** and provisions device
6. **Done!** No manual copy/paste needed

**No Captive Portal needed** - BLE is simpler and more user-friendly!
