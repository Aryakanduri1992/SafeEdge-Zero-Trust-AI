#!/usr/bin/env python3
"""
Install Auto-Boot Script to ESP32
=================================
Uploads boot.py to ESP32 so it auto-connects to WiFi on power-on.

Usage:
    python install_auto_boot.py

After running this, whenever you plug in the ESP32:
1. It will automatically connect to your WiFi
2. You can then run safeedge_demo.py or other scripts

Author: SafeEdge Team - Imagine Cup 2026
"""

import serial
import time
import os

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")


def load_credentials():
    """Load WiFi credentials from secret file"""
    ssid = password = None
    
    if not os.path.exists(SECRET_FILE):
        print(f"❌ Secret file not found: {SECRET_FILE}")
        return None, None
    
    with open(SECRET_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('WIFI_SSID='):
                ssid = line.split('=', 1)[1]
            elif line.startswith('WIFI_PASSWORD='):
                password = line.split('=', 1)[1]
    
    return ssid, password


def install_boot_script(ser, ssid, password):
    """Install boot.py on ESP32"""
    
    boot_code = f'''import network
import time

WIFI_SSID = "{ssid}"
WIFI_PASSWORD = "{password}"

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if wlan.isconnected():
        print("WiFi already connected")
        print("IP:", wlan.ifconfig()[0])
        return True
    
    print("Connecting to WiFi...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    for i in range(20):
        if wlan.isconnected():
            ip = wlan.ifconfig()[0]
            rssi = wlan.status("rssi")
            print("=" * 40)
            print("WiFi Connected!")
            print("IP:", ip)
            print("Signal:", rssi, "dBm")
            print("=" * 40)
            return True
        print(".", end="")
        time.sleep(1)
    
    print()
    print("WiFi connection failed!")
    return False

connect_wifi()
'''
    
    # Interrupt any running code
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.reset_input_buffer()
    
    print("📤 Writing boot.py to ESP32...")
    
    # Create boot.py file
    ser.write(b'f = open("boot.py", "w")\r\n')
    time.sleep(0.2)
    ser.read(500)
    
    # Write content line by line
    for line in boot_code.split('\n'):
        # Escape quotes
        escaped = line.replace('\\', '\\\\').replace('"', '\\"')
        cmd = f'f.write("{escaped}\\n")\r\n'
        ser.write(cmd.encode())
        time.sleep(0.03)
        ser.read(500)
    
    # Close file
    ser.write(b'f.close()\r\n')
    time.sleep(0.2)
    ser.read(500)
    
    # Verify
    ser.write(b'import os; print("boot.py" in os.listdir())\r\n')
    time.sleep(0.3)
    response = ser.read(500).decode('utf-8', errors='ignore')
    
    return 'True' in response


def main():
    print("=" * 50)
    print("SafeEdge ESP32 Auto-Boot Installer")
    print("=" * 50)
    
    # Load credentials
    ssid, password = load_credentials()
    if not ssid or not password:
        print("❌ Could not load WiFi credentials")
        return
    
    masked_ssid = ssid[:3] + "*" * (len(ssid) - 3)
    print(f"✅ WiFi credentials loaded (SSID: {masked_ssid})")
    
    # Connect to ESP32
    print(f"\nConnecting to ESP32 at {ESP32_PORT}...")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        time.sleep(1)
        print("✅ ESP32 connected")
    except Exception as e:
        print(f"❌ Cannot connect to ESP32: {e}")
        print("\nMake sure ESP32 is plugged in!")
        return
    
    # Install boot script
    if install_boot_script(ser, ssid, password):
        print("✅ boot.py installed successfully!")
        print()
        print("=" * 50)
        print("🎉 AUTO-BOOT CONFIGURED!")
        print("=" * 50)
        print()
        print("Now whenever you plug in the ESP32:")
        print("  1. It will automatically connect to WiFi")
        print("  2. You'll see 'WiFi Connected!' message")
        print("  3. Then you can run safeedge_demo.py")
        print()
        print("To test: Unplug ESP32, wait 3 seconds, plug it back in")
    else:
        print("❌ Failed to install boot.py")
    
    ser.close()


if __name__ == "__main__":
    main()
