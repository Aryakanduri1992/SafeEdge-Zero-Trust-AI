"""
ElevenLabs Voice Synthesis (Python)
Task 3.3: Implement ElevenLabs voice synthesis with differentiated responses
Uses native ElevenLabs Python SDK
"""

from dataclasses import dataclass
import time
import os

from elevenlabs.client import ElevenLabs
from elevenlabs import Voice, VoiceSettings

from groq_analyzer import IncidentAnalysis


@dataclass
class VoiceGenerationResult:
    """Voice generation result"""
    id: str
    analysis_id: str
    timestamp: str
    audio_path: str  # Path to saved MP3 file
    audio_data: bytes  # Raw audio data
    text: str
    voice_type: str  # 'calm' or 'urgent'
    character_count: int
    duration: float  # milliseconds


class ElevenLabsVoice:
    """Generate voice alerts with differentiated responses"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = ElevenLabs(api_key=api_key)
        
        # Voice IDs (can be customized)
        self.calm_voice_id = "EXAVITQu4vr4xnSDxMaL"  # Sarah - calm, professional
        self.urgent_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel - clear, urgent
        
        # Character usage tracking (10,000/month free tier)
        self.character_usage = 0
        self.monthly_limit = 10000
        
        # Audio output directory
        self.audio_dir = "audio_alerts"
        os.makedirs(self.audio_dir, exist_ok=True)
    
    async def generate_voice_alert(self, analysis: IncidentAnalysis) -> VoiceGenerationResult:
        """
        Generate voice alert from incident analysis
        
        Args:
            analysis: IncidentAnalysis with voice script
            
        Returns:
            VoiceGenerationResult with audio data
        """
        # Check character limit
        self._check_character_limit(analysis.voice_script)
        
        # Select voice based on blocking success
        voice_type = 'calm' if analysis.blocking_success else 'urgent'
        voice_id = self.calm_voice_id if voice_type == 'calm' else self.urgent_voice_id
        
        # Add alert tone for urgent alerts
        final_script = analysis.voice_script
        if voice_type == 'urgent':
            final_script = f"[ALERT TONE] {final_script} [ALERT TONE]"
        
        start_time = time.time()
        
        try:
            # Generate audio using ElevenLabs
            audio_data = self.client.generate(
                text=final_script,
                voice=Voice(
                    voice_id=voice_id,
                    settings=VoiceSettings(
                        stability=0.75 if voice_type == 'calm' else 0.5,
                        similarity_boost=0.75 if voice_type == 'calm' else 0.85,
                        style=0.3 if voice_type == 'calm' else 0.7,
                        use_speaker_boost=True
                    )
                ),
                model="eleven_turbo_v2_5"
            )
            
            duration = (time.time() - start_time) * 1000
            
            # Update character usage
            self.character_usage += len(final_script)
            
            # Save audio file
            result_id = f"voice_{int(time.time())}_{analysis.id[-4:]}"
            audio_filename = f"{result_id}.mp3"
            audio_path = os.path.join(self.audio_dir, audio_filename)
            
            # Convert generator to bytes if needed
            if hasattr(audio_data, '__iter__') and not isinstance(audio_data, (bytes, bytearray)):
                audio_bytes = b''.join(audio_data)
            else:
                audio_bytes = audio_data
            
            with open(audio_path, 'wb') as f:
                f.write(audio_bytes)
            
            return VoiceGenerationResult(
                id=result_id,
                analysis_id=analysis.id,
                timestamp=analysis.timestamp,
                audio_path=audio_path,
                audio_data=audio_bytes,
                text=final_script,
                voice_type=voice_type,
                character_count=len(final_script),
                duration=duration
            )
        
        except Exception as e:
            print(f"ElevenLabs voice generation failed: {e}")
            # Fallback: return empty audio
            return self._fallback_voice_generation(analysis, voice_type, final_script)
    
    def generate_calm_script(self, analysis: IncidentAnalysis) -> str:
        """Generate calm "safe" voice script"""
        return (
            f"Patient safe. {analysis.summary} "
            f"All systems operating normally. Threat has been neutralized. "
            f"No further action required at this time."
        )
    
    def generate_urgent_script(self, analysis: IncidentAnalysis) -> str:
        """Generate urgent voice script with siren"""
        return (
            f"Critical alert. {analysis.summary} "
            f"Immediate response required. Security team has been notified. "
            f"Please verify patient safety immediately."
        )
    
    def _fallback_voice_generation(
        self,
        analysis: IncidentAnalysis,
        voice_type: str,
        text: str
    ) -> VoiceGenerationResult:
        """Fallback when API fails"""
        
        print("Using fallback voice generation (no audio)")
        
        result_id = f"voice_fallback_{int(time.time())}"
        
        return VoiceGenerationResult(
            id=result_id,
            analysis_id=analysis.id,
            timestamp=analysis.timestamp,
            audio_path="",
            audio_data=b"",
            text=text,
            voice_type=voice_type,
            character_count=len(text),
            duration=0
        )
    
    def _check_character_limit(self, text: str):
        """Check character limit (10,000/month for free tier)"""
        
        if self.character_usage + len(text) > self.monthly_limit:
            raise Exception(
                f"ElevenLabs character limit exceeded: {self.character_usage}/{self.monthly_limit} used. "
                f"Requested: {len(text)} characters."
            )
    
    def get_usage_status(self) -> dict:
        """Get character usage status"""
        
        remaining = max(0, self.monthly_limit - self.character_usage)
        percent_used = (self.character_usage / self.monthly_limit) * 100
        
        return {
            'used': self.character_usage,
            'limit': self.monthly_limit,
            'remaining': remaining,
            'percent_used': round(percent_used, 2)
        }
    
    def reset_usage(self):
        """Reset monthly usage (call at start of each month)"""
        self.character_usage = 0
