"""
Firebase ESP32 Service
======================
Service for managing ESP32 devices with Firebase Realtime Database.
Implements circular buffer pattern (200 entries) for sensor history and alerts.

Author: SafeEdge Team - Imagine Cup 2026
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import firebase_admin
from firebase_admin import db
import asyncio
from pydantic import BaseModel


class SensorReading(BaseModel):
    timestamp: str
    temperature: float
    humidity: float
    powerVoltage: float
    networkSignalStrength: int
    systemTemperature: float
    ethernetConnected: bool
    threatLevel: str
    securityScore: int
    anomalyDetected: bool


class AlertEntry(BaseModel):
    alertId: str
    timestamp: str
    severity: str
    message: str
    attackType: str
    threatLevel: str
    securityScore: int
    resolved: bool
    actionTaken: str
    attackSource: str


class FirebaseESP32Service:
    """Service for ESP32 device management with Firebase"""
    
    MAX_BUFFER_ENTRIES = 200
    
    def __init__(self):
        """Initialize Firebase ESP32 Service"""
        self.db_ref = db.reference()
    
    # ==================== Device Management ====================
    
    def get_device_info(self, device_id: str) -> Optional[Dict]:
        """Get device information from Firebase"""
        try:
            ref = self.db_ref.child(f'devices/{device_id}/info')
            return ref.get()
        except Exception as e:
            print(f"Error getting device info: {e}")
            return None
    
    def get_device_current_data(self, device_id: str) -> Optional[Dict]:
        """Get current sensor data from Firebase"""
        try:
            ref = self.db_ref.child(f'devices/{device_id}/current')
            return ref.get()
        except Exception as e:
            print(f"Error getting current data: {e}")
            return None
    
    def get_all_devices(self, organization_id: Optional[str] = None) -> List[Dict]:
        """Get all devices, optionally filtered by organization"""
        try:
            devices_ref = self.db_ref.child('devices')
            all_devices = devices_ref.get()
            
            if not all_devices:
                return []
            
            devices_list = []
            for device_id, device_data in all_devices.items():
                info = device_data.get('info', {})
                current = device_data.get('current', {})
                
                # Filter by organization if specified
                if organization_id and info.get('organizationId') != organization_id:
                    continue
                
                devices_list.append({
                    'deviceId': device_id,
                    'deviceName': info.get('deviceName', device_id),
                    'organizationId': info.get('organizationId'),
                    'location': info.get('location'),
                    'status': info.get('status', 'offline'),
                    'firmwareVersion': info.get('firmwareVersion'),
                    'ipAddress': info.get('ipAddress'),
                    'lastSeen': info.get('lastSeen'),
                    'threatLevel': current.get('threatLevel', 'safe'),
                    'securityScore': current.get('securityScore', 100),
                    'temperature': current.get('temperature'),
                    'humidity': current.get('humidity'),
                    'connectedDevices': current.get('connectedDevices', 0),
                    'blockedDevices': current.get('blockedDevices', 0)
                })
            
            return devices_list
        except Exception as e:
            print(f"Error getting all devices: {e}")
            return []
    
    # ==================== Circular Buffer - Sensor History ====================
    
    def get_sensor_history(
        self, 
        device_id: str, 
        limit: int = 50,
        start_index: Optional[int] = None
    ) -> Dict:
        """
        Get sensor history from circular buffer.
        Handles wrap-around correctly.
        """
        try:
            # Get metadata
            metadata_ref = self.db_ref.child(f'devices/{device_id}/sensorHistory/metadata')
            metadata = metadata_ref.get()
            
            if not metadata:
                return {'count': 0, 'data': [], 'metadata': None}
            
            current_index = metadata.get('currentIndex', 0)
            total_writes = metadata.get('totalWrites', 0)
            oldest_entry = metadata.get('oldestEntry', 0)
            newest_entry = metadata.get('newestEntry', 0)
            
            # Get readings
            readings_ref = self.db_ref.child(f'devices/{device_id}/sensorHistory/readings')
            all_readings = readings_ref.get()
            
            if not all_readings:
                return {'count': 0, 'data': [], 'metadata': metadata}
            
            # Determine how many entries to read
            available_entries = min(total_writes, self.MAX_BUFFER_ENTRIES)
            entries_to_read = min(limit, available_entries)
            
            # Read entries in reverse chronological order (newest first)
            readings_list = []
            
            if total_writes < self.MAX_BUFFER_ENTRIES:
                # Buffer not full yet, read from 0 to currentIndex-1
                for i in range(current_index - 1, max(-1, current_index - entries_to_read - 1), -1):
                    if str(i) in all_readings:
                        readings_list.append(all_readings[str(i)])
            else:
                # Buffer is full, handle wrap-around
                # Start from newest_entry and go backwards
                idx = newest_entry
                for _ in range(entries_to_read):
                    if str(idx) in all_readings:
                        readings_list.append(all_readings[str(idx)])
                    idx = (idx - 1) % self.MAX_BUFFER_ENTRIES
            
            return {
                'count': len(readings_list),
                'data': readings_list,
                'metadata': metadata,
                'totalWrites': total_writes,
                'bufferSize': self.MAX_BUFFER_ENTRIES
            }
        except Exception as e:
            print(f"Error getting sensor history: {e}")
            return {'count': 0, 'data': [], 'error': str(e)}
    
    def get_sensor_history_range(
        self,
        device_id: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> List[Dict]:
        """Get sensor history within a time range"""
        try:
            history = self.get_sensor_history(device_id, limit=self.MAX_BUFFER_ENTRIES)
            data = history.get('data', [])
            
            if not start_time and not end_time:
                return data
            
            # Filter by time range
            filtered = []
            for reading in data:
                timestamp = reading.get('timestamp', '')
                if start_time and timestamp < start_time:
                    continue
                if end_time and timestamp > end_time:
                    continue
                filtered.append(reading)
            
            return filtered
        except Exception as e:
            print(f"Error getting sensor history range: {e}")
            return []
    
    # ==================== Circular Buffer - Alerts ====================
    
    def get_alerts(
        self,
        device_id: str,
        limit: int = 50,
        severity: Optional[str] = None,
        resolved: Optional[bool] = None
    ) -> Dict:
        """
        Get alerts from circular buffer.
        Handles wrap-around correctly.
        """
        try:
            # Get metadata
            metadata_ref = self.db_ref.child(f'devices/{device_id}/alerts/metadata')
            metadata = metadata_ref.get()
            
            if not metadata:
                return {'count': 0, 'alerts': [], 'metadata': None}
            
            current_index = metadata.get('currentIndex', 0)
            total_alerts = metadata.get('totalAlerts', 0)
            newest_entry = metadata.get('newestEntry', 0)
            
            # Get alert entries
            entries_ref = self.db_ref.child(f'devices/{device_id}/alerts/entries')
            all_entries = entries_ref.get()
            
            if not all_entries:
                return {'count': 0, 'alerts': [], 'metadata': metadata}
            
            # Determine how many entries to read
            available_entries = min(total_alerts, self.MAX_BUFFER_ENTRIES)
            entries_to_read = min(limit, available_entries)
            
            # Read entries in reverse chronological order (newest first)
            alerts_list = []
            
            if total_alerts < self.MAX_BUFFER_ENTRIES:
                # Buffer not full yet
                for i in range(current_index - 1, max(-1, current_index - entries_to_read - 1), -1):
                    if str(i) in all_entries:
                        alert = all_entries[str(i)]
                        # Apply filters
                        if severity and alert.get('severity') != severity:
                            continue
                        if resolved is not None and alert.get('resolved') != resolved:
                            continue
                        alerts_list.append(alert)
            else:
                # Buffer is full, handle wrap-around
                idx = newest_entry
                for _ in range(entries_to_read):
                    if str(idx) in all_entries:
                        alert = all_entries[str(idx)]
                        # Apply filters
                        if severity and alert.get('severity') != severity:
                            idx = (idx - 1) % self.MAX_BUFFER_ENTRIES
                            continue
                        if resolved is not None and alert.get('resolved') != resolved:
                            idx = (idx - 1) % self.MAX_BUFFER_ENTRIES
                            continue
                        alerts_list.append(alert)
                    idx = (idx - 1) % self.MAX_BUFFER_ENTRIES
            
            return {
                'count': len(alerts_list),
                'alerts': alerts_list,
                'metadata': metadata,
                'totalAlerts': total_alerts,
                'bufferSize': self.MAX_BUFFER_ENTRIES
            }
        except Exception as e:
            print(f"Error getting alerts: {e}")
            return {'count': 0, 'alerts': [], 'error': str(e)}
    
    def resolve_alert(self, device_id: str, alert_index: int, resolution: str, resolved_by: str) -> bool:
        """Mark an alert as resolved"""
        try:
            alert_ref = self.db_ref.child(f'devices/{device_id}/alerts/entries/{alert_index}')
            alert_ref.update({
                'resolved': True,
                'resolvedAt': datetime.now().isoformat(),
                'resolution': resolution,
                'resolvedBy': resolved_by
            })
            return True
        except Exception as e:
            print(f"Error resolving alert: {e}")
            return False
    
    # ==================== Commands ====================
    
    def send_command(self, device_id: str, command: str, parameters: Optional[Dict] = None) -> bool:
        """Send command to ESP32 device"""
        try:
            command_ref = self.db_ref.child(f'commands/{device_id}')
            command_ref.set({
                'pending': command,
                'timestamp': datetime.now().isoformat(),
                'parameters': parameters or {}
            })
            print(f"✅ Command sent to {device_id}: {command}")
            return True
        except Exception as e:
            print(f"Error sending command: {e}")
            return False
    
    def get_pending_command(self, device_id: str) -> Optional[Dict]:
        """Get pending command for device"""
        try:
            command_ref = self.db_ref.child(f'commands/{device_id}')
            return command_ref.get()
        except Exception as e:
            print(f"Error getting pending command: {e}")
            return None
    
    def clear_command(self, device_id: str) -> bool:
        """Clear pending command"""
        try:
            command_ref = self.db_ref.child(f'commands/{device_id}/pending')
            command_ref.delete()
            return True
        except Exception as e:
            print(f"Error clearing command: {e}")
            return False
    
    # ==================== IoT Device Management ====================
    
    def get_connected_iot_devices(self, device_id: str) -> List[Dict]:
        """Get IoT devices connected to ESP32 gateway"""
        try:
            iot_ref = self.db_ref.child(f'devices/{device_id}/connectedIoTDevices')
            devices = iot_ref.get()
            
            if not devices:
                return []
            
            return [
                {
                    'deviceId': dev_id,
                    **dev_data
                }
                for dev_id, dev_data in devices.items()
            ]
        except Exception as e:
            print(f"Error getting connected IoT devices: {e}")
            return []
    
    def get_blocked_devices(self, device_id: str) -> List[Dict]:
        """Get blocked IoT devices"""
        try:
            blocked_ref = self.db_ref.child(f'devices/{device_id}/blockedDevices')
            devices = blocked_ref.get()
            
            if not devices:
                return []
            
            return [
                {
                    'deviceId': dev_id,
                    **dev_data
                }
                for dev_id, dev_data in devices.items()
            ]
        except Exception as e:
            print(f"Error getting blocked devices: {e}")
            return []
    
    # ==================== Statistics ====================
    
    def get_device_statistics(self, device_id: str) -> Dict:
        """Get statistics for a device"""
        try:
            # Get sensor history metadata
            sensor_meta = self.db_ref.child(f'devices/{device_id}/sensorHistory/metadata').get()
            alert_meta = self.db_ref.child(f'devices/{device_id}/alerts/metadata').get()
            
            # Get current data
            current = self.get_device_current_data(device_id)
            
            # Get alerts
            alerts = self.get_alerts(device_id, limit=self.MAX_BUFFER_ENTRIES)
            
            # Calculate statistics
            critical_alerts = sum(1 for a in alerts.get('alerts', []) if a.get('severity') == 'CRITICAL')
            warning_alerts = sum(1 for a in alerts.get('alerts', []) if a.get('severity') == 'WARNING')
            resolved_alerts = sum(1 for a in alerts.get('alerts', []) if a.get('resolved'))
            
            return {
                'deviceId': device_id,
                'totalSensorWrites': sensor_meta.get('totalWrites', 0) if sensor_meta else 0,
                'totalAlerts': alert_meta.get('totalAlerts', 0) if alert_meta else 0,
                'criticalAlerts': critical_alerts,
                'warningAlerts': warning_alerts,
                'resolvedAlerts': resolved_alerts,
                'currentThreatLevel': current.get('threatLevel', 'safe') if current else 'unknown',
                'currentSecurityScore': current.get('securityScore', 100) if current else 100,
                'connectedDevices': current.get('connectedDevices', 0) if current else 0,
                'blockedDevices': current.get('blockedDevices', 0) if current else 0
            }
        except Exception as e:
            print(f"Error getting device statistics: {e}")
            return {}
    
    # ==================== Real-Time Listeners ====================
    
    def listen_to_device_changes(self, device_id: str, callback):
        """Listen to real-time changes for a device"""
        try:
            device_ref = self.db_ref.child(f'devices/{device_id}/current')
            device_ref.listen(callback)
        except Exception as e:
            print(f"Error setting up listener: {e}")
    
    def listen_to_alerts(self, device_id: str, callback):
        """Listen to new alerts for a device"""
        try:
            alerts_ref = self.db_ref.child(f'devices/{device_id}/alerts/entries')
            alerts_ref.listen(callback)
        except Exception as e:
            print(f"Error setting up alert listener: {e}")


# Singleton instance
_firebase_esp32_service = None

def get_firebase_esp32_service() -> FirebaseESP32Service:
    """Get singleton instance of Firebase ESP32 Service"""
    global _firebase_esp32_service
    if _firebase_esp32_service is None:
        _firebase_esp32_service = FirebaseESP32Service()
    return _firebase_esp32_service
