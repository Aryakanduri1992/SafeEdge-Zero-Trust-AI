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

    console.log('🔐 Login attempt for:', email);
    const firestore = getAdminFirestore();

    // Check in organizations collection first
    const orgSnapshot = await firestore
      .collection('organizations')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!orgSnapshot.empty) {
      const orgDoc = orgSnapshot.docs[0];
      const orgData = orgDoc.data();
      
      console.log('👤 Found organization:', orgData.name);
      
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
        
        console.log('✅ Login successful for organization:', orgData.name);

        return NextResponse.json({
          user: {
            id: orgDoc.id,
            email: orgData.email,
            role: 'organization',
            organizationName: orgData.name,
            organizationId: orgDoc.id
          },
          token
        });
      }
    }

    // Check in users collection
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log('👤 Found user:', userData.email, 'Role:', userData.role);
      
      // Check if password matches (support both plain text and hashed)
      let passwordMatch = false;
      if (userData.password && userData.password.startsWith('$2')) {
        // Bcrypt hashed password
        passwordMatch = await bcrypt.compare(password, userData.password);
      } else if (userData.password) {
        // Plain text password (legacy)
        passwordMatch = userData.password === password;
      }
      
      if (passwordMatch) {
        const token = crypto.randomBytes(32).toString('hex');
        
        console.log('✅ Login successful for user:', userData.email);

        return NextResponse.json({
          user: {
            id: userDoc.id,
            email: userData.email,
            role: userData.role || 'organization',
            organizationName: userData.organizationName,
            organizationId: userData.organizationId
          },
          token
        });
      }
    }

    // Check in roles_super_admin collection for super admins
    const superAdminSnapshot = await firestore
      .collection('roles_super_admin')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!superAdminSnapshot.empty) {
      const adminDoc = superAdminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      console.log('👤 Found super admin:', adminData.email);
      
      // Check if password matches (support both plain text and hashed)
      let passwordMatch = false;
      if (adminData.password && adminData.password.startsWith('$2')) {
        // Bcrypt hashed password
        passwordMatch = await bcrypt.compare(password, adminData.password);
      } else if (adminData.password) {
        // Plain text password (legacy)
        passwordMatch = adminData.password === password;
      }
      
      if (passwordMatch) {
        const token = crypto.randomBytes(32).toString('hex');
        
        console.log('✅ Login successful for super admin:', adminData.email);

        return NextResponse.json({
          user: {
            id: adminDoc.id,
            email: adminData.email,
            role: 'superadmin',
            organizationName: adminData.departmentName,
            organizationId: null
          },
          token
        });
      }
    }

    console.log('❌ Invalid credentials for:', email);
    
    // Invalid credentials
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('❌ Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
