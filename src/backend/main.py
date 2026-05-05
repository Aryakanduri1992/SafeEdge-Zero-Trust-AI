"""
SafeEdge Python Backend - Main FastAPI Application
Task 2: Cloud abstraction layer with Firebase optimization
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import time
import os
import json

from config import settings
from cloud_service import CloudServiceFactory, SensorData, DeviceStatus
from firebase_cloud_service import FirebaseCloudService
from esp32_api import router as esp32_router
from websocket_server import setup_websocket_routes
from certificate_api import router as certificate_router
from device_provisioning_api import router as device_provisioning_router
from security_analytics_api import router as security_analytics_router
from kali_integration_api import router as kali_tools_router
from kali_terminal_server import init_kali_terminal_server

# Initialize FastAPI app
app = FastAPI(
    title="SafeEdge Backend API",
    description="Python backend for SafeEdge Imagine Cup 2026",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:9002"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
cloud_service = None
security_pipeline = None
mlops_service = None

# In-memory storage for live threats (in production, use Redis or database)
live_threats = []

# Include ESP32 API routes
app.include_router(esp32_router)

# Include certificate API routes
app.include_router(certificate_router)

# Include device provisioning API routes
app.include_router(device_provisioning_router)

# Include security analytics API routes
app.include_router(security_analytics_router)

# Include Kali tools API routes
app.include_router(kali_tools_router)

# Initialize Kali terminal server
init_kali_terminal_server(app, kali_host='localhost')  # Change to your Kali VM IP

# Include Certificate API routes
app.include_router(certificate_router)

# Include Device Provisioning API routes
app.include_router(device_provisioning_router)

# Include Security Analytics API routes
app.include_router(security_analytics_router)

# Include Kali Security Tools API routes
app.include_router(kali_tools_router)

# Setup WebSocket routes
setup_websocket_routes(app)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global cloud_service, security_pipeline
    
    print("🚀 SafeEdge Backend Starting...")
    print("🏥 Hospital IoT Security Platform")
    print("🏆 Imagine Cup 2026 - World Championship")
    
    # Check if we're in demo mode
    if settings.demo_mode or not os.path.exists(settings.firebase_credentials_path):
        print("🎭 DEMO MODE ACTIVE - Perfect for live presentations!")
        print("📊 Simulated data will be used for demonstration")
        
        # Create a mock cloud service for demo
        from demo_cloud_service import DemoCloudService
        cloud_service = DemoCloudService({})
    else:
        # Initialize real cloud service
        config = {
            'credentials_path': settings.firebase_credentials_path,
            'database_url': settings.firebase_database_url
        }
        
        cloud_service = CloudServiceFactory.get_instance(
            provider=settings.cloud_provider,
            config=config
        )
    
    # Initialize security pipeline (if API keys provided)
    if settings.groq_api_key and settings.elevenlabs_api_key:
        from security_response_pipeline import SecurityResponsePipeline
        
        security_pipeline = SecurityResponsePipeline(
            groq_api_key=settings.groq_api_key,
            elevenlabs_api_key=settings.elevenlabs_api_key,
            enable_voice_alerts=settings.enable_voice_alerts,
            enable_phone_alerts=settings.enable_phone_alerts,
            max_processing_time=settings.max_processing_time,
            twilio_account_sid=settings.twilio_account_sid or '',
            twilio_auth_token=settings.twilio_auth_token or '',
            twilio_from_number=settings.twilio_from_number or '',
            twilio_to_number=settings.twilio_to_number or '',
            emergency_contacts=settings.emergency_contacts or ''
        )
        print("✅ Security Response Pipeline initialized")
    else:
        print("⚠️  Security Pipeline disabled (API keys not configured)")
    
    # Initialize MLOps service (skip in demo mode for faster startup)
    if not settings.demo_mode:
        from mlops_service import MLOpsService
        mlops_service = MLOpsService(cloud_service)
        print("✅ MLOps Service initialized")
    else:
        print("🎭 MLOps Service skipped in demo mode")
    
    print(f"✅ SafeEdge Backend started with {settings.cloud_provider} provider")


def get_cloud_service():
    """Dependency injection for cloud service"""
    if cloud_service is None:
        raise HTTPException(status_code=500, detail="Cloud service not initialized")
    return cloud_service


# ==================== Pydantic Models ====================

class LoginRequest(BaseModel):
    email: str
    password: str


class SensorDataRequest(BaseModel):
    device_id: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_pressure: Optional[float] = None
    oxygen_level: Optional[float] = None
    co2_level: Optional[float] = None
    motion_detected: Optional[bool] = None
    vibration_level: Optional[float] = None
    door_status: Optional[bool] = None
    sound_level: Optional[float] = None
    power_voltage: Optional[float] = None
    wifi_signal_strength: Optional[int] = None
    system_temperature: Optional[float] = None
    threat_level: Optional[str] = None
    anomaly_detected: Optional[bool] = None
    security_score: Optional[int] = None
    encrypted_data: Optional[str] = None


class DeviceCreateRequest(BaseModel):
    device_name: str
    device_type: str
    location: str
    department_id: str


# ==================== Health Check ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "SafeEdge Backend API",
        "version": "1.0.0",
        "provider": settings.cloud_provider,
        "status": "running"
    }


@app.get("/health")
async def health_check(service = Depends(get_cloud_service)):
    """Health check endpoint"""
    health = await service.health_check()
    metrics = await service.get_connection_metrics()
    
    return {
        "status": health.status,
        "latency_ms": health.latency,
        "errors": health.errors,
        "metrics": {
            "active_connections": metrics.active_connections,
            "avg_latency_ms": metrics.avg_latency,
            "error_rate": metrics.error_rate
        }
    }


# ==================== Authentication ====================

@app.post("/api/auth/login")
async def login(request: LoginRequest, service = Depends(get_cloud_service)):
    """User login"""
    try:
        credential = await service.login(request.email, request.password)
        profile = await service.fetch_user_profile(credential.uid)
        
        return {
            "success": True,
            "user": {
                "uid": credential.uid,
                "email": credential.email,
                "display_name": credential.display_name,
                "profile": profile
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


# ==================== Device Management ====================

@app.post("/api/devices")
async def create_device(request: DeviceCreateRequest, service = Depends(get_cloud_service)):
    """Create new device"""
    try:
        device_id = await service.create_device({
            'deviceName': request.device_name,
            'deviceType': request.device_type,
            'location': request.location,
            'departmentId': request.department_id
        })
        
        return {
            "success": True,
            "device_id": device_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/devices/{device_id}/status")
async def get_device_status(device_id: str, service = Depends(get_cloud_service)):
    """Get device status"""
    try:
        status = await service.get_device_status(device_id)
        
        if status is None:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return {
            "device_id": status.device_id,
            "status": status.status,
            "last_seen": status.last_seen,
            "battery_level": status.battery_level,
            "signal_strength": status.signal_strength,
            "threat_level": status.threat_level,
            "location": status.location
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Sensor Data ====================

@app.post("/api/sensor-data")
async def store_sensor_data(request: dict, service = Depends(get_cloud_service)):
    """Store sensor data from ESP32 (encrypted or unencrypted)"""
    try:
        # Check if this is an encrypted payload
        if 'encrypted_data' in request and 'algorithm' in request:
            # This is an encrypted payload
            import json
            encrypted_payload = json.dumps(request)
            
            sensor_data = SensorData(
                device_id=request.get('device_id', 'unknown'),
                timestamp=datetime.now().isoformat(),
                encrypted_data=encrypted_payload,
                temperature=None,
                humidity=None,
                air_pressure=None,
                oxygen_level=None,
                co2_level=None,
                motion_detected=None,
                vibration_level=None,
                door_status=None,
                sound_level=None,
                power_voltage=None,
                wifi_signal_strength=None,
                system_temperature=None,
                threat_level=None,
                anomaly_detected=None,
                security_score=None
            )
            
            print(f"🔒 Received encrypted sensor data from device: {request.get('device_id')}")
            
        else:
            # Legacy unencrypted data
            sensor_data = SensorData(
                device_id=request.get('device_id'),
                timestamp=datetime.now().isoformat(),
                temperature=request.get('temperature'),
                humidity=request.get('humidity'),
                air_pressure=request.get('air_pressure'),
                oxygen_level=request.get('oxygen_level'),
                co2_level=request.get('co2_level'),
                motion_detected=request.get('motion_detected'),
                vibration_level=request.get('vibration_level'),
                door_status=request.get('door_status'),
                sound_level=request.get('sound_level'),
                power_voltage=request.get('power_voltage'),
                wifi_signal_strength=request.get('wifi_signal_strength'),
                system_temperature=request.get('system_temperature'),
                threat_level=request.get('threat_level'),
                anomaly_detected=request.get('anomaly_detected'),
                security_score=request.get('security_score'),
                encrypted_data=None
            )
            
            print(f"📊 Received unencrypted sensor data from device: {request.get('device_id')}")
        
        await service.store_sensor_data(sensor_data)
        
        return {
            "success": True,
            "message": "Sensor data stored successfully",
            "encrypted": sensor_data.encrypted_data is not None
        }
    except Exception as e:
        print(f"❌ Error storing sensor data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/decrypt-sensor-data")
async def decrypt_sensor_data(request: dict):
    """Decrypt sensor data for frontend display"""
    try:
        from encryption_service import decrypt_data
        
        # Decrypt the data
        decrypted_data = decrypt_data(request)
        
        return {
            "success": True,
            "data": decrypted_data,
            "decrypted_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")


@app.get("/api/sensor-data/{device_id}/encrypted")
async def get_encrypted_sensor_history(
    device_id: str, 
    hours: int = 24,
    service = Depends(get_cloud_service)
):
    """Get encrypted sensor data history"""
    try:
        from firebase_admin import db
        
        # Get encrypted data from Firebase
        device_ref = db.reference(f'devices/{device_id}/data')
        data = device_ref.get()
        
        if not data:
            return {
                "device_id": device_id,
                "hours": hours,
                "count": 0,
                "encrypted_data": []
            }
        
        # Filter by time (last N hours)
        cutoff_time = datetime.now() - timedelta(hours=hours)
        filtered_data = []
        
        for timestamp_key, entry in data.items():
            try:
                # Parse timestamp from key
                entry_time = datetime.strptime(timestamp_key[:15], '%Y%m%d_%H%M%S')
                if entry_time >= cutoff_time:
                    filtered_data.append({
                        "timestamp_key": timestamp_key,
                        "entry": entry
                    })
            except:
                # Include entries with unparseable timestamps
                filtered_data.append({
                    "timestamp_key": timestamp_key,
                    "entry": entry
                })
        
        # Sort by timestamp (newest first)
        filtered_data.sort(key=lambda x: x["timestamp_key"], reverse=True)
        
        return {
            "device_id": device_id,
            "hours": hours,
            "count": len(filtered_data),
            "encrypted_data": filtered_data[:100]  # Limit to 100 entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Security Pipeline ====================

@app.post("/api/security/process")
async def process_security_event(request: SensorDataRequest):
    """Process sensor data through security pipeline"""
    if security_pipeline is None:
        raise HTTPException(status_code=503, detail="Security pipeline not initialized")
    
    try:
        sensor_data = {
            'device_id': request.device_id,
            'timestamp': datetime.now().isoformat(),
            'temperature': request.temperature,
            'humidity': request.humidity,
            'air_pressure': request.air_pressure,
            'oxygen_level': request.oxygen_level,
            'co2_level': request.co2_level,
            'motion_detected': request.motion_detected,
            'vibration_level': request.vibration_level,
            'door_status': request.door_status,
            'sound_level': request.sound_level,
            'power_voltage': request.power_voltage,
            'wifi_signal_strength': request.wifi_signal_strength,
            'system_temperature': request.system_temperature,
            'threat_level': request.threat_level,
            'anomaly_detected': request.anomaly_detected,
            'security_score': request.security_score
        }
        
        result = await security_pipeline.process_sensor_data(sensor_data)
        
        return {
            "success": result.success,
            "processing_time_ms": result.processing_time,
            "event": {
                "threat_type": result.event.threat_type.value if result.event else None,
                "threat_level": result.event.threat_level.value if result.event else None,
                "anomaly_score": result.event.anomaly_score if result.event else None
            } if result.event else None,
            "blocking": {
                "blocked": result.blocking_result.blocked if result.blocking_result else None,
                "final_status": result.blocking_result.final_status if result.blocking_result else None
            } if result.blocking_result else None,
            "analysis": {
                "summary": result.analysis.summary if result.analysis else None,
                "urgency_level": result.analysis.urgency_level if result.analysis else None
            } if result.analysis else None,
            "voice_alert": {
                "voice_type": result.voice_alert.voice_type if result.voice_alert else None,
                "audio_path": result.voice_alert.audio_path if result.voice_alert else None
            } if result.voice_alert else None,
            "phone_alert_triggered": result.phone_alert_triggered,
            "errors": result.errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/security/metrics")
async def get_security_metrics():
    """Get security pipeline metrics"""
    if security_pipeline is None:
        raise HTTPException(status_code=503, detail="Security pipeline not initialized")
    
    metrics = security_pipeline.get_metrics()
    rate_limits = security_pipeline.get_rate_limit_status()
    
    return {
        "metrics": metrics,
        "blocking_success_rate": security_pipeline.get_blocking_success_rate(),
        "rate_limits": rate_limits
    }


@app.get("/api/security/test")
async def test_security_pipeline():
    """Test security pipeline with sample data"""
    if security_pipeline is None:
        raise HTTPException(status_code=503, detail="Security pipeline not initialized")
    
    try:
        result = await security_pipeline.test_pipeline()
        
        return {
            "success": result.success,
            "processing_time_ms": result.processing_time,
            "message": "Security pipeline test completed",
            "event_detected": result.event is not None,
            "threat_blocked": result.blocking_result.blocked if result.blocking_result else False,
            "voice_generated": result.voice_alert is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/security/n8n-voice-alert")
async def trigger_n8n_voice_alert(alert_data: dict):
    """Trigger n8n voice alert workflow"""
    try:
        import requests
        
        # n8n webhook URL
        n8n_webhook = "http://localhost:5678/webhook/safeedge-voice"
        
        # Send to n8n
        response = requests.post(
            n8n_webhook,
            json=alert_data,
            timeout=10
        )
        
        if response.status_code == 200:
            return {"success": True, "message": "n8n voice alert triggered"}
        else:
            return {"success": False, "error": f"n8n error: {response.status_code}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/api/security/threats")
async def get_live_threats():
    """Get current live threats"""
    global live_threats
    return live_threats


@app.post("/api/security/simulate-attack")
async def simulate_attack(attack_data: dict):
    """Process attack simulation data through security pipeline"""
    global live_threats
    if security_pipeline is None:
        raise HTTPException(status_code=503, detail="Security pipeline not initialized")
    
    try:
        # Convert attack data to sensor data format
        sensor_data = {
            'device_id': attack_data.get('device_id', 'unknown'),
            'timestamp': datetime.now().isoformat(),
            'temperature': attack_data.get('sensor_data', {}).get('temperature'),
            'humidity': attack_data.get('sensor_data', {}).get('humidity'),
            'air_pressure': None,
            'oxygen_level': attack_data.get('sensor_data', {}).get('oxygen'),
            'co2_level': None,
            'motion_detected': attack_data.get('sensor_data', {}).get('door_sensor') == 'open',
            'vibration_level': None,
            'door_status': attack_data.get('sensor_data', {}).get('door_sensor') == 'open',
            'sound_level': None,
            'power_voltage': attack_data.get('sensor_data', {}).get('voltage'),
            'wifi_signal_strength': None,
            'system_temperature': attack_data.get('sensor_data', {}).get('temperature'),
            'threat_level': 'critical' if attack_data.get('attack_indicators', {}).get('anomaly_score', 0) > 0.8 else 'high',
            'anomaly_detected': True,
            'security_score': int((1 - attack_data.get('attack_indicators', {}).get('anomaly_score', 0.5)) * 100)
        }
        
        # Process through security pipeline
        result = await security_pipeline.process_sensor_data(sensor_data)
        
        # Store in live threats for dashboard
        threat_id = f"threat_{int(time.time())}"
        live_threat = {
            "id": threat_id,
            "deviceId": attack_data.get('device_id', 'unknown'),
            "threatType": attack_data.get('attack_type', 'Unknown Attack'),
            "severity": result.event.threat_level.value if result.event else 'high',
            "status": 'blocked' if (result.blocking_result and result.blocking_result.blocked) else 'failed',
            "timestamp": datetime.now().isoformat(),
            "processingTime": result.processing_time,
            "aiAnalysis": result.analysis.summary if result.analysis else 'AI analysis in progress...',
            "blockingStrategy": result.blocking_result.final_status if result.blocking_result else 'Unknown'
        }
        
        # Add to live threats (keep only last 10)
        live_threats.insert(0, live_threat)
        if len(live_threats) > 10:
            live_threats.pop()
        
        return {
            "success": result.success,
            "processing_time": result.processing_time,
            "attack_type": attack_data.get('attack_type'),
            "detection": {
                "threat_type": result.event.threat_type.value if result.event else None,
                "severity": result.event.threat_level.value if result.event else None,
                "confidence": result.event.anomaly_score if result.event else None
            } if result.event else None,
            "blocking": {
                "success": result.blocking_result.blocked if result.blocking_result else False,
                "strategy": result.blocking_result.final_status if result.blocking_result else None,
                "actions_taken": ["Network isolation", "Emergency protocols", "Alert generation"]
            } if result.blocking_result else None,
            "analysis": {
                "summary": result.analysis.summary if result.analysis else None,
                "risk_level": result.analysis.urgency_level if result.analysis else None,
                "recommendations": [
                    "Immediate system isolation",
                    "Security team notification", 
                    "Incident documentation"
                ]
            } if result.analysis else None,
            "voice_alert": {
                "voice_type": result.voice_alert.voice_type if result.voice_alert else None,
                "duration": result.voice_alert.duration if result.voice_alert else None,
                "audio_path": result.voice_alert.audio_path if result.voice_alert else None
            } if result.voice_alert else None,
            "phone_alert": {
                "channels": ["Android Intent", "Telegram Bot", "Web Audio"],
                "priority": "critical" if attack_data.get('attack_indicators', {}).get('anomaly_score', 0) > 0.8 else "high"
            }
        }
        
    except Exception as e:
        print(f"Attack simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Phone Alert System ====================

class PhoneAlertRequest(BaseModel):
    device_id: str
    phone_number: Optional[str] = None
    message: str
    urgency: str = "calm"  # 'calm', 'urgent', 'critical'


@app.post("/api/alerts/send")
async def send_phone_alert(request: PhoneAlertRequest):
    """Send phone alert manually"""
    if security_pipeline is None:
        raise HTTPException(status_code=503, detail="Security pipeline not initialized")
    
    try:
        from phone_alert_service import PhoneAlertService
        from alert_priority_manager import AlertPriorityManager, AlertUrgency
        from groq_analyzer import IncidentAnalysis
        from elevenlabs_voice import VoiceGenerationResult
        
        # Create mock analysis and voice alert
        analysis = IncidentAnalysis(
            id=f"manual_{int(time.time())}",
            event_id="manual",
            timestamp=datetime.now().isoformat(),
            summary=request.message,
            detailed_analysis=request.message,
            recommendations=[],
            confidence_score=100,
            urgency_level=request.urgency,
            voice_script=request.message,
            blocking_success=(request.urgency == "calm")
        )
        
        voice_alert = VoiceGenerationResult(
            id=f"voice_{int(time.time())}",
            analysis_id=analysis.id,
            timestamp=datetime.now().isoformat(),
            audio_path="",
            audio_data=b"",
            text=request.message,
            voice_type="calm" if request.urgency == "calm" else "urgent",
            character_count=len(request.message),
            duration=0
        )
        
        # Initialize services
        phone_service = PhoneAlertService()
        priority_manager = AlertPriorityManager(phone_service)
        
        # Send alert
        escalation = await priority_manager.send_prioritized_alert(
            analysis,
            voice_alert,
            request.phone_number
        )
        
        return {
            "success": escalation.success,
            "escalation_level": escalation.final_level,
            "attempts": escalation.total_attempts,
            "duration_ms": escalation.duration
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/alerts/history")
async def get_alert_history(limit: int = 10):
    """Get phone alert history"""
    try:
        from phone_alert_service import PhoneAlertService
        
        phone_service = PhoneAlertService()
        history = phone_service.get_alert_history(limit)
        
        return {
            "count": len(history),
            "alerts": [
                {
                    "success": alert.success,
                    "urgency": alert.urgency,
                    "channel": alert.final_channel.value if alert.final_channel else None,
                    "attempts": len(alert.attempts),
                    "duration_ms": alert.total_duration
                }
                for alert in history
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/alerts/stats")
async def get_alert_stats():
    """Get phone alert statistics"""
    try:
        from phone_alert_service import PhoneAlertService
        from alert_priority_manager import AlertPriorityManager
        
        phone_service = PhoneAlertService()
        priority_manager = AlertPriorityManager(phone_service)
        
        return {
            "delivery_success_rate": phone_service.get_success_rate(),
            "channel_stats": phone_service.get_channel_stats(),
            "escalation_stats": priority_manager.get_escalation_stats(),
            "level_distribution": priority_manager.get_level_distribution()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MLOps Pipeline ====================

class MLTrainingRequest(BaseModel):
    device_ids: Optional[List[str]] = None
    hours_of_data: int = 168  # 1 week
    auto_deploy: bool = False


@app.post("/api/mlops/train")
async def start_ml_training(request: MLTrainingRequest):
    """Start ML model training job"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        job_id = await mlops_service.start_training_job(
            device_ids=request.device_ids,
            hours_of_data=request.hours_of_data
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Training job started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mlops/training/{job_id}")
async def get_training_status(job_id: str):
    """Get training job status"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    job = mlops_service.get_training_job_status(job_id)
    
    if job is None:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    return {
        "job_id": job.job_id,
        "status": job.status,
        "started_at": job.started_at,
        "completed_at": job.completed_at,
        "model_version": job.model_version,
        "metrics": {
            "accuracy": job.metrics.accuracy if job.metrics else None,
            "f1_score": job.metrics.f1_score if job.metrics else None,
            "training_samples": job.metrics.training_samples if job.metrics else None
        } if job.metrics else None,
        "error_message": job.error_message
    }


@app.post("/api/mlops/pipeline/run")
async def run_mlops_pipeline(request: MLTrainingRequest):
    """Run complete MLOps pipeline"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        result = await mlops_service.run_complete_pipeline(
            device_ids=request.device_ids,
            hours_of_data=request.hours_of_data,
            auto_deploy=request.auto_deploy
        )
        
        return {
            "success": result.success,
            "processing_time_ms": result.processing_time,
            "model_version": result.model_version,
            "metrics": {
                "accuracy": result.metrics.accuracy if result.metrics else None,
                "f1_score": result.metrics.f1_score if result.metrics else None,
                "anomaly_detection_rate": result.metrics.anomaly_detection_rate if result.metrics else None
            } if result.metrics else None,
            "esp32_package": {
                "model_id": result.esp32_package.model_id if result.esp32_package else None,
                "size_bytes": result.esp32_package.model_size if result.esp32_package else None,
                "feature_count": result.esp32_package.feature_count if result.esp32_package else None
            } if result.esp32_package else None,
            "deployments": len(result.deployment_results),
            "errors": result.errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mlops/drift/check")
async def check_model_drift(hours: int = 24):
    """Check for model drift"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        drift_result = await mlops_service.check_model_drift(hours)
        
        return {
            "drift_detected": drift_result.get('drift_detected', False),
            "drift_score": drift_result.get('drift_score', 0.0),
            "recommendation": drift_result.get('recommendation', 'Unknown'),
            "sample_count": drift_result.get('sample_count', 0),
            "threshold": drift_result.get('threshold', 0.1),
            "error": drift_result.get('error')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DeviceRegistrationRequest(BaseModel):
    device_id: str
    firmware_version: str = "v2.1.0"
    memory_available: int = 65536


@app.post("/api/mlops/devices/register")
async def register_esp32_device(request: DeviceRegistrationRequest):
    """Register ESP32 device for model deployment"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        success = mlops_service.register_esp32_device(
            request.device_id,
            request.firmware_version,
            request.memory_available
        )
        
        return {
            "success": success,
            "device_id": request.device_id,
            "message": "Device registered successfully" if success else "Registration failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mlops/dashboard")
async def get_mlops_dashboard():
    """Get MLOps dashboard data"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        dashboard_data = mlops_service.get_mlops_dashboard_data()
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mlops/auto-retrain")
async def trigger_auto_retrain():
    """Trigger auto-retraining if needed"""
    if mlops_service is None:
        raise HTTPException(status_code=503, detail="MLOps service not initialized")
    
    try:
        job_id = await mlops_service.auto_retrain_if_needed()
        
        if job_id:
            return {
                "retrain_triggered": True,
                "job_id": job_id,
                "message": "Auto-retraining started due to model drift"
            }
        else:
            return {
                "retrain_triggered": False,
                "message": "No retraining needed"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Metrics ====================

@app.get("/api/metrics")
async def get_metrics(service = Depends(get_cloud_service)):
    """Get service performance metrics"""
    metrics = service.get_metrics()
    
    return {
        "cloud_provider": settings.cloud_provider,
        "performance": metrics
    }


# ==================== Run Server ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload
    )
