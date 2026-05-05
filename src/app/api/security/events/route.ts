import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();
    let query = firestore
      .collection('securityEvents')
      .where('organizationId', '==', organizationId);

    if (severity && severity !== 'all') {
      query = query.where('severity', '==', severity);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
      hasMore: events.length === limit
    });

  } catch (error: any) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events', message: error.message },
      { status: 500 }
    );
  }
}
