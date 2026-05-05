#!/usr/bin/env python3
"""
SafeEdge TLS Certificate Setup Script
=====================================
Automated setup for TLS certificates and ESP32 device provisioning.

Usage:
    python setup_tls_certificates.py

This script will:
1. Generate Root CA certificate
2. Generate server certificate
3. Generate device certificates for ESP32
4. Export certificates in ESP32-compatible formats
5. Display setup instructions

Author: SafeEdge Team - Imagine Cup 2026
"""

import os
import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from tls_certificate_manager import CertificateManager, CERT_DIR, DEVICE_CERTS_DIR


def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("  SafeEdge TLS Certificate Setup")
    print("  Imagine Cup 2026 - Secure IoT Communication")
    print("=" * 60)
    print()


def setup_certificates():
    """Main setup function"""
    print_banner()
    
    # Check for cryptography library
    try:
        from cryptography import x509
        print("✓ cryptography library found")
    except ImportError:
        print("✗ cryptography library not found")
        print("\nInstall it with: pip install cryptography")
        return False
    
    manager = CertificateManager()
    
    # Step 1: Generate CA certificate
    print("\n[Step 1/5] Generating Root CA Certificate...")
    print("-" * 40)
    
    try:
        manager.generate_ca_certificate(force=False)
        print("✓ CA certificate ready")
    except Exception as e:
        print(f"✗ CA generation failed: {e}")
        return False
    
    # Step 2: Generate server certificate
    print("\n[Step 2/5] Generating Server Certificate...")
    print("-" * 40)
    
    # Get local IP addresses
    import socket
    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except:
        local_ip = "127.0.0.1"
    
    ip_addresses = ["127.0.0.1", local_ip]
    
    # Try to get all local IPs
    try:
        import subprocess
        result = subprocess.run(
            ["hostname", "-I"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            ips = result.stdout.strip().split()
            ip_addresses.extend(ips)
    except:
        pass
    
    # Remove duplicates
    ip_addresses = list(set(ip_addresses))
    
    print(f"Server hostname: {hostname}")
    print(f"IP addresses: {', '.join(ip_addresses)}")
    
    try:
        manager.generate_server_certificate(
            hostname=hostname,
            ip_addresses=ip_addresses
        )
        print("✓ Server certificate ready")
    except Exception as e:
        print(f"✗ Server certificate generation failed: {e}")
        return False
    
    # Step 3: Generate device certificates
    print("\n[Step 3/5] Generating Device Certificates...")
    print("-" * 40)
    
    devices = [
        "esp32_safeedge_001",
        "esp32_safeedge_002",
        "esp32_safeedge_003"
    ]
    
    device_info = []
    
    for device_id in devices:
        try:
            info = manager.generate_device_certificate(device_id)
            device_info.append(info)
            print(f"✓ Certificate generated for: {device_id}")
        except Exception as e:
            print(f"✗ Failed for {device_id}: {e}")
    
    # Step 4: Export for ESP32
    print("\n[Step 4/5] Exporting Certificates for ESP32...")
    print("-" * 40)
    
    for device_id in devices:
        try:
            result = manager.export_for_esp32(device_id)
            
            # Save Arduino header
            arduino_file = DEVICE_CERTS_DIR / f"{device_id}_certs.h"
            with open(arduino_file, "w") as f:
                f.write(result["arduino_header"])
            
            # Save MicroPython module
            mp_file = DEVICE_CERTS_DIR / f"{device_id}_certs.py"
            with open(mp_file, "w") as f:
                f.write(result["micropython_certs"])
            
            print(f"✓ Exported: {device_id}")
            print(f"  - Arduino: {arduino_file.name}")
            print(f"  - MicroPython: {mp_file.name}")
            
        except Exception as e:
            print(f"✗ Export failed for {device_id}: {e}")
    
    # Step 5: Display summary and instructions
    print("\n[Step 5/5] Setup Complete!")
    print("-" * 40)
    
    # Get CA fingerprint
    ca_cert, _ = manager.load_ca_certificate()
    ca_fingerprint = manager.get_certificate_fingerprint(ca_cert)
    
    print(f"\nCertificate Directory: {CERT_DIR}")
    print(f"Device Certificates: {DEVICE_CERTS_DIR}")
    print(f"\nCA Certificate Fingerprint (SHA256):")
    print(f"  {ca_fingerprint}")
    
    # Save device info
    info_file = CERT_DIR / "device_info.json"
    with open(info_file, "w") as f:
        json.dump(device_info, f, indent=2)
    print(f"\nDevice info saved to: {info_file}")
    
    # Print instructions
    print("\n" + "=" * 60)
    print("  NEXT STEPS")
    print("=" * 60)
    print("""
1. For Arduino/ESP-IDF:
   - Copy the generated .h file to your project
   - Include it in your firmware: #include "esp32_safeedge_001_certs.h"
   - The certificates are available as: ca_cert, device_cert, device_key

2. For MicroPython:
   - Upload the generated .py file to your ESP32
   - Import in your code: from esp32_safeedge_001_certs import *
   - Use CA_CERT, DEVICE_CERT, DEVICE_KEY

3. Start the secure handshake server:
   python secure_handshake.py server --port 8443

4. Update your ESP32 firmware:
   - Set BACKEND_HOST to your server IP
   - Set BACKEND_PORT to 8443
   - Update SERVER_CERT_FINGERPRINT with the CA fingerprint above

5. Flash and run your ESP32!
""")
    
    return True


def main():
    """Entry point"""
    success = setup_certificates()
    
    if success:
        print("\n✓ TLS setup completed successfully!")
        return 0
    else:
        print("\n✗ TLS setup failed. Check errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
