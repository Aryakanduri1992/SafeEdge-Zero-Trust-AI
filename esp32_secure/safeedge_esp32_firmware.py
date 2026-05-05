"""
SafeEdge ESP32 MicroPython Firmware
===================================
Complete firmware for ESP32 with:
- WiFi connection (from secret file)
- LED indicators (Red, Yellow, Green)
- Buzzer alerts
- HTTP communication with SafeEdge backend
- Real-time sensor simulation
- Security status reporting

Hardware Connections:
- Red LED: GPIO 25 (Danger/Attack)
- Yellow LED: GPIO 26 (Warning/Processing)
- Green LED: GPIO 27 (Safe/Connected)
- Buzzer: GPIO 32

Author: SafeEdge Team - Imagine Cup 2026
"""

import network
import time
import json
import urequests
import machine
from machine import Pin, PWM

# ==================== CONFIGURATION ====================
BACKEND_URL = "http://192.168.29.192:9002"  # Update with your backend IP
DEVICE_ID = "esp32_safeedge_001"
REPORT_INTERVAL = 5  # seconds

# ==================== PIN CONFIGURATION ====================
LED_RED = Pin(25, Pin.OUT)      # Danger - Attack detected
LED_YELLOW = Pin(26, Pin.OUT)   # Warning - Processing
LED_GREEN = Pin(27, Pin.OUT)    # Safe - All good
BUZZER = PWM(Pin(32))           # Buzzer for audio alerts

# ==================== GLOBAL STATE ====================
wifi_connected = False
backend_connected = False
current_status = "initializing"
signal_strength = 0

# ==================== LED CONTROL ====================
def set_leds(red=False, yellow=False, green=False):
    """Control LED states"""
    LED_RED.value(1 if red else 0)
    LED_YELLOW.value(1 if yellow else 0)
    LED_GREEN.value(1 if green else 0)

def blink_led(led, times=3, delay_ms=200):
    """Blink a specific LED"""
    for _ in range(times):
        led.value(1)
        time.sleep_ms(delay_ms)
        led.value(0)
        time.sleep_ms(delay_ms)

def status_safe():
    """Green LED - System is safe"""
    set_leds(green=True)

def status_warning():
    """Yellow LED - Warning/Processing"""
    set_leds(yellow=True)

def status_danger():
    """Red LED - Danger/Attack"""
    set_leds(red=True)

def status_all_off():
    """Turn off all LEDs"""
    set_leds()

# ==================== BUZZER CONTROL ====================
def buzzer_off():
    """Turn off buzzer"""
    BUZZER.duty(0)

def buzzer_beep(freq=1000, duration_ms=200):
    """Single beep"""
    BUZZER.freq(freq)
    BUZZER.duty(512)
    time.sleep_ms(duration_ms)
    buzzer_off()

def buzzer_alert_warning():
    """Warning alert - 2 short beeps"""
    for _ in range(2):
        buzzer_beep(800, 150)
        time.sleep_ms(100)

def buzzer_alert_danger():
    """Danger alert - continuous alarm"""
    for _ in range(5):
        buzzer_beep(1200, 100)
        time.sleep_ms(50)
        buzzer_beep(800, 100)
        time.sleep_ms(50)

def buzzer_success():
    """Success sound - ascending tones"""
    buzzer_beep(500, 100)
    buzzer_beep(700, 100)
    buzzer_beep(900, 150)

# ==================== WIFI CONNECTION ====================
def connect_wifi(ssid, password):
    """Connect to WiFi network"""
    global wifi_connected, signal_strength
    
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    
    if wlan.isconnected():
        signal_strength = wlan.status("rssi")
        wifi_connected = True
        return True
    
    print(f"Connecting to WiFi: {ssid[:3]}***")
    status_warning()
    
    wlan.connect(ssid, password)
    
    for i in range(20):
        if wlan.isconnected():
            wifi_connected = True
            signal_strength = wlan.status("rssi")
            ip = wlan.ifconfig()[0]
            print(f"WiFi Connected! IP: {ip}, Signal: {signal_strength} dBm")
            status_safe()
            buzzer_success()
            return True
        time.sleep(1)
        blink_led(LED_YELLOW, 1, 100)
    
    wifi_connected = False
    status_danger()
    buzzer_alert_warning()
    print("WiFi connection failed!")
    return False

