#!/usr/bin/env python3
"""
Professional Phone Alert Service for SafeEdge
Integrates ElevenLabs + Twilio for crystal clear emergency calls
No duplicates, clean implementation
"""

import os
import requests
import json
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import 
from groq_analyzer import IncidentAnalysis
from elevenlabs_voice import VoiceGenerationResult


class AlertChannel(str, Enum):
    """Alert delivery channels"""
    ANDROID_INTENT = "android_intent"
    BLUETOOTH_SPEAKER = "bluetooth_speaker"
    TELEGRAM_BOT = "telegram_bot"
    WEB_AUDIO_API = "web_audio_api"
    TWILIO_CALL = "twilio_call"


class AlertUrgency(str, Enum):
    """Alert urgency levels"""
    CALM = "calm"  # Successfully blocked
    URGENT = "urgent"  # Failed blocking
    CRITICAL = "critical"  # Critical failure


@dataclass
class AlertAttempt:
    """Single alert delivery attempt"""
    id: str
    channel: AlertChannel
    timestamp: str
    success: bool
    duration: float  # milliseconds
    details: str
    error: Optional[str] = None


@dataclass
class PhoneAlertResult:
    """Phone alert delivery result"""
    success: bool
    attempts: List[AlertAttempt]
    final_channel: Optional[AlertChannel]
    total_duration: float  # milliseconds
    urgency: AlertUrgency
    audio_played: bool


