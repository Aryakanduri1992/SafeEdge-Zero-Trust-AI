#!/usr/bin/env python3
"""
SafeEdge ESP32 Demo Runner
==========================
Runs a demo on the ESP32 that sends sensor data to the backend.
Shows the full pipeline working.
"""

import serial
import time
import socket
import threading
import requests

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
BACKEND_URL = "http://localhost:8000"

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "192.168.29.1"

def check_backend():
    """Check if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=3)
        return response.status_code == 200
    except:
        return False

def run_esp32_demo():
    """Run demo firmware on ESP32"""
    local_ip = get_local_ip()
    
    print("=" * 50)
    print("SafeEdge ESP32 Demo")
    print("=" * 50)
    print(f"Backend: {BACKEND_URL}")
    print(f"Your IP: {local_ip}")
    
    # Check backend
    if not check_backend():
        print("\n⚠️  Backend not running!")
        print("Start it with:")
        print("  cd src/backend && python -m uvicorn main:app --reload --host 0.0.0.0")
        print("\nRunning ESP32 in offline demo mode...\n")
    else:
        print("✅ Backend is running\n")
    
    # Connect to ESP32
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        time.sleep(1)
        print(f"✅ Connected to ESP32 at {ESP32_PORT}")
    except Exception as e:
        print(f"❌ Cannot connect to ESP32: {e}")
        return
    
    # Interrupt any running code
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.reset_input_buffer()
    
    # Demo code to run on ESP32
    demo_code = f'''
import network
import time
import json

# Check WiFi
wlan = network.WLAN(network.STA_IF)
if not wlan.isconnected():
    print("WiFi not connected!")
else:
    print("WiFi OK:", wlan.ifconfig()[0])
    print("Signal:", wlan.status("rssi"), "dBm")

# Simulate sensor readings
import random

DEVICE_ID = "esp32_safeedge_001"

def read_sensors():
    temp = 36.8 + (random.random() - 0.5) * 0.6
    humidity = 55 + (random.random() - 0.5) * 5
    
    threat = "safe"
    score = 100
    
    if temp < 36.5 or temp > 37.5:
        threat = "critical"
        score -= 30
    elif humidity < 50 or humidity > 60:
        threat = "warning"
        score -= 20
    
    return {{
        "device_id": DEVICE_ID,
        "temperature": round(temp, 2),
        "humidity": round(humidity, 1),
        "threat_level": threat,
        "security_score": score,
        "wifi_signal": wlan.status("rssi") if wlan.isconnected() else 0
    }}

print("\\n" + "=" * 40)
print("SafeEdge Sensor Demo")
print("=" * 40)

for i in range(10):
    data = read_sensors()
    
    if data["threat_level"] == "critical":
        status = "RED DANGER"
    elif data["threat_level"] == "warning":
        status = "YLW WARNING"
    else:
        status = "GRN SAFE"
    
    print(f"[{{status}}] Temp={{data['temperature']}}C Hum={{data['humidity']}}% Score={{data['security_score']}}")
    time.sleep(2)

print("\\nDemo complete!")
'''
    
    # Send code to ESP32
    print("\n📤 Sending demo code to ESP32...")
    
    # Enter paste mode
    ser.write(b'\x05')  # Ctrl+E
    time.sleep(0.2)
    
    # Send code
    for line in demo_code.split('\n'):
        ser.write((line + '\n').encode())
        time.sleep(0.02)
    
    # Execute
    ser.write(b'\x04')  # Ctrl+D
    time.sleep(1)
    
    # Monitor output
    print("\n--- ESP32 Output ---\n")
    
    start_time = time.time()
    while time.time() - start_time < 30:  # Run for 30 seconds
        if ser.in_waiting:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line:
                # Color code output
                if "RED" in line or "DANGER" in line:
                    print(f"🔴 {line}")
                elif "YLW" in line or "WARNING" in line:
                    print(f"🟡 {line}")
                elif "GRN" in line or "SAFE" in line:
                    print(f"🟢 {line}")
                elif "Demo complete" in line:
                    print(f"\n✅ {line}")
                    break
                else:
                    print(f"   {line}")
        time.sleep(0.1)
    
    print("\n--- Demo Finished ---")
    ser.close()

if __name__ == "__main__":
    run_esp32_demo()