def get_wifi_info():
    """Get current WiFi information"""
    global signal_strength
    wlan = network.WLAN(network.STA_IF)
    if wlan.isconnected():
        signal_strength = wlan.status("rssi")
        return {
            "connected": True,
            "ip": wlan.ifconfig()[0],
            "signal_strength": signal_strength,
            "mac": ':'.join(['%02x' % b for b in wlan.config('mac')])
        }
    return {"connected": False}

# ==================== SENSOR SIMULATION ====================
def read_sensors():
    """Read/simulate sensor data for NICU monitoring"""
    import random
    
    # Simulate realistic NICU sensor values
    base_temp = 36.8
    base_humidity = 55.0
    
    # Add small variations
    temperature = base_temp + (random.random() - 0.5) * 0.6
    humidity = base_humidity + (random.random() - 0.5) * 5
    
    # Simulate other sensors
    oxygen_level = 21.0 + random.random() * 0.5
    co2_level = 0.04 + random.random() * 0.01
    air_pressure = 1013.25 + (random.random() - 0.5) * 5
    
    # Security sensors
    motion_detected = random.random() < 0.05  # 5% chance
    door_open = random.random() < 0.02  # 2% chance
    vibration = random.random() * 0.3
    sound_level = 30 + random.random() * 20
    
    # Power monitoring
    power_voltage = 12.0 + (random.random() - 0.5) * 0.5
    
    # Calculate threat level
    threat_level = "safe"
    anomaly_detected = False
    security_score = 100
    
    if temperature < 36.5 or temperature > 37.5:
        threat_level = "critical"
        anomaly_detected = True
        security_score -= 30
    
    if humidity < 50 or humidity > 60:
        if threat_level == "safe":
            threat_level = "warning"
        anomaly_detected = True
        security_score -= 20
    
    if motion_detected or door_open:
        if threat_level == "safe":
            threat_level = "warning"
        anomaly_detected = True
        security_score -= 15
    
    return {
        "device_id": DEVICE_ID,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 1),
        "air_pressure": round(air_pressure, 2),
        "oxygen_level": round(oxygen_level, 2),
        "co2_level": round(co2_level, 4),
        "motion_detected": motion_detected,
        "vibration_level": round(vibration, 3),
        "door_status": door_open,
        "sound_level": round(sound_level, 1),
        "power_voltage": round(power_voltage, 2),
        "wifi_signal_strength": signal_strength,
        "system_temperature": 45 + random.random() * 10,
        "threat_level": threat_level,
        "anomaly_detected": anomaly_detected,
        "security_score": max(0, security_score)
    }

# ==================== BACKEND COMMUNICATION ====================
def send_to_backend(endpoint, data):
    """Send data to SafeEdge backend"""
    global backend_connected
    
    try:
        url = f"{BACKEND_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        response = urequests.post(url, json=data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            backend_connected = True
            result = response.json()
            response.close()
            return result
        else:
            backend_connected = False
            response.close()
            return None
            
    except Exception as e:
        backend_connected = False
        print(f"Backend error: {e}")
        return None

def register_device():
    """Register ESP32 with backend"""
    wifi_info = get_wifi_info()
    
    data = {
        "device_id": DEVICE_ID,
        "device_type": "ESP32_NICU_Monitor",
        "firmware_version": "2.0.0",
        "wifi_connected": wifi_info.get("connected", False),
        "ip_address": wifi_info.get("ip", ""),
        "signal_strength": wifi_info.get("signal_strength", 0),
        "mac_address": wifi_info.get("mac", ""),
        "capabilities": ["temperature", "humidity", "motion", "door", "buzzer", "leds"]
    }
    
    result = send_to_backend("/api/esp32/register", data)
    
    if result:
        print(f"Device registered: {DEVICE_ID}")
        return True
    return False

def send_sensor_data():
    """Send sensor data to backend"""
    sensor_data = read_sensors()
    
    # Update LED based on threat level
    threat = sensor_data.get("threat_level", "safe")
    
    if threat == "critical":
        status_danger()
        buzzer_alert_danger()
    elif threat == "warning":
        status_warning()
        buzzer_alert_warning()
    else:
        status_safe()
    
    # Send to backend
    result = send_to_backend("/api/sensor-data", sensor_data)
    
    if result:
        print(f"Data sent - Threat: {threat}, Score: {sensor_data['security_score']}")
        
        # Check if backend wants us to trigger alert
        if result.get("trigger_alert"):
            handle_alert(result.get("alert_type", "warning"))
    
    return result

