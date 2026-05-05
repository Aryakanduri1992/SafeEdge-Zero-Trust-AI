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
    const { userId, role } = await request.json();

    // Super admins can see all organizations
    if (role === 'super_admin' || role === 'superadmin' || role === 'admin') {
      const orgsSnapshot = await db.collection('organizations').get();
      const organizations = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ organizations });
    }

    // Regular users see only their organization
    if (userId) {
      const orgDoc = await db.collection('organizations').doc(userId).get();
      
      if (orgDoc.exists) {
        return NextResponse.json({
          organizations: [{
            id: orgDoc.id,
            ...orgDoc.data()
          }]
        });
      }
    }

    return NextResponse.json({ organizations: [] });

  } catch (error: any) {
    console.error('Organizations API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
