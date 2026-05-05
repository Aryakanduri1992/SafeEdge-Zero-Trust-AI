"""
ESP32 OTA Manager (Python)
Task 5.2: Local OTA update simulation for ESP32 model deployment
Simulates firmware update delivery system for TinyML models
"""

import os
import json
import struct
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import hashlib

from ml_anomaly_detector import MLAnomalyDetector, ModelVersion


@dataclass
class ESP32ModelPackage:
    """ESP32-compatible model package"""
    model_id: str
    version: str
    model_size: int  # bytes
    checksum: str
    feature_count: int
    threshold: float
    weights: List[float]
    biases: List[float]
    scaler_params: Dict[str, List[float]]
    created_at: str
    compatible_firmware: str


@dataclass
class OTAUpdate:
    """OTA update information"""
    update_id: str
    device_id: str
    model_package: ESP32ModelPackage
    status: str  # 'pending', 'downloading', 'installing', 'completed', 'failed'
    progress: float  # 0-100
    started_at: str
    completed_at: Optional[str]
    error_message: Optional[str]


@dataclass
class DeviceInfo:
    """ESP32 device information"""
    device_id: str
    firmware_version: str
    current_model_version: Optional[str]
    last_seen: str
    update_status: str
    memory_available: int  # bytes
    supports_ota: bool


