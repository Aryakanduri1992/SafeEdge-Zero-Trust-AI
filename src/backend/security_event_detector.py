"""
Security Event Detector (Python)
Task 3.1: Local attack detection and blocking system
Analyzes incoming sensor data for anomalies and security threats
"""

from dataclasses import dataclass
from typing import Optional, List
from enum import Enum


class ThreatType(str, Enum):
    """Types of security threats"""
    TEMPERATURE_ATTACK = "temperature_attack"
    ACCESS_ATTACK = "access_attack"
    POWER_ATTACK = "power_attack"
    NETWORK_ATTACK = "network_attack"
    VIBRATION_ATTACK = "vibration_attack"
    ENVIRONMENTAL_ATTACK = "environmental_attack"
    NONE = "none"


class ThreatLevel(str, Enum):
    """Severity levels"""
    SAFE = "safe"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class PatientSafetyThresholds:
    """Patient safety thresholds for hospital incubators"""
    # Temperature (°C)
    temp_min: float = 36.5
    temp_max: float = 37.5
    temp_critical: float = 0.5  # ±0.5°C triggers alert
    
    # Humidity (%)
    humidity_min: float = 50.0
    humidity_max: float = 60.0
    humidity_critical: float = 5.0  # ±5% triggers warning
    
    # Oxygen (%)
    oxygen_min: float = 21.0
    oxygen_max: float = 40.0
    
    # CO2 (%)
    co2_max: float = 0.5
    
    # Vibration (g-force)
    vibration_max: float = 0.5  # >0.5g = tampering
    
    # Power (Volts)
    power_min: float = 11.0  # <11V triggers backup
    
    # Sound (dB)
    sound_max: float = 70.0


@dataclass
class SecurityEvent:
    """Security event data structure"""
    id: str
    device_id: str
    timestamp: str
    threat_type: ThreatType
    threat_level: ThreatLevel
    description: str
    sensor_data: dict
    anomaly_score: int  # 0-100
    affected_parameters: List[str]


