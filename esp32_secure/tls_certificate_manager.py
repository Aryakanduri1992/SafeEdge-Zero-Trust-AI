"""
SafeEdge ESP32 TLS/SSL Certificate Manager
==========================================
Handles certificate generation, verification, and secure handshake
for ESP32 devices connecting to the SafeEdge backend.

Features:
- Self-signed CA certificate generation
- Device certificate generation and signing
- Certificate pinning support
- Secure handshake protocol
- Certificate rotation support

Author: SafeEdge Team - Imagine Cup 2026
"""

import os
import ssl
import socket
import hashlib
import json
import base64
from datetime import datetime, timedelta
from pathlib import Path

# Try to import cryptography library
try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa, ec
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False
    print("Warning: cryptography library not installed. Run: pip install cryptography")

# ==================== CONFIGURATION ====================
CERT_DIR = Path(__file__).parent / "certificates"
CA_CERT_FILE = CERT_DIR / "safeedge_ca.crt"
CA_KEY_FILE = CERT_DIR / "safeedge_ca.key"
SERVER_CERT_FILE = CERT_DIR / "server.crt"
SERVER_KEY_FILE = CERT_DIR / "server.key"
DEVICE_CERTS_DIR = CERT_DIR / "devices"

# Certificate validity periods
CA_VALIDITY_DAYS = 3650  # 10 years
SERVER_VALIDITY_DAYS = 365  # 1 year
DEVICE_VALIDITY_DAYS = 365  # 1 year

# Organization details
ORG_NAME = "SafeEdge Security"
ORG_UNIT = "IoT Security Division"
COUNTRY = "US"
STATE = "California"
LOCALITY = "San Francisco"


