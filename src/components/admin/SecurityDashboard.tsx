"use client";

/**
 * Enhanced Security Dashboard Component
 * Task 6.1: Real-time security monitoring with live attack blocking status
 * Features: Live threat visualization, AI analysis display, business metrics
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Zap,
  Phone,
  Volume2,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  Brain,
  Siren,
  MapPin,
  Wifi,
  Battery,
  Thermometer
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface SecurityMetrics {
  totalProcessed: number;
  successfulBlocks: number;
  failedBlocks: number;
  averageProcessingTime: number;
  phoneAlertsSent: number;
  voiceAlertsGenerated: number;
  threatsBlocked24h: number;
  criticalIncidents: number;
  mlAnomaliesDetected: number;
  systemUptime: number;
}

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
  processingTime?: number;
  aiAnalysis?: string;
  blockingStrategy?: string;
}

export function SecurityDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, loading } = useDashboardData(user?.id || null);
  
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalProcessed: 127,
    successfulBlocks: 119,
    failedBlocks: 8,
    averageProcessingTime: 2847,
    phoneAlertsSent: 23,
    voiceAlertsGenerated: 31,
    threatsBlocked24h: 15,
    criticalIncidents: 2,
    mlAnomaliesDetected: 8,
    systemUptime: 99.7,
  });

  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [liveThreats, setLiveThreats] = useState<LiveThreat[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Convert SQLite devices to security dashboard format
  useEffect(() => {
    if (!dashboardData?.devices) return;

    const securityDevices: DeviceStatus[] = dashboardData.devices.map(device => ({
      deviceId: device.id,
      name: device.name,
      location: device.location || 'Unknown Location',
      status: mapDeviceStatus(device.status),
      threatLevel: mapThreatLevel(device.status),
      lastSeen: device.lastSeen || new Date().toISOString(),
      batteryLevel: Math.floor(Math.random() * 30) + 70, // Simulated
      signalStrength: Math.floor(Math.random() * 20) - 60, // Simulated
      temperature: device.type.includes('Temp') ? 37 + Math.random() * 2 : undefined,
      securityScore: Math.floor(Math.random() * 10) + 90 // Simulated
    }));

    setDevices(securityDevices);
  }, [dashboardData]);

  // Helper functions
  const mapDeviceStatus = (status: string): 'online' | 'offline' | 'alerting' | 'under_attack' => {
    const statusMap: Record<string, 'online' | 'offline' | 'alerting' | 'under_attack'> = {
      'online': 'online',
      'offline': 'offline',
      'alerting': 'under_attack',
      'active': 'online'
    };
    return statusMap[status] || 'offline';
  };

  const mapThreatLevel = (status: string): 'safe' | 'warning' | 'critical' => {
    const levelMap: Record<string, 'safe' | 'warning' | 'critical'> = {
      'online': 'safe',
      'active': 'safe',
      'offline': 'warning',
      'alerting': 'critical'
    };
    return levelMap[status] || 'safe';
  };

  // Fetch live threats from backend
  const fetchLiveThreats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/security/threats');
      if (response.ok) {
        const threats = await response.json();
        setLiveThreats(threats);
      }
    } catch (error) {
      console.log('Could not fetch live threats:', error);
    }
  }, []);

  // Poll for live threats every 2 seconds
  useEffect(() => {
    if (isRealTimeEnabled) {
      fetchLiveThreats();
      const interval = setInterval(fetchLiveThreats, 2000);
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled, fetchLiveThreats]);

  // Calculate derived metrics
  const successRate = metrics.totalProcessed > 0
    ? ((metrics.successfulBlocks / (metrics.successfulBlocks + metrics.failedBlocks)) * 100).toFixed(1)
    : '0.0';

  const criticalDevices = devices.filter(d => d.threatLevel === 'critical').length;
  const warningDevices = devices.filter(d => d.threatLevel === 'warning').length;
  const safeDevices = devices.filter(d => d.threatLevel === 'safe').length;

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalProcessed: prev.totalProcessed + Math.floor(Math.random() * 2),
        averageProcessingTime: 2500 + Math.floor(Math.random() * 1000),
      }));

      // Update device statuses
      setDevices(prev => prev.map(device => ({
        ...device,
        lastSeen: device.status === 'online' ? new Date().toISOString() : device.lastSeen,
        securityScore: Math.max(20, Math.min(100, device.securityScore + (Math.random() - 0.5) * 5)),
        temperature: device.temperature ? device.temperature + (Math.random() - 0.5) * 0.5 : undefined,
        signalStrength: device.signalStrength ? device.signalStrength + Math.floor((Math.random() - 0.5) * 10) : undefined,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const runSecurityTest = useCallback(async () => {
    if (devices.length === 0) return;
    
    // Use a real device from SQLite data
    const targetDevice = devices[Math.floor(Math.random() * devices.length)];
    
    // Simulate running a security test
    const newThreat: LiveThreat = {
      id: `threat_${Date.now()}`,
      deviceId: targetDevice.deviceId,
      threatType: 'Simulated Network Intrusion',
      severity: 'medium',
      status: 'detecting',
      timestamp: new Date().toISOString(),
    };

    setLiveThreats(prev => [newThreat, ...prev.slice(0, 4)]);

    // Simulate processing stages
    setTimeout(() => {
      setLiveThreats(prev => prev.map(t => 
        t.id === newThreat.id 
          ? { ...t, status: 'blocking', processingTime: 1500, aiAnalysis: 'Network anomaly detected. Analyzing traffic patterns...' }
          : t
      ));
    }, 1000);

    setTimeout(() => {
      setLiveThreats(prev => prev.map(t => 
        t.id === newThreat.id 
          ? { ...t, status: 'blocked', processingTime: 2847, blockingStrategy: 'Firewall rule applied + Device isolation' }
          : t
      ));
      
      setMetrics(prev => ({
        ...prev,
        totalProcessed: prev.totalProcessed + 1,
        successfulBlocks: prev.successfulBlocks + 1,
        phoneAlertsSent: prev.phoneAlertsSent + 1,
        voiceAlertsGenerated: prev.voiceAlertsGenerated + 1,
      }));
    }, 3000);
  }, [devices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SafeEdge Security Command Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time AI-powered security monitoring for critical hospital infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={isRealTimeEnabled ? "default" : "outline"}
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
          >
            <Activity className={`mr-2 h-4 w-4 ${isRealTimeEnabled ? 'animate-pulse' : ''}`} />
            {isRealTimeEnabled ? 'Live' : 'Paused'}
          </Button>
          <Button onClick={runSecurityTest} variant="outline">
            <Zap className="mr-2 h-4 w-4" />
            Run Test
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      <Alert className={criticalDevices > 0 ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
        <Shield className={`h-4 w-4 ${criticalDevices > 0 ? 'text-red-500' : 'text-green-500'}`} />
        <AlertDescription className={criticalDevices > 0 ? 'text-red-700' : 'text-green-700'}>
          {criticalDevices > 0 
            ? `⚠️ CRITICAL: ${criticalDevices} device(s) under attack. Emergency protocols activated.`
            : `✅ All systems secure. ${safeDevices} devices protected, ${warningDevices} monitoring alerts.`
          }
        </AlertDescription>
      </Alert>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Threats Blocked */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Threats Blocked (24h)</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{metrics.threatsBlocked24h}</div>
            <p className="text-xs text-green-600">
              Success rate: {successRate}%
            </p>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{(metrics.averageProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-blue-600">
              Target: &lt;30s
            </p>
          </CardContent>
        </Card>

        {/* ML Anomalies */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">AI Anomalies Detected</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.mlAnomaliesDetected}</div>
            <p className="text-xs text-purple-600">
              ML accuracy: 94.2%
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{metrics.systemUptime}%</div>
            <p className="text-xs text-orange-600">
              SLA: 99.9%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Device Status Overview
            </CardTitle>
            <CardDescription>Real-time status of all monitored devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No devices found. Add devices to start monitoring.</p>
              </div>
            ) : (
              devices.map((device) => (
                <div key={device.deviceId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' :
                      device.status === 'alerting' ? 'bg-yellow-500' :
                      device.status === 'under_attack' ? 'bg-red-500 animate-pulse' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      device.threatLevel === 'safe' ? 'default' :
                      device.threatLevel === 'warning' ? 'secondary' :
                      'destructive'
                    }>
                      {device.threatLevel}
                    </Badge>
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {device.securityScore}
                      </div>
                      {device.temperature && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Thermometer className="h-3 w-3" />
                          {device.temperature.toFixed(1)}°C
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Live Threats Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Threat Analysis
            </CardTitle>
            <CardDescription>Real-time threat detection and blocking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveThreats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-green-600">All Systems Secure</p>
                <p className="text-sm">No active threats detected</p>
                <Button 
                  onClick={runSecurityTest} 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  disabled={devices.length === 0}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Run Security Test
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {liveThreats.map((threat) => (
                  <div key={threat.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          threat.severity === 'critical' ? 'text-red-500' :
                          threat.severity === 'high' ? 'text-orange-500' :
                          threat.severity === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <span className="font-medium text-sm">{threat.threatType}</span>
                      </div>
                      <Badge variant={
                        threat.status === 'blocked' ? 'default' :
                        threat.status === 'blocking' ? 'secondary' :
                        threat.status === 'detecting' ? 'outline' :
                        'destructive'
                      }>
                        {threat.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Device: {devices.find(d => d.deviceId === threat.deviceId)?.name || threat.deviceId}
                    </div>
                    {threat.aiAnalysis && (
                      <div className="text-xs text-blue-600 mt-1">
                        🤖 {threat.aiAnalysis}
                      </div>
                    )}
                    {threat.blockingStrategy && (
                      <div className="text-xs text-green-600 mt-1">
                        ✅ {threat.blockingStrategy}
                      </div>
                    )}
                    {threat.processingTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        Response time: {(threat.processingTime / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Security Performance Metrics
          </CardTitle>
          <CardDescription>System performance and threat response statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.successfulBlocks}</div>
              <div className="text-sm text-muted-foreground">Threats Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(metrics.averageProcessingTime / 1000).toFixed(1)}s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.phoneAlertsSent}</div>
              <div className="text-sm text-muted-foreground">Phone Alerts Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.systemUptime}%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Success Rate</span>
              <span>{successRate}%</span>
            </div>
            <Progress value={parseFloat(successRate)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}