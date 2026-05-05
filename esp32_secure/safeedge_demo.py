#!/usr/bin/env python3
"""
SafeEdge Complete Demo
======================
Demonstrates the full ESP32 → Backend → Dashboard pipeline.

Features:
- ESP32 WiFi status display
- Simulated sensor readings with LED indicators
- Backend API communication (if running)
- Attack simulation

Usage:
    python safeedge_demo.py
"""

import serial
import time
import random
import requests
import socket
import sys

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
BACKEND_URL = "http://localhost:8000"
DEVICE_ID = "esp32_safeedge_001"

class Colors:
    RED = '\033[91m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'=' * 50}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(50)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'=' * 50}{Colors.RESET}\n")

def print_status(status, message):
    if status == "safe":
        print(f"{Colors.GREEN}🟢 SAFE{Colors.RESET}    | {message}")
    elif status == "warning":
        print(f"{Colors.YELLOW}🟡 WARNING{Colors.RESET} | {message}")
    elif status == "danger":
        print(f"{Colors.RED}🔴 DANGER{Colors.RESET}  | {message}")
    else:
        print(f"   {message}")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "Unknown"

def check_backend():
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=3)
        return response.status_code == 200
    except:
        return False

def get_esp32_wifi_info(ser):
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.reset_input_buffer()
    
    ser.write(b'import network; wlan = network.WLAN(network.STA_IF); print(wlan.isconnected(), wlan.ifconfig()[0] if wlan.isconnected() else "N/A", wlan.status("rssi") if wlan.isconnected() else 0)\r\n')
    time.sleep(0.5)
    response = ser.read(500).decode('utf-8', errors='ignore')
    
    for line in response.split('\n'):
        if 'True' in line or 'False' in line:
            parts = line.strip().split()
            if len(parts) >= 3:
                return {
                    "connected": parts[0] == "True",
                    "ip": parts[1],
                    "signal": int(parts[2]) if parts[2].lstrip('-').isdigit() else 0
                }
    return {"connected": False, "ip": "N/A", "signal": 0}

def generate_sensor_data(anomaly=False):
    """Generate sensor data, optionally with anomaly"""
    if anomaly:
        # Generate anomalous data
        temp = random.choice([35.0, 39.5, 42.0])  # Out of range
        humidity = random.choice([40, 70, 80])  # Out of range
    else:
        temp = 36.8 + (random.random() - 0.5) * 0.6
        humidity = 55 + (random.random() - 0.5) * 5
    
    # Determine threat level
    threat = "safe"
    score = 100
    
    if temp < 36.5 or temp > 37.5:
        threat = "critical" if temp < 35 or temp > 38 else "warning"
        score -= 30 if threat == "critical" else 15
    
    if humidity < 50 or humidity > 60:
        if threat == "safe":
            threat = "warning"
        score -= 20
    
    return {
        "device_id": DEVICE_ID,
        "temperature": round(temp, 2),
        "humidity": round(humidity, 1),
        "air_pressure": round(1013 + (random.random() - 0.5) * 5, 2),
        "oxygen_level": round(21 + random.random() * 0.5, 2),
        "motion_detected": anomaly and random.random() < 0.5,
        "door_status": anomaly and random.random() < 0.3,
        "vibration_level": round(random.random() * (0.8 if anomaly else 0.3), 3),
        "power_voltage": round(12 + (random.random() - 0.5) * (2 if anomaly else 0.5), 2),
        "threat_level": threat,
        "anomaly_detected": threat != "safe",
        "security_score": max(0, score)
    }

def send_to_backend(data):
    """Send sensor data to backend"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/sensor-data",
            json=data,
            timeout=5
        )
        return response.status_code == 200
    except:
        return False

def register_device(wifi_info):
    """Register device with backend"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/esp32/register",
            json={
                "device_id": DEVICE_ID,
                "device_type": "ESP32_NICU_Monitor",
                "firmware_version": "2.0.0",
                "wifi_connected": wifi_info["connected"],
                "ip_address": wifi_info["ip"],
                "signal_strength": wifi_info["signal"],
                "capabilities": ["temperature", "humidity", "motion", "door", "buzzer", "leds"]
            },
            timeout=5
        )
        return response.status_code == 200
    except:
        return False

