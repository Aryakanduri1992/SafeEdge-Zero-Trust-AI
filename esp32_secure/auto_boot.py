"""
SafeEdge ESP32 Auto Boot Script
===============================
This script should be saved as 'boot.py' on the ESP32.
It automatically connects to WiFi when the ESP32 powers on.

To install on ESP32:
    python install_auto_boot.py

Author: SafeEdge Team - Imagine Cup 2026
"""

import network
import time

# WiFi Credentials - loaded from boot.py on ESP32
WIFI_SSID = "Adithya 4G"
WIFI_PASSWORD = "10002000u"

def connect_wifi():
    """Auto-connect to WiFi on boot"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if wlan.isconnected():
        print("WiFi already connected")
        print("IP:", wlan.ifconfig()[0])
        return True
    
    print("Connecting to WiFi...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    
    # Wait for connection (max 20 seconds)
    for i in range(20):
        if wlan.isconnected():
            ip = wlan.ifconfig()[0]
            rssi = wlan.status("rssi")
            print("=" * 40)
            print("WiFi Connected!")
            print(f"IP Address: {ip}")
            print(f"Signal: {rssi} dBm")
            print("=" * 40)
            return True
        print(".", end="")
        time.sleep(1)
    
    print()
    print("WiFi connection failed!")
    return False

# Auto-connect when ESP32 boots
connect_wifi()
