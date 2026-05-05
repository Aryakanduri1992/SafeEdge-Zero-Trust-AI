"""
Security Analytics API
=====================
API endpoints for storing and retrieving security analytics data

Author: SafeEdge Team
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

from security_analytics_storage import get_security_analytics_storage, SecurityAnalyticsStorage


router = APIRouter(prefix="/api/security-analytics", tags=["Security Analytics"])


# ==================== Request Models ====================

class ThreatDetectionRequest(BaseModel):
    device_id: str
    device_name: str
    threat_type: str
    severity: str
    threat_data: Dict


class SecurityMetricsRequest(BaseModel):
    organization_id: str
    overall_threat_level: str
    average_security_score: float
    anomaly_count: int
    encrypted_devices: int
    total_devices: int
    critical_devices: List[str]


class AnomalyDetectionRequest(BaseModel):
    device_id: str
    device_name: str
    anomaly_type: str
    anomaly_data: Dict


class SecurityEventRequest(BaseModel):
    organization_id: str
    event_type: str
    severity: str
    title: str
    description: str
    metadata: Optional[Dict] = None


# ==================== Threat Detection Endpoints ====================

@router.post("/threats")
async def store_threat(
    request: ThreatDetectionRequest,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Store a detected threat"""
    try:
        threat_id = storage.store_threat_detection(
            device_id=request.device_id,
            device_name=request.device_name,
            threat_type=request.threat_type,
            severity=request.severity,
            threat_data=request.threat_data
        )
        
        if threat_id:
            return {
                "success": True,
                "threat_id": threat_id,
                "message": "Threat stored successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store threat")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/threats/active")
async def get_active_threats(
    organization_id: Optional[str] = None,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get all active threats"""
    try:
        threats = storage.get_active_threats(organization_id)
        return {
            "success": True,
            "count": len(threats),
            "threats": threats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/threats/{threat_id}/resolve")
async def resolve_threat(
    threat_id: str,
    resolved_by: str,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Mark a threat as resolved"""
    try:
        success = storage.resolve_threat(threat_id, resolved_by)
        if success:
            return {
                "success": True,
                "message": "Threat resolved successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to resolve threat")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Security Metrics Endpoints ====================

@router.post("/metrics")
async def store_metrics(
    request: SecurityMetricsRequest,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Store security metrics"""
    try:
        metrics = {
            'overall_threat_level': request.overall_threat_level,
            'average_security_score': request.average_security_score,
            'anomaly_count': request.anomaly_count,
            'encrypted_devices': request.encrypted_devices,
            'total_devices': request.total_devices,
            'critical_devices': request.critical_devices
        }
        
        success = storage.store_security_metrics(
            organization_id=request.organization_id,
            metrics=metrics
        )
        
        if success:
            return {
                "success": True,
                "message": "Metrics stored successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store metrics")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{organization_id}/latest")
async def get_latest_metrics(
    organization_id: str,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get latest security metrics"""
    try:
        metrics = storage.get_latest_metrics(organization_id)
        if metrics:
            return {
                "success": True,
                "metrics": metrics
            }
        else:
            return {
                "success": True,
                "metrics": None,
                "message": "No metrics found"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{organization_id}/history")
async def get_metrics_history(
    organization_id: str,
    hours: int = 24,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get historical security metrics"""
    try:
        history = storage.get_metrics_history(organization_id, hours)
        return {
            "success": True,
            "count": len(history),
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Anomaly Detection Endpoints ====================

@router.post("/anomalies")
async def store_anomaly(
    request: AnomalyDetectionRequest,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Store detected anomaly"""
    try:
        anomaly_id = storage.store_anomaly(
            device_id=request.device_id,
            device_name=request.device_name,
            anomaly_type=request.anomaly_type,
            anomaly_data=request.anomaly_data
        )
        
        if anomaly_id:
            return {
                "success": True,
                "anomaly_id": anomaly_id,
                "message": "Anomaly stored successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store anomaly")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def get_anomalies(
    device_id: Optional[str] = None,
    hours: int = 24,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get recent anomalies"""
    try:
        anomalies = storage.get_recent_anomalies(device_id, hours)
        return {
            "success": True,
            "count": len(anomalies),
            "anomalies": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Security Events Endpoints ====================

@router.post("/events")
async def store_event(
    request: SecurityEventRequest,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Store security event"""
    try:
        event_id = storage.store_security_event(
            organization_id=request.organization_id,
            event_type=request.event_type,
            severity=request.severity,
            title=request.title,
            description=request.description,
            metadata=request.metadata
        )
        
        if event_id:
            return {
                "success": True,
                "event_id": event_id,
                "message": "Event stored successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store event")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{organization_id}")
async def get_events(
    organization_id: str,
    hours: int = 24,
    severity: Optional[str] = None,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get security events"""
    try:
        events = storage.get_security_events(organization_id, hours, severity)
        return {
            "success": True,
            "count": len(events),
            "events": events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Compliance Endpoints ====================

@router.get("/compliance/{organization_id}")
async def get_compliance_status(
    organization_id: str,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get compliance status"""
    try:
        compliance = storage.get_compliance_status(organization_id)
        return {
            "success": True,
            "compliance": compliance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Alert Storage Endpoints ====================

class AlertStorageRequest(BaseModel):
    organization_id: str
    alert_type: str
    channels_used: List[str]
    success: bool
    attempts: int
    duration_ms: float
    urgency: str
    threat_id: Optional[str] = None
    metadata: Optional[Dict] = None


@router.post("/alerts")
async def store_alert(
    request: AlertStorageRequest,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Store alert delivery information"""
    try:
        alert_id = storage.store_alert(
            organization_id=request.organization_id,
            alert_type=request.alert_type,
            channels_used=request.channels_used,
            success=request.success,
            attempts=request.attempts,
            duration_ms=request.duration_ms,
            urgency=request.urgency,
            threat_id=request.threat_id,
            metadata=request.metadata
        )
        
        if alert_id:
            return {
                "success": True,
                "alert_id": alert_id,
                "message": "Alert stored successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store alert")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{organization_id}")
async def get_alerts(
    organization_id: str,
    hours: int = 24,
    acknowledged: Optional[bool] = None,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get alerts for an organization"""
    try:
        alerts = storage.get_alerts(organization_id, hours, acknowledged)
        return {
            "success": True,
            "count": len(alerts),
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/{organization_id}/{alert_id}/acknowledge")
async def acknowledge_alert(
    organization_id: str,
    alert_id: str,
    acknowledged_by: str,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Mark an alert as acknowledged"""
    try:
        success = storage.acknowledge_alert(organization_id, alert_id, acknowledged_by)
        if success:
            return {
                "success": True,
                "message": "Alert acknowledged successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to acknowledge alert")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{organization_id}/stats")
async def get_alert_stats(
    organization_id: str,
    hours: int = 24,
    storage: SecurityAnalyticsStorage = Depends(get_security_analytics_storage)
):
    """Get alert statistics"""
    try:
        stats = storage.get_alert_stats(organization_id, hours)
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
