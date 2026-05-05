#!/usr/bin/env python3
"""Check ESP32 WiFi connection status"""

import serial
import time

ESP32_PORT = "/dev/cu.usbserial-0001"

def main():
    ser = serial.Serial(ESP32_PORT, 115200, timeout=2)
    time.sleep(0.5)
    
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.reset_input_buffer()
    
    print("ESP32 WiFi Status")
    print("=" * 40)
    
    ser.write(b'wlan.isconnected()\r\n')
    time.sleep(0.3)
    response = ser.read(500).decode('utf-8', errors='ignore')
    connected = 'True' in response
    print(f"Connected: {'Yes' if connected else 'No'}")
    
    if connected:
        ser.write(b'wlan.ifconfig()[0]\r\n')
        time.sleep(0.3)
        response = ser.read(500).decode('utf-8', errors='ignore')
        for line in response.split('\n'):
            if '.' in line and "'" in line:
                ip = line.strip().strip("'")
                print(f"IP Address: {ip}")
                break
        
        ser.write(b'wlan.status("rssi")\r\n')
        time.sleep(0.3)
        response = ser.read(500).decode('utf-8', errors='ignore')
        for line in response.split('\n'):
            line = line.strip()
            if line.lstrip('-').isdigit():
                print(f"Signal: {line} dBm")
                break
    
    print("=" * 40)
    ser.close()

if __name__ == "__main__":
    main()
