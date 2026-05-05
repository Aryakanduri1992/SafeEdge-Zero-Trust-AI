// Sample script to add alerts to Firestore
// Usage: node scripts/add-sample-alert.js

const organizationId = "YOUR_ORG_ID"; // Replace with actual organization ID

// Example: Add a critical alert
fetch('http://localhost:9002/api/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    severity: 'high',
    title: 'Unauthorized Access Attempt',
    message: 'Multiple failed login attempts detected on device D-245',
    deviceId: 'D-245'
  })
})
.then(res => res.json())
.then(data => console.log('Alert created:', data))
.catch(err => console.error('Error:', err));

// Example: Add a medium severity alert
fetch('http://localhost:9002/api/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    severity: 'medium',
    title: 'Device Offline',
    message: 'Device D-123 has been offline for more than 1 hour',
    deviceId: 'D-123'
  })
})
.then(res => res.json())
.then(data => console.log('Alert created:', data))
.catch(err => console.error('Error:', err));
