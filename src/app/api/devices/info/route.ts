import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const organizationId = searchParams.get('organizationId');

    if (!deviceId || !organizationId) {
      return NextResponse.json(
        { error: 'Device ID and Organization ID are required' },
        { status: 400 }
      );
    }

    // Get device from Firestore
    const db = getAdminFirestore();
    const deviceDoc = await db.collection('devices').doc(deviceId).get();

    if (!deviceDoc.exists) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const deviceData = deviceDoc.data();

    // Verify device belongs to the organization
    if (deviceData?.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Device not found in your organization' },
        { status: 404 }
      );
    }

    // Return device info from Firestore only (status will be fetched separately)
    const device = {
      id: deviceDoc.id,
      ...deviceData,
      // Set default status - will be overridden by real-time status fetch
      status: deviceData?.status || 'offline'
    };

    return NextResponse.json({
      success: true,
      device: device
    });

  } catch (error: any) {
    console.error('Error fetching device info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}