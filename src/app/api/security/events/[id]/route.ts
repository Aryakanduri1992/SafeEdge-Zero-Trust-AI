import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    
    const { status, notes, resolvedBy } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();
    const eventRef = firestore.collection('securityEvents').doc(eventId);
    
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    const updateData: any = {
      status,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = FieldValue.serverTimestamp();
      if (resolvedBy) {
        updateData.resolvedBy = resolvedBy;
      }
    }

    await eventRef.update(updateData);

    // Update metrics if status changed to resolved
    if (status === 'resolved' && eventData) {
      const today = new Date().toISOString().split('T')[0];
      const metricId = `${eventData.organizationId}_${today}`;
      const metricRef = firestore.collection('securityMetrics').doc(metricId);
      
      const metricDoc = await metricRef.get();
      
      if (metricDoc.exists) {
        const currentMetrics = metricDoc.data();
        await metricRef.update({
          resolvedCount: (currentMetrics?.resolvedCount || 0) + 1,
          activeAlerts: Math.max(0, (currentMetrics?.activeAlerts || 1) - 1),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`Event ${eventId} updated to status: ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', message: error.message },
      { status: 500 }
    );
  }
}
