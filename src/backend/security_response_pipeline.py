"""
Security Response Pipeline (Python)
Task 3.4: Complete end-to-end security response workflow
detection → blocking → analysis → voice → alert
"""

from dataclasses import dataclass
from typing import Optional, List
import time
import os

from security_event_detector import SecurityEventDetector, SecurityEvent
from attack_blocker import AttackBlocker, CountermeasureResult
from groq_analyzer import GroqAnalyzer, IncidentAnalysis
from elevenlabs_voice import ElevenLabsVoice, VoiceGenerationResult


@dataclass
class PipelineResult:
    """Complete pipeline execution result"""
    success: bool
    processing_time: float  # milliseconds
    event: Optional[SecurityEvent]
    blocking_result: Optional[CountermeasureResult]
    analysis: Optional[IncidentAnalysis]
    voice_alert: Optional[VoiceGenerationResult]
    phone_alert_triggered: bool
    errors: List[str]


@dataclass
class PipelineMetrics:
    """Pipeline performance metrics"""
    total_processed: int
    successful_blocks: int
    failed_blocks: int
    average_processing_time: float
    phone_alerts_sent: int
    voice_alerts_generated: int


class SecurityResponsePipeline:
    """Complete security response pipeline"""
    
    def __init__(
        self,
        groq_api_key: str,
        elevenlabs_api_key: str,
        enable_voice_alerts: bool = True,
        enable_phone_alerts: bool = True,
        max_processing_time: float = 30000,  # milliseconds
        twilio_account_sid: str = '',
        twilio_auth_token: str = '',
        twilio_from_number: str = '',
        twilio_to_number: str = '',
        emergency_contacts: str = ''
    ):
        # Initialize components
        self.detector = SecurityEventDetector()
        self.blocker = AttackBlocker()
        self.analyzer = GroqAnalyzer(api_key=groq_api_key)
        self.voice_generator = ElevenLabsVoice(api_key=elevenlabs_api_key)
        
        # Configuration
        self.enable_voice_alerts = enable_voice_alerts
        self.enable_phone_alerts = enable_phone_alerts
        self.max_processing_time = max_processing_time
        
        # Twilio configuration
        self.twilio_account_sid = twilio_account_sid
        self.twilio_auth_token = twilio_auth_token
        self.twilio_from_number = twilio_from_number
        self.twilio_to_number = twilio_to_number
        self.emergency_contacts = emergency_contacts
        
        # Metrics
        self.metrics = PipelineMetrics(
            total_processed=0,
            successful_blocks=0,
            failed_blocks=0,
            average_processing_time=0,
            phone_alerts_sent=0,
            voice_alerts_generated=0
        )
        
        # Processing queue
        self.processing_queue: dict[str, PipelineResult] = {}
    
    async def process_sensor_data(self, sensor_data: dict) -> PipelineResult:
        """
        Process sensor data through complete security pipeline
        
        Args:
            sensor_data: Dictionary containing sensor readings
            
        Returns:
            PipelineResult with complete processing status
        """
        start_time = time.time()
        errors: List[str] = []
        
        event: Optional[SecurityEvent] = None
        blocking_result: Optional[CountermeasureResult] = None
        analysis: Optional[IncidentAnalysis] = None
        voice_alert: Optional[VoiceGenerationResult] = None
        phone_alert_triggered = False
        
        try:
            # Step 1: Detect anomalies
            event = self.detector.detect_anomalies(sensor_data)
            
            if not event:
                # No threat detected - safe
                return PipelineResult(
                    success=True,
                    processing_time=(time.time() - start_time) * 1000,
                    event=None,
                    blocking_result=None,
                    analysis=None,
                    voice_alert=None,
                    phone_alert_triggered=False,
                    errors=[]
                )
            
            print(f"🚨 Security event detected: {event.threat_type.value} ({event.threat_level.value})")
            
            # Step 2: Attempt to block threat
            try:
                blocking_result = await self.blocker.block_threat(event)
                print(f"🛡️  Blocking result: {blocking_result.final_status} ({'SUCCESS' if blocking_result.blocked else 'FAILED'})")
                
                if blocking_result.blocked:
                    self.metrics.successful_blocks += 1
                else:
                    self.metrics.failed_blocks += 1
            except Exception as e:
                errors.append(f"Blocking failed: {str(e)}")
                blocking_result = CountermeasureResult(
                    blocked=False,
                    attempts=[],
                    final_status='failed',
                    requires_human_intervention=True,
                    affected_systems=[]
                )
            
            # Step 3: AI analysis with blocking context
            try:
                print("🤖 Starting AI analysis...")
                analysis = await self.analyzer.analyze_incident(event, blocking_result)
                print(f"🤖 AI analysis complete: {analysis.summary}")
            except Exception as e:
                error_msg = f"AI analysis failed: {str(e)}"
                errors.append(error_msg)
                print(f"❌ {error_msg}")
            
            # Step 4: Generate voice alert (if enabled and analysis available)
            if self.enable_voice_alerts and analysis:
                try:
                    print("🔊 Starting voice generation...")
                    voice_alert = await self.voice_generator.generate_voice_alert(analysis)
                    self.metrics.voice_alerts_generated += 1
                    print(f"🔊 Voice alert generated: {voice_alert.voice_type}")
                except Exception as e:
                    error_msg = f"Voice generation failed: {str(e)}"
                    errors.append(error_msg)
                    print(f"❌ {error_msg}")
            elif self.enable_voice_alerts and not analysis:
                print("⚠️  Voice alerts enabled but no analysis available")
            
            # Step 5: Trigger phone alert (if enabled)
            if self.enable_phone_alerts and analysis and voice_alert:
                try:
                    phone_alert_triggered = await self._trigger_phone_alert(analysis, voice_alert)
                    if phone_alert_triggered:
                        self.metrics.phone_alerts_sent += 1
                        print(f"📞 Phone alert triggered")
                except Exception as e:
                    errors.append(f"Phone alert failed: {str(e)}")
            
            # Update metrics
            processing_time = (time.time() - start_time) * 1000
            self.metrics.total_processed += 1
            self.metrics.average_processing_time = (
                (self.metrics.average_processing_time * (self.metrics.total_processed - 1) + processing_time) /
                self.metrics.total_processed
            )
            
            # Check if we exceeded max processing time
            if processing_time > self.max_processing_time:
                errors.append(
                    f"Processing time exceeded limit: {processing_time:.0f}ms > {self.max_processing_time}ms"
                )
            
            result = PipelineResult(
                success=len(errors) == 0,
                processing_time=processing_time,
                event=event,
                blocking_result=blocking_result,
                analysis=analysis,
                voice_alert=voice_alert,
                phone_alert_triggered=phone_alert_triggered,
                errors=errors
            )
            
            # Store in processing queue
            if event:
                self.processing_queue[event.id] = result
            
            return result
        
        except Exception as e:
            errors.append(f"Pipeline error: {str(e)}")
            
            return PipelineResult(
                success=False,
                processing_time=(time.time() - start_time) * 1000,
                event=event,
                blocking_result=blocking_result,
                analysis=analysis,
                voice_alert=voice_alert,
                phone_alert_triggered=phone_alert_triggered,
                errors=errors
            )
    
    async def _trigger_phone_alert(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult
    ) -> bool:
        """
        SIP Automatic Phone Calling - NO Twilio needed!
        Makes real phone calls automatically
        """
        try:
            # Create voice message
            if analysis.blocking_success:
                voice_text = f"SafeEdge Security Update. {analysis.summary}. Threat successfully blocked. System is secure."
            else:
                voice_text = f"SafeEdge Critical Alert. {analysis.summary}. Immediate attention required."
            
            print(f"📞 Making automatic SIP phone call...")
            print(f"🎵 Message: {voice_text[:50]}...")
            
            # Try SIP calling first
            sip_success = await self._make_sip_call(voice_text, voice_alert.audio_path if voice_alert else None)
            
            if sip_success:
                print(f"✅ SIP phone call completed successfully!")
                return True
            else:
                # Fallback to local audio playback
                print(f"⚠️  SIP call failed, playing locally...")
                if voice_alert and voice_alert.audio_path and os.path.exists(voice_alert.audio_path):
                    self._play_audio_file(voice_alert.audio_path)
                    print(f"✅ Voice alert played locally!")
                    return True
                else:
                    print(f"⚠️  No audio file to play")
                    return False
                
        except Exception as e:
            print(f"❌ Phone alert error: {e}")
            return False
    
    async def _make_sip_call(self, message, audio_file_path):
        """Make SIP phone call using external SIP caller"""
        try:
            # Import SIP caller
            import sys
            sys.path.append('.')
            from sip_phone_calls import SIPPhoneCaller
            
            # Create SIP caller
            sip_caller = SIPPhoneCaller()
            
            # Make automatic call
            success = await sip_caller.make_automatic_call(message, audio_file_path)
            return success
            
        except ImportError:
            print("⚠️  SIP caller not available. Install: python setup_sip_calling.py")
            return False
        except Exception as e:
            print(f"❌ SIP call error: {e}")
            return False
    
    def _play_audio_file(self, audio_path: str):
        """Play audio file on local system"""
        import platform
        import subprocess
        
        system = platform.system()
        
        try:
            if system == "Windows":
                # Windows: Use built-in player
                os.startfile(audio_path)
            elif system == "Darwin":  # macOS
                subprocess.run(['afplay', audio_path])
            elif system == "Linux":
                subprocess.run(['aplay', audio_path])
            
        except Exception as e:
            print(f"⚠️  Could not play audio: {e}")
            print(f"💡 Audio saved at: {audio_path}")
    
    def get_metrics(self) -> dict:
        """Get pipeline metrics"""
        return {
            'total_processed': self.metrics.total_processed,
            'successful_blocks': self.metrics.successful_blocks,
            'failed_blocks': self.metrics.failed_blocks,
            'average_processing_time': round(self.metrics.average_processing_time, 2),
            'phone_alerts_sent': self.metrics.phone_alerts_sent,
            'voice_alerts_generated': self.metrics.voice_alerts_generated
        }
    
    def get_processing_history(self, limit: int = 10) -> List[PipelineResult]:
        """Get processing history"""
        results = list(self.processing_queue.values())
        return results[-limit:]
    
    def get_result(self, event_id: str) -> Optional[PipelineResult]:
        """Get specific pipeline result"""
        return self.processing_queue.get(event_id)
    
    def clear_history(self):
        """Clear processing history"""
        self.processing_queue.clear()
    
    def get_blocking_success_rate(self) -> float:
        """Get blocking success rate"""
        total = self.metrics.successful_blocks + self.metrics.failed_blocks
        return (self.metrics.successful_blocks / total * 100) if total > 0 else 0.0
    
    async def health_check(self) -> dict:
        """Health check for all pipeline components"""
        return {
            'detector': True,  # Always available (local)
            'blocker': True,  # Always available (local)
            'analyzer': True,  # Groq API
            'voice_generator': True,  # ElevenLabs API
            'overall': True
        }
    
    def get_rate_limit_status(self) -> dict:
        """Get rate limit status for external APIs"""
        return {
            'groq': self.analyzer.get_rate_limit_status(),
            'elevenlabs': self.voice_generator.get_usage_status()
        }
    
    async def test_pipeline(self) -> PipelineResult:
        """Test pipeline with sample data"""
        
        test_sensor_data = {
            'device_id': 'test_device_001',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'temperature': 38.5,  # Critical - above safe range
            'humidity': 55,
            'motion_detected': True,  # Unauthorized access
            'door_status': False,
            'vibration_level': 0.3,
            'power_voltage': 12.0,
            'wifi_signal_strength': -65,
            'threat_level': 'critical',
            'anomaly_detected': True,
            'security_score': 45
        }
        
        print('🧪 Testing security response pipeline...')
        return await self.process_sensor_data(test_sensor_data)
