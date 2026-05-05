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

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (role === 'super_admin' || role === 'superadmin') {
      // Fetch super admin profile
      const adminDoc = await db.collection('roles_super_admin').doc(userId).get();

      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        return NextResponse.json({
          profile: {
            id: adminDoc.id,
            email: adminData?.email,
            role: 'superadmin',
            departmentName: adminData?.departmentName || 'System Administration'
          }
        });
      }
    }

    // Fetch organization profile
    const orgDoc = await db.collection('organizations').doc(organizationId || userId).get();

    if (orgDoc.exists) {
      const orgData = orgDoc.data();
      return NextResponse.json({
        profile: {
          id: orgDoc.id,
          email: orgData?.email,
          role: 'admin',
          name: orgData?.name,
          plan: orgData?.plan,
          maxDevices: orgData?.maxDevices,
          createdAt: orgData?.createdAt
        }
      });
    }

    // Check users collection
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return NextResponse.json({
        profile: {
          id: userDoc.id,
          email: userData?.email,
          role: userData?.role || 'admin',
          organizationName: userData?.organizationName,
          organizationId: userData?.organizationId
        }
      });
    }

    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
