import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to Python backend which has decryption capability
    const backendUrl = 'http://localhost:8000/api/decrypt-sensor-data';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Decryption failed' }));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to decrypt sensor data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: data.success || true,
      data: data.data,
      decrypted_at: data.decrypted_at || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error decrypting sensor data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}