import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Forward request to Python backend which has Firebase Realtime Database access
    const backendUrl = `http://localhost:8000/api/devices/${deviceId}/status`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Backend error' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch device status' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      device_id: deviceId,
      status: data.status,
      last_seen: data.last_seen,
      battery_level: data.battery_level,
      signal_strength: data.signal_strength,
      threat_level: data.threat_level,
      location: data.location
    });

  } catch (error) {
    console.error('Error fetching device status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}