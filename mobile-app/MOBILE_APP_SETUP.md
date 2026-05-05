# SafeEdge Mobile App - Setup Guide

## Overview

React Native mobile app for provisioning IoT devices via Bluetooth (BLE).

## Features

✅ Scan for ESP32 Gateway via Bluetooth
✅ Connect to gateway automatically
✅ Paste device configuration JSON
✅ Send config via BLE
✅ Receive provisioning confirmation
✅ Works on iOS and Android

## Prerequisites

### Development Environment

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

3. **For iOS Development:**
   - macOS required
   - Xcode 14+
   - CocoaPods
   ```bash
   sudo gem install cocoapods
   ```

4. **For Android Development:**
   - Android Studio
   - Android SDK
   - Java JDK 11+

## Installation

### Step 1: Create React Native Project

```bash
npx react-native init SafeEdgeProvisioning --template react-native-template-typescript
cd SafeEdgeProvisioning
```

### Step 2: Install Dependencies

```bash
npm install react-native-ble-manager
npm install @react-native-clipboard/clipboard
```

### Step 3: Link Native Modules (iOS)

```bash
cd ios
pod install
cd ..
```

### Step 4: Configure Permissions

#### iOS (ios/SafeEdgeProvisioning/Info.plist)

Add these keys:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to provision IoT devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to communicate with ESP32 gateway</string>
```

#### Android (android/app/src/main/AndroidManifest.xml)

Add these permissions:

```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### Step 5: Copy App Code

Replace `App.tsx` with the provided code from `mobile-app/SafeEdgeProvisioning/App.tsx`

## Running the App

### iOS

```bash
npx react-native run-ios
```

Or open in Xcode:
```bash
open ios/SafeEdgeProvisioning.xcworkspace
```

### Android

```bash
npx react-native run-android
```

Or open in Android Studio:
```bash
android/
```

## Usage

### Step 1: Prepare Device Config

1. Open SafeEdge Dashboard (http://localhost:9002)
2. Login: admin@techcorp.com / password123
3. Click "Add Device"
4. Fill in device details
5. Click "Generate QR Code"
6. Click "Copy JSON" button

### Step 2: Open Mobile App

1. Launch SafeEdge Provisioning app on phone
2. Enable Bluetooth on phone
3. Make sure ESP32 Gateway is powered on

### Step 3: Scan and Connect

1. Tap "🔍 Scan for Devices"
2. Wait for "SafeEdge-Gateway" to appear
3. Tap on "SafeEdge-Gateway" to connect
4. Wait for "Connected" message

### Step 4: Provision Device

1. Paste the JSON config (copied from dashboard)
2. Tap "📋 Paste from Clipboard" (or paste manually)
3. Tap "🚀 Provision Device"
4. Wait for "Device provisioned successfully!"

### Step 5: Verify

1. Check ESP32 Serial Monitor:
   ```
   📥 Received provisioning data via BLE
   ✅ Device provisioned (Total: 1)
   ```

2. Check Dashboard:
   - Device should appear in device list
   - Status: "Provisioned"

## App Screenshots

### Main Screen
```
┌─────────────────────────────────┐
│ SafeEdge Provisioning           │
│ Provision IoT devices via BT    │
├─────────────────────────────────┤
│                                 │
│ 1. Scan for Gateway             │
│ ┌─────────────────────────────┐ │
│ │  🔍 Scan for Devices        │ │
│ └─────────────────────────────┘ │
│                                 │
│ Found Devices:                  │
│ ┌─────────────────────────────┐ │
│ │ SafeEdge-Gateway            │ │
│ │ XX:XX:XX:XX:XX:XX           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Connected Screen
```
┌─────────────────────────────────┐
│ Connected Device                │
│ ┌─────────────────────────────┐ │
│ │ ✅ SafeEdge-Gateway         │ │
│ │ [Disconnect]                │ │
│ └─────────────────────────────┘ │
│                                 │
│ 2. Paste Device Config          │
│ ┌─────────────────────────────┐ │
│ │ {                           │ │
│ │   "device_id": "...",       │ │
│ │   "device_name": "TEMP",    │ │
│ │   ...                       │ │
│ │ }                           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📋 Paste from Clipboard     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🚀 Provision Device         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Troubleshooting

### Bluetooth Not Working

**iOS:**
- Check Settings → Privacy → Bluetooth
- Enable Bluetooth for SafeEdge app
- Restart app

**Android:**
- Check Settings → Apps → SafeEdge → Permissions
- Enable Location and Bluetooth permissions
- Restart app

### Cannot Find ESP32 Gateway

1. Check ESP32 is powered on
2. Check ESP32 Serial Monitor shows "✅ BLE initialized"
3. Make sure phone Bluetooth is enabled
4. Try scanning again
5. Move phone closer to ESP32 (within 10 meters)

### Connection Fails

1. Disconnect and try again
2. Restart ESP32
3. Restart mobile app
4. Check ESP32 Serial Monitor for errors

### Provisioning Fails

1. Verify JSON format is correct
2. Check ESP32 Serial Monitor for error messages
3. Try disconnecting and reconnecting
4. Generate new device config from dashboard

## Development

### Project Structure

```
SafeEdgeProvisioning/
├── App.tsx                 # Main app component
├── package.json            # Dependencies
├── android/                # Android native code
├── ios/                    # iOS native code
└── node_modules/           # Installed packages
```

### Key Dependencies

- **react-native-ble-manager**: BLE communication
- **@react-native-clipboard/clipboard**: Clipboard access

### BLE Configuration

```typescript
const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const BLE_PROVISION_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const BLE_STATUS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
```

These UUIDs must match the ESP32 firmware configuration.

## Building for Production

### iOS

1. Open Xcode
2. Select "Product" → "Archive"
3. Upload to App Store Connect

### Android

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Testing

### Test with nRF Connect

Before using the mobile app, test BLE with nRF Connect:

1. Download nRF Connect app
2. Scan for "SafeEdge-Gateway"
3. Connect and explore services
4. Verify UUIDs match

### Test Provisioning Flow

1. Generate test device config
2. Copy to clipboard
3. Open mobile app
4. Scan and connect
5. Paste and provision
6. Verify in dashboard

## Future Enhancements

- [ ] QR code scanner (scan instead of paste)
- [ ] Device list management
- [ ] Provisioning history
- [ ] Multiple gateway support
- [ ] Offline mode
- [ ] Push notifications

## Support

For issues or questions:
- Check ESP32 Serial Monitor
- Check mobile app logs
- Verify Bluetooth permissions
- Test with nRF Connect first
