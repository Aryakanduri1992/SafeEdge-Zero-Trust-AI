// Test script to create a notification
const organizationId = "test-org-id"; // Replace with actual org ID

fetch('http://localhost:9002/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    title: 'Test Notification',
    message: 'This is a test notification to verify the system works',
    type: 'info'
  })
})
.then(res => res.json())
.then(data => console.log('Notification created:', data))
.catch(err => console.error('Error:', err));
