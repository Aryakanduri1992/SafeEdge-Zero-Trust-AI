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

    // Get all devices for the organization
    const devicesSnapshot = await firestore
      .collection('devices')
      .where('organizationId', '==', organizationId)
      .get();

    let devices = devicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Update device status from backend API (same logic as org-data API)
    for (let device of devices) {
      if (device.esp32DeviceId) {
        try {
          const statusResponse = await fetch(`http://localhost:8000/api/devices/${device.esp32DeviceId}/status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            device.status = statusData.status;
            device.last_seen = statusData.last_seen;
          }
        } catch (error) {
          // Keep original status from Firestore if backend is unavailable
        }
      }
    }

    // Calculate device connectivity
    const totalDevices = devices.length;
    const onlineDevices = devices.filter((d: any) => d.status === 'online').length;
    const deviceConnectivity = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    // Get security metrics
    const today = new Date().toISOString().split('T')[0];
    const metricId = `${organizationId}_${today}`;
    const metricDoc = await firestore
      .collection('securityMetrics')
      .doc(metricId)
      .get();

    const securityScore = metricDoc.exists ? metricDoc.data()?.metrics?.securityScore || 0 : 0;

    // Get network status from Firestore (stored by network monitoring service)
    // If not available, calculate based on online devices
    const networkMetricDoc = await firestore
      .collection('networkMetrics')
      .doc(organizationId)
      .get();

    let networkStatus = 0;
    if (networkMetricDoc.exists) {
      networkStatus = networkMetricDoc.data()?.status || 0;
    } else if (totalDevices > 0 && onlineDevices > 0) {
      // If no network metrics stored, calculate based on device connectivity
      networkStatus = deviceConnectivity;
    }

    // Calculate storage usage - only show if devices exist
    const orgDoc = await firestore
      .collection('organizations')
      .doc(organizationId)
      .get();

    const orgData = orgDoc.data();
    const maxDevices = orgData?.maxDevices || 100;
    const storageUsage = totalDevices === 0 ? 0 : Math.round((totalDevices / maxDevices) * 100);

    return NextResponse.json({
      success: true,
      systemHealth: {
        deviceConnectivity,
        networkStatus,
        securityScore,
        storageUsage,
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices
      }
    });

  } catch (error: any) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch system health', 
        message: error.message,
        systemHealth: {
          deviceConnectivity: 0,
          networkStatus: 0,
          securityScore: 0,
          storageUsage: 0,
          totalDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0
        }
      },
      { status: 500 }
    );
  }
}
