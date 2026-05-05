"""
LumeEdge Anomaly Detection Engine
Rule-based detection with AI-ready hooks
"""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class AnomalyType(Enum):
    """Types of anomalies that can be detected"""
    THRESHOLD_BREACH = "threshold_breach"
    REPLAY_ATTACK = "replay_attack"
    MESSAGE_FLOOD = "message_flood"
    PATTERN_ANOMALY = "pattern_anomaly"
    SIGNAL_DEGRADATION = "signal_degradation"
    BEHAVIORAL_ANOMALY = "behavioral_anomaly"


class Severity(Enum):
    """Severity levels for detected anomalies"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class AnomalyResult:
    """Result of anomaly detection"""
    is_anomaly: bool
    anomaly_type: Optional[str] = None
    anomaly_score: float = 0.0  # 0-100 confidence score
    severity: str = "info"
    rule_id: Optional[str] = None
    description: Optional[str] = None
    should_block: bool = False
    should_alert: bool = False
    should_call: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'is_anomaly': self.is_anomaly,
            'anomaly_type': self.anomaly_type,
            'anomaly_score': self.anomaly_score,
            'severity': self.severity,
            'rule_id': self.rule_id,
            'description': self.description,
            'should_block': self.should_block,
            'should_alert': self.should_alert,
            'should_call': self.should_call
        }


class AnomalyDetector:
    """
    Rule-based anomaly detection engine.
    
    Features:
    - Threshold-based rules
    - Pattern matching
    - Message frequency analysis
    - AI-ready hooks for future ML integration
    """
    
    def __init__(self, rules: Optional[List[Dict]] = None):
        """
        Initialize detector with rules.
        Rules can be loaded from database or provided directly.
        """
        self.rules = rules or self._get_default_rules()
        self._message_counts: Dict[str, List[datetime]] = {}  # device_id -> timestamps
        self._recent_values: Dict[str, List[float]] = {}  # metric tracking
    
    def _get_default_rules(self) -> List[Dict]:
        """Default anomaly detection rules"""
        return [
            {
                'rule_id': 'RULE_TEMP_HIGH',
                'rule_type': 'threshold',
                'metric': 'temperature',
                'operator': 'gt',
                'threshold_value': 50.0,
                'severity': 'high',
                'auto_block': False,
                'trigger_alert': True,
                'trigger_phone_call': False
            },
            {
                'rule_id': 'RULE_TEMP_LOW',
                'rule_type': 'threshold',
                'metric': 'temperature',
                'operator': 'lt',
                'threshold_value': -10.0,
                'severity': 'medium',
                'auto_block': False,
                'trigger_alert': True,
                'trigger_phone_call': False
            },
            {
                'rule_id': 'RULE_FREQ_FLOOD',
                'rule_type': 'frequency',
                'metric': 'message_frequency',
                'threshold_value': 100,  # messages per minute
                'time_window_minutes': 1,
                'severity': 'critical',
                'auto_block': True,
                'trigger_alert': True,
                'trigger_phone_call': True
            },
            {
                'rule_id': 'RULE_SIGNAL_DROP',
                'rule_type': 'threshold',
                'metric': 'signal_strength',
                'operator': 'lt',
                'threshold_value': -80,
                'severity': 'medium',
                'auto_block': False,
                'trigger_alert': True,
                'trigger_phone_call': False
            },
            {
                'rule_id': 'RULE_BATTERY_LOW',
                'rule_type': 'threshold',
                'metric': 'battery_level',
                'operator': 'lt',
                'threshold_value': 10.0,
                'severity': 'low',
                'auto_block': False,
                'trigger_alert': True,
                'trigger_phone_call': False
            }
        ]
    
    def detect(self, telemetry: Dict[str, Any], 
               is_replay: bool = False) -> AnomalyResult:
        """
        Main detection method. Analyzes telemetry against all rules.
        
        Args:
            telemetry: Validated telemetry data
            is_replay: Whether this message was flagged as potential replay
        
        Returns:
            AnomalyResult with detection details
        """
        device_id = telemetry.get('device_id', 'unknown')
        
        # Check for replay attack first (highest priority)
        if is_replay:
            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=AnomalyType.REPLAY_ATTACK.value,
                anomaly_score=95.0,
                severity=Severity.CRITICAL.value,
                rule_id='RULE_REPLAY_ATTACK',
                description=f'Replay attack detected for device {device_id}',
                should_block=True,
                should_alert=True,
                should_call=True
            )
        
        # Check message frequency (DoS detection)
        flood_result = self._check_message_flood(device_id)
        if flood_result.is_anomaly:
            return flood_result
        
        # Check threshold rules
        for rule in self.rules:
            if rule['rule_type'] == 'threshold':
                result = self._check_threshold_rule(telemetry, rule)
                if result.is_anomaly:
                    return result
        
        # AI-ready hook: behavioral analysis placeholder
        behavioral_result = self._check_behavioral_anomaly(telemetry)
        if behavioral_result.is_anomaly:
            return behavioral_result
        
        # No anomaly detected
        return AnomalyResult(is_anomaly=False)
    
    def _check_threshold_rule(self, telemetry: Dict[str, Any], 
                               rule: Dict) -> AnomalyResult:
        """Check a single threshold rule against telemetry"""
        metric = rule['metric']
        value = telemetry.get(metric)
        
        if value is None:
            return AnomalyResult(is_anomaly=False)
        
        threshold = rule['threshold_value']
        operator = rule['operator']
        
        is_breach = False
        if operator == 'gt' and value > threshold:
            is_breach = True
        elif operator == 'lt' and value < threshold:
            is_breach = True
        elif operator == 'eq' and value == threshold:
            is_breach = True
        elif operator == 'gte' and value >= threshold:
            is_breach = True
        elif operator == 'lte' and value <= threshold:
            is_breach = True
        
        if is_breach:
            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=AnomalyType.THRESHOLD_BREACH.value,
                anomaly_score=80.0,
                severity=rule.get('severity', 'medium'),
                rule_id=rule['rule_id'],
                description=f"{metric} value {value} breached threshold {operator} {threshold}",
                should_block=rule.get('auto_block', False),
                should_alert=rule.get('trigger_alert', True),
                should_call=rule.get('trigger_phone_call', False)
            )
        
        return AnomalyResult(is_anomaly=False)
    
    def _check_message_flood(self, device_id: str) -> AnomalyResult:
        """
        Check for message flooding (DoS attack pattern).
        Tracks message frequency per device.
        """
        now = datetime.utcnow()
        window = timedelta(minutes=1)
        
        # Initialize tracking for device
        if device_id not in self._message_counts:
            self._message_counts[device_id] = []
        
        # Add current timestamp
        self._message_counts[device_id].append(now)
        
        # Remove old timestamps outside window
        cutoff = now - window
        self._message_counts[device_id] = [
            ts for ts in self._message_counts[device_id] if ts > cutoff
        ]
        
        # Check frequency
        count = len(self._message_counts[device_id])
        threshold = 100  # messages per minute
        
        if count > threshold:
            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=AnomalyType.MESSAGE_FLOOD.value,
                anomaly_score=90.0,
                severity=Severity.CRITICAL.value,
                rule_id='RULE_FREQ_FLOOD',
                description=f'Message flood detected: {count} messages/min from {device_id}',
                should_block=True,
                should_alert=True,
                should_call=True
            )
        
        return AnomalyResult(is_anomaly=False)
    
    def _check_behavioral_anomaly(self, telemetry: Dict[str, Any]) -> AnomalyResult:
        """
        AI-ready behavioral analysis placeholder.
        
        Future implementation could use:
        - Azure Anomaly Detector API
        - Custom ML model
        - Statistical analysis (z-score, IQR)
        """
        device_id = telemetry.get('device_id', 'unknown')
        
        # Track recent values for statistical analysis
        for metric in ['temperature', 'humidity', 'signal_strength']:
            value = telemetry.get(metric)
            if value is not None:
                key = f"{device_id}_{metric}"
                if key not in self._recent_values:
                    self._recent_values[key] = []
                self._recent_values[key].append(float(value))
                
                # Keep only last 100 values
                if len(self._recent_values[key]) > 100:
                    self._recent_values[key] = self._recent_values[key][-100:]
                
                # Simple statistical check (z-score > 3)
                if len(self._recent_values[key]) >= 10:
                    values = self._recent_values[key]
                    mean = sum(values) / len(values)
                    variance = sum((x - mean) ** 2 for x in values) / len(values)
                    std_dev = variance ** 0.5
                    
                    if std_dev > 0:
                        z_score = abs((value - mean) / std_dev)
                        if z_score > 3:
                            return AnomalyResult(
                                is_anomaly=True,
                                anomaly_type=AnomalyType.BEHAVIORAL_ANOMALY.value,
                                anomaly_score=min(z_score * 20, 100),
                                severity=Severity.MEDIUM.value,
                                rule_id='RULE_BEHAVIORAL',
                                description=f'Statistical anomaly in {metric}: z-score={z_score:.2f}',
                                should_block=False,
                                should_alert=True,
                                should_call=False
                            )
        
        return AnomalyResult(is_anomaly=False)
    
    def load_rules_from_db(self, rules: List[Dict]):
        """Update rules from database"""
        self.rules = rules
        logger.info(f"Loaded {len(rules)} anomaly detection rules")


# ============================================================================
# AI-READY HOOKS
# ============================================================================

class AIAnomalyDetector:
    """
    Placeholder for Azure AI Anomaly Detector integration.
    
    To enable:
    1. Create Azure Anomaly Detector resource
    2. Install azure-ai-anomalydetector package
    3. Configure API key in environment
    4. Implement detect_with_ai method
    """
    
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None):
        self.api_key = api_key
        self.endpoint = endpoint
        self.enabled = bool(api_key and endpoint)
    
    async def detect_with_ai(self, time_series: List[Dict]) -> Optional[AnomalyResult]:
        """
        Use Azure Anomaly Detector for advanced detection.
        
        Args:
            time_series: List of {'timestamp': str, 'value': float}
        
        Returns:
            AnomalyResult if anomaly detected, None otherwise
        """
        if not self.enabled:
            return None
        
        # TODO: Implement Azure Anomaly Detector API call
        # from azure.ai.anomalydetector import AnomalyDetectorClient
        # from azure.core.credentials import AzureKeyCredential
        #
        # client = AnomalyDetectorClient(
        #     AzureKeyCredential(self.api_key),
        #     self.endpoint
        # )
        # result = client.detect_last_point(...)
        
        logger.info("AI anomaly detection not yet implemented")
        return None
