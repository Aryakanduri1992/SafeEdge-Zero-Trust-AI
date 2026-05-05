#!/usr/bin/env python3
"""
Laptop 2 - Virtual IoT Devices Simulator (FINAL VERSION)
Sends data to Hardware Gateway (ESP32) via Ethernet
Gateway forwards to Firebase via WiFi

Network Setup:
- Laptop 2: 192.168.100.12 (Ethernet)
- Hardware Gateway: 192.168.100.10 (Ethernet)
- Data sent via HTTP POST over Ethernet cable

Author: SafeEdge Team - Imagine Cup 2026
Date: April 14, 2026
"""

import requests
import json
import time
import random
import threading
from datetime import datetime
import sys

# Hardware Gateway Configuration
GATEWAY_IP = "192.168.100.10"
GATEWAY_URL = f"http://{GATEWAY_IP}"

# Virtual IoT Devices
# IMPORTANT: Use actual device IDs from dashboard registration
DEVICES = [
    {
        "device_id": "temp_sensor_living_room_001",
        "device_name": "Temperature Sensor - Living Room",
        "device_type": "temperature_sensor",
        "location": "Living Room",
        "interval": 5
    },
    {
        "device_id": "door_lock_main_entrance_001",
        "device_name": "Smart Door Lock - Main Entrance",
        "device_type": "door_lock",
        "location": "Main Entrance",
        "interval": 10
    },
    {
        "device_id": "motion_sensor_hallway_001",
        "device_name": "Motion Sensor - Hallway",
        "device_type": "motion_sensor",
        "location": "Hallway",
        "interval": 3
    },
    {
        "device_id": "camera_front_door_001",
        "device_name": "Security Camera - Front Door",
        "device_type": "camera",
        "location": "Front Door",
        "interval": 15
    },
    {
        "device_id": "thermostat_hvac_001",
        "device_name": "Smart Thermostat - HVAC",
        "device_type": "thermostat",
        "location": "HVAC System",
        "interval": 8
    }
]

def generate_sensor_data(device):
    """Generate realistic sensor data"""
    data = {
        "device_id": device["device_id"],
        "device_name": device["device_name"],
        "device_type": device["device_type"],
        "location": device["location"],
        "timestamp": datetime.now().isoformat(),
        "source": "laptop2_ethernet"
    }
    
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
        data["value"] = 1 if data["lock_status"] == "locked" else 0
        data["unit"] = "status"
        
    elif device["device_type"] == "motion_sensor":
        data["sensor_type"] = "motion"
        data["motion_detected"] = random.choice([False, False, False, True])
        data["light_level"] = random.randint(0, 100)
        data["value"] = 1 if data["motion_detected"] else 0
        data["unit"] = "boolean"
        
    elif device["device_type"] == "camera":
        data["sensor_type"] = "camera"
        data["status"] = "online"
        data["recording"] = random.choice([True, False])
        data["motion_alerts"] = random.randint(0, 5)
        data["value"] = data["motion_alerts"]
        data["unit"] = "alerts"
        
    elif device["device_type"] == "thermostat":
        data["sensor_type"] = "thermostat"
        data["target_temp"] = 22.0
        data["current_temp"] = round(22 + random.uniform(-2, 2), 1)
        data["mode"] = random.choice(["heat", "cool", "auto"])
        data["value"] = data["current_temp"]
        data["unit"] = "celsius"
    
    return data

def send_to_gateway(data):
    """Send data to Hardware Gateway via Ethernet"""
    try:
        response = requests.post(
            f"{GATEWAY_URL}/api/sensor-data",
            json=data,
            timeout=5
        )
        
        if response.status_code == 200:
            timestamp = datetime.now().strftime("%H:%M:%S")
            device_short = data['device_id'][:25]
            value_str = f"{data.get('value', 'N/A')}"
            print(f"[{timestamp}] ✅ {device_short:25s} → {value_str:6s} {data.get('unit', '')}")
            return True
        else:
            print(f"❌ [{data['device_id']}] HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ [{data['device_id']}] Cannot reach gateway at {GATEWAY_IP}")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ [{data['device_id']}] Timeout")
        return False
    except Exception as e:
        print(f"❌ [{data['device_id']}] Error: {str(e)[:50]}")
        return False

