"""
Demo Security Response Pipeline
Provides realistic security demonstrations without requiring real API keys
Perfect for security demonstrations
"""

import asyncio
import random
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class DemoSecurityEvent:
    """Demo security event for presentations"""
    id: str
    device_id: str
    threat_type: str
    threat_level: str
    anomaly_score: float
    timestamp: str
    description: str

@dataclass
class DemoBlockingResult:
    """Demo blocking result"""
    blocked: bool
    final_status: str
    strategy: str
    success_rate: float
    processing_time: int

@dataclass
class DemoAnalysis:
    """Demo AI analysis result"""
    id: str
    summary: str
    detailed_analysis: str
    recommendations: List[str]
    confidence_score: float
    urgency_level: str
    voice_script: str
    blocking_success: bool

@dataclass
class DemoVoiceAlert:
    """Demo voice alert result"""
    id: str
    voice_type: str
    audio_path: str
    text: str
    character_count: int
    duration: float

@dataclass
class DemoSecurityResult:
    """Complete demo security pipeline result"""
    success: bool
    processing_time: int
    event: Optional[DemoSecurityEvent]
    blocking_result: Optional[DemoBlockingResult]
    analysis: Optional[DemoAnalysis]
    voice_alert: Optional[DemoVoiceAlert]
    phone_alert_triggered: bool
    errors: List[str]