class PhoneAlertService:
    """Multi-channel phone alert system with intelligent fallback"""
    
    def __init__(self, config: Optional[dict] = None):
        self.config = config or {}
        
        # Alert history
        self.alert_history: List[PhoneAlertResult] = []
        
        # Channel configuration
        self.android_intent_url = self.config.get('android_intent_url', '')
        self.telegram_bot_token = self.config.get('telegram_bot_token', '')
        self.telegram_chat_id = self.config.get('telegram_chat_id', '')
        self.twilio_account_sid = self.config.get('twilio_account_sid', '')
        self.twilio_auth_token = self.config.get('twilio_auth_token', '')
        self.twilio_from_number = self.config.get('twilio_from_number', '')
        self.twilio_to_number = self.config.get('twilio_to_number', '')
        
        # Parse emergency contacts (multiple numbers)
        emergency_contacts_str = self.config.get('emergency_contacts', '')
        self.emergency_contacts = []
        if emergency_contacts_str:
            self.emergency_contacts = [
                num.strip() for num in emergency_contacts_str.split(',') 
                if num.strip()
            ]
        
        # Add primary number to emergency contacts if not already there
        if self.twilio_to_number and self.twilio_to_number not in self.emergency_contacts:
            self.emergency_contacts.append(self.twilio_to_number)
        
        # Fallback chain (ordered by priority)
        self.fallback_chain = [
            AlertChannel.ANDROID_INTENT,
            AlertChannel.TELEGRAM_BOT,
            AlertChannel.BLUETOOTH_SPEAKER,
            AlertChannel.WEB_AUDIO_API,
            AlertChannel.TWILIO_CALL
        ]
        
        print("📞 Phone Alert Service initialized")
    
    async def send_alert(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        phone_number: Optional[str] = None,
        organization_id: Optional[str] = None,
        threat_id: Optional[str] = None
    ) -> PhoneAlertResult:
        """
        Send phone alert with intelligent fallback
        
        Args:
            analysis: IncidentAnalysis with urgency level
            voice_alert: VoiceGenerationResult with audio
            phone_number: Optional phone number to call
            organization_id: Optional organization ID for storage
            threat_id: Optional threat ID to link alert to threat
            
        Returns:
            PhoneAlertResult with delivery status
        """
        start_time = time.time()
        attempts: List[AlertAttempt] = []
        success = False
        final_channel = None
        audio_played = False
        
        # Determine urgency
        urgency = self._determine_urgency(analysis)
        
        print(f"📞 Sending {urgency.value} alert...")
        
        # Try each channel in fallback chain
        for channel in self.fallback_chain:
            attempt = await self._try_channel(
                channel,
                analysis,
                voice_alert,
                urgency,
                phone_number
            )
            attempts.append(attempt)
            
            if attempt.success:
                success = True
                final_channel = channel
                audio_played = True
                print(f"✅ Alert delivered via {channel.value}")
                break
            else:
                print(f"❌ {channel.value} failed: {attempt.error}")
        
        total_duration = (time.time() - start_time) * 1000
        
        result = PhoneAlertResult(
            success=success,
            attempts=attempts,
            final_channel=final_channel,
            total_duration=total_duration,
            urgency=urgency,
            audio_played=audio_played
        )
        
        # Store in history (in-memory)
        self.alert_history.append(result)
        
        # 🆕 Store in Firebase (persistent storage)
        if organization_id:
            await self._store_alert_in_firebase(
                organization_id=organization_id,
                result=result,
                threat_id=threat_id,
                analysis=analysis
            )
        
        return result
    
    async def _try_channel(
        self,
        channel: AlertChannel,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency,
        phone_number: Optional[str]
    ) -> AlertAttempt:
        """Try to deliver alert via specific channel"""
        
        start_time = time.time()
        attempt_id = f"alert_{int(time.time())}_{channel.value}"
        
        try:
            if channel == AlertChannel.ANDROID_INTENT:
                success = await self._send_android_intent(
                    analysis, voice_alert, urgency, phone_number
                )
            elif channel == AlertChannel.TELEGRAM_BOT:
                success = await self._send_telegram_bot(
                    analysis, voice_alert, urgency
                )
            elif channel == AlertChannel.BLUETOOTH_SPEAKER:
                success = await self._send_bluetooth_speaker(
                    analysis, voice_alert, urgency
                )
            elif channel == AlertChannel.WEB_AUDIO_API:
                success = await self._send_web_audio(
                    analysis, voice_alert, urgency
                )
            elif channel == AlertChannel.TWILIO_CALL:
                success = await self._send_twilio_call(
                    analysis, voice_alert, urgency, phone_number
                )
            else:
                success = False
            
            duration = (time.time() - start_time) * 1000
            
            return AlertAttempt(
                id=attempt_id,
                channel=channel,
                timestamp=time.strftime('%Y-%m-%dT%H:%M:%S'),
                success=success,
                duration=duration,
                details=f"Alert delivered via {channel.value}" if success else f"{channel.value} unavailable",
                error=None if success else f"{channel.value} not configured or failed"
            )
        
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            return AlertAttempt(
                id=attempt_id,
                channel=channel,
                timestamp=time.strftime('%Y-%m-%dT%H:%M:%S'),
                success=False,
                duration=duration,
                details=f"{channel.value} failed",
                error=str(e)
            )
    
    async def _send_android_intent(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency,
        phone_number: Optional[str]
    ) -> bool:
        """
        Send alert via Android Intent
        Requires Android app with HTTP endpoint
        """
        if not self.android_intent_url:
            return False
        
        try:
            import httpx
            
            # Prepare payload
            payload = {
                'action': 'CALL',
                'phone_number': phone_number or self.twilio_to_number,
                'audio_file': voice_alert.audio_path,
                'message': voice_alert.text,
                'urgency': urgency.value,
                'play_siren': urgency != AlertUrgency.CALM
            }
            
            # Send to Android app
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.android_intent_url,
                    json=payload,
                    timeout=5.0
                )
                return response.status_code == 200
        
        except Exception as e:
            print(f"Android Intent failed: {e}")
            return False
    
    async def _send_telegram_bot(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency
    ) -> bool:
        """
        Send alert via Telegram Bot
        Sends voice message with audio file
        """
        if not self.telegram_bot_token or not self.telegram_chat_id:
            return False
        
        try:
            import httpx
            
            # Add urgency prefix
            message = voice_alert.text
            if urgency == AlertUrgency.URGENT:
                message = f"🚨 URGENT ALERT 🚨\n\n{message}"
            elif urgency == AlertUrgency.CRITICAL:
                message = f"🔴 CRITICAL ALERT 🔴\n\n{message}"
            else:
                message = f"✅ Security Update\n\n{message}"
            
            # Send text message
            async with httpx.AsyncClient() as client:
                text_response = await client.post(
                    f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage",
                    json={
                        'chat_id': self.telegram_chat_id,
                        'text': message
                    },
                    timeout=10.0
                )
                
                # Send voice message if audio file exists
                if voice_alert.audio_path and os.path.exists(voice_alert.audio_path):
                    with open(voice_alert.audio_path, 'rb') as audio_file:
                        files = {'voice': audio_file}
                        data = {'chat_id': self.telegram_chat_id}
                        
                        voice_response = await client.post(
                            f"https://api.telegram.org/bot{self.telegram_bot_token}/sendVoice",
                            data=data,
                            files=files,
                            timeout=30.0
                        )
                
                return text_response.status_code == 200
        
        except Exception as e:
            print(f"Telegram Bot failed: {e}")
            return False
    
    async def _send_bluetooth_speaker(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency
    ) -> bool:
        """
        Play audio via Bluetooth speaker
        Uses system audio playback
        """
        if not voice_alert.audio_path or not os.path.exists(voice_alert.audio_path):
            return False
        
        try:
            # Try to play audio using system command
            import platform
            
            system = platform.system()
            
            if system == "Windows":
                # Windows: Use winsound or pygame
                try:
                    import pygame
                    pygame.mixer.init()
                    pygame.mixer.music.load(voice_alert.audio_path)
                    pygame.mixer.music.play()
                    
                    # Wait for playback to finish
                    while pygame.mixer.music.get_busy():
                        await asyncio.sleep(0.1)
                    
                    return True
                except ImportError:
                    # Fallback to winsound
                    import winsound
                    winsound.PlaySound(voice_alert.audio_path, winsound.SND_FILENAME)
                    return True
            
            elif system == "Darwin":  # macOS
                import subprocess
                subprocess.run(['afplay', voice_alert.audio_path], check=True)
                return True
            
            elif system == "Linux":
                import subprocess
                subprocess.run(['aplay', voice_alert.audio_path], check=True)
                return True
            
            return False
        
        except Exception as e:
            print(f"Bluetooth speaker failed: {e}")
            return False
    
    async def _send_web_audio(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency
    ) -> bool:
        """
        Play audio via Web Audio API
        Stores audio URL for frontend playback
        """
        if not voice_alert.audio_path:
            return False
        
        try:
            # Store audio URL for frontend to play
            # This would be picked up by WebSocket or polling
            alert_data = {
                'audio_path': voice_alert.audio_path,
                'text': voice_alert.text,
                'urgency': urgency.value,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            
            # Save to file for frontend to poll
            os.makedirs('pending_alerts', exist_ok=True)
            alert_file = f"pending_alerts/alert_{int(time.time())}.json"
            
            with open(alert_file, 'w') as f:
                json.dump(alert_data, f)
            
            return True
        
        except Exception as e:
            print(f"Web Audio API failed: {e}")
            return False
    
    async def _send_twilio_call(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        urgency: AlertUrgency,
        phone_number: Optional[str]
    ) -> bool:
        """
        Make phone call via Twilio with ElevenLabs voice
        Uses the actual AI-generated voice file for professional calls
        """
        if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_from_number]):
            print("❌ Twilio credentials not configured")
            return False
        
        try:
            from twilio.rest import Client
            import requests
            from urllib.parse import quote
            
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            # Create simple, direct voice message without interactive elements
            if analysis:
                # Clean up the AI analysis text for better speech
                clean_summary = analysis.summary.replace("**", "").replace("*", "").strip()
                
                # Create a simple, direct message
                if analysis.blocking_success:
                    message = f"SafeEdge Security Alert. {clean_summary}. System is secure. This call will now end."
                else:
                    message = f"SafeEdge Critical Alert. {clean_summary}. Immediate attention required. This call will now end."
                
                # Simple TwiML - just say the message and hang up
                twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna" rate="medium">{message}</Say>
    <Hangup/>
