#!/usr/bin/env python3
"""
Multi-Device IoT Simulator for SafeEdge Platform
Laptop 2 simulates multiple IoT devices sending data to ESP32 Hardware Box
Each virtual device represents a different IoT sensor/actuator

Author: SafeEdge Team
Date: April 14, 2026
"""

import requests
import json
import time
import random
import threading
from datetime import datetime

# ESP32 Hardware Box Configuration
ESP32_URL = "http://192.168.100.10"

# Virtual IoT Devices Configuration
DEVICES = [
    {
        "device_id": "temp_sensor_living_room",
        "device_name": "Temperature Sensor - Living Room",
        "device_type": "temperature_sensor",
        "location": "Living Room",
        "sensors": ["temperature", "humidity"],
        "interval": 5  # Send data every 5 seconds
    },
    {
        "device_id": "door_lock_main_entrance",
        "device_name": "Smart Door Lock - Main Entrance",
        "device_type": "door_lock",
        "location": "Main Entrance",
        "sensors": ["lock_status", "battery_level"],
        "interval": 10
    },
    {
        "device_id": "motion_sensor_hallway",
        "device_name": "Motion Sensor - Hallway",
        "device_type": "motion_sensor",
        "location": "Hallway",
        "sensors": ["motion_detected", "light_level"],
        "interval": 3
    },
    {
        "device_id": "camera_front_door",
        "device_name": "Security Camera - Front Door",
        "device_type": "camera",
        "location": "Front Door",
        "sensors": ["status", "recording", "motion_alerts"],
        "interval": 15
    },
    {
        "device_id": "thermostat_hvac",
        "device_name": "Smart Thermostat - HVAC",
        "device_type": "thermostat",
        "location": "HVAC System",
        "sensors": ["target_temp", "current_temp", "mode"],
        "interval": 8
    }
]

def generate_sensor_data(device):
    """Generate realistic sensor data based on device type"""
    data = {
        "device_id": device["device_id"],
        "device_name": device["device_name"],
        "device_type": device["device_type"],
        "location": device["location"],
        "timestamp": datetime.now().isoformat(),
        "source": "laptop2_gateway"
    }
    
    # Generate data based on device type
    if device["device_type"] == "temperature_sensor":
        data["sensor_type"] = "temperature"
        data["temperature"] = round(20 + random.uniform(-3, 3), 1)
        data["humidity"] = round(50 + random.uniform(-10, 10), 1)
        data["value"] = data["temperature"]
        data["unit"] = "celsius"
        
    elif device["device_type"] == "door_lock":
        data["sensor_type"] = "door_lock"
        data["lock_status"] = random.choice(["locked", "locked", "locked", "unlocked"])
        data["battery_level"] = random.randint(75, 100)
        data["last_accessed"] = datetime.now().isoformat()
        data["value"] = 1 if data["lock_status"] == "locked" else 0
        data["unit"] = "status"
        
    elif device["device_type"] == "motion_sensor":
        data["sensor_type"] = "motion"
        data["motion_detected"] = random.choice([False, False, False, True])
        data["light_level"] = random.randint(0, 100)
        data["sensitivity"] = "medium"
        data["value"] = 1 if data["motion_detected"] else 0
        data["unit"] = "boolean"
        
    elif device["device_type"] == "camera":
        data["sensor_type"] = "camera"
        data["status"] = "online"
        data["recording"] = random.choice([True, False])
        data["motion_alerts"] = random.randint(0, 5)
        data["storage_used"] = random.randint(30, 80)
        data["value"] = data["motion_alerts"]
        data["unit"] = "alerts"
        
    elif device["device_type"] == "thermostat":
        data["sensor_type"] = "thermostat"
        data["target_temp"] = 22.0
        data["current_temp"] = round(22 + random.uniform(-2, 2), 1)
        data["mode"] = random.choice(["heat", "cool", "auto"])
        data["fan_speed"] = random.choice(["low", "medium", "high"])
        data["value"] = data["current_temp"]
        data["unit"] = "celsius"
    
    return data

