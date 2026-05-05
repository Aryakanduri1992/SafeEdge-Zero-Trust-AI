#!/usr/bin/env python3
"""
TwiML App Setup for SafeEdge
Creates and manages TwiML Applications for professional voice alerts
✅ Eliminates trial messages
✅ Professional call handling
✅ Custom voice responses
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load configuration
load_dotenv('.env')

class TwiMLAppManager:
    def __init__(self):
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        
        print(f"🎙️  TwiML App Manager Initialized")
        print(f"📞 Twilio: {'✅ Ready' if self.is_configured() else '❌ Not Configured'}")
    
    def is_configured(self):
        """Check if Twilio is configured"""
        return all([self.twilio_sid, self.twilio_token])
    
    def create_twiml_app(self, app_name="SafeEdge Security Alerts", webhook_url=None):
        """Create a new TwiML Application"""
        try:
            if not self.is_configured():
                print("❌ Twilio credentials not configured")
                return None
            
            # Default webhook URL (you can host this on ngrok, Heroku, etc.)
            if not webhook_url:
                webhook_url = "https://your-domain.com/twiml/security-alert"
            
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Applications.json"
            
            data = {
                'FriendlyName': app_name,
                'VoiceUrl': webhook_url,
                'VoiceMethod': 'POST',
                'VoiceFallbackUrl': webhook_url,
                'VoiceFallbackMethod': 'POST'
            }
            
            response = requests.post(
                url,
                data=data,
                auth=(self.twilio_sid, self.twilio_token)
            )
            
            if response.status_code == 201:
                app_data = response.json()
                print(f"✅ TwiML App created successfully!")
                print(f"📱 App SID: {app_data.get('sid')}")
                print(f"📝 App Name: {app_data.get('friendly_name')}")
                print(f"🌐 Webhook URL: {app_data.get('voice_url')}")
                
                return app_data
            else:
                print(f"❌ Failed to create TwiML App: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating TwiML App: {e}")
            return None
    
    def list_twiml_apps(self):
        """List all TwiML Applications"""
        try:
            if not self.is_configured():
                print("❌ Twilio credentials not configured")
                return []
            
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Applications.json"
            
            response = requests.get(
                url,
                auth=(self.twilio_sid, self.twilio_token)
            )
            
            if response.status_code == 200:
                data = response.json()
                apps = data.get('applications', [])
                
                print(f"📱 Found {len(apps)} TwiML Applications:")
                for i, app in enumerate(apps, 1):
                    print(f"   {i}. {app.get('friendly_name')} (SID: {app.get('sid')})")
                    print(f"      Voice URL: {app.get('voice_url')}")
                
                return apps
            else:
                print(f"❌ Failed to list TwiML Apps: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error listing TwiML Apps: {e}")
            return []
    
    def delete_twiml_app(self, app_sid):
        """Delete a TwiML Application"""
        try:
            if not self.is_configured():
                print("❌ Twilio credentials not configured")
                return False
            
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Applications/{app_sid}.json"
            
            response = requests.delete(
                url,
                auth=(self.twilio_sid, self.twilio_token)
            )
            
            if response.status_code == 204:
                print(f"✅ TwiML App {app_sid} deleted successfully!")
                return True
            else:
                print(f"❌ Failed to delete TwiML App: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error deleting TwiML App: {e}")
            return False

def main():
    """Main function"""
    manager = TwiMLAppManager()
    
    print("\n🎙️  SafeEdge TwiML App Manager")
    print("=" * 40)
    print("1. Create new TwiML App")
    print("2. List existing TwiML Apps")
    print("3. Delete TwiML App")
    print("4. Show setup instructions")
    print("0. Exit")
    
    choice = input("\nEnter choice: ")
    
    if choice == '1':
        app_name = input("Enter app name (or press Enter for default): ")
        if not app_name:
            app_name = "SafeEdge Security Alerts"
        
        webhook_url = input("Enter webhook URL (or press Enter to skip): ")
        if not webhook_url:
            webhook_url = None
        
        manager.create_twiml_app(app_name, webhook_url)
        
    elif choice == '2':
        manager.list_twiml_apps()
        
    elif choice == '3':
        apps = manager.list_twiml_apps()
        if apps:
            app_sid = input("Enter App SID to delete: ")
            manager.delete_twiml_app(app_sid)
        
    elif choice == '4':
        show_setup_instructions()

def show_setup_instructions():
    """Show TwiML App setup instructions"""
    print("\n📋 TWIML APP SETUP INSTRUCTIONS")
    print("=" * 50)
    print()
    print("🎯 Benefits of TwiML Apps:")
    print("   ✅ No trial messages")
    print("   ✅ Professional call handling")
    print("   ✅ Custom voice responses")
    print("   ✅ Call recording capabilities")
    print("   ✅ Advanced call routing")
    print()
    print("🔧 Setup Steps:")
    print("   1. Create TwiML App (option 1)")
    print("   2. Set up webhook endpoint")
    print("   3. Update phone number configuration")
    print("   4. Test with SafeEdge alerts")
    print()
    print("🌐 Webhook Endpoint Options:")
    print("   • ngrok (for local testing)")
    print("   • Heroku (free hosting)")
    print("   • Vercel (serverless)")
    print("   • Your own server")
    print()
    print("📞 Next Steps:")
    print("   1. Run: python twiml_webhook_server.py")
    print("   2. Get public URL (ngrok, etc.)")
    print("   3. Create TwiML App with that URL")
    print("   4. Update Twilio phone number settings")

if __name__ == "__main__":
    main()