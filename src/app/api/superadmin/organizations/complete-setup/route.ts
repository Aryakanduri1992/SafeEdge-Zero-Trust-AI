import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import { completeOrganizationSetupSchema } from '@/lib/validations/organization-wizard';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validatedData = completeOrganizationSetupSchema.parse(body);
    const { organization, departments, floors, devices } = validatedData;

    const firestore = getAdminFirestore();
    const auth = getAdminAuth();

    // Check for duplicate email
    const existingOrg = await firestore
      .collection('organizations')
      .where('email', '==', organization.email)
      .limit(1)
      .get();

    if (!existingOrg.empty) {
      return NextResponse.json(
        { success: false, error: 'An organization with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(organization.password, 12);

    // Create Firebase Auth user
    let firebaseUserId: string;
    try {
      const userRecord = await auth.createUser({
        email: organization.email,
        password: organization.password,
        emailVerified: true,
        displayName: organization.name,
      });
      firebaseUserId = userRecord.uid;
      console.log('✅ Firebase Auth user created:', firebaseUserId);
    } catch (authError: any) {
      console.error('⚠️ Firebase Auth creation failed:', authError.message);
      // Continue anyway - we'll store in Firestore
      firebaseUserId = '';
    }

    // Create organization document
    const orgRef = firestore.collection('organizations').doc();
    const organizationId = orgRef.id;

    const organizationData = {
      id: organizationId,
      name: organization.name,
      email: organization.email,
      password: hashedPassword,
      plan: organization.plan,
      maxDevices: organization.maxDevices,
      contactPerson: organization.contactPerson,
      phoneNumber: organization.phoneNumber,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      zipCode: organization.zipCode,
      country: organization.country,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    // Use Firestore batch for atomic writes
    const batch = firestore.batch();
    
    // Add organization
    batch.set(orgRef, organizationData);

    // Add departments
    const departmentIds: Record<string, string> = {};
    for (const dept of departments) {
      const deptRef = firestore.collection('departments').doc();
      departmentIds[dept.id] = deptRef.id;
      
      batch.set(deptRef, {
        id: deptRef.id,
        organizationId,
        name: dept.name,
        description: dept.description || '',
        headOfDepartment: dept.headOfDepartment,
        email: dept.email,
        phoneNumber: dept.phoneNumber,
        budget: dept.budget || 0,
        maxDevices: dept.maxDevices,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Add floor plans with rooms
    const floorIds: Record<string, string> = {};
    for (const floor of floors) {
      const floorRef = firestore.collection('floorPlans').doc();
      floorIds[floor.id] = floorRef.id;

      // Map room identifiers to actual department IDs
      const roomsData = floor.rooms.map(room => ({
        id: room.id,
        identifier: room.identifier,
        name: room.name,
        type: room.type,
        width: room.width,
        height: room.height,
        capacity: room.capacity,
        departmentId: room.departmentId ? departmentIds[room.departmentId] : null,
        position: room.position,
        deviceIds: [],
      }));

      batch.set(floorRef, {
        id: floorRef.id,
        organizationId,
        floorNumber: floor.floorNumber,
        floorName: floor.floorName,
        totalArea: floor.totalArea,
        description: floor.description || '',
        rooms: roomsData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Add devices
    for (const device of devices) {
      const deviceRef = firestore.collection('devices').doc();
      
      // Find the floor that contains this room
      const floor = floors.find(f => f.rooms.some(r => r.id === device.roomId));
      const floorId = floor ? floorIds[floor.id] : null;

      batch.set(deviceRef, {
        id: deviceRef.id,
        organizationId,
        name: device.name,
        type: device.type,
        roomId: device.roomId,
        floorId,
        manufacturer: device.manufacturer || '',
        model: device.model || '',
        serialNumber: device.serialNumber || '',
        status: device.status || 'offline',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Commit batch
    await batch.commit();

    // Create user profile in users collection if Firebase Auth user was created
    if (firebaseUserId) {
      try {
        await firestore.collection('users').doc(firebaseUserId).set({
          email: organization.email,
          role: 'admin',
          organizationId: organizationId,
          organizationName: organization.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('✅ User profile created in Firestore');
      } catch (error) {
        console.error('⚠️ Failed to create user profile:', error);
      }
    }

    // Create summary
    const summary = {
      organizationId,
      organizationName: organization.name,
      totalFloors: floors.length,
      totalRooms: floors.reduce((sum, floor) => sum + floor.rooms.length, 0),
      totalDepartments: departments.length,
      totalDevices: devices.length,
      plan: organization.plan,
      maxDevices: organization.maxDevices,
      firebaseAuthCreated: !!firebaseUserId,
    };

    return NextResponse.json({
      success: true,
      organizationId,
      summary,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid organization data', 
          details: error.errors,
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create organization', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
