"""
MLOps Service (Python)
Task 5: Complete MLOps pipeline for IoT security
Integrates ML training, model versioning, and ESP32 deployment
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
import asyncio
from datetime import datetime, timedelta

from ml_anomaly_detector import MLAnomalyDetector, ModelMetrics, ModelVersion
from esp32_ota_manager import ESP32OTAManager, ESP32ModelPackage, OTAUpdate
from cloud_service import SensorData
from firebase_cloud_service import FirebaseCloudService


@dataclass
class MLOpsPipelineResult:
    """MLOps pipeline execution result"""
    success: bool
    model_version: Optional[str]
    metrics: Optional[ModelMetrics]
    esp32_package: Optional[ESP32ModelPackage]
    deployment_results: List[OTAUpdate]
    processing_time: float  # milliseconds
    errors: List[str]


@dataclass
class TrainingJob:
    """ML training job"""
    job_id: str
    status: str  # 'pending', 'running', 'completed', 'failed'
    started_at: str
    completed_at: Optional[str]
    model_version: Optional[str]
    metrics: Optional[ModelMetrics]
    error_message: Optional[str]


class MLOpsService:
    """Complete MLOps service for IoT security"""
    
    def __init__(self, cloud_service: FirebaseCloudService):
        self.cloud_service = cloud_service
        self.ml_detector = MLAnomalyDetector()
        self.ota_manager = ESP32OTAManager()
        
        # Training job tracking
        self.training_jobs: Dict[str, TrainingJob] = {}
        
        # Auto-training configuration
        self.auto_training_config = {
            'enabled': True,
            'min_samples': 100,
            'retrain_interval_hours': 24,
            'drift_threshold': 0.15,
            'auto_deploy': False  # Set to True for automatic deployment
        }
        
        print("🤖 MLOps Service initialized")
    
    async def run_complete_pipeline(
        self,
        device_ids: Optional[List[str]] = None,
        hours_of_data: int = 168,  # 1 week
        auto_deploy: bool = False
    ) -> MLOpsPipelineResult:
        """
        Run complete MLOps pipeline: data collection → training → conversion → deployment
        
        Args:
            device_ids: List of device IDs to collect data from (None = all devices)
            hours_of_data: Hours of historical data to use for training
            auto_deploy: Whether to automatically deploy to devices
            
        Returns:
            MLOpsPipelineResult with pipeline status
        """
        start_time = datetime.now()
        errors: List[str] = []
        
        print(f"🚀 Starting complete MLOps pipeline...")
        
        try:
            # Step 1: Collect training data
            print("📊 Step 1: Collecting training data...")
            sensor_data = await self._collect_training_data(device_ids, hours_of_data)
            
            if len(sensor_data) < self.auto_training_config['min_samples']:
                error_msg = f"Insufficient training data: {len(sensor_data)} < {self.auto_training_config['min_samples']}"
                errors.append(error_msg)
                return MLOpsPipelineResult(
                    success=False,
                    model_version=None,
                    metrics=None,
                    esp32_package=None,
                    deployment_results=[],
                    processing_time=(datetime.now() - start_time).total_seconds() * 1000,
                    errors=errors
                )
            
            # Step 2: Train model
            print("🎯 Step 2: Training anomaly detection model...")
            metrics = self.ml_detector.train_model(sensor_data)
            model_version = self.ml_detector.current_version
            
            # Step 3: Convert to ESP32 format
            print("🔄 Step 3: Converting model to ESP32 format...")
            esp32_package = self.ota_manager.convert_model_to_esp32(
                self.ml_detector, 
                model_version
            )
            
            if esp32_package is None:
                errors.append("Failed to convert model to ESP32 format")
            
            # Step 4: Deploy to devices (if requested)
            deployment_results = []
            if auto_deploy and esp32_package:
                print("🚀 Step 4: Deploying to ESP32 devices...")
                deployment_results = await self._deploy_to_all_devices(esp32_package)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result = MLOpsPipelineResult(
                success=len(errors) == 0,
                model_version=model_version,
                metrics=metrics,
                esp32_package=esp32_package,
                deployment_results=deployment_results,
                processing_time=processing_time,
                errors=errors
            )
            
            print(f"✅ MLOps pipeline completed in {processing_time:.0f}ms")
            print(f"   Model version: {model_version}")
            print(f"   F1 Score: {metrics.f1_score:.3f}")
            print(f"   ESP32 package: {'✅' if esp32_package else '❌'}")
            print(f"   Deployments: {len(deployment_results)}")
            
            return result
        
        except Exception as e:
            errors.append(f"Pipeline error: {str(e)}")
            return MLOpsPipelineResult(
                success=False,
                model_version=None,
                metrics=None,
                esp32_package=None,
                deployment_results=[],
                processing_time=(datetime.now() - start_time).total_seconds() * 1000,
                errors=errors
            )
    
    async def _collect_training_data(
        self, 
        device_ids: Optional[List[str]], 
        hours: int
    ) -> List[SensorData]:
        """Collect training data from Firebase"""
        
        all_data = []
        
        if device_ids is None:
            # Get all devices (simplified - in production, query device registry)
            device_ids = ['incubator_001', 'incubator_002', 'incubator_003']
        
        for device_id in device_ids:
            try:
                device_data = await self.cloud_service.get_sensor_history(device_id, hours)
                all_data.extend(device_data)
                print(f"   📱 {device_id}: {len(device_data)} samples")
            except Exception as e:
                print(f"   ❌ Failed to get data from {device_id}: {e}")
        
        print(f"📊 Collected {len(all_data)} total samples")
        return all_data
    
    async def _deploy_to_all_devices(self, package: ESP32ModelPackage) -> List[OTAUpdate]:
        """Deploy model package to all registered devices"""
        
        deployment_results = []
        
        # Get all registered devices
        for device_id in self.ota_manager.device_registry:
            try:
                ota_update = self.ota_manager.deploy_model_to_device(device_id, package)
                if ota_update:
                    deployment_results.append(ota_update)
                    print(f"   📱 {device_id}: {ota_update.status}")
            except Exception as e:
                print(f"   ❌ Deployment to {device_id} failed: {e}")
        
        return deployment_results
    
    async def start_training_job(
        self,
        device_ids: Optional[List[str]] = None,
        hours_of_data: int = 168
    ) -> str:
        """
        Start asynchronous training job
        
        Args:
            device_ids: Device IDs to collect data from
            hours_of_data: Hours of data to use
            
        Returns:
            Job ID for tracking
        """
        job_id = f"job_{int(datetime.now().timestamp())}"
        
        job = TrainingJob(
            job_id=job_id,
            status='pending',
            started_at=datetime.now().isoformat(),
            completed_at=None,
            model_version=None,
            metrics=None,
            error_message=None
        )
        
        self.training_jobs[job_id] = job
        
        # Start training in background
        asyncio.create_task(self._run_training_job(job, device_ids, hours_of_data))
        
        print(f"🎯 Training job {job_id} started")
        return job_id
    
    async def _run_training_job(
        self,
        job: TrainingJob,
        device_ids: Optional[List[str]],
        hours_of_data: int
    ):
        """Run training job in background"""
        
        try:
            job.status = 'running'
            
            # Collect data
            sensor_data = await self._collect_training_data(device_ids, hours_of_data)
            
            if len(sensor_data) < self.auto_training_config['min_samples']:
                raise ValueError(f"Insufficient training data: {len(sensor_data)}")
            
            # Train model
            metrics = self.ml_detector.train_model(sensor_data)
            
            # Update job
            job.status = 'completed'
            job.completed_at = datetime.now().isoformat()
            job.model_version = self.ml_detector.current_version
            job.metrics = metrics
            
            print(f"✅ Training job {job.job_id} completed: {job.model_version}")
        
        except Exception as e:
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = datetime.now().isoformat()
            print(f"❌ Training job {job.job_id} failed: {e}")
    
    def get_training_job_status(self, job_id: str) -> Optional[TrainingJob]:
        """Get training job status"""
        return self.training_jobs.get(job_id)
    
    async def check_model_drift(self, hours: int = 24) -> Dict:
        """
        Check for model drift using recent data
        
        Args:
            hours: Hours of recent data to analyze
            
        Returns:
            Drift analysis results
        """
        print(f"🔍 Checking model drift using last {hours} hours of data...")
        
        try:
            # Collect recent data
            recent_data = await self._collect_training_data(None, hours)
            
            if len(recent_data) < 10:
                return {
                    'drift_detected': False,
                    'error': 'Insufficient recent data for drift detection'
                }
            
            # Check drift
            drift_result = self.ml_detector.detect_model_drift(
                recent_data, 
                self.auto_training_config['drift_threshold']
            )
            
            # Add recommendation
            if drift_result['drift_detected']:
                drift_result['recommendation'] = 'Model retraining recommended'
                print(f"⚠️  Model drift detected: {drift_result['drift_score']:.3f}")
            else:
                drift_result['recommendation'] = 'Model performance stable'
                print(f"✅ Model performance stable: {drift_result['drift_score']:.3f}")
            
            return drift_result
        
        except Exception as e:
            return {
                'drift_detected': False,
                'error': f'Drift detection failed: {str(e)}'
            }
    
    async def auto_retrain_if_needed(self) -> Optional[str]:
        """
        Automatically retrain model if drift detected
        
        Returns:
            Job ID if retraining started, None otherwise
        """
        if not self.auto_training_config['enabled']:
            return None
        
        print("🔄 Checking if auto-retraining is needed...")
        
        # Check drift
        drift_result = await self.check_model_drift()
        
        if drift_result.get('drift_detected', False):
            print("🎯 Drift detected, starting auto-retraining...")
            job_id = await self.start_training_job()
            return job_id
        
        print("✅ No retraining needed")
        return None
    
    def register_esp32_device(
        self,
        device_id: str,
        firmware_version: str = "v2.1.0",
        memory_available: int = 65536
    ) -> bool:
        """Register ESP32 device for model deployment"""
        
        try:
            self.ota_manager.register_device(
                device_id, 
                firmware_version, 
                memory_available
            )
            print(f"📱 ESP32 device registered: {device_id}")
            return True
        except Exception as e:
            print(f"❌ Failed to register device {device_id}: {e}")
            return False
    
    def get_mlops_dashboard_data(self) -> Dict:
        """Get comprehensive MLOps dashboard data"""
        
        # Model registry
        model_registry = self.ml_detector.get_model_registry()
        active_model = self.ml_detector.get_active_model()
        
        # ESP32 packages
        esp32_packages = self.ota_manager.list_available_models()
        
        # Deployment stats
        deployment_stats = self.ota_manager.get_deployment_stats()
        
        # Training jobs
        recent_jobs = list(self.training_jobs.values())[-10:]  # Last 10 jobs
        
        return {
            'models': {
                'total_models': len(model_registry),
                'active_model': {
                    'version': active_model.version if active_model else None,
                    'accuracy': active_model.metrics.accuracy if active_model else None,
                    'f1_score': active_model.metrics.f1_score if active_model else None
                } if active_model else None,
                'model_list': [
                    {
                        'version': version,
                        'accuracy': model.metrics.accuracy,
                        'f1_score': model.metrics.f1_score,
                        'created_at': model.created_at,
                        'is_active': model.is_active
                    }
                    for version, model in model_registry.items()
                ]
            },
            'esp32_deployment': {
                'available_packages': len(esp32_packages),
                'deployment_stats': deployment_stats,
                'packages': [
                    {
                        'model_id': pkg.model_id,
                        'version': pkg.version,
                        'size_bytes': pkg.model_size,
                        'feature_count': pkg.feature_count,
                        'created_at': pkg.created_at
                    }
                    for pkg in esp32_packages
                ]
            },
            'training_jobs': {
                'total_jobs': len(self.training_jobs),
                'recent_jobs': [
                    {
                        'job_id': job.job_id,
                        'status': job.status,
                        'started_at': job.started_at,
                        'model_version': job.model_version,
                        'accuracy': job.metrics.accuracy if job.metrics else None
                    }
                    for job in recent_jobs
                ]
            },
            'auto_training': self.auto_training_config
        }
    
    def update_auto_training_config(self, config: Dict) -> bool:
        """Update auto-training configuration"""
        
        try:
            self.auto_training_config.update(config)
            print(f"⚙️  Auto-training config updated: {config}")
            return True
        except Exception as e:
            print(f"❌ Failed to update config: {e}")
            return False