def device_simulator(device):
    """Simulate a single IoT device"""
    print(f"🚀 Started: {device['device_name']}")
    
    while True:
        try:
            data = generate_sensor_data(device)
            send_to_gateway(data)
            time.sleep(device["interval"])
        except Exception as e:
            print(f"❌ [{device['device_id']}] Thread error: {e}")
            time.sleep(5)

def test_gateway_connection():
    """Test connection to Hardware Gateway"""
    print("🔍 Testing connection to Hardware Gateway...")
    print(f"   Gateway IP: {GATEWAY_IP}")
    print(f"   Gateway URL: {GATEWAY_URL}\n")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/api/device-status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            print("✅ Connected to Hardware Gateway\n")
            print("   Gateway Status:")
            print(f"   • WiFi Connected: {status.get('wifi_connected', False)}")
            print(f"   • WiFi IP: {status.get('wifi_ip', 'N/A')}")
            print(f"   • Ethernet Connected: {status.get('ethernet_connected', False)}")
            print(f"   • Ethernet IP: {status.get('ethernet_ip', 'N/A')}")
            print(f"   • Firebase Ready: {status.get('firebase_ready', False)}")
            print(f"   • Uptime: {status.get('uptime', 0) / 1000:.1f}s")
            print(f"   • Free Memory: {status.get('free_memory', 0)} bytes\n")
            
            if not status.get('ethernet_connected'):
                print("⚠️  Warning: Gateway Ethernet not connected!")
                print("   Check Ethernet cable between Laptop 2 and Gateway\n")
                
            if not status.get('firebase_ready'):
                print("⚠️  Warning: Firebase not ready!")
                print("   Gateway WiFi may not be connected\n")
                
            return True
        else:
            print(f"⚠️  Gateway responded with HTTP {response.status_code}\n")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to gateway at {GATEWAY_IP}\n")
        print("   Troubleshooting:")
        print("   1. Check Ethernet cable is connected")
        print("   2. Verify Laptop 2 IP is 192.168.100.12:")
        print("      sudo ifconfig en0 192.168.100.12 netmask 255.255.255.0")
        print("   3. Verify Gateway IP is 192.168.100.10")
        print("   4. Try: ping 192.168.100.10")
        print("   5. Check Gateway is powered on (Green LED should be ON)\n")
        return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}\n")
        return False

def print_header():
    """Print application header"""
    print("\n" + "="*70)
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║     Laptop 2 - Virtual IoT Devices Simulator                    ║")
    print("║     Sends data to Hardware Gateway via Ethernet                 ║")
    print("║     SafeEdge Platform - Imagine Cup 2026                        ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print("="*70 + "\n")

def print_network_info():
    """Print network configuration"""
    print("📡 Network Configuration:")
    print("-"*70)
    print(f"   Laptop 2 IP: 192.168.100.12 (this machine)")
    print(f"   Hardware Gateway IP: {GATEWAY_IP}")
    print(f"   Connection: Ethernet cable")
    print(f"   Protocol: HTTP POST\n")

def print_device_list():
    """Print list of virtual devices"""
    print("📱 Virtual IoT Devices:")
    print("-"*70)
    for i, device in enumerate(DEVICES, 1):
        print(f"   {i}. {device['device_name']}")
        print(f"      ID: {device['device_id']}")
        print(f"      Type: {device['device_type']}")
        print(f"      Location: {device['location']}")
        print(f"      Update Interval: {device['interval']}s\n")

def main():
    """Main application entry point"""
    print_header()
    print_network_info()
    
    # Test connection
    if not test_gateway_connection():
        print("⚠️  Cannot proceed without gateway connection.")
        print("   Fix the connection and try again.\n")
        sys.exit(1)
    
    # Show device list
    print_device_list()
    
    print("="*70)
    print("Starting all virtual IoT devices...")
    print("="*70 + "\n")
    
    # Start device threads
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
        time.sleep(0.5)
    
    print("\n" + "="*70)
    print("✅ All devices running!")
    print("="*70)
    print("\nData Flow:")
    print(f"  Laptop 2 (192.168.100.12)")
    print(f"    ↓ Ethernet Cable")
    print(f"  Hardware Gateway ({GATEWAY_IP})")
    print(f"    ↓ WiFi + Internet")
    print(f"  Firebase Cloud")
    print(f"    ↓ Real-time")
    print(f"  Dashboard\n")
    print("Data Stream (device → value unit):")
    print("-"*70)
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n" + "="*70)
        print("👋 Stopping all devices...")
        print("="*70)
        print("\nGoodbye!\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}\n")
        sys.exit(1)
