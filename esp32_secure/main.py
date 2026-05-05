"""
SafeEdge ESP32 Main Firmware (MicroPython)
==========================================
Simplified firmware for ESP32 with:
- WiFi connection
- LED indicators (simulated via print)
- HTTP communication with backend
- Sensor data simulation

Run this on ESP32 after boot.py connects to WiFi.
"""

import network
import time
import json

# Try to import urequests, fall back to basic socket if not available
try:
    import urequests
    HAS_UREQUESTS = True
except ImportError:
    import socket
    HAS_UREQUESTS = False

# ==================== CONFIGURATION ====================
BACKEND_HOST = "192.168.29.192"  # Your computer's IP on the network
BACKEND_PORT = 9002  # Next.js server port
DEVICE_ID = "esp32_safeedge_001"
REPORT_INTERVAL = 5  # seconds

# ==================== HELPER FUNCTIONS ====================

def get_wifi_info():
    """Get WiFi connection info"""
    wlan = network.WLAN(network.STA_IF)
    if wlan.isconnected():
        return {
            "connected": True,
            "ip": wlan.ifconfig()[0],
            "signal": wlan.status("rssi")
        }
    return {"connected": False, "ip": "", "signal": 0}

def generate_sensor_data():
    """Generate simulated sensor data"""
    import random
    
    # Base values for NICU monitoring
    temp = 36.8 + (random.random() - 0.5) * 0.6
    humidity = 55 + (random.random() - 0.5) * 5
    
    # Determine threat level
    threat = "safe"
    score = 100
    anomaly = False
    
    if temp < 36.5 or temp > 37.5:
        threat = "critical"
        score -= 30
        anomaly = True
    
    if humidity < 50 or humidity > 60:
        if threat == "safe":
            threat = "warning"
        score -= 20
        anomaly = True
    
    wifi = get_wifi_info()
    
    return {
        "device_id": DEVICE_ID,
        "temperature": round(temp, 2),
        "humidity": round(humidity, 1),
        "air_pressure": round(1013 + (random.random() - 0.5) * 5, 2),
        "oxygen_level": round(21 + random.random() * 0.5, 2),
        "motion_detected": random.random() < 0.05,
        "door_status": random.random() < 0.02,
        "vibration_level": round(random.random() * 0.3, 3),
        "power_voltage": round(12 + (random.random() - 0.5) * 0.5, 2),
        "wifi_signal_strength": wifi["signal"],
        "threat_level": threat,
        "anomaly_detected": anomaly,
        "security_score": max(0, score)
    }

def http_post(path, data):
    """Send HTTP POST request to backend"""
    if HAS_UREQUESTS:
        try:
            url = f"http://{BACKEND_HOST}:{BACKEND_PORT}{path}"
            response = urequests.post(
                url,
                json=data,
                headers={"Content-Type": "application/json"}
            )
            result = response.json()
            response.close()
            return result
        except Exception as e:
            print(f"HTTP Error: {e}")
            return None
    else:
        # Basic socket implementation
        try:
            addr = socket.getaddrinfo(BACKEND_HOST, BACKEND_PORT)[0][-1]
            s = socket.socket()
            s.connect(addr)
            
            body = json.dumps(data)
            request = f"POST {path} HTTP/1.1\r\n"
            request += f"Host: {BACKEND_HOST}:{BACKEND_PORT}\r\n"
            request += "Content-Type: application/json\r\n"
            request += f"Content-Length: {len(body)}\r\n"
            request += "\r\n"
            request += body
            
            s.send(request.encode())
            response = s.recv(1024).decode()
            s.close()
            
            # Parse response (basic)
            if "200 OK" in response:
                return {"success": True}
            return None
        except Exception as e:
            print(f"Socket Error: {e}")
            return None

def register_device():
    """Register device with backend"""
    wifi = get_wifi_info()
    
    data = {
        "device_id": DEVICE_ID,
        "device_type": "ESP32_NICU_Monitor",
        "firmware_version": "2.0.0",
        "wifi_connected": wifi["connected"],
        "ip_address": wifi["ip"],
        "signal_strength": wifi["signal"],
        "mac_address": "",
        "capabilities": ["temperature", "humidity", "motion"]
    }
    
    result = http_post("/api/esp32/register", data)
    return result is not None

def send_sensor_data():
    """Send sensor data to backend"""
    data = generate_sensor_data()
    
    # Print status
    threat = data["threat_level"]
    score = data["security_score"]
    
    if threat == "critical":
        print(f"🔴 DANGER - Score: {score}")
    elif threat == "warning":
        print(f"🟡 WARNING - Score: {score}")
    else:
        print(f"🟢 SAFE - Score: {score}")
    
    result = http_post("/api/sensor-data", data)
    
    if result:
        print(f"   Data sent: Temp={data['temperature']}°C")
    else:
        print("   Failed to send data")
    
    return result

def send_heartbeat():
    """Send heartbeat to backend"""
    wifi = get_wifi_info()
    
    data = {
        "device_id": DEVICE_ID,
        "status": "online",
        "wifi_connected": wifi["connected"],
        "signal_strength": wifi["signal"],
        "uptime": time.ticks_ms() // 1000
    }
    
    return http_post("/api/esp32/heartbeat", data)

# ==================== MAIN LOOP ====================

def main():
    """Main firmware loop"""
    print("=" * 40)
    print("SafeEdge ESP32 Firmware v2.0")
    print("Imagine Cup 2026")
    print("=" * 40)
    
    # Check WiFi
    wifi = get_wifi_info()
    if not wifi["connected"]:
        print("WiFi not connected!")
        print("Run boot.py first or check credentials")
        return
    
    print(f"WiFi Connected: {wifi['ip']}")
    print(f"Signal: {wifi['signal']} dBm")
    
    # Register with backend
    print("\nRegistering with backend...")
    if register_device():
        print("Registration successful!")
    else:
        print("Registration failed - running offline")
    
    print("\nStarting sensor loop...")
    print("Press Ctrl+C to stop\n")
    
    heartbeat_count = 0
    
    # Send initial heartbeat immediately
    send_heartbeat()
    
    while True:
        try:
            # Send sensor data
            send_sensor_data()
            
            # Heartbeat every 15 seconds (3 iterations of 5-second intervals)
            heartbeat_count += 1
            if heartbeat_count >= 3:
                send_heartbeat()
                heartbeat_count = 0
            
            time.sleep(REPORT_INTERVAL)
            
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(5)

# Auto-run
if __name__ == "__main__":
    main()
