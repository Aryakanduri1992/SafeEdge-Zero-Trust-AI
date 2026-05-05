# TwiML App Setup Guide for SafeEdge

## 🎯 Why Use TwiML Apps?

✅ **No Trial Messages** - Professional calls without Twilio trial intro
✅ **Interactive Responses** - Users can acknowledge, repeat, or escalate alerts
✅ **Professional Quality** - Crystal clear voice with Amazon Polly Neural
✅ **Call Recording** - Optional recording of all security alerts
✅ **Advanced Routing** - Custom call flows and escalation paths

## 📋 Quick Setup (5 Minutes)

### Step 1: Start the Webhook Server

```bash
# Install Flask if needed
pip install flask

# Start the webhook server
python twiml_webhook_server.py
```

Server will run on `http://localhost:5000`

### Step 2: Expose Webhook with ngrok

```bash
# Install ngrok from https://ngrok.com/download

# Expose local server
ngrok http 5000
```

Copy the `https://` URL (e.g., `https://abc123.ngrok.io`)

### Step 3: Create TwiML App

```bash
# Run the TwiML App manager
python twiml_app_setup.py

# Choose option 1: Create new TwiML App
# Enter your ngrok URL when prompted
```

Copy the **App SID** (starts with `AP...`)

### Step 4: Configure Environment

Add to your `.env` file:

```bash
# TwiML App Configuration
TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io
```

### Step 5: Test the System

```bash
python twiml_voice_alerts.py

# Choose option 2: Test TwiML system
```

## 🎙️ What You'll Hear

### With TwiML App (Professional):
1. ✅ **Immediate Alert** - "SafeEdge Hospital Security System"
2. ✅ **Clear Message** - Your security alert
3. ✅ **Interactive Options** - Press 1 to acknowledge, 2 to repeat, 3 to escalate
4. ✅ **Professional Voice** - Amazon Polly Neural (highest quality)

### Without TwiML App (Trial):
1. ❌ **Trial Message** - "You have a call from a Twilio trial account..."
2. ❌ **Press Any Key** - "Press any key to accept this call"
3. ✅ **Your Alert** - Finally plays after 15 seconds

## 🏥 Hospital Security Scenarios

### Temperature Attack
```python
alerts.send_hospital_security_alert(
    threat_type='temperature_attack',
    severity='CRITICAL',
    details='Baby Incubator Unit 1 temperature changed from 37.2°C to 42°C',
    device_id='NICU-INC-001',
    location='NICU Room 3'
)
```

**Call Flow:**
1. "CRITICAL PATIENT SAFETY ALERT"
2. "Temperature attack on incubator device NICU-INC-001 in NICU Room 3 detected and blocked"
3. "Patient safety maintained. Normal temperature restored automatically"
4. "Press 1 to acknowledge, 2 to repeat, 3 to escalate"

### Power Attack
```python
alerts.send_hospital_security_alert(
    threat_type='power_attack',
    severity='EMERGENCY',
    details='Ventilator power supply targeted by cyber attack',
    device_id='VENT-PWR-002',
    location='ICU Room 7'
)
```

### Network Intrusion
```python
alerts.send_hospital_security_alert(
    threat_type='network_intrusion',
    severity='HIGH',
    details='Malicious traffic detected on hospital WiFi network',
    device_id='NET-FW-001',
    location='Main Network'
)
```

## 🔧 Integration with SafeEdge Backend

### Add to `src/backend/main.py`:

```python
from .voice_alert_service import VoiceAlertService

# Initialize in startup_event()
voice_service = VoiceAlertService(
    twilio_account_sid=settings.twilio_account_sid,
    twilio_auth_token=settings.twilio_auth_token,
    twilio_from_number=settings.twilio_from_number,
    emergency_contacts=settings.emergency_contacts
)

# Use in attack simulation
@app.post("/api/security/simulate-attack")
async def simulate_attack(attack_data: dict):
    # ... existing code ...
    
    # Send voice alert
    if voice_service and voice_service.is_configured():
        voice_result = voice_service.send_security_alert(
            threat_type=attack_data.get('attack_type'),
            severity='CRITICAL',
            details=attack_data.get('description'),
            device_id=attack_data.get('device_id')
        )
```

## 📞 Interactive Call Features

### User Presses 1 (Acknowledge):
- ✅ Alert marked as acknowledged
- ✅ Response logged in system
- ✅ "Thank you for acknowledging this security alert"

### User Presses 2 (Repeat):
- 🔄 Message repeated
- 🔄 Options presented again
- 🔄 User can acknowledge or escalate

### User Presses 3 (Escalate):
- 🚨 Alert marked as escalated
- 🚨 Security team notified
- 🚨 Higher priority response triggered

### User Presses 9 (End Call):
- 📴 Call ends gracefully
- 📴 Alert logged as unacknowledged
- 📴 Follow-up actions triggered

## 🌐 Production Deployment

### Option 1: Heroku (Free)
```bash
# Create Heroku app
heroku create safeedge-twiml

# Deploy webhook server
git push heroku main

# Get URL
heroku info
```

### Option 2: Vercel (Serverless)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Get URL
vercel --prod
```

### Option 3: Your Own Server
```bash
# Run on your server
python twiml_webhook_server.py

# Use your domain
# https://your-domain.com/twiml/security-alert
```

## 🎯 For Imagine Cup Demo

### Perfect Demo Flow:
1. **Show Attack Simulation** - Dashboard shows attack in progress
2. **Trigger Voice Alert** - System automatically calls emergency contacts
3. **Answer Call** - Professional voice, no trial message
4. **Interact with Alert** - Press 1 to acknowledge
5. **Show Dashboard Update** - Alert marked as acknowledged in real-time

### Demo Script:
```
"Watch as SafeEdge detects a temperature attack on this baby incubator.
The system automatically blocks the attack and calls the medical staff.
Notice there's no trial message - this is production-ready.
The doctor can acknowledge the alert by pressing 1.
The dashboard updates in real-time showing the alert was acknowledged.
All of this happens in under 30 seconds - protecting patient safety."
```

## 🏆 Imagine Cup Advantages

✅ **Professional Quality** - No trial messages during demo
✅ **Interactive Demo** - Judges can interact with the system
✅ **Real-World Ready** - Production-quality implementation
✅ **Scalable Architecture** - Works for 1 or 1000 hospitals
✅ **Cost Effective** - Free tier covers all demo needs

## 📊 Metrics & Monitoring

The webhook server logs all interactions:
- ✅ Calls received
- ✅ User responses (acknowledge, repeat, escalate)
- ✅ Call duration
- ✅ Response times

Perfect for showing judges the system's effectiveness!

## 🚀 Next Steps

1. ✅ Set up TwiML App (5 minutes)
2. ✅ Test with hospital scenarios
3. ✅ Integrate with attack simulator
4. ✅ Practice demo flow
5. ✅ Record demo video for Imagine Cup

## 💡 Pro Tips

- **Use ngrok for development** - Easy testing without deployment
- **Deploy to Heroku for demo** - Reliable public URL
- **Test all scenarios** - Temperature, power, access, network attacks
- **Practice interactive flow** - Show judges the acknowledge feature
- **Record metrics** - Show success rates and response times

## 🎉 You're Ready!

Your SafeEdge system now has professional, production-ready voice alerts perfect for winning Imagine Cup 2026! 🏆