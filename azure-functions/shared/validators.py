"""
LumeEdge Payload Validators
Zero-Trust validation for IoT telemetry

Security Features:
- Device allowlist check
- Schema validation (no extra fields)
- Timestamp sanity checks
- Replay attack detection
- Message flood detection (rate-based)
"""

import json
import logging
import hashlib
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
from collections import defaultdict

from .config import get_config

logger = logging.getLogger(__name__)


class TelemetrySchema(BaseModel):
    """
    Pydantic model for validating IoT telemetry payloads.
    Strict validation ensures only expected data passes through (Zero-Trust).
    """
    device_id: str = Field(..., min_length=1, max_length=128)
    timestamp: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=-50, le=100)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    motion_detected: Optional[bool] = False
    door_open: Optional[bool] = False
    vibration_level: Optional[float] = Field(None, ge=0, le=1000)
    sound_level: Optional[float] = Field(None, ge=0, le=200)
    light_level: Optional[int] = Field(None, ge=0, le=100000)
    battery_level: Optional[float] = Field(None, ge=0, le=100)
    signal_strength: Optional[int] = Field(None, ge=-100, le=0)
    firmware_version: Optional[str] = Field(None, max_length=64)
    uptime_seconds: Optional[int] = Field(None, ge=0)
    message_id: Optional[str] = Field(None, max_length=128)
    custom_data: Optional[str] = None

    @validator('device_id')
    def validate_device_id_format(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('device_id must be alphanumeric with hyphens/underscores')
        return v

    @validator('timestamp')
    def validate_timestamp(cls, v):
        if v:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('timestamp must be ISO 8601 format')
        return v

    @validator('custom_data')
    def validate_custom_data_json(cls, v):
        if v:
            try:
                json.loads(v)
                if len(v) > 4000:
                    raise ValueError('custom_data exceeds maximum size')
            except json.JSONDecodeError:
                raise ValueError('custom_data must be valid JSON')
        return v

    class Config:
        extra = 'forbid'


class ValidationResult:
    def __init__(self, is_valid: bool, data: Optional[Dict] = None,
                 error: Optional[str] = None, error_code: Optional[str] = None,
                 warnings: Optional[List[str]] = None):
        self.is_valid = is_valid
        self.data = data
        self.error = error
        self.error_code = error_code
        self.warnings = warnings or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            'is_valid': self.is_valid, 'data': self.data,
            'error': self.error, 'error_code': self.error_code,
            'warnings': self.warnings
        }


class TimestampValidator:
    """Validates timestamps for sanity checks - detects clock skew and replay indicators."""
    MAX_FUTURE_SECONDS = 300  # 5 minutes
    MAX_AGE_SECONDS = 3600    # 1 hour

    @classmethod
    def validate(cls, timestamp_str: Optional[str]) -> Tuple[bool, Optional[str], Optional[datetime]]:
        if not timestamp_str:
            return True, None, None
        try:
            ts = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            if ts.tzinfo:
                ts = ts.replace(tzinfo=None)
            now = datetime.utcnow()
            if ts > now + timedelta(seconds=cls.MAX_FUTURE_SECONDS):
                return False, f'Timestamp in future (clock skew > {cls.MAX_FUTURE_SECONDS}s)', ts
            if ts < now - timedelta(seconds=cls.MAX_AGE_SECONDS):
                return False, f'Timestamp too old (> {cls.MAX_AGE_SECONDS}s)', ts
            return True, None, ts
        except (ValueError, TypeError) as e:
            return False, f'Invalid timestamp format: {e}', None


