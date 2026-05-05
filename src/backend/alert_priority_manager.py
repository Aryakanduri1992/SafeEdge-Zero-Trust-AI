"""
Alert Priority Manager (Python)
Task 4.2: Differentiated alert system with intelligent fallback
Handles escalation based on blocking success/failure
"""

from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
import time

from groq_analyzer import IncidentAnalysis
from elevenlabs_voice import VoiceGenerationResult
from phone_alert_service import PhoneAlertService, PhoneAlertResult, AlertUrgency


class EscalationLevel(str, Enum):
    """Escalation levels"""
    LEVEL_1 = "level_1"  # Calm notification
    LEVEL_2 = "level_2"  # Urgent alert
    LEVEL_3 = "level_3"  # Critical escalation
    LEVEL_4 = "level_4"  # Emergency broadcast


@dataclass
class EscalationRule:
    """Escalation rule definition"""
    level: EscalationLevel
    trigger_condition: str
    retry_count: int
    retry_delay: float  # seconds
    channels: List[str]
    add_siren: bool


@dataclass
class AlertEscalation:
    """Alert escalation result"""
    id: str
    timestamp: str
    initial_level: EscalationLevel
    final_level: EscalationLevel
    escalation_count: int
    total_attempts: int
    success: bool
    duration: float  # milliseconds


