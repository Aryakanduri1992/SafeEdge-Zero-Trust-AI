#!/usr/bin/env python3
"""
ESP32 MicroPython Firmware Flasher
==================================
Downloads and flashes MicroPython firmware to ESP32,
then uploads WiFi connection script.

SECURITY:
- WiFi credentials are read from wifi_credentials.secret
- Credentials are never displayed or logged

Usage:
    python flash_micropython.py
"""

import os
import sys
import time
import subprocess
import urllib.request
import serial

# Configuration
ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
FLASH_BAUD = 460800
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")
FIRMWARE_DIR = os.path.join(os.path.dirname(__file__), "firmware")
MICROPYTHON_URL = "https://micropython.org/resources/firmware/ESP32_GENERIC-20241129-v1.24.1.bin"
FIRMWARE_FILE = os.path.join(FIRMWARE_DIR, "micropython_esp32.bin")


def load_wifi_credentials():
    """Load WiFi credentials from secret file"""
    if not os.path.exists(SECRET_FILE):
        print("❌ ERROR: wifi_credentials.secret not found!")
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
    
    if not ssid or not password:
        print("❌ ERROR: Invalid credentials in secret file!")
        return None, None
    
    masked_ssid = ssid[:3] + "*" * (len(ssid) - 3) if len(ssid) > 3 else "***"
    print(f"✅ Loaded WiFi credentials (SSID: {masked_ssid})")
    return ssid, password


def download_firmware():
    """Download MicroPython firmware if not exists"""
    os.makedirs(FIRMWARE_DIR, exist_ok=True)
    
    if os.path.exists(FIRMWARE_FILE):
        print(f"✅ Firmware already downloaded: {FIRMWARE_FILE}")
        return True
    
    print(f"📥 Downloading MicroPython firmware...")
    print(f"   URL: {MICROPYTHON_URL}")
    
    try:
        urllib.request.urlretrieve(MICROPYTHON_URL, FIRMWARE_FILE)
        print(f"✅ Firmware downloaded: {FIRMWARE_FILE}")
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def erase_flash():
    """Erase ESP32 flash memory"""
    print("\n🗑️  Erasing ESP32 flash memory...")
    
    cmd = [
        sys.executable, "-m", "esptool",
        "--port", ESP32_PORT,
        "--baud", str(FLASH_BAUD),
        "erase_flash"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Flash erased successfully")
        return True
    else:
        print(f"❌ Erase failed: {result.stderr}")
        return False


def flash_firmware():
    """Flash MicroPython firmware to ESP32"""
    print("\n📤 Flashing MicroPython firmware...")
    
    cmd = [
        sys.executable, "-m", "esptool",
        "--port", ESP32_PORT,
        "--baud", str(FLASH_BAUD),
        "--chip", "esp32",
        "write_flash",
        "-z", "0x1000",
        FIRMWARE_FILE
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Firmware flashed successfully")
        return True
    else:
        print(f"❌ Flash failed: {result.stderr}")
        return False


def wait_for_reboot():
    """Wait for ESP32 to reboot after flashing"""
    print("\n⏳ Waiting for ESP32 to reboot...")
    time.sleep(3)
    
    # Try to connect
    for i in range(10):
        try:
            ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=1)
            ser.close()
            print("✅ ESP32 is ready")
            return True
        except:
            time.sleep(1)
    
    print("⚠️  ESP32 may need manual reset")
    return True


def upload_wifi_script(ssid, password):
    """Upload WiFi connection script to ESP32"""
    print("\n📤 Uploading WiFi connection script...")
    
    # Create boot.py content with WiFi credentials
    boot_script = f'''# SafeEdge ESP32 Boot Script
# Auto-connects to WiFi on startup

import network
import time

WIFI_SSID = "{ssid}"
WIFI_PASSWORD = "{password}"

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if wlan.isconnected():
        print("Already connected to WiFi")
        print("IP:", wlan.ifconfig()[0])
        return True
    
    print("Connecting to WiFi...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    max_wait = 20
    while max_wait > 0:
        if wlan.isconnected():
            break
        max_wait -= 1
        print(".", end="")
        time.sleep(1)
    
    print()
    
    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        rssi = wlan.status("rssi")
        print("=" * 40)
        print("WiFi Connected!")
        print(f"IP Address: {{ip}}")
        print(f"Signal: {{rssi}} dBm")
        print("=" * 40)
        return True
    else:
        print("WiFi Connection Failed!")
        return False

# Connect on boot
connect_wifi()
'''
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=5)
        time.sleep(2)
        
        # Interrupt any running code
        ser.write(b'\x03')
        time.sleep(0.3)
        ser.write(b'\x03')
        time.sleep(0.5)
        ser.reset_input_buffer()
        
        # Enter raw REPL mode
        ser.write(b'\x01')  # Ctrl+A for raw REPL
        time.sleep(0.3)
        
        # Create boot.py file
        file_code = f'''
f = open("boot.py", "w")
f.write("""{boot_script}""")
f.close()
print("boot.py created!")
'''
        
        # Send code in paste mode
        ser.write(b'\x05')  # Ctrl+E for paste mode
        time.sleep(0.2)
        
        for line in file_code.split('\n'):
            ser.write((line + '\n').encode())
            time.sleep(0.02)
        
        ser.write(b'\x04')  # Ctrl+D to execute
        time.sleep(2)
        
        # Read response
        response = ser.read(2000).decode('utf-8', errors='ignore')
        
        if "boot.py created" in response or ">>>" in response:
            print("✅ WiFi script uploaded to boot.py")
        
        # Now run the WiFi connection
        print("\n🔌 Connecting to WiFi...")
        
        ser.write(b'\x03')  # Ctrl+C
        time.sleep(0.3)
        ser.reset_input_buffer()
        
        # Execute boot.py
        ser.write(b'exec(open("boot.py").read())\r\n')
        time.sleep(1)
        
        # Wait for connection
        start_time = time.time()
        connected = False
        
        while time.time() - start_time < 25:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    print(f"   {line}")
                    if "WiFi Connected" in line:
                        connected = True
                    if "IP Address" in line:
                        connected = True
                        break
            time.sleep(0.1)
        
        ser.close()
        return connected
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("=" * 50)
    print("🔧 ESP32 MicroPython Flasher + WiFi Setup")
    print("=" * 50)
    
    # Load credentials first
    ssid, password = load_wifi_credentials()
    if not ssid:
        return
    
    # Check if ESP32 is connected
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=1)
        ser.close()
        print(f"✅ ESP32 detected at {ESP32_PORT}")
    except:
        print(f"❌ ESP32 not found at {ESP32_PORT}")
        return
    
    print("\n⚠️  This will erase the current firmware on your ESP32!")
    print("   Press Enter to continue or Ctrl+C to cancel...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
        return
    
    # Download firmware
    if not download_firmware():
        return
    
    # Erase flash
    if not erase_flash():
        return
    
    # Flash firmware
    if not flash_firmware():
        return
    
    # Wait for reboot
    wait_for_reboot()
    
    # Upload WiFi script
    success = upload_wifi_script(ssid, password)
    
    if success:
        print("\n" + "=" * 50)
        print("🎉 SUCCESS! ESP32 is connected to WiFi!")
        print("=" * 50)
    else:
        print("\n⚠️  WiFi connection may have failed.")
        print("   Try running: python esp32_wifi_connect.py")


if __name__ == "__main__":
    main()
