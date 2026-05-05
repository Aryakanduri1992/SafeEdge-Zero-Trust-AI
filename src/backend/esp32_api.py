"""
SafeEdge ESP32 API Endpoints
============================
Backend API for ESP32 device communication with Firebase integration.
Handles device management, sensor data, alerts, and commands.

Author: SafeEdge Team - Imagine Cup 2026
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime
from firebase_esp32_service import get_firebase_esp32_service, FirebaseESP32Service

router = APIRouter(prefix="/api/esp32", tags=["ESP32"])

# ==================== Pydantic Models ====================

class DeviceProvisionRequest(BaseModel):
    deviceName: str
    location: str
    organizationId: str
    departmentId: Optional[str] = None
    deviceType: str = "ESP32_GATEWAY"


class CommandRequest(BaseModel):
    command: str  # STATUS, TEMP_ATTACK, STOP_ATTACK, RESET
    parameters: Optional[Dict] = None


class ResolveAlertRequest(BaseModel):
    resolution: str
    resolvedBy: str


# ==================== API Endpoints ====================

# ==================== Device Management ====================

@router.get("/devices")
async def get_devices(
    organization_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get all ESP32 devices"""
    try:
        devices = firebase_service.get_all_devices(organization_id)
        
        # Filter by status if specified
        if status:
            devices = [d for d in devices if d.get('status') == status]
        
        return {
            "success": True,
            "count": len(devices),
            "devices": devices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{device_id}")
async def get_device(
    device_id: str,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get detailed information about a specific device"""
    try:
        info = firebase_service.get_device_info(device_id)
        current = firebase_service.get_device_current_data(device_id)
        iot_devices = firebase_service.get_connected_iot_devices(device_id)
        blocked_devices = firebase_service.get_blocked_devices(device_id)
        stats = firebase_service.get_device_statistics(device_id)
        
        if not info:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return {
            "success": True,
            "device": {
                "info": info,
                "current": current,
                "connectedIoTDevices": iot_devices,
                "blockedDevices": blocked_devices,
                "statistics": stats
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Real-Time Data ====================

@router.get("/devices/{device_id}/current")
async def get_current_data(
    device_id: str,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get current sensor data"""
    try:
        current = firebase_service.get_device_current_data(device_id)
        
        if not current:
            raise HTTPException(status_code=404, detail="Device not found or no data available")
        
        return {
            "success": True,
            "deviceId": device_id,
            "data": current
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{device_id}/history")
async def get_sensor_history(
    device_id: str,
    limit: int = Query(50, ge=1, le=200),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get sensor history from circular buffer"""
    try:
        if start_time or end_time:
            data = firebase_service.get_sensor_history_range(device_id, start_time, end_time)
            return {
                "success": True,
                "deviceId": device_id,
                "count": len(data),
                "data": data
            }
        else:
            history = firebase_service.get_sensor_history(device_id, limit)
            return {
                "success": True,
                "deviceId": device_id,
                **history
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Alert Management ====================

@router.get("/alerts")
async def get_all_alerts(
    organization_id: Optional[str] = Query(None),
    device_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get alerts across all devices or specific device"""
    try:
        if device_id:
            # Get alerts for specific device
            result = firebase_service.get_alerts(device_id, limit=200, severity=severity, resolved=resolved)
            return {
                "success": True,
                "deviceId": device_id,
                **result
            }
        else:
            # Get alerts for all devices in organization
            devices = firebase_service.get_all_devices(organization_id)
            all_alerts = []
            
            for device in devices:
                dev_id = device['deviceId']
                result = firebase_service.get_alerts(dev_id, limit=50, severity=severity, resolved=resolved)
                for alert in result.get('alerts', []):
                    alert['deviceId'] = dev_id
                    alert['deviceName'] = device.get('deviceName', dev_id)
                    all_alerts.append(alert)
            
            # Sort by timestamp (newest first)
            all_alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return {
                "success": True,
                "count": len(all_alerts),
                "alerts": all_alerts
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{device_id}/alerts")
async def get_device_alerts(
    device_id: str,
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get alerts for a specific device"""
    try:
        result = firebase_service.get_alerts(device_id, limit, severity, resolved)
        return {
            "success": True,
            "deviceId": device_id,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/{device_id}/{alert_index}/resolve")
async def resolve_alert(
    device_id: str,
    alert_index: int,
    request: ResolveAlertRequest,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Mark an alert as resolved"""
    try:
        success = firebase_service.resolve_alert(
            device_id,
            alert_index,
            request.resolution,
            request.resolvedBy
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to resolve alert")
        
        return {
            "success": True,
            "message": "Alert resolved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/statistics")
async def get_alert_statistics(
    organization_id: Optional[str] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get alert statistics"""
    try:
        devices = firebase_service.get_all_devices(organization_id)
        
        total_alerts = 0
        critical_alerts = 0
        warning_alerts = 0
        resolved_alerts = 0
        
        for device in devices:
            stats = firebase_service.get_device_statistics(device['deviceId'])
            total_alerts += stats.get('totalAlerts', 0)
            critical_alerts += stats.get('criticalAlerts', 0)
            warning_alerts += stats.get('warningAlerts', 0)
            resolved_alerts += stats.get('resolvedAlerts', 0)
        
        return {
            "success": True,
            "totalAlerts": total_alerts,
            "criticalAlerts": critical_alerts,
            "warningAlerts": warning_alerts,
            "resolvedAlerts": resolved_alerts,
            "totalDevices": len(devices)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Remote Control ====================

@router.post("/devices/{device_id}/command")
async def send_command(
    device_id: str,
    request: CommandRequest,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Send command to ESP32 device"""
    try:
        # Validate command
        valid_commands = ['STATUS', 'TEMP_ATTACK', 'STOP_ATTACK', 'RESET']
        if request.command not in valid_commands:
            raise HTTPException(status_code=400, detail=f"Invalid command. Must be one of: {valid_commands}")
        
        success = firebase_service.send_command(device_id, request.command, request.parameters)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send command")
        
        return {
            "success": True,
            "message": f"Command '{request.command}' sent to device {device_id}",
            "command": request.command,
            "deviceId": device_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== IoT Device Management ====================

@router.get("/devices/{device_id}/iot-devices")
async def get_iot_devices(
    device_id: str,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get IoT devices connected to ESP32 gateway"""
    try:
        connected = firebase_service.get_connected_iot_devices(device_id)
        blocked = firebase_service.get_blocked_devices(device_id)
        
        return {
            "success": True,
            "deviceId": device_id,
            "connectedDevices": connected,
            "blockedDevices": blocked,
            "totalConnected": len(connected),
            "totalBlocked": len(blocked)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Statistics ====================

@router.get("/devices/{device_id}/statistics")
async def get_device_statistics(
    device_id: str,
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get statistics for a device"""
    try:
        stats = firebase_service.get_device_statistics(device_id)
        
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_system_status(
    organization_id: Optional[str] = Query(None),
    firebase_service: FirebaseESP32Service = Depends(get_firebase_esp32_service)
):
    """Get overall ESP32 system status"""
    try:
        devices = firebase_service.get_all_devices(organization_id)
        
        online_count = sum(1 for d in devices if d.get('status') == 'online')
        offline_count = len(devices) - online_count
        
        # Count by threat level
        safe_count = sum(1 for d in devices if d.get('threatLevel') == 'safe')
        warning_count = sum(1 for d in devices if d.get('threatLevel') == 'warning')
        critical_count = sum(1 for d in devices if d.get('threatLevel') == 'critical')
        
        # Average security score
        scores = [d.get('securityScore', 100) for d in devices if d.get('status') == 'online']
        avg_score = sum(scores) / len(scores) if scores else 100
        
        return {
            "success": True,
            "totalDevices": len(devices),
            "online": online_count,
            "offline": offline_count,
            "threatLevels": {
                "safe": safe_count,
                "warning": warning_count,
                "critical": critical_count
            },
            "averageSecurityScore": round(avg_score, 1),
            "systemStatus": "healthy" if critical_count == 0 else "attention_required",
            "lastUpdate": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
