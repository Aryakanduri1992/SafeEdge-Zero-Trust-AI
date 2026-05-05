"""
LumeEdge Database Module
Azure SQL connection and query helpers for Zero-Trust IoT Security Platform
"""

import pyodbc
import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from contextlib import contextmanager

from .config import get_config

logger = logging.getLogger(__name__)


class Database:
    """Azure SQL Database helper with connection pooling"""
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or get_config().sql_connection_string
        
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = pyodbc.connect(self.connection_string)
            yield conn
        except pyodbc.Error as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()

    # =========================================================================
    # DEVICE OPERATIONS
    # =========================================================================
    
    def get_device(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get device by ID"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT device_id, device_name, device_type, status, trust_score,
                       last_seen_at, blocked_at, blocked_reason, organization_id,
                       message_count_minute, message_count_reset_at
                FROM devices WHERE device_id = ?
            """, (device_id,))
            row = cursor.fetchone()
            if row:
                return {
                    'device_id': row.device_id,
                    'device_name': row.device_name,
                    'device_type': row.device_type,
                    'status': row.status,
                    'trust_score': float(row.trust_score) if row.trust_score else 100.0,
                    'last_seen_at': row.last_seen_at.isoformat() if row.last_seen_at else None,
                    'blocked_at': row.blocked_at.isoformat() if row.blocked_at else None,
                    'blocked_reason': row.blocked_reason,
                    'organization_id': row.organization_id
                }
            return None
    
    def get_all_devices(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all devices, optionally filtered by status"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute("""
                    SELECT device_id, device_name, device_type, status, trust_score,
                           last_seen_at, organization_id
                    FROM devices WHERE status = ? ORDER BY last_seen_at DESC
                """, (status,))
            else:
                cursor.execute("""
                    SELECT device_id, device_name, device_type, status, trust_score,
                           last_seen_at, organization_id
                    FROM devices ORDER BY last_seen_at DESC
                """)
            return [{
                'device_id': row.device_id,
                'device_name': row.device_name,
                'device_type': row.device_type,
                'status': row.status,
                'trust_score': float(row.trust_score) if row.trust_score else 100.0,
                'last_seen_at': row.last_seen_at.isoformat() if row.last_seen_at else None,
                'organization_id': row.organization_id
            } for row in cursor.fetchall()]
    
    def update_device_last_seen(self, device_id: str, ip_address: Optional[str] = None):
        """Update device last seen timestamp"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE devices SET last_seen_at = GETUTCDATE(), 
                    last_ip_address = COALESCE(?, last_ip_address),
                    updated_at = GETUTCDATE()
                WHERE device_id = ?
            """, (ip_address, device_id))
            conn.commit()
    
    def block_device(self, device_id: str, reason: str) -> bool:
        """Block a device (Zero-Trust response)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE devices SET status = 'blocked', blocked_at = GETUTCDATE(),
                    blocked_reason = ?, trust_score = 0, updated_at = GETUTCDATE()
                WHERE device_id = ?
            """, (reason, device_id))
            conn.commit()
            return cursor.rowcount > 0
    
    def unblock_device(self, device_id: str) -> bool:
        """Unblock a device"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE devices SET status = 'active', blocked_at = NULL,
                    blocked_reason = NULL, trust_score = 50.0, updated_at = GETUTCDATE()
                WHERE device_id = ?
            """, (device_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def update_trust_score(self, device_id: str, score_delta: float):
        """Adjust device trust score (positive or negative)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE devices SET trust_score = CASE 
                    WHEN trust_score + ? > 100 THEN 100
                    WHEN trust_score + ? < 0 THEN 0
                    ELSE trust_score + ? END,
                updated_at = GETUTCDATE() WHERE device_id = ?
            """, (score_delta, score_delta, score_delta, device_id))
            conn.commit()


    # =========================================================================
    # TELEMETRY AGGREGATES OPERATIONS (Cost Optimized)
    # =========================================================================
    
    def insert_telemetry_aggregate(self, aggregate: Dict[str, Any]) -> int:
        """Insert aggregated telemetry record"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO telemetry_aggregates (
                    device_id, window_start, window_end, window_minutes,
                    temp_avg, temp_min, temp_max, humidity_avg, humidity_min, humidity_max,
                    motion_events, door_events, message_count, anomaly_count,
                    signal_avg, signal_min, battery_avg, battery_min
                ) OUTPUT INSERTED.id VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                aggregate.get('device_id'),
                aggregate.get('window_start'),
                aggregate.get('window_end'),
                aggregate.get('window_minutes', 1),
                aggregate.get('temp_avg'),
                aggregate.get('temp_min'),
                aggregate.get('temp_max'),
                aggregate.get('humidity_avg'),
                aggregate.get('humidity_min'),
                aggregate.get('humidity_max'),
                aggregate.get('motion_events', 0),
                aggregate.get('door_events', 0),
                aggregate.get('message_count', 0),
                aggregate.get('anomaly_count', 0),
                aggregate.get('signal_avg'),
                aggregate.get('signal_min'),
                aggregate.get('battery_avg'),
                aggregate.get('battery_min')
            ))
            row = cursor.fetchone()
            conn.commit()
            return row[0] if row else 0
    
    def get_telemetry_aggregates(self, device_id: Optional[str] = None,
                                  hours: int = 24, limit: int = 100) -> List[Dict[str, Any]]:
        """Get aggregated telemetry data"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT TOP (?) device_id, window_start, window_end, window_minutes,
                       temp_avg, temp_min, temp_max, humidity_avg, humidity_min, humidity_max,
                       motion_events, door_events, message_count, anomaly_count,
                       signal_avg, signal_min, battery_avg, battery_min, created_at
                FROM telemetry_aggregates
                WHERE window_start >= DATEADD(HOUR, -?, GETUTCDATE())
            """
            params = [limit, hours]
            if device_id:
                query += " AND device_id = ?"
                params.append(device_id)
            query += " ORDER BY window_start DESC"
            cursor.execute(query, params)
            return [{
                'device_id': row.device_id,
                'window_start': row.window_start.isoformat() if row.window_start else None,
                'window_end': row.window_end.isoformat() if row.window_end else None,
                'temp_avg': float(row.temp_avg) if row.temp_avg else None,
                'temp_min': float(row.temp_min) if row.temp_min else None,
                'temp_max': float(row.temp_max) if row.temp_max else None,
                'humidity_avg': float(row.humidity_avg) if row.humidity_avg else None,
                'motion_events': row.motion_events,
                'message_count': row.message_count,
                'anomaly_count': row.anomaly_count,
                'signal_avg': row.signal_avg,
                'battery_avg': float(row.battery_avg) if row.battery_avg else None
            } for row in cursor.fetchall()]

    # =========================================================================
    # DEVICE HEALTH OPERATIONS
    # =========================================================================
    
    def insert_device_health(self, health: Dict[str, Any]) -> int:
        """Insert device health record"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO device_health (
                    device_id, uptime_seconds, free_memory_bytes, cpu_usage_percent,
                    battery_level, signal_strength, firmware_version, ip_address,
                    connection_type, status, last_error, reported_at
                ) OUTPUT INSERTED.id VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                health.get('device_id'),
                health.get('uptime_seconds'),
                health.get('free_memory_bytes'),
                health.get('cpu_usage_percent'),
                health.get('battery_level'),
                health.get('signal_strength'),
                health.get('firmware_version'),
                health.get('ip_address'),
                health.get('connection_type'),
                health.get('status', 'healthy'),
                health.get('last_error'),
                health.get('reported_at')
            ))
            row = cursor.fetchone()
            conn.commit()
            return row[0] if row else 0
    
    def get_device_health(self, device_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent health records for a device"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT TOP (?) device_id, uptime_seconds, battery_level, signal_strength,
                       firmware_version, status, last_error, received_at
                FROM device_health WHERE device_id = ? ORDER BY received_at DESC
            """, (limit, device_id))
            return [{
                'device_id': row.device_id,
                'uptime_seconds': row.uptime_seconds,
                'battery_level': float(row.battery_level) if row.battery_level else None,
                'signal_strength': row.signal_strength,
                'firmware_version': row.firmware_version,
                'status': row.status,
                'last_error': row.last_error,
                'received_at': row.received_at.isoformat() if row.received_at else None
            } for row in cursor.fetchall()]


    # =========================================================================
    # SECURITY EVENTS OPERATIONS
    # =========================================================================
    
    def insert_security_event(self, event: Dict[str, Any]) -> str:
        """Insert security event and return event_id"""
        event_id = event.get('event_id') or str(uuid.uuid4())
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO security_events (
                    event_id, device_id, event_type, severity, category,
                    title, description, source_ip, attack_type, attack_vector,
                    confidence_score, action_taken, raw_data
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                event_id, event.get('device_id'), event.get('event_type'),
                event.get('severity', 'medium'), event.get('category'),
                event.get('title'), event.get('description'), event.get('source_ip'),
                event.get('attack_type'), event.get('attack_vector'),
                event.get('confidence_score'), event.get('action_taken'),
                event.get('raw_data')
            ))
            conn.commit()
            return event_id
    
    def get_security_events(self, device_id: Optional[str] = None,
                            severity: Optional[str] = None,
                            unresolved_only: bool = False,
                            limit: int = 100) -> List[Dict[str, Any]]:
        """Get security events with filters"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT TOP (?) event_id, device_id, event_type, severity, category,
                       title, description, attack_type, confidence_score,
                       action_taken, alert_sent, created_at, resolved_at
                FROM security_events WHERE 1=1
            """
            params = [limit]
            if device_id:
                query += " AND device_id = ?"
                params.append(device_id)
            if severity:
                query += " AND severity = ?"
                params.append(severity)
            if unresolved_only:
                query += " AND resolved_at IS NULL"
            query += " ORDER BY created_at DESC"
            cursor.execute(query, params)
            return [{
                'event_id': row.event_id,
                'device_id': row.device_id,
                'event_type': row.event_type,
                'severity': row.severity,
                'category': row.category,
                'title': row.title,
                'description': row.description,
                'attack_type': row.attack_type,
                'confidence_score': float(row.confidence_score) if row.confidence_score else None,
                'action_taken': row.action_taken,
                'alert_sent': bool(row.alert_sent),
                'created_at': row.created_at.isoformat() if row.created_at else None,
                'resolved_at': row.resolved_at.isoformat() if row.resolved_at else None
            } for row in cursor.fetchall()]
    
    def mark_alert_sent(self, event_id: str, phone_call: bool = False):
        """Mark security event as alerted"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE security_events SET alert_sent = 1, alert_sent_at = GETUTCDATE(),
                    phone_call_triggered = ? WHERE event_id = ?
            """, (phone_call, event_id))
            conn.commit()

    # =========================================================================
    # ATTACK INCIDENTS OPERATIONS
    # =========================================================================
    
    def insert_attack_incident(self, incident: Dict[str, Any]) -> str:
        """Insert attack incident and return incident_id"""
        incident_id = incident.get('incident_id') or str(uuid.uuid4())
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO attack_incidents (
                    incident_id, attack_type, severity, status, target_device_id,
                    target_resource, source_ip, source_device_id, title, description,
                    attack_vector, detection_method, detection_rule_id, confidence_score,
                    first_detected_at, impact_level, response_actions
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                incident_id, incident.get('attack_type'), incident.get('severity', 'high'),
                incident.get('status', 'active'), incident.get('target_device_id'),
                incident.get('target_resource'), incident.get('source_ip'),
                incident.get('source_device_id'), incident.get('title'),
                incident.get('description'), incident.get('attack_vector'),
                incident.get('detection_method', 'rule_based'),
                incident.get('detection_rule_id'), incident.get('confidence_score'),
                incident.get('first_detected_at', datetime.utcnow()),
                incident.get('impact_level'), incident.get('response_actions')
            ))
            conn.commit()
            return incident_id
    
    def get_attack_incidents(self, status: Optional[str] = None,
                             limit: int = 50) -> List[Dict[str, Any]]:
        """Get attack incidents"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT TOP (?) incident_id, attack_type, severity, status, target_device_id,
                       title, confidence_score, first_detected_at, created_at, resolved_at
                FROM attack_incidents WHERE 1=1
            """
            params = [limit]
            if status:
                query += " AND status = ?"
                params.append(status)
            query += " ORDER BY created_at DESC"
            cursor.execute(query, params)
            return [{
                'incident_id': row.incident_id,
                'attack_type': row.attack_type,
                'severity': row.severity,
                'status': row.status,
                'target_device_id': row.target_device_id,
                'title': row.title,
                'confidence_score': float(row.confidence_score) if row.confidence_score else None,
                'first_detected_at': row.first_detected_at.isoformat() if row.first_detected_at else None,
                'created_at': row.created_at.isoformat() if row.created_at else None,
                'resolved_at': row.resolved_at.isoformat() if row.resolved_at else None
            } for row in cursor.fetchall()]


    # =========================================================================
    # MESSAGE TRACKING (Replay Attack Detection)
    # =========================================================================
    
    def track_message(self, device_id: str, message_id: str, 
                      message_hash: str, device_timestamp: Optional[datetime] = None) -> bool:
        """
        Track message for replay detection. Returns True if duplicate found.
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Check for duplicate
            cursor.execute("""
                SELECT COUNT(*) FROM message_tracking 
                WHERE message_id = ? OR (device_id = ? AND message_hash = ? 
                      AND received_at > DATEADD(MINUTE, -5, GETUTCDATE()))
            """, (message_id, device_id, message_hash))
            count = cursor.fetchone()[0]
            if count > 0:
                return True  # Duplicate found
            # Insert tracking record
            cursor.execute("""
                INSERT INTO message_tracking (message_id, device_id, message_hash, device_timestamp)
                VALUES (?, ?, ?, ?)
            """, (message_id, device_id, message_hash, device_timestamp))
            conn.commit()
            return False
    
    def cleanup_message_tracking(self):
        """Remove old message tracking records (call periodically)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM message_tracking WHERE received_at < DATEADD(HOUR, -1, GETUTCDATE())")
            conn.commit()

    # =========================================================================
    # ANOMALY RULES OPERATIONS
    # =========================================================================
    
    def get_active_rules(self) -> List[Dict[str, Any]]:
        """Get all active anomaly detection rules"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT rule_id, rule_name, rule_type, metric, operator,
                       threshold_value, threshold_min, threshold_max,
                       time_window_minutes, min_occurrences, rate_limit_count,
                       rate_limit_window_seconds, severity, auto_block,
                       auto_quarantine_minutes, trigger_alert, trigger_phone_call
                FROM anomaly_rules WHERE is_active = 1
            """)
            return [{
                'rule_id': row.rule_id,
                'rule_name': row.rule_name,
                'rule_type': row.rule_type,
                'metric': row.metric,
                'operator': row.operator,
                'threshold_value': float(row.threshold_value) if row.threshold_value else None,
                'threshold_min': float(row.threshold_min) if row.threshold_min else None,
                'threshold_max': float(row.threshold_max) if row.threshold_max else None,
                'time_window_minutes': row.time_window_minutes,
                'min_occurrences': row.min_occurrences,
                'rate_limit_count': row.rate_limit_count,
                'rate_limit_window_seconds': row.rate_limit_window_seconds,
                'severity': row.severity,
                'auto_block': bool(row.auto_block),
                'auto_quarantine_minutes': row.auto_quarantine_minutes,
                'trigger_alert': bool(row.trigger_alert),
                'trigger_phone_call': bool(row.trigger_phone_call)
            } for row in cursor.fetchall()]

    # =========================================================================
    # DASHBOARD STATISTICS
    # =========================================================================
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get aggregated statistics for dashboard"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Device counts
            cursor.execute("""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
                FROM devices
            """)
            device_row = cursor.fetchone()
            # Security events (last 24h)
            cursor.execute("""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                    SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as unresolved
                FROM security_events WHERE created_at >= DATEADD(HOUR, -24, GETUTCDATE())
            """)
            events_row = cursor.fetchone()
            # Telemetry aggregates (last hour)
            cursor.execute("""
                SELECT SUM(message_count) as message_count,
                       SUM(anomaly_count) as anomaly_count
                FROM telemetry_aggregates
                WHERE window_start >= DATEADD(HOUR, -1, GETUTCDATE())
            """)
            telemetry_row = cursor.fetchone()
            # Attack incidents
            cursor.execute("""
                SELECT COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
                FROM attack_incidents
            """)
            incidents_row = cursor.fetchone()
            return {
                'devices': {
                    'total': device_row.total or 0,
                    'active': device_row.active or 0,
                    'blocked': device_row.blocked or 0
                },
                'security_events_24h': {
                    'total': events_row.total or 0,
                    'critical': events_row.critical or 0,
                    'high': events_row.high or 0,
                    'unresolved': events_row.unresolved or 0
                },
                'telemetry_1h': {
                    'message_count': telemetry_row.message_count or 0,
                    'anomaly_count': telemetry_row.anomaly_count or 0
                },
                'attack_incidents': {
                    'total': incidents_row.total or 0,
                    'active': incidents_row.active or 0
                }
            }
