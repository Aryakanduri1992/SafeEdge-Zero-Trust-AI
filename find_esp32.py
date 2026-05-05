#!/usr/bin/env python3
"""
Find ESP32 on Network
Scans for ESP32 HTTP server on common IPs
"""

import requests
import threading
from concurrent.futures import ThreadPoolExecutor

def test_ip(ip):
    """Test if ESP32 is at this IP"""
    try:
        response = requests.get(f"http://{ip}:80", timeout=2)
        if "SafeEdge" in response.text or response.status_code == 200:
            print(f"✅ Found ESP32 at: {ip}")
            return ip
    except:
        pass
    return None

def scan_network():
    """Scan common IP ranges for ESP32"""
    print("🔍 Scanning for ESP32...")
    
    # Common IP ranges
    ip_ranges = [
        "172.20.10.{}",      # Your current network
        "192.168.1.{}",      # Previous network
        "192.168.100.{}",    # Default ESP32 config
        "10.0.0.{}",         # Common router range
    ]
    
    ips_to_test = []
    for ip_range in ip_ranges:
        for i in range(1, 255):
            ips_to_test.append(ip_range.format(i))
    
    # Test IPs in parallel
    with ThreadPoolExecutor(max_workers=50) as executor:
        results = executor.map(test_ip, ips_to_test)
    
    found_ips = [ip for ip in results if ip]
    
    if found_ips:
        print(f"\n🎯 ESP32 found at: {found_ips}")
    else:
        print("\n❌ ESP32 not found on network")
        print("   - Check ESP32 power and connections")
        print("   - Upload updated firmware")
        print("   - Check serial monitor for IP address")

if __name__ == "__main__":
    scan_network()