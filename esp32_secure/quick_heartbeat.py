#!/usr/bin/env python3
"""
Quick Heartbeat Script - Sends a single heartbeat to mark device as online
Usage: python quick_heartbeat.py
"""

import requests
import time

BACKEND_URL = "http://localhost:9002"
DEVICE_ID = "esp32_safeedge_001"

def send_heartbeat():
    try:
        data = {
            "device_id": DEVICE_ID,
            "status": "online",
            "wifi_connected": True,
            "signal_strength": -66,
            "uptime": int(time.time()) % 86400
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/esp32/heartbeat",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Heartbeat sent successfully!")
            print(f"   Device '{DEVICE_ID}' should now show as Online")
            return True
        else:
            print(f"❌ Heartbeat failed: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print(f"Sending heartbeat for {DEVICE_ID}...")
    send_heartbeat()
