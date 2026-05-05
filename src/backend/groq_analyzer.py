"""
Groq AI Analyzer (Python)
Task 3.2: Integrate Groq API for intelligent incident analysis
Uses native Groq Python SDK with LLaMA 3.3 70B
"""

from dataclasses import dataclass
from typing import List
import time
import asyncio

from groq import Groq

from security_event_detector import SecurityEvent
from attack_blocker import CountermeasureResult


@dataclass
class IncidentAnalysis:
    """AI-generated incident analysis"""
    id: str
    event_id: str
    timestamp: str
    summary: str
    detailed_analysis: str
    recommendations: List[str]
    confidence_score: int  # 0-100
    urgency_level: str  # 'low', 'medium', 'high', 'critical'
    voice_script: str  # For ElevenLabs
    blocking_success: bool


class GroqAnalyzer:
    """Intelligent incident analysis using Groq API"""
    
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model
        self.max_tokens = 500
        self.temperature = 0.7
        
        # Rate limiting (30 requests/minute free tier)
        self.request_count = 0
        self.last_request_time = time.time()
        self.rate_limit_per_minute = 30
    
    async def analyze_incident(
        self,
        event: SecurityEvent,
        blocking_result: CountermeasureResult
    ) -> IncidentAnalysis:
        """
        Analyze security incident with blocking context
        
        Args:
            event: SecurityEvent that occurred
            blocking_result: Result of blocking attempts
            
        Returns:
            IncidentAnalysis with AI-generated insights
        """
        # Rate limiting check
        await self._check_rate_limit()
        
        # Build prompt based on blocking success
        prompt = self._build_prompt(event, blocking_result)
        system_prompt = self._get_system_prompt(blocking_result.blocked)
        
        try:
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse AI response
            return self._parse_analysis(event, blocking_result, analysis_text)
        
        except Exception as e:
            print(f"Groq API analysis failed: {e}")
            # Fallback to rule-based analysis
            return self._fallback_analysis(event, blocking_result)
    
    def _build_prompt(
        self,
        event: SecurityEvent,
        blocking_result: CountermeasureResult
    ) -> str:
        """Build prompt with blocking success/failure context"""
        
        blocking_status = "SUCCESSFULLY BLOCKED" if blocking_result.blocked else "BLOCKING FAILED"
        
        attempts_text = "\n".join([
            f"- {attempt.strategy.value}: {'SUCCESS' if attempt.success else 'FAILED'} ({attempt.duration:.0f}ms)"
            for attempt in blocking_result.attempts
            if attempt.duration is not None
        ]) if blocking_result.attempts else "No blocking attempts recorded"
        
        sensor_data = event.sensor_data
        
        # Safe formatting for sensor data
        temp = sensor_data.get('temperature')
        humidity = sensor_data.get('humidity')
        vibration = sensor_data.get('vibration_level')
        power_voltage = sensor_data.get('power_voltage')
        wifi_signal = sensor_data.get('wifi_signal_strength')
        
        temp_str = f"{temp:.1f}" if temp is not None else "N/A"
        humidity_str = f"{humidity:.1f}" if humidity is not None else "N/A"
        vibration_str = f"{vibration:.2f}" if vibration is not None else "N/A"
        power_str = f"{power_voltage:.1f}" if power_voltage is not None else "N/A"
        wifi_str = f"{wifi_signal}" if wifi_signal is not None else "N/A"
        
        prompt = f"""
HOSPITAL INCUBATOR SECURITY INCIDENT - {blocking_status}

Device: {event.device_id}
Threat Type: {event.threat_type.value}
Threat Level: {event.threat_level.value}
Anomaly Score: {event.anomaly_score}/100

SENSOR DATA:
- Temperature: {temp_str}°C (safe: 36.5-37.5°C)
- Humidity: {humidity_str}% (safe: 50-60%)
- Motion Detected: {'YES' if sensor_data.get('motion_detected') else 'NO'}
- Door Status: {'OPEN' if sensor_data.get('door_status') else 'CLOSED'}
- Vibration: {vibration_str}g (max: 0.5g)
- Power: {power_str}V (min: 11V)
- WiFi Signal: {wifi_str}dBm

BLOCKING ATTEMPTS:
{attempts_text}

FINAL STATUS: {blocking_result.final_status.upper()}
Human Intervention Required: {'YES' if blocking_result.requires_human_intervention else 'NO'}

Provide:
1. Brief summary (1 sentence)
2. Detailed analysis (2-3 sentences)
3. Recommendations (2-3 bullet points)
4. Voice script for phone alert (1-2 sentences, {'calm and reassuring' if blocking_result.blocked else 'urgent and directive'})
5. Confidence score (0-100)
""".strip()
        
        return prompt
    
    def _get_system_prompt(self, blocked: bool) -> str:
        """Get system prompt based on blocking success"""
        
        if blocked:
            return """You are Jarvis, an AI security analyst for hospital incubator protection systems. 
A security threat was SUCCESSFULLY BLOCKED. Provide calm, reassuring analysis that emphasizes patient safety is maintained. 
Use professional medical terminology. Keep voice scripts calm and confident."""
        else:
            return """You are Jarvis, an AI security analyst for hospital incubator protection systems. 
A security threat COULD NOT BE FULLY BLOCKED. Provide urgent, directive analysis that emphasizes immediate action needed. 
Use professional medical terminology. Keep voice scripts urgent but not panic-inducing."""
    
    def _parse_analysis(
        self,
        event: SecurityEvent,
        blocking_result: CountermeasureResult,
        analysis_text: str
    ) -> IncidentAnalysis:
        """Parse AI response into structured analysis"""
        
        lines = [line.strip() for line in analysis_text.split('\n') if line.strip()]
        
        summary = ""
        detailed_analysis = ""
        recommendations: List[str] = []
        voice_script = ""
        confidence_score = 85
        
        # Simple parsing
        current_section = ""
        for line in lines:
            lower = line.lower()
            
            if 'summary' in lower or line.startswith('1.'):
                current_section = 'summary'
                summary = line.split(':', 1)[-1].strip() if ':' in line else line.replace('1.', '').strip()
            elif 'analysis' in lower or line.startswith('2.'):
                current_section = 'analysis'
                detailed_analysis = line.split(':', 1)[-1].strip() if ':' in line else line.replace('2.', '').strip()
            elif 'recommendation' in lower or line.startswith('3.'):
                current_section = 'recommendations'
            elif 'voice' in lower or line.startswith('4.'):
                current_section = 'voice'
                voice_script = line.split(':', 1)[-1].strip() if ':' in line else line.replace('4.', '').strip()
            elif 'confidence' in lower or line.startswith('5.'):
                import re
                match = re.search(r'(\d+)', line)
                if match:
                    confidence_score = int(match.group(1))
            else:
                # Append to current section
                if current_section == 'summary' and not summary:
                    summary = line
                elif current_section == 'analysis':
                    detailed_analysis += ' ' + line
                elif current_section == 'recommendations' and line.startswith('-'):
                    recommendations.append(line.replace('-', '').strip())
                elif current_section == 'voice' and not voice_script:
                    voice_script = line
        
        # Fallback values
        if not summary:
            summary = (
                f"{event.threat_type.value} successfully blocked. Patient safety maintained."
                if blocking_result.blocked else
                f"{event.threat_type.value} blocking failed. Immediate intervention required."
            )
        
        if not voice_script:
            voice_script = (
                "Patient safe. Threat neutralized. All systems operating normally."
                if blocking_result.blocked else
                "Critical alert. Security breach in progress. Immediate response required."
            )
        
        if not recommendations:
            recommendations = [
                "Monitor device status continuously",
                "Verify patient safety parameters",
                "Document incident for review"
            ]
        
        return IncidentAnalysis(
            id=f"ana_{int(time.time())}_{event.id[-4:]}",
            event_id=event.id,
            timestamp=event.timestamp,
            summary=summary.strip(),
            detailed_analysis=detailed_analysis.strip(),
            recommendations=recommendations,
            confidence_score=min(max(confidence_score, 0), 100),
            urgency_level=self._determine_urgency(event, blocking_result),
            voice_script=voice_script.strip(),
            blocking_success=blocking_result.blocked
        )
    
    def _fallback_analysis(
        self,
        event: SecurityEvent,
        blocking_result: CountermeasureResult
    ) -> IncidentAnalysis:
        """Fallback analysis when API fails"""
        
        blocked = blocking_result.blocked
        
        return IncidentAnalysis(
            id=f"ana_{int(time.time())}_{event.id[-4:]}",
            event_id=event.id,
            timestamp=event.timestamp,
            summary=(
                f"{event.threat_type.value} detected and successfully blocked. Patient safety maintained."
                if blocked else
                f"{event.threat_type.value} detected but blocking failed. Immediate intervention required."
            ),
            detailed_analysis=event.description,
            recommendations=[
                "Continue monitoring device status",
                "Verify all safety parameters are within normal range",
                "Document incident for security review"
            ] if blocked else [
                "Immediate manual intervention required",
                "Isolate affected device from network",
                "Contact security team and medical staff",
                "Activate backup systems manually"
            ],
            confidence_score=75,
            urgency_level=self._determine_urgency(event, blocking_result),
            voice_script=(
                "Patient safe. Security threat neutralized. All incubator systems operating normally."
                if blocked else
                "Critical security alert. Threat blocking failed. Immediate manual intervention required. Patient safety at risk."
            ),
            blocking_success=blocked
        )
    
    def _determine_urgency(
        self,
        event: SecurityEvent,
        blocking_result: CountermeasureResult
    ) -> str:
        """Determine urgency level"""
        
        if not blocking_result.blocked and event.threat_level.value == 'critical':
            return 'critical'
        if not blocking_result.blocked:
            return 'high'
        if event.threat_level.value == 'critical':
            return 'high'
        if event.threat_level.value == 'warning':
            return 'medium'
        return 'low'
    
    async def _check_rate_limit(self):
        """Check and enforce rate limiting (30 requests/minute)"""
        
        now = time.time()
        one_minute = 60
        
        # Reset counter if more than 1 minute has passed
        if now - self.last_request_time > one_minute:
            self.request_count = 0
            self.last_request_time = now
        
        # Check if we've hit the limit
        if self.request_count >= self.rate_limit_per_minute:
            wait_time = one_minute - (now - self.last_request_time)
            print(f"Groq rate limit reached. Waiting {wait_time:.1f}s...")
            await asyncio.sleep(wait_time)
            self.request_count = 0
            self.last_request_time = time.time()
        
        self.request_count += 1
    
    def get_rate_limit_status(self) -> dict:
        """Get current rate limit status"""
        
        now = time.time()
        one_minute = 60
        reset_in = max(0, one_minute - (now - self.last_request_time))
        
        return {
            'used': self.request_count,
            'limit': self.rate_limit_per_minute,
            'reset_in': reset_in
        }
