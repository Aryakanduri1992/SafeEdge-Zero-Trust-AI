/**
 * SafeEdge Mobile Provisioning App
 * React Native app for provisioning devices via BLE
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

// BLE Configuration
const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const BLE_PROVISION_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const BLE_STATUS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [deviceConfig, setDeviceConfig] = useState('');
  const [status, setStatus] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    // Initialize BLE
    BleManager.start({ showAlert: false });

    // Request permissions for Android
    if (Platform.OS === 'android') {
      requestBluetoothPermissions();
    }

    // Setup listeners
    const stopScanListener = bleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('Scan stopped');
      }
    );

    const discoverListener = bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      (device) => {
        if (device.name === 'SafeEdge-Gateway') {
          setDevices((prevDevices) => {
            const exists = prevDevices.find((d) => d.id === device.id);
            if (!exists) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      }
    );

    return () => {
      stopScanListener.remove();
      discoverListener.remove();
    };
  }, []);

  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
      );
    } else if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === 'granted';
    }
    return true;
  };

  const scanForDevices = async () => {
    setDevices([]);
    setIsScanning(true);
    setStatus('Scanning for ESP32 Gateway...');

    try {
      await BleManager.scan([], 10, true);
    } catch (error) {
      console.error('Scan error:', error);
      setStatus('Scan failed');
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: any) => {
    try {
      setStatus(`Connecting to ${device.name}...`);
      
      await BleManager.connect(device.id);
      setConnectedDevice(device);
      setStatus(`Connected to ${device.name}`);
      
      // Retrieve services
      await BleManager.retrieveServices(device.id);
      
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('Connection failed');
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await BleManager.disconnect(connectedDevice.id);
        setConnectedDevice(null);
        setStatus('Disconnected');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  const provisionDevice = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    if (!deviceConfig.trim()) {
      Alert.alert('Error', 'Please paste device configuration JSON');
      return;
    }

    try {
      // Validate JSON
      JSON.parse(deviceConfig);
    } catch (error) {
      Alert.alert('Error', 'Invalid JSON format');
      return;
    }

    setIsProvisioning(true);
    setStatus('Provisioning device...');

    try {
      // Convert string to bytes
      const data = stringToBytes(deviceConfig);

      // Write data to provision characteristic
      await BleManager.write(
        connectedDevice.id,
        BLE_SERVICE_UUID,
        BLE_PROVISION_CHAR_UUID,
        data
      );

      setStatus('Waiting for confirmation...');

      // Wait a bit for ESP32 to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Read status characteristic
      const statusData = await BleManager.read(
        connectedDevice.id,
        BLE_SERVICE_UUID,
        BLE_STATUS_CHAR_UUID
      );

      const statusText = bytesToString(statusData);

      if (statusText === 'SUCCESS') {
        setStatus('Device provisioned successfully!');
        Alert.alert('Success', 'Device has been provisioned successfully!');
        setDeviceConfig('');
      } else {
        throw new Error('Provisioning failed: ' + statusText);
      }
    } catch (error: any) {
      console.error('Provisioning error:', error);
      setStatus('Provisioning failed');
      Alert.alert('Error', error.message || 'Failed to provision device');
    } finally {
      setIsProvisioning(false);
    }
  };

  const stringToBytes = (str: string): number[] => {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  };

  const bytesToString = (bytes: number[]): string => {
    return String.fromCharCode(...bytes);
  };

  const pasteFromClipboard = async () => {
    // Note: You'll need to install @react-native-clipboard/clipboard
    // import Clipboard from '@react-native-clipboard/clipboard';
    // const text = await Clipboard.getString();
    // setDeviceConfig(text);
    
    Alert.alert('Info', 'Paste functionality requires @react-native-clipboard/clipboard package');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SafeEdge Provisioning</Text>
        <Text style={styles.subtitle}>Provision IoT devices via Bluetooth</Text>
      </View>

      {/* Status */}
      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {/* Scan Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Scan for Gateway</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={scanForDevices}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🔍 Scan for Devices</Text>
          )}
        </TouchableOpacity>

        {devices.length > 0 && (
          <View style={styles.deviceList}>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceItem}
                onPress={() => connectToDevice(device)}
              >
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceId}>{device.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Connected Device */}
      {connectedDevice && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Device</Text>
          <View style={styles.connectedBox}>
            <Text style={styles.connectedName}>{connectedDevice.name}</Text>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={disconnectDevice}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Provisioning Section */}
      {connectedDevice && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Paste Device Config</Text>
          <Text style={styles.helpText}>
            Get the JSON config from your dashboard's QR code generation
          </Text>

          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={10}
            placeholder="Paste device configuration JSON here..."
            value={deviceConfig}
            onChangeText={setDeviceConfig}
          />

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={pasteFromClipboard}
          >
            <Text style={styles.buttonText}>📋 Paste from Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              (!deviceConfig || isProvisioning) && styles.disabledButton,
            ]}
            onPress={provisionDevice}
            disabled={!deviceConfig || isProvisioning}
          >
            {isProvisioning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🚀 Provision Device</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            1. Make sure ESP32 Gateway is powered on
          </Text>
          <Text style={styles.instructionText}>
            2. Enable Bluetooth on your phone
          </Text>
          <Text style={styles.instructionText}>
            3. Tap "Scan for Devices"
          </Text>
          <Text style={styles.instructionText}>
            4. Select "SafeEdge-Gateway"
          </Text>
          <Text style={styles.instructionText}>
            5. Paste device config from dashboard
          </Text>
          <Text style={styles.instructionText}>
            6. Tap "Provision Device"
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statusBox: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  statusText: {
    fontSize: 14,
    color: '#856404',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    marginTop: 15,
  },
  deviceItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  connectedBox: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  connectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
    minHeight: 150,
  },
  instructionBox: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#004085',
    marginVertical: 5,
  },
});
