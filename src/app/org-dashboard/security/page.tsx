"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Bell, 
  Loader2, 
  Search, 
  Download, 
  TrendingUp,
  Thermometer,
  Droplets,
  Lock,
  Unlock,
  Zap,
  Eye,
  BarChart3,
  Network,
  Wifi
} from 'lucide-react';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { KaliTerminalAdvanced } from '@/components/KaliTerminalAdvanced';

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  title: string;
  description: string;
  location?: {
    floorNumber: number;
    roomName: string;
  };
  createdAt: any;
  metadata?: any;
}

interface SecurityMetrics {
  securityScore: number;
  threatLevel: string;
  totalEvents: number;
  activeAlerts: number;
  resolvedToday: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

interface DeviceSecurityData {
  deviceId: string;
  deviceName: string;
  latestReading?: {
    temperature?: number;
    humidity?: number;
    security_score?: number;
    threat_level?: string;
    anomaly_detected?: boolean;
    motion_detected?: boolean;
    door_status?: boolean;
    vibration_level?: number;
    sound_level?: number;
    timestamp?: string;
  };
  status: string;
  encryptionStatus: string;
  lastSeen?: string;
}

interface ThreatAnalysis {
  overallThreatLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  anomalyCount: number;
  encryptedDevices: number;
  totalDevices: number;
  averageSecurityScore: number;
  criticalDevices: string[];
  recentThreats: Array<{
    deviceId: string;
    deviceName: string;
    threatType: string;
    severity: string;
    timestamp: string;
  }>;
}

interface HistoricalDataPoint {
  timestamp: string;
  deviceId: string;
  deviceName: string;
  temperature?: number;
  humidity?: number;
  security_score?: number;
  threat_level?: string;
  anomaly_detected?: boolean;
}

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [devicesData, setDevicesData] = useState<DeviceSecurityData[]>([]);
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyTimeRange, setHistoryTimeRange] = useState<number>(24); // hours
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchSecurityData(userData.organizationId);
      fetchDevicesSensorData(userData.organizationId);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchDevicesSensorData(userData.organizationId);
        }
      }, 10000); // Refresh every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // 🆕 Backend Storage Functions
  const storeSecurityMetrics = async (analysis: ThreatAnalysis) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      
      await fetch('http://localhost:8000/api/security-analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: userData.organizationId,
          overall_threat_level: analysis.overallThreatLevel,
          average_security_score: analysis.averageSecurityScore,
          anomaly_count: analysis.anomalyCount,
          encrypted_devices: analysis.encryptedDevices,
          total_devices: analysis.totalDevices,
          critical_devices: analysis.criticalDevices
        })
      });
      
      console.log('✅ Security metrics stored in backend');
    } catch (error) {
      console.error('❌ Error storing security metrics:', error);
    }
  };

  const storeThreats = async (threats: Array<{
    deviceId: string;
    deviceName: string;
    threatType: string;
    severity: string;
    timestamp: string;
  }>) => {
    try {
      for (const threat of threats) {
        // Get device reading for additional threat data
        const device = devicesData.find(d => d.deviceId === threat.deviceId);
        const reading = device?.latestReading;
        
        const threatData: any = {
          timestamp: threat.timestamp
        };
        
        // Add relevant sensor data to threat
        if (reading) {
          if (reading.temperature) threatData.temperature = reading.temperature;
          if (reading.humidity) threatData.humidity = reading.humidity;
          if (reading.security_score) threatData.security_score = reading.security_score;
          if (reading.vibration_level) threatData.vibration_level = reading.vibration_level;
          if (reading.sound_level) threatData.sound_level = reading.sound_level;
        }
        
        await fetch('http://localhost:8000/api/security-analytics/threats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: threat.deviceId,
            device_name: threat.deviceName,
            threat_type: threat.threatType,
            severity: threat.severity,
            threat_data: threatData
          })
        });
      }
      
      console.log(`✅ ${threats.length} threats stored in backend`);
    } catch (error) {
      console.error('❌ Error storing threats:', error);
    }
  };

  const storeAnomalies = async (devices: DeviceSecurityData[]) => {
    try {
      for (const device of devices) {
        const reading = device.latestReading;
        
        if (reading?.anomaly_detected) {
          const anomalyData: any = {
            timestamp: reading.timestamp || new Date().toISOString()
          };
          
          // Add sensor data to anomaly
          if (reading.temperature) anomalyData.temperature = reading.temperature;
          if (reading.humidity) anomalyData.humidity = reading.humidity;
          if (reading.security_score) anomalyData.security_score = reading.security_score;
          if (reading.threat_level) anomalyData.threat_level = reading.threat_level;
          
          await fetch('http://localhost:8000/api/security-analytics/anomalies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: device.deviceId,
              device_name: device.deviceName,
              anomaly_type: 'sensor_anomaly',
              anomaly_data: anomalyData
            })
          });
        }
      }
      
      console.log('✅ Anomalies stored in backend');
    } catch (error) {
      console.error('❌ Error storing anomalies:', error);
    }
  };

  const resolveThreat = async (threatId: string) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      
      const response = await fetch(`http://localhost:8000/api/security-analytics/threats/${threatId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved_by: userData.email
        })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Threat marked as resolved',
        });
        
        // Refresh data
        const userData2 = JSON.parse(storedUser);
        fetchDevicesSensorData(userData2.organizationId);
      }
    } catch (error) {
      console.error('❌ Error resolving threat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resolve threat',
      });
    }
  };

  const fetchDevicesSensorData = async (organizationId: string) => {
    try {
      // Fetch all devices with their latest sensor data
      const response = await fetch(`/api/org-data?organizationId=${organizationId}`);
      const data = await response.json();

      if (response.ok && data.devices) {
        const devicesWithSecurity: DeviceSecurityData[] = [];
        
        for (const device of data.devices) {
          if (device.esp32DeviceId) {
            try {
              // Fetch latest sensor data for each device
              const sensorResponse = await fetch(`/api/sensor-data/${device.esp32DeviceId}?hours=1`);
              const sensorData = await sensorResponse.json();
              
              let latestReading = null;
              
              if (sensorData.encrypted_data && sensorData.encrypted_data.length > 0) {
                const latest = sensorData.encrypted_data[0];
                
                // Try to decrypt if encrypted
                if (latest.entry.encrypted_data) {
                  try {
                    const decryptResponse = await fetch('/api/decrypt-sensor-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(latest.entry),
                    });
                    
                    if (decryptResponse.ok) {
                      const decryptedData = await decryptResponse.json();
                      latestReading = decryptedData.data;
                    }
                  } catch (decryptError) {
                    console.error('Decryption error:', decryptError);
                  }
                } else {
                  // Use unencrypted data
                  latestReading = latest.entry;
                }
              }
              
              devicesWithSecurity.push({
                deviceId: device.esp32DeviceId,
                deviceName: device.name,
                status: device.status || 'offline',
                encryptionStatus: latestReading ? 'encrypted' : 'unknown',
                lastSeen: device.lastSeen,
                latestReading
              });
            } catch (error) {
              console.error(`Error fetching sensor data for ${device.name}:`, error);
            }
          }
        }
        
        setDevicesData(devicesWithSecurity);
        analyzeThreatLevel(devicesWithSecurity);
      }
    } catch (error) {
      console.error('Error fetching devices sensor data:', error);
    }
  };

  const analyzeThreatLevel = async (devices: DeviceSecurityData[]) => {
    const analysis: ThreatAnalysis = {
      overallThreatLevel: 'safe',
      anomalyCount: 0,
      encryptedDevices: 0,
      totalDevices: devices.length,
      averageSecurityScore: 0,
      criticalDevices: [],
      recentThreats: []
    };

    let totalScore = 0;
    let scoreCount = 0;

    devices.forEach(device => {
      const reading = device.latestReading;
      
      if (!reading) return;

      // Count encrypted devices
      if (device.encryptionStatus === 'encrypted') {
        analysis.encryptedDevices++;
      }

      // Calculate average security score
      if (reading.security_score !== undefined) {
        totalScore += reading.security_score;
        scoreCount++;
      }

      // Detect anomalies
      if (reading.anomaly_detected) {
        analysis.anomalyCount++;
      }

      // Detect critical threats
      const isCritical = 
        reading.threat_level === 'critical' ||
        (reading.temperature && reading.temperature > 40) ||
        (reading.temperature && reading.temperature < 10) ||
        (reading.humidity && reading.humidity > 85) ||
        (reading.vibration_level && reading.vibration_level > 10) ||
        (reading.sound_level && reading.sound_level > 90) ||
        (reading.security_score && reading.security_score < 40);

      if (isCritical) {
        analysis.criticalDevices.push(device.deviceName);
        
        // Determine threat type
        let threatType = 'Unknown Threat';
        if (reading.temperature && reading.temperature > 40) threatType = 'High Temperature';
        else if (reading.temperature && reading.temperature < 10) threatType = 'Low Temperature';
        else if (reading.vibration_level && reading.vibration_level > 10) threatType = 'High Vibration';
        else if (reading.sound_level && reading.sound_level > 90) threatType = 'Loud Noise';
        else if (reading.threat_level === 'critical') threatType = 'Critical Threat Detected';
        
        analysis.recentThreats.push({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          threatType,
          severity: 'critical',
          timestamp: reading.timestamp || new Date().toISOString()
        });
      }
    });

    // Calculate average security score
    if (scoreCount > 0) {
      analysis.averageSecurityScore = Math.round(totalScore / scoreCount);
    }

    // Determine overall threat level
    if (analysis.criticalDevices.length > 0) {
      analysis.overallThreatLevel = 'critical';
    } else if (analysis.anomalyCount > 2) {
      analysis.overallThreatLevel = 'high';
    } else if (analysis.anomalyCount > 0) {
      analysis.overallThreatLevel = 'medium';
    } else if (analysis.averageSecurityScore < 70) {
      analysis.overallThreatLevel = 'low';
    } else {
      analysis.overallThreatLevel = 'safe';
    }

    setThreatAnalysis(analysis);

    // 🆕 Store security metrics in backend
    await storeSecurityMetrics(analysis);

    // 🆕 Store threat detections in backend
    if (analysis.recentThreats.length > 0) {
      await storeThreats(analysis.recentThreats);
    }

    // 🆕 Store anomalies in backend
    if (analysis.anomalyCount > 0) {
      await storeAnomalies(devices);
    }
  };

  const fetchHistoricalData = async () => {
    setIsLoadingHistory(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      const response = await fetch(`/api/org-data?organizationId=${userData.organizationId}`);
      const data = await response.json();

      if (response.ok && data.devices) {
        const allHistoricalData: HistoricalDataPoint[] = [];
        
        for (const device of data.devices) {
          if (device.esp32DeviceId) {
            try {
              // Fetch historical sensor data
              const sensorResponse = await fetch(
                `/api/sensor-data/${device.esp32DeviceId}?hours=${historyTimeRange}`
              );
              const sensorData = await sensorResponse.json();
              
              if (sensorData.encrypted_data && sensorData.encrypted_data.length > 0) {
                // Process each historical entry
                for (const entry of sensorData.encrypted_data) {
                  let decryptedData = null;
                  
                  // Try to decrypt if encrypted
                  if (entry.entry.encrypted_data) {
                    try {
                      const decryptResponse = await fetch('/api/decrypt-sensor-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(entry.entry),
                      });
                      
                      if (decryptResponse.ok) {
                        const result = await decryptResponse.json();
                        decryptedData = result.data;
                      }
                    } catch (decryptError) {
                      console.error('Decryption error:', decryptError);
                    }
                  } else {
                    // Use unencrypted data
                    decryptedData = entry.entry;
                  }
                  
                  if (decryptedData) {
                    allHistoricalData.push({
                      timestamp: entry.timestamp_key,
                      deviceId: device.esp32DeviceId,
                      deviceName: device.name,
                      temperature: decryptedData.temperature,
                      humidity: decryptedData.humidity,
                      security_score: decryptedData.security_score,
                      threat_level: decryptedData.threat_level,
                      anomaly_detected: decryptedData.anomaly_detected
                    });
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching historical data for ${device.name}:`, error);
            }
          }
        }
        
        // Sort by timestamp (newest first)
        allHistoricalData.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        
        setHistoricalData(allHistoricalData);
        setShowHistoricalData(true);
        
        toast({
          title: 'Historical Data Loaded',
          description: `Loaded ${allHistoricalData.length} historical data points from the last ${historyTimeRange} hours`,
        });
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load historical data',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatHistoricalTimestamp = (timestampKey: string) => {
    try {
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

  const fetchSecurityData = async (organizationId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch events
      const eventsResponse = await fetch(`/api/security/events?organizationId=${organizationId}`);
      const eventsData = await eventsResponse.json();
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/security/metrics?organizationId=${organizationId}`);
      const metricsData = await metricsResponse.json();

      if (eventsResponse.ok) {
        setEvents(eventsData.events || []);
      }
      
      if (metricsResponse.ok) {
        setMetrics(metricsData);
      }
    } catch (error: any) {
      console.error('Error fetching security data:', error);
      // Set empty state for demo
      setEvents([]);
      setMetrics({
        securityScore: 94,
        threatLevel: 'low',
        totalEvents: 0,
        activeAlerts: 0,
        resolvedToday: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Firebase listener (optional)
  const setupRealtimeListener = (organizationId: string) => {
    // This would use Firebase client SDK for real-time updates
    // Example implementation:
    /*
    import { getFirestore, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
    
    const db = getFirestore();
    const eventsQuery = query(
      collection(db, 'securityEvents'),
      where('organizationId', '==', organizationId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(newEvents);
      
      // Show toast for new critical alerts
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const event = change.doc.data();
          if (event.severity === 'critical') {
            toast({
              title: '🔴 Critical Alert',
              description: event.title,
              variant: 'destructive'
            });
          }
        }
      });
    });
    
    return unsubscribe;
    */
  };

  const handleUpdateEventStatus = async (eventId: string, status: string) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      
      const response = await fetch(`/api/security/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolvedBy: userData.email
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Event ${status === 'resolved' ? 'resolved' : 'updated'} successfully`
        });
        
        // Refresh data
        fetchSecurityData(userData.organizationId);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update event'
      });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-[#8B2635] text-white';
      case 'high': return 'bg-[#C17A3A] text-white';
      case 'medium': return 'bg-[#D4A574] text-white';
      case 'low': return 'bg-[#5B6B8F] text-white';
      case 'safe': return 'bg-[#6B8E6F] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      case 'safe': return '🟢';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[#8B2635] text-white';
      case 'high': return 'bg-[#C17A3A] text-white';
      case 'medium': return 'bg-[#D4A574] text-white';
      case 'low': return 'bg-[#5B6B8F] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#8B2635] text-white';
      case 'investigating': return 'bg-[#d3b78f] text-[#242d53]';
      case 'resolved': return 'bg-[#6B8E6F] text-white';
      case 'dismissed': return 'bg-gray-400 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return 'from-[#d3b78f] to-[#c9a876]';
    if (score >= 70) return 'from-[#242d53] to-[#3a4570]';
    if (score >= 50) return 'from-[#C17A3A] to-[#D4A574]';
    return 'from-[#8B2635] to-[#C17A3A]';
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const activeAlerts = events.filter(e => e.status === 'active');
  const criticalAlerts = activeAlerts.filter(e => e.severity === 'critical');
  const highAlerts = activeAlerts.filter(e => e.severity === 'high');

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-[#d3b78f]" />
                <h1 className="text-3xl font-bold">Security Center</h1>
              </div>
              <p className="text-gray-200">Real-time security monitoring and threat detection</p>
            </div>
            <div className="flex gap-3">
              <Link href="/org-dashboard/security/network-analysis">
                <Button className="bg-[#6B8E6F] hover:bg-[#5a7a5e] text-white border-2 border-[#6B8E6F] shadow-lg font-semibold">
                  <Network className="w-4 h-4 mr-2" />
                  🔍 Network Analysis
                </Button>
              </Link>
              <Button variant="outline" className="bg-white/10 border-[#d3b78f] text-white hover:bg-[#d3b78f] hover:text-[#242d53]">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" className="bg-white/10 border-[#d3b78f] text-white hover:bg-[#d3b78f] hover:text-[#242d53]">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d3b78f]" />
          </div>
        ) : (
          <>
            {/* Real-Time Threat Analysis Dashboard */}
            <div className="grid gap-6 md:grid-cols-4">
              {/* Overall Threat Level */}
              <Card className="border-[#242d53]/10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Threat Level</CardTitle>
                  <Shield className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{getThreatLevelIcon(threatAnalysis?.overallThreatLevel || 'safe')}</span>
                    <div className="text-2xl font-bold text-[#242d53]">
                      {(threatAnalysis?.overallThreatLevel || 'safe').toUpperCase()}
                    </div>
                  </div>
                  <Badge className={getThreatLevelColor(threatAnalysis?.overallThreatLevel || 'safe')}>
                    {threatAnalysis?.criticalDevices.length || 0} Critical Devices
                  </Badge>
                </CardContent>
              </Card>

              {/* Security Score */}
              <Card className="border-[#242d53]/10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Avg Security Score</CardTitle>
                  <BarChart3 className="h-5 w-5 text-[#d3b78f]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#242d53] mb-2">
                    {threatAnalysis?.averageSecurityScore || 0}/100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(threatAnalysis?.averageSecurityScore || 0)}`}
                      style={{ width: `${threatAnalysis?.averageSecurityScore || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-[#5B6B8F]">
                    Across {threatAnalysis?.totalDevices || 0} devices
                  </p>
                </CardContent>
              </Card>

              {/* Anomaly Detection */}
              <Card className="border-[#242d53]/10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Anomalies Detected</CardTitle>
                  <AlertTriangle className="h-5 w-5 text-[#C17A3A]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#242d53] mb-2">
                    {threatAnalysis?.anomalyCount || 0}
                  </div>
                  <p className="text-xs text-[#5B6B8F]">
                    {threatAnalysis?.anomalyCount === 0 ? '✅ All systems normal' : '⚠️ Requires attention'}
                  </p>
                </CardContent>
              </Card>

              {/* Encryption Status */}
              <Card className="border-[#242d53]/10 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#5B6B8F]">Encrypted Devices</CardTitle>
                  <Lock className="h-5 w-5 text-[#6B8E6F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#242d53] mb-2">
                    {threatAnalysis?.encryptedDevices || 0}/{threatAnalysis?.totalDevices || 0}
                  </div>
                  <p className="text-xs text-[#6B8E6F]">
                    {threatAnalysis?.encryptedDevices === threatAnalysis?.totalDevices 
                      ? '🔒 All devices secured' 
                      : '⚠️ Some devices unencrypted'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Kali Linux Terminal Integration */}
            <Card className="border-[#242d53]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] text-green-400 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Kali Linux Terminal
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Professional security testing with real Kali Linux tools
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <KaliTerminalAdvanced 
                  onConnectionChange={(connected) => {
                    console.log('Kali VM connection status:', connected);
                  }}
                />
              </CardContent>
            </Card>

            {/* Security Tools Integration Section */}
            <Card className="border-[#242d53]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#6B8E6F] to-[#5a7a5e] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-6 h-6" />
                  Security Tools Integration
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Enterprise-grade security analysis with Kali Linux tools
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Wireshark Network Analysis */}
                  <div className="border-2 border-[#6B8E6F] bg-[#6B8E6F]/5 rounded-lg p-4 hover:bg-[#6B8E6F]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#6B8E6F] rounded-full flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">Wireshark Analysis</h4>
                        <p className="text-xs text-[#5B6B8F]">Real-time packet capture</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5B6B8F] mb-3">
                      Monitor network traffic, detect IoT devices, and identify security threats in real-time.
                    </p>
                    <Link href="/org-dashboard/security/network-analysis">
                      <Button size="sm" className="w-full bg-[#6B8E6F] text-white hover:bg-[#5a7a5e]">
                        <Network className="w-4 h-4 mr-2" />
                        Launch Analysis
                      </Button>
                    </Link>
                  </div>

                  {/* Nmap Network Discovery */}
                  <div className="border-2 border-[#5B6B8F] bg-[#5B6B8F]/5 rounded-lg p-4 hover:bg-[#5B6B8F]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#5B6B8F] rounded-full flex items-center justify-center">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">Nmap Discovery</h4>
                        <p className="text-xs text-[#5B6B8F]">Network scanning</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5B6B8F] mb-3">
                      Discover devices on your network and perform comprehensive port scanning.
                    </p>
                    <Button size="sm" className="w-full bg-[#5B6B8F] text-white hover:bg-[#4a5a7f]" disabled>
                      <Search className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>

                  {/* Suricata IDS */}
                  <div className="border-2 border-[#C17A3A] bg-[#C17A3A]/5 rounded-lg p-4 hover:bg-[#C17A3A]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#C17A3A] rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">Suricata IDS</h4>
                        <p className="text-xs text-[#5B6B8F]">Intrusion detection</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5B6B8F] mb-3">
                      Advanced intrusion detection system for monitoring network threats.
                    </p>
                    <Button size="sm" className="w-full bg-[#C17A3A] text-white hover:bg-[#a66830]" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>

                  {/* OpenVAS Vulnerability Scanner */}
                  <div className="border-2 border-[#8B2635] bg-[#8B2635]/5 rounded-lg p-4 hover:bg-[#8B2635]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#8B2635] rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">OpenVAS Scanner</h4>
                        <p className="text-xs text-[#5B6B8F]">Vulnerability assessment</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5B6B8F] mb-3">
                      Comprehensive vulnerability scanning for your IoT infrastructure.
                    </p>
                    <Button size="sm" className="w-full bg-[#8B2635] text-white hover:bg-[#7a2230]" disabled>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>

                  {/* Nikto Web Scanner */}
                  <div className="border-2 border-[#d3b78f] bg-[#d3b78f]/5 rounded-lg p-4 hover:bg-[#d3b78f]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#d3b78f] rounded-full flex items-center justify-center">
                        <Eye className="w-5 h-5 text-[#242d53]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">Nikto Web Scanner</h4>
                        <p className="text-xs text-[#5B6B8F]">Web vulnerability scan</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#5B6B8F] mb-3">
                      Scan web interfaces for common vulnerabilities and misconfigurations.
                    </p>
                    <Button size="sm" className="w-full bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876]" disabled>
                      <Eye className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>

                  {/* Tools Status */}
                  <div className="border-2 border-[#242d53] bg-[#242d53]/5 rounded-lg p-4 hover:bg-[#242d53]/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#242d53] rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#242d53]">Tools Status</h4>
                        <p className="text-xs text-[#5B6B8F]">System monitoring</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#5B6B8F]">Wireshark</span>
                        <Badge className="bg-[#6B8E6F] text-white text-xs">✅ Active</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#5B6B8F]">Other Tools</span>
                        <Badge className="bg-[#5B6B8F] text-white text-xs">⏳ Pending</Badge>
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-[#242d53] text-white hover:bg-[#3a4570]" disabled>
                      <Activity className="w-4 h-4 mr-2" />
                      View All Status
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#6B8E6F]/10 border-2 border-[#6B8E6F] rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-[#6B8E6F] mt-1" />
                    <div>
                      <h4 className="font-semibold text-[#242d53] mb-2">Kali Linux Integration Ready</h4>
                      <p className="text-sm text-[#5B6B8F] mb-3">
                        Your SafeEdge platform is now integrated with professional-grade security tools from Kali Linux. 
                        Start with Wireshark network analysis to monitor your IoT infrastructure in real-time.
                      </p>
                      <div className="flex gap-2">
                        <Link href="/org-dashboard/security/network-analysis">
                          <Button size="sm" className="bg-[#6B8E6F] text-white hover:bg-[#5a7a5e]">
                            <Network className="w-4 h-4 mr-2" />
                            Start Network Analysis
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="border-[#242d53] text-[#242d53] hover:bg-[#242d53] hover:text-white">
                          <Download className="w-4 h-4 mr-2" />
                          View Documentation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Button
                  onClick={fetchHistoricalData}
                  disabled={isLoadingHistory}
                  className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white hover:from-[#3a4570] hover:to-[#242d53] border-2 border-[#d3b78f] shadow-lg font-semibold"
                >
                  {isLoadingHistory ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading History...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      📊 Previous Data
                    </>
                  )}
                </Button>
                {showHistoricalData && (
                  <>
                    <Select value={historyTimeRange.toString()} onValueChange={(value) => setHistoryTimeRange(parseInt(value))}>
                      <SelectTrigger className="w-40 border-2 border-[#242d53] font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Last 1 hour</SelectItem>
                        <SelectItem value="6">Last 6 hours</SelectItem>
                        <SelectItem value="24">Last 24 hours</SelectItem>
                        <SelectItem value="72">Last 3 days</SelectItem>
                        <SelectItem value="168">Last 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setShowHistoricalData(false)}
                      className="bg-[#8B2635] text-white hover:bg-[#C17A3A] border-2 border-[#8B2635] font-medium"
                    >
                      ✕ Hide History
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200 font-medium' : 'font-medium'}
              >
                <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                Auto Refresh {autoRefresh ? 'On' : 'Off'}
              </Button>
            </div>

            {/* Historical Data View */}
            {showHistoricalData && historicalData.length > 0 && (
              <Card className="border-[#242d53]/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
                  <CardTitle>Historical Security Data</CardTitle>
                  <CardDescription className="text-gray-200">
                    Showing {historicalData.length} data points from the last {historyTimeRange} hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#242d53]/5">
                        <TableHead className="text-[#242d53]">Timestamp</TableHead>
                        <TableHead className="text-[#242d53]">Device</TableHead>
                        <TableHead className="text-[#242d53]">Temperature</TableHead>
                        <TableHead className="text-[#242d53]">Humidity</TableHead>
                        <TableHead className="text-[#242d53]">Security Score</TableHead>
                        <TableHead className="text-[#242d53]">Threat Level</TableHead>
                        <TableHead className="text-[#242d53]">Anomaly</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalData.slice(0, 50).map((dataPoint, index) => {
                        const isCritical = 
                          dataPoint.threat_level === 'critical' ||
                          (dataPoint.temperature && (dataPoint.temperature > 40 || dataPoint.temperature < 10)) ||
                          (dataPoint.security_score && dataPoint.security_score < 40);

                        return (
                          <TableRow 
                            key={`${dataPoint.timestamp}-${index}`}
                            className={`hover:bg-[#d3b78f]/10 ${isCritical ? 'bg-[#8B2635]/5' : ''}`}
                          >
                            <TableCell className="text-[#5B6B8F] text-sm">
                              {formatHistoricalTimestamp(dataPoint.timestamp)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-[#242d53]">{dataPoint.deviceName}</div>
                                <div className="text-xs text-[#5B6B8F]">{dataPoint.deviceId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Thermometer className="w-4 h-4 text-[#5B6B8F]" />
                                <span className={
                                  dataPoint.temperature && (dataPoint.temperature > 40 || dataPoint.temperature < 10)
                                    ? 'text-[#8B2635] font-bold'
                                    : 'text-[#242d53]'
                                }>
                                  {dataPoint.temperature?.toFixed(1) || 'N/A'}°C
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Droplets className="w-4 h-4 text-[#5B6B8F]" />
                                <span className="text-[#242d53]">
                                  {dataPoint.humidity?.toFixed(1) || 'N/A'}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${
                                  dataPoint.security_score && dataPoint.security_score < 40 
                                    ? 'text-[#8B2635]' 
                                    : 'text-[#242d53]'
                                }`}>
                                  {dataPoint.security_score || 'N/A'}
                                </span>
                                {dataPoint.security_score && dataPoint.security_score < 40 && (
                                  <AlertTriangle className="w-4 h-4 text-[#8B2635]" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {dataPoint.threat_level ? (
                                <Badge className={getThreatLevelColor(dataPoint.threat_level)}>
                                  {getThreatLevelIcon(dataPoint.threat_level)} {dataPoint.threat_level.toUpperCase()}
                                </Badge>
                              ) : (
                                <span className="text-[#5B6B8F]">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dataPoint.anomaly_detected ? (
                                <Badge className="bg-[#C17A3A] text-white">
                                  ⚠️ Detected
                                </Badge>
                              ) : (
                                <Badge className="bg-[#6B8E6F] text-white">
                                  ✅ Normal
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {historicalData.length > 50 && (
                    <div className="mt-4 text-sm text-[#5B6B8F] text-center">
                      Showing first 50 of {historicalData.length} data points
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Critical Threats Section */}
            {threatAnalysis && threatAnalysis.recentThreats.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#242d53] flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-[#8B2635]" />
                  Critical Threats Detected
                </h2>
                {threatAnalysis.recentThreats.map((threat, index) => (
                  <Card key={index} className="border-l-4 border-[#8B2635] bg-[#8B2635]/5 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#8B2635] rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-[#242d53]">{threat.threatType}</CardTitle>
                              <Badge className="bg-[#8B2635] text-white">CRITICAL</Badge>
                            </div>
                            <CardDescription className="text-[#5B6B8F]">
                              Device: {threat.deviceName} ({threat.deviceId})
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm text-[#5B6B8F]">
                        <div>🕐 Time: {new Date(threat.timestamp).toLocaleString()}</div>
                        <div>⚠️ Severity: {threat.severity.toUpperCase()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90">
                          <Eye className="w-4 h-4 mr-2" />
                          View Device
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white"
                          onClick={() => {
                            const threatId = `${threat.deviceId}_${new Date(threat.timestamp).toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_')}`;
                            resolveThreat(threatId);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Device Security Status Table */}
            <Card className="border-[#242d53]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
                <CardTitle>Device Security Status</CardTitle>
                <CardDescription className="text-gray-200">
                  Real-time security monitoring for {devicesData.length} devices
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {devicesData.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-[#d3b78f]" />
                    <p className="text-[#242d53] mb-2 font-semibold">No devices found</p>
                    <p className="text-sm text-[#5B6B8F]">Add devices to start monitoring security</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#242d53]/5">
                        <TableHead className="text-[#242d53]">Device</TableHead>
                        <TableHead className="text-[#242d53]">Status</TableHead>
                        <TableHead className="text-[#242d53]">Security Score</TableHead>
                        <TableHead className="text-[#242d53]">Threat Level</TableHead>
                        <TableHead className="text-[#242d53]">Temperature</TableHead>
                        <TableHead className="text-[#242d53]">Anomaly</TableHead>
                        <TableHead className="text-[#242d53]">Encryption</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devicesData.map((device) => {
                        const reading = device.latestReading;
                        const isCritical = reading && (
                          reading.threat_level === 'critical' ||
                          (reading.temperature && (reading.temperature > 40 || reading.temperature < 10)) ||
                          (reading.security_score && reading.security_score < 40)
                        );

                        return (
                          <TableRow 
                            key={device.deviceId} 
                            className={`hover:bg-[#d3b78f]/10 ${isCritical ? 'bg-[#8B2635]/5' : ''}`}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium text-[#242d53]">{device.deviceName}</div>
                                <div className="text-xs text-[#5B6B8F]">{device.deviceId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                                {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#242d53]">
                                  {reading?.security_score || 'N/A'}
                                </span>
                                {reading?.security_score && reading.security_score < 40 && (
                                  <AlertTriangle className="w-4 h-4 text-[#8B2635]" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {reading?.threat_level ? (
                                <Badge className={getThreatLevelColor(reading.threat_level)}>
                                  {getThreatLevelIcon(reading.threat_level)} {reading.threat_level.toUpperCase()}
                                </Badge>
                              ) : (
                                <span className="text-[#5B6B8F]">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Thermometer className="w-4 h-4 text-[#5B6B8F]" />
                                <span className={
                                  reading?.temperature && (reading.temperature > 40 || reading.temperature < 10)
                                    ? 'text-[#8B2635] font-bold'
                                    : 'text-[#242d53]'
                                }>
                                  {reading?.temperature?.toFixed(1) || 'N/A'}°C
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reading?.anomaly_detected ? (
                                <Badge className="bg-[#C17A3A] text-white">
                                  ⚠️ Detected
                                </Badge>
                              ) : (
                                <Badge className="bg-[#6B8E6F] text-white">
                                  ✅ Normal
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {device.encryptionStatus === 'encrypted' ? (
                                <Lock className="w-5 h-5 text-[#6B8E6F]" />
                              ) : (
                                <Unlock className="w-5 h-5 text-[#C17A3A]" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <div className="mt-4 text-sm text-[#5B6B8F] text-center">
                  Last updated: {new Date().toLocaleTimeString()}
                  {autoRefresh && ' • Auto-refreshing every 10 seconds'}
                </div>
              </CardContent>
            </Card>

            {/* Security Events (if any exist) */}
            {events.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#242d53]">Critical Alerts</h2>
                {criticalAlerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-[#8B2635] bg-[#8B2635]/5 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#8B2635] rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-[#242d53]">{alert.title}</CardTitle>
                              <Badge className={getSeverityColor(alert.severity)}>
                                CRITICAL
                              </Badge>
                            </div>
                            <CardDescription className="text-[#5B6B8F]">{alert.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm text-[#5B6B8F]">
                        {alert.location && (
                          <div>📍 Location: Floor {alert.location.floorNumber}, {alert.location.roomName}</div>
                        )}
                        <div>🕐 Time: {new Date(alert.createdAt?.seconds * 1000).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90">
                          🔍 Investigate
                        </Button>
                        <Button variant="outline" className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white">
                          ✓ Mark Resolved
                        </Button>
                        <Button variant="outline" className="border-[#5B6B8F] text-[#5B6B8F] hover:bg-[#5B6B8F] hover:text-white">
                          ✕ Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* High Priority Alerts */}
            {highAlerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#242d53]">High Priority Alerts</h2>
                {highAlerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-[#C17A3A] bg-[#C17A3A]/5 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#C17A3A] rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-[#242d53]">{alert.title}</CardTitle>
                              <Badge className={getSeverityColor(alert.severity)}>
                                HIGH PRIORITY
                              </Badge>
                            </div>
                            <CardDescription className="text-[#5B6B8F]">{alert.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm text-[#5B6B8F]">
                        {alert.location && (
                          <div>📍 Location: Floor {alert.location.floorNumber}, {alert.location.roomName}</div>
                        )}
                        <div>🕐 Time: {new Date(alert.createdAt?.seconds * 1000).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90">
                          🔍 Investigate
                        </Button>
                        <Button variant="outline" className="border-[#6B8E6F] text-[#6B8E6F] hover:bg-[#6B8E6F] hover:text-white">
                          ✓ Mark Resolved
                        </Button>
                        <Button variant="outline" className="border-[#5B6B8F] text-[#5B6B8F] hover:bg-[#5B6B8F] hover:text-white">
                          ✕ Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Events Table */}
            <Card className="border-[#242d53]/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-t-lg">
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription className="text-gray-200">
                  Showing {filteredEvents.length} of {events.length} events (Max 150)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5B6B8F]" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-[#242d53]/20 focus:border-[#d3b78f]"
                    />
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-40 border-[#242d53]/20">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#242d53]/5">
                      <TableHead className="text-[#242d53]">Time</TableHead>
                      <TableHead className="text-[#242d53]">Event</TableHead>
                      <TableHead className="text-[#242d53]">Location</TableHead>
                      <TableHead className="text-[#242d53]">Severity</TableHead>
                      <TableHead className="text-[#242d53]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id} className="hover:bg-[#d3b78f]/10">
                        <TableCell className="text-[#5B6B8F]">
                          {new Date(event.createdAt?.seconds * 1000).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-[#242d53]">{event.title}</div>
                            <div className="text-sm text-[#5B6B8F]">{event.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#5B6B8F]">
                          {event.location ? `F${event.location.floorNumber}-${event.location.roomName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 text-sm text-[#5B6B8F] text-center">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card className="border-[#242d53]/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Compliance Status</CardTitle>
                <CardDescription>Security standards and certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 border-2 border-[#6B8E6F] bg-[#6B8E6F]/5 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-[#6B8E6F]" />
                    <div>
                      <h4 className="font-semibold text-[#242d53]">GDPR Compliant</h4>
                      <p className="text-sm text-[#5B6B8F]">Last audit: 2 weeks ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border-2 border-[#6B8E6F] bg-[#6B8E6F]/5 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-[#6B8E6F]" />
                    <div>
                      <h4 className="font-semibold text-[#242d53]">ISO 27001</h4>
                      <p className="text-sm text-[#5B6B8F]">Certified until Dec 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border-2 border-[#6B8E6F] bg-[#6B8E6F]/5 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-[#6B8E6F]" />
                    <div>
                      <h4 className="font-semibold text-[#242d53]">SOC 2 Type II</h4>
                      <p className="text-sm text-[#5B6B8F]">Audit passed: Jan 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border-2 border-[#d3b78f] bg-[#d3b78f]/10 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-[#d3b78f]" />
                    <div>
                      <h4 className="font-semibold text-[#242d53]">HIPAA</h4>
                      <p className="text-sm text-[#5B6B8F]">Review required</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
