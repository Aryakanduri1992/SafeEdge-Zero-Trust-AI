"use client";

import React, { useState, useRef } from 'react';
import { QrCode, Wifi, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface ProvisioningStep {
  step: number;
  title: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  message?: string;
}

export default function MobileProvisioningApp() {
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [steps, setSteps] = useState<ProvisioningStep[]>([
    { step: 1, title: 'Scan QR Code', status: 'pending' },
    { step: 2, title: 'Connect to ESP32', status: 'pending' },
    { step: 3, title: 'Validate Device', status: 'pending' },
    { step: 4, title: 'Transfer Credentials', status: 'pending' },
    { step: 5, title: 'Complete', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateStep = (stepIndex: number, status: ProvisioningStep['status'], message?: string) => {
    setSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status, message } : s
    ));
    if (status === 'active') {
      setCurrentStep(stepIndex);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);
      updateStep(0, 'active');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start QR code detection
      scanQRCode();
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      updateStep(0, 'error', 'Camera access denied');
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    // In production, use a QR code library like jsQR
    // For now, simulate QR scan with button
    console.log('Scanning for QR code...');
  };

  const handleQRScanned = (data: string) => {
    try {
      const qrContent = JSON.parse(data);
      setQrData(qrContent);
      updateStep(0, 'complete', 'QR Code scanned successfully');
      
      // Stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setScanning(false);

      // Start provisioning process
      startProvisioning(qrContent);
    } catch (err) {
      setError('Invalid QR code format');
      updateStep(0, 'error', 'Invalid QR code');
    }
  };

  const startProvisioning = async (qrContent: any) => {
    try {
      // Step 2: Connect to ESP32 WiFi AP
      updateStep(1, 'active', 'Connecting to ESP32...');
      await connectToESP32();
      updateStep(1, 'complete', 'Connected to ESP32');

      // Step 3: Validate device with backend
      updateStep(2, 'active', 'Validating device...');
      const validation = await validateDevice(qrContent);
      if (!validation.valid) {
        throw new Error(validation.message || 'Device validation failed');
      }
      updateStep(2, 'complete', 'Device validated');

      // Step 4: Transfer credentials to ESP32
      updateStep(3, 'active', 'Transferring credentials...');
      await transferCredentials(qrContent);
      updateStep(3, 'complete', 'Credentials transferred');

      // Step 5: Complete
      updateStep(4, 'complete', 'Provisioning complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Provisioning failed';
      setError(message);
      updateStep(currentStep, 'error', message);
    }
  };

  const connectToESP32 = async (): Promise<void> => {
    // In production, this would:
    // 1. Scan for ESP32 WiFi AP (SafeEdge-XXXXXX)
    // 2. Connect to ESP32 AP
    // 3. Establish HTTP connection to ESP32 web server
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Connected to ESP32 WiFi AP');
        resolve();
      }, 2000);
    });
  };

  const validateDevice = async (qrContent: any): Promise<any> => {
    // Get ESP32 MAC address (in production, from ESP32 API)
    const esp32MacAddress = 'AA:BB:CC:DD:EE:FF';

    const response = await fetch('/api/devices/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: qrContent.device_id,
        provisioning_token: qrContent.provisioning_token,
        esp32_mac_address: esp32MacAddress,
      }),
    });

    const data = await response.json();
    return data;
  };

  const transferCredentials = async (qrContent: any): Promise<void> => {
    // Get full config from backend
    const response = await fetch(`/api/devices/${qrContent.device_id}/config`);
    const config = await response.json();

    // In production, send config to ESP32 via HTTP POST
    // ESP32 endpoint: http://192.168.4.1/provision
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Credentials transferred to ESP32');
        resolve();
      }, 2000);
    });
  };

  // Simulate QR scan for testing
  const simulateQRScan = () => {
    const mockQRData = JSON.stringify({
      device_id: 'iot_temperature_sensor_20260410_test123',
      provisioning_token: 'mock_token_12345',
      config_url: 'https://api.safeedge.com/api/devices/iot_temperature_sensor_20260410_test123/config',
      validation_url: 'https://api.safeedge.com/api/devices/validate'
    });
    handleQRScanned(mockQRData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            SafeEdge Mobile Provisioning
          </h1>
          <p className="text-gray-600 text-sm">
            Scan QR code to provision IoT device
          </p>
        </div>

        {/* Camera View */}
        {scanning && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Position QR code within frame
            </p>
          </div>
        )}

        {/* Scan Button */}
        {!scanning && !qrData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <button
              onClick={startScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-lg font-semibold">Scan QR Code</span>
            </button>
            
            {/* Test button */}
            <button
              onClick={simulateQRScan}
              className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm"
            >
              Simulate QR Scan (Testing)
            </button>
          </div>
        )}

        {/* Provisioning Steps */}
        {qrData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Provisioning Progress
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.step} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'complete' && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {step.status === 'active' && (
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.status === 'complete' ? 'text-green-700' :
                      step.status === 'active' ? 'text-blue-700' :
                      step.status === 'error' ? 'text-red-700' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    {step.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Device Info */}
        {qrData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Device Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Device ID:</span>
                <span className="font-mono text-gray-900">{qrData.device_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-mono text-gray-900">{qrData.provisioning_token.substring(0, 20)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!scanning && !qrData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Ensure ESP32 is powered on</li>
              <li>ESP32 will create WiFi AP: "SafeEdge-XXXXXX"</li>
              <li>Tap "Scan QR Code" above</li>
              <li>Scan the QR code from dashboard</li>
              <li>Wait for automatic provisioning</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
