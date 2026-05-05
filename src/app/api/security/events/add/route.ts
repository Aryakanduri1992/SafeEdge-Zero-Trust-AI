import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      organizationId,
      eventType,
      severity,
      title,
      description,
      location,
      deviceId,
      userId,
      metadata
    } = body;

    // Validation
    if (!organizationId || !eventType || !severity || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();
    const eventsRef = firestore.collection('securityEvents');

    // Count current events for this organization
    const countSnapshot = await eventsRef
      .where('organizationId', '==', organizationId)
      .count()
      .get();
    
    const currentCount = countSnapshot.data().count;

    // If at or over 150 limit, delete oldest event
    if (currentCount >= 150) {
      const oldestSnapshot = await eventsRef
        .where('organizationId', '==', organizationId)
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();
      
      if (!oldestSnapshot.empty) {
        const oldestDoc = oldestSnapshot.docs[0];
        
        // Optional: Archive before deletion
        await firestore.collection('securityEventsArchive').add({
          ...oldestDoc.data(),
          archivedAt: FieldValue.serverTimestamp(),
          originalId: oldestDoc.id
        });
        
        // Delete oldest event
        await oldestDoc.ref.delete();
        console.log(`Deleted oldest event (${oldestDoc.id}) to maintain 150 limit`);
      }
    }

    // Add new event
    const eventData = {
      organizationId,
      eventType,
      severity,
      status: 'active',
      title,
      description,
      location: location || null,
      deviceId: deviceId || null,
      userId: userId || null,
      metadata: metadata || {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      resolvedAt: null,
      resolvedBy: null,
      notes: ''
    };

    const newEventRef = await eventsRef.add(eventData);

    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    const metricId = `${organizationId}_${today}`;
    const metricRef = firestore.collection('securityMetrics').doc(metricId);
    
    const metricDoc = await metricRef.get();
    
    if (metricDoc.exists) {
      // Update existing metrics
      const currentMetrics = metricDoc.data();
      const updates: any = {
        totalEvents: (currentMetrics?.totalEvents || 0) + 1,
        updatedAt: FieldValue.serverTimestamp()
      };
      
      // Increment severity count
      if (severity === 'critical') updates.criticalCount = (currentMetrics?.criticalCount || 0) + 1;
      if (severity === 'high') updates.highCount = (currentMetrics?.highCount || 0) + 1;
      if (severity === 'medium') updates.mediumCount = (currentMetrics?.mediumCount || 0) + 1;
      if (severity === 'low') updates.lowCount = (currentMetrics?.lowCount || 0) + 1;
      
      // Increment active alerts
      updates.activeAlerts = (currentMetrics?.activeAlerts || 0) + 1;
      
      await metricRef.update(updates);
    } else {
      // Create new metrics document
      await metricRef.set({
        organizationId,
        date: today,
        metrics: {
          totalEvents: 1,
          criticalCount: severity === 'critical' ? 1 : 0,
          highCount: severity === 'high' ? 1 : 0,
          mediumCount: severity === 'medium' ? 1 : 0,
          lowCount: severity === 'low' ? 1 : 0,
          resolvedCount: 0,
          activeAlerts: 1,
          securityScore: 94,
          threatLevel: severity === 'critical' ? 'high' : 'low'
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    console.log(`Security event added successfully: ${newEventRef.id}`);

    return NextResponse.json({
      success: true,
      eventId: newEventRef.id,
      message: 'Security event added successfully',
      currentCount: currentCount >= 150 ? 150 : currentCount + 1
    });

  } catch (error: any) {
    console.error('Error adding security event:', error);
    return NextResponse.json(
      { error: 'Failed to add security event', message: error.message },
      { status: 500 }
    );
  }
}
