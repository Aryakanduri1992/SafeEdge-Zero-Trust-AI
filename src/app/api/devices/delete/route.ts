import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
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

    console.log(`🗑️ Deleting device: ${deviceId} from organization: ${organizationId}`);

    // Get Firestore instance
    const db = getAdminFirestore();

    // Delete from top-level devices collection (not subcollection)
    const deviceRef = db.collection('devices').doc(deviceId);

    const deviceDoc = await deviceRef.get();
    
    if (!deviceDoc.exists) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const deviceData = deviceDoc.data();
    const esp32DeviceId = deviceData?.esp32DeviceId || deviceData?.device_id;

    // Delete from Firestore top-level devices collection
    await deviceRef.delete();
    console.log(`✅ Device deleted from Firestore devices collection: ${deviceId}`);

    // If there's an ESP32 device ID, also delete from Firebase Realtime Database
    if (esp32DeviceId) {
      try {
        // Note: We can't directly delete from Firebase Realtime DB from here
        // The ESP32 device data in Firebase Realtime DB will be cleaned up
        // by the backend service or can be handled separately
        console.log(`📝 ESP32 device data cleanup needed for: ${esp32DeviceId}`);
        
        // Optional: Call backend API to clean up Firebase Realtime DB
        try {
          const backendResponse = await fetch('http://localhost:8000/api/devices/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_id: esp32DeviceId,
              organization_id: organizationId
            }),
          });

          if (backendResponse.ok) {
            console.log(`✅ ESP32 device data deleted from Firebase Realtime DB: ${esp32DeviceId}`);
          } else {
            console.log(`⚠️ Could not delete ESP32 device data from Firebase Realtime DB: ${esp32DeviceId}`);
          }
        } catch (backendError) {
          console.log(`⚠️ Backend cleanup failed for ESP32 device: ${esp32DeviceId}`, backendError);
          // Continue anyway - Firestore deletion was successful
        }
      } catch (error) {
        console.error('Error cleaning up ESP32 device data:', error);
        // Continue anyway - main device deletion was successful
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Device deleted successfully',
      deviceId: deviceId,
      esp32DeviceId: esp32DeviceId
    });

  } catch (error: any) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete device' },
      { status: 500 }
    );
  }
}