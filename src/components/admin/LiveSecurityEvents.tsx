"use client";

/**
 * Live Security Events Component
 * Real-time display of security events with detailed information
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Clock,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Activity,
  Phone,
  Volume2,
  Brain
} from 'lucide-react';

interface DeviceStatus {
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'alerting' | 'under_attack';
  threatLevel: 'safe' | 'warning' | 'critical';
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

interface LiveSecurityEventsProps {
  threats: LiveThreat[];
  devices: DeviceStatus[];
}

export function LiveSecurityEvents({ threats, devices }: LiveSecurityEventsProps) {
  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    return device ? device.name : deviceId;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detecting': return <Target className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'blocking': return <Zap className="h-4 w-4 animate-bounce text-orange-500" />;
      case 'blocked': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'detecting': return 25;
      case 'blocking': return 75;
      case 'blocked': return 100;
      case 'failed': return 100;
      default: return 0;
    }
  };

  const activeThreat = threats.find(t => t.status === 'detecting' || t.status === 'blocking');
  const recentThreats = threats.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Active Threat Alert */}
      {activeThreat && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              ACTIVE SECURITY INCIDENT
            </CardTitle>
            <CardDescription className="text-red-600">
              Real-time threat detection and response in progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-red-800 mb-2">Threat Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Device:</span>
                    <span className="font-medium">{getDeviceName(activeThreat.deviceId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Threat Type:</span>
                    <span className="font-medium">{activeThreat.threatType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Severity:</span>
                    <Badge variant="destructive">{activeThreat.severity.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(activeThreat.status)}
                      <span className="font-medium">{activeThreat.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-800 mb-2">Response Progress</h4>
                <div className="space-y-3">
                  <Progress value={getStatusProgress(activeThreat.status)} className="h-3" />
                  <div className="text-xs text-red-600">
                    {activeThreat.processingTime ? 
                      `Processing time: ${activeThreat.processingTime}ms` : 
                      'Analyzing threat...'
                    }
                  </div>
                </div>
              </div>
            </div>

            {activeThreat.aiAnalysis && (
              <div className="bg-white/50 p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-red-800">AI Analysis:</span>
                </div>
                <p className="text-sm text-red-700">{activeThreat.aiAnalysis}</p>
              </div>
            )}

            {activeThreat.blockingStrategy && (
              <div className="bg-white/50 p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-red-800">Response Strategy:</span>
                </div>
                <p className="text-sm text-red-700">{activeThreat.blockingStrategy}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Events Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Live Security Events
          </CardTitle>
          <CardDescription>Real-time security event stream with AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {recentThreats.length > 0 ? (
                recentThreats.map((threat) => (
                  <div key={threat.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(threat.status)}
                        <div>
                          <h4 className="font-medium">{threat.threatType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getDeviceName(threat.deviceId)} • {new Date(threat.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={threat.severity === 'critical' ? 'destructive' : 'secondary'}
                          className={`${getSeverityColor(threat.severity)} text-white`}
                        >
                          {threat.severity}
                        </Badge>
                        {threat.processingTime && (
                          <span className="text-xs text-muted-foreground">
                            {threat.processingTime}ms
                          </span>
                        )}
                      </div>
                    </div>

                    {threat.aiAnalysis && (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium">AI Analysis: </span>
                        {threat.aiAnalysis}
                      </div>
                    )}

                    {threat.blockingStrategy && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <span className="font-medium">Response: </span>
                        {threat.blockingStrategy}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Event ID: {threat.id}</span>
                      <div className="flex items-center gap-4">
                        {threat.status === 'blocked' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Threat Neutralized</span>
                          </div>
                        )}
                        {threat.status === 'failed' && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            <span>Response Failed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No Security Events</h3>
                  <p className="text-sm">All systems are secure. No threats detected.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">
              Security events processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Threats</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threats.filter(t => t.status === 'blocked').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully neutralized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threats.filter(t => t.status === 'detecting' || t.status === 'blocking').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threats.filter(t => t.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority incidents
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}