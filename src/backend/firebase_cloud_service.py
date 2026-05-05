"""
Firebase Cloud Service Implementation (Python)
Task 2.1: Optimize Firebase integration with monitoring
Optimized with retry logic, performance monitoring, and device status tracking
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth, db
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime, timedelta
import asyncio
import json
from cloud_service import (
    CloudService,
    UserCredential,
    DeviceStatus,
    SensorData,
    HealthCheckResult,
    ConnectionMetrics
)


class FirebaseCloudService(CloudService):
    """Firebase implementation with optimizations"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            cred_path = config.get('credentials_path', 'firebase-credentials.json')
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': config.get('database_url', '')
            })
        
        self.db = firestore.client()
        self.realtime_db = db.reference()
        
        print("🔥 Firebase Cloud Service initialized")
    
    # ==================== Authentication ====================
    
    async def login(self, email: str, password: str) -> UserCredential:
        """Authenticate user (Note: Admin SDK doesn't support password auth)"""
        async def _login():
            # In production, this would use Firebase Auth REST API
            # For now, we'll verify the user exists
            try:
                user = auth.get_user_by_email(email)
                return UserCredential(
                    uid=user.uid,
                    email=user.email,
                    display_name=user.display_name
                )
            except auth.UserNotFoundError:
                raise Exception("Invalid email or password")
        
        return await self.with_retry(_login, "Firebase login")
    
    async def logout(self) -> None:
        """Logout (handled client-side in Firebase)"""
        pass
    
    async def fetch_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile"""
        async def _fetch():
            # Check super admin
            super_admin_ref = self.db.collection('roles_super_admin').document(uid)
            super_admin_doc = super_admin_ref.get()
            
            if super_admin_doc.exists:
                data = super_admin_doc.to_dict()
                return {
                    'id': uid,
                    'role': 'superadmin',
                    'email': data.get('email'),
                    'department_name': data.get('departmentName')
                }
            
            # Check organization
            org_ref = self.db.collection('organizations').document(uid)
            org_doc = org_ref.get()
            
            if org_doc.exists:
                data = org_doc.to_dict()
                return {
                    'id': uid,
                    'role': 'admin',
                    **data
                }
            
            return None
        
        return await self.with_retry(_fetch, "Fetch user profile")
    
    # ==================== Organization Management ====================
    
    async def create_organization(self, org_data: Dict[str, Any], super_admin_id: str) -> str:
        """Create organization"""
        async def _create():
            # Create user in Firebase Auth
            user = auth.create_user(
                email=org_data['email'],
                password=org_data['password']
            )
            
            # Create organization document
            org_ref = self.db.collection('organizations').document(user.uid)
            org_ref.set({
                'organizationName': org_data['organizationName'],
                'email': org_data['email'],
                'createdAt': datetime.now().isoformat(),
                'superAdminId': super_admin_id
            })
            
            # Create department
            dept_ref = self.db.collection('departments').document()
            dept_ref.set({
                'departmentName': org_data['departmentName'],
                'organizationName': org_data['organizationName'],
                'email': org_data['email'],
                'building': org_data.get('building', ''),
                'floor': org_data.get('floor', ''),
                'location': org_data.get('location', ''),
                'createdAt': datetime.now().isoformat(),
                'devices': org_data.get('devices', 0),
                'plan': org_data.get('plan', 'free'),
                'status': 'active',
                'superAdminId': super_admin_id,
                'organizationId': user.uid
            })
            
            return user.uid
        
        return await self.with_retry(_create, "Create organization")
    
    async def update_organization_image(self, organization_id: str, image_url: str) -> None:
        """Update organization image"""
        async def _update():
            org_ref = self.db.collection('organizations').document(organization_id)
            org_ref.update({'imageUrl': image_url})
        
        await self.with_retry(_update, "Update organization image")
    
    # ==================== Department Management ====================
    
    async def create_department(self, dept_data: Dict[str, Any], super_admin_id: str) -> str:
        """Create department"""
        async def _create():
            dept_ref = self.db.collection('departments').document()
            dept_ref.set({
                **dept_data,
                'createdAt': datetime.now().isoformat(),
                'status': 'active',
                'superAdminId': super_admin_id
            })
            return dept_ref.id
        
        return await self.with_retry(_create, "Create department")
    
    async def update_department(self, department_id: str, department_data: Dict[str, Any]) -> None:
        """Update department"""
        async def _update():
            dept_ref = self.db.collection('departments').document(department_id)
            dept_ref.update(department_data)
        
        await self.with_retry(_update, "Update department")
    
    async def activate_department(self, department_id: str) -> None:
        """Activate department"""
        await self.update_department(department_id, {'status': 'active'})
    
    async def deactivate_department(self, department_id: str) -> None:
        """Deactivate department"""
        await self.update_department(department_id, {'status': 'inactive'})
    
    # ==================== Device Management ====================
    
    async def create_device(self, device_data: Dict[str, Any]) -> str:
        """Create device"""
        async def _create():
            device_ref = self.db.collection('devices').document()
            device_ref.set({
                **device_data,
                'status': 'offline',
                'lastSeen': datetime.now().isoformat()
            })
            return device_ref.id
        
        return await self.with_retry(_create, "Create device")
    
    async def update_device(self, device_id: str, device_data: Dict[str, Any]) -> None:
        """Update device"""
        async def _update():
            device_ref = self.db.collection('devices').document(device_id)
            device_ref.update(device_data)
        
        await self.with_retry(_update, "Update device")
    
    async def delete_device(self, device_id: str) -> None:
        """Delete device"""
        async def _delete():
            device_ref = self.db.collection('devices').document(device_id)
            device_ref.delete()
        
        await self.with_retry(_delete, "Delete device")
    
    async def update_device_status(self, device_id: str, status_data: Dict[str, Any]) -> None:
        """Update device status"""
        try:
            device_ref = self.db.collection('devices').document(device_id)
            device_ref.update(status_data)
        except Exception as e:
            print(f"Could not update device status for {device_id}: {e}")
    
    # ==================== Real-time Device Monitoring ====================
    
    async def get_device_status(self, device_id: str) -> Optional[DeviceStatus]:
        """Get device status"""
        async def _get():
            device_ref = self.db.collection('devices').document(device_id)
            device_doc = device_ref.get()
            
            if not device_doc.exists:
                return None
            
            data = device_doc.to_dict()
            return DeviceStatus(
                device_id=device_id,
                status=data.get('status', 'offline'),
                last_seen=data.get('lastSeen', datetime.now().isoformat()),
                battery_level=data.get('batteryLevel'),
                signal_strength=data.get('signalStrength'),
                threat_level=data.get('threatLevel'),
                location=data.get('location')
            )
        
        return await self.with_retry(_get, "Get device status")
    
    def subscribe_to_device_status(
        self, 
        device_id: str, 
        callback: Callable[[DeviceStatus], None]
    ) -> Callable[[], None]:
        """Subscribe to device status updates"""
        device_ref = self.db.collection('devices').document(device_id)
        
        def on_snapshot(doc_snapshot, changes, read_time):
            for doc in doc_snapshot:
                if doc.exists:
                    data = doc.to_dict()
                    status = DeviceStatus(
                        device_id=device_id,
                        status=data.get('status', 'offline'),
                        last_seen=data.get('lastSeen', datetime.now().isoformat()),
                        battery_level=data.get('batteryLevel'),
                        signal_strength=data.get('signalStrength'),
                        threat_level=data.get('threatLevel'),
                        location=data.get('location')
                    )
                    callback(status)
        
        # Watch the document
        doc_watch = device_ref.on_snapshot(on_snapshot)
        
        # Return unsubscribe function
        return doc_watch.unsubscribe
    
    async def store_sensor_data(self, sensor_data: SensorData) -> None:
        """Store encrypted sensor data in Realtime Database under device"""
        async def _store():
            # Check if data is already encrypted (from ESP32)
            if hasattr(sensor_data, 'encrypted_data') and sensor_data.encrypted_data:
                # Data is already encrypted, store as-is
                device_ref = self.realtime_db.child('devices').child(sensor_data.device_id).child('data')
                
                # Create timestamp key for the encrypted data entry
                timestamp_key = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]
                
                # Store encrypted payload directly
                try:
                    encrypted_payload = json.loads(sensor_data.encrypted_data)
                    device_ref.child(timestamp_key).set(encrypted_payload)
                    
                    print(f"🔒 Stored encrypted sensor data for device: {sensor_data.device_id}")
                    print(f"   Algorithm: {encrypted_payload.get('algorithm', 'Unknown')}")
                    
                    # Update device status (without decrypting)
                    status_ref = self.realtime_db.child('devices').child(sensor_data.device_id).child('info')
                    status_ref.update({
                        'status': 'online',
                        'last_seen': datetime.now().isoformat(),
                        'encryption_status': 'encrypted',
                        'last_encrypted_at': encrypted_payload.get('encrypted_at', datetime.now().isoformat())
                    })
                    
                except json.JSONDecodeError:
                    # If encrypted_data is not valid JSON, store as string
                    encrypted_entry = {
                        'encrypted_data': sensor_data.encrypted_data,
                        'algorithm': 'AES-256-GCM',
                        'device_id': sensor_data.device_id,
                        'stored_at': datetime.now().isoformat(),
                        'encryption_status': 'encrypted'
                    }
                    device_ref.child(timestamp_key).set(encrypted_entry)
                    print(f"🔒 Stored encrypted sensor data (raw) for device: {sensor_data.device_id}")
            
            else:
                # Legacy: Store unencrypted data (for backward compatibility)
                device_ref = self.realtime_db.child('devices').child(sensor_data.device_id).child('data')
                
                timestamp_key = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]
                
                sensor_entry = {
                    'timestamp': sensor_data.timestamp or datetime.now().isoformat(),
                    'temperature': sensor_data.temperature,
                    'humidity': sensor_data.humidity,
                    'air_pressure': sensor_data.air_pressure,
                    'oxygen_level': sensor_data.oxygen_level,
                    'co2_level': sensor_data.co2_level,
                    'motion_detected': sensor_data.motion_detected,
                    'vibration_level': sensor_data.vibration_level,
                    'door_status': sensor_data.door_status,
                    'sound_level': sensor_data.sound_level,
                    'power_voltage': sensor_data.power_voltage,
                    'wifi_signal_strength': sensor_data.wifi_signal_strength,
                    'system_temperature': sensor_data.system_temperature,
                    'threat_level': sensor_data.threat_level,
                    'anomaly_detected': sensor_data.anomaly_detected,
                    'security_score': sensor_data.security_score,
                    'encryption_status': 'unencrypted'
                }
                
                device_ref.child(timestamp_key).set(sensor_entry)
                
                # Update device status with latest data
                status_ref = self.realtime_db.child('devices').child(sensor_data.device_id).child('info')
                status_ref.update({
                    'status': 'online',
                    'last_seen': datetime.now().isoformat(),
                    'latest_temperature': sensor_data.temperature,
                    'latest_humidity': sensor_data.humidity,
                    'latest_security_score': sensor_data.security_score,
                    'latest_threat_level': sensor_data.threat_level,
                    'encryption_status': 'unencrypted'
                })
                
                print(f"📊 Stored unencrypted sensor data for device: {sensor_data.device_id}")
        
        await self.with_retry(_store, "Store sensor data")
    
    async def get_sensor_history(self, device_id: str, hours: int = 24) -> List[SensorData]:
        """Get sensor history"""
        async def _get():
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            query = (
                self.db.collection('sensorReadings')
                .where('deviceId', '==', device_id)
                .where('timestamp', '>=', cutoff_time)
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
                .limit(1000)
            )
            
            docs = query.stream()
            results = []
            
            for doc in docs:
                data = doc.to_dict()
                results.append(SensorData(
                    device_id=data.get('deviceId'),
                    timestamp=data.get('timestamp').isoformat() if data.get('timestamp') else datetime.now().isoformat(),
                    encrypted_data=data.get('encryptedData'),
                    temperature=data.get('temperature'),
                    humidity=data.get('humidity'),
                    air_pressure=data.get('airPressure'),
                    oxygen_level=data.get('oxygenLevel'),
                    co2_level=data.get('co2Level'),
                    motion_detected=data.get('motionDetected'),
                    vibration_level=data.get('vibrationLevel'),
                    door_status=data.get('doorStatus'),
                    sound_level=data.get('soundLevel'),
                    power_voltage=data.get('powerVoltage'),
                    wifi_signal_strength=data.get('wifiSignalStrength'),
                    system_temperature=data.get('systemTemperature'),
                    threat_level=data.get('threatLevel'),
                    anomaly_detected=data.get('anomalyDetected'),
                    security_score=data.get('securityScore')
                ))
            
            return results
        
        return await self.with_retry(_get, "Get sensor history")
    
    # ==================== Health Check & Monitoring ====================
    
    async def health_check(self) -> HealthCheckResult:
        """Check Firebase health"""
        try:
            async def _check():
                # Try to read a test document
                test_ref = self.db.collection('_health').document('check')
                test_ref.get()
            
            _, latency = await self.measure_latency(_check)
            
            metrics = self.get_metrics()
            error_rate = metrics['error_rate'] / 100
            
            # Determine status
            status = 'healthy'
            if latency > 2000 or error_rate > 0.1:
                status = 'degraded'
            if latency > 5000 or error_rate > 0.5:
                status = 'down'
            
            return HealthCheckResult(
                status=status,
                latency=latency,
                errors=metrics['recent_errors']
            )
        except Exception as e:
            return HealthCheckResult(
                status='down',
                latency=-1,
                errors=[str(e)]
            )
    
    async def get_connection_metrics(self) -> ConnectionMetrics:
        """Get connection metrics"""
        metrics = self.get_metrics()
        
        return ConnectionMetrics(
            active_connections=1,  # Firebase maintains single connection
            avg_latency=metrics['avg_latency_ms'],
            error_rate=metrics['error_rate'] / 100
        )
