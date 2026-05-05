"""
LumeEdge Alert Service
Phone calls, notifications, and alert workflow management
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .config import get_config

logger = logging.getLogger(__name__)


class AlertService:
    """
    Handles alert notifications including phone calls via Twilio.
    Integrates with the existing TwiML setup in the project.
    """
    
    def __init__(self):
        self.config = get_config()
        self._twilio_client = None
    
    @property
    def twilio_client(self):
        """Lazy-load Twilio client"""
        if self._twilio_client is None and self.config.has_twilio_config():
            try:
                from twilio.rest import Client
                self._twilio_client = Client(
                    self.config.twilio_account_sid,
                    self.config.twilio_auth_token
                )
            except ImportError:
                logger.warning("Twilio package not installed")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        return self._twilio_client
    
    def trigger_alert(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main alert trigger method.
        Determines alert type based on severity and triggers appropriate notifications.
        
        Args:
            event: Security event dictionary with severity, title, description, etc.
        
        Returns:
            Dictionary with alert status and details
        """
        severity = event.get('severity', 'medium')
        device_id = event.get('device_id', 'unknown')
        title = event.get('title', 'Security Alert')
        
        result = {
            'alert_triggered': True,
            'timestamp': datetime.utcnow().isoformat(),
            'severity': severity,
            'notifications': []
        }
        
        # Critical/High severity: Phone call + notification
        if severity in ['critical', 'high'] and self.config.enable_phone_alerts:
            call_result = self.make_phone_call(event)
            result['notifications'].append({
                'type': 'phone_call',
                'success': call_result.get('success', False),
                'details': call_result
            })
        
        # All severities: Log the alert
        logger.warning(
            f"SECURITY ALERT [{severity.upper()}] - Device: {device_id} - {title}"
        )
        result['notifications'].append({
            'type': 'log',
            'success': True
        })
        
        return result
    
    def make_phone_call(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger phone call alert via Twilio.
        Uses TwiML for voice message.
        
        Args:
            event: Security event with details for the voice message
        
        Returns:
            Call result dictionary
        """
        if not self.config.has_twilio_config():
            return {
                'success': False,
                'error': 'Twilio not configured'
            }
        
        if not self.twilio_client:
            return {
                'success': False,
                'error': 'Twilio client initialization failed'
            }
        
        try:
            # Build TwiML message
            severity = event.get('severity', 'unknown')
            device_id = event.get('device_id', 'unknown')
            attack_type = event.get('attack_type', 'security threat')
            title = event.get('title', 'Security Alert')
            
            twiml_message = f"""
            <Response>
                <Say voice="alice">
                    LumeEdge Security Alert. Priority: {severity}.
                    Device {device_id} has detected a {attack_type}.
                    {title}.
                    Please check your dashboard immediately.
                </Say>
                <Pause length="1"/>
                <Say voice="alice">
                    Press 1 to acknowledge this alert.
                    Press 2 to block the device.
                </Say>
                <Gather numDigits="1" action="/api/alert-response" method="POST">
                    <Say>Please enter your response.</Say>
                </Gather>
            </Response>
            """
            
            # Make the call
            call = self.twilio_client.calls.create(
                to=self.config.alert_phone_number,
                from_=self.config.twilio_phone_number,
                twiml=twiml_message.strip()
            )
            
            logger.info(f"Phone alert triggered: SID={call.sid}")
            
            return {
                'success': True,
                'call_sid': call.sid,
                'to': self.config.alert_phone_number,
                'status': call.status
            }
            
        except Exception as e:
            logger.error(f"Phone call failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_sms(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send SMS alert via Twilio.
        
        Args:
            event: Security event with details
        
        Returns:
            SMS result dictionary
        """
        if not self.config.has_twilio_config():
            return {
                'success': False,
                'error': 'Twilio not configured'
            }
        
        if not self.twilio_client:
            return {
                'success': False,
                'error': 'Twilio client initialization failed'
            }
        
        try:
            severity = event.get('severity', 'unknown')
            device_id = event.get('device_id', 'unknown')
            title = event.get('title', 'Security Alert')
            
            message_body = (
                f"🚨 LumeEdge Alert [{severity.upper()}]\n"
                f"Device: {device_id}\n"
                f"{title}\n"
                f"Check dashboard for details."
            )
            
            message = self.twilio_client.messages.create(
                to=self.config.alert_phone_number,
                from_=self.config.twilio_phone_number,
                body=message_body
            )
            
            logger.info(f"SMS alert sent: SID={message.sid}")
            
            return {
                'success': True,
                'message_sid': message.sid,
                'to': self.config.alert_phone_number,
                'status': message.status
            }
            
        except Exception as e:
            logger.error(f"SMS failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }


class AlertWorkflow:
    """
    Orchestrates the complete alert workflow:
    1. Block device (if required)
    2. Store security event
    3. Trigger notifications
    """
    
    def __init__(self, database, alert_service: Optional[AlertService] = None):
        self.db = database
        self.alert_service = alert_service or AlertService()
    
    def execute(self, anomaly_result: Dict[str, Any], 
                telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete alert workflow.
        
        Args:
            anomaly_result: Result from AnomalyDetector
            telemetry: Original telemetry data
        
        Returns:
            Workflow execution result
        """
        device_id = telemetry.get('device_id')
        result = {
            'workflow_executed': True,
            'device_id': device_id,
            'actions': []
        }
        
        # Step 1: Block device if required
        if anomaly_result.get('should_block', False):
            block_reason = anomaly_result.get('description', 'Anomaly detected')
            blocked = self.db.block_device(device_id, block_reason)
            result['actions'].append({
                'action': 'block_device',
                'success': blocked,
                'reason': block_reason
            })
            logger.warning(f"Device {device_id} BLOCKED: {block_reason}")
        else:
            # Reduce trust score for non-blocking anomalies
            self.db.update_trust_score(device_id, -5)
            result['actions'].append({
                'action': 'reduce_trust_score',
                'delta': -5
            })
        
        # Step 2: Store security event
        event = {
            'device_id': device_id,
            'event_type': 'anomaly_detected',
            'severity': anomaly_result.get('severity', 'medium'),
            'category': 'security',
            'title': anomaly_result.get('description', 'Anomaly detected'),
            'description': f"Rule: {anomaly_result.get('rule_id')}. Score: {anomaly_result.get('anomaly_score')}",
            'attack_type': anomaly_result.get('anomaly_type'),
            'confidence_score': anomaly_result.get('anomaly_score'),
            'action_taken': 'blocked' if anomaly_result.get('should_block') else 'monitored',
            'raw_data': str(telemetry)[:4000]
        }
        
        event_id = self.db.insert_security_event(event)
        result['actions'].append({
            'action': 'store_security_event',
            'event_id': event_id
        })
        
        # Step 3: Trigger alerts
        if anomaly_result.get('should_alert', False):
            event['event_id'] = event_id
            alert_result = self.alert_service.trigger_alert(event)
            result['actions'].append({
                'action': 'trigger_alert',
                'result': alert_result
            })
            
            # Mark alert as sent in database
            phone_call = anomaly_result.get('should_call', False)
            self.db.mark_alert_sent(event_id, phone_call)
        
        return result
