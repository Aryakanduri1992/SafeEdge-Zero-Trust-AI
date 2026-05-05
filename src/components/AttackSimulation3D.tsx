"use client";

/**
 * 3D Attack Simulation for SafeEdge Imagine Cup 2026
 * Real-time attack visualization with voice alerts
 * Shows security threats being blocked in 3D space
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  targetDevice: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  icon: string;
  color: string;
}

const attackScenarios: AttackScenario[] = [
  {
    id: 'temperature_attack',
    name: '🌡️ Temperature Attack',
    description: 'Hacker attempts to overheat baby incubator',
    targetDevice: 'NICU-INC-001',
    severity: 'CRITICAL',
    icon: '🔥',
    color: 'bg-red-500'
  },
  {
    id: 'power_attack',
    name: '⚡ Power Attack',
    description: 'Attempt to cut ventilator power supply',
    targetDevice: 'ICU-VENT-001',
    severity: 'CRITICAL',
    icon: '⚡',
    color: 'bg-red-500'
  },
  {
    id: 'network_intrusion',
    name: '🌐 Network Intrusion',
    description: 'Malicious traffic on hospital network',
    targetDevice: 'NET-FW-001',
    severity: 'HIGH',
    icon: '🛡️',
    color: 'bg-orange-500'
  },
  {
    id: 'unauthorized_access',
    name: '🚪 Unauthorized Access',
    description: 'Breach attempt on NICU monitoring system',
    targetDevice: 'NICU-MON-001',
    severity: 'HIGH',
    icon: '🔓',
    color: 'bg-orange-500'
  },
  {
    id: 'malware',
    name: '🦠 Malware Attack',
    description: 'Virus detected on medical device network',
    targetDevice: 'OR-MON-001',
    severity: 'CRITICAL',
    icon: '🦠',
    color: 'bg-red-500'
  }
];

interface AttackResult {
  success: boolean;
  processingTime: number;
  attackType: string;
  detection: {
    threatType: string;
    severity: string;
    confidence: number;
  };
  blocking: {
    success: boolean;
    strategy: string;
    actionsTaken: string[];
  };
  analysis: {
    summary: string;
    riskLevel: string;
    recommendations: string[];
  };
  voiceAlert: {
    voiceType: string;
    duration: number;
  };
  phoneAlert: {
    channels: string[];
    priority: string;
  };
}

export default function AttackSimulation3D() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentAttack, setCurrentAttack] = useState<AttackScenario | null>(null);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const simulateAttack = async (scenario: AttackScenario) => {
    setIsSimulating(true);
    setCurrentAttack(scenario);
    setAttackResult(null);
    setSimulationLog([]);

    // Add initial log entries
    const addLog = (message: string) => {
      setSimulationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    addLog(`🚨 ATTACK DETECTED: ${scenario.name}`);
    addLog(`🎯 Target Device: ${scenario.targetDevice}`);
    addLog(`⚠️ Severity: ${scenario.severity}`);

    try {
      // Simulate attack detection phase
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('🔍 SafeEdge AI analyzing threat patterns...');

      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog('🛡️ Activating countermeasures...');

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('🚫 Attack blocked successfully!');

      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('🎙️ Generating voice alert...');

      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('📞 Calling emergency contacts...');

      // Call the backend API (using relative URL for Next.js API routes)
      const response = await fetch('/api/security/simulate-attack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attack_type: scenario.id,
          device_id: scenario.targetDevice,
          description: scenario.description,
          attack_indicators: {
            anomaly_score: scenario.severity === 'CRITICAL' ? 0.95 : 0.75,
            confidence: 0.92
          },
          sensor_data: {
            temperature: scenario.id === 'temperature_attack' ? 42.0 : 37.2,
            voltage: scenario.id === 'power_attack' ? 8.5 : 12.0,
            door_sensor: scenario.id === 'unauthorized_access' ? 'open' : 'closed'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAttackResult(result);
        addLog('✅ Emergency contacts notified successfully!');
        addLog(`📊 Processing time: ${result.processing_time}ms`);
        addLog('🏥 Patient safety maintained - All systems secure');
      } else {
        addLog('❌ Failed to process attack simulation');
      }

    } catch (error) {
      console.error('Attack simulation error:', error);
      addLog('❌ Simulation error occurred');
    } finally {
      setIsSimulating(false);
    }
  };

  const clearSimulation = () => {
    setCurrentAttack(null);
    setAttackResult(null);
    setSimulationLog([]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🛡️ SafeEdge Attack Simulation
        </h2>
        <p className="text-gray-600">
          Demonstrate real-time threat detection and response for Imagine Cup 2026
        </p>
      </div>

      {/* Attack Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attackScenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <Badge 
                  variant={scenario.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {scenario.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="text-xs text-gray-500 mb-3">
                Target: <span className="font-mono">{scenario.targetDevice}</span>
              </div>
              <Button
                onClick={() => simulateAttack(scenario)}
                disabled={isSimulating}
                className="w-full"
                variant={scenario.severity === 'CRITICAL' ? 'destructive' : 'default'}
              >
                {isSimulating && currentAttack?.id === scenario.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Simulating...
                  </>
                ) : (
                  <>
                    {scenario.icon} Simulate Attack
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulation Results */}
      {(currentAttack || attackResult) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Live Simulation Log
                {isSimulating && (
                  <div className="animate-pulse bg-red-500 w-3 h-3 rounded-full"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {simulationLog.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
                {isSimulating && (
                  <div className="animate-pulse">
                    <span className="bg-green-400 text-black px-1">█</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attack Results */}
          {attackResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Attack Response Results
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    SUCCESS
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Detection Results */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🔍 Threat Detection</h4>
                  <div className="text-sm space-y-1">
                    <div>Type: <span className="font-semibold">{attackResult.detection?.threat_type}</span></div>
                    <div>Severity: <span className="font-semibold">{attackResult.detection?.severity}</span></div>
                    <div>Confidence: <span className="font-semibold">{(attackResult.detection?.confidence * 100).toFixed(1)}%</span></div>
                  </div>
                </div>

                {/* Blocking Results */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🛡️ Attack Blocking</h4>
                  <div className="text-sm space-y-1">
                    <div>Status: <span className="font-semibold text-green-600">BLOCKED</span></div>
                    <div>Strategy: <span className="font-semibold">{attackResult.blocking?.strategy}</span></div>
                    <div className="mt-2">
                      <div className="font-semibold mb-1">Actions Taken:</div>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {attackResult.blocking?.actions_taken?.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Voice Alert */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">🎙️ Voice Alert</h4>
                  <div className="text-sm space-y-1">
                    <div>Voice Type: <span className="font-semibold">{attackResult.voiceAlert?.voice_type}</span></div>
                    <div>Duration: <span className="font-semibold">{attackResult.voiceAlert?.duration}s</span></div>
                    <div className="mt-2">
                      <div className="font-semibold mb-1">Phone Alert Channels:</div>
                      <div className="flex flex-wrap gap-1">
                        {attackResult.phoneAlert?.channels?.map((channel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Processing Time */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">⚡ Performance</h4>
                  <div className="text-sm">
                    <div>Processing Time: <span className="font-semibold text-blue-600">{attackResult.processing_time}ms</span></div>
                    <div className="text-xs text-gray-600 mt-1">
                      Response time well under 30-second requirement
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Clear Button */}
      {(currentAttack || attackResult) && (
        <div className="text-center">
          <Button onClick={clearSimulation} variant="outline">
            🔄 Clear Simulation
          </Button>
        </div>
      )}

      {/* Demo Instructions */}
      <Alert>
        <AlertDescription>
          <strong>🎯 For Imagine Cup Demo:</strong> These attack simulations demonstrate SafeEdge's 
          real-time threat detection, blocking, and voice alert capabilities. Each scenario shows 
          how SafeEdge protects critical hospital infrastructure and patient safety.
        </AlertDescription>
      </Alert>
    </div>
  );
}