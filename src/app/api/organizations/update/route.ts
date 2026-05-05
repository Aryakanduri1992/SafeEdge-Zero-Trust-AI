import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      organizationId,
      email,
      contactPerson,
      phoneNumber,
      address,
      city,
      state,
      zipCode
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    // Fields that organization admins can update
    const allowedUpdates: any = {};
    
    if (email !== undefined) allowedUpdates.email = email;
    if (contactPerson !== undefined) allowedUpdates.contactPerson = contactPerson;
    if (phoneNumber !== undefined) allowedUpdates.phoneNumber = phoneNumber;
    if (address !== undefined) allowedUpdates.address = address;
    if (city !== undefined) allowedUpdates.city = city;
    if (state !== undefined) allowedUpdates.state = state;
    if (zipCode !== undefined) allowedUpdates.zipCode = zipCode;

    // Add updated timestamp
    allowedUpdates.updatedAt = new Date().toISOString();

    // Update organization document
    await firestore
      .collection('organizations')
      .doc(organizationId)
      .update(allowedUpdates);

    // Fetch updated organization data
    const orgDoc = await firestore
      .collection('organizations')
      .doc(organizationId)
      .get();

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      organization: {
        id: orgDoc.id,
        ...orgDoc.data()
      }
    });

  } catch (error: any) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization', message: error.message },
      { status: 500 }
    );
  }
}
