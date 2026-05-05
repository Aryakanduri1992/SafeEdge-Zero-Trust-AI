#!/usr/bin/env python3
"""
Firebase Device Cleanup Script
==============================
Keeps only devices registered under RV University organization.
Deletes all other devices from Firebase Realtime Database.

Author: SafeEdge Team
"""

import firebase_admin
from firebase_admin import credentials, db
import json

# Initialize Firebase
cred = credentials.Certificate("lumeshield-x-firebase-adminsdk-fbsvc-e88056ba46.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

def get_rv_university_org_id():
    """Get RV University organization ID from Firestore"""
    # Based on the screenshot, the org ID is visible in device info
    # We'll scan devices to find the RV University org ID
    return None

def cleanup_devices():
    """Keep only RV University devices, delete others"""
    
    print("=" * 70)
    print("🧹 Firebase Device Cleanup - Keep RV University Only")
    print("=" * 70)
    
    # Get all devices from Realtime Database under /devices node
    devices_ref = db.reference('/devices')
    all_devices = devices_ref.get()
    
    if not all_devices:
        print("❌ No devices found in Firebase /devices node")
        return
    
    # Get all device IDs
    device_ids = list(all_devices.keys())
    
    print(f"\n📊 Found {len(device_ids)} devices in Firebase Realtime Database\n")
    
    # Analyze each device
    rv_university_devices = []
    other_devices = []
    
    for device_id in device_ids:
        device_data = all_devices.get(device_id, {})
        info = device_data.get('info', {})
        
        org_id = info.get('organization_id') or info.get('organizationId') or info.get('organisation_id')
        device_name = info.get('device_name') or info.get('deviceName', device_id)
        device_type = info.get('device_type') or info.get('deviceType', 'unknown')
        dept_id = info.get('department_id') or info.get('departmentId')
        
        print(f"📱 {device_name} ({device_type})")
        print(f"   ID: {device_id}")
        print(f"   Org ID: {org_id}")
        print(f"   Dept ID: {dept_id}")
        
        # Check if it's RV University (you need to provide the correct org ID)
        # For now, we'll ask the user
        if org_id:
            rv_university_devices.append({
                'id': device_id,
                'name': device_name,
                'type': device_type,
                'org_id': org_id,
                'dept_id': dept_id
            })
        else:
            other_devices.append({
                'id': device_id,
                'name': device_name,
                'type': device_type,
                'org_id': 'None',
                'dept_id': dept_id
            })
        print()
    
    print("=" * 70)
    print(f"✅ Devices with organization: {len(rv_university_devices)}")
    print(f"❌ Devices without organization: {len(other_devices)}")
    print("=" * 70)
    
    # Show RV University org IDs
    org_ids = set(d['org_id'] for d in rv_university_devices)
    print(f"\n🏢 Found {len(org_ids)} unique organization(s):")
    for org_id in org_ids:
        count = sum(1 for d in rv_university_devices if d['org_id'] == org_id)
        print(f"   • {org_id}: {count} devices")
    
    print("\n" + "=" * 70)
    print("⚠️  PLEASE PROVIDE RV UNIVERSITY ORGANIZATION ID")
    print("=" * 70)
    print("\nOptions:")
    for i, org_id in enumerate(org_ids, 1):
        print(f"{i}. {org_id}")
    
    choice = input("\nEnter the number for RV University org (or 'q' to quit): ").strip()
    
    if choice.lower() == 'q':
        print("❌ Cleanup cancelled")
        return
    
    try:
        choice_idx = int(choice) - 1
        rv_org_id = list(org_ids)[choice_idx]
    except (ValueError, IndexError):
        print("❌ Invalid choice")
        return
    
    print(f"\n✅ Selected RV University Org ID: {rv_org_id}")
    
    # Filter devices
    keep_devices = [d for d in rv_university_devices if d['org_id'] == rv_org_id]
    delete_devices = [d for d in rv_university_devices if d['org_id'] != rv_org_id] + other_devices
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Keep: {len(keep_devices)} devices (RV University)")
    print(f"   ❌ Delete: {len(delete_devices)} devices (other organizations)")
    
    print("\n🔍 Devices to KEEP:")
    for device in keep_devices:
        print(f"   ✅ {device['name']} ({device['type']})")
    
    print("\n🗑️  Devices to DELETE:")
    for device in delete_devices:
        print(f"   ❌ {device['name']} ({device['type']}) - Org: {device['org_id']}")
    
    # Confirm deletion
    print("\n" + "=" * 70)
    confirm = input("⚠️  Type 'DELETE' to confirm deletion: ").strip()
    
    if confirm != 'DELETE':
        print("❌ Cleanup cancelled")
        return
    
    # Delete devices
    print("\n🗑️  Deleting devices...")
    deleted_count = 0
    
    for device in delete_devices:
        try:
            device_ref = db.reference(f'/devices/{device["id"]}')
            device_ref.delete()
            print(f"   ✅ Deleted: {device['name']}")
            deleted_count += 1
        except Exception as e:
            print(f"   ❌ Failed to delete {device['name']}: {e}")
    
    print("\n" + "=" * 70)
    print(f"✅ Cleanup Complete!")
    print(f"   Deleted: {deleted_count} devices")
    print(f"   Kept: {len(keep_devices)} devices (RV University)")
    print("=" * 70)

if __name__ == "__main__":
    try:
        cleanup_devices()
    except KeyboardInterrupt:
        print("\n\n❌ Cleanup cancelled by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()
