#!/usr/bin/env python3
"""
Firebase Certificates Cleanup
==============================
Keeps only certificate for: iot_temperature_sensor_20260414185938_62fd12aa
Deletes all other device certificates from /certificates/issued

Author: SafeEdge Team - Imagine Cup 2026
"""

import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase (reuse existing app if already initialized)
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("lumeshield-x-firebase-adminsdk-fbsvc-e88056ba46.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

# Device to KEEP
KEEP_DEVICE_ID = "iot_temperature_sensor_20260414185938_62fd12aa"

def cleanup_certificates():
    """Keep only TEMP device certificate, delete all others"""
    
    print("=" * 70)
    print("🧹 Firebase Certificates Cleanup - Keep Only TEMP Device")
    print("=" * 70)
    
    # Get all issued certificates
    certs_ref = db.reference('/certificates/issued')
    all_certs = certs_ref.get()
    
    if not all_certs:
        print("❌ No certificates found in /certificates/issued")
        return
    
    cert_serials = list(all_certs.keys())
    
    print(f"\n📊 Found {len(cert_serials)} certificates\n")
    
    # Find certificates to keep and delete
    keep_cert = None
    delete_certs = []
    
    for serial in cert_serials:
        cert_data = all_certs.get(serial, {})
        device_id = cert_data.get('device_id') or cert_data.get('deviceId')
        device_name = cert_data.get('device_name') or cert_data.get('deviceName', 'Unknown')
        issued_at = cert_data.get('issued_at') or cert_data.get('issuedAt', 'Unknown')
        
        if device_id == KEEP_DEVICE_ID:
            keep_cert = {
                'serial': serial,
                'device_id': device_id,
                'device_name': device_name,
                'issued_at': issued_at
            }
            print(f"✅ KEEP: {device_name}")
            print(f"   Device ID: {device_id}")
            print(f"   Serial: {serial}")
            print(f"   Issued: {issued_at}\n")
        else:
            delete_certs.append({
                'serial': serial,
                'device_id': device_id or 'Unknown',
                'device_name': device_name,
                'issued_at': issued_at
            })
    
    if not keep_cert:
        print(f"⚠️  WARNING: Certificate for {KEEP_DEVICE_ID} not found!")
        print("   This device may not have a certificate yet.\n")
    
    print("=" * 70)
    print(f"📊 Summary:")
    print(f"   ✅ Keep: {1 if keep_cert else 0} certificate")
    print(f"   ❌ Delete: {len(delete_certs)} certificates")
    print("=" * 70)
    
    if delete_certs:
        print("\n🗑️  Certificates to DELETE:")
        for cert in delete_certs:
            print(f"   ❌ {cert['device_name']}")
            print(f"      Device ID: {cert['device_id']}")
            print(f"      Serial: {cert['serial'][:20]}...")
    
        # Confirm deletion
        print("\n" + "=" * 70)
        print(f"⚠️  WARNING: This will permanently delete {len(delete_certs)} certificates!")
        print("=" * 70)
        confirm = input("\nType 'DELETE' to confirm deletion: ").strip()
        
        if confirm != 'DELETE':
            print("❌ Cleanup cancelled")
            return
        
        # Delete certificates
        print("\n🗑️  Deleting certificates...")
        deleted_count = 0
        
        for cert in delete_certs:
            try:
                cert_ref = db.reference(f'/certificates/issued/{cert["serial"]}')
                cert_ref.delete()
                print(f"   ✅ Deleted: {cert['device_name']} (Serial: {cert['serial'][:20]}...)")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Failed to delete {cert['device_name']}: {e}")
        
        print("\n" + "=" * 70)
        print(f"✅ Cleanup Complete!")
        print(f"   Deleted: {deleted_count} certificates")
        print(f"   Kept: {1 if keep_cert else 0} certificate")
        print("=" * 70)
        
        # Verify
        print("\n🔍 Verifying...")
        certs_ref = db.reference('/certificates/issued')
        remaining = certs_ref.get()
        
        if remaining:
            print(f"✅ Remaining certificates: {len(remaining)}")
            for serial, cert_data in remaining.items():
                device_id = cert_data.get('device_id') or cert_data.get('deviceId', 'Unknown')
                print(f"   • {device_id} (Serial: {serial[:20]}...)")
        else:
            print("⚠️  No certificates remaining!")
    else:
        print("\n✅ No certificates to delete!")

if __name__ == "__main__":
    try:
        cleanup_certificates()
    except KeyboardInterrupt:
        print("\n\n❌ Cleanup cancelled by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()
