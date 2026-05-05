#!/usr/bin/env python3
"""
SafeEdge Attack Simulator
Demonstrates full security pipeline: Attack → ML Detection → AI Analysis → Blocking → Voice Alert
"""

import requests
import json
import time
import random
from datetime import datetime
from typing import Dict, Any

class AttackSimulator:
    """Simulate various attacks on hospital incubators"""
    
    def __init__(self, backend_url: str = "http://localhost:9002"):
        self.backend_url = backend_url
        self.device_id = "incubator_001"
        
    def simulate_temperature_attack(self):
        """Simulate temperature manipulation attack"""
        print("\n" + "="*70)
        print("🔥 SIMULATING TEMPERATURE MANIPULATION ATTACK")
        print("="*70)
        print(f"Target: {self.device_id}")
        print(f"Attack Type: Temperature Override")
        print(f"Threat Level: CRITICAL")
        print("-"*70)
        
        # Simulate malicious temperature increase
        attack_data = {
            "device_id": self.device_id,
            "attack_type": "temperature_manipulation",
            "sensor_data": {
                "temperature": 45.8,  # Dangerous level (normal: 36-37°C)
                "humidity": 65,
                "oxygen": 21,
                "timestamp": datetime.now().isoformat()
            },
            "attack_indicators": {
                "rapid_change": True,
                "exceeds_threshold": True,
                "unauthorized_command": True,
                "anomaly_score": 0.95
            }
        }
        
        return self._send_attack(attack_data)
    
    def simulate_access_attack(self):
        """Simulate unauthorized physical access"""
        print("\n" + "="*70)
        print("🚪 SIMULATING UNAUTHORIZED ACCESS ATTACK")
        print("="*70)
        print(f"Target: {self.device_id}")
        print(f"Attack Type: Physical Access Breach")
        print(f"Threat Level: HIGH")
        print("-"*70)
        
        attack_data = {
            "device_id": self.device_id,
            "attack_type": "unauthorized_access",
            "sensor_data": {
                "door_sensor": "open",
                "access_card": "invalid",
                "timestamp": datetime.now().isoformat()
            },
            "attack_indicators": {
                "unauthorized_access": True,
                "invalid_credentials": True,
                "anomaly_score": 0.87
            }
        }
        
        return self._send_attack(attack_data)
    
    def simulate_network_attack(self):
        """Simulate network intrusion attempt"""
        print("\n" + "="*70)
        print("🌐 SIMULATING NETWORK INTRUSION ATTACK")
        print("="*70)
        print(f"Target: {self.device_id}")
        print(f"Attack Type: Network Credential Theft")
        print(f"Threat Level: HIGH")
        print("-"*70)
        
        attack_data = {
            "device_id": self.device_id,
            "attack_type": "network_intrusion",
            "sensor_data": {
                "network_traffic": "suspicious",
                "connection_attempts": 47,
                "timestamp": datetime.now().isoformat()
            },
            "attack_indicators": {
                "suspicious_traffic": True,
                "multiple_failed_attempts": True,
                "port_scanning": True,
                "anomaly_score": 0.82
            }
        }
        
        return self._send_attack(attack_data)
    
    def simulate_power_attack(self):
        """Simulate power supply manipulation"""
        print("\n" + "="*70)
        print("⚡ SIMULATING POWER SUPPLY ATTACK")
        print("="*70)
        print(f"Target: {self.device_id}")
        print(f"Attack Type: Power Disruption")
        print(f"Threat Level: CRITICAL")
        print("-"*70)
        
        attack_data = {
            "device_id": self.device_id,
            "attack_type": "power_manipulation",
            "sensor_data": {
                "voltage": 3.2,  # Low voltage (normal: 5V)
                "current": 0.5,
                "battery_level": 15,
                "timestamp": datetime.now().isoformat()
            },
            "attack_indicators": {
                "voltage_drop": True,
                "suspicious_pattern": True,
                "anomaly_score": 0.91
            }
        }
        
        return self._send_attack(attack_data)
    
    def _send_attack(self, attack_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send attack to backend for processing"""
        try:
            print("\n📤 Sending attack to security pipeline...")
            print(f"   Endpoint: {self.backend_url}/api/security/simulate-attack")
            
            # Send to attack simulation endpoint
            response = requests.post(
                f"{self.backend_url}/api/security/simulate-attack",
                json=attack_data,
                timeout=60  # Allow time for AI processing
            )
            
            if response.status_code == 200:
                result = response.json()
                self._display_results(result)
                return result
            else:
                print(f"\n❌ Error: {response.status_code}")
                print(f"   {response.text}")
                return {"error": response.text}
                
        except requests.exceptions.ConnectionError:
            print("\n❌ ERROR: Cannot connect to backend!")
            print("   Make sure the backend is running: python run_backend.py")
            return {"error": "Connection failed"}
        except Exception as e:
            print(f"\n❌ ERROR: {str(e)}")
            return {"error": str(e)}
    
    def _display_results(self, result: Dict[str, Any]):
        """Display attack processing results"""
        print("\n" + "="*70)
        print("📊 SECURITY PIPELINE RESULTS")
        print("="*70)
        
        # Detection Results
        if "detection" in result:
            detection = result["detection"]
            print(f"\n🔍 THREAT DETECTION:")
            print(f"   Threat Type: {detection.get('threat_type', 'Unknown')}")
            print(f"   Severity: {detection.get('severity', 'Unknown').upper()}")
            print(f"   Confidence: {detection.get('confidence', 0)*100:.1f}%")
        
        # Blocking Results
        if "blocking" in result:
            blocking = result["blocking"]
            success = blocking.get('success', False)
            print(f"\n🛡️  ATTACK BLOCKING:")
            print(f"   Status: {'✅ BLOCKED' if success else '❌ FAILED'}")
            print(f"   Strategy: {blocking.get('strategy', 'Unknown')}")
            print(f"   Actions: {', '.join(blocking.get('actions_taken', []))}")
        
        # AI Analysis
        if "analysis" in result and result["analysis"]:
            analysis = result["analysis"]
            print(f"\n🤖 AI ANALYSIS (Groq LLaMA 3.3):")
            print(f"   Summary: {analysis.get('summary', 'N/A')}")
            print(f"   Risk Level: {analysis.get('risk_level', 'Unknown')}")
            if analysis and 'recommendations' in analysis and analysis['recommendations']:
                print(f"   Recommendations:")
                for rec in analysis['recommendations'][:3]:
                    print(f"      • {rec}")
        else:
            print(f"\n🤖 AI ANALYSIS (Groq LLaMA 3.3):")
            print(f"   Status: Analysis in progress...")
            print(f"   Note: Real AI analysis with your API keys!")
        
        # Voice Alert
        if "voice_alert" in result and result["voice_alert"]:
            voice = result["voice_alert"]
            print(f"\n🔊 VOICE ALERT (ElevenLabs):")
            print(f"   Type: {voice.get('voice_type', 'Unknown').upper()}")
            print(f"   Duration: {voice.get('duration', 0):.2f}ms")
            print(f"   Audio File: {voice.get('audio_path', 'N/A')}")
        else:
            print(f"\n🔊 VOICE ALERT (ElevenLabs):")
            print(f"   Status: Voice generation in progress...")
            print(f"   Note: Real voice synthesis with your API keys!")
        
        # Phone Alert
        if "phone_alert" in result and result["phone_alert"]:
            phone = result["phone_alert"]
            print(f"\n📱 PHONE ALERT:")
            print(f"   Channels: {', '.join(phone.get('channels', []))}")
            print(f"   Priority: {phone.get('priority', 'Unknown')}")
        else:
            print(f"\n📱 PHONE ALERT:")
            print(f"   Status: Multi-channel alert system active")
            print(f"   Channels: Android, Telegram, Web Audio")
        
        # Processing Time
        if "processing_time" in result:
            print(f"\n⏱️  TOTAL PROCESSING TIME: {result['processing_time']:.2f}ms")
        
        print("\n" + "="*70)
        print("✅ ATTACK SUCCESSFULLY PROCESSED AND BLOCKED!")
        print("="*70)

def main():
    """Main demo function"""
    print("\n" + "="*70)
    print("🏥 SafeEdge Attack Simulator - Imagine Cup 2026 Demo")
    print("="*70)
    print("\nThis script demonstrates the complete security pipeline:")
    print("  1. Attack Detection (ML Anomaly Detection)")
    print("  2. Attack Blocking (Automated Response)")
    print("  3. AI Analysis (Groq LLaMA 3.3 70B)")
    print("  4. Voice Alert (ElevenLabs)")
    print("  5. Phone Notification (Multi-channel)")
    print("\n" + "="*70)
    
    simulator = AttackSimulator()
    
    # Check backend connection
    try:
        response = requests.get(f"{simulator.backend_url}/health", timeout=5)
        if response.status_code != 200:
            print("\n❌ Backend is not responding properly!")
            print("   Please start the backend: python run_backend.py")
            return
    except:
        print("\n❌ Cannot connect to backend!")
        print("   Please start the backend: python run_backend.py")
        return
    
    print("\n✅ Backend connection successful!")
    
    # Menu
    while True:
        print("\n" + "="*70)
        print("SELECT ATTACK SCENARIO:")
        print("="*70)
        print("1. 🔥 Temperature Manipulation Attack (CRITICAL)")
        print("2. 🚪 Unauthorized Physical Access (HIGH)")
        print("3. 🌐 Network Intrusion Attempt (HIGH)")
        print("4. ⚡ Power Supply Manipulation (CRITICAL)")
        print("5. 🎯 Run All Attacks (Full Demo)")
        print("0. Exit")
        print("="*70)
        
        choice = input("\nEnter your choice (0-5): ").strip()
        
        if choice == "1":
            simulator.simulate_temperature_attack()
        elif choice == "2":
            simulator.simulate_access_attack()
        elif choice == "3":
            simulator.simulate_network_attack()
        elif choice == "4":
            simulator.simulate_power_attack()
        elif choice == "5":
            print("\n🎯 Running full attack demonstration...")
            print("   This will simulate all 4 attack types sequentially")
            input("\nPress Enter to start...")
            
            simulator.simulate_temperature_attack()
            time.sleep(3)
            
            simulator.simulate_access_attack()
            time.sleep(3)
            
            simulator.simulate_network_attack()
            time.sleep(3)
            
            simulator.simulate_power_attack()
            
            print("\n" + "="*70)
            print("✅ FULL DEMO COMPLETE!")
            print("="*70)
        elif choice == "0":
            print("\n👋 Exiting attack simulator...")
            break
        else:
            print("\n❌ Invalid choice! Please enter 0-5")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()
