#!/usr/bin/env python3
"""
Auto ESP32 Heartbeat Service
============================
Automatically detects connected ESP32 and sends heartbeats to keep it online.
Runs as a background service when the project starts.

Usage:
    python scripts/auto_esp32_heartbeat.py
"""

import os
import sys
import time
import glob
import requests
import threading
import signal

# Configuration
BACKEND_URL = "http://localhost:9002"
DEVICE_ID = "esp32_safeedge_001"
HEARTBEAT_INTERVAL = 10  # seconds
ESP32_PORTS = [
    "/dev/cu.usbserial-*",      # macOS
    "/dev/ttyUSB*",              # Linux
    "/dev/ttyACM*",              # Linux (some boards)
    "COM*"                       # Windows
]

running = True

def signal_handler(sig, frame):
    global running
    print("\n👋 Stopping heartbeat service...")
    running = False
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def find_esp32_port():
    """Find connected ESP32 serial port"""
    for pattern in ESP32_PORTS:
        ports = glob.glob(pattern)
        if ports:
            return ports[0]
    return None

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=3)
        return response.status_code == 200
    except:
        return False

def register_device(wifi_info=None):
    """Register device with backend"""
    try:
        data = {
            "device_id": DEVICE_ID,
            "device_type": "ESP32_SafeEdge",
            "firmware_version": "2.0.0",
            "wifi_connected": True,
            "ip_address": wifi_info.get('ip', '192.168.1.100') if wifi_info else '192.168.1.100',
            "signal_strength": wifi_info.get('rssi', -66) if wifi_info else -66,
            "mac_address": wifi_info.get('mac', 'AA:BB:CC:DD:EE:FF') if wifi_info else 'AA:BB:CC:DD:EE:FF',
            "capabilities": ["temperature", "humidity", "motion", "buzzer", "leds"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/esp32/register",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"   Registration error: {e}")
        return False

def send_heartbeat():
    """Send heartbeat to backend"""
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
        return response.status_code == 200
    except:
        return False

def get_esp32_wifi_info(port):
    """Try to get WiFi info from ESP32 via serial"""
    try:
        import serial
        ser = serial.Serial(port, 115200, timeout=2)
        time.sleep(0.5)
        
        # Interrupt any running code
        ser.write(b'\x03')
        time.sleep(0.3)
        ser.reset_input_buffer()
        
        # Get WiFi info
        ser.write(b'import network; wlan = network.WLAN(network.STA_IF); print("RSSI=" + str(wlan.status("rssi")) if wlan.isconnected() else "RSSI=-99")\r\n')
        time.sleep(0.5)
        response = ser.read(500).decode('utf-8', errors='ignore')
        ser.close()
        
        rssi = -66
        for line in response.split('\n'):
            if 'RSSI=' in line:
                try:
                    rssi = int(line.split('=')[1].strip())
                except:
                    pass
        
        return {'connected': True, 'rssi': rssi}
    except Exception as e:
        return {'connected': False, 'rssi': -66}

def main():
    global running
    
    print("=" * 50)
    print("🔌 SafeEdge Auto ESP32 Heartbeat Service")
    print("=" * 50)
    
    # Wait for backend to be ready
    print("\n⏳ Waiting for backend to be ready...")
    backend_ready = False
    for i in range(30):  # Wait up to 30 seconds
        if check_backend():
            backend_ready = True
            break
        time.sleep(1)
    
    if not backend_ready:
        print("⚠️  Backend not responding, starting anyway...")
    else:
        print("✅ Backend is ready!")
    
    # Check for ESP32
    esp32_port = find_esp32_port()
    if esp32_port:
        print(f"✅ ESP32 detected on {esp32_port}")
        wifi_info = get_esp32_wifi_info(esp32_port)
    else:
        print("⚠️  No ESP32 detected, running in simulation mode")
        wifi_info = None
    
    # Register device
    print(f"\n📝 Registering device '{DEVICE_ID}'...")
    if register_device(wifi_info):
        print("✅ Device registered successfully!")
    else:
        print("⚠️  Registration failed, will retry with heartbeats")
    
    # Start heartbeat loop
    print(f"\n💓 Starting heartbeat loop (every {HEARTBEAT_INTERVAL}s)")
    print("   Press Ctrl+C to stop\n")
    
    heartbeat_count = 0
    while running:
        success = send_heartbeat()
        heartbeat_count += 1
        
        if success:
            print(f"   ✅ Heartbeat #{heartbeat_count} sent at {time.strftime('%H:%M:%S')}")
        else:
            print(f"   ❌ Heartbeat #{heartbeat_count} failed at {time.strftime('%H:%M:%S')}")
        
        # Check if ESP32 is still connected every 10 heartbeats
        if heartbeat_count % 10 == 0:
            new_port = find_esp32_port()
            if new_port != esp32_port:
                if new_port:
                    print(f"   🔌 ESP32 reconnected on {new_port}")
                    esp32_port = new_port
                else:
                    print("   ⚠️  ESP32 disconnected, continuing in simulation mode")
                    esp32_port = None
        
        time.sleep(HEARTBEAT_INTERVAL)
    
    print("\n👋 Heartbeat service stopped")

if __name__ == "__main__":
    main()
