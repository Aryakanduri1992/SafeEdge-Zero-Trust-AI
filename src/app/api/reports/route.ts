import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const MAX_REPORTS = 200;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Get reports for the organization
    const reportsSnapshot = await firestore
      .collection('reports')
      .where('organizationId', '==', organizationId)
      .orderBy('generatedAt', 'desc')
      .limit(limit)
      .get();

    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      reports
    });

  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reports', 
        message: error.message,
        reports: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, title, type, description, fileUrl, metadata } = body;

    if (!organizationId || !title || !type) {
      return NextResponse.json(
        { error: 'organizationId, title, and type are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Check current report count for this organization
    const reportsSnapshot = await firestore
      .collection('reports')
      .where('organizationId', '==', organizationId)
      .orderBy('generatedAt', 'asc')
      .get();

    // If we have 200 or more, delete the oldest ones to maintain limit
    if (reportsSnapshot.size >= MAX_REPORTS) {
      const deleteCount = reportsSnapshot.size - MAX_REPORTS + 1;
      const batch = firestore.batch();
      
      for (let i = 0; i < deleteCount; i++) {
        batch.delete(reportsSnapshot.docs[i].ref);
      }
      
      await batch.commit();
    }

    // Add new report
    const newReport = {
      organizationId,
      title,
      type, // 'device-usage', 'monthly-summary', 'security-audit', 'custom', etc.
      description: description || '',
      fileUrl: fileUrl || null,
      metadata: metadata || {},
      generatedAt: new Date().toISOString(),
      status: 'completed' // 'pending', 'processing', 'completed', 'failed'
    };

    const docRef = await firestore
      .collection('reports')
      .add(newReport);

    return NextResponse.json({
      success: true,
      report: {
        id: docRef.id,
        ...newReport
      }
    });

  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    await firestore
      .collection('reports')
      .doc(reportId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Report deleted'
    });

  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report', message: error.message },
      { status: 500 }
    );
  }
}
