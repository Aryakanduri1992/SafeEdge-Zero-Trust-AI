#!/usr/bin/env python3
"""
Voice Alert Service for SafeEdge Backend
✅ Integrated with main.py FastAPI backend
✅ Handles Twilio trial messages properly
✅ Crystal clear hospital security alerts
✅ Perfect for security demonstrations
"""

import os
import requests
import json
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

@dataclass
class VoiceAlertResult:
    """Result of voice alert operation"""
    success: bool
    call_sid: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: int = 0
    voice_quality: str = "Twilio Polly Neural"
    phone_number: Optional[str] = None

class VoiceAlertService:
    """Voice alert service for SafeEdge security system"""
    
    def __init__(self, 
                 twilio_account_sid: Optional[str] = None,
                 twilio_auth_token: Optional[str] = None,
                 twilio_from_number: Optional[str] = None,
                 emergency_contacts: Optional[str] = None):
        
        # Twilio Configuration
        self.twilio_sid = twilio_account_sid or os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = twilio_auth_token or os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_from = twilio_from_number or os.getenv('TWILIO_FROM_NUMBER')
        
        # Emergency contacts
        contacts_str = emergency_contacts or os.getenv('EMERGENCY_CONTACTS', '')
        self.emergency_contacts = [c.strip() for c in contacts_str.split(',') if c.strip()]
        
        # Call history and metrics
        self.call_history: List[VoiceAlertResult] = []
        self.total_calls = 0
        self.successful_calls = 0
        
        print(f"🎙️  Voice Alert Service Initialized")
        print(f"📞 Twilio: {'✅ Ready' if self.is_configured() else '❌ Not Configured'}")
        print(f"📱 Emergency Contacts: {len(self.emergency_contacts)}")
    
    def is_configured(self) -> bool:
        """Check if Twilio is properly configured"""
        return all([self.twilio_sid, self.twilio_token, self.twilio_from])
    
    def create_hospital_twiml(self, message: str) -> str:
        """Create TwiML optimized for hospital security alerts"""
        
        # Clean, professional TwiML for hospital environments
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        SAFEEDGE HOSPITAL SECURITY ALERT.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        {message}
    </Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        Press 1 to acknowledge this security alert. Press 2 to repeat the message. Press 3 to escalate to security team.
    </Say>
    <Gather numDigits="1" timeout="20">
        <Say voice="Polly.Joanna-Neural" language="en-US">
            Please press 1 to acknowledge, 2 to repeat, or 3 to escalate.
        </Say>
    </Gather>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        No response received. This security alert has been logged. Please check your SafeEdge dashboard immediately. Goodbye.
    </Say>
