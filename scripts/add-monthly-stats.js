// Sample script to add monthly statistics to Firestore
// This would typically be run by a scheduled job/cron

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up credentials)
// const serviceAccount = require('./path-to-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const firestore = admin.firestore();

async function addMonthlyStats(organizationId, year, month, stats) {
  try {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const docId = `${organizationId}_${monthKey}`;

    await firestore
      .collection('monthlyStats')
      .doc(docId)
      .set({
        organizationId,
        year,
        month,
        monthKey,
        totalDevices: stats.totalDevices,
        activeDevices: stats.activeDevices,
        alerts: stats.alerts,
        securityScore: stats.securityScore,
        createdAt: new Date().toISOString()
      });

    console.log(`Monthly stats added for ${monthKey}: ${JSON.stringify(stats)}`);
  } catch (error) {
    console.error('Error adding monthly stats:', error);
  }
}

// Example usage: Add stats for the last 6 months
async function addSampleStats(organizationId) {
  const currentDate = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Generate sample data
    const stats = {
      totalDevices: Math.floor(Math.random() * 50) + 20,
      activeDevices: Math.floor(Math.random() * 40) + 15,
      alerts: Math.floor(Math.random() * 20) + 5,
      securityScore: Math.floor(Math.random() * 20) + 75
    };

    await addMonthlyStats(organizationId, year, month, stats);
  }
}

// Run with: addSampleStats('YOUR_ORG_ID');

module.exports = { addMonthlyStats, addSampleStats };
