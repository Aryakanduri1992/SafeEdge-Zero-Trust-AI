"""
LumeEdge IoT Hub Trigger Function
Zero-Trust IoT Security Platform - Event Hub Compatible Endpoint

Architecture:
    ESP32 → Azure IoT Hub → This Function → Azure SQL (aggregated only)

Flow:
1. Receive message from IoT Hub (Event Hub trigger)
2. Validate device ID (Zero-Trust allowlist)
3. Validate payload schema (strict, no extra fields)
4. Check timestamp sanity (clock skew, replay indicators)
5. Detect replay attacks (duplicate message IDs/payloads)
6. Detect message flooding (rate limiting)
7. Run anomaly detection (rule-based + AI-ready hooks)
8. Aggregate telemetry in-memory (1-min windows)
9. Store ONLY aggregated data + security events
10. Trigger alert workflow if attack detected
"""

import json
import logging
import azure.functions as func
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from shared.config import get_config
from shared.database import Database
from shared.validators import TelemetryValidator
from shared.anomaly_detector import AnomalyDetector
from shared.aggregator import get_aggregator
from shared.alert_service import AlertWorkflow, AlertService

logger = logging.getLogger(__name__)


def main(event: func.EventHubEvent):
    """
    Main entry point for IoT Hub telemetry processing.
    Triggered by messages arriving at IoT Hub's Event Hub compatible endpoint.
    """
    try:
        # Parse incoming message
        message_body = event.get_body().decode('utf-8')
        logger.info(f"Received IoT message: {message_body[:200]}...")
        
        # Get message metadata from IoT Hub
        message_id = event.metadata.get('MessageId') if event.metadata else None
        enqueued_time = event.enqueued_time
        
        # Parse JSON payload
        try:
            payload = json.loads(message_body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            return
        
        # Extract device ID (from IoT Hub system properties or payload)
        device_id = None
        if event.metadata:
            device_id = event.metadata.get('iothub-connection-device-id')
        if not device_id:
            device_id = payload.get('device_id')
        if not device_id:
            logger.error("No device_id found in message")
            return
        
        payload['device_id'] = device_id
        logger.info(f"Processing message from device: {device_id}")
        
        # Initialize components
        config = get_config()
        db = Database()
        validator = TelemetryValidator()
        anomaly_detector = AnomalyDetector()
        aggregator = get_aggregator(window_minutes=1)
        
        # =====================================================================
        # ZERO-TRUST VALIDATION PIPELINE
        # =====================================================================
        
        # Step 1: Full validation (device allowlist, schema, timestamp, replay, flood)
        validation_result = validator.validate(payload, message_id=message_id)
        
        if not validation_result.is_valid:
            logger.warning(f"Validation failed for {device_id}: {validation_result.error_code}")
            
            # Store security event for rejected messages
            db.insert_security_event({
                'device_id': device_id,
                'event_type': 'validation_failed',
                'severity': 'high' if validation_result.error_code in ['REPLAY_ATTACK', 'MESSAGE_FLOOD'] else 'medium',
                'category': 'security',
                'title': f'Message rejected: {validation_result.error_code}',
                'description': validation_result.error,
                'attack_type': validation_result.error_code.lower().replace('_', ' '),
                'action_taken': 'rejected'
            })
            
            # For critical security violations, create attack incident
            if validation_result.error_code in ['REPLAY_ATTACK', 'MESSAGE_FLOOD']:
                db.insert_attack_incident({
                    'attack_type': validation_result.error_code.lower().replace('_', ' '),
                    'severity': 'critical',
                    'target_device_id': device_id,
                    'title': f'{validation_result.error_code} detected',
                    'description': validation_result.error,
                    'detection_method': 'rule_based',
                    'confidence_score': 95.0
                })
                
                # Auto-block device for critical attacks
                db.block_device(device_id, validation_result.error)
                logger.warning(f"SECURITY: Device {device_id} BLOCKED due to {validation_result.error_code}")
            
            return
        
        validated_data = validation_result.data
        
        # Log warnings if any
        for warning in validation_result.warnings:
            logger.info(f"Validation warning for {device_id}: {warning}")
        
        # =====================================================================
        # ANOMALY DETECTION
        # =====================================================================
        
        anomaly_result = anomaly_detector.detect(validated_data, is_replay=False)
        is_anomaly = anomaly_result.is_anomaly
        
        if is_anomaly:
            logger.warning(f"ANOMALY: Device={device_id}, Type={anomaly_result.anomaly_type}, "
                          f"Severity={anomaly_result.severity}, Score={anomaly_result.anomaly_score}")
        
        # =====================================================================
        # IN-MEMORY AGGREGATION (Cost Optimization)
        # =====================================================================
        
        # Add to aggregation window (returns completed window if rotated)
        completed_window = aggregator.add_telemetry(device_id, validated_data, is_anomaly)
        
        # Store completed aggregation window
        if completed_window:
            try:
                agg_id = db.insert_telemetry_aggregate(completed_window)
                logger.info(f"Stored aggregate {agg_id} for {device_id}: "
                           f"{completed_window['message_count']} msgs, "
                           f"{completed_window['anomaly_count']} anomalies")
            except Exception as e:
                logger.error(f"Failed to store aggregate: {e}")
        
        # =====================================================================
        # UPDATE DEVICE STATUS
        # =====================================================================
        
        db.update_device_last_seen(device_id)
        
        # Adjust trust score based on behavior
        if is_anomaly:
            db.update_trust_score(device_id, -5)  # Reduce trust for anomalies
        else:
            db.update_trust_score(device_id, 0.1)  # Slowly increase trust for normal behavior
        
        # =====================================================================
        # ALERT WORKFLOW (For Detected Attacks)
        # =====================================================================
        
        if is_anomaly and config.enable_anomaly_detection:
            # Store security event
            event_id = db.insert_security_event({
                'device_id': device_id,
                'event_type': 'anomaly_detected',
                'severity': anomaly_result.severity,
                'category': 'security',
                'title': anomaly_result.description or 'Anomaly detected',
                'description': f"Rule: {anomaly_result.rule_id}, Score: {anomaly_result.anomaly_score}",
                'attack_type': anomaly_result.anomaly_type,
                'confidence_score': anomaly_result.anomaly_score,
                'action_taken': 'blocked' if anomaly_result.should_block else 'monitored'
            })
            
            # Create attack incident for high-severity anomalies
            if anomaly_result.severity in ['critical', 'high']:
                db.insert_attack_incident({
                    'attack_type': anomaly_result.anomaly_type,
                    'severity': anomaly_result.severity,
                    'target_device_id': device_id,
                    'title': anomaly_result.description,
                    'detection_method': 'rule_based',
                    'detection_rule_id': anomaly_result.rule_id,
                    'confidence_score': anomaly_result.anomaly_score
                })
            
            # Block device if required
            if anomaly_result.should_block:
                db.block_device(device_id, anomaly_result.description)
                logger.warning(f"Device {device_id} BLOCKED: {anomaly_result.description}")
            
            # Trigger phone alert if required
            if anomaly_result.should_call and config.enable_phone_alerts:
                alert_service = AlertService()
                alert_result = alert_service.trigger_alert({
                    'event_id': event_id,
                    'device_id': device_id,
                    'severity': anomaly_result.severity,
                    'title': anomaly_result.description,
                    'attack_type': anomaly_result.anomaly_type
                })
                db.mark_alert_sent(event_id, phone_call=True)
                logger.info(f"Alert triggered: {alert_result}")
        
        logger.info(f"Successfully processed message from {device_id}")
        
    except Exception as e:
        logger.error(f"Error processing IoT Hub message: {e}", exc_info=True)
        raise
