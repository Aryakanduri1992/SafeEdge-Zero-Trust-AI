// Sample script to add activities to Firestore
// Usage: node scripts/add-sample-activity.js

const organizationId = "YOUR_ORG_ID"; // Replace with actual organization ID

// Example: Add a device activity
fetch('http://localhost:9002/api/activities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    type: 'device',
    message: 'Device D-245 came online',
    metadata: {
      deviceId: 'D-245',
      action: 'online'
    }
  })
})
.then(res => res.json())
.then(data => console.log('Activity created:', data))
.catch(err => console.error('Error:', err));

// Example: Add a security activity
fetch('http://localhost:9002/api/activities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    type: 'security',
    message: 'Security alert resolved',
    metadata: {
      alertId: 'alert-123',
      action: 'resolved'
    }
  })
})
.then(res => res.json())
.then(data => console.log('Activity created:', data))
.catch(err => console.error('Error:', err));