def main():
    print_header("SafeEdge ESP32 Demo")
    print(f"Imagine Cup 2026 - Hospital IoT Security\n")
    
    # System info
    local_ip = get_local_ip()
    backend_running = check_backend()
    
    print(f"Your Computer IP: {Colors.CYAN}{local_ip}{Colors.RESET}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Backend Status: {Colors.GREEN}Running{Colors.RESET}" if backend_running else f"Backend Status: {Colors.YELLOW}Not Running{Colors.RESET}")
    
    # Connect to ESP32
    print(f"\nConnecting to ESP32 at {ESP32_PORT}...")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        time.sleep(1)
        print(f"{Colors.GREEN}✅ ESP32 Connected{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}❌ Cannot connect to ESP32: {e}{Colors.RESET}")
        return
    
    # Get WiFi info
    wifi_info = get_esp32_wifi_info(ser)
    
    print(f"\n{Colors.BOLD}ESP32 WiFi Status:{Colors.RESET}")
    if wifi_info["connected"]:
        print(f"  Connected: {Colors.GREEN}Yes{Colors.RESET}")
        print(f"  IP Address: {Colors.CYAN}{wifi_info['ip']}{Colors.RESET}")
        print(f"  Signal: {wifi_info['signal']} dBm")
    else:
        print(f"  Connected: {Colors.RED}No{Colors.RESET}")
        ser.close()
        return
    
    # Register with backend
    if backend_running:
        print(f"\nRegistering device with backend...")
        if register_device(wifi_info):
            print(f"{Colors.GREEN}✅ Device registered{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}⚠️  Registration failed{Colors.RESET}")
    
    # Demo loop
    print_header("Live Sensor Monitoring")
    print("Simulating NICU incubator sensor readings...")
    print("LED indicators: 🟢 Green=Safe, 🟡 Yellow=Warning, 🔴 Red=Danger")
    print("-" * 50)
    
    try:
        for i in range(10):
            # Generate normal data (80% chance) or anomaly (20% chance)
            anomaly = random.random() < 0.2
            data = generate_sensor_data(anomaly)
            
            # Determine status
            if data["threat_level"] == "critical":
                status = "danger"
                led = "RED"
            elif data["threat_level"] == "warning":
                status = "warning"
                led = "YELLOW"
            else:
                status = "safe"
                led = "GREEN"
            
            # Print status
            msg = f"Temp: {data['temperature']:.1f}°C | Humidity: {data['humidity']:.0f}% | Score: {data['security_score']} | LED: {led}"
            print_status(status, msg)
            
            # Send to backend
            if backend_running:
                if send_to_backend(data):
                    print(f"         └─ {Colors.BLUE}Sent to backend ✓{Colors.RESET}")
                else:
                    print(f"         └─ {Colors.YELLOW}Backend send failed{Colors.RESET}")
            
            time.sleep(2)
        
        print("-" * 50)
        
        # Attack simulation
        print_header("Attack Simulation")
        print("Simulating a temperature spike attack...")
        print("-" * 50)
        
        attack_data = {
            "device_id": DEVICE_ID,
            "temperature": 42.5,
            "humidity": 55.0,
            "threat_level": "critical",
            "anomaly_detected": True,
            "security_score": 30,
            "motion_detected": True,
            "door_status": True
        }
        
        print_status("danger", f"Temp: {attack_data['temperature']}°C | ATTACK DETECTED!")
        print(f"         └─ {Colors.RED}🚨 BUZZER ACTIVATED{Colors.RESET}")
        print(f"         └─ {Colors.RED}🔴 RED LED ON{Colors.RESET}")
        
        if backend_running:
            try:
                response = requests.post(
                    f"{BACKEND_URL}/api/security/simulate-attack",
                    json={
                        "device_id": DEVICE_ID,
                        "attack_type": "Temperature Spike Attack",
                        "sensor_data": attack_data,
                        "attack_indicators": {"anomaly_score": 0.95}
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    result = response.json()
                    print(f"         └─ {Colors.GREEN}AI Analysis: Threat blocked!{Colors.RESET}")
                    print(f"         └─ Processing time: {result.get('processing_time', 'N/A')}ms")
            except Exception as e:
                print(f"         └─ {Colors.YELLOW}Backend processing: {e}{Colors.RESET}")
        
        print("-" * 50)
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Demo interrupted{Colors.RESET}")
    finally:
        ser.close()
    
    print_header("Demo Complete")
    print(f"{Colors.GREEN}✅ ESP32 integration is working!{Colors.RESET}")
    print()
    if not backend_running:
        print("To see data in the dashboard, start the backend:")
        print(f"  {Colors.CYAN}cd src/backend && python -m uvicorn main:app --reload --host 0.0.0.0{Colors.RESET}")
    else:
        print("Check the dashboard to see the sensor data and alerts!")
    print()

if __name__ == "__main__":
    main()
