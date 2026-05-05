import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      type,
      departmentId,
      floorId,
      roomId,
      organizationId,
      manufacturer,
      model,
      macAddress,
      ipAddress,
      notes,
      status = 'offline',
      esp32DeviceId,
      connectionType
    } = body;

    // Validation
    if (!name || !type || !departmentId || !floorId || !roomId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Create device document
    const deviceData = {
      name,
      type,
      departmentId,
      floorId,
      roomId,
      organizationId,
      manufacturer: manufacturer || '',
      model: model || '',
      macAddress: macAddress || '',
      ipAddress: ipAddress || '',
      notes: notes || '',
      status,
      esp32DeviceId: esp32DeviceId || null, // Link to ESP32 device in Firebase
      connectionType: connectionType || 'ethernet',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const deviceRef = await firestore.collection('devices').add(deviceData);

    console.log('Device added successfully:', deviceRef.id);

    return NextResponse.json({
      success: true,
      deviceId: deviceRef.id,
      message: 'Device added successfully'
    });

  } catch (error: any) {
    console.error('Error adding device:', error);
    return NextResponse.json(
      { error: 'Failed to add device', message: error.message },
      { status: 500 }
    );
  }
}
