"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';

export default function ProvisionPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Loading device configuration...');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const deviceId = params.deviceId as string;
    
    // Fetch device config from backend
    fetch(`http://localhost:8000/api/devices/${deviceId}/config`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfig(data);
          setMessage('Configuration loaded. Connecting to ESP32...');
          
          // Try to send config to ESP32
          sendConfigToESP32(data);
        } else {
          setStatus('error');
          setMessage('Failed to load device configuration');
        }
      })
      .catch(error => {
        setStatus('error');
        setMessage('Failed to connect to backend');
      });
  }, [params.deviceId]);

  const sendConfigToESP32 = async (configData: any) => {
    try {
      // Try to connect to ESP32 at default IP
      const esp32Url = 'http://192.168.4.1/provision';
      
      const response = await fetch(esp32Url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Device provisioned successfully! ESP32 will restart.');
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to provision device');
      }
    } catch (error) {
      // If automatic provisioning fails, show manual option
      setStatus('error');
      setMessage('Could not connect to ESP32 automatically. Please use manual method.');
    }
  };

  const copyConfig = () => {
    if (config) {
      navigator.clipboard.writeText(JSON.stringify(config));
      alert('Config copied! Paste it in the ESP32 provisioning page.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            SafeEdge Provisioning
          </h1>
          <p className="text-gray-600">ESP32 Device Setup</p>
        </div>

        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <p className="text-gray-700 text-center">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-gray-700 text-center font-semibold">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                <p className="text-sm text-green-800">
                  ✅ Device will restart and connect to your network
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-gray-700 text-center font-semibold">{message}</p>
              
              {config && (
                <div className="w-full space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      Manual Provisioning Steps:
                    </h3>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li>Connect to ESP32 WiFi: <code className="bg-white px-2 py-1 rounded">SafeEdge-XXXXXX</code></li>
                      <li>Password: <code className="bg-white px-2 py-1 rounded">SafeEdge2026</code></li>
                      <li>Browser will open automatically</li>
                      <li>Click the button below to copy config</li>
                      <li>Paste in the ESP32 provisioning page</li>
                      <li>Click "Provision Device"</li>
                    </ol>
                  </div>

                  <button
                    onClick={copyConfig}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    📋 Copy Config JSON
                  </button>

                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="cursor-pointer font-semibold text-gray-700">
                      View Config JSON
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>SafeEdge IoT Security Platform</p>
          <p>Imagine Cup 2026</p>
        </div>
      </div>
    </div>
  );
}
