#!/usr/bin/env python3
"""
Simple WiFi Connection for ESP32 with MicroPython
=================================================
Sends WiFi connection commands directly to ESP32 REPL.
"""

import serial
import time
import os

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")


def load_credentials():
    """Load WiFi credentials"""
    ssid = password = None
    with open(SECRET_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('WIFI_SSID='):
                ssid = line.split('=', 1)[1]
            elif line.startswith('WIFI_PASSWORD='):
                password = line.split('=', 1)[1]
    return ssid, password


def main():
    print("=" * 50)
    print("🔌 ESP32 WiFi Connection")
    print("=" * 50)
    
    ssid, password = load_credentials()
    if not ssid:
        print("❌ No credentials found")
        return
    
    masked = ssid[:3] + "*" * (len(ssid) - 3)
    print(f"✅ SSID: {masked}")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=3)
        print(f"✅ Connected to {ESP32_PORT}")
    except Exception as e:
        print(f"❌ Cannot connect: {e}")
        return
    
    time.sleep(1)
    
    # Interrupt any running code
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.reset_input_buffer()
    
    # Check for MicroPython REPL
    ser.write(b'\r\n')
    time.sleep(0.5)
    response = ser.read(500).decode('utf-8', errors='ignore')
    
    if '>>>' not in response:
        print("⚠️  MicroPython REPL not detected")
        print("   Response:", response[:100] if response else "(empty)")
        ser.close()
        return
    
    print("✅ MicroPython REPL detected")
    print("\n📡 Connecting to WiFi...")
    
    # Send commands one by one
    commands = [
        "import network",
        "import time",
        "wlan = network.WLAN(network.STA_IF)",
        "wlan.active(True)",
        f'wlan.connect("{ssid}", "{password}")',
    ]
    
    for cmd in commands:
        ser.write((cmd + '\r\n').encode())
        time.sleep(0.3)
        ser.read(500)  # Clear response
    
    # Wait for connection
    print("   Waiting for connection", end="", flush=True)
    
    for i in range(20):
        ser.write(b'wlan.isconnected()\r\n')
        time.sleep(1)
        response = ser.read(500).decode('utf-8', errors='ignore')
        
        if 'True' in response:
            print("\n✅ Connected!")
            
            # Get IP address
            ser.write(b'wlan.ifconfig()[0]\r\n')
            time.sleep(0.3)
            ip_response = ser.read(500).decode('utf-8', errors='ignore')
            
            # Extract IP
            for line in ip_response.split('\n'):
                if '.' in line and "'" in line:
                    ip = line.strip().strip("'")
                    print(f"📍 IP Address: {ip}")
                    break
            
            # Get signal strength
            ser.write(b'wlan.status("rssi")\r\n')
            time.sleep(0.3)
            rssi_response = ser.read(500).decode('utf-8', errors='ignore')
            
            for line in rssi_response.split('\n'):
                if line.strip().lstrip('-').isdigit():
                    print(f"📶 Signal: {line.strip()} dBm")
                    break
            
            print("\n🎉 ESP32 is connected to your WiFi!")
            ser.close()
            return
        
        print(".", end="", flush=True)
    
    print("\n❌ Connection timeout")
    print("   Check your WiFi credentials")
    ser.close()


if __name__ == "__main__":
    main()
