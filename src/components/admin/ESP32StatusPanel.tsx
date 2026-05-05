"use client";

/**
 * ESP32 Status Panel Component
 * ============================
 * Real-time display of connected ESP32 devices.
 * Shows WiFi status, signal strength, and device health.
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wifi,
  WifiOff,
  Cpu,
  Activity,
  Signal,
  Thermometer,
  Battery,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

interface ESP32Device {
  device_id: string;
  device_type: string;
  firmware_version: string;
  wifi_connected: boolean;
  ip_address: string;
  signal_strength: number;
  mac_address: string;
  status: 'online' | 'offline' | 'alerting';
  last_seen: string;
  uptime?: number;
  capabilities?: string[];
}

interface ESP32SystemStatus {
  total_devices: number;
  online: number;
  offline: number;
  average_signal_strength: number;
  system_status: string;
  last_update: string;
}

interface ESP32StatusPanelProps {
  refreshInterval?: number; // milliseconds
  showDetails?: boolean;
}

export function ESP32StatusPanel({ 
  refreshInterval = 3000,
  showDetails = true 
}: ESP32StatusPanelProps) {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [systemStatus, setSystemStatus] = useState<ESP32SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/esp32/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        setError(null);
      } else {
        setError('Failed to fetch devices');
      }
    } catch (err) {
      setError('Backend not available');
      console.log('ESP32 API not available:', err);
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/esp32/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.log('Could not fetch system status:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchDevices(), fetchSystemStatus()]);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, [fetchDevices, fetchSystemStatus]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const sendTestAlert = async (deviceId: string, alertType: string) => {
    try {
      await fetch('http://localhost:8000/api/esp32/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          alert_type: alertType,
          message: `Test ${alertType} alert`,
          duration: 3
        })
      });
    } catch (err) {
      console.error('Failed to send alert:', err);
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= -50) return <Signal className="h-4 w-4 text-green-500" />;
    if (strength >= -70) return <Signal className="h-4 w-4 text-yellow-500" />;
    return <Signal className="h-4 w-4 text-red-500" />;
  };

  const getSignalQuality = (strength: number): string => {
    if (strength >= -50) return 'Excellent';
    if (strength >= -60) return 'Good';
    if (strength >= -70) return 'Fair';
    return 'Poor';
  };

  const getSignalPercentage = (strength: number): number => {
    // Convert dBm to percentage (roughly -30 to -90 dBm range)
    const min = -90;
    const max = -30;
    const percentage = ((strength - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const formatLastSeen = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">ESP32 Devices</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time ESP32 connection status and WiFi signal strength
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* System Status Summary */}
        {systemStatus && (
          <div className="grid grid-cols-4 gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-700">{systemStatus.total_devices}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{systemStatus.online}</div>
              <div className="text-xs text-green-600">Online</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-500">{systemStatus.offline}</div>
              <div className="text-xs text-gray-500">Offline</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {systemStatus.average_signal_strength} dBm
              </div>
              <div className="text-xs text-purple-600">Avg Signal</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">{error}</span>
          </div>
        )}

        {/* No Devices */}
        {!error && devices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <WifiOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">No ESP32 Devices Connected</p>
            <p className="text-sm mt-1">Connect an ESP32 to see it here</p>
          </div>
        )}

        {/* Device List */}
        {devices.map((device) => (
          <div 
            key={device.device_id}
            className={`p-4 border rounded-lg ${
              device.status === 'online' 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  device.status === 'online' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {device.status === 'online' ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{device.device_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {device.device_type} • v{device.firmware_version}
                  </p>
                </div>
              </div>
              <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                {device.status === 'online' ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Offline</>
                )}
              </Badge>
            </div>

            {showDetails && device.status === 'online' && (
              <>
                {/* WiFi Signal */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1">
                      {getSignalIcon(device.signal_strength)}
                      WiFi Signal
                    </span>
                    <span className="font-medium">
                      {device.signal_strength} dBm ({getSignalQuality(device.signal_strength)})
                    </span>
                  </div>
                  <Progress 
                    value={getSignalPercentage(device.signal_strength)} 
                    className="h-2"
                  />
                </div>

                {/* Device Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>IP: {device.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    <span>MAC: {device.mac_address?.slice(-8) || 'N/A'}</span>
                  </div>
                  {device.uptime !== undefined && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Battery className="h-3 w-3" />
                      <span>Uptime: {formatUptime(device.uptime)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    <span>Seen: {formatLastSeen(device.last_seen)}</span>
                  </div>
                </div>

                {/* Test Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50"
                    onClick={() => sendTestAlert(device.device_id, 'safe')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Safe
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                    onClick={() => sendTestAlert(device.device_id, 'warning')}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Warning
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => sendTestAlert(device.device_id, 'danger')}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Danger
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ESP32StatusPanel;