class DemoSecurityPipeline:
    """Demo security pipeline for live presentations"""
    
    def __init__(self):
        self.metrics = {
            'total_processed': 127,
            'successful_blocks': 119,
            'failed_blocks': 8,
            'average_processing_time': 2847,
            'phone_alerts_sent': 23,
            'voice_alerts_generated': 31
        }
        
        self.rate_limits = {
            'groq': {'used': 15, 'limit': 30, 'reset_in': 1800},
            'elevenlabs': {'used': 2340, 'limit': 10000, 'remaining': 7660, 'percent_used': 23.4}
        }
        
        # Demo attack scenarios
        self.attack_scenarios = {
            'temperature': {
                'threat_type': 'Temperature Manipulation Attack',
                'description': 'Unauthorized attempt to overheat incubator beyond safe thresholds',
                'threat_level': 'critical',
                'blocking_strategy': 'Emergency cooling protocol + Network isolation',
                'voice_script': 'Critical temperature attack detected. Emergency cooling systems activated. Patient safety protocols engaged.',
                'urgency': 'urgent'
            },
            'access': {
                'threat_type': 'Unauthorized Physical Access',
                'description': 'Suspicious physical access to restricted incubator area',
                'threat_level': 'warning',
                'blocking_strategy': 'Access control lockdown + Security team notification',
                'voice_script': 'Unauthorized access detected in NICU area. Security protocols activated. Access restricted.',
                'urgency': 'calm'
            },
            'power': {
                'threat_type': 'Power Supply Manipulation',
                'description': 'Attempt to disrupt power supply to critical systems',
                'threat_level': 'critical',
                'blocking_strategy': 'UPS activation + Backup power systems + Alert maintenance',
                'voice_script': 'Power supply attack detected. Backup systems activated. Critical systems protected.',
                'urgency': 'urgent'
            },
            'network': {
                'threat_type': 'Network Intrusion Attempt',
                'description': 'Suspicious network activity and potential credential theft',
                'threat_level': 'warning',
                'blocking_strategy': 'Firewall rules updated + Device isolation + Traffic analysis',
                'voice_script': 'Network intrusion attempt blocked. Security measures active. Systems monitoring enhanced.',
                'urgency': 'calm'
            }
        }
        
        print("🎭 Demo Security Pipeline initialized - Ready for live demonstration!")
    
    async def process_sensor_data(self, sensor_data: Dict[str, Any]) -> DemoSecurityResult:
        """Process sensor data through demo security pipeline"""
        
        start_time = time.time()
        
        try:
            # Step 1: Detect security event (simulated)
            event = await self._detect_security_event(sensor_data)
            
            if not event:
                return DemoSecurityResult(
                    success=True,
                    processing_time=int((time.time() - start_time) * 1000),
                    event=None,
                    blocking_result=None,
                    analysis=None,
                    voice_alert=None,
                    phone_alert_triggered=False,
                    errors=[]
                )
            
            # Step 2: Block attack (simulated)
            blocking_result = await self._block_attack(event)
            
            # Step 3: AI analysis (simulated)
            analysis = await self._analyze_incident(event, blocking_result)
            
            # Step 4: Generate voice alert (simulated)
            voice_alert = await self._generate_voice_alert(analysis)
            
            # Step 5: Trigger phone alert (simulated)
            phone_alert_triggered = await self._trigger_phone_alert(analysis, voice_alert)
            
            # Update metrics
            self._update_metrics(blocking_result.blocked)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return DemoSecurityResult(
                success=True,
                processing_time=processing_time,
                event=event,
                blocking_result=blocking_result,
                analysis=analysis,
                voice_alert=voice_alert,
                phone_alert_triggered=phone_alert_triggered,
                errors=[]
            )
        
        except Exception as e:
            return DemoSecurityResult(
                success=False,
                processing_time=int((time.time() - start_time) * 1000),
                event=None,
                blocking_result=None,
                analysis=None,
                voice_alert=None,
                phone_alert_triggered=False,
                errors=[str(e)]
            )
    
    async def _detect_security_event(self, sensor_data: Dict[str, Any]) -> Optional[DemoSecurityEvent]:
        """Simulate security event detection"""
        
        await asyncio.sleep(0.3)  # Simulate processing time
        
        # Check for anomalies in sensor data
        device_id = sensor_data.get('device_id', 'unknown')
        
        # Temperature anomaly
        if sensor_data.get('temperature', 37.0) > 40.0:
            scenario = self.attack_scenarios['temperature']
            return DemoSecurityEvent(
                id=f"event_{int(time.time())}",
                device_id=device_id,
                threat_type=scenario['threat_type'],
                threat_level=scenario['threat_level'],
                anomaly_score=0.95,
                timestamp=datetime.now().isoformat(),
                description=scenario['description']
            )
        
        # Access anomaly
        if sensor_data.get('motion_detected') and sensor_data.get('door_status'):
            scenario = self.attack_scenarios['access']
            return DemoSecurityEvent(
                id=f"event_{int(time.time())}",
                device_id=device_id,
                threat_type=scenario['threat_type'],
                threat_level=scenario['threat_level'],
                anomaly_score=0.78,
                timestamp=datetime.now().isoformat(),
                description=scenario['description']
            )
        
        # Power anomaly
        if sensor_data.get('power_voltage', 12.0) < 10.0:
            scenario = self.attack_scenarios['power']
            return DemoSecurityEvent(
                id=f"event_{int(time.time())}",
                device_id=device_id,
                threat_type=scenario['threat_type'],
                threat_level=scenario['threat_level'],
                anomaly_score=0.89,
                timestamp=datetime.now().isoformat(),
                description=scenario['description']
            )
        
        # Network anomaly
        if sensor_data.get('wifi_signal_strength', -45) < -80:
            scenario = self.attack_scenarios['network']
            return DemoSecurityEvent(
                id=f"event_{int(time.time())}",
                device_id=device_id,
                threat_type=scenario['threat_type'],
                threat_level=scenario['threat_level'],
                anomaly_score=0.72,
                timestamp=datetime.now().isoformat(),
                description=scenario['description']
            )
        
        return None
    
    async def _block_attack(self, event: DemoSecurityEvent) -> DemoBlockingResult:
        """Simulate attack blocking"""
        
        await asyncio.sleep(0.8)  # Simulate blocking time
        
        # Get scenario details
        scenario_key = event.threat_type.lower().split()[0]  # 'temperature', 'unauthorized', etc.
        if 'temperature' in event.threat_type.lower():
            scenario_key = 'temperature'
        elif 'access' in event.threat_type.lower():
            scenario_key = 'access'
        elif 'power' in event.threat_type.lower():
            scenario_key = 'power'
        elif 'network' in event.threat_type.lower():
            scenario_key = 'network'
        
        scenario = self.attack_scenarios.get(scenario_key, self.attack_scenarios['network'])
        
        # Simulate blocking success (95% success rate for demo)
        blocked = random.random() < 0.95
        
        return DemoBlockingResult(
            blocked=blocked,
            final_status='blocked' if blocked else 'failed',
            strategy=scenario['blocking_strategy'],
            success_rate=95.7,
            processing_time=random.randint(800, 1200)
        )
    
    async def _analyze_incident(self, event: DemoSecurityEvent, blocking_result: DemoBlockingResult) -> DemoAnalysis:
        """Simulate AI incident analysis"""
        
        await asyncio.sleep(0.5)  # Simulate AI processing time
        
        # Get scenario details
        scenario_key = event.threat_type.lower().split()[0]
        if 'temperature' in event.threat_type.lower():
            scenario_key = 'temperature'
        elif 'access' in event.threat_type.lower():
            scenario_key = 'access'
        elif 'power' in event.threat_type.lower():
            scenario_key = 'power'
        elif 'network' in event.threat_type.lower():
            scenario_key = 'network'
        
        scenario = self.attack_scenarios.get(scenario_key, self.attack_scenarios['network'])
        
        # Generate realistic AI analysis
        if blocking_result.blocked:
            summary = f"Threat successfully neutralized. {scenario['blocking_strategy']} implemented."
            detailed_analysis = f"Advanced threat detection identified {event.threat_type} targeting {event.device_id}. Automated response systems activated within 2.8 seconds. Patient safety maintained throughout incident."
            recommendations = [
                "Continue monitoring for 24 hours",
                "Review security logs for patterns",
                "Update threat intelligence database",
                "Notify security team of incident resolution"
            ]
            urgency_level = scenario['urgency']
        else:
            summary = f"CRITICAL: Threat blocking failed. Manual intervention required."
            detailed_analysis = f"Failed to block {event.threat_type} on {event.device_id}. Escalating to emergency response team. Immediate manual intervention required."
            recommendations = [
                "IMMEDIATE: Manual system isolation",
                "URGENT: Security team response",
                "CRITICAL: Patient safety assessment",
                "Emergency: Backup system activation"
            ]
            urgency_level = "urgent"
        
        return DemoAnalysis(
            id=f"analysis_{int(time.time())}",
            summary=summary,
            detailed_analysis=detailed_analysis,
            recommendations=recommendations,
            confidence_score=random.uniform(0.92, 0.98),
            urgency_level=urgency_level,
            voice_script=scenario['voice_script'],
            blocking_success=blocking_result.blocked
        )
    
    async def _generate_voice_alert(self, analysis: DemoAnalysis) -> DemoVoiceAlert:
        """Simulate voice alert generation"""
        
        await asyncio.sleep(0.4)  # Simulate voice generation time
        
        voice_type = "calm" if analysis.urgency_level == "calm" else "urgent"
        
        return DemoVoiceAlert(
            id=f"voice_{int(time.time())}",
            voice_type=voice_type,
            audio_path=f"/demo/audio/{voice_type}_alert_{int(time.time())}.mp3",
            text=analysis.voice_script,
            character_count=len(analysis.voice_script),
            duration=len(analysis.voice_script) * 0.08  # Approximate speaking time
        )
    
    async def _trigger_phone_alert(self, analysis: DemoAnalysis, voice_alert: DemoVoiceAlert) -> bool:
        """Simulate phone alert triggering"""
        
        await asyncio.sleep(0.2)  # Simulate phone alert time
        
        # Simulate phone alert success (98% success rate)
        return random.random() < 0.98
    
    def _update_metrics(self, blocked: bool):
        """Update demo metrics"""
        
        self.metrics['total_processed'] += 1
        if blocked:
            self.metrics['successful_blocks'] += 1
        else:
            self.metrics['failed_blocks'] += 1
        
        self.metrics['average_processing_time'] = random.randint(2500, 3200)
        self.metrics['voice_alerts_generated'] += 1
        self.metrics['phone_alerts_sent'] += 1
        
        # Update rate limits
        self.rate_limits['groq']['used'] += 1
        self.rate_limits['elevenlabs']['used'] += random.randint(50, 100)
        self.rate_limits['elevenlabs']['remaining'] = max(0, 
            self.rate_limits['elevenlabs']['limit'] - self.rate_limits['elevenlabs']['used'])
        self.rate_limits['elevenlabs']['percent_used'] = (
            self.rate_limits['elevenlabs']['used'] / self.rate_limits['elevenlabs']['limit'] * 100
        )
    
    async def test_pipeline(self) -> DemoSecurityResult:
        """Test the demo security pipeline"""
        
        # Create test sensor data with temperature anomaly
        test_data = {
            'device_id': 'incubator_demo_001',
            'timestamp': datetime.now().isoformat(),
            'temperature': 42.5,  # Trigger temperature attack
            'humidity': 55.0,
            'motion_detected': False,
            'door_status': False,
            'power_voltage': 12.0,
            'wifi_signal_strength': -45
        }
        
        return await self.process_sensor_data(test_data)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get demo pipeline metrics"""
        return self.metrics.copy()
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get demo rate limit status"""
        return self.rate_limits.copy()
    
    def get_blocking_success_rate(self) -> float:
        """Get blocking success rate"""
        total_attempts = self.metrics['successful_blocks'] + self.metrics['failed_blocks']
        if total_attempts == 0:
            return 100.0
        return (self.metrics['successful_blocks'] / total_attempts) * 100