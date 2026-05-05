"""
Realistic ESP32 Sensor Data Generator for ML Training
======================================================
Generates physically accurate sensor data that mimics real hospital incubator monitoring.

This is NOT demo data - it's realistic training data with:
- Proper physics-based sensor behavior
- Realistic noise patterns (Gaussian, drift, spikes)
- Time-based variations (day/night cycles, shift changes)
- Correlated sensor readings (temperature affects humidity, etc.)
- Real-world anomaly patterns for security training
- Hardware-accurate sensor characteristics (resolution, range, response time)

Author: SafeEdge Team
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import random
import math


class SensorType(str, Enum):
    """Sensor types matching real ESP32 hardware"""
    DHT22_TEMP = "DHT22_Temperature"
    DHT22_HUMIDITY = "DHT22_Humidity"
    BMP280_PRESSURE = "BMP280_Pressure"
    MQ135_OXYGEN = "MQ135_Oxygen"
    MQ135_CO2 = "MQ135_CO2"
    PIR_MOTION = "PIR_Motion"
    ADXL345_VIBRATION = "ADXL345_Vibration"
    REED_DOOR = "Reed_Door"
    MAX4466_SOUND = "MAX4466_Sound"
    ACS712_POWER = "ACS712_Power"
    ESP32_WIFI = "ESP32_WiFi"
    ESP32_INTERNAL_TEMP = "ESP32_InternalTemp"


class AnomalyType(str, Enum):
    """Real-world anomaly types for security training"""
    NONE = "none"
    TEMPERATURE_SPIKE = "temperature_spike"
    TEMPERATURE_DRIFT = "temperature_drift"
    HUMIDITY_ABNORMAL = "humidity_abnormal"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    TAMPERING_VIBRATION = "tampering_vibration"
    POWER_FLUCTUATION = "power_fluctuation"
    POWER_FAILURE = "power_failure"
    NETWORK_INTERFERENCE = "network_interference"
    SENSOR_MALFUNCTION = "sensor_malfunction"
    COORDINATED_ATTACK = "coordinated_attack"


@dataclass
class SensorCharacteristics:
    """Real hardware sensor specifications"""
    name: str
    min_value: float
    max_value: float
    resolution: float  # Smallest detectable change
    accuracy: float    # ± accuracy
    response_time_ms: int  # Response time in milliseconds
    noise_std: float   # Standard deviation of noise
    drift_per_hour: float  # Sensor drift over time
    failure_rate: float  # Probability of sensor failure per reading


# Real ESP32 sensor specifications based on datasheets
SENSOR_SPECS = {
    SensorType.DHT22_TEMP: SensorCharacteristics(
        name="DHT22 Temperature",
        min_value=-40.0, max_value=80.0,
        resolution=0.1, accuracy=0.5,
        response_time_ms=2000, noise_std=0.15,
        drift_per_hour=0.01, failure_rate=0.001
    ),
    SensorType.DHT22_HUMIDITY: SensorCharacteristics(
        name="DHT22 Humidity",
        min_value=0.0, max_value=100.0,
        resolution=0.1, accuracy=2.0,
        response_time_ms=2000, noise_std=1.0,
        drift_per_hour=0.05, failure_rate=0.001
    ),
    SensorType.BMP280_PRESSURE: SensorCharacteristics(
        name="BMP280 Pressure",
        min_value=300.0, max_value=1100.0,
        resolution=0.01, accuracy=1.0,
        response_time_ms=100, noise_std=0.5,
        drift_per_hour=0.02, failure_rate=0.0005
    ),
    SensorType.MQ135_OXYGEN: SensorCharacteristics(
        name="MQ135 Oxygen",
        min_value=0.0, max_value=100.0,
        resolution=0.5, accuracy=3.0,
        response_time_ms=30000, noise_std=0.8,
        drift_per_hour=0.1, failure_rate=0.002
    ),
    SensorType.MQ135_CO2: SensorCharacteristics(
        name="MQ135 CO2",
        min_value=0.0, max_value=5.0,
        resolution=0.01, accuracy=0.1,
        response_time_ms=30000, noise_std=0.02,
        drift_per_hour=0.005, failure_rate=0.002
    ),
    SensorType.ADXL345_VIBRATION: SensorCharacteristics(
        name="ADXL345 Accelerometer",
        min_value=0.0, max_value=16.0,
        resolution=0.004, accuracy=0.05,
        response_time_ms=10, noise_std=0.02,
        drift_per_hour=0.001, failure_rate=0.0003
    ),
    SensorType.MAX4466_SOUND: SensorCharacteristics(
        name="MAX4466 Microphone",
        min_value=30.0, max_value=120.0,
        resolution=1.0, accuracy=3.0,
        response_time_ms=50, noise_std=2.0,
        drift_per_hour=0.1, failure_rate=0.001
    ),
    SensorType.ACS712_POWER: SensorCharacteristics(
        name="ACS712 Current Sensor",
        min_value=0.0, max_value=30.0,
        resolution=0.01, accuracy=0.1,
        response_time_ms=5, noise_std=0.05,
        drift_per_hour=0.02, failure_rate=0.0005
    ),
}


@dataclass
class IncubatorProfile:
    """Hospital incubator operating profile"""
    device_id: str
    location: str
    ward: str
    
    # Normal operating parameters (based on real NICU standards)
    target_temperature: float = 37.0  # °C - neutral thermal environment
    target_humidity: float = 55.0     # % RH
    target_oxygen: float = 21.0       # % (room air) to 40% (supplemental)
    
    # Operating ranges
    temp_range: Tuple[float, float] = (36.0, 37.5)
    humidity_range: Tuple[float, float] = (40.0, 65.0)
    oxygen_range: Tuple[float, float] = (21.0, 40.0)
    
    # Environmental factors
    room_temperature: float = 22.0    # Ambient room temp
    room_humidity: float = 45.0       # Ambient humidity
    
    # Usage patterns
    feeding_times: List[int] = field(default_factory=lambda: [6, 9, 12, 15, 18, 21, 0, 3])  # Hours
    shift_changes: List[int] = field(default_factory=lambda: [7, 15, 23])  # Hours
    
    # Device age affects sensor drift
    device_age_months: int = 12


@dataclass
class RealisticSensorReading:
    """Single realistic sensor reading"""
    device_id: str
    timestamp: str
    
    # Environmental sensors
    temperature: float
    humidity: float
    air_pressure: float
    oxygen_level: float
    co2_level: float
    
    # Security sensors
    motion_detected: bool
    vibration_level: float
    door_status: bool
    sound_level: float
    
    # Power and connectivity
    power_voltage: float
    wifi_signal_strength: int
    system_temperature: float
    
    # Computed security metrics
    threat_level: str
    anomaly_detected: bool
    anomaly_type: str
    security_score: int
    
    # Metadata for ML training
    is_anomaly_label: bool  # Ground truth for training
    anomaly_severity: float  # 0.0 to 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'device_id': self.device_id,
            'timestamp': self.timestamp,
            'temperature': round(self.temperature, 2),
            'humidity': round(self.humidity, 2),
            'air_pressure': round(self.air_pressure, 2),
            'oxygen_level': round(self.oxygen_level, 2),
            'co2_level': round(self.co2_level, 4),
            'motion_detected': self.motion_detected,
            'vibration_level': round(self.vibration_level, 4),
            'door_status': self.door_status,
            'sound_level': round(self.sound_level, 1),
            'power_voltage': round(self.power_voltage, 2),
            'wifi_signal_strength': self.wifi_signal_strength,
            'system_temperature': round(self.system_temperature, 1),
            'threat_level': self.threat_level,
            'anomaly_detected': self.anomaly_detected,
            'anomaly_type': self.anomaly_type,
            'security_score': self.security_score,
            'is_anomaly_label': self.is_anomaly_label,
            'anomaly_severity': round(self.anomaly_severity, 3)
        }


class RealisticSensorGenerator:
    """
    Generates physically accurate sensor data for ML training.
    
    This generator produces data that:
    1. Follows real physics (temperature/humidity correlation, etc.)
    2. Has realistic noise patterns from actual sensors
    3. Includes time-based variations (circadian rhythms, shift patterns)
    4. Contains labeled anomalies for supervised learning
    5. Matches real ESP32 hardware characteristics
    """
    
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        self.sensor_specs = SENSOR_SPECS
        
        # State tracking for realistic continuity
        self.device_states: Dict[str, Dict] = {}
        
        # Anomaly injection configuration
        self.anomaly_probability = 0.05  # 5% of readings have anomalies
        self.attack_probability = 0.02   # 2% are actual attacks
        
        print("🔬 Realistic Sensor Generator initialized")
        print("   - Physics-based sensor modeling")
        print("   - Real hardware noise characteristics")
        print("   - Time-correlated data generation")
    
    def create_incubator_fleet(self, count: int = 10) -> List[IncubatorProfile]:
        """Create a fleet of incubators with varied profiles"""
        
        wards = ["NICU-A", "NICU-B", "NICU-C", "ICU", "Pediatric"]
        profiles = []
        
        for i in range(count):
            ward = wards[i % len(wards)]
            room = 100 + (i // len(wards)) * 10 + (i % 10)
            
            profile = IncubatorProfile(
                device_id=f"incubator_{ward.lower().replace('-', '')}_{i+1:03d}",
                location=f"Room {room}",
                ward=ward,
                target_temperature=36.5 + np.random.uniform(0, 1.0),
                target_humidity=50.0 + np.random.uniform(0, 15.0),
                target_oxygen=21.0 + np.random.uniform(0, 10.0),
                room_temperature=21.0 + np.random.uniform(0, 3.0),
                room_humidity=40.0 + np.random.uniform(0, 15.0),
                device_age_months=np.random.randint(1, 60)
            )
            profiles.append(profile)
            
            # Initialize device state
            self._initialize_device_state(profile)
        
        print(f"📱 Created {count} incubator profiles across {len(wards)} wards")
        return profiles

    
    def _initialize_device_state(self, profile: IncubatorProfile):
        """Initialize internal state for a device"""
        
        self.device_states[profile.device_id] = {
            'temperature': profile.target_temperature,
            'humidity': profile.target_humidity,
            'pressure': 1013.25,
            'oxygen': profile.target_oxygen,
            'co2': 0.04,
            'vibration_baseline': 0.08 + np.random.uniform(0, 0.04),
            'sound_baseline': 42.0 + np.random.uniform(0, 8.0),
            'power_voltage': 12.0 + np.random.uniform(-0.2, 0.2),
            'wifi_baseline': -45 + np.random.randint(-10, 10),
            'last_motion': None,
            'door_open_until': None,
            'sensor_drift': {sensor: 0.0 for sensor in SensorType},
            'last_reading_time': None,
            'anomaly_state': None,
            'anomaly_end_time': None,
        }
    
    def _apply_sensor_noise(
        self, 
        value: float, 
        sensor_type: SensorType,
        device_id: str
    ) -> float:
        """Apply realistic sensor noise based on hardware specs"""
        
        spec = self.sensor_specs.get(sensor_type)
        if spec is None:
            return value
        
        state = self.device_states.get(device_id, {})
        
        # Gaussian noise (primary noise source)
        noise = np.random.normal(0, spec.noise_std)
        
        # Quantization noise (sensor resolution)
        quantized = round(value / spec.resolution) * spec.resolution
        
        # Sensor drift (accumulates over time)
        drift = state.get('sensor_drift', {}).get(sensor_type, 0)
        
        # Occasional spike noise (1% chance)
        if np.random.random() < 0.01:
            noise += np.random.choice([-1, 1]) * spec.noise_std * 3
        
        # Apply all noise components
        noisy_value = quantized + noise + drift
        
        # Clamp to sensor range
        noisy_value = np.clip(noisy_value, spec.min_value, spec.max_value)
        
        return noisy_value
    
    def _update_sensor_drift(self, device_id: str, hours_elapsed: float):
        """Update sensor drift based on time elapsed"""
        
        state = self.device_states.get(device_id)
        if state is None:
            return
        
        for sensor_type, spec in self.sensor_specs.items():
            current_drift = state['sensor_drift'].get(sensor_type, 0)
            
            # Random walk drift
            drift_change = np.random.normal(0, spec.drift_per_hour * hours_elapsed)
            new_drift = current_drift + drift_change
            
            # Limit maximum drift
            max_drift = spec.accuracy * 2
            new_drift = np.clip(new_drift, -max_drift, max_drift)
            
            state['sensor_drift'][sensor_type] = new_drift
    
    def _calculate_temperature(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> float:
        """Calculate realistic temperature with physics-based modeling"""
        
        base_temp = state['temperature']
        
        # Circadian variation (±0.3°C over 24 hours)
        hour = timestamp.hour + timestamp.minute / 60
        circadian = 0.3 * np.sin(2 * np.pi * (hour - 6) / 24)
        
        # Feeding time effect (door opens, temp drops slightly)
        feeding_effect = 0
        for feeding_hour in profile.feeding_times:
            time_since_feeding = abs(hour - feeding_hour)
            if time_since_feeding < 0.5:  # Within 30 minutes
                feeding_effect = -0.2 * (1 - time_since_feeding / 0.5)
        
        # Room temperature influence (thermal exchange)
        room_influence = (profile.room_temperature - base_temp) * 0.001
        
        # Heater cycling (realistic PID-like behavior)
        error = profile.target_temperature - base_temp
        heater_response = error * 0.1  # Proportional control
        
        # Calculate new temperature
        new_temp = base_temp + circadian + feeding_effect + room_influence + heater_response
        
        # Apply sensor noise
        new_temp = self._apply_sensor_noise(new_temp, SensorType.DHT22_TEMP, profile.device_id)
        
        # Update state with smoothing
        state['temperature'] = state['temperature'] * 0.9 + new_temp * 0.1
        
        return new_temp
    
    def _calculate_humidity(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict,
        temperature: float
    ) -> float:
        """Calculate humidity with temperature correlation"""
        
        base_humidity = state['humidity']
        
        # Temperature-humidity correlation (inverse relationship in incubators)
        temp_effect = -(temperature - profile.target_temperature) * 2.0
        
        # Time-based variation
        hour = timestamp.hour
        time_variation = 2.0 * np.sin(2 * np.pi * hour / 24)
        
        # Humidifier cycling
        error = profile.target_humidity - base_humidity
        humidifier_response = error * 0.05
        
        new_humidity = base_humidity + temp_effect + time_variation + humidifier_response
        new_humidity = self._apply_sensor_noise(new_humidity, SensorType.DHT22_HUMIDITY, profile.device_id)
        
        # Clamp to realistic range
        new_humidity = np.clip(new_humidity, 20.0, 95.0)
        
        state['humidity'] = state['humidity'] * 0.9 + new_humidity * 0.1
        
        return new_humidity
    
    def _calculate_pressure(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> float:
        """Calculate atmospheric pressure with weather-like variations"""
        
        base_pressure = state['pressure']
        
        # Slow weather-like changes
        weather_change = np.random.normal(0, 0.1)
        
        # Daily barometric variation
        hour = timestamp.hour
        daily_variation = 2.0 * np.sin(2 * np.pi * (hour - 10) / 24)
        
        new_pressure = base_pressure + weather_change + daily_variation * 0.1
        new_pressure = self._apply_sensor_noise(new_pressure, SensorType.BMP280_PRESSURE, profile.device_id)
        
        # Keep within realistic range
        new_pressure = np.clip(new_pressure, 980.0, 1040.0)
        
        state['pressure'] = state['pressure'] * 0.95 + new_pressure * 0.05
        
        return new_pressure
    
    def _calculate_oxygen(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> float:
        """Calculate oxygen level with realistic variations"""
        
        base_oxygen = state['oxygen']
        
        # Oxygen consumption simulation (slight decrease over time)
        consumption = np.random.uniform(0, 0.05)
        
        # Oxygen supply adjustment (maintains target)
        error = profile.target_oxygen - base_oxygen
        supply_adjustment = error * 0.02
        
        new_oxygen = base_oxygen - consumption + supply_adjustment
        new_oxygen = self._apply_sensor_noise(new_oxygen, SensorType.MQ135_OXYGEN, profile.device_id)
        
        new_oxygen = np.clip(new_oxygen, 18.0, 50.0)
        
        state['oxygen'] = state['oxygen'] * 0.95 + new_oxygen * 0.05
        
        return new_oxygen
    
    def _calculate_co2(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict,
        oxygen: float
    ) -> float:
        """Calculate CO2 level (inversely correlated with oxygen)"""
        
        base_co2 = state['co2']
        
        # CO2 production (metabolic)
        production = np.random.uniform(0, 0.002)
        
        # Ventilation effect
        ventilation = base_co2 * 0.01
        
        # Inverse correlation with oxygen
        oxygen_effect = (21.0 - oxygen) * 0.001
        
        new_co2 = base_co2 + production - ventilation + oxygen_effect
        new_co2 = self._apply_sensor_noise(new_co2, SensorType.MQ135_CO2, profile.device_id)
        
        new_co2 = np.clip(new_co2, 0.02, 1.0)
        
        state['co2'] = state['co2'] * 0.95 + new_co2 * 0.05
        
        return new_co2
    
    def _calculate_motion(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> bool:
        """Calculate motion detection with realistic patterns"""
        
        hour = timestamp.hour
        
        # Higher activity during day shifts and feeding times
        base_probability = 0.02  # 2% base chance
        
        # Shift change activity
        for shift_hour in profile.shift_changes:
            if abs(hour - shift_hour) < 1:
                base_probability = 0.15
        
        # Feeding time activity
        for feeding_hour in profile.feeding_times:
            if abs(hour - feeding_hour) < 0.5:
                base_probability = 0.25
        
        # Night time (less activity)
        if 23 <= hour or hour < 6:
            base_probability *= 0.3
        
        # Check for recent motion (PIR has cooldown)
        last_motion = state.get('last_motion')
        if last_motion and (timestamp - last_motion).seconds < 30:
            return True  # PIR stays triggered for ~30 seconds
        
        motion = np.random.random() < base_probability
        
        if motion:
            state['last_motion'] = timestamp
        
        return motion
    
    def _calculate_vibration(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict,
        motion: bool
    ) -> float:
        """Calculate vibration with motion correlation"""
        
        baseline = state['vibration_baseline']
        
        # Motion causes vibration
        motion_effect = 0.3 if motion else 0
        
        # Random environmental vibration
        env_vibration = np.random.exponential(0.02)
        
        # Occasional larger vibrations (footsteps, equipment)
        if np.random.random() < 0.01:
            env_vibration += np.random.uniform(0.1, 0.5)
        
        vibration = baseline + motion_effect + env_vibration
        vibration = self._apply_sensor_noise(vibration, SensorType.ADXL345_VIBRATION, profile.device_id)
        
        return max(0, vibration)
    
    def _calculate_door_status(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict,
        motion: bool
    ) -> bool:
        """Calculate door status with realistic patterns"""
        
        # Check if door is still open from previous event
        door_open_until = state.get('door_open_until')
        if door_open_until and timestamp < door_open_until:
            return True
        
        # Door opens during motion events (care activities)
        if motion and np.random.random() < 0.3:
            # Door stays open for 30-180 seconds
            duration = np.random.randint(30, 180)
            state['door_open_until'] = timestamp + timedelta(seconds=duration)
            return True
        
        return False
    
    def _calculate_sound(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict,
        motion: bool,
        door_open: bool
    ) -> float:
        """Calculate sound level with environmental factors"""
        
        baseline = state['sound_baseline']
        
        # Activity increases sound
        activity_effect = 0
        if motion:
            activity_effect += np.random.uniform(5, 15)
        if door_open:
            activity_effect += np.random.uniform(3, 8)
        
        # Time-based ambient noise
        hour = timestamp.hour
        if 7 <= hour <= 19:  # Day time
            ambient = np.random.uniform(0, 10)
        else:  # Night time
            ambient = np.random.uniform(-5, 3)
        
        # Occasional alarm sounds
        if np.random.random() < 0.005:
            activity_effect += np.random.uniform(20, 40)
        
        sound = baseline + activity_effect + ambient
        sound = self._apply_sensor_noise(sound, SensorType.MAX4466_SOUND, profile.device_id)
        
        return np.clip(sound, 30, 100)
    
    def _calculate_power(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> float:
        """Calculate power voltage with realistic fluctuations"""
        
        base_voltage = state['power_voltage']
        
        # Small random fluctuations
        fluctuation = np.random.normal(0, 0.05)
        
        # Load-based variation (heater cycling)
        load_variation = np.random.uniform(-0.1, 0.1)
        
        voltage = base_voltage + fluctuation + load_variation
        voltage = self._apply_sensor_noise(voltage, SensorType.ACS712_POWER, profile.device_id)
        
        # Hospital power is very stable
        voltage = np.clip(voltage, 11.5, 12.5)
        
        state['power_voltage'] = state['power_voltage'] * 0.99 + voltage * 0.01
        
        return voltage
    
    def _calculate_wifi(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> int:
        """Calculate WiFi signal strength with realistic variations"""
        
        baseline = state['wifi_baseline']
        
        # Random fluctuations
        fluctuation = np.random.randint(-5, 6)
        
        # Occasional interference
        if np.random.random() < 0.02:
            fluctuation -= np.random.randint(10, 25)
        
        signal = baseline + fluctuation
        
        return int(np.clip(signal, -90, -20))
    
    def _calculate_system_temp(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        state: Dict
    ) -> float:
        """Calculate ESP32 internal temperature"""
        
        # ESP32 runs warm (35-50°C typical)
        base_temp = 38.0
        
        # Ambient temperature effect
        ambient_effect = (profile.room_temperature - 22) * 0.3
        
        # Processing load variation
        load_variation = np.random.uniform(-2, 5)
        
        system_temp = base_temp + ambient_effect + load_variation
        
        return np.clip(system_temp, 30, 55)

    
    def _inject_anomaly(
        self, 
        profile: IncubatorProfile,
        timestamp: datetime,
        state: Dict,
        reading: Dict
    ) -> Tuple[Dict, AnomalyType, float]:
        """Inject realistic anomalies for ML training"""
        
        # Check if we're in an ongoing anomaly
        if state.get('anomaly_state') and state.get('anomaly_end_time'):
            if timestamp < state['anomaly_end_time']:
                return self._continue_anomaly(profile, timestamp, state, reading)
            else:
                state['anomaly_state'] = None
                state['anomaly_end_time'] = None
        
        # Decide if we should start a new anomaly
        if np.random.random() > self.anomaly_probability:
            return reading, AnomalyType.NONE, 0.0
        
        # Select anomaly type based on realistic probabilities
        anomaly_weights = {
            AnomalyType.TEMPERATURE_SPIKE: 0.15,
            AnomalyType.TEMPERATURE_DRIFT: 0.10,
            AnomalyType.HUMIDITY_ABNORMAL: 0.10,
            AnomalyType.UNAUTHORIZED_ACCESS: 0.15,
            AnomalyType.TAMPERING_VIBRATION: 0.10,
            AnomalyType.POWER_FLUCTUATION: 0.15,
            AnomalyType.POWER_FAILURE: 0.05,
            AnomalyType.NETWORK_INTERFERENCE: 0.10,
            AnomalyType.SENSOR_MALFUNCTION: 0.05,
            AnomalyType.COORDINATED_ATTACK: 0.05,
        }
        
        anomaly_type = np.random.choice(
            list(anomaly_weights.keys()),
            p=list(anomaly_weights.values())
        )
        
        # Set anomaly duration
        duration_map = {
            AnomalyType.TEMPERATURE_SPIKE: (30, 300),      # 30s to 5min
            AnomalyType.TEMPERATURE_DRIFT: (300, 1800),    # 5min to 30min
            AnomalyType.HUMIDITY_ABNORMAL: (60, 600),      # 1min to 10min
            AnomalyType.UNAUTHORIZED_ACCESS: (10, 120),    # 10s to 2min
            AnomalyType.TAMPERING_VIBRATION: (5, 60),      # 5s to 1min
            AnomalyType.POWER_FLUCTUATION: (1, 30),        # 1s to 30s
            AnomalyType.POWER_FAILURE: (5, 300),           # 5s to 5min
            AnomalyType.NETWORK_INTERFERENCE: (30, 600),   # 30s to 10min
            AnomalyType.SENSOR_MALFUNCTION: (60, 3600),    # 1min to 1hour
            AnomalyType.COORDINATED_ATTACK: (60, 600),     # 1min to 10min
        }
        
        duration_range = duration_map.get(anomaly_type, (30, 300))
        duration = np.random.randint(duration_range[0], duration_range[1])
        
        state['anomaly_state'] = anomaly_type
        state['anomaly_end_time'] = timestamp + timedelta(seconds=duration)
        state['anomaly_start_time'] = timestamp
        state['anomaly_severity'] = np.random.uniform(0.3, 1.0)
        
        return self._apply_anomaly(profile, timestamp, state, reading, anomaly_type)
    
    def _continue_anomaly(
        self, 
        profile: IncubatorProfile,
        timestamp: datetime,
        state: Dict,
        reading: Dict
    ) -> Tuple[Dict, AnomalyType, float]:
        """Continue an ongoing anomaly"""
        
        anomaly_type = state['anomaly_state']
        return self._apply_anomaly(profile, timestamp, state, reading, anomaly_type)
    
    def _apply_anomaly(
        self, 
        profile: IncubatorProfile,
        timestamp: datetime,
        state: Dict,
        reading: Dict,
        anomaly_type: AnomalyType
    ) -> Tuple[Dict, AnomalyType, float]:
        """Apply specific anomaly effects to reading"""
        
        severity = state.get('anomaly_severity', 0.5)
        modified = reading.copy()
        
        if anomaly_type == AnomalyType.TEMPERATURE_SPIKE:
            # Sudden temperature increase (attack or malfunction)
            spike = 3.0 + severity * 8.0  # 3-11°C increase
            modified['temperature'] = reading['temperature'] + spike
            modified['humidity'] = reading['humidity'] - spike * 2  # Inverse effect
        
        elif anomaly_type == AnomalyType.TEMPERATURE_DRIFT:
            # Gradual temperature change
            elapsed = (timestamp - state['anomaly_start_time']).seconds
            drift = (elapsed / 300) * severity * 3.0  # Gradual increase
            modified['temperature'] = reading['temperature'] + drift
        
        elif anomaly_type == AnomalyType.HUMIDITY_ABNORMAL:
            # Humidity out of range
            if np.random.random() < 0.5:
                modified['humidity'] = 20 + np.random.uniform(0, 15)  # Too low
            else:
                modified['humidity'] = 80 + np.random.uniform(0, 15)  # Too high
        
        elif anomaly_type == AnomalyType.UNAUTHORIZED_ACCESS:
            # Unauthorized physical access
            modified['motion_detected'] = True
            modified['door_status'] = True
            modified['vibration_level'] = 0.5 + severity * 2.0
            modified['sound_level'] = reading['sound_level'] + 15 + severity * 20
        
        elif anomaly_type == AnomalyType.TAMPERING_VIBRATION:
            # Physical tampering
            modified['vibration_level'] = 1.0 + severity * 4.0
            modified['motion_detected'] = True
            modified['sound_level'] = reading['sound_level'] + 10
        
        elif anomaly_type == AnomalyType.POWER_FLUCTUATION:
            # Power instability
            fluctuation = np.random.uniform(-2, 2) * severity
            modified['power_voltage'] = reading['power_voltage'] + fluctuation
            modified['power_voltage'] = np.clip(modified['power_voltage'], 9.0, 14.0)
        
        elif anomaly_type == AnomalyType.POWER_FAILURE:
            # Power failure
            modified['power_voltage'] = 0.0 + np.random.uniform(0, 3) * (1 - severity)
        
        elif anomaly_type == AnomalyType.NETWORK_INTERFERENCE:
            # WiFi jamming or interference
            modified['wifi_signal_strength'] = -80 - int(severity * 15)
        
        elif anomaly_type == AnomalyType.SENSOR_MALFUNCTION:
            # Sensor giving bad readings
            sensor_to_fail = np.random.choice(['temperature', 'humidity', 'oxygen_level'])
            if sensor_to_fail == 'temperature':
                modified['temperature'] = np.random.choice([0, -40, 80, np.nan])
            elif sensor_to_fail == 'humidity':
                modified['humidity'] = np.random.choice([0, 100, np.nan])
            else:
                modified['oxygen_level'] = np.random.choice([0, 100, np.nan])
        
        elif anomaly_type == AnomalyType.COORDINATED_ATTACK:
            # Multiple simultaneous anomalies (sophisticated attack)
            modified['temperature'] = reading['temperature'] + 2 + severity * 5
            modified['motion_detected'] = True
            modified['vibration_level'] = 0.8 + severity * 1.5
            modified['power_voltage'] = reading['power_voltage'] - severity * 2
            modified['wifi_signal_strength'] = -70 - int(severity * 20)
        
        return modified, anomaly_type, severity
    
    def _calculate_security_metrics(
        self, 
        reading: Dict,
        anomaly_type: AnomalyType,
        severity: float,
        profile: IncubatorProfile
    ) -> Tuple[str, bool, int]:
        """Calculate security metrics based on reading"""
        
        score = 100
        anomaly_detected = anomaly_type != AnomalyType.NONE
        
        # Temperature scoring
        temp = reading.get('temperature', 37.0)
        if temp is not None and not np.isnan(temp):
            if temp < profile.temp_range[0] - 1 or temp > profile.temp_range[1] + 1:
                score -= 30
            elif temp < profile.temp_range[0] or temp > profile.temp_range[1]:
                score -= 15
        else:
            score -= 20  # Sensor failure
        
        # Humidity scoring
        humidity = reading.get('humidity', 55.0)
        if humidity is not None and not np.isnan(humidity):
            if humidity < profile.humidity_range[0] - 10 or humidity > profile.humidity_range[1] + 10:
                score -= 20
            elif humidity < profile.humidity_range[0] or humidity > profile.humidity_range[1]:
                score -= 10
        else:
            score -= 15
        
        # Oxygen scoring
        oxygen = reading.get('oxygen_level', 21.0)
        if oxygen is not None and not np.isnan(oxygen):
            if oxygen < 18 or oxygen > 50:
                score -= 25
        else:
            score -= 20
        
        # Motion/access scoring
        if reading.get('motion_detected') and reading.get('door_status'):
            score -= 15
        
        # Vibration scoring
        vibration = reading.get('vibration_level', 0.1)
        if vibration > 2.0:
            score -= 20
        elif vibration > 1.0:
            score -= 10
        
        # Power scoring
        voltage = reading.get('power_voltage', 12.0)
        if voltage < 10.0 or voltage > 14.0:
            score -= 25
        elif voltage < 11.0 or voltage > 13.0:
            score -= 10
        
        # WiFi scoring
        wifi = reading.get('wifi_signal_strength', -45)
        if wifi < -80:
            score -= 15
        elif wifi < -70:
            score -= 5
        
        # Determine threat level
        score = max(0, score)
        
        if score >= 80:
            threat_level = "safe"
        elif score >= 60:
            threat_level = "warning"
        else:
            threat_level = "critical"
        
        # Override for known anomalies
        if anomaly_type in [AnomalyType.POWER_FAILURE, AnomalyType.COORDINATED_ATTACK]:
            threat_level = "critical"
            score = min(score, 30)
        elif anomaly_type in [AnomalyType.TEMPERATURE_SPIKE, AnomalyType.UNAUTHORIZED_ACCESS]:
            if threat_level == "safe":
                threat_level = "warning"
        
        return threat_level, anomaly_detected, score
    
    def generate_reading(
        self, 
        profile: IncubatorProfile, 
        timestamp: datetime,
        inject_anomaly: bool = True
    ) -> RealisticSensorReading:
        """Generate a single realistic sensor reading"""
        
        state = self.device_states.get(profile.device_id)
        if state is None:
            self._initialize_device_state(profile)
            state = self.device_states[profile.device_id]
        
        # Update sensor drift
        last_time = state.get('last_reading_time')
        if last_time:
            hours_elapsed = (timestamp - last_time).total_seconds() / 3600
            self._update_sensor_drift(profile.device_id, hours_elapsed)
        state['last_reading_time'] = timestamp
        
        # Calculate all sensor values
        temperature = self._calculate_temperature(profile, timestamp, state)
        humidity = self._calculate_humidity(profile, timestamp, state, temperature)
        pressure = self._calculate_pressure(profile, timestamp, state)
        oxygen = self._calculate_oxygen(profile, timestamp, state)
        co2 = self._calculate_co2(profile, timestamp, state, oxygen)
        motion = self._calculate_motion(profile, timestamp, state)
        vibration = self._calculate_vibration(profile, timestamp, state, motion)
        door_status = self._calculate_door_status(profile, timestamp, state, motion)
        sound = self._calculate_sound(profile, timestamp, state, motion, door_status)
        power = self._calculate_power(profile, timestamp, state)
        wifi = self._calculate_wifi(profile, timestamp, state)
        system_temp = self._calculate_system_temp(profile, timestamp, state)
        
        # Create base reading
        reading = {
            'temperature': temperature,
            'humidity': humidity,
            'air_pressure': pressure,
            'oxygen_level': oxygen,
            'co2_level': co2,
            'motion_detected': motion,
            'vibration_level': vibration,
            'door_status': door_status,
            'sound_level': sound,
            'power_voltage': power,
            'wifi_signal_strength': wifi,
            'system_temperature': system_temp,
        }
        
        # Inject anomaly if enabled
        anomaly_type = AnomalyType.NONE
        severity = 0.0
        
        if inject_anomaly:
            reading, anomaly_type, severity = self._inject_anomaly(
                profile, timestamp, state, reading
            )
        
        # Calculate security metrics
        threat_level, anomaly_detected, security_score = self._calculate_security_metrics(
            reading, anomaly_type, severity, profile
        )
        
        # Handle NaN values
        for key, value in reading.items():
            if isinstance(value, float) and np.isnan(value):
                reading[key] = None
        
        return RealisticSensorReading(
            device_id=profile.device_id,
            timestamp=timestamp.isoformat(),
            temperature=reading['temperature'] if reading['temperature'] is not None else 0.0,
            humidity=reading['humidity'] if reading['humidity'] is not None else 0.0,
            air_pressure=reading['air_pressure'],
            oxygen_level=reading['oxygen_level'] if reading['oxygen_level'] is not None else 0.0,
            co2_level=reading['co2_level'],
            motion_detected=reading['motion_detected'],
            vibration_level=reading['vibration_level'],
            door_status=reading['door_status'],
            sound_level=reading['sound_level'],
            power_voltage=reading['power_voltage'],
            wifi_signal_strength=reading['wifi_signal_strength'],
            system_temperature=reading['system_temperature'],
            threat_level=threat_level,
            anomaly_detected=anomaly_detected,
            anomaly_type=anomaly_type.value,
            security_score=security_score,
            is_anomaly_label=anomaly_type != AnomalyType.NONE,
            anomaly_severity=severity
        )

    
    def generate_dataset(
        self,
        profiles: List[IncubatorProfile],
        start_time: datetime,
        duration_hours: int = 168,  # 1 week default
        interval_seconds: int = 7,   # ESP32 sends every 7 seconds
        anomaly_rate: float = 0.05
    ) -> pd.DataFrame:
        """
        Generate a complete dataset for ML training.
        
        Args:
            profiles: List of incubator profiles
            start_time: Start timestamp
            duration_hours: Duration in hours
            interval_seconds: Time between readings
            anomaly_rate: Probability of anomaly injection
            
        Returns:
            DataFrame with all sensor readings
        """
        
        self.anomaly_probability = anomaly_rate
        
        total_readings = int((duration_hours * 3600) / interval_seconds) * len(profiles)
        print(f"📊 Generating {total_readings:,} realistic sensor readings...")
        print(f"   Duration: {duration_hours} hours ({duration_hours/24:.1f} days)")
        print(f"   Devices: {len(profiles)}")
        print(f"   Interval: {interval_seconds} seconds")
        print(f"   Anomaly rate: {anomaly_rate*100:.1f}%")
        
        all_readings = []
        current_time = start_time
        end_time = start_time + timedelta(hours=duration_hours)
        
        reading_count = 0
        anomaly_count = 0
        
        while current_time < end_time:
            for profile in profiles:
                reading = self.generate_reading(profile, current_time, inject_anomaly=True)
                all_readings.append(reading.to_dict())
                
                reading_count += 1
                if reading.is_anomaly_label:
                    anomaly_count += 1
                
                # Progress update every 10000 readings
                if reading_count % 10000 == 0:
                    progress = reading_count / total_readings * 100
                    print(f"   Progress: {progress:.1f}% ({reading_count:,}/{total_readings:,})")
            
            current_time += timedelta(seconds=interval_seconds)
        
        df = pd.DataFrame(all_readings)
        
        print(f"\n✅ Dataset generation complete!")
        print(f"   Total readings: {len(df):,}")
        print(f"   Anomalies: {anomaly_count:,} ({anomaly_count/len(df)*100:.2f}%)")
        print(f"   Normal: {len(df) - anomaly_count:,} ({(len(df)-anomaly_count)/len(df)*100:.2f}%)")
        
        # Print anomaly distribution
        if 'anomaly_type' in df.columns:
            print(f"\n📈 Anomaly Distribution:")
            anomaly_dist = df[df['is_anomaly_label'] == True]['anomaly_type'].value_counts()
            for anomaly_type, count in anomaly_dist.items():
                print(f"   {anomaly_type}: {count} ({count/anomaly_count*100:.1f}%)")
        
        return df
    
    def save_dataset(
        self,
        df: pd.DataFrame,
        output_dir: str = "data/training",
        format: str = "both"  # 'csv', 'json', or 'both'
    ) -> Dict[str, str]:
        """Save dataset to files"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_files = {}
        
        if format in ['csv', 'both']:
            csv_path = os.path.join(output_dir, f"realistic_sensor_data_{timestamp}.csv")
            df.to_csv(csv_path, index=False)
            saved_files['csv'] = csv_path
            print(f"💾 Saved CSV: {csv_path}")
        
        if format in ['json', 'both']:
            json_path = os.path.join(output_dir, f"realistic_sensor_data_{timestamp}.json")
            df.to_json(json_path, orient='records', indent=2)
            saved_files['json'] = json_path
            print(f"💾 Saved JSON: {json_path}")
        
        # Save metadata
        metadata = {
            'generated_at': datetime.now().isoformat(),
            'total_readings': len(df),
            'devices': df['device_id'].nunique(),
            'anomaly_count': int(df['is_anomaly_label'].sum()),
            'anomaly_rate': float(df['is_anomaly_label'].mean()),
            'time_range': {
                'start': df['timestamp'].min(),
                'end': df['timestamp'].max()
            },
            'anomaly_distribution': df[df['is_anomaly_label'] == True]['anomaly_type'].value_counts().to_dict() if 'anomaly_type' in df.columns else {},
            'sensor_stats': {
                'temperature': {'mean': float(df['temperature'].mean()), 'std': float(df['temperature'].std())},
                'humidity': {'mean': float(df['humidity'].mean()), 'std': float(df['humidity'].std())},
                'security_score': {'mean': float(df['security_score'].mean()), 'std': float(df['security_score'].std())}
            }
        }
        
        metadata_path = os.path.join(output_dir, f"metadata_{timestamp}.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        saved_files['metadata'] = metadata_path
        print(f"💾 Saved metadata: {metadata_path}")
        
        return saved_files
    
    def generate_attack_scenarios(
        self,
        profiles: List[IncubatorProfile],
        scenario_count: int = 100
    ) -> pd.DataFrame:
        """
        Generate specific attack scenarios for security testing.
        Each scenario is a sequence of readings showing attack progression.
        """
        
        print(f"🎯 Generating {scenario_count} attack scenarios...")
        
        attack_types = [
            AnomalyType.TEMPERATURE_SPIKE,
            AnomalyType.UNAUTHORIZED_ACCESS,
            AnomalyType.POWER_FAILURE,
            AnomalyType.COORDINATED_ATTACK,
            AnomalyType.NETWORK_INTERFERENCE,
        ]
        
        all_scenarios = []
        
        for i in range(scenario_count):
            profile = np.random.choice(profiles)
            attack_type = np.random.choice(attack_types)
            
            # Generate pre-attack baseline (30 readings)
            start_time = datetime.now() - timedelta(hours=np.random.randint(1, 720))
            
            scenario_readings = []
            current_time = start_time
            
            # Pre-attack phase (normal readings)
            self.anomaly_probability = 0.0
            for _ in range(30):
                reading = self.generate_reading(profile, current_time, inject_anomaly=False)
                reading_dict = reading.to_dict()
                reading_dict['scenario_id'] = i
                reading_dict['phase'] = 'pre_attack'
                scenario_readings.append(reading_dict)
                current_time += timedelta(seconds=7)
            
            # Attack phase
            state = self.device_states[profile.device_id]
            state['anomaly_state'] = attack_type
            state['anomaly_end_time'] = current_time + timedelta(seconds=np.random.randint(60, 300))
            state['anomaly_start_time'] = current_time
            state['anomaly_severity'] = np.random.uniform(0.5, 1.0)
            
            for _ in range(50):
                reading = self.generate_reading(profile, current_time, inject_anomaly=True)
                reading_dict = reading.to_dict()
                reading_dict['scenario_id'] = i
                reading_dict['phase'] = 'attack'
                reading_dict['attack_type_label'] = attack_type.value
                scenario_readings.append(reading_dict)
                current_time += timedelta(seconds=7)
            
            # Post-attack recovery phase
            state['anomaly_state'] = None
            state['anomaly_end_time'] = None
            
            for _ in range(20):
                reading = self.generate_reading(profile, current_time, inject_anomaly=False)
                reading_dict = reading.to_dict()
                reading_dict['scenario_id'] = i
                reading_dict['phase'] = 'recovery'
                scenario_readings.append(reading_dict)
                current_time += timedelta(seconds=7)
            
            all_scenarios.extend(scenario_readings)
            
            if (i + 1) % 10 == 0:
                print(f"   Generated {i + 1}/{scenario_count} scenarios")
        
        df = pd.DataFrame(all_scenarios)
        print(f"✅ Generated {len(df):,} readings across {scenario_count} attack scenarios")
        
        return df


def generate_training_data(
    num_devices: int = 10,
    duration_hours: int = 168,  # 1 week
    anomaly_rate: float = 0.05,
    output_dir: str = "data/training",
    seed: Optional[int] = 42
) -> Dict[str, Any]:
    """
    Main function to generate realistic training data.
    
    Args:
        num_devices: Number of incubator devices
        duration_hours: Duration of data in hours
        anomaly_rate: Rate of anomaly injection (0.0 to 1.0)
        output_dir: Output directory for saved files
        seed: Random seed for reproducibility
        
    Returns:
        Dictionary with dataset info and file paths
    """
    
    print("=" * 70)
    print("🏥 SafeEdge Realistic Sensor Data Generator")
    print("   For ML Training - IoT Security Platform")
    print("=" * 70)
    
    generator = RealisticSensorGenerator(seed=seed)
    
    # Create device fleet
    profiles = generator.create_incubator_fleet(num_devices)
    
    # Generate main dataset
    start_time = datetime.now() - timedelta(hours=duration_hours)
    df = generator.generate_dataset(
        profiles=profiles,
        start_time=start_time,
        duration_hours=duration_hours,
        interval_seconds=7,
        anomaly_rate=anomaly_rate
    )
    
    # Save dataset
    saved_files = generator.save_dataset(df, output_dir, format='both')
    
    # Generate attack scenarios
    attack_df = generator.generate_attack_scenarios(profiles, scenario_count=100)
    attack_files = generator.save_dataset(
        attack_df, 
        output_dir, 
        format='csv'
    )
    
    print("\n" + "=" * 70)
    print("✅ REALISTIC DATA GENERATION COMPLETE")
    print("=" * 70)
    print(f"\n📁 Output files:")
    for file_type, path in saved_files.items():
        print(f"   {file_type}: {path}")
    
    return {
        'main_dataset': df,
        'attack_scenarios': attack_df,
        'profiles': profiles,
        'saved_files': saved_files,
        'generator': generator
    }


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate realistic ESP32 sensor data for ML training")
    parser.add_argument("--devices", type=int, default=10, help="Number of devices")
    parser.add_argument("--hours", type=int, default=168, help="Duration in hours (default: 168 = 1 week)")
    parser.add_argument("--anomaly-rate", type=float, default=0.05, help="Anomaly rate (0.0-1.0)")
    parser.add_argument("--output", type=str, default="data/training", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    
    args = parser.parse_args()
    
    result = generate_training_data(
        num_devices=args.devices,
        duration_hours=args.hours,
        anomaly_rate=args.anomaly_rate,
        output_dir=args.output,
        seed=args.seed
    )
    
    print(f"\n🎉 Generated {len(result['main_dataset']):,} realistic sensor readings!")
    print(f"   Ready for ML training with {result['main_dataset']['is_anomaly_label'].sum():,} labeled anomalies")
