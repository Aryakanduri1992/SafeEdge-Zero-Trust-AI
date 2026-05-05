import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Get monthly statistics for the last 6 months
    const stats = [];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = `${months[date.getMonth()]} ${date.getFullYear()}`;

      // Try to fetch from monthlyStats collection
      const statsDoc = await firestore
        .collection('monthlyStats')
        .doc(`${organizationId}_${monthKey}`)
        .get();

      if (statsDoc.exists) {
        const data = statsDoc.data();
        stats.push({
          month: monthName,
          totalDevices: data?.totalDevices || 0,
          activeDevices: data?.activeDevices || 0,
          alerts: data?.alerts || 0,
          securityScore: data?.securityScore || 0
        });
      } else {
        // If no data exists, return zeros
        stats.push({
          month: monthName,
          totalDevices: 0,
          activeDevices: 0,
          alerts: 0,
          securityScore: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Error fetching monthly stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch monthly stats', 
        message: error.message,
        stats: []
      },
      { status: 500 }
    );
  }
}
