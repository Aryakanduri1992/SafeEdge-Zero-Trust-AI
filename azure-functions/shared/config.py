"""
LumeEdge Configuration Management
Centralized configuration with secure defaults
"""

import os
from typing import List, Optional
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration loaded from environment variables"""
    
    # Azure SQL
    sql_connection_string: str
    
    # IoT Hub
    iothub_connection_string: str
    iothub_name: str
    
    # Twilio Alerts
    twilio_account_sid: Optional[str]
    twilio_auth_token: Optional[str]
    twilio_phone_number: Optional[str]
    alert_phone_number: Optional[str]
    
    # Security Settings
    allowed_device_ids: List[str]
    enable_anomaly_detection: bool
    enable_phone_alerts: bool
    
    # CORS
    cors_origins: List[str]
    
    @classmethod
    def from_environment(cls) -> 'Config':
        """Load configuration from environment variables"""
        
        # Parse comma-separated device IDs
        allowed_devices = os.environ.get('AllowedDeviceIds', 'lumeedge-001')
        device_list = [d.strip() for d in allowed_devices.split(',') if d.strip()]
        
        # Parse CORS origins
        cors = os.environ.get('CORS_ORIGINS', 'http://localhost:9002')
        cors_list = [c.strip() for c in cors.split(',') if c.strip()]
        
        return cls(
            # Azure SQL
            sql_connection_string=os.environ.get('AzureSqlConnectionString', ''),
            
            # IoT Hub
            iothub_connection_string=os.environ.get('IoTHubConnectionString', ''),
            iothub_name=os.environ.get('IoTHubEventHubName', 'lume-iothub'),
            
            # Twilio
            twilio_account_sid=os.environ.get('TwilioAccountSid'),
            twilio_auth_token=os.environ.get('TwilioAuthToken'),
            twilio_phone_number=os.environ.get('TwilioPhoneNumber'),
            alert_phone_number=os.environ.get('AlertPhoneNumber'),
            
            # Security
            allowed_device_ids=device_list,
            enable_anomaly_detection=os.environ.get('EnableAnomalyDetection', 'true').lower() == 'true',
            enable_phone_alerts=os.environ.get('EnablePhoneAlerts', 'false').lower() == 'true',
            
            # CORS
            cors_origins=cors_list
        )
    
    def is_device_allowed(self, device_id: str) -> bool:
        """Check if device ID is in the allowed list (Zero-Trust validation)"""
        return device_id in self.allowed_device_ids
    
    def has_twilio_config(self) -> bool:
        """Check if Twilio is properly configured"""
        return all([
            self.twilio_account_sid,
            self.twilio_auth_token,
            self.twilio_phone_number,
            self.alert_phone_number
        ])


# Global config instance (lazy loaded)
_config: Optional[Config] = None


def get_config() -> Config:
    """Get or create the global configuration instance"""
    global _config
    if _config is None:
        _config = Config.from_environment()
    return _config
