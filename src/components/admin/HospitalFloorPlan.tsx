"use client";

/**
 * Hospital Floor Plan Component
 * Visual representation of hospital layout with device status and threat indicators
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Wifi,
  Battery,
  Thermometer,
  Activity
} from 'lucide-react';

interface DeviceStatus {
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'alerting' | 'under_attack';
  threatLevel: 'safe' | 'warning' | 'critical';
  lastSeen: string;
  batteryLevel?: number;
  signalStrength?: number;
  temperature?: number;
  securityScore: number;
}

interface LiveThreat {
  id: string;
  deviceId: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detecting' | 'blocking' | 'blocked' | 'failed';
  timestamp: string;
}

interface HospitalFloorPlanProps {
  devices: DeviceStatus[];
  threats: LiveThreat[];
}

export function HospitalFloorPlan({ devices, threats }: HospitalFloorPlanProps) {
  const getDevicePosition = (deviceId: string) => {
    // Predefined positions for demo devices
    const positions: Record<string, { x: number; y: number; ward: string; room: string }> = {
      'incubator_001': { x: 20, y: 30, ward: 'Ward A', room: 'Room 101' },
      'incubator_002': { x: 20, y: 60, ward: 'Ward A', room: 'Room 102' },
      'incubator_003': { x: 70, y: 30, ward: 'Ward B', room: 'Room 201' },
    };
    return positions[deviceId] || { x: 50, y: 50, ward: 'Unknown', room: 'Unknown' };
  };

  const getDeviceColor = (device: DeviceStatus) => {
    if (device.status === 'under_attack') return 'bg-red-500 animate-pulse';
    if (device.threatLevel === 'critical') return 'bg-red-500';
    if (device.threatLevel === 'warning') return 'bg-yellow-500';
    if (device.status === 'online') return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getDeviceThreat = (deviceId: string) => {
    return threats.find(t => t.deviceId === deviceId && (t.status === 'detecting' || t.status === 'blocking'));
  };

  return (
    <div className="space-y-6">
      {/* Floor Plan Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Hospital NICU Floor Plan
          </CardTitle>
          <CardDescription>Real-time device status and threat visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg p-4" style={{ height: '400px' }}>
            {/* Floor Plan Background */}
            <div className="absolute inset-4">
              {/* Ward A */}
              <div className="absolute left-0 top-0 w-2/5 h-full border-2 border-blue-300 bg-blue-50 rounded-lg p-2">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Ward A - NICU</h3>
                
                {/* Room 101 */}
                <div className="absolute top-8 left-2 w-3/4 h-1/3 border border-blue-400 bg-white rounded p-1">
                  <span className="text-xs text-blue-600">Room 101</span>
                </div>
                
                {/* Room 102 */}
                <div className="absolute bottom-8 left-2 w-3/4 h-1/3 border border-blue-400 bg-white rounded p-1">
                  <span className="text-xs text-blue-600">Room 102</span>
                </div>
              </div>

              {/* Ward B */}
              <div className="absolute right-0 top-0 w-2/5 h-full border-2 border-green-300 bg-green-50 rounded-lg p-2">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Ward B - NICU</h3>
                
                {/* Room 201 */}
                <div className="absolute top-8 right-2 w-3/4 h-1/3 border border-green-400 bg-white rounded p-1">
                  <span className="text-xs text-green-600">Room 201</span>
                </div>
              </div>

              {/* Corridor */}
              <div className="absolute left-2/5 top-0 w-1/5 h-full bg-gray-100 border-x border-gray-300">
                <div className="text-center mt-4">
                  <span className="text-xs text-gray-600 transform -rotate-90 inline-block">Corridor</span>
                </div>
              </div>

              {/* Device Markers */}
              {devices.map((device) => {
                const position = getDevicePosition(device.deviceId);
                const threat = getDeviceThreat(device.deviceId);
                
                return (
                  <div
                    key={device.deviceId}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ 
                      left: `${position.x}%`, 
                      top: `${position.y}%` 
                    }}
                  >
                    {/* Device Indicator */}
                    <div className={`w-4 h-4 rounded-full ${getDeviceColor(device)} border-2 border-white shadow-lg`}>
                      {threat && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                    
                    {/* Device Tooltip */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div className="font-medium">{device.name}</div>
                      <div>{position.room}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3" />
                        Score: {device.securityScore}
                      </div>
                      {threat && (
                        <div className="text-red-300 font-medium">
                          🚨 {threat.threatType}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-2 right-2 bg-white border rounded-lg p-2 text-xs">
                <div className="font-medium mb-1">Status Legend</div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Safe</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Warning</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Under Attack</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const position = getDevicePosition(device.deviceId);
          const threat = getDeviceThreat(device.deviceId);
          
          return (
            <Card key={device.deviceId} className={`${
              device.status === 'under_attack' ? 'border-red-500 bg-red-50' :
              device.threatLevel === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
                  <Badge variant={
                    device.threatLevel === 'critical' ? 'destructive' :
                    device.threatLevel === 'warning' ? 'secondary' :
                    'default'
                  }>
                    {device.threatLevel}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {position.ward} • {position.room}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Security: {device.securityScore}</span>
                  </div>
                  {device.temperature && (
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      <span>{device.temperature.toFixed(1)}°C</span>
                    </div>
                  )}
                  {device.batteryLevel && (
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3" />
                      <span>{device.batteryLevel}%</span>
                    </div>
                  )}
                  {device.signalStrength && (
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      <span>{device.signalStrength}dBm</span>
                    </div>
                  )}
                </div>

                {/* Active Threat */}
                {threat && (
                  <div className="bg-red-100 border border-red-300 rounded p-2">
                    <div className="flex items-center gap-1 text-red-700 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      ACTIVE THREAT
                    </div>
                    <p className="text-xs text-red-600 mt-1">{threat.threatType}</p>
                    <Badge variant="destructive" className="text-xs mt-1">
                      {threat.severity} • {threat.status}
                    </Badge>
                  </div>
                )}

                {/* Last Seen */}
                <div className="text-xs text-muted-foreground">
                  Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}