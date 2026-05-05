#!/usr/bin/env python3
"""
TwiML Webhook Server for SafeEdge
Handles incoming calls and generates professional TwiML responses
✅ No trial messages
✅ Professional voice quality
✅ Interactive call handling
"""

from flask import Flask, request, Response
import os
from datetime import datetime
from dotenv import load_dotenv

# Load configuration
load_dotenv('.env')

app = Flask(__name__)

# Store current alert message (in production, use database)
current_alert = {
    'message': 'SafeEdge system is operational. All security systems are functioning normally.',
    'timestamp': datetime.now().isoformat(),
    'threat_level': 'normal'
}

@app.route('/twiml/security-alert', methods=['POST', 'GET'])
def security_alert_handler():
    """Handle incoming calls for security alerts"""
    
    # Get call information
    from_number = request.values.get('From', 'Unknown')
    to_number = request.values.get('To', 'Unknown')
    call_sid = request.values.get('CallSid', 'Unknown')
    
    print(f"📞 Incoming call: {from_number} -> {to_number} (SID: {call_sid})")
    
    # Generate professional TwiML response
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        SafeEdge Hospital Security System.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        {current_alert['message']}
    </Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        Press 1 to acknowledge this alert. Press 2 to repeat the message. Press 3 to escalate to security team. Press 9 to end call.
    </Say>
    <Gather numDigits="1" timeout="20" action="/twiml/handle-response" method="POST">
        <Say voice="Polly.Joanna-Neural" language="en-US">
            Please press 1 to acknowledge, 2 to repeat, 3 to escalate, or 9 to end call.
        </Say>
    </Gather>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        No response received. This security alert has been logged as unacknowledged. Please check your SafeEdge dashboard immediately.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Thank you for using SafeEdge Hospital Security. Goodbye.
    </Say>
</Response>"""
    
    return Response(twiml_response, mimetype='text/xml')

@app.route('/twiml/handle-response', methods=['POST'])
def handle_user_response():
    """Handle user button press responses"""
    
    digits = request.values.get('Digits', '')
    from_number = request.values.get('From', 'Unknown')
    call_sid = request.values.get('CallSid', 'Unknown')
    
    print(f"📱 User pressed: {digits} (Call: {call_sid})")
    
    if digits == '1':
        # Acknowledge alert
        twiml_response = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Thank you for acknowledging this security alert. The alert has been marked as acknowledged in the SafeEdge system.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Your response has been logged. Have a safe day. Goodbye.
    </Say>
</Response>"""
        
        # Log acknowledgment (in production, update database)
        print(f"✅ Alert acknowledged by {from_number}")
        
    elif digits == '2':
        # Repeat message
        twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Repeating the security alert message.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US" rate="medium">
        {current_alert['message']}
    </Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Press 1 to acknowledge, 3 to escalate, or 9 to end call.
    </Say>
    <Gather numDigits="1" timeout="15" action="/twiml/handle-response" method="POST">
        <Say voice="Polly.Joanna-Neural" language="en-US">
            Please make your selection.
        </Say>
    </Gather>
</Response>"""
        
    elif digits == '3':
        # Escalate to security team
        twiml_response = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Escalating to security team. Please hold while we connect you to emergency support.
    </Say>
    <Pause length="2"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        This alert has been marked as escalated. Security team will be notified immediately.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Thank you for your prompt response. Goodbye.
    </Say>
</Response>"""
        
        # Log escalation (in production, notify security team)
        print(f"🚨 Alert escalated by {from_number}")
        
    elif digits == '9':
        # End call
        twiml_response = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Thank you for calling SafeEdge Security. This call will now end. Goodbye.
    </Say>
</Response>"""
        
    else:
        # Invalid input
        twiml_response = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Invalid selection. Please try again.
    </Say>
    <Pause length="1"/>
    <Say voice="Polly.Joanna-Neural" language="en-US">
        Press 1 to acknowledge, 2 to repeat, 3 to escalate, or 9 to end call.
    </Say>
    <Gather numDigits="1" timeout="15" action="/twiml/handle-response" method="POST">
        <Say voice="Polly.Joanna-Neural" language="en-US">
            Please make your selection.
        </Say>
    </Gather>
</Response>"""
    
    return Response(twiml_response, mimetype='text/xml')

@app.route('/api/update-alert', methods=['POST'])
def update_alert():
    """API endpoint to update the current alert message"""
    global current_alert
    
    try:
        data = request.get_json()
        
        current_alert = {
            'message': data.get('message', 'SafeEdge security alert'),
            'timestamp': datetime.now().isoformat(),
            'threat_level': data.get('threat_level', 'normal'),
            'device_id': data.get('device_id'),
            'location': data.get('location')
        }
        
        print(f"📝 Alert updated: {current_alert['message']}")
        
        return {
            'success': True,
            'message': 'Alert updated successfully',
            'current_alert': current_alert
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 400

@app.route('/api/current-alert', methods=['GET'])
def get_current_alert():
    """Get the current alert message"""
    return {
        'success': True,
        'current_alert': current_alert
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'service': 'SafeEdge TwiML Webhook Server',
        'timestamp': datetime.now().isoformat()
    }

@app.route('/', methods=['GET'])
def index():
    """Index page"""
    return """
    <h1>SafeEdge TwiML Webhook Server</h1>
    <p>✅ Server is running and ready to handle calls</p>
    <p>📞 Webhook endpoint: <code>/twiml/security-alert</code></p>
    <p>🔧 Update alert: <code>POST /api/update-alert</code></p>
    <p>📋 Current alert: <code>GET /api/current-alert</code></p>
    <p>❤️ Health check: <code>GET /health</code></p>
    """

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 Starting SafeEdge TwiML Webhook Server")
    print(f"🌐 Server will run on port {port}")
    print(f"📞 Webhook endpoint: /twiml/security-alert")
    print(f"🔧 API endpoint: /api/update-alert")
    print()
    print("💡 To make this accessible to Twilio:")
    print("   1. Use ngrok: ngrok http 5000")
    print("   2. Copy the https URL")
    print("   3. Create TwiML App with that URL")
    print()
    
    app.run(host='0.0.0.0', port=port, debug=debug)