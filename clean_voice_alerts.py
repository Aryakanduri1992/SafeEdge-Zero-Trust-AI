#!/usr/bin/env python3
"""
Clean Voice Alert System for SafeEdge
✅ Handles Twilio trial messages properly
✅ Crystal clear alert messages
✅ Professional voice quality
"""

import os
import requests
import json
import time
from datetime import datetime
from dotenv import load_dotenv

# Load configuration
load_dotenv('.env')

class CleanVoiceAlerts:
    def __init__(self):
        # Twilio Configuration  
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_from = os.getenv('TWILIO_FROM_NUMBER')
        
        # Emergency Contacts
        self.emergency_contacts = self.load_emergency_contacts()
        
        print(f"🎙️  Clean Voice Alert System Initialized")
        print(f"📞 Twilio: {'✅ Ready' if self.is_configured() else '❌ Missing Credentials'}")
        print(f"📱 Emergency Contacts: {len(self.emergency_contacts)}")
    
    def load_emergency_contacts(self):
        """Load emergency contacts from environment"""
        contacts = []
        env_contacts = os.getenv('EMERGENCY_CONTACTS', '')
        if env_contacts:
            contacts = [c.strip() for c in env_contacts.split(',') if c.strip()]
        return contacts
    
    def is_configured(self):
        """Check if system is configured"""
        return all([self.twilio_sid, self.twilio_token, self.twilio_from])
    
    def create_clean_twiml(self, message):
        """Create clean TwiML that works perfectly with trial accounts"""
        
        # Clean, simple TwiML that sounds professional even with trial message
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        SAFEEDGE SECURITY ALERT.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        {message}
    </Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        Press 1 to acknowledge this alert. Press 2 to repeat. Press 3 for support.
    </Say>
    <Gather numDigits="1" timeout="15">
        <Say voice="Polly.Joanna-Neural" language="en-US">
            Please press 1 to acknowledge, 2 to repeat, or 3 for support.
        </Say>
    </Gather>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Alert logged. Please check your SafeEdge system. Goodbye.
    </Say>
