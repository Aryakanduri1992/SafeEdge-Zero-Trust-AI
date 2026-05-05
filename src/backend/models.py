"""
Data Models for SafeEdge Backend
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


class SensorData(BaseModel):
    """ESP32 Sensor Data Model"""
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
    threat_level: Optional[Literal["safe", "warning", "critical"]] = None
    anomaly_detected: Optional[bool] = None
    security_score: Optional[int] = Field(None, ge=0, le=100)


class SecurityEvent(BaseModel):
    """Security Event Model"""
    id: str
    device_id: str
    timestamp: str
    threat_type: Literal[
        "temperature_attack",
        "access_attack",
        "power_attack",
        "network_attack",
        "vibration_attack",
        "environmental_attack",
        "none"
    ]
    threat_level: Literal["safe", "warning", "critical"]
    description: str
    sensor_data: SensorData
    anomaly_score: int = Field(ge=0, le=100)
    affected_parameters: List[str]


class BlockingAttempt(BaseModel):
    """Blocking Attempt Model"""
    id: str
    event_id: str
    timestamp: str
    strategy: Literal[
        "network_isolation",
        "system_backup",
        "temperature_override",
        "access_lockdown",
   