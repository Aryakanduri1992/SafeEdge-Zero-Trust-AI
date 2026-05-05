import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const { userId, role, organizationId } = await request.json();

    // Super admins can see all departments
    if (role === 'super_admin' || role === 'superadmin' || role === 'admin') {
      const deptsSnapshot = await db.collection('departments').get();
      const departments = deptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ departments });
    }

    // Organization users see only their departments
    if (organizationId) {
      const deptsSnapshot = await db.collection('departments')
        .where('organizationId', '==', organizationId)
        .get();
      
      const departments = deptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ departments });
    }

    return NextResponse.json({ departments: [] });

  } catch (error: any) {
    console.error('Departments API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
