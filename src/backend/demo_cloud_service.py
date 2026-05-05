"""
Demo Cloud Service for SafeEdge Presentations
Provides simulated data for live demonstrations without requiring Firebase
"""

import asyncio
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from cloud_service import CloudService, SensorData, DeviceStatus, HealthCheckResult, ConnectionMetrics, UserCredential

class DemoCloudService(CloudService):
    """Demo cloud service with simulated data for presentations"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.demo_devices = self._create_demo_devices()
        self.demo_sensor_data = self._generate_demo_sensor_data()
        print("🎭 Demo Cloud Service initialized - Ready for live presentation!")
    
    def _create_demo_devices(self) -> List[DeviceStatus]:
        """Create demo devices for presentation"""
        return [
            DeviceStatus(
                device_id="incubator_demo_001",
                status="online",
                last_seen=datetime.now().isoformat(),
                battery_level=87,
                signal_strength=-45,
                threat_level="safe",
                location="Ward A - Room 101"
            ),
            DeviceStatus(
                device_id="incubator_demo_002", 
                status="online",
                last_seen=datetime.now().isoformat(),
                battery_level=92,
                signal_strength=-52,
                threat_level="warning",
                location="Ward A - Room 102"
            ),
            DeviceStatus(
                device_id="incubator_demo_003",
                status="online", 
                last_seen=datetime.now().isoformat(),
                battery_level=78,
                signal_strength=-38,
                threat_level="safe",
                location="Ward B - Room 201"
            )
        ]
    
    def _generate_demo_sensor_data(self) -> List[SensorData]:
        """Generate realistic sensor data for demo"""
        data = []
        base_time = datetime.now() - timedelta(hours=24)
        
        for i in range(100):  # 24 hours of data
            timestamp = base_time + timedelta(minutes=i * 14.4)  # Every ~14 minutes
            
            # Simulate realistic hospital incubator data
            temp_base = 37.0 + random.uniform(-0.5, 0.5)
            humidity_base = 55.0 + random.uniform(-5, 5)
            
            for device_id in ["incubator_demo_001", "incubator_demo_002", "incubator_demo_003"]:
                sensor_data = SensorData(
                    device_id=device_id,
                    timestamp=timestamp.isoformat(),
                    temperature=temp_base + random.uniform(-0.2, 0.2),
                    humidity=humidity_base + random.uniform(-2, 2),
                    air_pressure=1013.25 + random.uniform(-5, 5),
                    oxygen_level=21.0 + random.uniform(-1, 1),
                    co2_level=0.04 + random.uniform(-0.01, 0.01),
                    motion_detected=random.choice([True, False]) if random.random() < 0.1 else False,
                    vibration_level=0.1 + random.uniform(0, 0.3),
                    door_status=random.choice([True, False]) if random.random() < 0.05 else False,
                    sound_level=45.0 + random.uniform(-10, 15),
                    power_voltage=12.0 + random.uniform(-0.5, 0.5),
                    wifi_signal_strength=random.randint(-70, -30),
                    system_temperature=35.0 + random.uniform(-2, 5),
                    threat_level="safe" if random.random() > 0.1 else "warning",
                    anomaly_detected=random.random() < 0.05,
                    security_score=random.randint(85, 100),
                    encrypted_data=f"demo_encrypted_data_{i}"
                )
                data.append(sensor_data)
        
        return data
    
    # ==================== Authentication ====================
    
    async def login(self, email: str, password: str) -> UserCredential:
        """Demo login - always succeeds for presentation"""
        await asyncio.sleep(0.5)  # Simulate network delay
        
        return UserCredential(
            uid="demo_user_123",
            email=email,
            display_name="Demo Hospital Admin",
            token="demo_token_for_presentation"
        )
    
    async def fetch_user_profile(self, uid: str) -> Dict[str, Any]:
        """Demo user profile"""
        return {
            "uid": uid,
            "organizationName": "SafeEdge Demo Hospital",
            "role": "admin",
            "departments": ["NICU", "ICU", "Emergency"],
            "deviceQuota": 50,
            "plan": "Enterprise"
        }
    
    # ==================== Device Management ====================
    
    async def create_device(self, device_data: Dict[str, Any]) -> str:
        """Demo device creation"""
        device_id = f"demo_device_{int(time.time())}"
        print(f"📱 Demo: Created device {device_id}")
        return device_id
    
    async def get_device_status(self, device_id: str) -> Optional[DeviceStatus]:
        """Get demo device status"""
        for device in self.demo_devices:
            if device.device_id == device_id:
                # Add some realistic variation
                device.last_seen = datetime.now().isoformat()
                device.battery_level = max(20, min(100, device.battery_level + random.randint(-2, 2)))
                device.signal_strength = max(-90, min(-30, device.signal_strength + random.randint(-5, 5)))
                return device
        
        return None
    
    # ==================== Sensor Data ====================
    
    async def store_sensor_data(self, sensor_data: SensorData) -> bool:
        """Demo sensor data storage"""
        print(f"📊 Demo: Stored sensor data from {sensor_data.device_id}")
        return True
    
    async def get_sensor_history(self, device_id: str, hours: int = 24) -> List[SensorData]:
        """Get demo sensor history"""
        # Filter data for the specific device
        device_data = [data for data in self.demo_sensor_data if data.device_id == device_id]
        
        # Return recent data based on hours requested
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_data = [
            data for data in device_data 
            if datetime.fromisoformat(data.timestamp) > cutoff_time
        ]
        
        return recent_data[-50:]  # Return last 50 readings
    
    # ==================== Health & Monitoring ====================
    
    async def health_check(self) -> HealthCheckResult:
        """Demo health check - always healthy"""
        return HealthCheckResult(
            status="healthy",
            latency=random.randint(50, 150),  # Simulate realistic latency
            errors=[]
        )
    
    async def get_connection_metrics(self) -> ConnectionMetrics:
        """Demo connection metrics"""
        return ConnectionMetrics(
            active_connections=len(self.demo_devices),
            avg_latency=random.randint(80, 120),
            error_rate=random.uniform(0.1, 0.5)  # Very low error rate for demo
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Demo performance metrics"""
        return {
            "provider": "demo",
            "uptime": "99.9%",
            "total_devices": len(self.demo_devices),
            "active_devices": len([d for d in self.demo_devices if d.status == "online"]),
            "total_sensor_readings": len(self.demo_sensor_data),
            "avg_response_time": f"{random.randint(80, 120)}ms",
            "demo_mode": True,
            "presentation_ready": True
        }
    
    # ==================== Demo-Specific Methods ====================
    
    def simulate_attack(self, device_id: str, attack_type: str) -> Dict[str, Any]:
        """Simulate an attack for demo purposes"""
        device = next((d for d in self.demo_devices if d.device_id == device_id), None)
        if not device:
            return {"success": False, "error": "Device not found"}
        
        # Update device status for attack simulation
        if attack_type == "temperature":
            device.threat_level = "critical"
        elif attack_type == "access":
            device.threat_level = "warning"
        elif attack_type == "power":
            device.threat_level = "critical"
        elif attack_type == "network":
            device.threat_level = "warning"
        
        print(f"🚨 Demo: Simulating {attack_type} attack on {device_id}")
        
        return {
            "success": True,
            "attack_type": attack_type,
            "device_id": device_id,
            "threat_level": device.threat_level,
            "message": f"Attack simulation started on {device_id}"
        }
    
    def reset_device_status(self, device_id: str) -> bool:
        """Reset device to safe status after demo"""
        device = next((d for d in self.demo_devices if d.device_id == device_id), None)
        if device:
            device.threat_level = "safe"
            device.status = "online"
            print(f"✅ Demo: Reset {device_id} to safe status")
            return True
        return False
    
    def get_demo_statistics(self) -> Dict[str, Any]:
        """Get demo-specific statistics for presentation"""
        return {
            "total_demonstrations": 47,
            "successful_blocks": 45,
            "judge_rating": 9.2,
            "avg_response_time": 2.8,
            "patients_protected": 1247,
            "cost_savings": "$4.5M+",
            "roi_multiplier": "15.2x",
            "uptime": "99.7%",
            "demo_mode": True,
            "competition_ready": True
        }
    
    # ==================== Required Abstract Methods ====================
    
    async def logout(self, uid: str) -> bool:
        """Demo logout"""
        return True
    
    async def create_organization(self, org_data: Dict[str, Any]) -> str:
        """Demo organization creation"""
        return "demo_org_123"
    
    async def update_organization_image(self, org_id: str, image_url: str) -> bool:
        """Demo organization image update"""
        return True
    
    async def create_department(self, dept_data: Dict[str, Any]) -> str:
        """Demo department creation"""
        return "demo_dept_123"
    
    async def update_department(self, dept_id: str, updates: Dict[str, Any]) -> bool:
        """Demo department update"""
        return True
    
    async def activate_department(self, dept_id: str) -> bool:
        """Demo department activation"""
        return True
    
    async def deactivate_department(self, dept_id: str) -> bool:
        """Demo department deactivation"""
        return True
    
    async def update_device(self, device_id: str, updates: Dict[str, Any]) -> bool:
        """Demo device update"""
        return True
    
    async def delete_device(self, device_id: str) -> bool:
        """Demo device deletion"""
        return True
    
    async def update_device_status(self, device_id: str, status_data: Dict[str, Any]) -> bool:
        """Demo device status update"""
        return True
    
    async def subscribe_to_device_status(self, device_id: str, callback: Callable) -> bool:
        """Demo device status subscription"""
        return True