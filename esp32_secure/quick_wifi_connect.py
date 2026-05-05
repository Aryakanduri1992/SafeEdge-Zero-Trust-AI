#!/usr/bin/env python3
"""
Quick WiFi Connection for ESP32
===============================
Attempts to connect ESP32 to WiFi using AT commands or direct serial.
Works with various ESP32 firmware types.

Usage:
    python quick_wifi_connect.py
"""

import serial
import time
import os

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200
SECRET_FILE = os.path.join(os.path.dirname(__file__), "wifi_credentials.secret")


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


def try_at_commands(ser, ssid, password):
    """Try AT command firmware"""
    print("\n📡 Trying AT commands...")
    
    ser.write(b'AT\r\n')
    time.sleep(0.5)
    response = ser.read(500).decode('utf-8', errors='ignore')
    
    if 'OK' in response:
        print("   AT firmware detected!")
        
        # Set WiFi mode to Station
        ser.write(b'AT+CWMODE=1\r\n')
        time.sleep(0.5)
        
        # Connect to WiFi
        cmd = f'AT+CWJAP="{ssid}","{password}"\r\n'
        ser.write(cmd.encode())
        
        # Wait for connection
        start = time.time()
        while time.time() - start < 20:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                print(f"   {line}")
                if 'WIFI CONNECTED' in line or 'WIFI GOT IP' in line:
                    return True
                if 'FAIL' in line or 'ERROR' in line:
                    return False
            time.sleep(0.1)
    
    return False


def try_micropython(ser, ssid, password):
    """Try MicroPython REPL"""
    print("\n🐍 Trying MicroPython...")
    
    # Interrupt and check for REPL
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.reset_input_buffer()
    
    ser.write(b'\r\n')
    time.sleep(0.3)
    response = ser.read(500).decode('utf-8', errors='ignore')
    
    if '>>>' in response:
        print("   MicroPython detected!")
        
        # Send WiFi connection code
        wifi_code = f'''
import network
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("{ssid}", "{password}")
import time
for i in range(20):
    if wlan.isconnected():
        print("CONNECTED:", wlan.ifconfig()[0])
        break
    time.sleep(1)
    print(".", end="")
else:
    print("FAILED")
'''
        
        # Enter paste mode
        ser.write(b'\x05')
        time.sleep(0.2)
        
        for line in wifi_code.split('\n'):
            ser.write((line + '\n').encode())
            time.sleep(0.02)
        
        ser.write(b'\x04')
        time.sleep(1)
        
        # Wait for result
        start = time.time()
        while time.time() - start < 25:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and line != '>>>':
                    print(f"   {line}")
                if 'CONNECTED:' in line:
                    return True
                if 'FAILED' in line:
                    return False
            time.sleep(0.1)
    
    return False


def check_current_firmware(ser):
    """Detect what firmware is running"""
    ser.reset_input_buffer()
    
    # Read any output
    time.sleep(0.5)
    output = ser.read(2000).decode('utf-8', errors='ignore')
    
    if 'softAP' in output:
        return 'arduino_softap'
    elif '>>>' in output:
        return 'micropython'
    elif 'OK' in output:
        return 'at_firmware'
    else:
        return 'unknown'


def main():
    print("=" * 50)
    print("🔌 Quick ESP32 WiFi Connection")
    print("=" * 50)
    
    ssid, password = load_credentials()
    if not ssid:
        print("❌ No credentials found in wifi_credentials.secret")
        return
    
    masked = ssid[:3] + "*" * (len(ssid) - 3)
    print(f"✅ Credentials loaded (SSID: {masked})")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        print(f"✅ Connected to {ESP32_PORT}")
    except Exception as e:
        print(f"❌ Cannot connect: {e}")
        return
    
    # Check firmware type
    firmware = check_current_firmware(ser)
    print(f"\n📋 Detected firmware: {firmware}")
    
    if firmware == 'arduino_softap':
        print("\n⚠️  ESP32 is running Arduino firmware in Access Point mode.")
        print("   This firmware doesn't support WiFi client connection via serial.")
        print("\n   Options:")
        print("   1. Flash MicroPython: python flash_micropython.py")
        print("   2. Use Arduino IDE to compile and flash new firmware")
        ser.close()
        return
    
    # Try different methods
    success = False
    
    if firmware == 'micropython' or firmware == 'unknown':
        success = try_micropython(ser, ssid, password)
    
    if not success and firmware != 'micropython':
        success = try_at_commands(ser, ssid, password)
    
    ser.close()
    
    if success:
        print("\n🎉 WiFi Connected Successfully!")
    else:
        print("\n❌ Could not connect to WiFi")
        print("   Try: python flash_micropython.py")


if __name__ == "__main__":
    main()
