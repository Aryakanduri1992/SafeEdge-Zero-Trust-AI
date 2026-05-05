#!/usr/bin/env python3
"""
Script to populate dashboard with sample activities and ensure system health data
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:9002"
ORG_ID = "wivkbmZBm3AmqQbgop4U"
DEVICE_ID = "iot_temperature_sensor_20260414185938_62fd12aa"

def create_activity(activity_type, message, metadata=None):
    """Create a new activity"""
    try:
        response = requests.post(f"{FRONTEND_URL}/api/activities", json={
            "organizationId": ORG_ID,
            "type": activity_type,
            "message": message,
            "metadata": metadata or {}
        })
        
        if response.status_code == 200:
            print(f"✅ Created {activity_type} activity: {message}")
            return True
        else:
            print(f"❌ Failed to create activity: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating activity: {e}")
        return False

def create_alert(severity, title, message, device_id=None):
    """Create a new alert"""
    try:
        response = requests.post(f"{FRONTEND_URL}/api/alerts", json={
            "organizationId": ORG_ID,
            "severity": severity,
            "title": title,
            "message": message,
            "deviceId": device_id
        })
        
        if response.status_code == 200:
            print(f"✅ Created {severity} alert: {title}")
            return True
        else:
            print(f"❌ Failed to create alert: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating alert: {e}")
        return False

def test_system_health():
    """Test system health endpoint"""
    try:
        response = requests.get(f"{FRONTEND_URL}/api/system-health?organizationId={ORG_ID}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ System Health API working:")
            print(f"   Device Connectivity: {data['systemHealth']['deviceConnectivity']}%")
            print(f"   Network Status: {data['systemHealth']['networkStatus']}%")
            print(f"   Security Score: {data['systemHealth']['securityScore']}%")
            print(f"   Storage Usage: {data['systemHealth']['storageUsage']}%")
            print(f"   Total Devices: {data['systemHealth']['totalDevices']}")
            print(f"   Online Devices: {data['systemHealth']['onlineDevices']}")
            return True
        else:
            print(f"❌ System Health API failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing system health: {e}")
        return False

def test_activities():
    """Test activities endpoint"""
    try:
        response = requests.get(f"{FRONTEND_URL}/api/activities?organizationId={ORG_ID}&limit=5")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Activities API working:")
            print(f"   Found {len(data['activities'])} activities")
            for activity in data['activities'][:3]:
                print(f"   - {activity['type']}: {activity['message']}")
            return True
        else:
            print(f"❌ Activities API failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing activities: {e}")
        return False

def test_alerts():
    """Test alerts endpoint"""
    try:
        response = requests.get(f"{FRONTEND_URL}/api/alerts?organizationId={ORG_ID}&status=active")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Alerts API working:")
            print(f"   Active alerts: {data['activeCount']}")
            print(f"   Total alerts: {data['totalCount']}")
            return True
        else:
            print(f"❌ Alerts API failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing alerts: {e}")
        return False

def populate_sample_data():
    """Populate sample activities and alerts"""
    print("🚀 Populating dashboard with sample data...")
    
    # Create sample activities
    activities = [
        ("device", f"Device {DEVICE_ID} came online", {"deviceId": DEVICE_ID, "status": "online"}),
        ("security", "Security scan completed successfully", {"scanType": "full", "threatsFound": 0}),
        ("device", "Temperature sensor calibrated", {"deviceId": DEVICE_ID, "calibrationType": "temperature"}),
        ("system", "System backup completed", {"backupSize": "2.3GB", "duration": "45 minutes"}),
        ("security", "Anomaly detection model updated", {"modelVersion": "v2.1.3", "accuracy": "94.2%"}),
        ("device", "New device provisioned successfully", {"deviceType": "temperature_sensor", "location": "Building A"}),
        ("department", "IT Department access permissions updated", {"department": "IT", "usersAffected": 12}),
        ("security", "Threat analysis completed", {"threatsBlocked": 3, "riskLevel": "low"}),
    ]
    
    for activity_type, message, metadata in activities:
        create_activity(activity_type, message, metadata)
        time.sleep(0.5)  # Small delay to ensure different timestamps
    
    # Create sample alerts (some active, some for testing)
    alerts = [
        ("medium", "Device Connectivity Warning", f"Device {DEVICE_ID} has intermittent connectivity", DEVICE_ID),
        ("low", "Scheduled Maintenance", "System maintenance scheduled for tonight at 2 AM", None),
        ("high", "Security Anomaly Detected", "Unusual network traffic pattern detected", DEVICE_ID),
    ]
    
    for severity, title, message, device_id in alerts:
        create_alert(severity, title, message, device_id)
        time.sleep(0.5)

def main():
    """Main function"""
    print("🏥 SafeEdge Dashboard Data Population Script")
    print("=" * 50)
    
    # Test current API endpoints
    print("\n📊 Testing API Endpoints...")
    system_health_ok = test_system_health()
    activities_ok = test_activities()
    alerts_ok = test_alerts()
    
    if not all([system_health_ok, activities_ok, alerts_ok]):
        print("\n⚠️  Some API endpoints are not working properly.")
        print("Make sure both backend (port 8000) and frontend (port 9002) are running.")
        return
    
    print("\n✅ All API endpoints are working!")
    
    # Populate sample data
    print("\n📝 Populating Sample Data...")
    populate_sample_data()
    
    print("\n🎉 Dashboard data population completed!")
    print("\n🌐 Open your dashboard at: http://localhost:9002/org-dashboard")
    print("📧 Login with: admin@socse.com / admin123")
    
    # Test again to show the populated data
    print("\n📊 Testing with populated data...")
    test_activities()
    test_alerts()

if __name__ == "__main__":
    main()