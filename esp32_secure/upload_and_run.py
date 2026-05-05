#!/usr/bin/env python3
"""
Upload and Run SafeEdge Firmware on ESP32
=========================================
Uploads main.py to ESP32 and runs it.
"""

import serial
import time
import os
import subprocess
import socket

ESP32_PORT = "/dev/cu.usbserial-0001"
BAUD_RATE = 115200

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

def upload_file(ser, filename, content):
    """Upload a file to ESP32"""
    print(f"Uploading {filename}...")
    
    # Interrupt any running code
    ser.write(b'\x03')
    time.sleep(0.3)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.reset_input_buffer()
    
    # Create file
    ser.write(f'f = open("{filename}", "w")\r\n'.encode())
    time.sleep(0.2)
    ser.read(500)
    
    # Write content line by line
    for line in content.split('\n'):
        # Escape quotes and backslashes
        escaped = line.replace('\\', '\\\\').replace('"', '\\"')
        ser.write(f'f.write("{escaped}\\n")\r\n'.encode())
        time.sleep(0.05)
        ser.read(500)
    
    # Close file
    ser.write(b'f.close()\r\n')
    time.sleep(0.2)
    ser.read(500)
    
    print(f"  {filename} uploaded")

def main():
    print("=" * 50)
    print("SafeEdge ESP32 Firmware Uploader")
    print("=" * 50)
    
    # Get local IP
    local_ip = get_local_ip()
    print(f"Your computer's IP: {local_ip}")
    
    # Read main.py
    with open("main.py", "r") as f:
        firmware_code = f.read()
    
    # Update backend IP in firmware
    firmware_code = firmware_code.replace(
        'BACKEND_HOST = "192.168.29.1"',
        f'BACKEND_HOST = "{local_ip}"'
    )
    
    print(f"\nConnecting to ESP32 at {ESP32_PORT}...")
    
    try:
        ser = serial.Serial(ESP32_PORT, BAUD_RATE, timeout=2)
        time.sleep(1)
        print("Connected!")
        
        # Upload firmware
        upload_file(ser, "safeedge.py", firmware_code)
        
        # Run firmware
        print("\nStarting firmware...")
        ser.write(b'\x03')
        time.sleep(0.3)
        ser.reset_input_buffer()
        
        ser.write(b'exec(open("safeedge.py").read())\r\n')
        time.sleep(1)
        
        # Monitor output
        print("\n--- ESP32 Output ---")
        print("(Press Ctrl+C to stop monitoring)\n")
        
        while True:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    print(line)
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n\nStopped monitoring")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'ser' in locals():
            ser.close()

if __name__ == "__main__":
    main()
