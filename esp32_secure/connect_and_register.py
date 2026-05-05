#!/usr/bin/env python3
"""
ESP32 Connect and Register Script
=================================
Connects ESP32 to WiFi and registers it with the SafeEdge backend.
This script communicates with ESP32 via serial and sends commands.

Usage:
    python connect_and_register.py
"""

import serial
import time
import os
import requests
import json

# Configuration
ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")
BACKEND_URL = "http://localhost:9002"

def load_credentials():
    """Load WiFi credentials from secret file"""
    if not os.path.exists(SECRET_FILE):
        return None, None
    
    ssid = password = None
    with open(SECRET_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('WIFI_SSID='):
                ssid = line.split('=', 1)[1]
            elif line.startswith('WIFI_PASSWORD='):
                password = line.split('=', 1)[1]
    
    return ssid, password

def get_esp32_info(ser):
    """Try to get ESP32 info via MicroPython"""
    try:
        # Interrupt any running code
        ser.write(b'\x03')
        time.sleep(0.3)
        ser.write(b'\x03')
        time.sleep(0.5)
        ser.reset_input_buffer()
        
        # Check for MicroPython REPL
        ser.write(b'\r\n')
        time.sleep(0.3)
        response = ser.read(500).decode('utf-8', errors='ignore')
        
        if '>>>' in response:
            # Get WiFi info with simpler code
            code = '''
import network
import ubinascii
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
if wlan.isconnected():
    cfg = wlan.ifconfig()
    mac = ubinascii.hexlify(wlan.config('mac'), ':').decode()
    try:
        rssi = wlan.status('rssi')
    except:
        rssi = -50
    print("IP=" + cfg[0])
    print("MAC=" + mac)
    print("RSSI=" + str(rssi))
    print("CONNECTED=YES")
else:
    print("CONNECTED=NO")
'''
            ser.write(b'\x05')  # Paste mode
            time.sleep(0.1)
            for line in code.split('\n'):
                ser.write((line + '\n').encode())
                time.sleep(0.02)
            ser.write(b'\x04')  # Exit paste mode
            time.sleep(2)
            
            # Read response
            response = ser.read(4000).decode('utf-8', errors='ignore')
            
            info = {'connected': False}
            for line in response.split('\n'):
                line = line.strip()
                if line.startswith('IP='):
                    info['ip'] = line.split('=')[1]
                elif line.startswith('MAC='):
                    info['mac'] = line.split('=')[1]
                elif line.startswith('RSSI='):
                    try:
                        info['rssi'] = int(line.split('=')[1])
                    except:
                        info['rssi'] = -50
                elif line.startswith('CONNECTED=YES'):
                    info['connected'] = True
            
            return info
        else:
            return {'connected': False, 'error': 'Not MicroPython'}
    except Exception as e:
        return {'connected': False, 'error': str(e)}

def register_device(device_id, wifi_info):
    """Register device with backend"""
    try:
        data = {
            "device_id": device_id,
            "device_type": "ESP32_SafeEdge",
            "firmware_version": "2.0.0",
            "wifi_connected": wifi_info.get('connected', False),
            "ip_address": wifi_info.get('ip', ''),
            "signal_strength": wifi_info.get('rssi', 0),
            "mac_address": wifi_info.get('mac', ''),
            "capabilities": ["temperature", "humidity", "motion", "buzzer", "leds"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/esp32/register",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def send_heartbeat(device_id, wifi_info):
    """Send heartbeat to backend"""
    try:
        data = {
            "device_id": device_id,
            "status": "online",
            "wifi_connected": wifi_info.get('connected', False),
            "signal_strength": wifi_info.get('rssi', 0),
            "uptime": int(time.time()) % 86400  # Seconds since midnight
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/esp32/heartbeat",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        return response.status_code == 200
    except Exception as e:
        print(f"Heartbeat error: {e}")
        return False

def main():
    print("=" * 50)
    print("🔌 ESP32 Connect and Register")
    print("=" * 50)
    
    # Load credentials
    ssid, password = load_credentials()
    if ssid:
        print(f"✅ WiFi credentials loaded (SSID: {ssid[:3]}***)")
    
    # Try to connect to ESP32
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        print(f"✅ Connected to ESP32 on {ESP32_PORT}")
    except Exception as e:
        print(f"⚠️  Cannot connect to ESP32: {e}")
        print("   Running in simulation mode...")
        ser = None
    
    # Get device ID
    device_id = "esp32_safeedge_001"
    
    # Get WiFi info from ESP32 or simulate
    if ser:
        print("\n📡 Getting WiFi info from ESP32...")
        wifi_info = get_esp32_info(ser)
        ser.close()
    else:
        # Simulate connected device
        wifi_info = {
            'connected': True,
            'ip': '192.168.29.100',
            'mac': 'AA:BB:CC:DD:EE:FF',
            'rssi': -45
        }
    
    if wifi_info.get('connected'):
        print(f"✅ WiFi Connected!")
        print(f"   IP: {wifi_info.get('ip', 'N/A')}")
        print(f"   Signal: {wifi_info.get('rssi', 'N/A')} dBm")
    else:
        print(f"⚠️  WiFi not connected: {wifi_info.get('error', 'Unknown')}")
        print("   Registering as disconnected device...")
    
    # Register with backend
    print(f"\n📝 Registering device '{device_id}' with backend...")
    result = register_device(device_id, wifi_info)
    
    if 'error' in result:
        print(f"❌ Registration failed: {result['error']}")
        return
    
    print(f"✅ {result.get('message', 'Registered')}")
    
    # Start heartbeat loop
    print("\n💓 Starting heartbeat loop (Ctrl+C to stop)...")
    print("   Sending heartbeat every 5 seconds\n")
    
    try:
        while True:
            success = send_heartbeat(device_id, wifi_info)
            status = "✅" if success else "❌"
            print(f"   {status} Heartbeat sent at {time.strftime('%H:%M:%S')}")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n\n👋 Stopped heartbeat loop")

if __name__ == "__main__":
    main()
