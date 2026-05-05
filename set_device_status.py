#!/usr/bin/env python3
"""
Device Status Manager - SafeEdge IoT System
Set device status to online/offline for demonstration purposes
"""

import requests
import json
from datetime import datetime
import sys

# Configuration
DEVICE_ID = "iot_temperature_sensor_20260414185938_62fd12aa"
FIREBASE_URL = "https://lumeshield-x-default-rtdb.asia-southeast1.firebasedatabase.app"

def set_device_status(status):
    """Set device status in Firebase Realtime Database"""
    
    if status not in ['online', 'offline']:
        print("❌ Error: Status must be 'online' or 'offline'")
        return False
    
    url = f"{FIREBASE_URL}/devices/{DEVICE_ID}/info.json"
    
    # Prepare data
    data = {
        "status": status,
        "last_seen": datetime.now().isoformat()
    }
    
    if status == "offline":
        # Set last_seen to 1 hour ago for offline
        from datetime import timedelta
        offline_time = datetime.now() - timedelta(hours=1)
        data["last_seen"] = offline_time.isoformat()
    
    try:
        print(f"🔄 Setting device status to: {status}")
        response = requests.patch(url, json=data)
        
        if response.status_code == 200:
            print(f"✅ Device status updated successfully!")
            print(f"   Status: {status}")
            print(f"   Last Seen: {data['last_seen']}")
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating status: {e}")
        return False

def get_device_status():
    """Get current device status"""
    url = f"{FIREBASE_URL}/devices/{DEVICE_ID}/info.json"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Current Device Status:")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Last Seen: {data.get('last_seen', 'unknown')}")
            print(f"   Device Name: {data.get('device_name', 'unknown')}")
            return data
        else:
            print(f"❌ Error fetching status: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("=" * 50)
    print("🚀 SafeEdge Device Status Manager")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 set_device_status.py online   # Set device online")
        print("  python3 set_device_status.py offline  # Set device offline")
        print("  python3 set_device_status.py status   # Check current status")
        print()
        get_device_status()
        return
    
    command = sys.argv[1].lower()
    
    if command == "status":
        get_device_status()
    elif command in ["online", "offline"]:
        if set_device_status(command):
            print()
            print("🔄 Verifying change...")
            get_device_status()
    else:
        print(f"❌ Unknown command: {command}")
        print("   Use 'online', 'offline', or 'status'")

if __name__ == "__main__":
    main()