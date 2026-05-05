#!/usr/bin/env python3
"""
Laptop 2 - Single Device Simulator
Sends data to ONE provisioned ESP32 device

IMPORTANT: Update DEVICE_ID after provisioning ESP32!

Author: SafeEdge Team - Imagine Cup 2026
Date: April 14, 2026
"""

import requests
import json
import time
import random
from datetime import datetime
import sys

# ESP32 Device Configuration
# IMPORTANT: Update this with the actual device_id from dashboard after provisioning
DEVICE_ID = "PASTE_DEVICE_ID_HERE"  # ← UPDATE THIS after ESP32 provisioning

# Device Details (should match what you entered in dashboard)
DEVICE_CONFIG = {
    "device_id": DEVICE_ID,
    "device_name": "Temperature Sensor - Living Room",
    "device_type": "temperature_sensor",
    "location": "Living Room"
}

# Network Configuration
# Since ESP32 is provisioned, it will be on your WiFi network
# You can send data directly to it or via Firebase
FIREBASE_URL = "https://lumeshield-x-default-rtdb.firebaseio.com"

def generate_sensor_data():
    """Generate realistic sensor data"""
    return {
        "device_id": DEVICE_ID,
        "device_name": DEVICE_CONFIG["device_name"],
        "device_type": DEVICE_CONFIG["device_type"],
        "location": DEVICE_CONFIG["location"],
        "timestamp": datetime.now().isoformat(),
        "data": {
            "temperature": round(20 + random.uniform(-5, 10), 2),
            "humidity": round(45 + random.uniform(-15, 25), 2),
            "battery": round(85 + random.uniform(-10, 15), 1),
            "signal_strength": random.randint(-80, -30)
        },
        "status": "online",
        "uptime": int(time.time())
    }

def send_to_firebase_directly():
    """Send data directly to Firebase (simulating ESP32 behavior)"""
    try:
        sensor_data = generate_sensor_data()
        
        # Send to Firebase Realtime Database
        firebase_path = f"{FIREBASE_URL}/devices/{DEVICE_ID}/sensor_history/{int(time.time())}.json"
        
        response = requests.put(firebase_path, json=sensor_data, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ Data sent to Firebase: T={sensor_data['data']['temperature']}°C, H={sensor_data['data']['humidity']}%")
            return True
        else:
            print(f"❌ Firebase error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error sending to Firebase: {e}")
        return False

def update_device_status():
    """Update device status in Firebase"""
    try:
        status_data = {
            "status": "online",
            "last_seen": datetime.now().isoformat(),
            "device_name": DEVICE_CONFIG["device_name"],
            "device_type": DEVICE_CONFIG["device_type"],
            "location": DEVICE_CONFIG["location"]
        }
        
        status_path = f"{FIREBASE_URL}/devices/{DEVICE_ID}/info.json"
        response = requests.put(status_path, json=status_data, timeout=10)
        
        if response.status_code == 200:
            print(f"📊 Device status updated: {DEVICE_CONFIG['device_name']}")
            return True
        else:
            print(f"⚠️  Status update failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Status update error: {e}")
        return False

def main():
    print("🚀 Laptop 2 - Single Device Simulator")
    print("=" * 60)
    print(f"Device ID: {DEVICE_ID}")
    print(f"Device Name: {DEVICE_CONFIG['device_name']}")
    print(f"Device Type: {DEVICE_CONFIG['device_type']}")
    print(f"Location: {DEVICE_CONFIG['location']}")
    print("=" * 60)
    
    # Check if device ID is updated
    if DEVICE_ID == "PASTE_DEVICE_ID_HERE":
        print("❌ ERROR: Please update DEVICE_ID with actual device ID from dashboard!")
        print("\nSteps:")
        print("1. Add device in dashboard")
        print("2. Copy the device_id")
        print("3. Update DEVICE_ID in this file")
        print("4. Run again")
        sys.exit(1)
    
    print(f"\n📡 Starting data transmission to Firebase...")
    print(f"   Target: {FIREBASE_URL}")
    print(f"   Device: {DEVICE_ID}")
    print("\n🔄 Sending data every 5 seconds (Ctrl+C to stop)...\n")
    
    # Update device status first
    update_device_status()
    
    try:
        while True:
            # Send sensor data
            success = send_to_firebase_directly()
            
            if success:
                # Update status every 10 sends
                if int(time.time()) % 50 == 0:
                    update_device_status()
            
            time.sleep(5)  # Send every 5 seconds
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping simulator...")
        
        # Set device offline
        try:
            offline_status = {
                "status": "offline",
                "last_seen": datetime.now().isoformat()
            }
            status_path = f"{FIREBASE_URL}/devices/{DEVICE_ID}/info.json"
            requests.patch(status_path, json=offline_status, timeout=5)
            print("📴 Device marked as offline")
        except:
            pass
        
        print("✅ Simulator stopped")

if __name__ == "__main__":
    main()