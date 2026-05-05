import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const MAX_ACTIVITIES = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Get recent activities for the organization
    // Note: Temporarily removing orderBy to avoid composite index requirement
    const activitiesSnapshot = await firestore
      .collection('activities')
      .where('organizationId', '==', organizationId)
      .limit(limit)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a: any, b: any) => {
      // Sort by timestamp in memory (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      success: true,
      activities
    });

  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch activities', 
        message: error.message,
        activities: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, type, message, metadata } = body;

    if (!organizationId || !type || !message) {
      return NextResponse.json(
        { error: 'organizationId, type, and message are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Check current activity count for this organization
    const activitiesSnapshot = await firestore
      .collection('activities')
      .where('organizationId', '==', organizationId)
      .get();

    // If we have 200 or more, delete the oldest ones to maintain limit
    if (activitiesSnapshot.size >= MAX_ACTIVITIES) {
      const deleteCount = activitiesSnapshot.size - MAX_ACTIVITIES + 1;
      const batch = firestore.batch();
      
      // Sort activities by timestamp to find oldest ones
      const sortedDocs = activitiesSnapshot.docs.sort((a, b) => {
        const aTime = new Date(a.data().timestamp).getTime();
        const bTime = new Date(b.data().timestamp).getTime();
        return aTime - bTime; // oldest first
      });
      
      for (let i = 0; i < deleteCount; i++) {
        batch.delete(sortedDocs[i].ref);
      }
      
      await batch.commit();
    }

    const newActivity = {
      organizationId,
      type, // 'device', 'security', 'department', 'floor', etc.
      message,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    const docRef = await firestore
      .collection('activities')
      .add(newActivity);

    return NextResponse.json({
      success: true,
      activity: {
        id: docRef.id,
        ...newActivity
      }
    });

  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity', message: error.message },
      { status: 500 }
    );
  }
}