class ESP32OTAManager:
    """Manages OTA updates for ESP32 TinyML models"""
    
    def __init__(self, storage_dir: str = "esp32_models"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # OTA tracking
        self.ota_updates: Dict[str, OTAUpdate] = {}
        self.device_registry: Dict[str, DeviceInfo] = {}
        
        # Model conversion settings
        self.esp32_constraints = {
            'max_model_size': 32768,  # 32KB
            'max_features': 20,
            'supported_types': ['IsolationForest', 'RandomForest'],
            'memory_overhead': 4096,  # 4KB overhead
            'firmware_versions': ['v2.1.0', 'v2.2.0', 'v2.3.0']
        }
        
        print("📱 ESP32 OTA Manager initialized")
    
    def convert_model_to_esp32(
        self, 
        ml_detector: MLAnomalyDetector,
        model_version: str
    ) -> Optional[ESP32ModelPackage]:
        """
        Convert scikit-learn model to ESP32-compatible format
        
        Args:
            ml_detector: Trained ML detector
            model_version: Version to convert
            
        Returns:
            ESP32ModelPackage if successful, None otherwise
        """
        print(f"🔄 Converting model {model_version} to ESP32 format...")
        
        # Load the model
        if not ml_detector.load_model(model_version):
            print(f"❌ Failed to load model {model_version}")
            return None
        
        if ml_detector.model is None or ml_detector.scaler is None:
            print(f"❌ Model or scaler not available")
            return None
        
        try:
            # Extract model parameters (simplified for IsolationForest)
            model = ml_detector.model
            scaler = ml_detector.scaler
            
            # Check constraints
            feature_count = len(ml_detector.feature_names)
            if feature_count > self.esp32_constraints['max_features']:
                print(f"❌ Too many features: {feature_count} > {self.esp32_constraints['max_features']}")
                return None
            
            # Extract decision function parameters (simplified)
            # In a real implementation, this would extract tree structures
            # For demo purposes, we'll create a simplified representation
            
            # Get sample predictions to estimate threshold
            sample_data = np.random.randn(100, feature_count)
            sample_scaled = scaler.transform(sample_data)
            decision_scores = model.decision_function(sample_scaled)
            threshold = np.percentile(decision_scores, 10)  # 10th percentile as threshold
            
            # Create simplified weights (for demo)
            weights = np.random.randn(feature_count).tolist()
            biases = [threshold]
            
            # Extract scaler parameters
            scaler_params = {
                'mean': scaler.mean_.tolist(),
                'scale': scaler.scale_.tolist()
            }
            
            # Create binary representation
            model_data = self._create_binary_model(
                weights, biases, scaler_params, threshold
            )
            
            # Calculate size and checksum
            model_size = len(model_data)
            checksum = hashlib.md5(model_data).hexdigest()
            
            # Check size constraint
            if model_size > self.esp32_constraints['max_model_size']:
                print(f"❌ Model too large: {model_size} > {self.esp32_constraints['max_model_size']} bytes")
                return None
            
            # Create package
            package = ESP32ModelPackage(
                model_id=f"esp32_{model_version}",
                version=model_version,
                model_size=model_size,
                checksum=checksum,
                feature_count=feature_count,
                threshold=threshold,
                weights=weights,
                biases=biases,
                scaler_params=scaler_params,
                created_at=datetime.now().isoformat(),
                compatible_firmware="v2.1.0+"
            )
            
            # Save package
            package_path = self._save_esp32_package(package, model_data)
            
            print(f"✅ Model converted successfully:")
            print(f"   Size: {model_size} bytes")
            print(f"   Features: {feature_count}")
            print(f"   Checksum: {checksum[:8]}...")
            
            return package
        
        except Exception as e:
            print(f"❌ Model conversion failed: {e}")
            return None
    
    def _create_binary_model(
        self, 
        weights: List[float], 
        biases: List[float], 
        scaler_params: Dict, 
        threshold: float
    ) -> bytes:
        """Create binary representation for ESP32"""
        
        # Simple binary format:
        # Header: [magic_number(4), version(4), feature_count(4), threshold(4)]
        # Scaler: [mean_values(feature_count*4), scale_values(feature_count*4)]
        # Weights: [weight_values(feature_count*4)]
        # Biases: [bias_values(len(biases)*4)]
        
        data = bytearray()
        
        # Header
        magic_number = 0x53414645  # "SAFE" in hex
        version = 1
        feature_count = len(weights)
        
        data.extend(struct.pack('<I', magic_number))
        data.extend(struct.pack('<I', version))
        data.extend(struct.pack('<I', feature_count))
        data.extend(struct.pack('<f', threshold))
        
        # Scaler parameters
        for mean_val in scaler_params['mean']:
            data.extend(struct.pack('<f', mean_val))
        
        for scale_val in scaler_params['scale']:
            data.extend(struct.pack('<f', scale_val))
        
        # Weights
        for weight in weights:
            data.extend(struct.pack('<f', weight))
        
        # Biases
        for bias in biases:
            data.extend(struct.pack('<f', bias))
        
        return bytes(data)
    
    def _save_esp32_package(self, package: ESP32ModelPackage, model_data: bytes) -> str:
        """Save ESP32 package to storage"""
        
        # Save binary model
        model_path = os.path.join(self.storage_dir, f"{package.model_id}.bin")
        with open(model_path, 'wb') as f:
            f.write(model_data)
        
        # Save package metadata
        metadata_path = os.path.join(self.storage_dir, f"{package.model_id}.json")
        package_dict = {
            'model_id': package.model_id,
            'version': package.version,
            'model_size': package.model_size,
            'checksum': package.checksum,
            'feature_count': package.feature_count,
            'threshold': package.threshold,
            'weights': package.weights,
            'biases': package.biases,
            'scaler_params': package.scaler_params,
            'created_at': package.created_at,
            'compatible_firmware': package.compatible_firmware,
            'model_path': model_path
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(package_dict, f, indent=2)
        
        return model_path
    
    def register_device(
        self, 
        device_id: str, 
        firmware_version: str,
        memory_available: int = 65536
    ) -> DeviceInfo:
        """Register ESP32 device for OTA updates"""
        
        device_info = DeviceInfo(
            device_id=device_id,
            firmware_version=firmware_version,
            current_model_version=None,
            last_seen=datetime.now().isoformat(),
            update_status='idle',
            memory_available=memory_available,
            supports_ota=firmware_version in self.esp32_constraints['firmware_versions']
        )
        
        self.device_registry[device_id] = device_info
        
        print(f"📱 Device registered: {device_id} (firmware: {firmware_version})")
        
        return device_info
    
    def deploy_model_to_device(
        self, 
        device_id: str, 
        package: ESP32ModelPackage
    ) -> Optional[OTAUpdate]:
        """
        Deploy model package to ESP32 device
        
        Args:
            device_id: Target device ID
            package: ESP32 model package
            
        Returns:
            OTAUpdate if deployment started, None otherwise
        """
        print(f"🚀 Deploying model {package.model_id} to device {device_id}...")
        
        # Check device registration
        if device_id not in self.device_registry:
            print(f"❌ Device {device_id} not registered")
            return None
        
        device = self.device_registry[device_id]
        
        # Check compatibility
        if not device.supports_ota:
            print(f"❌ Device {device_id} does not support OTA updates")
            return None
        
        # Check memory
        required_memory = package.model_size + self.esp32_constraints['memory_overhead']
        if required_memory > device.memory_available:
            print(f"❌ Insufficient memory: {required_memory} > {device.memory_available}")
            return None
        
        # Create OTA update
        update_id = f"ota_{int(datetime.now().timestamp())}_{device_id}"
        
        ota_update = OTAUpdate(
            update_id=update_id,
            device_id=device_id,
            model_package=package,
            status='pending',
            progress=0.0,
            started_at=datetime.now().isoformat(),
            completed_at=None,
            error_message=None
        )
        
        self.ota_updates[update_id] = ota_update
        
        # Update device status
        device.update_status = 'updating'
        
        # Simulate OTA process
        success = self._simulate_ota_process(ota_update)
        
        if success:
            device.current_model_version = package.version
            device.update_status = 'idle'
            print(f"✅ Model deployed successfully to {device_id}")
        else:
            device.update_status = 'failed'
            print(f"❌ Model deployment failed for {device_id}")
        
        return ota_update
    
    def _simulate_ota_process(self, ota_update: OTAUpdate) -> bool:
        """Simulate OTA update process"""
        
        import time
        import random
        
        try:
            # Simulate download phase
            ota_update.status = 'downloading'
            for progress in range(0, 51, 10):
                ota_update.progress = progress
                time.sleep(0.1)  # Simulate network delay
            
            # Simulate installation phase
            ota_update.status = 'installing'
            for progress in range(50, 101, 10):
                ota_update.progress = progress
                time.sleep(0.1)  # Simulate flash write
            
            # Random failure simulation (10% chance)
            if random.random() < 0.1:
                ota_update.status = 'failed'
                ota_update.error_message = 'Flash write error'
                return False
            
            # Success
            ota_update.status = 'completed'
            ota_update.completed_at = datetime.now().isoformat()
            ota_update.progress = 100.0
            
            return True
        
        except Exception as e:
            ota_update.status = 'failed'
            ota_update.error_message = str(e)
            return False
    
    def get_device_status(self, device_id: str) -> Optional[DeviceInfo]:
        """Get device status"""
        return self.device_registry.get(device_id)
    
    def get_ota_status(self, update_id: str) -> Optional[OTAUpdate]:
        """Get OTA update status"""
        return self.ota_updates.get(update_id)
    
    def list_available_models(self) -> List[ESP32ModelPackage]:
        """List all available ESP32 model packages"""
        
        packages = []
        
        for filename in os.listdir(self.storage_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(self.storage_dir, filename), 'r') as f:
                        data = json.load(f)
                    
                    package = ESP32ModelPackage(
                        model_id=data['model_id'],
                        version=data['version'],
                        model_size=data['model_size'],
                        checksum=data['checksum'],
                        feature_count=data['feature_count'],
                        threshold=data['threshold'],
                        weights=data['weights'],
                        biases=data['biases'],
                        scaler_params=data['scaler_params'],
                        created_at=data['created_at'],
                        compatible_firmware=data['compatible_firmware']
                    )
                    
                    packages.append(package)
                
                except Exception as e:
                    print(f"⚠️  Failed to load package {filename}: {e}")
        
        return packages
    
    def rollback_model(self, device_id: str, target_version: str) -> bool:
        """
        Rollback device to previous model version
        
        Args:
            device_id: Target device
            target_version: Version to rollback to
            
        Returns:
            True if rollback successful
        """
        print(f"⏪ Rolling back device {device_id} to version {target_version}...")
        
        if device_id not in self.device_registry:
            print(f"❌ Device {device_id} not registered")
            return False
        
        # Find target package
        packages = self.list_available_models()
        target_package = None
        
        for package in packages:
            if package.version == target_version:
                target_package = package
                break
        
        if target_package is None:
            print(f"❌ Target version {target_version} not found")
            return False
        
        # Deploy target package
        ota_update = self.deploy_model_to_device(device_id, target_package)
        
        if ota_update and ota_update.status == 'completed':
            print(f"✅ Rollback successful")
            return True
        else:
            print(f"❌ Rollback failed")
            return False
    
    def get_deployment_stats(self) -> Dict:
        """Get deployment statistics"""
        
        total_updates = len(self.ota_updates)
        successful_updates = sum(1 for update in self.ota_updates.values() if update.status == 'completed')
        failed_updates = sum(1 for update in self.ota_updates.values() if update.status == 'failed')
        pending_updates = sum(1 for update in self.ota_updates.values() if update.status in ['pending', 'downloading', 'installing'])
        
        total_devices = len(self.device_registry)
        active_devices = sum(1 for device in self.device_registry.values() if device.supports_ota)
        
        return {
            'total_updates': total_updates,
            'successful_updates': successful_updates,
            'failed_updates': failed_updates,
            'pending_updates': pending_updates,
            'success_rate': (successful_updates / total_updates * 100) if total_updates > 0 else 0,
            'total_devices': total_devices,
            'active_devices': active_devices,
            'available_models': len(self.list_available_models())
        }