</Response>"""
        
        return twiml
    
    def make_voice_call(self, phone_number: str, message: str) -> VoiceAlertResult:
        """Make a single voice call"""
        start_time = time.time()
        
        try:
            if not self.is_configured():
                return VoiceAlertResult(
                    success=False,
                    error_message="Twilio not configured",
                    processing_time_ms=int((time.time() - start_time) * 1000),
                    phone_number=phone_number
                )
            
            # Create hospital-optimized TwiML
            twiml = self.create_hospital_twiml(message)
            
            # Make Twilio API call
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Calls.json"
            
            data = {
                'To': phone_number,
                'From': self.twilio_from,
                'Twiml': twiml
            }
            
            response = requests.post(
                url,
                data=data,
                auth=(self.twilio_sid, self.twilio_token),
                timeout=30
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            if response.status_code == 201:
                call_data = response.json()
                result = VoiceAlertResult(
                    success=True,
                    call_sid=call_data.get('sid'),
                    processing_time_ms=processing_time,
                    phone_number=phone_number
                )
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', 'Unknown Twilio error')
                except:
                    error_message = response.text
                
                result = VoiceAlertResult(
                    success=False,
                    error_message=error_message,
                    processing_time_ms=processing_time,
                    phone_number=phone_number
                )
            
            # Update metrics
            self.total_calls += 1
            if result.success:
                self.successful_calls += 1
            
            # Store in history
            self.call_history.append(result)
            
            return result
                
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            result = VoiceAlertResult(
                success=False,
                error_message=str(e),
                processing_time_ms=processing_time,
                phone_number=phone_number
            )
            
            self.total_calls += 1
            self.call_history.append(result)
            
            return result
    
    def send_security_alert(self, 
                          threat_type: str, 
                          severity: str, 
                          details: str,
                          device_id: Optional[str] = None,
                          location: Optional[str] = None) -> Dict[str, Any]:
        """Send security alert to all emergency contacts"""
        
        timestamp = datetime.now().strftime('%H:%M on %B %d')
        device_info = f"device {device_id}" if device_id else "system"
        location_info = f" in {location}" if location else ""
        
        # Hospital-focused security alert messages
        alert_templates = {
            'temperature_attack': f"CRITICAL PATIENT SAFETY ALERT. Temperature attack on {device_info}{location_info} detected and blocked at {timestamp}. Patient safety maintained. Normal temperature restored. {details}",
            
            'power_attack': f"EMERGENCY INFRASTRUCTURE ALERT. Power system attack on {device_info}{location_info} blocked at {timestamp}. All life support systems operational. Backup power activated. {details}",
            
            'unauthorized_access': f"SECURITY BREACH PREVENTED. Unauthorized access to {device_info}{location_info} blocked at {timestamp}. All patient areas remain secure. {details}",
            
            'network_intrusion': f"CYBER ATTACK STOPPED. Network intrusion targeting {device_info}{location_info} prevented at {timestamp}. All medical systems protected. {details}",
            
            'malware': f"MALWARE THREAT ELIMINATED. Virus attack on {device_info}{location_info} stopped at {timestamp}. All patient data secure. System quarantined. {details}",
            
            'brute_force': f"HACKING ATTEMPT BLOCKED. Multiple unauthorized login attempts on {device_info}{location_info} prevented at {timestamp}. System remains secure. {details}",
            
            'motion_detected': f"PHYSICAL SECURITY ALERT. Unauthorized movement detected near {device_info}{location_info} at {timestamp}. Security protocols activated. {details}",
            
            'vibration_alert': f"TAMPERING ALERT. Physical interference with {device_info}{location_info} detected at {timestamp}. Device secured and monitored. {details}",
            
            'system_compromise': f"SYSTEM ATTACK PREVENTED. Attempt to compromise {device_info}{location_info} blocked at {timestamp}. All systems secure and operational. {details}",
            
            'data_breach': f"DATA BREACH PREVENTED. Attempt to access patient data on {device_info}{location_info} blocked at {timestamp}. All information remains secure. {details}"
        }
        
        message = alert_templates.get(threat_type, f"SECURITY ALERT. {threat_type} detected on {device_info}{location_info} at {timestamp}. Threat neutralized. {details}")
        
        if not self.emergency_contacts:
            return {
                "success": False,
                "error": "No emergency contacts configured",
                "calls_made": 0,
                "calls_successful": 0,
                "message": message
            }
        
        # Make calls to all emergency contacts
        results = []
        successful_calls = 0
        
        for contact in self.emergency_contacts:
            result = self.make_voice_call(contact, message)
            
            results.append({
                "phone_number": contact,
                "success": result.success,
                "call_sid": result.call_sid,
                "error": result.error_message,
                "processing_time_ms": result.processing_time_ms
            })
            
            if result.success:
                successful_calls += 1
            
            # Brief pause between calls to avoid rate limits
            time.sleep(2)
        
        return {
            "success": successful_calls > 0,
            "threat_type": threat_type,
            "severity": severity,
            "device_id": device_id,
            "location": location,
            "timestamp": timestamp,
            "message": message,
            "calls_made": len(self.emergency_contacts),
            "calls_successful": successful_calls,
            "success_rate": round((successful_calls / len(self.emergency_contacts)) * 100, 1),
            "results": results
        }
    
    def send_custom_alert(self, message: str, phone_number: Optional[str] = None) -> VoiceAlertResult:
        """Send custom alert message"""
        
        if phone_number:
            return self.make_voice_call(phone_number, message)
        elif self.emergency_contacts:
            return self.make_voice_call(self.emergency_contacts[0], message)
        else:
            return VoiceAlertResult(
                success=False,
                error_message="No phone number or emergency contacts configured"
            )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get voice alert service metrics"""
        success_rate = (self.successful_calls / self.total_calls * 100) if self.total_calls > 0 else 0
        
        return {
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.total_calls - self.successful_calls,
            "success_rate": round(success_rate, 1),
            "emergency_contacts_count": len(self.emergency_contacts),
            "is_configured": self.is_configured(),
            "service_status": "Ready" if self.is_configured() else "Not Configured"
        }
    
    def get_call_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent call history"""
        recent_calls = self.call_history[-limit:] if limit > 0 else self.call_history
        
        return [
            {
                "phone_number": call.phone_number,
                "success": call.success,
                "call_sid": call.call_sid,
                "error": call.error_message,
                "processing_time_ms": call.processing_time_ms,
                "voice_quality": call.voice_quality
            }
            for call in recent_calls
        ]
    
    def test_system(self) -> Dict[str, Any]:
        """Test the voice alert system"""
        
        if not self.is_configured():
            return {
                "success": False,
                "error": "Voice alert system not configured",
                "configuration_status": self.get_metrics()
            }
        
        if not self.emergency_contacts:
            return {
                "success": False,
                "error": "No emergency contacts configured",
                "configuration_status": self.get_metrics()
            }
        
        test_message = "This is a SafeEdge system test. All hospital security systems are functioning normally. Patient safety is maintained. Voice alert delivery confirmed."
        
        # Test with first emergency contact
        result = self.make_voice_call(self.emergency_contacts[0], test_message)
        
        return {
            "success": result.success,
            "test_contact": self.emergency_contacts[0],
            "call_sid": result.call_sid,
            "error": result.error_message,
            "processing_time_ms": result.processing_time_ms,
            "voice_quality": result.voice_quality,
            "message": "Voice alert system test completed"
        }

# Global instance for use in main.py
voice_alert_service: Optional[VoiceAlertService] = None

def initialize_voice_service(
    twilio_account_sid: Optional[str] = None,
    twilio_auth_token: Optional[str] = None,
    twilio_from_number: Optional[str] = None,
    emergency_contacts: Optional[str] = None
) -> VoiceAlertService:
    """Initialize the global voice alert service"""
    global voice_alert_service
    
    voice_alert_service = VoiceAlertService(
        twilio_account_sid=twilio_account_sid,
        twilio_auth_token=twilio_auth_token,
        twilio_from_number=twilio_from_number,
        emergency_contacts=emergency_contacts
    )
    
    return voice_alert_service

def get_voice_service() -> Optional[VoiceAlertService]:
    """Get the global voice alert service instance"""
    return voice_alert_service