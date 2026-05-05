import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    console.log('Fetching data for organization:', organizationId);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Get organization data from Firestore
    const orgDoc = await firestore.collection('organizations').doc(organizationId).get();
    
    if (!orgDoc.exists) {
      console.error('Organization not found:', organizationId);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = { id: orgDoc.id, ...orgDoc.data() };
    console.log('Organization found:', orgData.name);

    // Get departments from Firestore
    let departments = [];
    try {
      const departmentsSnapshot = await firestore
        .collection('departments')
        .where('organizationId', '==', organizationId)
        .get();
      
      departments = departmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Departments found:', departments.length);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }

    // Get floor plans from Firestore
    let floors = [];
    try {
      const floorsSnapshot = await firestore
        .collection('floorPlans')
        .where('organizationId', '==', organizationId)
        .get();
      
      floors = floorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by floor number
      floors.sort((a: any, b: any) => a.floorNumber - b.floorNumber);
      console.log('Floors found:', floors.length);
    } catch (error) {
      console.error('Error fetching floors:', error);
    }

    // Get devices from Firestore (basic info) and merge with Realtime Database status
    let devices = [];
    try {
      const devicesSnapshot = await firestore
        .collection('devices')
        .where('organizationId', '==', organizationId)
        .get();
      
      devices = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Devices found in Firestore:', devices.length);

      // For each device, try to get real-time status from backend API
      for (let device of devices) {
        if (device.esp32DeviceId) {
          try {
            const statusResponse = await fetch(`http://localhost:8000/api/devices/${device.esp32DeviceId}/status`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              device.status = statusData.status;
              device.last_seen = statusData.last_seen;
              device.battery_level = statusData.battery_level;
              device.signal_strength = statusData.signal_strength;
              device.threat_level = statusData.threat_level;
              console.log(`Updated status for ${device.name}: ${statusData.status}`);
            }
          } catch (error) {
            console.log(`Could not fetch real-time status for ${device.name}:`, error);
            // Keep original status from Firestore
          }
        }
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }

    // Calculate statistics
    const totalRooms = floors.reduce((sum: number, floor: any) => 
      sum + (floor.rooms?.length || 0), 0
    );

    const totalArea = floors.reduce((sum: number, floor: any) => 
      sum + (floor.totalArea || 0), 0
    );

    const response = {
      success: true,
      organization: orgData,
      departments,
      floors,
      devices,
      statistics: {
        totalDepartments: departments.length,
        totalFloors: floors.length,
        totalRooms,
        totalDevices: devices.length,
        totalArea,
      }
    };

    console.log('Returning data:', {
      departments: departments.length,
      floors: floors.length,
      devices: devices.length,
      rooms: totalRooms
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization data', message: error.message },
      { status: 500 }
    );
  }
}
