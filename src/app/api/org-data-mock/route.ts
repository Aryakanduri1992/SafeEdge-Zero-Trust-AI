import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    console.log('Mock: Fetching data for organization:', organizationId);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Return mock data for RV University
    const mockResponse = {
      success: true,
      organization: {
        id: organizationId,
        name: "RV University",
        type: "university",
        address: "Bangalore, India"
      },
      departments: [
        {
          id: "dTXMYeAKUje6UBeBNTJO",
          name: "SOCSE",
          organizationId: organizationId,
          description: "School of Computer Science and Engineering"
        }
      ],
      floors: [
        {
          id: "floor1",
          floorNumber: 1,
          floorName: "Ground Floor",
          organizationId: organizationId,
          totalArea: 1000,
          rooms: [
            {
              id: "room101",
              identifier: "R101",
              name: "IoT Lab",
              type: "laboratory",
              area: 50
            },
            {
              id: "room102", 
              identifier: "R102",
              name: "Conference Room",
              type: "meeting",
              area: 30
            }
          ]
        }
      ],
      devices: [
        {
          id: "iot_temperature_sensor_20260414185938_62fd12aa",
          name: "TEMP",
          type: "temperature_sensor",
          status: "offline", // Will be overridden by real-time status
          departmentId: "dTXMYeAKUje6UBeBNTJO",
          floorId: "floor1",
          roomId: "room101",
          organizationId: organizationId,
          esp32DeviceId: "iot_temperature_sensor_20260414185938_62fd12aa",
          connectionType: "ethernet",
          manufacturer: "Espressif",
          model: "ESP32-DevKit",
          notes: "Temperature sensor for IoT lab monitoring"
        }
      ],
      statistics: {
        totalDepartments: 1,
        totalFloors: 1,
        totalRooms: 2,
        totalDevices: 1,
        totalArea: 1000,
      }
    };

    console.log('Mock: Returning organization data');

    return NextResponse.json(mockResponse);

  } catch (error: any) {
    console.error('Mock: Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization data', message: error.message },
      { status: 500 }
    );
  }
}