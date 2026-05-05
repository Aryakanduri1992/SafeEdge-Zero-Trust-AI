"use client";

/**
 * Security Monitor Component
 * Real-time display of AI security response pipeline metrics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Zap,
  Phone,
  Volume2
} from 'lucide-react';

interface SecurityMetrics {
  totalProcessed: number;
  successfulBlocks: number;
  failedBlocks: number;
  averageProcessingTime: number;
  phoneAlertsSent: number;
  voiceAlertsGenerated: number;
}

interface RateLimitStatus {
  groq: { used: number; limit: number; resetIn: number };
  elevenlabs: { used: number; limit: number; remaining: number; percentUsed: number };
}

export function SecurityMonitor() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalProcessed: 0,
    successfulBlocks: 0,
    failedBlocks: 0,
    averageProcessingTime: 0,
    phoneAlertsSent: 0,
    voiceAlertsGenerated: 0,
  });

  const [rateLimits, setRateLimits] = useState<RateLimitStatus>({
    groq: { used: 0, limit: 30, resetIn: 0 },
    elevenlabs: { used: 0, limit: 10000, remaining: 10000, percentUsed: 0 },
  });

  const [isTestRunning, setIsTestRunning] = useState(false);

  // Calculate success rate
  const successRate = metrics.totalProcessed > 0
    ? ((metrics.successfulBlocks / (metrics.successfulBlocks + metrics.failedBlocks)) * 100).toFixed(1)
    : '0.0';

  // Run test pipeline
  const runTest = async () => {
    setIsTestRunning(true);
    try {
      // This would call the actual pipeline in production
      // For now, simulate a test
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update metrics (simulated)
      setMetrics(prev => ({
        ...prev,
        totalProcessed: prev.totalProcessed + 1,
        successfulBlocks: prev.successfulBlocks + 1,
        averageProcessingTime: 2847,
        voiceAlertsGenerated: prev.voiceAlertsGenerated + 1,
        phoneAlertsSent: prev.phoneAlertsSent + 1,
      }));

      setRateLimits(prev => ({
        groq: { ...prev.groq, used: prev.groq.used + 1 },
        elevenlabs: { 
          ...prev.elevenlabs, 
          used: prev.elevenlabs.used + 67,
          remaining: prev.elevenlabs.remaining - 67,
          percentUsed: ((prev.elevenlabs.used + 67) / prev.elevenlabs.limit) * 100,
        },
      }));
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Security Monitor</h2>
          <p className="text-muted-foreground">
            Real-time security response pipeline metrics
          </p>
        </div>
        <Button onClick={runTest} disabled={isTestRunning}>
          {isTestRunning ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Run Test
            </>
          )}
        </Button>
      </div>

      {/* Alert for setup */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Configure API keys in <code>.env.local</code>: <code>GROQ_API_KEY</code> and <code>ELEVENLABS_API_KEY</code>
        </AlertDescription>
      </Alert>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Processed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Security events analyzed
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulBlocks} successful / {metrics.failedBlocks} failed
            </p>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;30,000ms
            </p>
          </CardContent>
        </Card>

        {/* Alerts Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.phoneAlertsSent}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.voiceAlertsGenerated} voice alerts generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Groq API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Groq API Usage
            </CardTitle>
            <CardDescription>LLaMA 3.3 70B - Free Tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Requests</span>
              <Badge variant={rateLimits.groq.used > 25 ? "destructive" : "secondary"}>
                {rateLimits.groq.used} / {rateLimits.groq.limit}
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(rateLimits.groq.used / rateLimits.groq.limit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Resets in {Math.ceil(rateLimits.groq.resetIn / 1000)}s
            </p>
          </CardContent>
        </Card>

        {/* ElevenLabs API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              ElevenLabs Usage
            </CardTitle>
            <CardDescription>Voice Synthesis - Free Tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Characters</span>
              <Badge variant={rateLimits.elevenlabs.percentUsed > 80 ? "destructive" : "secondary"}>
                {rateLimits.elevenlabs.used} / {rateLimits.elevenlabs.limit}
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${rateLimits.elevenlabs.percentUsed}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {rateLimits.elevenlabs.remaining.toLocaleString()} characters remaining ({rateLimits.elevenlabs.percentUsed.toFixed(1)}% used)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Last 5 processed events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.totalProcessed === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events processed yet. Click "Run Test" to simulate a security event.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Temperature Attack Blocked</p>
                    <p className="text-xs text-muted-foreground">
                      Device: incubator_001 • Processing: 2,847ms
                    </p>
                  </div>
                  <Badge variant="outline">Calm Alert</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
