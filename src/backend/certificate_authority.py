"""
Certificate Authority for ESP32 IoT Device Authentication
==========================================================
Zero-Trust Security: Never trust, always verify
Uses ECC (Elliptic Curve Cryptography) for efficiency on IoT devices
Stores all certificates in Firebase Realtime Database

Author: SafeEdge Team - Imagine Cup 2026
"""

from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend
from datetime import datetime, timedelta
from typing import Tuple, Optional
import secrets
import json
import firebase_admin
from firebase_admin import db


class CertificateAuthority:
    """
    Certificate Authority for issuing and managing device certificates.
    Uses ECC (secp256r1) for IoT device efficiency.
    """
    
    def __init__(self):
        self.ca_private_key: Optional[ec.EllipticCurvePrivateKey] = None
        self.ca_certificate: Optional[x509.Certificate] = None
        self.revoked_certificates: set = set()
        self.issued_certificates: dict = {}  # serial_number -> device_info
        
        # Firebase references - initialized lazily
        self.db_ref = None
        self.certs_ref = None
        self._firebase_initialized = False
        
        # Try to initialize Firebase and load data
        self._ensure_firebase_initialized()
    
    def _ensure_firebase_initialized(self):
        """Ensure Firebase is initialized before accessing it"""
        if self._firebase_initialized:
            return
            
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                print("⚠️  Firebase not initialized yet, will retry when needed")
                return
                
            # Initialize Firebase references
            self.db_ref = db.reference()
            self.certs_ref = self.db_ref.child('certificates')
            self._firebase_initialized = True
            
            # Load existing data from Firebase
            self._load_ca_from_firebase()
            self._load_issued_certificates_from_firebase()
            self._load_revoked_certificates_from_firebase()
            
            print("✅ Certificate Authority Firebase connection established")
            
        except Exception as e:
            print(f"⚠️  Firebase initialization failed in Certificate Authority: {e}")
            # Don't raise exception, just log it - we'll retry later
    
    def _load_ca_from_firebase(self):
        """Load CA certificate and private key from Firebase"""
        if not self._firebase_initialized:
            return
            
        try:
            ca_data = self.certs_ref.child('ca').get()
            if ca_data and 'certificate' in ca_data and 'private_key' in ca_data:
                # Load CA certificate
                cert_pem = ca_data['certificate'].encode()
                self.ca_certificate = x509.load_pem_x509_certificate(
                    cert_pem,
                    default_backend()
                )
                
                # Load CA private key
                key_pem = ca_data['private_key'].encode()
                self.ca_private_key = serialization.load_pem_private_key(
                    key_pem,
                    password=None,
                    backend=default_backend()
                )
                
                print("✅ CA certificate loaded from Firebase")
        except Exception as e:
            print(f"ℹ️  No existing CA in Firebase: {e}")
    
    def _save_ca_to_firebase(self):
        """Save CA certificate and private key to Firebase"""
        self._ensure_firebase_initialized()
        if not self._firebase_initialized:
            print("⚠️  Cannot save CA to Firebase - not initialized")
            return
            
        try:
            cert_pem = self.export_ca_certificate()
            key_pem = self.export_ca_private_key()
            
            self.certs_ref.child('ca').set({
                'certificate': cert_pem,
                'private_key': key_pem,
                'serial_number': str(self.ca_certificate.serial_number),
                'fingerprint': self.get_certificate_fingerprint(self.ca_certificate),
                'created_at': datetime.utcnow().isoformat(),
                'valid_from': self.ca_certificate.not_valid_before.isoformat(),
                'valid_until': self.ca_certificate.not_valid_after.isoformat(),
                'algorithm': 'ECC secp384r1'
            })
            
            print("✅ CA certificate saved to Firebase")
        except Exception as e:
            print(f"❌ Failed to save CA to Firebase: {e}")
    
    def _load_issued_certificates_from_firebase(self):
        """Load issued certificates from Firebase"""
        if not self._firebase_initialized:
            return
            
        try:
            issued_data = self.certs_ref.child('issued').get()
            if issued_data:
                for serial_str, cert_info in issued_data.items():
                    serial = int(serial_str)
                    self.issued_certificates[serial] = cert_info
                print(f"✅ Loaded {len(self.issued_certificates)} issued certificates from Firebase")
        except Exception as e:
            print(f"ℹ️  No issued certificates in Firebase: {e}")
    
    def _save_issued_certificate_to_firebase(self, serial_number: int, cert_info: dict):
        """Save issued certificate info to Firebase"""
        self._ensure_firebase_initialized()
        if not self._firebase_initialized:
            print("⚠️  Cannot save certificate to Firebase - not initialized")
            return
            
        try:
            self.certs_ref.child('issued').child(str(serial_number)).set(cert_info)
        except Exception as e:
            print(f"❌ Failed to save certificate to Firebase: {e}")
    
    def _load_revoked_certificates_from_firebase(self):
        """Load revoked certificates from Firebase"""
        if not self._firebase_initialized:
            return
            
        try:
            revoked_data = self.certs_ref.child('revoked').get()
            if revoked_data:
                self.revoked_certificates = set(int(s) for s in revoked_data.keys())
                print(f"✅ Loaded {len(self.revoked_certificates)} revoked certificates from Firebase")
        except Exception as e:
            print(f"ℹ️  No revoked certificates in Firebase: {e}")
    
    def _save_revoked_certificate_to_firebase(self, serial_number: int, revocation_info: dict):
        """Save revoked certificate info to Firebase"""
        self._ensure_firebase_initialized()
        if not self._firebase_initialized:
            print("⚠️  Cannot save revocation to Firebase - not initialized")
            return
            
        try:
            self.certs_ref.child('revoked').child(str(serial_number)).set(revocation_info)
        except Exception as e:
            print(f"❌ Failed to save revocation to Firebase: {e}")
    
    def generate_ca_certificate(
        self,
        organization: str = "SafeEdge",
        validity_days: int = 3650
    ) -> x509.Certificate:
        """
        Generate root CA certificate using ECC.
        
        Args:
            organization: Organization name
            validity_days: Certificate validity period
            
        Returns:
            CA certificate
        """
        print("🔐 Generating CA certificate with ECC (secp384r1)...")
        
        # Generate CA private key using ECC (secp384r1 for CA)
        self.ca_private_key = ec.generate_private_key(
            ec.SECP384R1(),  # Stronger curve for CA
            default_backend()
        )
        
        # Create CA certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "IoT Security"),
            x509.NameAttribute(NameOID.COMMON_NAME, f"{organization} Root CA"),
        ])
        
        self.ca_certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            self.ca_private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=validity_days)
        ).add_extension(
            x509.BasicConstraints(ca=True, path_length=0),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_cert_sign=True,
                crl_sign=True,
                key_encipherment=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.SubjectKeyIdentifier.from_public_key(
                self.ca_private_key.public_key()
            ),
            critical=False,
        ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
        
        print(f"✅ CA Certificate generated")
        print(f"   Serial: {self.ca_certificate.serial_number}")
        print(f"   Valid until: {self.ca_certificate.not_valid_after}")
        
        # Save to Firebase
        self._save_ca_to_firebase()
        
        return self.ca_certificate
    
    def generate_device_certificate(
        self,
        device_id: str,
        device_type: str,
        organization_id: str,
        validity_days: int = 365
    ) -> Tuple[x509.Certificate, ec.EllipticCurvePrivateKey]:
        """
        Generate certificate for IoT device using ECC.
        
        Args:
            device_id: Unique device identifier
            device_type: Type of device (e.g., temperature_sensor)
            organization_id: Organization ID
            validity_days: Certificate validity period
            
        Returns:
            Tuple of (certificate, private_key)
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()
        
        if not self.ca_certificate or not self.ca_private_key:
            raise ValueError("CA certificate not initialized. Call generate_ca_certificate() first.")
        
        print(f"🔐 Generating device certificate for {device_id}...")
        
        # Generate device private key using ECC (secp256r1 for IoT devices)
        device_private_key = ec.generate_private_key(
            ec.SECP256R1(),  # Efficient curve for IoT devices
            default_backend()
        )
        
        # Create device certificate
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization_id),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, device_type),
            x509.NameAttribute(NameOID.COMMON_NAME, device_id),
        ])
        
        device_certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            self.ca_certificate.subject
        ).public_key(
            device_private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=validity_days)
        ).add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=True,  # For ECDH key exchange
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
                x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
            ]),
            critical=True,
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(f"{device_id}.iot.local"),
                x509.DNSName(f"{device_id}.safeedge.local"),
            ]),
            critical=False,
        ).add_extension(
            x509.SubjectKeyIdentifier.from_public_key(
                device_private_key.public_key()
            ),
            critical=False,
        ).add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_public_key(
                self.ca_private_key.public_key()
            ),
            critical=False,
        ).sign(self.ca_private_key, hashes.SHA256(), default_backend())
        
        # Store issued certificate info
        self.issued_certificates[device_certificate.serial_number] = {
            'device_id': device_id,
            'device_type': device_type,
            'organization_id': organization_id,
            'issued_at': datetime.utcnow().isoformat(),
            'expires_at': device_certificate.not_valid_after.isoformat(),
            'revoked': False,
            'serial_number': str(device_certificate.serial_number),
            'fingerprint': self.get_certificate_fingerprint(device_certificate),
            'algorithm': 'ECC secp256r1'
        }
        
        # Save to Firebase (only if Firebase is initialized)
        self._save_issued_certificate_to_firebase(
            device_certificate.serial_number,
            self.issued_certificates[device_certificate.serial_number]
        )
        
        print(f"✅ Device certificate generated for {device_id}")
        print(f"   Serial: {device_certificate.serial_number}")
        print(f"   Valid until: {device_certificate.not_valid_after}")
        
        return device_certificate, device_private_key
    
    def revoke_certificate(self, serial_number: int, reason: str = "unspecified"):
        """
        Revoke a device certificate.
        
        Args:
            serial_number: Certificate serial number
            reason: Revocation reason
        """
        # Ensure Firebase is initialized
        self._ensure_firebase_initialized()
        
        self.revoked_certificates.add(serial_number)
        
        revocation_info = {
            'serial_number': str(serial_number),
            'revoked_at': datetime.utcnow().isoformat(),
            'reason': reason
        }
        
        if serial_number in self.issued_certificates:
            self.issued_certificates[serial_number]['revoked'] = True
            self.issued_certificates[serial_number]['revoked_at'] = datetime.utcnow().isoformat()
            self.issued_certificates[serial_number]['revocation_reason'] = reason
            
            # Update in Firebase (only if Firebase is initialized)
            self._save_issued_certificate_to_firebase(
                serial_number,
                self.issued_certificates[serial_number]
            )
            
            # Add device info to revocation
            revocation_info['device_id'] = self.issued_certificates[serial_number].get('device_id')
            revocation_info['device_type'] = self.issued_certificates[serial_number].get('device_type')
        
        # Save revocation to Firebase (only if Firebase is initialized)
        self._save_revoked_certificate_to_firebase(serial_number, revocation_info)
        
        print(f"🚫 Certificate {serial_number} revoked: {reason}")
    
    def is_certificate_revoked(self, serial_number: int) -> bool:
        """Check if certificate is revoked"""
        return serial_number in self.revoked_certificates
    
    def generate_crl(self) -> x509.CertificateRevocationList:
        """
        Generate Certificate Revocation List.
        
        Returns:
            CRL object
        """
        if not self.ca_certificate or not self.ca_private_key:
            raise ValueError("CA certificate not initialized")
        
        print(f"📋 Generating CRL with {len(self.revoked_certificates)} revoked certificates...")
        
        builder = x509.CertificateRevocationListBuilder()
        builder = builder.issuer_name(self.ca_certificate.subject)
        builder = builder.last_update(datetime.utcnow())
        builder = builder.next_update(datetime.utcnow() + timedelta(days=1))
        
        for serial in self.revoked_certificates:
            revoked_cert = x509.RevokedCertificateBuilder().serial_number(
                serial
            ).revocation_date(
                datetime.utcnow()
            ).build(default_backend())
            builder = builder.add_revoked_certificate(revoked_cert)
        
        crl = builder.sign(
            private_key=self.ca_private_key,
            algorithm=hashes.SHA256(),
            backend=default_backend()
        )
        
        print(f"✅ CRL generated")
        return crl
    
    def export_ca_certificate(self) -> str:
        """Export CA certificate as PEM"""
        if not self.ca_certificate:
            raise ValueError("CA certificate not initialized")
        
        return self.ca_certificate.public_bytes(
            serialization.Encoding.PEM
        ).decode('utf-8')
    
    def export_ca_private_key(self, password: Optional[str] = None) -> str:
        """Export CA private key as PEM (encrypted if password provided)"""
        if not self.ca_private_key:
            raise ValueError("CA private key not initialized")
        
        encryption = serialization.NoEncryption()
        if password:
            encryption = serialization.BestAvailableEncryption(password.encode())
        
        return self.ca_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption
        ).decode('utf-8')
    
    def export_device_certificate(self, certificate: x509.Certificate) -> str:
        """Export device certificate as PEM"""
        return certificate.public_bytes(
            serialization.Encoding.PEM
        ).decode('utf-8')
    
    def export_device_private_key(
        self,
        private_key: ec.EllipticCurvePrivateKey,
        password: Optional[str] = None
    ) -> str:
        """Export device private key as PEM (encrypted if password provided)"""
        encryption = serialization.NoEncryption()
        if password:
            encryption = serialization.BestAvailableEncryption(password.encode())
        
        return private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption
        ).decode('utf-8')
    
    def get_certificate_fingerprint(self, certificate: x509.Certificate) -> str:
        """Get SHA256 fingerprint of certificate"""
        fingerprint = certificate.fingerprint(hashes.SHA256())
        return ':'.join(f'{b:02x}' for b in fingerprint)
    
    def get_issued_certificates(self) -> dict:
        """Get all issued certificates info"""
        return self.issued_certificates
    
    def get_statistics(self) -> dict:
        """Get CA statistics"""
        total_issued = len(self.issued_certificates)
        total_revoked = len(self.revoked_certificates)
        active_certificates = total_issued - total_revoked
        
        return {
            'total_issued': total_issued,
            'active_certificates': active_certificates,
            'revoked_certificates': total_revoked,
            'ca_valid_until': self.ca_certificate.not_valid_after.isoformat() if self.ca_certificate else None
        }


# Singleton instance
_certificate_authority = None

def get_certificate_authority() -> CertificateAuthority:
    """Get singleton instance of Certificate Authority"""
    global _certificate_authority
    if _certificate_authority is None:
        _certificate_authority = CertificateAuthority()
        
    # Ensure Firebase is initialized and try to load/generate CA certificate
    _certificate_authority._ensure_firebase_initialized()
    
    # Only generate CA certificate if it doesn't exist and Firebase is available
    if (not _certificate_authority.ca_certificate or not _certificate_authority.ca_private_key) and _certificate_authority._firebase_initialized:
        _certificate_authority.generate_ca_certificate("SafeEdge")
    elif not _certificate_authority._firebase_initialized:
        print("⚠️  Firebase not available - CA certificate will be generated when Firebase is ready")
        
    return _certificate_authority
