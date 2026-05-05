#!/usr/bin/env python3
"""
TwiML-Based Voice Alert System for SafeEdge
✅ Uses TwiML Apps - No trial messages
✅ Professional call handling
✅ Interactive voice responses
✅ Perfect for Imagine Cup 2026
"""

import os
import requests
import json
import time
from datetime import datetime
from dotenv import load_dotenv

# Load configuration
load_dotenv('.env')

class TwiMLVoiceAlerts:
    def __init__(self, twiml_app_sid=None, webhook_base_url=None):
        # Twilio Configuration
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_from = os.getenv('TWILIO_FROM_NUMBER')
        
        # TwiML App Configuration
        self.twiml_app_sid = twiml_app_sid or os.getenv('TWIML_APP_SID')
        self.webhook_base_url = webhook_base_url or os.getenv('WEBHOOK_BASE_URL', 'https://your-domain.com')
        
        # Emergency Contacts
        self.emergency_contacts = self.load_emergency_contacts()
        
        print(f"🎙️  TwiML Voice Alert System Initialized")
        print(f"📞 Twilio: {'✅ Ready' if self.is_configured() else '❌ Not Configured'}")
        print(f"📱 TwiML App: {'✅ Configured' if self.twiml_app_sid else '❌ Not Set'}")
        print(f"🌐 Webhook: {self.webhook_base_url}")
        print(f"📋 Emergency Contacts: {len(self.emergency_contacts)}")
    
    def load_emergency_contacts(self):
        """Load emergency contacts"""
        contacts = []
        env_contacts = os.getenv('EMERGENCY_CONTACTS', '')
        if env_contacts:
            contacts = [c.strip() for c in env_contacts.split(',') if c.strip()]
        return contacts
    
    def is_configured(self):
        """Check if system is configured"""
        return all([self.twilio_sid, self.twilio_token, self.twilio_from])
    
    def update_webhook_alert(self, message, threat_level='normal', device_id=None, location=None):
        """Update the alert message on the webhook server"""
        try:
            url = f"{self.webhook_base_url}/api/update-alert"
            
            data = {
                'message': message,
                'threat_level': threat_level,
                'device_id': device_id,
                'location': location
            }
            
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ Webhook alert updated successfully")
                return True
            else:
                print(f"❌ Failed to update webhook: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Webhook update error: {e}")
            return False
    
    def make_twiml_call(self, phone_number, message, threat_level='normal'):
        """Make call using TwiML App"""
        try:
            print(f"\n📞 MAKING TWIML CALL TO: {phone_number}")
            print(f"📢 MESSAGE: {message}")
            print("-" * 60)
            
            if not self.is_configured():
                print("❌ Twilio not configured")
                return False
            
            # Update webhook with current alert
            self.update_webhook_alert(message, threat_level)
            
            # Make call using TwiML App
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Calls.json"
            
            data = {
                'To': phone_number,
                'From': self.twilio_from,
                'ApplicationSid': self.twiml_app_sid  # Use TwiML App instead of TwiML
            }
            
            print("📞 Initiating TwiML App call...")
            response = requests.post(
                url,
                data=data,
                auth=(self.twilio_sid, self.twilio_token),
                timeout=30
            )
            
            if response.status_code == 201:
                call_data = response.json()
                print(f"✅ TwiML call initiated successfully!")
                print(f"📞 Call SID: {call_data.get('sid')}")
                print(f"📱 Status: {call_data.get('status')}")
                print(f"🎙️  Voice: Professional TwiML App (No Trial Message)")
                print(f"🔧 App SID: {self.twiml_app_sid}")
                return True
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', 'Unknown error')
                except:
                    error_message = response.text
                
                print(f"❌ Call failed: {error_message}")
                return False
                
        except Exception as e:
            print(f"❌ TwiML call error: {e}")
            return False
    
    def send_hospital_security_alert(self, threat_type, severity, details, device_id=None, location=None):
        """Send hospital security alert using TwiML"""
        timestamp = datetime.now().strftime('%H:%M on %B %d')
        device_info = f"device {device_id}" if device_id else "system"
        location_info = f" in {location}" if location else ""
        
        # Hospital security alert messages
        hospital_alerts = {
            'temperature_attack': f"CRITICAL PATIENT SAFETY ALERT. Temperature attack on incubator {device_info}{location_info} detected and blocked at {timestamp}. Patient safety maintained. Normal temperature restored automatically. {details}",
            
            'power_attack': f"EMERGENCY INFRASTRUCTURE ALERT. Power system attack on medical equipment {device_info}{location_info} blocked at {timestamp}. All life support systems remain operational. Backup power systems activated. {details}",
            
            'unauthorized_access': f"SECURITY BREACH PREVENTED. Unauthorized access attempt to {device_info}{location_info} blocked at {timestamp}. All patient areas remain secure. Access logs updated. {details}",
            
            'network_intrusion': f"CYBER ATTACK STOPPED. Network intrusion targeting medical systems {device_info}{location_info} prevented at {timestamp}. All hospital networks protected. Firewall rules updated. {details}",
            
            'malware': f"MALWARE THREAT ELIMINATED. Virus attack on hospital systems {device_info}{location_info} stopped at {timestamp}. All patient data remains secure. Infected systems quarantined. {details}",
            
            'brute_force': f"HACKING ATTEMPT BLOCKED. Multiple unauthorized login attempts on {device_info}{location_info} prevented at {timestamp}. All hospital systems remain secure. Security protocols activated. {details}",
            
            'motion_detected': f"PHYSICAL SECURITY ALERT. Unauthorized movement detected near {device_info}{location_info} at {timestamp}. Security team notified. Area monitoring increased. {details}",
            
            'system_compromise': f"SYSTEM ATTACK PREVENTED. Attempt to compromise medical equipment {device_info}{location_info} blocked at {timestamp}. All systems secure and operational. Incident logged. {details}"
        }
        
        message = hospital_alerts.get(threat_type, f"SECURITY ALERT. {threat_type} detected on {device_info}{location_info} at {timestamp}. Threat neutralized by SafeEdge. {details}")
        
        # Determine threat level
        threat_levels = {
            'CRITICAL': 'critical',
            'EMERGENCY': 'critical', 
            'HIGH': 'high',
            'MEDIUM': 'medium',
            'LOW': 'low'
        }
        threat_level = threat_levels.get(severity, 'medium')
        
        print(f"\n🏥 HOSPITAL TWIML SECURITY ALERT")
        print(f"🚨 Threat Type: {threat_type}")
        print(f"⚠️  Severity: {severity}")
        print(f"📝 Details: {details}")
        print(f"📅 Time: {timestamp}")
        print(f"🎙️  Voice: Professional TwiML (No Trial Message)")
        print("=" * 70)
        
        if not self.emergency_contacts:
            print("❌ No emergency contacts configured!")
            return False
        
        if not self.twiml_app_sid:
            print("❌ TwiML App SID not configured!")
            print("💡 Run: python twiml_app_setup.py to create TwiML App")
            return False
        
        successful_calls = 0
        total_contacts = len(self.emergency_contacts)
        
        for i, contact in enumerate(self.emergency_contacts, 1):
            print(f"\n📞 CALLING CONTACT {i}/{total_contacts}: {contact}")
            
            if self.make_twiml_call(contact, message, threat_level):
                successful_calls += 1
                print(f"✅ Successfully called {contact}")
            else:
                print(f"❌ Failed to call {contact}")
            
            # Wait between calls
            if i < total_contacts:
                print("⏳ Waiting 8 seconds before next call...")
                time.sleep(8)
        
        # Summary
        print(f"\n📊 HOSPITAL TWIML ALERT SUMMARY")
        print(f"✅ Successful calls: {successful_calls}/{total_contacts}")
        print(f"❌ Failed calls: {total_contacts - successful_calls}/{total_contacts}")
        
        if total_contacts > 0:
            success_rate = (successful_calls/total_contacts)*100
            print(f"📈 Success rate: {success_rate:.1f}%")
        
        if successful_calls > 0:
            print(f"🎉 SUCCESS: {successful_calls} professional TwiML alerts delivered!")
            print(f"🏥 Medical staff can interact with alerts (acknowledge, escalate, etc.)")
        else:
            print(f"❌ FAILURE: No calls were successful")
        
        return successful_calls > 0
    
    def test_twiml_system(self):
        """Test the TwiML voice system"""
        print("🧪 TESTING TWIML VOICE SYSTEM")
        print("=" * 40)
        
        if not self.emergency_contacts:
            print("❌ No emergency contacts for testing")
            return False
        
        if not self.twiml_app_sid:
            print("❌ TwiML App not configured")
            print("💡 Run: python twiml_app_setup.py")
            return False
        
        test_message = "This is a SafeEdge TwiML system test. All hospital security systems are functioning normally. Patient safety is maintained. This test confirms professional voice alert delivery without trial messages."
        test_contact = self.emergency_contacts[0]
        
        print(f"📞 Testing with: {test_contact}")
        print(f"📝 Test message: {test_message}")
        
        return self.make_twiml_call(test_contact, test_message, 'normal')
    
    def show_setup_status(self):
        """Show TwiML setup status"""
        print("🔧 TWIML SYSTEM STATUS")
        print("=" * 40)
        
        # Check Twilio
        if self.is_configured():
            print("✅ Twilio: Configured")
            print(f"   Account SID: {self.twilio_sid[:10]}...")
            print(f"   From Number: {self.twilio_from}")
        else:
            print("❌ Twilio: Not configured")
        
        # Check TwiML App
        if self.twiml_app_sid:
            print("✅ TwiML App: Configured")
            print(f"   App SID: {self.twiml_app_sid}")
        else:
            print("❌ TwiML App: Not configured")
            print("   Run: python twiml_app_setup.py")
        
        # Check Webhook
        print(f"🌐 Webhook URL: {self.webhook_base_url}")
        
        # Check Contacts
        if self.emergency_contacts:
            print(f"✅ Emergency Contacts: {len(self.emergency_contacts)} configured")
            for i, contact in enumerate(self.emergency_contacts, 1):
                print(f"   {i}. {contact}")
        else:
            print("❌ Emergency Contacts: None configured")
        
        # Overall status
        all_ready = (
            self.is_configured() and 
            self.twiml_app_sid and 
            self.emergency_contacts
        )
        
        print(f"\n🎯 System Status: {'✅ READY' if all_ready else '❌ NEEDS SETUP'}")

