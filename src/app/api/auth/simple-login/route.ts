import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Check in organizations collection
    const orgSnapshot = await firestore
      .collection('organizations')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!orgSnapshot.empty) {
      const orgDoc = orgSnapshot.docs[0];
      const orgData = orgDoc.data();
      
      // Check if password matches (support both plain text and hashed)
      let passwordMatch = false;
      if (orgData.password && orgData.password.startsWith('$2')) {
        // Bcrypt hashed password
        passwordMatch = await bcrypt.compare(password, orgData.password);
      } else if (orgData.password) {
        // Plain text password (legacy)
        passwordMatch = orgData.password === password;
      }
      
      if (passwordMatch) {
        const token = crypto.randomBytes(32).toString('hex');

        // Store session in Firestore
        await firestore.collection('sessions').doc(token).set({
          userId: orgDoc.id,
          email: orgData.email,
          role: 'admin', // Changed from 'organization' to 'admin'
          organizationId: orgDoc.id,
          organizationName: orgData.name,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        return NextResponse.json({
          success: true,
          user: {
            id: orgDoc.id,
            email: orgData.email,
            role: 'admin', // Changed from 'organization' to 'admin'
            organizationName: orgData.name,
            organizationId: orgDoc.id,
          },
          token,
        });
      }
    }

    // Check in users collection for superadmin
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check if password matches
      let passwordMatch = false;
      if (userData.password && userData.password.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, userData.password);
      } else if (userData.password) {
        passwordMatch = userData.password === password;
      }
      
      if (passwordMatch) {
        const token = crypto.randomBytes(32).toString('hex');

        // Store session
        await firestore.collection('sessions').doc(token).set({
          userId: userDoc.id,
          email: userData.email,
          role: userData.role || 'organization',
          organizationId: userData.organizationId,
          organizationName: userData.organizationName,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return NextResponse.json({
          success: true,
          user: {
            id: userDoc.id,
            email: userData.email,
            role: userData.role || 'organization',
            organizationName: userData.organizationName,
            organizationId: userData.organizationId,
          },
          token,
        });
      }
    }

    // Invalid credentials
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Simple Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