def send_heartbeat():
    """Send heartbeat to backend"""
    wifi_info = get_wifi_info()
    
    data = {
        "device_id": DEVICE_ID,
        "status": "online",
        "wifi_connected": wifi_info.get("connected", False),
        "signal_strength": wifi_info.get("signal_strength", 0),
        "uptime": time.ticks_ms() // 1000
    }
    
    return send_to_backend("/api/esp32/heartbeat", data)

# ==================== ALERT HANDLING ====================
def handle_alert(alert_type):
    """Handle alert from backend"""
    print(f"Alert received: {alert_type}")
    
    if alert_type == "critical" or alert_type == "danger":
        status_danger()
        buzzer_alert_danger()
    elif alert_type == "warning":
        status_warning()
        buzzer_alert_warning()
    else:
        status_safe()

def simulate_attack(attack_type="temperature_spike"):
    """Simulate an attack for demo purposes"""
    print(f"Simulating attack: {attack_type}")
    
    # Visual feedback
    status_danger()
    buzzer_alert_danger()
    
    # Create attack data
    attack_data = {
        "device_id": DEVICE_ID,
        "attack_type": attack_type,
        "timestamp": time.time(),
        "sensor_data": read_sensors()
    }
    
    # Override with attack values
    if attack_type == "temperature_spike":
        attack_data["sensor_data"]["temperature"] = 42.5
        attack_data["sensor_data"]["threat_level"] = "critical"
        attack_data["sensor_data"]["anomaly_detected"] = True
    elif attack_type == "unauthorized_access":
        attack_data["sensor_data"]["motion_detected"] = True
        attack_data["sensor_data"]["door_status"] = True
        attack_data["sensor_data"]["threat_level"] = "critical"
    elif attack_type == "power_failure":
        attack_data["sensor_data"]["power_voltage"] = 8.5
        attack_data["sensor_data"]["threat_level"] = "critical"
    
    # Send to security endpoint
    result = send_to_backend("/api/security/simulate-attack", attack_data)
    
    # Return to normal after 5 seconds
    time.sleep(5)
    status_safe()
    
    return result

# ==================== MAIN LOOP ====================
def main():
    """Main firmware loop"""
    global current_status
    
    print("=" * 50)
    print("SafeEdge ESP32 Firmware v2.0")
    print("Imagine Cup 2026 - Hospital IoT Security")
    print("=" * 50)
    
    # Initialize LEDs
    status_all_off()
    blink_led(LED_GREEN, 3, 100)
    
    # Load WiFi credentials
    try:
        with open("boot.py", "r") as f:
            content = f.read()
            # Extract credentials from boot.py
            import re
            ssid_match = re.search(r'ssid = "([^"]+)"', content)
            pass_match = re.search(r'password = "([^"]+)"', content)
            
            if ssid_match and pass_match:
                ssid = ssid_match.group(1)
                password = pass_match.group(1)
            else:
                print("Could not extract WiFi credentials")
                return
    except:
        # Fallback - try to use existing connection
        wlan = network.WLAN(network.STA_IF)
        if not wlan.isconnected():
            print("No WiFi credentials found")
            status_danger()
            return
    
    # Connect to WiFi
    if not connect_wifi(ssid, password):
        print("Failed to connect to WiFi")
        return
    
    # Register with backend
    print("Registering with SafeEdge backend...")
    if register_device():
        print("Registration successful!")
        buzzer_success()
    else:
        print("Registration failed - running in offline mode")
    
    current_status = "running"
    print("\nStarting sensor monitoring loop...")
    print("Press Ctrl+C to stop\n")
    
    heartbeat_counter = 0
    
    while True:
        try:
            # Send sensor data
            send_sensor_data()
            
            # Send heartbeat every 30 seconds
            heartbeat_counter += 1
            if heartbeat_counter >= 6:  # 6 * 5 seconds = 30 seconds
                send_heartbeat()
                heartbeat_counter = 0
            
            time.sleep(REPORT_INTERVAL)
            
        except KeyboardInterrupt:
            print("\nStopping...")
            status_all_off()
            buzzer_off()
            break
        except Exception as e:
            print(f"Error: {e}")
            status_warning()
            time.sleep(5)

# Run if executed directly
if __name__ == "__main__":
    main()
