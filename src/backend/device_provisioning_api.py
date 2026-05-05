"""
Device Provisioning API
=======================
Complete device provisioning workflow with automatic certificate
and encryption key generation.

Author: SafeEdge Team
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import qrcode
import io
import base64
import json
import secrets

from certificate_authority import get_certificate_authority, CertificateAuthority
from encryption_manager import get_device_encryption_manager, DeviceEncryptionManager
import firebase_admin
from firebase_admin import db


router = APIRouter(prefix="/api/devices", tags=["Device Provisioning"])


# ==================== Helper Functions ====================

def get_firebase_db_reference():
    """Safely get Firebase database reference"""
    if not firebase_admin._apps:
        raise ValueError("Firebase not initialized - please ensure backend is properly started")
    return db.reference()


def generate_device_id(device_type: str) -> str:
    """Generate unique device ID"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = secrets.token_hex(4)
    return f"iot_{device_type}_{timestamp}_{random_suffix}"


def generate_provisioning_token() -> str:
    """Generate one-time provisioning token for device validation"""
    return secrets.token_urlsafe(32)


def generate_qr_code(config_data: dict) -> str:
    """Generate QR code containing device configuration"""
    # Convert config to JSON string
    config_json = json.dumps(config_data)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=None,  # Auto-size
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(config_json)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"


class DeviceProvisioningRequest(BaseModel):
    device_name: str
    device_type: str  # temperature_sensor, door_lock, camera, medical_device
    location: str
    organization_id: str
    department_id: Optional[str] = None
    gateway_address: str = "192.168.1.177"
    gateway_port: int = 8883
    connection_type: str = "ethernet"  # ethernet or wifi
    wifi_ssid: Optional[str] = None  # Required if connection_type is wifi
    wifi_password: Optional[str] = None  # Required if connection_type is wifi


class DeviceProvisioningResponse(BaseModel):
    success: bool
    device_id: str
    certificate: str
    private_key: str
    encryption_key: str
    ca_certificate: str
    qr_code: str
    config_json: dict
    provisioning_token: str  # One-time token for device validation
    message: str


class DeviceValidationRequest(BaseModel):
    device_id: str
    provisioning_token: str
    esp32_mac_address: str  # ESP32 MAC for hardware binding


class DeviceValidationResponse(BaseModel):
    success: bool
    valid: bool
    device_name: str
    device_type: str
    organization_id: str
    message: str


# ==================== Helper Functions ====================

