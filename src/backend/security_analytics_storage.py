"""
Security Analytics Storage Service
==================================
Stores security analysis data, threat detections, and historical metrics
in Firebase Realtime Database for the Security Center.

Author: SafeEdge Team
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import db


class SecurityAnalyticsStorage:
    """Store and retrieve security analytics data"""
    
    def __init__(self):
        """Initialize Firebase reference"""
        if not firebase_admin._apps:
            raise ValueError("Firebase not initialized")
        self.db_ref = db.reference()
        self.security_ref = self.db_ref.child('security_analytics')
        print("🛡️ Security Analytics Storage initialized")
    
    # ==================== Threat Detection Storage ====================
    
    def store_threat_detection(
        self,
        device_id: str,
        device_name: str,
        threat_type: str,
        severity: str,
        threat_data: Dict
    ) -> str:
        """
        Store detected threat in Firebase
        
        Args:
            device_id: Device identifier
            device_name: Device name
            threat_type: Type of threat (high_temperature, low_security_score, etc.)
            severity: critical, high, medium, low
            threat_data: Additional threat information
            
        Returns:
            Threat ID
        """
        try:
            timestamp = datetime.now()
            threat_id = f"{device_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}"
            
            threat_entry = {
                'threat_id': threat_id,
                'device_id': device_id,
                'device_name': device_name,
                'threat_type': threat_type,
                'severity': severity,
                'detected_at': timestamp.isoformat(),
                'status': 'active',
                'resolved': False,
                'resolved_at': None,
                'resolved_by': None,
                **threat_data
            }
            
            # Store in threats collection
            self.security_ref.child('threats').child(threat_id).set(threat_entry)
            
            # Update device threat status
            self.db_ref.child(f'devices/{device_id}/security/latest_threat').set({
                'threat_id': threat_id,
                'threat_type': threat_type,
                'severity': severity,
                'detected_at': timestamp.isoformat()
            })
            
            print(f"🚨 Threat detected and stored: {threat_type} on {device_name}")
            return threat_id
            
        except Exception as e:
            print(f"❌ Error storing threat detection: {e}")
            return None
    
    def resolve_threat(self, threat_id: str, resolved_by: str) -> bool:
        """Mark a threat as resolved"""
        try:
            self.security_ref.child('threats').child(threat_id).update({
                'status': 'resolved',
                'resolved': True,
                'resolved_at': datetime.now().isoformat(),
                'resolved_by': resolved_by
            })
            print(f"✅ Threat resolved: {threat_id}")
            return True
        except Exception as e:
            print(f"❌ Error resolving threat: {e}")
            return False
    
    def get_active_threats(self, organization_id: Optional[str] = None) -> List[Dict]:
        """Get all active threats"""
        try:
            threats_ref = self.security_ref.child('threats')
            all_threats = threats_ref.get()
            
            if not all_threats:
                return []
            
            active_threats = []
            for threat_id, threat_data in all_threats.items():
                if threat_data.get('status') == 'active':
                    active_threats.append(threat_data)
            
            # Sort by detected_at (newest first)
            active_threats.sort(key=lambda x: x.get('detected_at', ''), reverse=True)
            
            return active_threats
            
        except Exception as e:
            print(f"❌ Error getting active threats: {e}")
            return []
    
    # ==================== Security Metrics Storage ====================
    
    def store_security_metrics(
        self,
        organization_id: str,
        metrics: Dict
    ) -> bool:
        """
        Store aggregated security metrics
        
        Args:
            organization_id: Organization identifier
            metrics: Dictionary containing security metrics
                - overall_threat_level
                - average_security_score
                - anomaly_count
                - encrypted_devices
                - total_devices
                - critical_devices
        """
        try:
            timestamp = datetime.now()
            timestamp_key = timestamp.strftime('%Y%m%d_%H%M%S')
            
            metrics_entry = {
                'timestamp': timestamp.isoformat(),
                'organization_id': organization_id,
                **metrics
            }
            
            # Store in metrics history
            self.security_ref.child('metrics').child(organization_id).child(timestamp_key).set(metrics_entry)
            
            # Update latest metrics
            self.security_ref.child('metrics').child(organization_id).child('latest').set(metrics_entry)
            
            print(f"📊 Security metrics stored for organization: {organization_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error storing security metrics: {e}")
            return False
    
    def get_latest_metrics(self, organization_id: str) -> Optional[Dict]:
        """Get latest security metrics for an organization"""
        try:
            metrics_ref = self.security_ref.child('metrics').child(organization_id).child('latest')
            return metrics_ref.get()
        except Exception as e:
            print(f"❌ Error getting latest metrics: {e}")
            return None
    
    def get_metrics_history(
        self,
        organization_id: str,
        hours: int = 24
    ) -> List[Dict]:
        """Get historical security metrics"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            cutoff_key = cutoff_time.strftime('%Y%m%d_%H%M%S')
            
            metrics_ref = self.security_ref.child('metrics').child(organization_id)
            all_metrics = metrics_ref.get()
            
            if not all_metrics:
                return []
            
            historical_metrics = []
            for timestamp_key, metrics_data in all_metrics.items():
                if timestamp_key != 'latest' and timestamp_key >= cutoff_key:
                    historical_metrics.append(metrics_data)
            
            # Sort by timestamp (newest first)
            historical_metrics.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return historical_metrics
            
        except Exception as e:
            print(f"❌ Error getting metrics history: {e}")
            return []
    
    # ==================== Anomaly Detection Storage ====================
    
    def store_anomaly(
        self,
        device_id: str,
        device_name: str,
        anomaly_type: str,
        anomaly_data: Dict
    ) -> str:
        """Store detected anomaly"""
        try:
            timestamp = datetime.now()
            anomaly_id = f"{device_id}_{timestamp.strftime('%Y%m%d_%H%M%S')}"
            
            anomaly_entry = {
                'anomaly_id': anomaly_id,
                'device_id': device_id,
                'device_name': device_name,
                'anomaly_type': anomaly_type,
                'detected_at': timestamp.isoformat(),
                'acknowledged': False,
                **anomaly_data
            }
            
            # Store in anomalies collection
            self.security_ref.child('anomalies').child(anomaly_id).set(anomaly_entry)
            
            # Update device anomaly count
            device_security_ref = self.db_ref.child(f'devices/{device_id}/security')
            current_count = device_security_ref.child('anomaly_count').get() or 0
            device_security_ref.update({
                'anomaly_count': current_count + 1,
                'last_anomaly_at': timestamp.isoformat()
            })
            
            print(f"⚠️ Anomaly detected and stored: {anomaly_type} on {device_name}")
            return anomaly_id
            
        except Exception as e:
            print(f"❌ Error storing anomaly: {e}")
            return None
    
    def get_recent_anomalies(
        self,
        device_id: Optional[str] = None,
        hours: int = 24
    ) -> List[Dict]:
        """Get recent anomalies"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            anomalies_ref = self.security_ref.child('anomalies')
            all_anomalies = anomalies_ref.get()
            
            if not all_anomalies:
                return []
            
            recent_anomalies = []
            for anomaly_id, anomaly_data in all_anomalies.items():
                detected_at = datetime.fromisoformat(anomaly_data.get('detected_at', ''))
                
                if detected_at >= cutoff_time:
                    if device_id is None or anomaly_data.get('device_id') == device_id:
                        recent_anomalies.append(anomaly_data)
            
            # Sort by detected_at (newest first)
            recent_anomalies.sort(key=lambda x: x.get('detected_at', ''), reverse=True)
            
            return recent_anomalies
            
        except Exception as e:
            print(f"❌ Error getting recent anomalies: {e}")
            return []
    
    # ==================== Security Events Storage ====================
    
    def store_security_event(
        self,
        organization_id: str,
        event_type: str,
        severity: str,
        title: str,
        description: str,
        metadata: Optional[Dict] = None
    ) -> str:
        """Store security event"""
        try:
            timestamp = datetime.now()
            event_id = f"evt_{timestamp.strftime('%Y%m%d_%H%M%S_%f')}"
            
            event_entry = {
                'event_id': event_id,
                'organization_id': organization_id,
                'event_type': event_type,
                'severity': severity,
                'title': title,
                'description': description,
                'status': 'active',
                'created_at': timestamp.isoformat(),
                'metadata': metadata or {}
            }
            
            # Store in events collection
            self.security_ref.child('events').child(organization_id).child(event_id).set(event_entry)
            
            print(f"📝 Security event stored: {title}")
            return event_id
            
        except Exception as e:
            print(f"❌ Error storing security event: {e}")
            return None
    
    def get_security_events(
        self,
        organization_id: str,
        hours: int = 24,
        severity: Optional[str] = None
    ) -> List[Dict]:
        """Get security events for an organization"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            events_ref = self.security_ref.child('events').child(organization_id)
            all_events = events_ref.get()
            
            if not all_events:
                return []
            
            filtered_events = []
            for event_id, event_data in all_events.items():
                created_at = datetime.fromisoformat(event_data.get('created_at', ''))
                
                if created_at >= cutoff_time:
                    if severity is None or event_data.get('severity') == severity:
                        filtered_events.append(event_data)
            
            # Sort by created_at (newest first)
            filtered_events.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            return filtered_events
            
        except Exception as e:
            print(f"❌ Error getting security events: {e}")
            return []
    
    # ==================== Compliance Tracking ====================
    
    def store_compliance_check(
        self,
        organization_id: str,
        compliance_type: str,
        status: str,
        details: Dict
    ) -> bool:
        """Store compliance check result"""
        try:
            timestamp = datetime.now()
            
            compliance_entry = {
                'compliance_type': compliance_type,
                'status': status,
                'checked_at': timestamp.isoformat(),
                **details
            }
            
            # Store in compliance collection
            self.security_ref.child('compliance').child(organization_id).child(compliance_type).set(compliance_entry)
            
            print(f"✅ Compliance check stored: {compliance_type} - {status}")
            return True
            
        except Exception as e:
            print(f"❌ Error storing compliance check: {e}")
            return False
    
    def get_compliance_status(self, organization_id: str) -> Dict:
        """Get compliance status for an organization"""
        try:
            compliance_ref = self.security_ref.child('compliance').child(organization_id)
            return compliance_ref.get() or {}
        except Exception as e:
            print(f"❌ Error getting compliance status: {e}")
            return {}
    
    # ==================== Alert Storage ====================
    
    def store_alert(
        self,
        organization_id: str,
        alert_type: str,
        channels_used: List[str],
        success: bool,
        attempts: int,
        duration_ms: float,
        urgency: str,
        threat_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """Store alert delivery information"""
        try:
            timestamp = datetime.now()
            alert_id = f"alert_{timestamp.strftime('%Y%m%d_%H%M%S_%f')}"
            
            alert_entry = {
                'alert_id': alert_id,
                'organization_id': organization_id,
                'alert_type': alert_type,
                'channels_used': channels_used,
                'success': success,
                'attempts': attempts,
                'duration_ms': duration_ms,
                'urgency': urgency,
                'threat_id': threat_id,
                'created_at': timestamp.isoformat(),
                'acknowledged': False,
                'acknowledged_by': None,
                'acknowledged_at': None,
                'metadata': metadata or {}
            }
            
            # Store in alerts collection
            self.security_ref.child('alerts').child(organization_id).child(alert_id).set(alert_entry)
            
            print(f"📢 Alert stored: {alert_type} via {', '.join(channels_used)}")
            return alert_id
            
        except Exception as e:
            print(f"❌ Error storing alert: {e}")
            return None
    
    def acknowledge_alert(self, organization_id: str, alert_id: str, acknowledged_by: str) -> bool:
        """Mark an alert as acknowledged"""
        try:
            self.security_ref.child('alerts').child(organization_id).child(alert_id).update({
                'acknowledged': True,
                'acknowledged_by': acknowledged_by,
                'acknowledged_at': datetime.now().isoformat()
            })
            print(f"✅ Alert acknowledged: {alert_id} by {acknowledged_by}")
            return True
        except Exception as e:
            print(f"❌ Error acknowledging alert: {e}")
            return False
    
    def get_alerts(
        self,
        organization_id: str,
        hours: int = 24,
        acknowledged: Optional[bool] = None
    ) -> List[Dict]:
        """Get alerts for an organization"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            alerts_ref = self.security_ref.child('alerts').child(organization_id)
            all_alerts = alerts_ref.get()
            
            if not all_alerts:
                return []
            
            filtered_alerts = []
            for alert_id, alert_data in all_alerts.items():
                created_at = datetime.fromisoformat(alert_data.get('created_at', ''))
                
                if created_at >= cutoff_time:
                    if acknowledged is None or alert_data.get('acknowledged') == acknowledged:
                        filtered_alerts.append(alert_data)
            
            # Sort by created_at (newest first)
            filtered_alerts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            return filtered_alerts
            
        except Exception as e:
            print(f"❌ Error getting alerts: {e}")
            return []
    
    def get_alert_stats(self, organization_id: str, hours: int = 24) -> Dict:
        """Get alert statistics"""
        try:
            alerts = self.get_alerts(organization_id, hours)
            
            if not alerts:
                return {
                    'total_alerts': 0,
                    'successful_alerts': 0,
                    'failed_alerts': 0,
                    'success_rate': 0.0,
                    'average_duration_ms': 0.0,
                    'channels_used': {},
                    'urgency_distribution': {}
                }
            
            total = len(alerts)
            successful = sum(1 for a in alerts if a.get('success'))
            failed = total - successful
            
            # Calculate average duration
            durations = [a.get('duration_ms', 0) for a in alerts]
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            # Channel statistics
            channels_used = {}
            for alert in alerts:
                for channel in alert.get('channels_used', []):
                    channels_used[channel] = channels_used.get(channel, 0) + 1
            
            # Urgency distribution
            urgency_dist = {}
            for alert in alerts:
                urgency = alert.get('urgency', 'unknown')
                urgency_dist[urgency] = urgency_dist.get(urgency, 0) + 1
            
            return {
                'total_alerts': total,
                'successful_alerts': successful,
                'failed_alerts': failed,
                'success_rate': (successful / total * 100) if total > 0 else 0.0,
                'average_duration_ms': round(avg_duration, 2),
                'channels_used': channels_used,
                'urgency_distribution': urgency_dist
            }
            
        except Exception as e:
            print(f"❌ Error getting alert stats: {e}")
            return {}
    
    # ==================== Cleanup ====================
    
    def cleanup_old_data(self, days: int = 30) -> bool:
        """Clean up old security data"""
        try:
            cutoff_time = datetime.now() - timedelta(days=days)
            cutoff_key = cutoff_time.strftime('%Y%m%d_%H%M%S')
            
            # Clean up old threats
            threats_ref = self.security_ref.child('threats')
            all_threats = threats_ref.get()
            
            if all_threats:
                for threat_id, threat_data in all_threats.items():
                    if threat_data.get('resolved') and threat_data.get('resolved_at', '') < cutoff_time.isoformat():
                        threats_ref.child(threat_id).delete()
            
            print(f"🧹 Cleaned up security data older than {days} days")
            return True
            
        except Exception as e:
            print(f"❌ Error cleaning up old data: {e}")
            return False


# Global instance
_security_analytics_storage = None

def get_security_analytics_storage() -> SecurityAnalyticsStorage:
    """Get or create SecurityAnalyticsStorage instance"""
    global _security_analytics_storage
    if _security_analytics_storage is None:
        _security_analytics_storage = SecurityAnalyticsStorage()
    return _security_analytics_storage
