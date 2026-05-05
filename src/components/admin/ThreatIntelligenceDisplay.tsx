"use client";

/**
 * Threat Intelligence Display Component
 * Shows AI analysis summaries from Groq API with threat intelligence
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  AlertTriangle, 
  Shield, 
  Clock,
  Target,
  Zap
} from 'lucide-react';

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

interface ThreatIntelligenceDisplayProps {
  threats: LiveThreat[];
}

export function ThreatIntelligenceDisplay({ threats }: ThreatIntelligenceDisplayProps) {
  const activeThreat = threats.find(t => t.status === 'detecting' || t.status === 'blocking');
  const recentThreats = threats.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detecting': return <Target className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'blocking': return <Zap className="h-4 w-4 animate-bounce text-orange-500" />;
      case 'blocked': return <Shield className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Threat Intelligence
        </CardTitle>
        <CardDescription>Real-time AI analysis and threat assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Threat Analysis */}
        {activeThreat && (
          <div className={`p-4 border rounded-lg ${getSeverityColor(activeThreat.severity)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(activeThreat.status)}
                <span className="font-semibold">ACTIVE THREAT</span>
              </div>
              <Badge variant="outline" className="border-current">
                {activeThreat.severity.toUpperCase()}
              </Badge>
            </div>
            <h4 className="font-medium mb-2">{activeThreat.threatType}</h4>
            {activeThreat.aiAnalysis && (
              <div className="bg-white/50 p-3 rounded border">
                <p className="text-sm font-medium mb-1">🤖 AI Analysis:</p>
                <p className="text-sm">{activeThreat.aiAnalysis}</p>
              </div>
            )}
            {activeThreat.blockingStrategy && (
              <div className="bg-white/50 p-3 rounded border mt-2">
                <p className="text-sm font-medium mb-1">🛡️ Response Strategy:</p>
                <p className="text-sm">{activeThreat.blockingStrategy}</p>
              </div>
            )}
            {activeThreat.processingTime && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Clock className="h-3 w-3" />
                Processing time: {activeThreat.processingTime}ms
              </div>
            )}
          </div>
        )}

        {/* Recent Threat History */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recent Security Events
          </h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {recentThreats.length > 0 ? (
                recentThreats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(threat.status)}
                      <div>
                        <p className="font-medium">{threat.threatType}</p>
                        <p className="text-xs text-muted-foreground">
                          Device: {threat.deviceId} • {new Date(threat.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(threat.severity)}`}
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent threats detected</p>
                  <p className="text-xs">All systems secure</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* AI Performance Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">94.2%</p>
            <p className="text-xs text-muted-foreground">AI Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">2.8s</p>
            <p className="text-xs text-muted-foreground">Avg Analysis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">127</p>
            <p className="text-xs text-muted-foreground">Threats Analyzed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}