def send_to_esp32(data):
    """Send sensor data to ESP32 Hardware Box"""
    try:
        response = requests.post(
            f"{ESP32_URL}/api/sensor-data",
            json=data,
            timeout=5
        )
        
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%H:%M:%S")
            device_short = data['device_id'].split('_')[0]
            value_str = f"{data.get('value', 'N/A')}"
            print(f"[{timestamp}] ✅ {device_short:8s} → {value_str:6s} {data.get('unit', '')}")
            return True
        else:
            print(f"❌ [{data['device_id']}] Failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ [{data['device_id']}] Connection error: {str(e)[:50]}")
        return False

def device_simulator(device):
    """Simulate a single IoT device"""
    device_short = device['device_id'].split('_')[0]
    print(f"🚀 Started: {device['device_name']}")
    
    while True:
        try:
            # Generate sensor data
            data = generate_sensor_data(device)
            
            # Send to ESP32
            send_to_esp32(data)
            
            # Wait for next interval
            time.sleep(device["interval"])
        except Exception as e:
            print(f"❌ [{device_short}] Error: {e}")
            time.sleep(5)

def test_esp32_connection():
    """Test connection to ESP32 before starting"""
    print("🔍 Testing connection to ESP32...")
    try:
        response = requests.get(f"{ESP32_URL}/api/device-status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Connected to ESP32")
            print(f"   Device ID: {status.get('device_id', 'Unknown')}")
            print(f"   Status: {status.get('status', 'Unknown')}")
            print(f"   Firebase: {'Ready' if status.get('firebase_ready') else 'Not Ready'}\n")
            return True
        else:
            print(f"⚠️  ESP32 responded with status: {response.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to ESP32: {e}")
        print("\n   Troubleshooting:")
        print("   1. Check ESP32 is powered on (Green LED should be ON)")
        print("   2. Verify Ethernet cable is connected")
        print("   3. Confirm ESP32 IP is 192.168.100.10")
        print("   4. Verify Laptop 2 IP is 192.168.100.12")
        print("   5. Try: ping 192.168.100.10\n")
        return False

def print_header():
    """Print application header"""
    print("\n" + "="*60)
    print("╔════════════════════════════════════════════════════════╗")
    print("║     Laptop 2 - Multi-Device IoT Gateway               ║")
    print("║     Simulating Multiple IoT Devices                   ║")
    print("║     SafeEdge Platform - Imagine Cup 2026              ║")
    print("╚════════════════════════════════════════════════════════╝")
    print("="*60 + "\n")

def print_device_list():
    """Print list of virtual devices"""
    print("📱 Virtual IoT Devices:")
    print("-" * 60)
    for i, device in enumerate(DEVICES, 1):
        print(f"   {i}. {device['device_name']}")
        print(f"      Type: {device['device_type']}")
        print(f"      Location: {device['location']}")
        print(f"      Update Interval: {device['interval']}s")
        print()

def main():
    """Main application entry point"""
    print_header()
    
    print(f"📡 ESP32 Hardware Box: {ESP32_URL}")
    print(f"📱 Total Virtual Devices: {len(DEVICES)}\n")
    
    # Test connection
    if not test_esp32_connection():
        print("⚠️  Cannot proceed without ESP32 connection.")
        print("   Fix the connection and try again.\n")
        return
    
    # Show device list
    print_device_list()
    
    print("="*60)
    print("Starting all virtual IoT devices...")
    print("="*60 + "\n")
    
    # Start each device in a separate thread
    threads = []
    for device in DEVICES:
        thread = threading.Thread(
            target=device_simulator, 
            args=(device,), 
            daemon=True,
            name=device['device_id']
        )
        thread.start()
        threads.append(thread)
        time.sleep(0.5)  # Stagger startup
    
    print("\n" + "="*60)
    print("✅ All devices running!")
    print("="*60)
    print("\nData Stream (device → value unit):")
    print("-" * 60)
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("👋 Stopping all devices...")
        print("="*60)
        print("\nGoodbye!\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}\n")

