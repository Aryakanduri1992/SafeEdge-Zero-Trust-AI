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
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const metricId = `${organizationId}_${today}`;

    // Try to get today's metrics
    const metricDoc = await firestore
      .collection('securityMetrics')
      .doc(metricId)
      .get();

    if (metricDoc.exists) {
      return NextResponse.json({
        success: true,
        ...metricDoc.data()
      });
    }

    // If no metrics exist, return default values
    return NextResponse.json({
      success: true,
      securityScore: 94,
      threatLevel: 'low',
      totalEvents: 0,
      activeAlerts: 0,
      resolvedToday: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0
    });

  } catch (error: any) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security metrics', message: error.message },
      { status: 500 }
    );
  }
}