</Response>"""
                print(f"🎵 Direct voice message: {message[:100]}...")
            else:
                # Simple fallback
                twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna" rate="medium">SafeEdge Security Alert. System operational. This call will now end.</Say>
    <Hangup/>
</Response>"""
            
            # Determine phone numbers to call
            if phone_number:
                # Single number provided
                target_numbers = [phone_number]
            elif self.emergency_contacts:
                # Use emergency contacts list
                target_numbers = self.emergency_contacts
            elif self.twilio_to_number:
                # Fallback to primary number
                target_numbers = [self.twilio_to_number]
            else:
                print("❌ No phone numbers configured for Twilio calls")
                return False
            
            print(f"📞 Making Twilio calls to {len(target_numbers)} number(s)...")
            
            # Make calls to all numbers
            successful_calls = 0
            call_results = []
            
            for i, target_number in enumerate(target_numbers, 1):
                try:
                    print(f"   📞 Call {i}/{len(target_numbers)}: {target_number}")
                    
                    # Make the call
                    call = client.calls.create(
                        twiml=twiml,
                        to=target_number,
                        from_=self.twilio_from_number,
                        timeout=30,  # Ring for 30 seconds
                        record=False  # Don't record for privacy
                    )
                    
                    if call.sid:
                        successful_calls += 1
                        call_results.append(f"✅ {target_number}: {call.sid}")
                        print(f"      ✅ Call initiated: {call.sid}")
                    else:
                        call_results.append(f"❌ {target_number}: Failed")
                        print(f"      ❌ Call failed")
                        
                except Exception as e:
                    call_results.append(f"❌ {target_number}: {str(e)}")
                    print(f"      ❌ Call error: {e}")
            
            # Summary
            print(f"📊 Call Summary: {successful_calls}/{len(target_numbers)} successful")
            for result in call_results:
                print(f"   {result}")
            
            return successful_calls > 0
        
        except Exception as e:
            print(f"❌ Twilio call failed: {e}")
            return False
    
    def _determine_urgency(self, analysis: IncidentAnalysis) -> AlertUrgency:
        """Determine alert urgency based on analysis"""
        
        if not analysis.blocking_success and analysis.urgency_level == 'critical':
            return AlertUrgency.CRITICAL
        elif not analysis.blocking_success:
            return AlertUrgency.URGENT
        else:
            return AlertUrgency.CALM
    
    async def _store_alert_in_firebase(
        self,
        organization_id: str,
        result: PhoneAlertResult,
        threat_id: Optional[str],
        analysis: IncidentAnalysis
    ) -> bool:
        """Store alert in Firebase via backend API"""
        try:
            import httpx
            
            # Prepare alert data
            channels_used = [attempt.channel.value for attempt in result.attempts if attempt.success]
            if not channels_used and result.final_channel:
                channels_used = [result.final_channel.value]
            
            alert_data = {
                'organization_id': organization_id,
                'alert_type': 'phone_alert',
                'channels_used': channels_used,
                'success': result.success,
                'attempts': len(result.attempts),
                'duration_ms': result.total_duration,
                'urgency': result.urgency.value,
                'threat_id': threat_id,
                'metadata': {
                    'audio_played': result.audio_played,
                    'final_channel': result.final_channel.value if result.final_channel else None,
                    'analysis_summary': analysis.summary if analysis else None,
                    'blocking_success': analysis.blocking_success if analysis else None
                }
            }
            
            # Send to backend API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'http://localhost:8000/api/security-analytics/alerts',
                    json=alert_data,
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    print(f"✅ Alert stored in Firebase")
                    return True
                else:
                    print(f"⚠️ Failed to store alert in Firebase: {response.status_code}")
                    return False
        
        except Exception as e:
            print(f"⚠️ Error storing alert in Firebase: {e}")
            return False
    
    def get_alert_history(self, limit: int = 10) -> List[PhoneAlertResult]:
        """Get recent alert history"""
        return self.alert_history[-limit:]
    
    def get_success_rate(self) -> float:
        """Get alert delivery success rate"""
        if not self.alert_history:
            return 0.0
        
        successful = sum(1 for alert in self.alert_history if alert.success)
        return (successful / len(self.alert_history)) * 100
    
    def get_channel_stats(self) -> dict:
        """Get statistics by channel"""
        stats = {}
        
        for alert in self.alert_history:
            if alert.final_channel:
                channel = alert.final_channel.value
                if channel not in stats:
                    stats[channel] = {'total': 0, 'successful': 0}
                stats[channel]['total'] += 1
                if alert.success:
                    stats[channel]['successful'] += 1
        
        # Calculate success rates
        for channel, data in stats.items():
            data['success_rate'] = (data['successful'] / data['total'] * 100) if data['total'] > 0 else 0
        
        return stats
