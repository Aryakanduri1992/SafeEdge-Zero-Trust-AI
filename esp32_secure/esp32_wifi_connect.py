"""
ESP32 WiFi Connection Script
============================
Connects ESP32 to WiFi using credentials from secret file.

SECURITY:
- WiFi credentials are stored in wifi_credentials.secret
- This file is gitignored and never uploaded
- Only YOU can edit the secret file manually

Usage:
    python esp32_wifi_connect.py
"""

import serial
import time
import os
import sys

# Configuration
ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")


def load_wifi_credentials():
    """Load WiFi credentials from secret file"""
    
    if not os.path.exists(SECRET_FILE):
        print("❌ ERROR: wifi_credentials.secret file not found!")
        print(f"   Expected location: {SECRET_FILE}")
        print("\n📝 Please create the file with:")
        print("   WIFI_SSID=your_wifi_name")
        print("   WIFI_PASSWORD=your_wifi_password")
        return None, None
    
    ssid = None
    password = None
    
    with open(SECRET_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('WIFI_SSID='):
                ssid = line.split('=', 1)[1]
            elif line.startswith('WIFI_PASSWORD='):
                password = line.split('=', 1)[1]
    
    if ssid == "YOUR_WIFI_NAME_HERE" or password == "YOUR_WIFI_PASSWORD_HERE":
        print("❌ ERROR: Please edit wifi_credentials.secret with your actual WiFi credentials!")
        print(f"   File location: {SECRET_FILE}")
        return None, None
    
    if not ssid or not password:
        print("❌ ERROR: Could not read WiFi credentials from secret file!")
        return None, None
    
    # Security: Only show partial SSID, never show password
    masked_ssid = ssid[:3] + "*" * (len(ssid) - 3) if len(ssid) > 3 else "***"
    print(f"✅ Loaded WiFi credentials (SSID: {masked_ssid})")
    
    return ssid, password


def create_wifi_firmware(ssid, password):
    """Create MicroPython WiFi connection code"""
    
    # This is the code that will run on ESP32
    wifi_code = f'''
import network
import time

def connect_wifi():
    ssid = "{ssid}"
    password = "{password}"
    
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if wlan.isconnected():
        print("Already connected to WiFi")
        print("IP:", wlan.ifconfig()[0])
        return True
    
    print("Connecting to WiFi:", ssid[:3] + "***")
    wlan.connect(ssid, password)
    
    # Wait for connection
    max_wait = 20
    while max_wait > 0:
        if wlan.isconnected():
            break
        max_wait -= 1
        print("Waiting for connection...")
        time.sleep(1)
    
    if wlan.isconnected():
        print("WiFi Connected!")
        print("IP Address:", wlan.ifconfig()[0])
        print("Signal Strength:", wlan.status("rssi"), "dBm")
        return True
    else:
        print("WiFi Connection Failed!")
        return False

# Auto-connect on boot
connect_wifi()
'''
    return wifi_code


def check_esp32_connection():
    """Check if ESP32 is connected"""
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        ser.close()
        return True
    except:
        return False


def send_to_esp32(code):
    """Send code to ESP32 via serial"""
    
    print(f"\n🔌 Connecting to ESP32 at {ESP32_PORT}...")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=5)
        time.sleep(2)  # Wait for ESP32
        
        print("✅ Connected to ESP32")
        
        # Clear buffer
        ser.reset_input_buffer()
        
        # Enter REPL mode (Ctrl+C to interrupt any running code)
        ser.write(b'\x03')  # Ctrl+C
        time.sleep(0.5)
        ser.write(b'\x03')  # Ctrl+C again
        time.sleep(0.5)
        
        # Clear any output
        ser.reset_input_buffer()
        
        # Send the WiFi connection code line by line
        print("\n📤 Sending WiFi connection code to ESP32...")
        
        # Enter paste mode (Ctrl+E)
        ser.write(b'\x05')  # Ctrl+E for paste mode
        time.sleep(0.3)
        
        # Send code
        for line in code.split('\n'):
            ser.write((line + '\n').encode())
            time.sleep(0.05)
        
        # Exit paste mode and execute (Ctrl+D)
        ser.write(b'\x04')  # Ctrl+D
        time.sleep(1)
        
        # Read response
        print("\n📡 ESP32 Response:")
        print("-" * 40)
        
        start_time = time.time()
        while time.time() - start_time < 25:  # Wait up to 25 seconds
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    print(f"   {line}")
                    if "WiFi Connected" in line or "IP Address" in line:
                        print("-" * 40)
                        print("\n🎉 SUCCESS! ESP32 is connected to WiFi!")
                        ser.close()
                        return True
                    if "WiFi Connection Failed" in line:
                        print("-" * 40)
                        print("\n❌ WiFi connection failed. Check credentials.")
                        ser.close()
                        return False
            time.sleep(0.1)
        
        print("-" * 40)
        ser.close()
        return False
        
    except serial.SerialException as e:
        print(f"❌ Serial error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("=" * 50)
    print("🔐 ESP32 Secure WiFi Connection")
    print("=" * 50)
    
    # Check ESP32 connection
    if not check_esp32_connection():
        print(f"❌ ESP32 not found at {ESP32_PORT}")
        print("   Please check the USB connection.")
        return
    
    print(f"✅ ESP32 detected at {ESP32_PORT}")
    
    # Load credentials from secret file
    ssid, password = load_wifi_credentials()
    
    if not ssid or not password:
        print("\n⚠️  Please edit the secret file and run again.")
        print(f"   File: {SECRET_FILE}")
        return
    
    # Create WiFi code
    wifi_code = create_wifi_firmware(ssid, password)
    
    # Send to ESP32
    success = send_to_esp32(wifi_code)
    
    if success:
        print("\n✅ ESP32 WiFi setup complete!")
    else:
        print("\n⚠️  Could not verify WiFi connection.")
        print("   The ESP32 may need MicroPython firmware installed first.")
        print("   Or check if your WiFi credentials are correct.")


if __name__ == "__main__":
    main()
