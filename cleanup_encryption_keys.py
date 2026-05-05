#!/usr/bin/env python3
"""
Firebase Encryption Keys Cleanup
=================================
Keeps only encryption key for: iot_temperature_sensor_20260414185938_62fd12aa
Deletes all other device encryption keys from /encryption_keys

Author: SafeEdge Team
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

def cleanup_encryption_keys():
    """Keep only TEMP device encryption key, delete all others"""
    
    print("=" * 70)
    print("🧹 Firebase Encryption Keys Cleanup - Keep Only TEMP Device")
    print("=" * 70)
    
    # Get all encryption keys
    keys_ref = db.reference('/encryption_keys')
    all_keys = keys_ref.get()
    
    if not all_keys:
        print("❌ No encryption keys found in /encryption_keys")
        return
    
    device_ids = list(all_keys.keys())
    
    print(f"\n📊 Found {len(device_ids)} encryption keys\n")
    
    # Find keys to keep and delete
    keep_key = None
    delete_keys = []
    
    for device_id in device_ids:
        key_data = all_keys.get(device_id, {})
        created_at = key_data.get('created_at') or key_data.get('createdAt', 'Unknown')
        key_type = key_data.get('key_type') or key_data.get('keyType', 'Unknown')
        
        if device_id == KEEP_DEVICE_ID:
            keep_key = {
                'device_id': device_id,
                'created_at': created_at,
                'key_type': key_type
            }
            print(f"✅ KEEP: {device_id}")
            print(f"   Created: {created_at}")
            print(f"   Type: {key_type}\n")
        else:
            delete_keys.append({
                'device_id': device_id,
                'created_at': created_at,
                'key_type': key_type
            })
    
    if not keep_key:
        print(f"⚠️  WARNING: Encryption key for {KEEP_DEVICE_ID} not found!")
        print("   This device may not have an encryption key yet.\n")
    
    print("=" * 70)
    print(f"📊 Summary:")
    print(f"   ✅ Keep: {1 if keep_key else 0} encryption key")
    print(f"   ❌ Delete: {len(delete_keys)} encryption keys")
    print("=" * 70)
    
    if delete_keys:
        print("\n🗑️  Encryption Keys to DELETE:")
        for key in delete_keys:
            print(f"   ❌ {key['device_id']}")
            print(f"      Created: {key['created_at']}")
    
        # Confirm deletion
        print("\n" + "=" * 70)
        print(f"⚠️  WARNING: This will permanently delete {len(delete_keys)} encryption keys!")
        print("=" * 70)
        confirm = input("\nType 'DELETE' to confirm deletion: ").strip()
        
        if confirm != 'DELETE':
            print("❌ Cleanup cancelled")
            return
        
        # Delete encryption keys
        print("\n🗑️  Deleting encryption keys...")
        deleted_count = 0
        
        for key in delete_keys:
            try:
                key_ref = db.reference(f'/encryption_keys/{key["device_id"]}')
                key_ref.delete()
                print(f"   ✅ Deleted: {key['device_id']}")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Failed to delete {key['device_id']}: {e}")
        
        print("\n" + "=" * 70)
        print(f"✅ Cleanup Complete!")
        print(f"   Deleted: {deleted_count} encryption keys")
        print(f"   Kept: {1 if keep_key else 0} encryption key")
        print("=" * 70)
        
        # Verify
        print("\n🔍 Verifying...")
        keys_ref = db.reference('/encryption_keys')
        remaining = keys_ref.get()
        
        if remaining:
            print(f"✅ Remaining encryption keys: {len(remaining)}")
            for device_id in remaining.keys():
                print(f"   • {device_id}")
        else:
            print("⚠️  No encryption keys remaining!")
    else:
        print("\n✅ No encryption keys to delete!")

if __name__ == "__main__":
    try:
        cleanup_encryption_keys()
    except KeyboardInterrupt:
        print("\n\n❌ Cleanup cancelled by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()
