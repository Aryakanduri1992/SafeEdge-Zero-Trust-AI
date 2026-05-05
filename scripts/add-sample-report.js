// Sample script to add reports to Firestore
// Usage: Replace organizationId and run in browser console or with node-fetch

const organizationId = "YOUR_ORG_ID"; // Replace with actual organization ID

// Example: Add a device usage report
fetch('http://localhost:9002/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    title: 'Device Usage Report',
    type: 'device-usage',
    description: 'Comprehensive device usage analysis for the last 30 days',
    fileUrl: 'https://example.com/reports/device-usage-2026-04.pdf',
    metadata: {
      period: 'last-30-days',
      totalDevices: 45,
      activeDevices: 42
    }
  })
})
.then(res => res.json())
.then(data => console.log('Report created:', data))
.catch(err => console.error('Error:', err));

// Example: Add a monthly summary report
fetch('http://localhost:9002/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    title: 'Monthly Summary - April 2026',
    type: 'monthly-summary',
    description: 'Complete monthly performance and security summary',
    fileUrl: 'https://example.com/reports/monthly-summary-2026-04.pdf',
    metadata: {
      month: 'April',
      year: 2026,
      totalAlerts: 12,
      resolvedAlerts: 10
    }
  })
})
.then(res => res.json())
.then(data => console.log('Report created:', data))
.catch(err => console.error('Error:', err));

// Example: Add a security audit report
fetch('http://localhost:9002/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationId: organizationId,
    title: 'Security Audit - Q1 2026',
    type: 'security-audit',
    description: 'Quarterly security assessment and compliance report',
    fileUrl: 'https://example.com/reports/security-audit-q1-2026.pdf',
    metadata: {
      quarter: 'Q1',
      year: 2026,
      securityScore: 85,
      vulnerabilities: 3
    }
  })
})
.then(res => res.json())
.then(data => console.log('Report created:', data))
.catch(err => console.error('Error:', err));
