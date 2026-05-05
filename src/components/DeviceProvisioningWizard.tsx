"use client";

import React, { useState } from 'react';
import { X, Check, Loader2, Download, QrCode, Copy } from 'lucide-react';

interface DeviceProvisioningWizardProps {
  organizationId: string;
  departmentId?: string;
  onClose: () => void;
  onSuccess?: (deviceId: string) => void;
}

interface ProvisioningResponse {
  success: boolean;
  device_id: string;
  certificate: string;
  private_key: string;
  encryption_key: string;
  ca_certificate: string;
  qr_code: string;
  config_json: any;
  message: string;
}

type Step = 'info' | 'generating' | 'complete';

const DEVICE_TYPES = [
  { value: 'temperature_sensor', label: 'Temperature Sensor' },
  { value: 'door_lock', label: 'Door Lock' },
  { value: 'camera', label: 'Security Camera' },
  { value: 'medical_device', label: 'Medical Device' },
];

const CONNECTION_TYPES = [
  { value: 'ethernet', label: 'Ethernet (Wired)' },
  { value: 'wifi', label: 'WiFi (Wireless)' },
];

export default function DeviceProvisioningWizard({
  organizationId,
  departmentId,
  onClose,
  onSuccess,
}: DeviceProvisioningWizardProps) {
  const [step, setStep] = useState<Step>('info');
  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'temperature_sensor',
    location: '',
    connection_type: 'ethernet',
    wifi_ssid: '',
    wifi_password: '',
  });
  const [provisioningData, setProvisioningData] = useState<ProvisioningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualConfig, setShowManualConfig] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProvision = async () => {
    setStep('generating');
    setError(null);

    try {
      const response = await fetch('/api/devices/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_name: formData.device_name,
          device_type: formData.device_type,
          location: formData.location,
          organization_id: organizationId,
          department_id: departmentId,
          connection_type: formData.connection_type,
          wifi_ssid: formData.connection_type === 'wifi' ? formData.wifi_ssid : null,
          wifi_password: formData.connection_type === 'wifi' ? formData.wifi_password : null,
          gateway_address: '192.168.1.177',
          gateway_port: 8883,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to provision device');
      }

      const data: ProvisioningResponse = await response.json();
      setProvisioningData(data);
      setStep('complete');
      
      if (onSuccess) {
        onSuccess(data.device_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('info');
    }
  };

  const downloadConfig = () => {
    if (!provisioningData) return;

    const configBlob = new Blob(
      [JSON.stringify(provisioningData.config_json, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(configBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${provisioningData.device_id}_config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'info' && 'Create New IoT Device'}
            {step === 'generating' && 'Generating Security Credentials'}
            {step === 'complete' && 'Device Provisioning Complete'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Device Information */}
          {step === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  name="device_name"
                  value={formData.device_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Temperature Sensor #1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Type
                </label>
                <select
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DEVICE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Ward A - Room 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection Type
                </label>
                <select
                  name="connection_type"
                  value={formData.connection_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CONNECTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.connection_type === 'wifi' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WiFi SSID
                    </label>
                    <input
                      type="text"
                      name="wifi_ssid"
                      value={formData.wifi_ssid}
                      onChange={handleInputChange}
                      placeholder="e.g., Hospital-WiFi"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WiFi Password
                    </label>
                    <input
                      type="password"
                      name="wifi_password"
                      value={formData.wifi_password}
                      onChange={handleInputChange}
                      placeholder="WiFi password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <div className="space-y-4 py-8">
              <div className="flex items-center space-x-3 text-green-600">
                <Check className="w-5 h-5" />
                <span>Generating certificate...</span>
              </div>
              <div className="flex items-center space-x-3 text-green-600">
                <Check className="w-5 h-5" />
                <span>Generating encryption key...</span>
              </div>
              <div className="flex items-center space-x-3 text-green-600">
                <Check className="w-5 h-5" />
                <span>Storing in database...</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating QR code...</span>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && provisioningData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>Device provisioned successfully!</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={provisioningData.device_id}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(provisioningData.device_id)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose Provisioning Method
                </h3>

                {/* Method 1: QR Code + Phone Browser */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <div className="flex items-start space-x-4">
                    <QrCode className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Method 1: Scan QR with Phone (Recommended)
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        1. Open your phone's camera or QR scanner<br/>
                        2. Scan this QR code<br/>
                        3. Open the link in your browser<br/>
                        4. Follow on-screen instructions
                      </p>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <img
                          src={provisioningData.qr_code}
                          alt="Device Configuration QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        QR code contains device ID and one-time provisioning token
                      </p>
                    </div>
                  </div>
                </div>

                {/* Method 2: Direct Browser Access */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 2: Direct Browser Access (Easiest - No QR Needed!)
                  </h4>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Power on ESP32 (creates WiFi: SafeEdge-XXXXXX)</li>
                    <li>Connect phone/computer to ESP32 WiFi</li>
                    <li>Password: <code className="bg-white px-2 py-1 rounded">SafeEdge2026</code></li>
                    <li>Open browser to: <code className="bg-white px-2 py-1 rounded">http://192.168.4.1</code></li>
                    <li>Paste config and click Provision</li>
                  </ol>
                  <p className="text-xs text-green-700 mt-3 font-medium">
                    ✅ No app needed - just use your browser!
                  </p>
                </div>

                {/* Method 3: Download Config */}
                <button
                  onClick={downloadConfig}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors mb-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Method 3: Download Config File (For Manual Provisioning)</span>
                </button>

                {/* Manual Config Option */}
                <button
                  onClick={() => setShowManualConfig(!showManualConfig)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-3 rounded-lg transition-colors"
                >
                  {showManualConfig ? 'Hide' : 'View'} Manual Configuration
                </button>

                {showManualConfig && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Device Certificate
                      </label>
                      <textarea
                        value={provisioningData.certificate}
                        readOnly
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Private Key
                      </label>
                      <textarea
                        value={provisioningData.private_key}
                        readOnly
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Encryption Key (Base64)
                      </label>
                      <input
                        type="text"
                        value={provisioningData.encryption_key}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          {step === 'info' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProvision}
                disabled={!formData.device_name || !formData.location || 
                         (formData.connection_type === 'wifi' && (!formData.wifi_ssid || !formData.wifi_password))}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </>
          )}
          {step === 'complete' && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