class SecurityEventDetector:
    """Detects security anomalies in sensor data"""
    
    def __init__(self):
        self.thresholds = PatientSafetyThresholds()
    
    def detect_anomalies(self, sensor_data: dict) -> Optional[SecurityEvent]:
        """
        Analyze sensor data for security anomalies
        
        Args:
            sensor_data: Dictionary containing sensor readings
            
        Returns:
            SecurityEvent if anomaly detected, None otherwise
        """
        anomalies: List[str] = []
        threat_type = ThreatType.NONE
        threat_level = ThreatLevel.SAFE
        anomaly_score = 0
        
        # Temperature Attack Detection
        if 'temperature' in sensor_data and sensor_data['temperature'] is not None:
            temp = sensor_data['temperature']
            temp_diff = abs(temp - 37.0)
            
            if temp_diff > self.thresholds.temp_critical:
                anomalies.append('temperature')
                threat_type = ThreatType.TEMPERATURE_ATTACK
                threat_level = ThreatLevel.CRITICAL
                anomaly_score += 40
            elif temp < self.thresholds.temp_min or temp > self.thresholds.temp_max:
                anomalies.append('temperature')
                threat_type = ThreatType.TEMPERATURE_ATTACK
                threat_level = ThreatLevel.WARNING
                anomaly_score += 20
        
        # Access Attack Detection (Motion + Door)
        if sensor_data.get('motion_detected') or sensor_data.get('door_status'):
            anomalies.append('unauthorized_access')
            threat_type = ThreatType.ACCESS_ATTACK
            threat_level = ThreatLevel.CRITICAL
            anomaly_score += 35
        
        # Vibration/Tampering Detection
        if 'vibration_level' in sensor_data and sensor_data['vibration_level'] is not None:
            if sensor_data['vibration_level'] > self.thresholds.vibration_max:
                anomalies.append('vibration')
                threat_type = ThreatType.VIBRATION_ATTACK
                threat_level = ThreatLevel.CRITICAL
                anomaly_score += 30
        
        # Power Attack Detection
        if 'power_voltage' in sensor_data and sensor_data['power_voltage'] is not None:
            if sensor_data['power_voltage'] < self.thresholds.power_min:
                anomalies.append('power')
                threat_type = ThreatType.POWER_ATTACK
                threat_level = ThreatLevel.CRITICAL
                anomaly_score += 35
        
        # Environmental Attack Detection
        if 'humidity' in sensor_data and sensor_data['humidity'] is not None:
            humidity = sensor_data['humidity']
            if (humidity < self.thresholds.humidity_min - self.thresholds.humidity_critical or
                humidity > self.thresholds.humidity_max + self.thresholds.humidity_critical):
                anomalies.append('humidity')
                threat_type = ThreatType.ENVIRONMENTAL_ATTACK
                threat_level = ThreatLevel.WARNING
                anomaly_score += 15
        
        if 'oxygen_level' in sensor_data and sensor_data['oxygen_level'] is not None:
            oxygen = sensor_data['oxygen_level']
            if oxygen < self.thresholds.oxygen_min or oxygen > self.thresholds.oxygen_max:
                anomalies.append('oxygen')
                threat_type = ThreatType.ENVIRONMENTAL_ATTACK
                threat_level = ThreatLevel.CRITICAL
                anomaly_score += 40
        
        if 'co2_level' in sensor_data and sensor_data['co2_level'] is not None:
            if sensor_data['co2_level'] > self.thresholds.co2_max:
                anomalies.append('co2')
                threat_type = ThreatType.ENVIRONMENTAL_ATTACK
                threat_level = ThreatLevel.CRITICAL
                anomaly_score += 35
        
        # Sound Level Detection
        if 'sound_level' in sensor_data and sensor_data['sound_level'] is not None:
            if sensor_data['sound_level'] > self.thresholds.sound_max:
                anomalies.append('sound')
                if threat_type == ThreatType.NONE:
                    threat_type = ThreatType.ACCESS_ATTACK
                threat_level = ThreatLevel.WARNING
                anomaly_score += 10
        
        # Network Attack Detection (WiFi signal loss)
        if 'wifi_signal_strength' in sensor_data and sensor_data['wifi_signal_strength'] is not None:
            if sensor_data['wifi_signal_strength'] < -80:
                anomalies.append('network')
                threat_type = ThreatType.NETWORK_ATTACK
                threat_level = ThreatLevel.WARNING
                anomaly_score += 20
        
        # No anomalies detected
        if not anomalies:
            return None
        
        # Create security event
        import time
        import random
        
        event = SecurityEvent(
            id=f"evt_{int(time.time())}_{random.randint(1000, 9999)}",
            device_id=sensor_data.get('device_id', 'unknown'),
            timestamp=sensor_data.get('timestamp', ''),
            threat_type=threat_type,
            threat_level=threat_level,
            description=self._generate_description(threat_type, anomalies, sensor_data),
            sensor_data=sensor_data,
            anomaly_score=min(anomaly_score, 100),
            affected_parameters=anomalies
        )
        
        return event
    
    def _generate_description(
        self, 
        threat_type: ThreatType, 
        anomalies: List[str], 
        data: dict
    ) -> str:
        """Generate human-readable description of the threat"""
        
        if threat_type == ThreatType.TEMPERATURE_ATTACK:
            temp = data.get('temperature', 0)
            return (
                f"Critical temperature anomaly detected: {temp:.1f}°C "
                f"(safe range: 36.5-37.5°C). Potential incubator heating system compromise."
            )
        
        elif threat_type == ThreatType.ACCESS_ATTACK:
            parts = []
            if data.get('motion_detected'):
                parts.append("Motion sensor triggered.")
            if data.get('door_status'):
                parts.append("Door opened.")
            return (
                f"Unauthorized physical access detected. {' '.join(parts)} "
                f"Immediate security response required."
            )
        
        elif threat_type == ThreatType.POWER_ATTACK:
            voltage = data.get('power_voltage', 0)
            return (
                f"Power supply attack detected: {voltage:.1f}V (minimum: 11V). "
                f"Backup systems activated. Potential attempt to disable life support."
            )
        
        elif threat_type == ThreatType.NETWORK_ATTACK:
            signal = data.get('wifi_signal_strength', 0)
            return (
                f"Network connectivity attack detected. WiFi signal: {signal}dBm. "
                f"Possible jamming or credential theft attempt."
            )
        
        elif threat_type == ThreatType.VIBRATION_ATTACK:
            vibration = data.get('vibration_level', 0)
            return (
                f"Physical tampering detected: {vibration:.2f}g vibration (threshold: 0.5g). "
                f"Device may be under physical attack."
            )
        
        elif threat_type == ThreatType.ENVIRONMENTAL_ATTACK:
            return (
                f"Environmental control system compromised. "
                f"Affected parameters: {', '.join(anomalies)}. Patient safety at risk."
            )
        
        else:
            return f"Security anomaly detected in: {', '.join(anomalies)}"
    
    def calculate_security_score(self, sensor_data: dict) -> int:
        """
        Calculate overall security score (0-100)
        
        Args:
            sensor_data: Dictionary containing sensor readings
            
        Returns:
            Security score (100 = safe, 0 = critical)
        """
        score = 100
        
        # Deduct points for each parameter outside safe range
        if 'temperature' in sensor_data and sensor_data['temperature'] is not None:
            temp_diff = abs(sensor_data['temperature'] - 37.0)
            if temp_diff > self.thresholds.temp_critical:
                score -= 40
            elif temp_diff > 0.2:
                score -= 10
        
        if sensor_data.get('motion_detected'):
            score -= 35
        
        if sensor_data.get('door_status'):
            score -= 30
        
        if 'vibration_level' in sensor_data and sensor_data['vibration_level'] is not None:
            if sensor_data['vibration_level'] > self.thresholds.vibration_max:
                score -= 30
        
        if 'power_voltage' in sensor_data and sensor_data['power_voltage'] is not None:
            if sensor_data['power_voltage'] < self.thresholds.power_min:
                score -= 35
        
        return max(score, 0)
