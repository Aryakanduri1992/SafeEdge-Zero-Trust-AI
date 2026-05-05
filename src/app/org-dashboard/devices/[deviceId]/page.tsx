"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Loader2, 
  Thermometer, 
  Droplets, 
  Shield, 
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Calendar,
  MapPin,
  Cpu,
  Wifi,
  Battery,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  departmentId: string;
  floorId: string;
  roomId: string;
  esp32DeviceId: string;
  connectionType: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
}

interface SensorReading {
  timestamp_key: string;
  entry: {
    encrypted_data?: string;
    salt?: string;
    iv?: string;
    tag?: string;
    algorithm?: string;
    device_id?: string;
    encrypted_at?: string;
    data_hash?: string;
    // Decrypted fields (when available)
    temperature?: number;
    humidity?: number;
    air_pressure?: number;
    oxygen_level?: number;
    co2_level?: number;
    motion_detected?: boolean;
    vibration_level?: number;
    door_status?: boolean;
    sound_level?: number;
    power_voltage?: number;
    wifi_signal_strength?: number;
    system_temperature?: number;
    threat_level?: string;
    anomaly_detected?: boolean;
    security_score?: number;
    encryption_status?: string;
  };
}

interface DecryptedData {
  temperature?: number;
  humidity?: number;
  air_pressure?: number;
  oxygen_level?: number;
  co2_level?: number;
  motion_detected?: boolean;
  vibration_level?: number;
  door_status?: boolean;
  sound_level?: number;
  power_voltage?: number;
  wifi_signal_strength?: number;
  system_temperature?: number;
  threat_level?: string;
  anomaly_detected?: boolean;
  security_score?: number;
  timestamp?: string;
}

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<{ status: string; last_seen?: string } | null>(null);
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [decryptedData, setDecryptedData] = useState<{ [key: string]: DecryptedData }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState<{ [key: string]: boolean }>({});
  const [showEncrypted, setShowEncrypted] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const deviceId = params.deviceId as string;

  useEffect(() => {
    if (deviceId) {
      fetchDeviceInfo();
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceInfo?.esp32DeviceId) {
      fetchSensorData();
      fetchDeviceStatus(); // Fetch status after device info is loaded
    }
  }, [deviceInfo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && deviceInfo?.esp32DeviceId) {
      interval = setInterval(() => {
        fetchSensorData();
        fetchDeviceStatus(); // Also refresh status
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, deviceInfo]);

  const fetchDeviceStatus = async () => {
    try {
      // Only fetch status if we have the ESP32 device ID
      if (!deviceInfo?.esp32DeviceId) {
        console.log('⏳ Waiting for device info to get ESP32 device ID...');
        return;
      }
      
      console.log('📡 Fetching device status for ESP32 device:', deviceInfo.esp32DeviceId);

      const response = await fetch(`/api/devices/status/${deviceInfo.esp32DeviceId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch device status');
      }

      setDeviceStatus({
        status: data.status,
        last_seen: data.last_seen
      });
      
      console.log('📊 Device status updated:', data.status);
    } catch (error: any) {
      console.error('Error fetching device status:', error);
      // Don't show toast for status errors to avoid spam
    }
  };

  const fetchDeviceInfo = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      const response = await fetch(`/api/devices/info?deviceId=${deviceId}&organizationId=${userData.organizationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch device info');
      }

      setDeviceInfo(data.device);
    } catch (error: any) {
      console.error('Error fetching device info:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load device information',
      });
    }
  };

  const fetchSensorData = async () => {
    try {
      if (!deviceInfo?.esp32DeviceId) {
        console.log('⏳ Waiting for device info...');
        return;
      }

      console.log('📡 Fetching sensor data for device:', deviceInfo.esp32DeviceId);

      // Use Next.js API route which forwards to Python backend
      const response = await fetch(`/api/sensor-data/${deviceInfo.esp32DeviceId}?hours=24`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sensor data');
      }

      setSensorData(data.encrypted_data || []);
      console.log('📊 Fetched sensor data:', data.count, 'entries');
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      // Don't show toast for sensor data errors to avoid spam
    } finally {
      setIsLoading(false);
    }
  };

  const decryptSensorReading = async (reading: SensorReading) => {
    const key = reading.timestamp_key;
    
    if (!reading.entry.encrypted_data || decryptedData[key] || isDecrypting[key]) {
      return;
    }

    try {
      setIsDecrypting(prev => ({ ...prev, [key]: true }));

      // Use Next.js API route which forwards to Python backend
      const response = await fetch('/api/decrypt-sensor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading.entry),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decrypt data');
      }

      setDecryptedData(prev => ({
        ...prev,
        [key]: data.data
      }));

      toast({
        title: 'Data Decrypted',
        description: 'Sensor data decrypted successfully',
      });

    } catch (error: any) {
      console.error('Error decrypting data:', error);
      toast({
        variant: 'destructive',
        title: 'Decryption Failed',
        description: error.message || 'Failed to decrypt sensor data',
      });
    } finally {
      setIsDecrypting(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatTimestamp = (timestampKey: string) => {
    try {
      // Parse timestamp from key format: 20260420_193045_123
      const [datePart, timePart] = timestampKey.split('_');
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      const hour = timePart.substring(0, 2);
      const minute = timePart.substring(2, 4);
      const second = timePart.substring(4, 6);
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      return date.toLocaleString();
    } catch {
      return timestampKey;
    }
  };

  const getLatestReading = (): DecryptedData | null => {
    if (sensorData.length === 0) return null;
    
    const latest = sensorData[0];
    const decrypted = decryptedData[latest.timestamp_key];
    
    if (decrypted) {
      return decrypted;
    }
    
    // Return unencrypted data if available
    if (latest.entry.encryption_status === 'unencrypted') {
      return {
        temperature: latest.entry.temperature,
        humidity: latest.entry.humidity,
        security_score: latest.entry.security_score,
        threat_level: latest.entry.threat_level,
        motion_detected: latest.entry.motion_detected,
        door_status: latest.entry.door_status,
        power_voltage: latest.entry.power_voltage,
        wifi_signal_strength: latest.entry.wifi_signal_strength,
      };
    }
    
    return null;
  };

  const latestReading = getLatestReading();

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutWrapper>
    );
  }

  if (!deviceInfo) {
    return (
      <LayoutWrapper>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Device Not Found</h2>
          <p className="text-gray-600 mb-4">The requested device could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-[#242d53]/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Devices
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#242d53]">{deviceInfo.name}</h1>
              <p className="text-gray-600">Device Details & Live Sensor Data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEncrypted(!showEncrypted)}
              className={showEncrypted ? 'bg-blue-50 border-blue-200' : ''}
            >
              {showEncrypted ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {showEncrypted ? 'Show Encrypted' : 'Show Decrypted'}
            </Button>
          </div>
        </div>

        {/* Device Info Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-[#242d53]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                <Cpu className="w-4 h-4 mr-2" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge 
                  variant={(deviceStatus?.status || deviceInfo.status) === 'online' ? 'default' : 'destructive'}
                  className={(deviceStatus?.status || deviceInfo.status) === 'online' ? 'bg-[#6B8E6F] text-white' : 'bg-[#8B2635] text-white'}
                >
                  {(deviceStatus?.status || deviceInfo.status) === 'online' ? '🟢 Online' : '🔴 Offline'}
                </Badge>
                <p className="text-sm text-gray-600">Type: {deviceInfo.type}</p>
                <p className="text-sm text-gray-600">Connection: {deviceInfo.connectionType}</p>
                {deviceStatus?.last_seen && (
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(deviceStatus.last_seen).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Floor: F1</p>
                <p className="text-sm text-gray-600">Room: R101</p>
                <p className="text-sm text-gray-600">Department: SOCSE</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Encryption:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    🔒 AES-256-GCM
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Security Score:</span>
                  <span className="font-semibold text-green-600">
                    {latestReading?.security_score || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Sensor Readings */}
        {latestReading && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-[#242d53]/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#242d53]">
                  {latestReading.temperature?.toFixed(1) || 'N/A'}°C
                </div>
                <p className="text-xs text-[#5B6B8F] mt-1">Current reading</p>
              </CardContent>
            </Card>

            <Card className="border-[#242d53]/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                  <Droplets className="w-4 h-4 mr-2" />
                  Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#242d53]">
                  {latestReading.humidity?.toFixed(1) || 'N/A'}%
                </div>
                <p className="text-xs text-[#5B6B8F] mt-1">Relative humidity</p>
              </CardContent>
            </Card>

            <Card className="border-[#242d53]/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Motion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#242d53]">
                  {latestReading.motion_detected ? '🚶 Yes' : '🚫 No'}
                </div>
                <p className="text-xs text-[#5B6B8F] mt-1">Motion detected</p>
              </CardContent>
            </Card>

            <Card className="border-[#242d53]/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5B6B8F] flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Signal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#242d53]">
                  {latestReading.wifi_signal_strength || 'N/A'} dBm
                </div>
                <p className="text-xs text-[#5B6B8F] mt-1">WiFi signal strength</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sensor Data History */}
        <Card className="border-[#242d53]/20 bg-white shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
            <CardTitle className="text-white text-xl flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Sensor Data History
            </CardTitle>
            <CardDescription className="text-gray-200">
              {showEncrypted ? 'Encrypted sensor readings (click to decrypt)' : 'Decrypted sensor readings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white p-0">
            {sensorData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-[#d3b78f] bg-gradient-to-r from-[#242d53]/10 to-[#d3b78f]/10">
                    <TableHead className="text-[#242d53] font-bold">Timestamp</TableHead>
                    <TableHead className="text-[#242d53] font-bold">Status</TableHead>
                    {showEncrypted ? (
                      <>
                        <TableHead className="text-[#242d53] font-bold">Algorithm</TableHead>
                        <TableHead className="text-[#242d53] font-bold">Encrypted Data</TableHead>
                        <TableHead className="text-[#242d53] font-bold">Actions</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-[#242d53] font-bold">Temperature</TableHead>
                        <TableHead className="text-[#242d53] font-bold">Humidity</TableHead>
                        <TableHead className="text-[#242d53] font-bold">Security Score</TableHead>
                        <TableHead className="text-[#242d53] font-bold">Threat Level</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {sensorData.slice(0, 20).map((reading) => {
                    const key = reading.timestamp_key;
                    const decrypted = decryptedData[key];
                    const isEncrypted = reading.entry.encrypted_data && reading.entry.algorithm;
                    
                    return (
                      <TableRow key={key} className="border-b border-gray-200 hover:bg-[#d3b78f]/5">
                        <TableCell className="font-medium text-[#242d53]">
                          {formatTimestamp(key)}
                        </TableCell>
                        <TableCell>
                          {isEncrypted ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              🔒 Encrypted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              📄 Plain
                            </Badge>
                          )}
                        </TableCell>
                        {showEncrypted ? (
                          <>
                            <TableCell className="text-gray-700">
                              {reading.entry.algorithm || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-700 font-mono text-xs max-w-xs truncate">
                              {reading.entry.encrypted_data ? 
                                `${reading.entry.encrypted_data.substring(0, 40)}...` : 
                                'No encrypted data'
                              }
                            </TableCell>
                            <TableCell>
                              {isEncrypted && !decrypted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => decryptSensorReading(reading)}
                                  disabled={isDecrypting[key]}
                                  className="text-xs"
                                >
                                  {isDecrypting[key] ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Decrypting...
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3 h-3 mr-1" />
                                      Decrypt
                                    </>
                                  )}
                                </Button>
                              )}
                              {decrypted && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  ✅ Decrypted
                                </Badge>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-gray-700">
                              {decrypted?.temperature?.toFixed(1) || reading.entry.temperature?.toFixed(1) || 'N/A'}°C
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {decrypted?.humidity?.toFixed(1) || reading.entry.humidity?.toFixed(1) || 'N/A'}%
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {decrypted?.security_score || reading.entry.security_score || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  (decrypted?.threat_level || reading.entry.threat_level) === 'low' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }
                              >
                                {decrypted?.threat_level || reading.entry.threat_level || 'N/A'}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                <p className="text-[#242d53] mb-2 font-semibold">No sensor data available</p>
                <p className="text-sm text-[#5B6B8F]">Sensor readings will appear here when the device starts sending data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}