</Response>"""
        
        return twiml
    
    def make_clean_call(self, phone_number, message):
        """Make clean call with perfect voice"""
        try:
            print(f"\n📞 MAKING CLEAN CALL TO: {phone_number}")
            print(f"📢 MESSAGE: {message}")
            print("-" * 60)
            
            if not self.is_configured():
                print("❌ Twilio not configured")
                return False
            
            # Create clean TwiML
            twiml = self.create_clean_twiml(message)
            
            # Make Twilio call
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Calls.json"
            
            data = {
                'To': phone_number,
                'From': self.twilio_from,
                'Twiml': twiml
            }
            
            print("📞 Initiating clean Twilio call...")
            response = requests.post(
                url,
                data=data,
                auth=(self.twilio_sid, self.twilio_token),
                timeout=30
            )
            
            if response.status_code == 201:
                call_data = response.json()
                print(f"✅ Clean call initiated successfully!")
                print(f"📞 Call SID: {call_data.get('sid')}")
                print(f"📱 Status: {call_data.get('status')}")
                print(f"🎙️  Voice: Twilio Polly Neural (Clean & Clear)")
                print(f"ℹ️  Note: Trial accounts have a brief intro message before your alert")
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
            print(f"❌ Call error: {e}")
            return False
    
    def send_hospital_alert(self, threat_type, severity, details):
        """Send hospital-specific security alert"""
        timestamp = datetime.now().strftime('%H:%M on %B %d')
        
        # Hospital-focused alert messages (shorter and clearer)
        hospital_alerts = {
            'temperature_attack': f"CRITICAL PATIENT ALERT. Incubator temperature attack detected and blocked at {timestamp}. Baby is safe. Temperature restored to normal. {details}",
            
            'power_attack': f"EMERGENCY ALERT. Power system attack on medical equipment blocked at {timestamp}. All life support systems operational. Backup power activated. {details}",
            
            'access_attack': f"SECURITY BREACH BLOCKED. Unauthorized access to NICU systems prevented at {timestamp}. All patient areas secure. {details}",
            
            'network_attack': f"CYBER ATTACK STOPPED. Network intrusion on hospital systems blocked at {timestamp}. All medical devices protected. {details}",
            
            'malware': f"MALWARE THREAT ELIMINATED. Virus attack on medical systems stopped at {timestamp}. All patient data secure. {details}",
            
            'brute_force': f"HACKING ATTEMPT BLOCKED. Multiple login attacks prevented at {timestamp}. Hospital systems remain secure. {details}",
            
            'motion_detected': f"PHYSICAL SECURITY ALERT. Unauthorized access to restricted area detected at {timestamp}. Security protocols activated. {details}",
            
            'system_compromise': f"SYSTEM ATTACK PREVENTED. Attempt to compromise medical equipment blocked at {timestamp}. All systems secure. {details}"
        }
        
        message = hospital_alerts.get(threat_type, f"SECURITY ALERT. {threat_type} detected and blocked at {timestamp}. Hospital systems remain secure. {details}")
        
        print(f"\n🏥 HOSPITAL SECURITY ALERT SYSTEM")
        print(f"🚨 Threat Type: {threat_type}")
        print(f"⚠️  Severity: {severity}")
        print(f"📝 Details: {details}")
        print(f"📅 Time: {timestamp}")
        print(f"🎙️  Voice: Clean & Professional")
        print("=" * 70)
        
        if not self.emergency_contacts:
            print("❌ No emergency contacts configured!")
            print("💡 Add EMERGENCY_CONTACTS to .env file")
            return False
        
        successful_calls = 0
        total_contacts = len(self.emergency_contacts)
        
        for i, contact in enumerate(self.emergency_contacts, 1):
            print(f"\n📞 CALLING CONTACT {i}/{total_contacts}: {contact}")
            
            if self.make_clean_call(contact, message):
                successful_calls += 1
                print(f"✅ Successfully called {contact}")
            else:
                print(f"❌ Failed to call {contact}")
            
            # Wait between calls
            if i < total_contacts:
                print("⏳ Waiting 8 seconds before next call...")
                time.sleep(8)
        
        # Summary
        print(f"\n📊 HOSPITAL ALERT SUMMARY")
        print(f"✅ Successful calls: {successful_calls}/{total_contacts}")
        print(f"❌ Failed calls: {total_contacts - successful_calls}/{total_contacts}")
        
        if total_contacts > 0:
            success_rate = (successful_calls/total_contacts)*100
            print(f"📈 Success rate: {success_rate:.1f}%")
        
        if successful_calls > 0:
            print(f"🎉 SUCCESS: {successful_calls} hospital alerts delivered!")
            print(f"🏥 Medical staff notified of security status")
        else:
            print(f"❌ FAILURE: No calls were successful")
        
        return successful_calls > 0
    
    def test_clean_system(self):
        """Test the clean voice system"""
        print("🧪 TESTING CLEAN VOICE SYSTEM")
        print("=" * 40)
        
        if not self.emergency_contacts:
            print("❌ No emergency contacts for testing")
            return False
        
        test_message = "This is a SafeEdge system test. All hospital security systems are functioning normally. Patient safety is maintained. This test confirms voice alert delivery."
        test_contact = self.emergency_contacts[0]
        
        print(f"📞 Testing with: {test_contact}")
        print(f"📝 Test message: {test_message}")
        
        return self.make_clean_call(test_contact, test_message)
    
    def show_trial_info(self):
        """Show information about Twilio trial account"""
        print("ℹ️  TWILIO TRIAL ACCOUNT INFORMATION")
        print("=" * 50)
        print("📞 What you'll hear during calls:")
        print("   1. Brief Twilio trial message (15 seconds)")
        print("   2. Your SafeEdge security alert (clear & professional)")
        print("   3. Options to acknowledge the alert")
        print()
        print("🎯 For production deployment:")
        print("   • Upgrade to paid Twilio account")
        print("   • Remove trial message completely")
        print("   • Add custom caller ID")
        print("   • Enable call recording")
        print()
        print("✅ Current system works perfectly for:")
        print("   • Imagine Cup demonstrations")
        print("   • Proof of concept testing")
        print("   • Security alert validation")

def main():
    """Main function for testing"""
    alerts = CleanVoiceAlerts()
    
    print("\n🎙️  SafeEdge Clean Voice Alerts")
    print("=" * 40)
    print("1. Test clean system")
    print("2. Send hospital security alert")
    print("3. Send custom alert")
    print("4. Show trial account info")
    print("0. Exit")
    
    choice = input("\nEnter choice: ")
    
    if choice == '1':
        alerts.test_clean_system()
    elif choice == '2':
        print("\nHospital Security Scenarios:")
        print("1. temperature_attack - Incubator temperature manipulation")
        print("2. power_attack - Medical equipment power attack")
        print("3. access_attack - Unauthorized NICU access")
        print("4. network_attack - Hospital network intrusion")
        print("5. malware - Virus on medical systems")
        
        scenario = input("Choose scenario (1-5): ")
        scenarios = {
            '1': ('temperature_attack', 'CRITICAL', 'Baby Incubator Unit 1 temperature changed from 37.2°C to 42°C'),
            '2': ('power_attack', 'EMERGENCY', 'Ventilator power supply targeted by cyber attack'),
            '3': ('access_attack', 'HIGH', 'Unauthorized login attempt to NICU monitoring system'),
            '4': ('network_attack', 'HIGH', 'Malicious traffic detected on hospital WiFi network'),
            '5': ('malware', 'CRITICAL', 'Ransomware detected on medical device network')
        }
        
        if scenario in scenarios:
            threat, severity, details = scenarios[scenario]
            alerts.send_hospital_alert(threat, severity, details)
        else:
            print("Invalid scenario")
            
    elif choice == '3':
        message = input("Enter custom alert message: ")
        if alerts.emergency_contacts:
            alerts.make_clean_call(alerts.emergency_contacts[0], message)
        else:
            print("No emergency contacts configured")
            
    elif choice == '4':
        alerts.show_trial_info()

if __name__ == "__main__":
    main()