class AlertPriorityManager:
    """Manages alert prioritization and escalation"""
    
    def __init__(self, phone_alert_service: PhoneAlertService):
        self.phone_service = phone_alert_service
        
        # Escalation rules
        self.escalation_rules = {
            EscalationLevel.LEVEL_1: EscalationRule(
                level=EscalationLevel.LEVEL_1,
                trigger_condition="blocking_success == True",
                retry_count=2,
                retry_delay=5.0,
                channels=['telegram_bot', 'web_audio_api'],
                add_siren=False
            ),
            EscalationLevel.LEVEL_2: EscalationRule(
                level=EscalationLevel.LEVEL_2,
                trigger_condition="blocking_success == False",
                retry_count=3,
                retry_delay=3.0,
                channels=['android_intent', 'telegram_bot', 'bluetooth_speaker'],
                add_siren=True
            ),
            EscalationLevel.LEVEL_3: EscalationRule(
                level=EscalationLevel.LEVEL_3,
                trigger_condition="urgency_level == 'critical'",
                retry_count=5,
                retry_delay=2.0,
                channels=['android_intent', 'twilio_call', 'telegram_bot', 'bluetooth_speaker'],
                add_siren=True
            ),
            EscalationLevel.LEVEL_4: EscalationRule(
                level=EscalationLevel.LEVEL_4,
                trigger_condition="failed_attempts >= 3",
                retry_count=10,
                retry_delay=1.0,
                channels=['android_intent', 'twilio_call', 'telegram_bot', 'bluetooth_speaker', 'web_audio_api'],
                add_siren=True
            )
        }
        
        # Escalation history
        self.escalation_history: List[AlertEscalation] = []
    
    async def send_prioritized_alert(
        self,
        analysis: IncidentAnalysis,
        voice_alert: VoiceGenerationResult,
        phone_number: Optional[str] = None
    ) -> AlertEscalation:
        """
        Send alert with intelligent prioritization and escalation
        
        Args:
            analysis: IncidentAnalysis with urgency info
            voice_alert: VoiceGenerationResult with audio
            phone_number: Optional phone number
            
        Returns:
            AlertEscalation with delivery status
        """
        start_time = time.time()
        escalation_id = f"esc_{int(time.time())}"
        
        # Determine initial escalation level
        initial_level = self._determine_escalation_level(analysis)
        current_level = initial_level
        
        print(f"📊 Alert priority: {initial_level.value}")
        
        total_attempts = 0
        escalation_count = 0
        success = False
        
        # Try sending with current level
        for attempt in range(self.escalation_rules[current_level].retry_count):
            total_attempts += 1
            
            # Send alert
            result = await self.phone_service.send_alert(
                analysis,
                voice_alert,
                phone_number
            )
            
            if result.success:
                success = True
                break
            
            # Wait before retry
            if attempt < self.escalation_rules[current_level].retry_count - 1:
                await self._delay(self.escalation_rules[current_level].retry_delay)
        
        # Escalate if not successful
        if not success:
            escalation_count += 1
            current_level = self._escalate_level(current_level)
            
            print(f"⬆️  Escalating to {current_level.value}")
            
            # Try with escalated level
            for attempt in range(self.escalation_rules[current_level].retry_count):
                total_attempts += 1
                
                result = await self.phone_service.send_alert(
                    analysis,
                    voice_alert,
                    phone_number
                )
                
                if result.success:
                    success = True
                    break
                
                if attempt < self.escalation_rules[current_level].retry_count - 1:
                    await self._delay(self.escalation_rules[current_level].retry_delay)
        
        duration = (time.time() - start_time) * 1000
        
        escalation = AlertEscalation(
            id=escalation_id,
            timestamp=time.strftime('%Y-%m-%dT%H:%M:%S'),
            initial_level=initial_level,
            final_level=current_level,
            escalation_count=escalation_count,
            total_attempts=total_attempts,
            success=success,
            duration=duration
        )
        
        self.escalation_history.append(escalation)
        
        return escalation
    
    def _determine_escalation_level(self, analysis: IncidentAnalysis) -> EscalationLevel:
        """Determine initial escalation level based on analysis"""
        
        # Critical urgency = Level 3
        if analysis.urgency_level == 'critical':
            return EscalationLevel.LEVEL_3
        
        # Failed blocking = Level 2
        if not analysis.blocking_success:
            return EscalationLevel.LEVEL_2
        
        # Successful blocking = Level 1
        return EscalationLevel.LEVEL_1
    
    def _escalate_level(self, current_level: EscalationLevel) -> EscalationLevel:
        """Escalate to next level"""
        
        escalation_map = {
            EscalationLevel.LEVEL_1: EscalationLevel.LEVEL_2,
            EscalationLevel.LEVEL_2: EscalationLevel.LEVEL_3,
            EscalationLevel.LEVEL_3: EscalationLevel.LEVEL_4,
            EscalationLevel.LEVEL_4: EscalationLevel.LEVEL_4  # Max level
        }
        
        return escalation_map.get(current_level, EscalationLevel.LEVEL_4)
    
    async def _delay(self, seconds: float):
        """Async delay"""
        import asyncio
        await asyncio.sleep(seconds)
    
    def generate_calm_alert_script(self, analysis: IncidentAnalysis) -> str:
        """Generate calm alert script for successful blocking"""
        return (
            f"Patient safe. {analysis.summary} "
            f"Threat has been neutralized. All systems operating normally. "
            f"No further action required at this time."
        )
    
    def generate_urgent_alert_script(self, analysis: IncidentAnalysis) -> str:
        """Generate urgent alert script for failed blocking"""
        return (
            f"[SIREN SOUND] Critical security alert. {analysis.summary} "
            f"Immediate response required. Security team has been notified. "
            f"Please verify patient safety immediately. [SIREN SOUND]"
        )
    
    def get_escalation_stats(self) -> dict:
        """Get escalation statistics"""
        if not self.escalation_history:
            return {
                'total_escalations': 0,
                'successful_deliveries': 0,
                'average_attempts': 0,
                'escalation_rate': 0
            }
        
        total = len(self.escalation_history)
        successful = sum(1 for esc in self.escalation_history if esc.success)
        escalated = sum(1 for esc in self.escalation_history if esc.escalation_count > 0)
        total_attempts = sum(esc.total_attempts for esc in self.escalation_history)
        
        return {
            'total_escalations': total,
            'successful_deliveries': successful,
            'average_attempts': total_attempts / total if total > 0 else 0,
            'escalation_rate': (escalated / total * 100) if total > 0 else 0,
            'success_rate': (successful / total * 100) if total > 0 else 0
        }
    
    def get_level_distribution(self) -> dict:
        """Get distribution of escalation levels"""
        distribution = {
            'level_1': 0,
            'level_2': 0,
            'level_3': 0,
            'level_4': 0
        }
        
        for esc in self.escalation_history:
            distribution[esc.final_level.value] += 1
        
        return distribution
