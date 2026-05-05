"""
Cloud Service Abstraction Layer (Python)
Task 2.2: Create cloud provider abstraction layer
Provides unified interface for Firebase (current) and Azure (future)
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime
from dataclasses import dataclass
import asyncio


@dataclass
class UserCredential:
    """Unified user credential interface"""
    uid: str
    email: Optional[str]
    display_name: Optional[str]
    token: Optional[str] = None


@dataclass
class DeviceStatus:
    """Device status for real-time monitoring"""
    device_id: str
    status: str  # 'online', 'offline', 'alerting', 'maintenance'
    last_seen: str
    battery_level: Optional[float] = None
    signal_strength: Optional[int] = None
    threat_level: Optional[str] = None  # 'safe', 'warning', 'critical'
    location: Optional[str] = None


@dataclass
class SensorData:
    """Sensor data structure (Azure-compatible)"""
    device_id: str
    timestamp: str
    encrypted_data: Optional[str] = None
    
    # Environmental Control
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_pressure: Optional[float] = None
    oxygen_level: Optional[float] = None
    co2_level: Optional[float] = None
    
    # Security & Access Control
    motion_detected: Optional[bool] = None
    vibration_level: Optional[float] = None
    door_status: Optional[bool] = None
    sound_level: Optional[float] = None
    
    # Power & System Health
    power_voltage: Optional[float] = None
    wifi_signal_strength: Optional[int] = None
    system_temperature: Optional[float] = None
    
    # Security Analysis
    threat_level: Optional[str] = None
    anomaly_detected: Optional[bool] = None
    security_score: Optional[int] = None


@dataclass
class HealthCheckResult:
    """Health check result"""
    status: str  # 'healthy', 'degraded', 'down'
    latency: float  # milliseconds
    errors: List[str]


@dataclass
class ConnectionMetrics:
    """Connection performance metrics"""
    active_connections: int
    avg_latency: float
    error_rate: float


class CloudService(ABC):
    """Abstract cloud service interface"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.retry_attempts = 3
        self.retry_delay = 1.0  # seconds
        
        # Performance metrics
        self.metrics = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_latency': 0.0,
            'errors': []
        }
    
    # ==================== Authentication ====================
    
    @abstractmethod
    async def login(self, email: str, password: str) -> UserCredential:
        """Authenticate user and return credentials"""
        pass
    
    @abstractmethod
    async def logout(self) -> None:
        """Logout current user"""
        pass
    
    @abstractmethod
    async def fetch_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile by UID"""
        pass
    
    # ==================== Organization Management ====================
    
    @abstractmethod
    async def create_organization(self, org_data: Dict[str, Any], super_admin_id: str) -> str:
        """Create new organization, returns organization ID"""
        pass
    
    @abstractmethod
    async def update_organization_image(self, organization_id: str, image_url: str) -> None:
        """Update organization profile image"""
        pass
    
    # ==================== Department Management ====================
    
    @abstractmethod
    async def create_department(self, dept_data: Dict[str, Any], super_admin_id: str) -> str:
        """Create new department, returns department ID"""
        pass
    
    @abstractmethod
    async def update_department(self, department_id: str, department_data: Dict[str, Any]) -> None:
        """Update department information"""
        pass
    
    @abstractmethod
    async def activate_department(self, department_id: str) -> None:
        """Activate department"""
        pass
    
    @abstractmethod
    async def deactivate_department(self, department_id: str) -> None:
        """Deactivate department"""
        pass
    
    # ==================== Device Management ====================
    
    @abstractmethod
    async def create_device(self, device_data: Dict[str, Any]) -> str:
        """Create new device, returns device ID"""
        pass
    
    @abstractmethod
    async def update_device(self, device_id: str, device_data: Dict[str, Any]) -> None:
        """Update device information"""
        pass
    
    @abstractmethod
    async def delete_device(self, device_id: str) -> None:
        """Delete device"""
        pass
    
    @abstractmethod
    async def update_device_status(self, device_id: str, status_data: Dict[str, Any]) -> None:
        """Update device status"""
        pass
    
    # ==================== Real-time Device Monitoring ====================
    
    @abstractmethod
    async def get_device_status(self, device_id: str) -> Optional[DeviceStatus]:
        """Get current device status"""
        pass
    
    @abstractmethod
    def subscribe_to_device_status(
        self, 
        device_id: str, 
        callback: Callable[[DeviceStatus], None]
    ) -> Callable[[], None]:
        """
        Subscribe to device status updates
        Returns unsubscribe function
        """
        pass
    
    @abstractmethod
    async def store_sensor_data(self, sensor_data: SensorData) -> None:
        """Store sensor reading"""
        pass
    
    @abstractmethod
    async def get_sensor_history(self, device_id: str, hours: int = 24) -> List[SensorData]:
        """Get sensor data history"""
        pass
    
    # ==================== Health Check & Monitoring ====================
    
    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        """Check service health"""
        pass
    
    @abstractmethod
    async def get_connection_metrics(self) -> ConnectionMetrics:
        """Get connection performance metrics"""
        pass
    
    # ==================== Helper Methods ====================
    
    async def with_retry(self, operation: Callable, context: str) -> Any:
        """Execute operation with retry logic"""
        last_error = None
        
        for attempt in range(1, self.retry_attempts + 1):
            try:
                start_time = datetime.now()
                result = await operation()
                latency = (datetime.now() - start_time).total_seconds() * 1000
                
                self._record_metric(True, latency)
                return result
                
            except Exception as e:
                last_error = e
                print(f"{context} attempt {attempt}/{self.retry_attempts} failed: {e}")
                
                if attempt < self.retry_attempts:
                    await asyncio.sleep(self.retry_delay * attempt)
        
        self._record_metric(False, 0, str(last_error))
        raise Exception(f"{context} failed after {self.retry_attempts} attempts: {last_error}")
    
    async def measure_latency(self, operation: Callable) -> tuple[Any, float]:
        """Measure operation latency"""
        start_time = datetime.now()
        result = await operation()
        latency = (datetime.now() - start_time).total_seconds() * 1000
        return result, latency
    
    def _record_metric(self, success: bool, latency: float, error: Optional[str] = None):
        """Record performance metric"""
        self.metrics['total_requests'] += 1
        
        if success:
            self.metrics['successful_requests'] += 1
            self.metrics['total_latency'] += latency
        else:
            self.metrics['failed_requests'] += 1
            if error:
                self.metrics['errors'].append(error)
                # Keep only last 100 errors
                if len(self.metrics['errors']) > 100:
                    self.metrics['errors'].pop(0)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        total = self.metrics['total_requests']
        avg_latency = (
            self.metrics['total_latency'] / self.metrics['successful_requests']
            if self.metrics['successful_requests'] > 0
            else 0
        )
        error_rate = (
            self.metrics['failed_requests'] / total
            if total > 0
            else 0
        )
        
        return {
            'total_requests': total,
            'successful_requests': self.metrics['successful_requests'],
            'failed_requests': self.metrics['failed_requests'],
            'avg_latency_ms': round(avg_latency, 2),
            'error_rate': round(error_rate * 100, 2),
            'recent_errors': self.metrics['errors'][-10:]
        }


class CloudServiceFactory:
    """Factory for creating cloud service instances"""
    
    _instance: Optional[CloudService] = None
    
    @classmethod
    def get_instance(cls, provider: str = "firebase", config: Optional[Dict[str, Any]] = None) -> CloudService:
        """Get or create cloud service instance"""
        if cls._instance is None:
            if config is None:
                raise ValueError("Config required for first initialization")
            cls._instance = cls._create_service(provider, config)
        
        return cls._instance
    
    @classmethod
    def _create_service(cls, provider: str, config: Dict[str, Any]) -> CloudService:
        """Create cloud service based on provider"""
        if provider == "firebase":
            from firebase_cloud_service import FirebaseCloudService
            return FirebaseCloudService(config)
        elif provider == "azure":
            from azure_cloud_service import AzureCloudService
            return AzureCloudService(config)
        elif provider == "demo":
            from demo_cloud_service import DemoCloudService
            return DemoCloudService(config)
        else:
            raise ValueError(f"Unsupported cloud provider: {provider}")
    
    @classmethod
    def reset(cls):
        """Reset singleton instance"""
        cls._instance = None
