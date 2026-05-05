# Mobile App - Quick Start Guide

## Option 1: Test with Existing App (Easiest - 5 minutes)

### Use nRF Connect App (No coding needed!)

**Download:**
- iOS: https://apps.apple.com/app/nrf-connect/id1054362403
- Android: https://play.google.com/store/apps/details?id=no.nordicsemi.android.mcp

**Steps:**
1. Install nRF Connect on your phone
2. Open the app
3. Tap "SCAN" button
4. Find "SafeEdge-Gateway" in the list
5. Tap "CONNECT"
6. Tap "Unknown Service" (4fafc201...)
7. Find characteristic ending in ...26a8
8. Tap "Upload" icon (↑)
9. Paste your device JSON
10. Tap "Send"
11. Check characteristic ending in ...26a9 for "SUCCESS"

**Done!** Device is provisioned.

---

## Option 2: Build Custom Mobile App (30-60 minutes)

### Prerequisites

**Install Node.js:**
```bash
# Check if installed
node --version

# If not installed, download from:
# https://nodejs.org/ (LTS version)
```

**Install Watchman (macOS only):**
```bash
brew install watchman
```

**For iOS (macOS only):**
```bash
# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods
```

**For Android:**
- Download Android Studio: https://developer.android.com/studio
- Install Android SDK
- Set up Android emulator or connect phone

### Step 1: Create React Native Project

```bash
# Navigate to your workspace
cd ~/Desktop  # or wherever you want

# Create new React Native project
npx react-native@latest init SafeEdgeProvisioning

# Navigate into project
cd SafeEdgeProvisioning
```

### Step 2: Install Dependencies

```bash
# Install BLE library
npm install react-native-ble-manager

# Install clipboard library
npm install @react-native-clipboard/clipboard

# For iOS, install pods
cd ios
pod install
cd ..
```

### Step 3: Copy App Code

Replace the contents of `App.tsx` with the code from `mobile-app/SafeEdgeProvisioning/App.tsx`

```bash
# Copy from your project
cp ../Blackshiled-X/mobile-app/SafeEdgeProvisioning/App.tsx ./App.tsx
```

### Step 4: Configure Permissions

**iOS (ios/SafeEdgeProvisioning/Info.plist):**

Add before `</dict>`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth to provision IoT devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>We need Bluetooth to communicate with ESP32</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**

Add after `<manifest>`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### Step 5: Run the App

**On iOS Simulator:**
```bash
npx react-native run-ios
```

**On Android Emulator:**
```bash
npx react-native run-android
```

**On Physical Device:**

iOS:
1. Connect iPhone via USB
2. Open Xcode: `open ios/SafeEdgeProvisioning.xcworkspace`
3. Select your device
4. Click Run (▶️)

Android:
1. Enable Developer Mode on phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `npx react-native run-android`

---

## Option 3: Use Web Bluetooth (Easiest for Desktop - 2 minutes)

### Requirements
- Chrome or Edge browser (NOT Safari)
- Bluetooth enabled on computer

### Steps

1. **Add to Dashboard Component:**

Create `src/components/BLEProvisioning.tsx`:

```typescript
import React, { useState } from 'react';

const BLE_SERVICE = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const BLE_PROVISION = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const BLE_STATUS = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

export const BLEProvisioning = ({ deviceConfig, onSuccess, onError }) => {
  const [status, setStatus] = useState('');

  const provision = async () => {
    try {
      setStatus('Scanning...');
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'SafeEdge-Gateway' }],
        optionalServices: [BLE_SERVICE]
      });

      setStatus('Connecting...');
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICE);
      const provisionChar = await service.getCharacteristic(BLE_PROVISION);
      const statusChar = await service.getCharacteristic(BLE_STATUS);

      setStatus('Sending config...');
      const encoder = new TextEncoder();
      await provisionChar.writeValue(encoder.encode(deviceConfig));

      setStatus('Reading status...');
      const result = await statusChar.readValue();
      const decoder = new TextDecoder();
      const statusText = decoder.decode(result);

      if (statusText === 'SUCCESS') {
        setStatus('Success!');
        onSuccess();
      } else {
        throw new Error('Failed');
      }

      device.gatt.disconnect();
    } catch (error) {
      setStatus('');
      onError(error.message);
    }
  };

  return (
    <div>
      <button onClick={provision}>
        📱 Provision via Bluetooth
      </button>
      {status && <p>{status}</p>}
    </div>
  );
};
```

2. **Use in DeviceProvisioningWizard:**

```typescript
import { BLEProvisioning } from './BLEProvisioning';

// After QR code generation:
<BLEProvisioning
  deviceConfig={deviceConfigJSON}
  onSuccess={() => alert('Provisioned!')}
  onError={(err) => alert('Error: ' + err)}
/>
```

3. **Test:**
- Open dashboard in Chrome
- Generate device config
- Click "Provision via Bluetooth"
- Select "SafeEdge-Gateway"
- Done!

---

## Comparison

| Method | Time | Difficulty | Best For |
|--------|------|------------|----------|
| **nRF Connect** | 5 min | Easy | Quick testing |
| **Web Bluetooth** | 2 min | Easy | Desktop users |
| **Custom App** | 60 min | Medium | Production |

---

## Recommended Approach

### For Demo/Testing:
**Use nRF Connect app** - It's already built and works perfectly!

### For Production:
**Use Web Bluetooth** - Add to your existing dashboard, no mobile app needed!

### For Mobile-First:
**Build Custom App** - Full control and better UX

---

## Quick Test with nRF Connect

1. **Download nRF Connect** on your phone
2. **Open app** and tap "SCAN"
3. **Find "SafeEdge-Gateway"** and tap "CONNECT"
4. **Tap the service** (4fafc201-1fb5-459e-8fcc-c5c9c331914b)
5. **Find write characteristic** (beb5483e-36e1-4688-b7f5-ea07361b26a8)
6. **Tap upload icon** (↑)
7. **Select "Text"** and paste your device JSON
8. **Tap "Send"**
9. **Read status characteristic** (beb5483e-36e1-4688-b7f5-ea07361b26a9)
10. **Should show "SUCCESS"**

**That's it!** Your device is provisioned.

---

## Troubleshooting

### "Bluetooth not available"
- Enable Bluetooth on your device
- For Web Bluetooth: Use Chrome or Edge (not Safari)

### "Cannot find SafeEdge-Gateway"
- Check ESP32 is powered on
- Check ESP32 Serial Monitor shows "✅ BLE initialized"
- Move closer to ESP32

### "Connection failed"
- Restart ESP32
- Restart app/browser
- Try again

### "Provisioning failed"
- Check JSON format is valid
- Check ESP32 Serial Monitor for errors
- Generate new config from dashboard

---

## My Recommendation

**Start with nRF Connect app!**

It's the fastest way to test BLE provisioning:
1. Takes 5 minutes to set up
2. No coding required
3. Works on iOS and Android
4. Perfect for testing

Once you confirm it works, you can:
- Add Web Bluetooth to your dashboard (for desktop users)
- Build custom mobile app (for production)

**Download nRF Connect now and try it!**
