"""
Certificate Management API
==========================
REST API for certificate generation, revocation, and management.
Zero-Trust Security: Never trust, always verify.

Author: SafeEdge Team
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from certificate_authority import get_certificate_authority, CertificateAuthority


router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


# ==================== Pydantic Models ====================

class DeviceCertificateRequest(BaseModel):
    device_id: str
    device_type: str
    organization_id: str
    validity_days: int = 365


class CertificateRevocationRequest(BaseModel):
    serial_number: int
    reason: str = "unspecified"


class CertificateInfo(BaseModel):
    device_id: str
    serial_number: int
    issued_at: str
    expires_at: str
    revoked: bool
    fingerprint: str


# ==================== API Endpoints ====================

@router.post("/generate")
async def generate_device_certificate(
    request: DeviceCertificateRequest,
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Generate certificate for new IoT device.
    Uses ECC (secp256r1) for efficiency on IoT devices.
    
    Returns certificate and private key in PEM format.
    """
    try:
        # Generate certificate and private key
        cert, key = ca.generate_device_certificate(
            device_id=request.device_id,
            device_type=request.device_type,
            organization_id=request.organization_id,
            validity_days=request.validity_days
        )
        
        # Export to PEM format
        cert_pem = ca.export_device_certificate(cert)
        key_pem = ca.export_device_private_key(key)
        
        # Get certificate fingerprint
        fingerprint = ca.get_certificate_fingerprint(cert)
        
        return {
            "success": True,
            "device_id": request.device_id,
            "certificate": cert_pem,
            "private_key": key_pem,
            "serial_number": str(cert.serial_number),
            "fingerprint": fingerprint,
            "valid_from": cert.not_valid_before.isoformat(),
            "valid_until": cert.not_valid_after.isoformat(),
            "algorithm": "ECC secp256r1",
            "message": "Certificate generated successfully. Store private key securely!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate certificate: {str(e)}"
        )


@router.post("/revoke")
async def revoke_certificate(
    request: CertificateRevocationRequest,
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Revoke a device certificate.
    Certificate will be added to CRL and device will be denied access.
    """
    try:
        # Revoke certificate
        ca.revoke_certificate(request.serial_number, request.reason)
        
        # Generate updated CRL
        crl = ca.generate_crl()
        crl_pem = crl.public_bytes(serialization.Encoding.PEM).decode('utf-8')
        
        return {
            "success": True,
            "serial_number": request.serial_number,
            "reason": request.reason,
            "revoked_at": datetime.utcnow().isoformat(),
            "crl": crl_pem,
            "message": "Certificate revoked successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke certificate: {str(e)}"
        )


@router.get("/ca")
async def get_ca_certificate(
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Get CA certificate for distribution to devices.
    Devices need this to verify the ESP32 gateway certificate.
    """
    try:
        cert_pem = ca.export_ca_certificate()
        fingerprint = ca.get_certificate_fingerprint(ca.ca_certificate)
        
        return {
            "success": True,
            "certificate": cert_pem,
            "serial_number": str(ca.ca_certificate.serial_number),
            "fingerprint": fingerprint,
            "valid_from": ca.ca_certificate.not_valid_before.isoformat(),
            "valid_until": ca.ca_certificate.not_valid_after.isoformat(),
            "algorithm": "ECC secp384r1",
            "message": "CA certificate retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get CA certificate: {str(e)}"
        )


@router.get("/crl")
async def get_certificate_revocation_list(
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Get Certificate Revocation List (CRL).
    ESP32 gateway should download this periodically to check revoked certificates.
    """
    try:
        crl = ca.generate_crl()
        crl_pem = crl.public_bytes(serialization.Encoding.PEM).decode('utf-8')
        
        return {
            "success": True,
            "crl": crl_pem,
            "revoked_count": len(ca.revoked_certificates),
            "last_update": crl.last_update.isoformat(),
            "next_update": crl.next_update.isoformat(),
            "message": "CRL retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get CRL: {str(e)}"
        )


@router.get("/verify/{serial_number}")
async def verify_certificate(
    serial_number: int,
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Verify if a certificate is valid (not revoked).
    """
    is_revoked = ca.is_certificate_revoked(serial_number)
    
    cert_info = ca.issued_certificates.get(serial_number)
    
    if not cert_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    return {
        "success": True,
        "serial_number": serial_number,
        "valid": not is_revoked,
        "revoked": is_revoked,
        "device_id": cert_info.get('device_id'),
        "device_type": cert_info.get('device_type'),
        "issued_at": cert_info.get('issued_at'),
        "expires_at": cert_info.get('expires_at'),
        "revoked_at": cert_info.get('revoked_at') if is_revoked else None,
        "revocation_reason": cert_info.get('revocation_reason') if is_revoked else None
    }


@router.get("/list")
async def list_certificates(
    organization_id: Optional[str] = None,
    include_revoked: bool = False,
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    List all issued certificates.
    """
    certificates = []
    
    for serial, info in ca.issued_certificates.items():
        # Filter by organization if specified
        if organization_id and info.get('organization_id') != organization_id:
            continue
        
        # Filter revoked if not included
        if not include_revoked and info.get('revoked'):
            continue
        
        certificates.append({
            "serial_number": serial,
            "device_id": info.get('device_id'),
            "device_type": info.get('device_type'),
            "organization_id": info.get('organization_id'),
            "issued_at": info.get('issued_at'),
            "expires_at": info.get('expires_at'),
            "revoked": info.get('revoked', False),
            "revoked_at": info.get('revoked_at'),
            "revocation_reason": info.get('revocation_reason')
        })
    
    return {
        "success": True,
        "count": len(certificates),
        "certificates": certificates
    }


@router.get("/statistics")
async def get_certificate_statistics(
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Get certificate authority statistics.
    """
    stats = ca.get_statistics()
    
    return {
        "success": True,
        **stats,
        "message": "Statistics retrieved successfully"
    }


@router.post("/batch-generate")
async def batch_generate_certificates(
    devices: List[DeviceCertificateRequest],
    ca: CertificateAuthority = Depends(get_certificate_authority)
):
    """
    Generate certificates for multiple devices at once.
    Useful for provisioning multiple IoT devices.
    """
    results = []
    errors = []
    
    for device_req in devices:
        try:
            cert, key = ca.generate_device_certificate(
                device_id=device_req.device_id,
                device_type=device_req.device_type,
                organization_id=device_req.organization_id,
                validity_days=device_req.validity_days
            )
            
            cert_pem = ca.export_device_certificate(cert)
            key_pem = ca.export_device_private_key(key)
            fingerprint = ca.get_certificate_fingerprint(cert)
            
            results.append({
                "device_id": device_req.device_id,
                "certificate": cert_pem,
                "private_key": key_pem,
                "serial_number": str(cert.serial_number),
                "fingerprint": fingerprint,
                "success": True
            })
        except Exception as e:
            errors.append({
                "device_id": device_req.device_id,
                "error": str(e),
                "success": False
            })
    
    return {
        "success": len(errors) == 0,
        "total": len(devices),
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


# Import serialization for CRL export
from cryptography.hazmat.primitives import serialization