def main():
    """Main function"""
    # You can set these via environment variables or pass them directly
    twiml_app_sid = os.getenv('TWIML_APP_SID')  # Set this after creating TwiML App
    webhook_url = os.getenv('WEBHOOK_BASE_URL', 'https://your-ngrok-url.ngrok.io')
    
    alerts = TwiMLVoiceAlerts(twiml_app_sid, webhook_url)
    
    print("\n🎙️  SafeEdge TwiML Voice Alerts")
    print("=" * 45)
    print("1. Show setup status")
    print("2. Test TwiML system")
    print("3. Send hospital security alert")
    print("4. Send custom alert")
    print("0. Exit")
    
    choice = input("\nEnter choice: ")
    
    if choice == '1':
        alerts.show_setup_status()
    elif choice == '2':
        alerts.test_twiml_system()
    elif choice == '3':
        print("\nHospital Security Scenarios:")
        print("1. temperature_attack - Incubator temperature manipulation")
        print("2. power_attack - Medical equipment power attack")
        print("3. unauthorized_access - Unauthorized NICU access")
        print("4. network_intrusion - Hospital network attack")
        print("5. malware - Virus on medical systems")
        
        scenario = input("Choose scenario (1-5): ")
        scenarios = {
            '1': ('temperature_attack', 'CRITICAL', 'Baby Incubator Unit 1 temperature manipulated', 'NICU-INC-001', 'NICU Room 3'),
            '2': ('power_attack', 'EMERGENCY', 'Ventilator power supply targeted', 'VENT-PWR-002', 'ICU Room 7'),
            '3': ('unauthorized_access', 'HIGH', 'Unauthorized login to monitoring system', 'MON-SYS-003', 'Nurses Station'),
            '4': ('network_intrusion', 'HIGH', 'Malicious traffic on hospital network', 'NET-FW-001', 'Main Network'),
            '5': ('malware', 'CRITICAL', 'Ransomware detected on medical devices', 'MED-DEV-005', 'Radiology Dept')
        }
        
        if scenario in scenarios:
            threat, severity, details, device_id, location = scenarios[scenario]
            alerts.send_hospital_security_alert(threat, severity, details, device_id, location)
        else:
            print("Invalid scenario")
    elif choice == '4':
        message = input("Enter custom alert message: ")
        if alerts.emergency_contacts and alerts.twiml_app_sid:
            alerts.make_twiml_call(alerts.emergency_contacts[0], message)
        else:
            print("System not properly configured")

if __name__ == "__main__":
    main()