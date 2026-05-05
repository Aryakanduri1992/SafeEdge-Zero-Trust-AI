/**
 * useESP32Device Hook
 * ===================
 * React hook for fetching and managing ESP32 device data.
 * Integrates with WebSocket for real-time updates.
 * 
 * Author: SafeEdge Team - Imagine Cup 2026
 */

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';

export interface ESP32DeviceInfo {
  deviceId: string;
  deviceName: string;
  location: string;
  status: 'online' | 'offline';
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  organizationId: string;
  departmentId?: string;
  lastSeen: string;
  createdAt: string;
}

export interface ESP32CurrentData {
  timestamp: string;
  temperature: number;
  humidity: number;
  powerVoltage: number;
  networkSignalStrength: number;
  systemTemperature: number;
  ethernetConnected: boolean;
  threatLevel: 'safe' | 'warning' | 'critical';
  securityScore: number;
  anomalyDetected: boolean;
  connectedDevices: number;
  blockedDevices: number;
}

export interface ESP32Alert {
  alertId: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  attackType: string;
  threatLevel: string;
  securityScore: number;
  resolved: boolean;
  actionTaken: string;
  attackSource: string;
}

export interface ESP32Statistics {
  deviceId: string;
  totalSensorWrites: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  resolvedAlerts: number;
  currentThreatLevel: string;
  currentSecurityScore: number;
  connectedDevices: number;
  blockedDevices: number;
}

export interface UseESP32DeviceOptions {
  deviceId: string;
  enableWebSocket?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseESP32DeviceReturn {
  device: ESP32DeviceInfo | null;
  currentData: ESP32CurrentData | null;
  statistics: ESP32Statistics | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
  sendCommand: (command: string, parameters?: any) => Promise<boolean>;
}

export function useESP32Device(options: UseESP32DeviceOptions): UseESP32DeviceReturn {
  const { deviceId, enableWebSocket = true, autoRefresh = false, refreshInterval = 30000 } = options;

  const [device, setDevice] = useState<ESP32DeviceInfo | null>(null);
  const [currentData, setCurrentData] = useState<ESP32CurrentData | null>(null);
  const [statistics, setStatistics] = useState<ESP32Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch device information
  const fetchDeviceInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/esp32/devices/${deviceId}`);
      const data = await response.json();

      if (data.success) {
        setDevice(data.device.info);
        setCurrentData(data.device.current);
        setStatistics(data.device.statistics);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch device data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Fetch current data only
  const fetchCurrentData = useCallback(async () => {
    try {
      const response = await fetch(`/api/esp32/devices/${deviceId}/current`);
      const data = await response.json();

      if (data.success) {
        setCurrentData(data.data);
      }
    } catch (err) {
      console.error('Error fetching current data:', err);
    }
  }, [deviceId]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`/api/esp32/devices/${deviceId}/statistics`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, [deviceId]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchDeviceInfo(),
      fetchCurrentData(),
      fetchStatistics(),
    ]);
    setIsLoading(false);
  }, [fetchDeviceInfo, fetchCurrentData, fetchStatistics]);

  // Send command to device
  const sendCommand = useCallback(async (command: string, parameters?: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/esp32/devices/${deviceId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          parameters: parameters || {},
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Error sending command:', err);
      return false;
    }
  }, [deviceId]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'sensor_update':
        if (message.data) {
          setCurrentData(message.data);
        }
        break;

      case 'status_change':
        if (message.info) {
          setDevice((prev) => (prev ? { ...prev, ...message.info } : null));
        }
        break;

      case 'alert':
        // Refresh statistics when new alert arrives
        fetchStatistics();
        break;

      default:
        break;
    }
  }, [fetchStatistics]);

  // WebSocket connection
  const { isConnected } = useWebSocket({
    deviceId: enableWebSocket ? deviceId : undefined,
    autoReconnect: true,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log(`✅ Real-time updates enabled for device: ${deviceId}`);
    },
    onDisconnect: () => {
      console.log(`❌ Real-time updates disconnected for device: ${deviceId}`);
    },
  });

  // Initial data fetch
  useEffect(() => {
    fetchDeviceInfo();
  }, [fetchDeviceInfo]);

  // Auto-refresh (fallback if WebSocket is disabled)
  useEffect(() => {
    if (autoRefresh && !enableWebSocket) {
      const interval = setInterval(() => {
        fetchCurrentData();
        fetchStatistics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, enableWebSocket, refreshInterval, fetchCurrentData, fetchStatistics]);

  return {
    device,
    currentData,
    statistics,
    isLoading,
    error,
    isConnected: enableWebSocket ? isConnected : false,
    refresh,
    sendCommand,
  };
}
