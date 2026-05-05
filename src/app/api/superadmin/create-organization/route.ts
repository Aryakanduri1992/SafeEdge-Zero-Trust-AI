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
    const { name, email, password, plan, maxDevices } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if organization with this email already exists
    const existingOrg = await db.collection('organizations')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingOrg.empty) {
      return NextResponse.json(
        { error: 'An organization with this email already exists' },
        { status: 409 }
      );
    }

    // Create organization document
    const organizationData = {
      name,
      email,
      password, // In production, this should be hashed
      plan: plan || 'basic',
      maxDevices: maxDevices || 50,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };

    // Add to Firestore
    const docRef = await db.collection('organizations').add(organizationData);

    // Also add to users collection for unified authentication
    await db.collection('users').add({
      email,
      password,
      role: 'admin',
      organizationName: name,
      organizationId: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: docRef.id,
        ...organizationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Create Organization API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
