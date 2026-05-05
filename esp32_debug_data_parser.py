#!/usr/bin/env python3
"""
ESP32 Debug Data Parser
======================
Check what data format ESP32 is actually receiving
"""

import requests
import json
from laptop2_web_complete import encryption_service, DEVICE_ID

def test_data_formats():
    print("🔍 ESP32 Data Format Debug")
    print("=" * 50)
    
    # Test 1: What web interface sends (encrypted)
    print("📤 Test 1: Web Interface Data (Encrypted)")
    attack_data = {
        "device_id": DEVICE_ID,
        "timestamp": "2026-04-21T10:00:00",
        "temperature": 45.0,  # ATTACK
        "threat_level": "critical",
        "security_score": 20
    }
    
    encrypted_payload = encryption_service.encrypt_sensor_data(attack_data, DEVICE_ID)
    print("   Original data:", json.dumps(attack_data, indent=2))
    print("   Encrypted keys:", list(encrypted_payload.keys()))
    print("   ESP32 receives:", json.dumps(encrypted_payload, indent=2)[:200] + "...")
    
    # Test 2: What ESP32 expects (plain JSON)
    print("\n📥 Test 2: What ESP32 Attack Detection Expects")
    print("   Looking for: \"temperature\": 45.0")
    print("   Looking for: \"threat_level\": \"critical\"")
    print("   Looking for: \"security_score\": 20")
    print("   But gets: encrypted_data, salt, iv, tag...")
    
    print("\n🚨 PROBLEM IDENTIFIED:")
    print("   ❌ Web sends: ENCRYPTED data")
    print("   ❌ ESP32 expects: PLAIN JSON data")
    print("   ❌ Attack detection fails: Can't find temperature in encrypted data")
    
    return encrypted_payload, attack_data

def test_plain_data_to_esp32():
    """Test sending plain JSON directly to ESP32"""
    print("\n🧪 Test 3: Send Plain JSON to ESP32")
    print("=" * 50)
    
    # Send plain JSON (what ESP32 can parse)
    plain_attack_data = {
        "device_id": "debug_test",
        "timestamp": "2026-04-21T10:00:00",
        "temperature": 45.0,  # ATTACK - should trigger RED LED
        "threat_level": "critical",
        "security_score": 20
    }
    
    print("📤 Sending PLAIN JSON to ESP32:")
    print(json.dumps(plain_attack_data, indent=2))
    
    try:
        response = requests.post(
            "http://172.20.10.10:80/api/sensor-data",
            json=plain_attack_data,
            timeout=10
        )
        print(f"📥 ESP32 Response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Plain JSON sent successfully")
            print("👀 Check ESP32 Serial Monitor - should show ATTACK DETECTED!")
            return True
        else:
            print(f"⚠️ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Test data formats
    encrypted_payload, attack_data = test_data_formats()
    
    # Test plain JSON
    input("\nPress ENTER to test plain JSON (should trigger RED LED)...")
    success = test_plain_data_to_esp32()
    
    if success:
        input("👀 Did the RED LED turn ON? Press ENTER...")
        
        print("\n" + "=" * 50)
        print("📋 SOLUTION:")
        print("=" * 50)
        print("The ESP32 needs to DECRYPT the data before parsing!")
        print()
        print("Options:")
        print("1. 🔓 Add decryption to ESP32 (complex)")
        print("2. 📡 Send plain JSON for testing (simple)")
        print("3. 🔄 Modify web interface to send both formats")
        print("=" * 50)
    else:
        print("\n❌ ESP32 connection issue - check Ethernet cable")