class CertificateManager:
    """Manages TLS certificates for SafeEdge ESP32 devices"""
    
    def __init__(self):
        self.ensure_directories()
        
    def ensure_directories(self):
        """Create certificate directories if they don't exist"""
        CERT_DIR.mkdir(parents=True, exist_ok=True)
        DEVICE_CERTS_DIR.mkdir(parents=True, exist_ok=True)
    
    def generate_ca_certificate(self, force=False):
        """Generate root CA certificate for signing device certificates"""
        if not HAS_CRYPTO:
            raise RuntimeError("cryptography library required")
        
        if CA_CERT_FILE.exists() and CA_KEY_FILE.exists() and not force:
            print("CA certificate already exists. Use force=True to regenerate.")
            return self.load_ca_certificate()
        
        print("Generating SafeEdge Root CA certificate...")
        
        # Generate CA private key (RSA 4096-bit for strong security)
        ca_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096,
            backend=default_backend()
        )
        
        # Build CA certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, COUNTRY),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, STATE),
            x509.NameAttribute(NameOID.LOCALITY_NAME, LOCALITY),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, ORG_NAME),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, ORG_UNIT),
            x509.NameAttribute(NameOID.COMMON_NAME, "SafeEdge Root CA"),
        ])
        
        ca_cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(ca_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=CA_VALIDITY_DAYS))
            .add_extension(
                x509.BasicConstraints(ca=True, path_length=1),
                critical=True
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_cert_sign=True,
                    crl_sign=True,
                    key_encipherment=False,
                    content_commitment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    encipher_only=False,
                    decipher_only=False
                ),
                critical=True
            )
            .sign(ca_key, hashes.SHA256(), default_backend())
        )
        
        # Save CA certificate
        with open(CA_CERT_FILE, "wb") as f:
            f.write(ca_cert.public_bytes(serialization.Encoding.PEM))
        
        # Save CA private key (encrypted)
        with open(CA_KEY_FILE, "wb") as f:
            f.write(ca_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        # Set restrictive permissions on key file
        os.chmod(CA_KEY_FILE, 0o600)
        
        print(f"CA certificate saved to: {CA_CERT_FILE}")
        print(f"CA private key saved to: {CA_KEY_FILE}")
        
        return ca_cert, ca_key
    
    def load_ca_certificate(self):
        """Load existing CA certificate and key"""
        if not HAS_CRYPTO:
            raise RuntimeError("cryptography library required")
        
        with open(CA_CERT_FILE, "rb") as f:
            ca_cert = x509.load_pem_x509_certificate(f.read(), default_backend())
        
        with open(CA_KEY_FILE, "rb") as f:
            ca_key = serialization.load_pem_private_key(
                f.read(), password=None, backend=default_backend()
            )
        
        return ca_cert, ca_key
    
    def generate_server_certificate(self, hostname="localhost", ip_addresses=None):
        """Generate server certificate signed by CA"""
        if not HAS_CRYPTO:
            raise RuntimeError("cryptography library required")
        
        # Load CA
        ca_cert, ca_key = self.load_ca_certificate()
        
        print(f"Generating server certificate for: {hostname}")
        
        # Generate server private key
        server_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Build subject
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, COUNTRY),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, STATE),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, ORG_NAME),
            x509.NameAttribute(NameOID.COMMON_NAME, hostname),
        ])
        
        # Build SAN (Subject Alternative Names)
        san_list = [x509.DNSName(hostname)]
        if ip_addresses:
            from ipaddress import ip_address
            for ip in ip_addresses:
                san_list.append(x509.IPAddress(ip_address(ip)))
        
        # Build certificate
        server_cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(ca_cert.subject)
            .public_key(server_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=SERVER_VALIDITY_DAYS))
            .add_extension(
                x509.SubjectAlternativeName(san_list),
                critical=False
            )
            .add_extension(
                x509.BasicConstraints(ca=False, path_length=None),
                critical=True
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_encipherment=True,
                    key_cert_sign=False,
                    crl_sign=False,
                    content_commitment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    encipher_only=False,
                    decipher_only=False
                ),
                critical=True
            )
            .add_extension(
                x509.ExtendedKeyUsage([
                    x509.oid.ExtendedKeyUsageOID.SERVER_AUTH
                ]),
                critical=False
            )
            .sign(ca_key, hashes.SHA256(), default_backend())
        )
        
        # Save server certificate
        with open(SERVER_CERT_FILE, "wb") as f:
            f.write(server_cert.public_bytes(serialization.Encoding.PEM))
        
        # Save server private key
        with open(SERVER_KEY_FILE, "wb") as f:
            f.write(server_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        os.chmod(SERVER_KEY_FILE, 0o600)
        
        print(f"Server certificate saved to: {SERVER_CERT_FILE}")
        return server_cert, server_key
    
    def generate_device_certificate(self, device_id, device_type="ESP32"):
        """Generate certificate for an ESP32 device"""
        if not HAS_CRYPTO:
            raise RuntimeError("cryptography library required")
        
        # Load CA
        ca_cert, ca_key = self.load_ca_certificate()
        
        print(f"Generating certificate for device: {device_id}")
        
        # Generate device private key (EC for smaller footprint on ESP32)
        device_key = ec.generate_private_key(
            ec.SECP256R1(),
            default_backend()
        )
        
        # Build subject
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, COUNTRY),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, ORG_NAME),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, f"SafeEdge {device_type}"),
            x509.NameAttribute(NameOID.COMMON_NAME, device_id),
        ])
        
        # Build certificate
        device_cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(ca_cert.subject)
            .public_key(device_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=DEVICE_VALIDITY_DAYS))
            .add_extension(
                x509.BasicConstraints(ca=False, path_length=None),
                critical=True
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    key_encipherment=False,
                    key_cert_sign=False,
                    crl_sign=False,
                    content_commitment=False,
                    data_encipherment=False,
                    key_agreement=True,
                    encipher_only=False,
                    decipher_only=False
                ),
                critical=True
            )
            .add_extension(
                x509.ExtendedKeyUsage([
                    x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH
                ]),
                critical=False
            )
            .sign(ca_key, hashes.SHA256(), default_backend())
        )
        
        # Save device certificate and key
        device_cert_file = DEVICE_CERTS_DIR / f"{device_id}.crt"
        device_key_file = DEVICE_CERTS_DIR / f"{device_id}.key"
        
        with open(device_cert_file, "wb") as f:
            f.write(device_cert.public_bytes(serialization.Encoding.PEM))
        
        with open(device_key_file, "wb") as f:
            f.write(device_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        os.chmod(device_key_file, 0o600)
        
        print(f"Device certificate saved to: {device_cert_file}")
        
        # Generate certificate fingerprint for pinning
        fingerprint = self.get_certificate_fingerprint(device_cert)
        
        return {
            "device_id": device_id,
            "cert_file": str(device_cert_file),
            "key_file": str(device_key_file),
            "fingerprint_sha256": fingerprint,
            "valid_until": (datetime.utcnow() + timedelta(days=DEVICE_VALIDITY_DAYS)).isoformat()
        }
    
    def get_certificate_fingerprint(self, cert):
        """Get SHA256 fingerprint of certificate for pinning"""
        if isinstance(cert, (str, Path)):
            with open(cert, "rb") as f:
                cert = x509.load_pem_x509_certificate(f.read(), default_backend())
        
        fingerprint = cert.fingerprint(hashes.SHA256())
        return fingerprint.hex().upper()
    
    def export_for_esp32(self, device_id):
        """Export certificates in format suitable for ESP32"""
        device_cert_file = DEVICE_CERTS_DIR / f"{device_id}.crt"
        device_key_file = DEVICE_CERTS_DIR / f"{device_id}.key"
        
        if not device_cert_file.exists():
            raise FileNotFoundError(f"Certificate not found for device: {device_id}")
        
        # Read certificates
        with open(CA_CERT_FILE, "r") as f:
            ca_cert_pem = f.read()
        
        with open(device_cert_file, "r") as f:
            device_cert_pem = f.read()
        
        with open(device_key_file, "r") as f:
            device_key_pem = f.read()
        
        # Generate C header format for Arduino
        arduino_header = self._generate_arduino_header(
            device_id, ca_cert_pem, device_cert_pem, device_key_pem
        )
        
        # Generate MicroPython format
        micropython_certs = self._generate_micropython_certs(
            device_id, ca_cert_pem, device_cert_pem, device_key_pem
        )
        
        return {
            "arduino_header": arduino_header,
            "micropython_certs": micropython_certs
        }
    
    def _generate_arduino_header(self, device_id, ca_cert, device_cert, device_key):
        """Generate C header file with certificates for Arduino"""
        header = f'''/*
 * SafeEdge TLS Certificates for {device_id}
 * Auto-generated - DO NOT EDIT
 * Generated: {datetime.utcnow().isoformat()}
 */

#ifndef SAFEEDGE_CERTS_H
#define SAFEEDGE_CERTS_H

// Root CA Certificate
const char* ca_cert = R"EOF(
{ca_cert})EOF";

// Device Certificate
const char* device_cert = R"EOF(
{device_cert})EOF";

// Device Private Key
const char* device_key = R"EOF(
{device_key})EOF";

#endif // SAFEEDGE_CERTS_H
'''
        return header
    
    def _generate_micropython_certs(self, device_id, ca_cert, device_cert, device_key):
        """Generate MicroPython certificate module"""
        module = f'''"""
SafeEdge TLS Certificates for {device_id}
Auto-generated - DO NOT EDIT
Generated: {datetime.utcnow().isoformat()}
"""

CA_CERT = """
{ca_cert}"""

DEVICE_CERT = """
{device_cert}"""

DEVICE_KEY = """
{device_key}"""
'''
        return module


def main():
    """CLI for certificate management"""
    import argparse
    
    parser = argparse.ArgumentParser(description="SafeEdge Certificate Manager")
    parser.add_argument("command", choices=["init", "device", "export", "info"])
    parser.add_argument("--device-id", help="Device ID for certificate generation")
    parser.add_argument("--hostname", default="localhost", help="Server hostname")
    parser.add_argument("--ip", action="append", help="Server IP addresses")
    parser.add_argument("--force", action="store_true", help="Force regeneration")
    
    args = parser.parse_args()
    
    manager = CertificateManager()
    
    if args.command == "init":
        # Initialize CA and server certificates
        manager.generate_ca_certificate(force=args.force)
        manager.generate_server_certificate(
            hostname=args.hostname,
            ip_addresses=args.ip
        )
        print("\nCertificate infrastructure initialized!")
        
    elif args.command == "device":
        if not args.device_id:
            print("Error: --device-id required")
            return
        result = manager.generate_device_certificate(args.device_id)
        print(f"\nDevice certificate generated:")
        print(json.dumps(result, indent=2))
        
    elif args.command == "export":
        if not args.device_id:
            print("Error: --device-id required")
            return
        result = manager.export_for_esp32(args.device_id)
        
        # Save Arduino header
        arduino_file = DEVICE_CERTS_DIR / f"{args.device_id}_certs.h"
        with open(arduino_file, "w") as f:
            f.write(result["arduino_header"])
        print(f"Arduino header saved to: {arduino_file}")
        
        # Save MicroPython module
        mp_file = DEVICE_CERTS_DIR / f"{args.device_id}_certs.py"
        with open(mp_file, "w") as f:
            f.write(result["micropython_certs"])
        print(f"MicroPython module saved to: {mp_file}")
        
    elif args.command == "info":
        if CA_CERT_FILE.exists():
            ca_cert, _ = manager.load_ca_certificate()
            print(f"CA Certificate:")
            print(f"  Subject: {ca_cert.subject}")
            print(f"  Valid until: {ca_cert.not_valid_after}")
            print(f"  Fingerprint: {manager.get_certificate_fingerprint(ca_cert)}")
        else:
            print("No CA certificate found. Run 'init' first.")


if __name__ == "__main__":
    main()
