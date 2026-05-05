import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const { deviceId } = await params;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Forward request to Python backend which has Firebase Realtime Database access
    const backendUrl = `http://localhost:8000/api/sensor-data/${deviceId}/encrypted?hours=${hours}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch sensor data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      device_id: deviceId,
      hours: hours,
      count: data.count || 0,
      encrypted_data: data.encrypted_data || []
    });

  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}