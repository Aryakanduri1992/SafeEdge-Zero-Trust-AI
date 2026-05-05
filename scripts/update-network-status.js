// Sample script to update network status in Firestore
// This would typically be run by a network monitoring service
// Usage: node scripts/update-network-status.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up credentials)
// const serviceAccount = require('./path-to-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const firestore = admin.firestore();

async function updateNetworkStatus(organizationId, status) {
  try {
    await firestore
      .collection('networkMetrics')
      .doc(organizationId)
      .set({
        status: status, // 0-100 percentage
        lastUpdated: new Date().toISOString(),
        latency: Math.random() * 50, // Example: latency in ms
        packetLoss: Math.random() * 2, // Example: packet loss percentage
      }, { merge: true });

    console.log(`Network status updated for ${organizationId}: ${status}%`);
  } catch (error) {
    console.error('Error updating network status:', error);
  }
}

// Example usage:
// updateNetworkStatus('YOUR_ORG_ID', 95);

module.exports = { updateNetworkStatus };
