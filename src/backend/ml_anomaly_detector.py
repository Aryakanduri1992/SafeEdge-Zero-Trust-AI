"""
ML Anomaly Detection Pipeline (Python)
Task 5.1: Local machine learning pipeline for IoT security pattern recognition
Uses scikit-learn for anomaly detection with ESP32 sensor data
"""

import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import joblib
import json
import os
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

from cloud_service import SensorData


@dataclass
class ModelMetrics:
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    anomaly_detection_rate: float
    false_positive_rate: float
    training_samples: int
    feature_count: int
    model_version: str
    training_date: str


@dataclass
class ModelVersion:
    """Model version information"""
    version: str
    model_path: str
    scaler_path: str
    metrics: ModelMetrics
    created_at: str
    is_active: bool
    esp32_compatible: bool


class MLAnomalyDetector:
    """Machine Learning Anomaly Detection for IoT Security"""
    
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Model components
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.current_version: Optional[str] = None
        
        # Model registry (simulates Azure ML registry)
        self.model_registry: Dict[str, ModelVersion] = {}
        self.registry_file = os.path.join(model_dir, "model_registry.json")
        
        # Load existing registry
        self._load_registry()
        
        # Feature engineering configuration
        self.feature_config = {
            'temperature': {'min': 35.0, 'max': 40.0, 'weight': 1.0},
            'humidity': {'min': 40.0, 'max': 70.0, 'weight': 0.8},
            'air_pressure': {'min': 1000.0, 'max': 1030.0, 'weight': 0.6},
            'oxygen_level': {'min': 18.0, 'max': 45.0, 'weight': 0.9},
            'co2_level': {'min': 0.0, 'max': 1.0, 'weight': 0.9},
            'vibration_level': {'min': 0.0, 'max': 2.0, 'weight': 1.0},
            'power_voltage': {'min': 10.0, 'max': 15.0, 'weight': 1.0},
            'wifi_signal_strength': {'min': -90, 'max': -30, 'weight': 0.7},
            'sound_level': {'min': 30.0, 'max': 80.0, 'weight': 0.6}
        }
        
        print("🤖 ML Anomaly Detector initialized")
    
    def prepare_training_data(self, sensor_readings: List[SensorData]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare training data from sensor readings
        
        Args:
            sensor_readings: List of SensorData objects
            
        Returns:
            Tuple of (features, labels)
        """
        print(f"📊 Preparing training data from {len(sensor_readings)} sensor readings...")
        
        # Convert to DataFrame
        data_rows = []
        for reading in sensor_readings:
            row = {
                'device_id': reading.device_id,
                'timestamp': reading.timestamp,
                'temperature': reading.temperature or 37.0,
                'humidity': reading.humidity or 55.0,
                'air_pressure': reading.air_pressure or 1013.0,
                'oxygen_level': reading.oxygen_level or 21.0,
                'co2_level': reading.co2_level or 0.04,
                'motion_detected': int(reading.motion_detected or False),
                'vibration_level': reading.vibration_level or 0.1,
                'door_status': int(reading.door_status or False),
                'sound_level': reading.sound_level or 45.0,
                'power_voltage': reading.power_voltage or 12.0,
                'wifi_signal_strength': reading.wifi_signal_strength or -60,
                'system_temperature': reading.system_temperature or 35.0,
                'threat_level': reading.threat_level or 'safe',
                'anomaly_detected': reading.anomaly_detected or False,
                'security_score': reading.security_score or 100
            }
            data_rows.append(row)
        
        df = pd.DataFrame(data_rows)
        
        # Feature engineering
        features = self._engineer_features(df)
        
        # Create labels (1 = normal, -1 = anomaly)
        labels = np.where(
            (df['anomaly_detected'] == True) | 
            (df['threat_level'].isin(['warning', 'critical'])) |
            (df['security_score'] < 70),
            -1,  # Anomaly
            1    # Normal
        )
        
        self.feature_names = list(features.columns)
        
        print(f"✅ Training data prepared: {features.shape[0]} samples, {features.shape[1]} features")
        print(f"   Normal samples: {np.sum(labels == 1)}")
        print(f"   Anomaly samples: {np.sum(labels == -1)}")
        
        return features.values, labels
    
    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for anomaly detection"""
        
        features = pd.DataFrame()
        
        # Basic sensor features
        for sensor, config in self.feature_config.items():
            if sensor in df.columns:
                # Normalized value
                features[f'{sensor}_norm'] = (
                    (df[sensor] - config['min']) / (config['max'] - config['min'])
                ).clip(0, 1)
                
                # Deviation from normal range
                features[f'{sensor}_deviation'] = np.abs(
                    df[sensor] - (config['min'] + config['max']) / 2
                )
        
        # Composite features
        features['temp_humidity_ratio'] = df['temperature'] / (df['humidity'] + 1e-6)
        features['power_signal_ratio'] = df['power_voltage'] / (np.abs(df['wifi_signal_strength']) + 1e-6)
        features['environmental_stress'] = (
            np.abs(df['temperature'] - 37.0) + 
            np.abs(df['humidity'] - 55.0) / 10 +
            np.abs(df['air_pressure'] - 1013.0) / 100
        )
        
        # Security indicators
        features['physical_intrusion'] = (
            df['motion_detected'].astype(int) + 
            df['door_status'].astype(int) + 
            (df['vibration_level'] > 0.5).astype(int)
        )
        
        # Time-based features (if timestamp available)
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            features['hour'] = df['timestamp'].dt.hour
            features['day_of_week'] = df['timestamp'].dt.dayofweek
            features['is_weekend'] = (df['timestamp'].dt.dayofweek >= 5).astype(int)
        
        # Fill any NaN values
        features = features.fillna(0)
        
        return features
    
    def train_model(
        self, 
        sensor_readings: List[SensorData],
        contamination: float = 0.1,
        test_size: float = 0.2
    ) -> ModelMetrics:
        """
        Train anomaly detection model
        
        Args:
            sensor_readings: Training data
            contamination: Expected proportion of anomalies
            test_size: Proportion of data for testing
            
        Returns:
            ModelMetrics with performance information
        """
        print(f"🎯 Training anomaly detection model...")
        
        # Prepare data
        X, y = self.prepare_training_data(sensor_readings)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        # Initialize and fit scaler
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Initialize and train model
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            max_features=1.0,
            bootstrap=False,
            n_jobs=-1
        )
        
        # Fit on normal data only (unsupervised learning)
        normal_mask = y_train == 1
        self.model.fit(X_train_scaled[normal_mask])
        
        # Evaluate model
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        # Calculate metrics
        metrics = self._calculate_metrics(y_test, y_pred_test, X_test.shape)
        
        # Generate version
        version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.current_version = version
        
        # Save model
        model_path, scaler_path = self._save_model(version)
        
        # Update registry
        model_version = ModelVersion(
            version=version,
            model_path=model_path,
            scaler_path=scaler_path,
            metrics=metrics,
            created_at=datetime.now().isoformat(),
            is_active=True,
            esp32_compatible=False  # Will be set during ESP32 conversion
        )
        
        self._register_model(model_version)
        
        print(f"✅ Model trained successfully: {version}")
        print(f"   Accuracy: {metrics.accuracy:.3f}")
        print(f"   F1 Score: {metrics.f1_score:.3f}")
        print(f"   Anomaly Detection Rate: {metrics.anomaly_detection_rate:.3f}")
        
        return metrics
    
    def predict(self, sensor_data: SensorData) -> Tuple[bool, float]:
        """
        Predict if sensor data is anomalous
        
        Args:
            sensor_data: Single sensor reading
            
        Returns:
            Tuple of (is_anomaly, anomaly_score)
        """
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained. Call train_model() first.")
        
        # Prepare single sample
        df = pd.DataFrame([{
            'device_id': sensor_data.device_id,
            'timestamp': sensor_data.timestamp,
            'temperature': sensor_data.temperature or 37.0,
            'humidity': sensor_data.humidity or 55.0,
            'air_pressure': sensor_data.air_pressure or 1013.0,
            'oxygen_level': sensor_data.oxygen_level or 21.0,
            'co2_level': sensor_data.co2_level or 0.04,
            'motion_detected': int(sensor_data.motion_detected or False),
            'vibration_level': sensor_data.vibration_level or 0.1,
            'door_status': int(sensor_data.door_status or False),
            'sound_level': sensor_data.sound_level or 45.0,
            'power_voltage': sensor_data.power_voltage or 12.0,
            'wifi_signal_strength': sensor_data.wifi_signal_strength or -60,
            'system_temperature': sensor_data.system_temperature or 35.0,
            'threat_level': sensor_data.threat_level or 'safe',
            'anomaly_detected': sensor_data.anomaly_detected or False,
            'security_score': sensor_data.security_score or 100
        }])
        
        # Engineer features
        features = self._engineer_features(df)
        
        # Ensure feature order matches training
        features = features.reindex(columns=self.feature_names, fill_value=0)
        
        # Scale and predict
        X_scaled = self.scaler.transform(features.values)
        prediction = self.model.predict(X_scaled)[0]
        anomaly_score = self.model.decision_function(X_scaled)[0]
        
        # Convert to boolean and normalize score
        is_anomaly = prediction == -1
        normalized_score = max(0, min(100, (1 - anomaly_score) * 50 + 50))
        
        return is_anomaly, normalized_score
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, shape: Tuple) -> ModelMetrics:
        """Calculate model performance metrics"""
        
        # Convert to binary classification (1=normal, 0=anomaly)
        y_true_binary = (y_true == 1).astype(int)
        y_pred_binary = (y_pred == 1).astype(int)
        
        # Calculate metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        accuracy = accuracy_score(y_true_binary, y_pred_binary)
        precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
        recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
        f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
        
        # Anomaly-specific metrics
        anomaly_detection_rate = recall_score(1 - y_true_binary, 1 - y_pred_binary, zero_division=0)
        false_positive_rate = 1 - precision if precision > 0 else 0
        
        return ModelMetrics(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            anomaly_detection_rate=anomaly_detection_rate,
            false_positive_rate=false_positive_rate,
            training_samples=shape[0],
            feature_count=shape[1],
            model_version=self.current_version or "unknown",
            training_date=datetime.now().isoformat()
        )
    
    def _save_model(self, version: str) -> Tuple[str, str]:
        """Save model and scaler to disk"""
        
        model_path = os.path.join(self.model_dir, f"anomaly_model_{version}.pkl")
        scaler_path = os.path.join(self.model_dir, f"scaler_{version}.pkl")
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        # Save feature names
        feature_path = os.path.join(self.model_dir, f"features_{version}.json")
        with open(feature_path, 'w') as f:
            json.dump(self.feature_names, f)
        
        return model_path, scaler_path
    
    def load_model(self, version: str) -> bool:
        """Load specific model version"""
        
        if version not in self.model_registry:
            print(f"❌ Model version {version} not found in registry")
            return False
        
        model_info = self.model_registry[version]
        
        try:
            self.model = joblib.load(model_info.model_path)
            self.scaler = joblib.load(model_info.scaler_path)
            
            # Load feature names
            feature_path = model_info.model_path.replace('anomaly_model_', 'features_').replace('.pkl', '.json')
            if os.path.exists(feature_path):
                with open(feature_path, 'r') as f:
                    self.feature_names = json.load(f)
            
            self.current_version = version
            print(f"✅ Model {version} loaded successfully")
            return True
        
        except Exception as e:
            print(f"❌ Failed to load model {version}: {e}")
            return False
    
    def _register_model(self, model_version: ModelVersion):
        """Register model in local registry"""
        
        # Deactivate previous models
        for version in self.model_registry:
            self.model_registry[version].is_active = False
        
        # Register new model
        self.model_registry[model_version.version] = model_version
        
        # Save registry
        self._save_registry()
    
    def _load_registry(self):
        """Load model registry from disk"""
        
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, 'r') as f:
                    data = json.load(f)
                
                for version, info in data.items():
                    metrics = ModelMetrics(**info['metrics'])
                    model_version = ModelVersion(
                        version=info['version'],
                        model_path=info['model_path'],
                        scaler_path=info['scaler_path'],
                        metrics=metrics,
                        created_at=info['created_at'],
                        is_active=info['is_active'],
                        esp32_compatible=info.get('esp32_compatible', False)
                    )
                    self.model_registry[version] = model_version
                
                print(f"📚 Loaded {len(self.model_registry)} models from registry")
            
            except Exception as e:
                print(f"⚠️  Failed to load model registry: {e}")
    
    def _save_registry(self):
        """Save model registry to disk"""
        
        data = {}
        for version, model_version in self.model_registry.items():
            data[version] = {
                'version': model_version.version,
                'model_path': model_version.model_path,
                'scaler_path': model_version.scaler_path,
                'metrics': {
                    'accuracy': model_version.metrics.accuracy,
                    'precision': model_version.metrics.precision,
                    'recall': model_version.metrics.recall,
                    'f1_score': model_version.metrics.f1_score,
                    'anomaly_detection_rate': model_version.metrics.anomaly_detection_rate,
                    'false_positive_rate': model_version.metrics.false_positive_rate,
                    'training_samples': model_version.metrics.training_samples,
                    'feature_count': model_version.metrics.feature_count,
                    'model_version': model_version.metrics.model_version,
                    'training_date': model_version.metrics.training_date
                },
                'created_at': model_version.created_at,
                'is_active': model_version.is_active,
                'esp32_compatible': model_version.esp32_compatible
            }
        
        with open(self.registry_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def get_model_registry(self) -> Dict[str, ModelVersion]:
        """Get all registered models"""
        return self.model_registry.copy()
    
    def get_active_model(self) -> Optional[ModelVersion]:
        """Get currently active model"""
        for model_version in self.model_registry.values():
            if model_version.is_active:
                return model_version
        return None
    
    def detect_model_drift(self, recent_data: List[SensorData], threshold: float = 0.1) -> Dict:
        """
        Detect model drift using recent predictions
        
        Args:
            recent_data: Recent sensor readings
            threshold: Drift threshold
            
        Returns:
            Drift detection results
        """
        if not recent_data or self.model is None:
            return {'drift_detected': False, 'drift_score': 0.0}
        
        # Get predictions for recent data
        anomaly_scores = []
        for data in recent_data:
            try:
                _, score = self.predict(data)
                anomaly_scores.append(score)
            except:
                continue
        
        if not anomaly_scores:
            return {'drift_detected': False, 'drift_score': 0.0}
        
        # Calculate drift metrics
        mean_score = np.mean(anomaly_scores)
        std_score = np.std(anomaly_scores)
        
        # Simple drift detection based on score distribution
        expected_mean = 50.0  # Expected mean for normal operation
        drift_score = abs(mean_score - expected_mean) / 50.0
        
        drift_detected = drift_score > threshold
        
        return {
            'drift_detected': drift_detected,
            'drift_score': drift_score,
            'mean_anomaly_score': mean_score,
            'std_anomaly_score': std_score,
            'sample_count': len(anomaly_scores),
            'threshold': threshold
        }