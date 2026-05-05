import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const MAX_NOTIFICATIONS = 200;

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

    // Get notifications for the organization
    const notificationsSnapshot = await firestore
      .collection('notifications')
      .where('organizationId', '==', organizationId)
      .orderBy('timestamp', 'desc')
      .limit(MAX_NOTIFICATIONS)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Count unread notifications
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications', 
        message: error.message,
        notifications: [],
        unreadCount: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, title, message, type = 'info' } = body;

    if (!organizationId || !title || !message) {
      return NextResponse.json(
        { error: 'organizationId, title, and message are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Check current notification count
    const notificationsSnapshot = await firestore
      .collection('notifications')
      .where('organizationId', '==', organizationId)
      .orderBy('timestamp', 'asc')
      .get();

    // If we have 200 or more, delete the oldest ones to maintain limit
    if (notificationsSnapshot.size >= MAX_NOTIFICATIONS) {
      const deleteCount = notificationsSnapshot.size - MAX_NOTIFICATIONS + 1;
      const batch = firestore.batch();
      
      for (let i = 0; i < deleteCount; i++) {
        batch.delete(notificationsSnapshot.docs[i].ref);
      }
      
      await batch.commit();
    }

    // Add new notification
    const newNotification = {
      organizationId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };

    const docRef = await firestore
      .collection('notifications')
      .add(newNotification);

    return NextResponse.json({
      success: true,
      notification: {
        id: docRef.id,
        ...newNotification
      }
    });

  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    await firestore
      .collection('notifications')
      .doc(notificationId)
      .update({ read: read !== false });

    return NextResponse.json({
      success: true,
      message: 'Notification updated'
    });

  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification', message: error.message },
      { status: 500 }
    );
  }
}
