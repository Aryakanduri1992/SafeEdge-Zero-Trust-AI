"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle,
  Signal,
  Clock,
  RefreshCw
} from 'lucide-react';

interface ESP32Device {
  id: string;
  deviceId: string;
  deviceType: string;
  firmwareVersion: string;
  status: 'online' | 'offline';
  wifiConnected: boolean;
  ipAddress: string;
  signalStrength: number;
  macAddress: string;
  capabilities: string[];
  uptime: number;
  lastSeen: string;
  createdAt: string;
}

export function ESP32DeviceOverview() {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/esp32/devices');
      const data = await response.json();
      
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error('Failed to fetch ESP32 devices:', error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchDevices, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const wifiConnectedDevices = devices.filter(d => d.wifiConnected);

  const getSignalStrengthIcon = (strength: number) => {
    if (strength >= -50) return <Signal className="h-3 w-3 text-green-500" />;
    if (strength >= -70) return <Signal className="h-3 w-3 text-yellow-500" />;
    return <Signal className="h-3 w-3 text-red-500" />;
  };

  const getSignalStrengthLabel = (strength: number) => {
    if (strength >= -50) return 'Excellent';
    if (strength >= -60) return 'Good';
    if (strength >= -70) return 'Fair';
    return 'Weak';
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatLastSeen = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Device Overview
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>ESP32 devices connected to your network</span>
          <span className="flex items-center gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            {lastRefresh.toLocaleTimeString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Online</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{onlineDevices.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Offline</span>
            </div>
            <div className="text-2xl font-bold text-gray-600">{offlineDevices.length}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Wifi className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">WiFi</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{wifiConnectedDevices.length}</div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Device List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Registered Devices</h4>
          
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading devices...
            </div>
          ) : devices.length > 0 ? (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-4">
                {devices
                  .sort((a, b) => {
                    // Online devices first, then by last seen
                    if (a.status === 'online' && b.status !== 'online') return -1;
                    if (a.status !== 'online' && b.status === 'online') return 1;
                    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
                  })
                  .map((device) => (
                    <div 
                      key={device.id} 
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        device.status === 'online' 
                          ? 'border-green-500 bg-card' 
                          : 'border-gray-500 bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${
                            device.status === 'online' ? 'bg-green-500/20' : 'bg-gray-500/20'
                          }`}>
                            <Cpu className={`h-4 w-4 ${
                              device.status === 'online' ? 'text-green-500' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">{device.deviceId}</div>
                            <div className="text-xs text-muted-foreground">
                              {device.deviceType} • v{device.firmwareVersion}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            device.status === 'online' 
                              ? 'text-green-500 border-green-500 bg-green-500/10' 
                              : 'text-gray-400 border-gray-500 bg-gray-500/10'
                          }
                        >
                          {device.status === 'online' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Online</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Offline</>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {/* WiFi Status */}
                        <div className="flex items-center gap-1">
                          {device.wifiConnected ? (
                            <>
                              <Wifi className="h-3 w-3 text-blue-400" />
                              <span className="text-blue-400 font-medium">WiFi On</span>
                              {device.signalStrength !== 0 && (
                                <span className="text-muted-foreground">
                                  ({device.signalStrength} dBm)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">WiFi Off</span>
                            </>
                          )}
                        </div>
                        
                        {/* Last Seen */}
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatLastSeen(device.lastSeen)}
                          </span>
                        </div>
                        
                        {/* IP Address */}
                        {device.ipAddress && device.status === 'online' && (
                          <div className="col-span-2 text-muted-foreground">
                            IP: <span className="text-foreground">{device.ipAddress}</span>
                          </div>
                        )}
                        
                        {/* Uptime */}
                        {device.uptime > 0 && device.status === 'online' && (
                          <div className="col-span-2 text-muted-foreground">
                            Uptime: <span className="text-foreground">{formatUptime(device.uptime)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-600">No ESP32 Devices</h3>
              <p className="text-xs text-gray-500 mt-1">
                Connect an ESP32 device to see it here automatically
              </p>
            </div>
          )}
        </div>

        {/* Total Count */}
        {devices.length > 0 && (
          <div className="mt-4 pt-3 border-t text-center text-xs text-gray-500">
            Total: {devices.length} device{devices.length !== 1 ? 's' : ''} registered
          </div>
        )}
      </CardContent>
    </Card>
  );
}