class ReplayDetector:
    """Detects replay attacks via message ID and payload hash tracking."""
    def __init__(self, max_tracked: int = 10000, window_seconds: int = 3600):
        self.max_tracked = max_tracked
        self.window_seconds = window_seconds
        self._message_ids: Dict[str, datetime] = {}
        self._payload_hashes: Dict[str, Tuple[str, datetime]] = {}

    def check_replay(self, device_id: str, message_id: Optional[str],
                     payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        now = datetime.utcnow()
        self._cleanup(now)
        if message_id:
            if message_id in self._message_ids:
                return True, f'Duplicate message_id: {message_id}'
            self._message_ids[message_id] = now
        payload_hash = self._hash_payload(payload)
        if payload_hash in self._payload_hashes:
            prev_device, prev_time = self._payload_hashes[payload_hash]
            if prev_device == device_id and (now - prev_time).total_seconds() < 60:
                return True, 'Duplicate payload detected'
        self._payload_hashes[payload_hash] = (device_id, now)
        return False, None

    def _hash_payload(self, payload: Dict[str, Any]) -> str:
        payload_copy = {k: v for k, v in payload.items() if k != 'timestamp'}
        return hashlib.sha256(json.dumps(payload_copy, sort_keys=True, default=str).encode()).hexdigest()[:32]

    def _cleanup(self, now: datetime):
        cutoff = now - timedelta(seconds=self.window_seconds)
        self._message_ids = {k: v for k, v in self._message_ids.items() if v > cutoff}
        self._payload_hashes = {k: v for k, v in self._payload_hashes.items() if v[1] > cutoff}
        if len(self._message_ids) > self.max_tracked:
            sorted_ids = sorted(self._message_ids.items(), key=lambda x: x[1])
            self._message_ids = dict(sorted_ids[self.max_tracked // 2:])


class FloodDetector:
    """Detects message flooding (DoS attacks) using rate limiting."""
    def __init__(self, max_per_minute: int = 100, max_per_second: int = 10):
        self.max_per_minute = max_per_minute
        self.max_per_second = max_per_second
        self._device_timestamps: Dict[str, List[datetime]] = defaultdict(list)

    def check_flood(self, device_id: str) -> Tuple[bool, Optional[str], int]:
        now = datetime.utcnow()
        self._device_timestamps[device_id].append(now)
        cutoff = now - timedelta(minutes=2)
        self._device_timestamps[device_id] = [ts for ts in self._device_timestamps[device_id] if ts > cutoff]
        timestamps = self._device_timestamps[device_id]
        one_second_ago = now - timedelta(seconds=1)
        recent_count = sum(1 for ts in timestamps if ts > one_second_ago)
        if recent_count > self.max_per_second:
            return True, f'Rate limit: {recent_count} msgs/sec (max: {self.max_per_second})', len(timestamps)
        one_minute_ago = now - timedelta(minutes=1)
        minute_count = sum(1 for ts in timestamps if ts > one_minute_ago)
        if minute_count > self.max_per_minute:
            return True, f'Rate limit: {minute_count} msgs/min (max: {self.max_per_minute})', minute_count
        return False, None, minute_count


class TelemetryValidator:
    """
    Main validator class implementing Zero-Trust validation pipeline:
    1. Device allowlist check
    2. Message flood detection (DoS protection)
    3. Timestamp sanity check
    4. Replay attack detection
    5. Schema validation (strict, no extra fields)
    """
    def __init__(self):
        self.config = get_config()
        self.replay_detector = ReplayDetector()
        self.flood_detector = FloodDetector()

    def validate(self, payload: Dict[str, Any], message_id: Optional[str] = None) -> ValidationResult:
        warnings = []
        device_id = payload.get('device_id')
        if not device_id:
            return ValidationResult(is_valid=False, error='Missing device_id', error_code='MISSING_DEVICE_ID')

        if not self.config.is_device_allowed(device_id):
            logger.warning(f"SECURITY: Rejected unknown device: {device_id}")
            return ValidationResult(is_valid=False, error=f'Device {device_id} not registered', error_code='UNKNOWN_DEVICE')

        is_flooding, flood_reason, rate = self.flood_detector.check_flood(device_id)
        if is_flooding:
            logger.warning(f"SECURITY: Flood from {device_id}: {flood_reason}")
            return ValidationResult(is_valid=False, error=flood_reason, error_code='MESSAGE_FLOOD')

        timestamp_str = payload.get('timestamp')
        ts_valid, ts_error, _ = TimestampValidator.validate(timestamp_str)
        if not ts_valid:
            logger.warning(f"SECURITY: Timestamp invalid for {device_id}: {ts_error}")
            return ValidationResult(is_valid=False, error=ts_error, error_code='INVALID_TIMESTAMP')
        if not timestamp_str:
            warnings.append('No timestamp - using server time')

        is_replay, replay_reason = self.replay_detector.check_replay(device_id, message_id, payload)
        if is_replay:
            logger.warning(f"SECURITY: Replay attack from {device_id}: {replay_reason}")
            return ValidationResult(is_valid=False, error=replay_reason, error_code='REPLAY_ATTACK')

        try:
            if message_id:
                payload['message_id'] = message_id
            validated = TelemetrySchema(**payload)
            return ValidationResult(is_valid=True, data=validated.dict(exclude_none=True), warnings=warnings)
        except Exception as e:
            error_msg = str(e)
            if 'extra fields not permitted' in error_msg.lower():
                logger.warning(f"SECURITY: Extra fields from {device_id}")
                return ValidationResult(is_valid=False, error='Unexpected fields (Zero-Trust violation)', error_code='EXTRA_FIELDS')
            return ValidationResult(is_valid=False, error=error_msg, error_code='SCHEMA_VALIDATION_FAILED')

    def sanitize_for_storage(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = data.copy()
        sanitized['raw_payload'] = json.dumps(data, default=str)[:4000]
        for bool_field in ['motion_detected', 'door_open']:
            if bool_field in sanitized:
                sanitized[bool_field] = bool(sanitized[bool_field])
        return sanitized


def validate_device_id(device_id: str) -> Tuple[bool, Optional[str]]:
    if not device_id:
        return False, "Device ID is required"
    if len(device_id) > 128:
        return False, "Device ID too long (max 128 chars)"
    if not device_id.replace('-', '').replace('_', '').isalnum():
        return False, "Device ID must be alphanumeric with hyphens/underscores"
    config = get_config()
    if not config.is_device_allowed(device_id):
        return False, f"Device {device_id} is not registered"
    return True, None


_replay_detector = ReplayDetector()

def check_replay_attack(message_id: str) -> bool:
    if not message_id:
        return False
    is_replay, _ = _replay_detector.check_replay('unknown', message_id, {})
    return is_replay
