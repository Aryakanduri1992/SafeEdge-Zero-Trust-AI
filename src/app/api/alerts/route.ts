import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const MAX_ALERTS = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status'); // 'active', 'resolved', 'all'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    let query = firestore
      .collection('alerts')
      .where('organizationId', '==', organizationId);

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const alertsSnapshot = await query
      .get();

    const alerts = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a: any, b: any) => {
      // Sort by timestamp in memory (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Count active alerts
    const activeAlerts = alerts.filter((a: any) => a.status === 'active').length;

    return NextResponse.json({
      success: true,
      alerts,
      activeCount: activeAlerts,
      totalCount: alerts.length
    });

  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch alerts', 
        message: error.message,
        alerts: [],
        activeCount: 0,
        totalCount: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, severity, title, message, deviceId } = body;

    if (!organizationId || !severity || !title || !message) {
      return NextResponse.json(
        { error: 'organizationId, severity, title, and message are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Check current alert count for this organization
    const alertsSnapshot = await firestore
      .collection('alerts')
      .where('organizationId', '==', organizationId)
      .get();

    // If we have 200 or more, delete the oldest ones to maintain limit
    if (alertsSnapshot.size >= MAX_ALERTS) {
      const deleteCount = alertsSnapshot.size - MAX_ALERTS + 1;
      const batch = firestore.batch();
      
      // Sort alerts by timestamp to find oldest ones
      const sortedDocs = alertsSnapshot.docs.sort((a, b) => {
        const aTime = new Date(a.data().timestamp).getTime();
        const bTime = new Date(b.data().timestamp).getTime();
        return aTime - bTime; // oldest first
      });
      
      for (let i = 0; i < deleteCount; i++) {
        batch.delete(sortedDocs[i].ref);
      }
      
      await batch.commit();
    }

    const newAlert = {
      organizationId,
      severity, // 'low', 'medium', 'high', 'critical'
      title,
      message,
      deviceId: deviceId || null,
      status: 'active',
      timestamp: new Date().toISOString()
    };

    const docRef = await firestore
      .collection('alerts')
      .add(newAlert);

    return NextResponse.json({
      success: true,
      alert: {
        id: docRef.id,
        ...newAlert
      }
    });

  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { error: 'alertId and status are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    await firestore
      .collection('alerts')
      .doc(alertId)
      .update({ 
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null
      });

    return NextResponse.json({
      success: true,
      message: 'Alert updated'
    });

  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert', message: error.message },
      { status: 500 }
    );
  }
}
