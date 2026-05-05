"""
Configuration settings for SafeEdge Backend
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # Cloud Provider Configuration
    cloud_provider: str = "firebase"  # "firebase" or "azure"
    
    # Firebase Configuration
    firebase_credentials_path: str = "../../lumeshield-x-firebase-adminsdk-fbsvc-e88056ba46.json"
    firebase_database_url: str = "https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/"
    
    # Azure Configuration (Future)
    azure_connection_string: Optional[str] = None
    azure_storage_account: Optional[str] = None
    azure_iot_hub_connection: Optional[str] = None
    
    # AI Service Configuration
    groq_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    
    # Feature Flags
    enable_voice_alerts: bool = True
    enable_phone_alerts: bool = True
    enable_ml_pipeline: bool = True
    
    # Performance Settings
    max_processing_time: int = 30000  # 30 seconds
    rate_limit_requests: int = 30     # per minute
    
    # Demo Mode Settings
    demo_mode: bool = False
    presentation_mode: bool = False
    
    # Twilio Configuration (Voice Calls)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from_number: Optional[str] = None
    twilio_to_number: Optional[str] = None
    
    # Emergency Contacts (Multiple Numbers)
    emergency_contacts: Optional[str] = None
    
    # TwiML App Configuration
    twiml_app_sid: Optional[str] = None
    webhook_base_url: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Global settings instance
settings = Settings()