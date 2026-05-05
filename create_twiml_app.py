#!/usr/bin/env python3
"""
Automatic TwiML App Creation for SafeEdge
Creates TwiML App and updates .env file automatically
"""

import os
import requests
from dotenv import load_dotenv

# Load configuration
load_dotenv('.env')

def create_safeedge_twiml_app():
    """Create SafeEdge TwiML App automatically"""
    
    twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
    twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
    
    if not all([twilio_sid, twilio_token]):
        print("❌ Twilio credentials not configured")
        return None
    
    print("🚀 Creating SafeEdge TwiML App...")
    
    # Use a placeholder webhook URL for now
    webhook_url = "https://safeedge-demo.herokuapp.com/twiml/security-alert"
    
    url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Applications.json"
    
    data = {
        'FriendlyName': 'SafeEdge Hospital Security Alerts',
        'VoiceUrl': webhook_url,
        'VoiceMethod': 'POST',
        'VoiceFallbackUrl': webhook_url,
        'VoiceFallbackMethod': 'POST'
    }
    
    try:
        response = requests.post(
            url,
            data=data,
            auth=(twilio_sid, twilio_token)
        )
        
        if response.status_code == 201:
            app_data = response.json()
            app_sid = app_data.get('sid')
            
            print(f"✅ TwiML App created successfully!")
            print(f"📱 App SID: {app_sid}")
            print(f"📝 App Name: {app_data.get('friendly_name')}")
            print(f"🌐 Webhook URL: {app_data.get('voice_url')}")
            
            # Update .env file
            update_env_file(app_sid, webhook_url)
            
            return app_sid
        else:
            print(f"❌ Failed to create TwiML App: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating TwiML App: {e}")
        return None

def update_env_file(app_sid, webhook_url):
    """Update .env file with TwiML App SID"""
    try:
        # Read current .env file
        with open('.env', 'r') as f:
            lines = f.readlines()
        
        # Check if TWIML_APP_SID already exists
        twiml_app_exists = False
        webhook_exists = False
        
        for i, line in enumerate(lines):
            if line.startswith('TWIML_APP_SID='):
                lines[i] = f'TWIML_APP_SID={app_sid}\n'
                twiml_app_exists = True
            elif line.startswith('WEBHOOK_BASE_URL='):
                lines[i] = f'WEBHOOK_BASE_URL={webhook_url}\n'
                webhook_exists = True
        
        # Add new lines if they don't exist
        if not twiml_app_exists:
            lines.append(f'\n# TwiML App Configuration\n')
            lines.append(f'TWIML_APP_SID={app_sid}\n')
        
        if not webhook_exists:
            lines.append(f'WEBHOOK_BASE_URL={webhook_url}\n')
        
        # Write back to .env file
        with open('.env', 'w') as f:
            f.writelines(lines)
        
        print(f"✅ Updated .env file with TwiML App SID")
        
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        print(f"💡 Please manually add: TWIML_APP_SID={app_sid}")

def main():
    print("🎙️  SafeEdge TwiML App Creator")
    print("=" * 40)
    
    app_sid = create_safeedge_twiml_app()
    
    if app_sid:
        print(f"\n🎉 SUCCESS! TwiML App created and configured")
        print(f"📱 App SID: {app_sid}")
        print(f"\n🚀 Next steps:")
        print(f"1. ✅ TwiML App created")
        print(f"2. ✅ .env file updated")
        print(f"3. 🔄 Run: python twiml_voice_alerts.py")
        print(f"4. 🧪 Test the system!")
        
        # Test the voice alerts system
        print(f"\n🧪 Testing TwiML Voice Alerts...")
        os.system("python twiml_voice_alerts.py")
    else:
        print(f"\n❌ Failed to create TwiML App")
        print(f"💡 Check your Twilio credentials in .env file")

if __name__ == "__main__":
    main()