def generate_device_id(device_type: str) -> str:
    """Generate unique device ID"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = secrets.token_hex(4)
    return f"iot_{device_type}_{timestamp}_{random_suffix}"


def generate_provisioning_token() -> str:
    """Generate one-time provisioning token for device validation"""
    return secrets.token_urlsafe(32)


def generate_qr_code(config_data: dict) -> str:
    """Generate QR code containing device configuration"""
    # Convert config to JSON string
    config_json = json.dumps(config_data)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=None,  # Auto-size
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(config_json)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"


def store_device_provisioning_in_firebase(device_id: str, provisioning_data: dict):
    """Store device provisioning data in Firebase"""
    try:
        db_ref = get_firebase_db_reference()
        
        # Store in /devices/{device_id}/provisioning
        db_ref.child(f'devices/{device_id}/provisioning').set(provisioning_data)
        
        # Initialize device info
        db_ref.child(f'devices/{device_id}/info').set({
            'device_id': device_id,
            'device_name': provisioning_data['device_name'],
            'device_type': provisioning_data['device_type'],
            'location': provisioning_data['location'],
            'organization_id': provisioning_data['organization_id'],
            'department_id': provisioning_data.get('department_id'),
            'status': 'offline',
            'created_at': datetime.utcnow().isoformat(),
            'last_seen': None,
            'firmware_version': None
        })
        
        # Initialize security info
        db_ref.child(f'devices/{device_id}/security').set({
            'certificate_serial': provisioning_data['certificate_serial'],
            'certificate_expires_at': provisioning_data['certificate_expires_at'],
            'authentication_failures': 0,
            'last_authenticated': None
        })
        
        print(f"✅ Device provisioning data stored in Firebase: {device_id}")
        
    except Exception as e:
        print(f"❌ Failed to store device provisioning data in Firebase: {e}")
        raise


# ==================== API Endpoints ====================

@router.post("/provision", response_model=DeviceProvisioningResponse)
async def provision_device(
    request: DeviceProvisioningRequest,
    ca: CertificateAuthority = Depends(get_certificate_authority),
    enc_manager: DeviceEncryptionManager = Depends(get_device_encryption_manager)
):
    """
    Provision a new IoT device with complete security setup.
    
    This endpoint:
    1. Generates unique device ID
    2. Creates ECC certificate and private key
    3. Generates AES-256 encryption key
    4. Stores everything in Firebase
    5. Returns QR code and config file
    """
    try:
        # Generate unique device ID
        device_id = generate_device_id(request.device_type)
        
        # Generate one-time provisioning token
        provisioning_token = generate_provisioning_token()
        
        print(f"🔐 Provisioning device: {device_id}")
        print(f"🎫 Provisioning token: {provisioning_token[:20]}...")
        
        # Generate device certificate
        cert, key = ca.generate_device_certificate(
            device_id=device_id,
            device_type=request.device_type,
            organization_id=request.organization_id,
            validity_days=365
        )
        
        # Export certificate and key
        cert_pem = ca.export_device_certificate(cert)
        key_pem = ca.export_device_private_key(key)
        
        # Get CA certificate
        ca_cert_pem = ca.export_ca_certificate()
        
        # Generate encryption key
        device_enc = enc_manager.add_device(device_id)
        encryption_key_b64 = device_enc.get_key_base64()
        
        # Create configuration data
        config_data = {
            "device_id": device_id,
            "device_name": request.device_name,
            "device_type": request.device_type,
            "connection_type": request.connection_type,
            "gateway": {
                "address": request.gateway_address,
                "port": request.gateway_port,
                "protocol": "mqtts"
            },
            "wifi": {
                "ssid": request.wifi_ssid,
                "password": request.wifi_password
            } if request.connection_type == "wifi" else None,
            "certificates": {
                "ca_certificate": ca_cert_pem,
                "device_certificate": cert_pem,
                "device_private_key": key_pem
            },
            "encryption": {
                "key": encryption_key_b64,
                "algorithm": "AES-256-GCM"
            },
            "provisioning": {
                "token": provisioning_token,
                "validation_url": f"https://api.safeedge.com/api/devices/validate"
            },
            "organization_id": request.organization_id,
            "department_id": request.department_id
        }
        
        # Generate QR code with URL to provisioning page
        # When scanned, opens web page that can send config to ESP32
        qr_url = f"http://localhost:9002/provision/{device_id}"
        qr_code_url = generate_qr_code(qr_url)
        
        # Also generate QR with full config for direct provisioning
        qr_config = {
            "device_id": device_id,
            "provisioning_token": provisioning_token,
            "device_name": request.device_name,
            "device_type": request.device_type,
            "gateway": {
                "address": request.gateway_address,
                "port": request.gateway_port
            },
            "wifi": {
                "ssid": request.wifi_ssid,
                "password": request.wifi_password
            } if request.connection_type == "wifi" else None,
            "validation_url": "http://192.168.1.177:8000/api/devices/validate",
            "certificates": {
                "ca": ca_cert_pem,
                "cert": cert_pem,
                "key": key_pem
            },
            "encryption_key": encryption_key_b64
        }
        qr_code_data = generate_qr_code(json.dumps(qr_config))
        
        # Store provisioning data in Firebase
        provisioning_data = {
            "device_id": device_id,
            "device_name": request.device_name,
            "device_type": request.device_type,
            "location": request.location,
            "organization_id": request.organization_id,
            "department_id": request.department_id,
            "connection_type": request.connection_type,
            "wifi_ssid": request.wifi_ssid if request.connection_type == "wifi" else None,
            "provisioned_at": datetime.utcnow().isoformat(),
            "status": "pending",
            "provisioning_token": provisioning_token,
            "token_used": False,
            "validated_at": None,
            "esp32_mac_address": None,
            "certificate_serial": str(cert.serial_number),
            "certificate_expires_at": cert.not_valid_after.isoformat(),
            "encryption_key_id": device_id,
            "gateway_address": request.gateway_address,
            "gateway_port": request.gateway_port
        }
        
        store_device_provisioning_in_firebase(device_id, provisioning_data)
        
        print(f"✅ Device provisioned: {device_id}")
        print(f"   Certificate Serial: {cert.serial_number}")
        print(f"   Encryption Key: Generated")
        print(f"   Stored in Firebase: ✅")
        
        return DeviceProvisioningResponse(
            success=True,
            device_id=device_id,
            certificate=cert_pem,
            private_key=key_pem,
            encryption_key=encryption_key_b64,
            ca_certificate=ca_cert_pem,
            qr_code=qr_code_data,
            config_json=config_data,
            provisioning_token=provisioning_token,
            message=f"Device {device_id} provisioned successfully"
        )
        
    except Exception as e:
        print(f"❌ Provisioning failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to provision device: {str(e)}"
        )


@router.get("/{device_id}/config")
async def get_device_config(device_id: str):
    """
    Get device configuration (for QR code redirect).
    Returns the full configuration for the device.
    """
    try:
        db_ref = get_firebase_db_reference()
        
        # Get provisioning data
        provisioning_data = db_ref.child(f'devices/{device_id}/provisioning').get()
        
        if not provisioning_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Get certificate from Firebase
        cert_serial = provisioning_data.get('certificate_serial')
        
        # Get CA certificate
        ca_data = db_ref.child('certificates/ca').get()
        ca_cert = ca_data.get('certificate') if ca_data else None
        
        # Get device certificate and key from issued certificates
        cert_data = db_ref.child(f'certificates/issued/{cert_serial}').get()
        device_cert = cert_data.get('certificate') if cert_data else None
        device_key = cert_data.get('private_key') if cert_data else None
        
        # Get encryption key
        enc_key_data = db_ref.child(f'encryption_keys/{device_id}').get()
        enc_key = enc_key_data.get('key') if enc_key_data else None
        
        # Build complete config
        config = {
            "device_id": device_id,
            "provisioning_token": provisioning_data.get('provisioning_token'),
            "device_name": provisioning_data.get('device_name'),
            "device_type": provisioning_data.get('device_type'),
            "connection_type": provisioning_data.get('connection_type', 'ethernet'),
            "gateway": {
                "address": provisioning_data.get('gateway_address', '192.168.1.177'),
                "port": provisioning_data.get('gateway_port', 8883)
            },
            "wifi": {
                "ssid": provisioning_data.get('wifi_ssid'),
                "password": provisioning_data.get('wifi_password')
            } if provisioning_data.get('connection_type') == 'wifi' else None,
            "validation_url": "http://192.168.1.177:8000/api/devices/validate",
            "certificates": {
                "ca": ca_cert,
                "cert": device_cert,
                "key": device_key
            },
            "encryption_key": enc_key
        }
        
        return {
            "success": True,
            **config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get device config: {str(e)}"
        )


@router.get("/{device_id}/status")
async def get_device_status(device_id: str):
    """Get device provisioning and connection status"""
    try:
        db_ref = get_firebase_db_reference()
        
        # Get device info
        info = db_ref.child(f'devices/{device_id}/info').get()
        provisioning = db_ref.child(f'devices/{device_id}/provisioning').get()
        security = db_ref.child(f'devices/{device_id}/security').get()
        
        if not info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        return {
            "success": True,
            "device_id": device_id,
            "device_name": info.get('device_name'),
            "status": info.get('status'),
            "provisioned_at": provisioning.get('provisioned_at') if provisioning else None,
            "last_seen": info.get('last_seen'),
            "certificate_expires_at": security.get('certificate_expires_at') if security else None,
            "authentication_failures": security.get('authentication_failures', 0) if security else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get device status: {str(e)}"
        )


@router.delete("/delete")
async def delete_device_data(
    request: dict,
    ca: CertificateAuthority = Depends(get_certificate_authority),
    enc_manager: DeviceEncryptionManager = Depends(get_device_encryption_manager)
):
    """
    Delete device data from Firebase Realtime Database.
    Called by frontend after Firestore deletion.
    """
    try:
        device_id = request.get('device_id')
        organization_id = request.get('organization_id')
        
        if not device_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device ID is required"
            )
        
        db_ref = get_firebase_db_reference()
        
        # Check if device exists
        device_data = db_ref.child(f'devices/{device_id}').get()
        
        if not device_data:
            # Device doesn't exist in Firebase Realtime DB, that's OK
            print(f"⚠️ Device {device_id} not found in Firebase Realtime DB (already deleted or never existed)")
            return {
                "success": True,
                "device_id": device_id,
                "message": "Device data cleanup completed"
            }
        
        # Get provisioning data for certificate revocation
        provisioning = device_data.get('provisioning', {})
        
        # Revoke certificate if it exists
        if provisioning.get('certificate_serial'):
            try:
                cert_serial = int(provisioning.get('certificate_serial'))
                ca.revoke_certificate(cert_serial, reason="Device deleted")
                print(f"🚫 Certificate revoked for device: {device_id}")
            except Exception as cert_error:
                print(f"⚠️ Could not revoke certificate for {device_id}: {cert_error}")
        
        # Remove encryption key
        try:
            enc_manager.remove_device(device_id)
            print(f"🔑 Encryption key removed for device: {device_id}")
        except Exception as key_error:
            print(f"⚠️ Could not remove encryption key for {device_id}: {key_error}")
        
        # Delete all device data from Firebase Realtime DB
        db_ref.child(f'devices/{device_id}').delete()
        
        print(f"🗑️ Device data deleted from Firebase Realtime DB: {device_id}")
        
        return {
            "success": True,
            "device_id": device_id,
            "message": "Device data deleted successfully from Firebase Realtime DB"
        }
        
    except Exception as e:
        print(f"❌ Error deleting device data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete device data: {str(e)}"
        )


@router.delete("/{device_id}")
async def deprovision_device(
    device_id: str,
    ca: CertificateAuthority = Depends(get_certificate_authority),
    enc_manager: DeviceEncryptionManager = Depends(get_device_encryption_manager)
):
    """
    Deprovision a device (revoke certificate and remove keys).
    """
    try:
        db_ref = get_firebase_db_reference()
        
        # Get device provisioning data
        provisioning = db_ref.child(f'devices/{device_id}/provisioning').get()
        
        if not provisioning:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Revoke certificate
        cert_serial = int(provisioning.get('certificate_serial'))
        ca.revoke_certificate(cert_serial, reason="Device deprovisioned")
        
        # Remove encryption key
        enc_manager.remove_device(device_id)
        
        # Update device status
        db_ref.child(f'devices/{device_id}/provisioning/status').set('revoked')
        db_ref.child(f'devices/{device_id}/info/status').set('deprovisioned')
        
        print(f"🚫 Device deprovisioned: {device_id}")
        
        return {
            "success": True,
            "device_id": device_id,
            "message": "Device deprovisioned successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deprovision device: {str(e)}"
        )


@router.get("/list")
async def list_provisioned_devices(
    organization_id: Optional[str] = None,
    status: Optional[str] = None
):
    """List all provisioned devices"""
    try:
        db_ref = get_firebase_db_reference()
        
        # Get all devices
        devices_data = db_ref.child('devices').get()
        
        if not devices_data:
            return {
                "success": True,
                "count": 0,
                "devices": []
            }
        
        devices = []
        for device_id, device_data in devices_data.items():
            info = device_data.get('info', {})
            provisioning = device_data.get('provisioning', {})
            
            # Filter by organization
            if organization_id and info.get('organization_id') != organization_id:
                continue
            
            # Filter by status
            if status and info.get('status') != status:
                continue
            
            devices.append({
                "device_id": device_id,
                "device_name": info.get('device_name'),
                "device_type": info.get('device_type'),
                "location": info.get('location'),
                "status": info.get('status'),
                "provisioned_at": provisioning.get('provisioned_at'),
                "last_seen": info.get('last_seen')
            })
        
        return {
            "success": True,
            "count": len(devices),
            "devices": devices
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list devices: {str(e)}"
        )


@router.post("/validate", response_model=DeviceValidationResponse)
async def validate_device(request: DeviceValidationRequest):
    """
    Validate device authenticity during provisioning.
    
    This endpoint is called by ESP32 to verify:
    1. Device ID is valid
    2. Provisioning token is correct and not used
    3. Bind ESP32 MAC address to device
    
    Enterprise Security: Prevents unauthorized devices from using stolen QR codes
    """
    try:
        db_ref = get_firebase_db_reference()
        
        print(f"🔍 Validating device: {request.device_id}")
        print(f"   Token: {request.provisioning_token[:20]}...")
        print(f"   MAC: {request.esp32_mac_address}")
        
        # Get device provisioning data
        provisioning_data = db_ref.child(f'devices/{request.device_id}/provisioning').get()
        
        if not provisioning_data:
            print(f"❌ Device not found: {request.device_id}")
            return DeviceValidationResponse(
                success=True,
                valid=False,
                device_name="",
                device_type="",
                organization_id="",
                message="Device not found"
            )
        
        # Check if token matches
        stored_token = provisioning_data.get('provisioning_token')
        if stored_token != request.provisioning_token:
            print(f"❌ Invalid token for device: {request.device_id}")
            return DeviceValidationResponse(
                success=True,
                valid=False,
                device_name="",
                device_type="",
                organization_id="",
                message="Invalid provisioning token"
            )
        
        # Check if token already used
        if provisioning_data.get('token_used', False):
            print(f"❌ Token already used for device: {request.device_id}")
            return DeviceValidationResponse(
                success=True,
                valid=False,
                device_name="",
                device_type="",
                organization_id="",
                message="Provisioning token already used"
            )
        
        # Check if device already bound to different MAC
        stored_mac = provisioning_data.get('esp32_mac_address')
        if stored_mac and stored_mac != request.esp32_mac_address:
            print(f"❌ MAC address mismatch for device: {request.device_id}")
            print(f"   Stored: {stored_mac}, Received: {request.esp32_mac_address}")
            return DeviceValidationResponse(
                success=True,
                valid=False,
                device_name="",
                device_type="",
                organization_id="",
                message="Device already bound to different hardware"
            )
        
        # Validation successful - mark token as used and bind MAC
        db_ref.child(f'devices/{request.device_id}/provisioning').update({
            'token_used': True,
            'validated_at': datetime.utcnow().isoformat(),
            'esp32_mac_address': request.esp32_mac_address,
            'status': 'validated'
        })
        
        # Update device info status
        db_ref.child(f'devices/{request.device_id}/info').update({
            'status': 'validated',
            'esp32_mac_address': request.esp32_mac_address
        })
        
        print(f"✅ Device validated: {request.device_id}")
        print(f"   MAC bound: {request.esp32_mac_address}")
        
        return DeviceValidationResponse(
            success=True,
            valid=True,
            device_name=provisioning_data.get('device_name', ''),
            device_type=provisioning_data.get('device_type', ''),
            organization_id=provisioning_data.get('organization_id', ''),
            message="Device validated successfully"
        )
        
    except Exception as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate device: {str(e)}"
        )
