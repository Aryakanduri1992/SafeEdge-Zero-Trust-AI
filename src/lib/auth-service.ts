
"use client";

import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser,
  getIdTokenResult,
  type ParsedToken
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, writeBatch, collection, addDoc, deleteDoc } from 'firebase/firestore';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData } from './types';
import { initializeFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';

const { firestore } = initializeFirebase();

export async function getOrCreateUserProfile(user: FirebaseUser, claims: ParsedToken): Promise<SuperAdminUser | Organization | null> {
    const uid = user.uid;

    if (claims.superadmin) {
        const superAdminRef = doc(firestore, "roles_super_admin", uid);
        try {
            let superAdminSnap = await getDoc(superAdminRef);
            if (!superAdminSnap.exists()) {
                // If it doesn't exist, create it. This is the "get or create" part.
                const newSuperAdminProfile: Omit<SuperAdminUser, 'id' | 'role'> = {
                    email: user.email || 'super@authstation.com',
                    departmentName: "AuthStation HQ",
                    imageUrl: `https://picsum.photos/seed/${uid}/200/200`
                };
                await setDoc(superAdminRef, newSuperAdminProfile);
                superAdminSnap = await getDoc(superAdminRef); // Re-fetch after creation
            }
            if (superAdminSnap.exists()) {
                const superAdminData = superAdminSnap.data();
                return {
                    id: uid,
                    role: 'superadmin',
                    email: superAdminData?.email,
                    departmentName: superAdminData?.departmentName,
                    imageUrl: superAdminData?.imageUrl,
                } as SuperAdminUser;
            }
        } catch (serverError: any) {
            const permissionError = new FirestorePermissionError({
                path: superAdminRef.path,
                operation: 'write', // broader operation for get/set
                requestResourceData: { uid, email: user.email },
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    } else {
        // This logic is for regular organization users
        const orgRef = doc(firestore, "organizations", uid);
        try {
            const orgSnap = await getDoc(orgRef);
            if (orgSnap.exists()) {
                return { ...orgSnap.data(), id: uid, role: 'admin' } as Organization;
            }
        } catch (serverError: any) {
            const permissionError = new FirestorePermissionError({ path: orgRef.path, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    }

    // This should only be reached if a non-superadmin user logs in who doesn't have an org profile.
    console.error("User profile not found or could not be created. UID:", uid);
    return null;
}


export const login = async (credentials: LoginCredentials): Promise<FirebaseUser> => {
  const { auth } = initializeFirebase();
  const { email, password } = credentials;
  if (!password) {
      throw new Error("Password is required for login.");
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  const { auth } = initializeFirebase();
  await signOut(auth);
};

export const createOrganization = async (orgData: NewOrgData, superAdminId: string): Promise<void> => {
    if (!orgData.password) throw new Error("A password is required to create a new organization.");
    if (!orgData.email) throw new Error("An email is required to create a new organization.");

    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    let userCredential;

    try {
        userCredential = await createUserWithEmailAndPassword(tempAuth, orgData.email, orgData.password);
        const newOrgUID = userCredential.user.uid;

        const batch = writeBatch(firestore);

        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
            organizationName: orgData.organizationName,
            email: orgData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
            imageUrl: `https://picsum.photos/seed/${Math.round(Math.random() * 1000)}/200/200`,
        };
        const orgDocRef = doc(firestore, "organizations", newOrgUID);
        batch.set(orgDocRef, newOrgProfile);
        
        const newDepartment: Omit<Department, 'id'> = {
            departmentName: orgData.departmentName,
            organizationName: orgData.organizationName,
            email: orgData.email,
            building: orgData.building,
            floor: orgData.floor,
            location: orgData.location,
            createdAt: new Date().toISOString(),
            devices: orgData.devices,
            plan: orgData.plan,
            status: 'active',
            superAdminId: superAdminId,
            organizationId: newOrgUID,
        };
        const deptDocRef = doc(collection(firestore, "departments"));
        batch.set(deptDocRef, newDepartment);

        await batch.commit();

    } catch (error: any) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = `Creation failed: Email already in use. Please choose a different email.`;
        } else if (error.code?.includes('permission-denied') || error.name === 'FirebaseError') {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                 path: `organizations and/or departments`,
                 operation: 'create',
                 requestResourceData: orgData
             }));
             errorMessage = 'Creation failed due to a database permission error. Please check your Firestore security rules.';
        }
        throw new Error(errorMessage);
    } finally {
        if(tempAuth.currentUser) {
            await signOut(tempAuth).catch(() => {});
        }
        await deleteApp(tempApp);
    }
};

export const createDepartment = async (deptData: NewDepartmentData, superAdminId: string): Promise<void> => {
    const newDepartment: Omit<Department, 'id'> = {
        ...deptData,
        createdAt: new Date().toISOString(),
        status: 'active',
        superAdminId: superAdminId,
    };
    const deptDocRef = doc(collection(firestore, "departments"));
    
    await setDoc(deptDocRef, newDepartment).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: deptDocRef.path,
            operation: 'create',
            requestResourceData: newDepartment,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};


export const updateDepartment = async (departmentId: string, departmentData: UpdateDepartmentData): Promise<void> => {
    const departmentDocRef = doc(firestore, "departments", departmentId);
    await updateDoc(departmentDocRef, departmentData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: departmentDocRef.path,
            operation: 'update',
            requestResourceData: departmentData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const deactivateDepartment = async (departmentId: string) => {
    const departmentDocRef = doc(firestore, "departments", departmentId);
    const updateData = { status: 'inactive' };
    await updateDoc(departmentDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: departmentDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const activateDepartment = async (departmentId: string) => {
    const departmentDocRef = doc(firestore, "departments", departmentId);
    const updateData = { status: 'active' };
    await updateDoc(departmentDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: departmentDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const createDevice = async (deviceData: NewDeviceData): Promise<void> => {
    const newDevice = {
        ...deviceData,
        status: 'offline',
        lastSeen: new Date().toISOString(),
    };
    await addDoc(collection(firestore, 'devices'), newDevice).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: 'devices',
            operation: 'create',
            requestResourceData: newDevice,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const updateDevice = async (deviceId: string, deviceData: UpdateDeviceData): Promise<void> => {
    const deviceRef = doc(firestore, 'devices', deviceId);
    await updateDoc(deviceRef, deviceData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: deviceRef.path,
            operation: 'update',
            requestResourceData: deviceData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
    const deviceRef = doc(firestore, 'devices', deviceId);
    await deleteDoc(deviceRef).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: deviceRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const updateOrganizationImage = async (orgId: string, imageUrl: string): Promise<void> => {
  const orgRef = doc(firestore, 'organizations', orgId);
  const updateData = { imageUrl };
  await updateDoc(orgRef, updateData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: orgRef.path,
      operation: 'update',
      requestResourceData: updateData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const updateSuperAdminImage = async (uid: string, imageUrl: string): Promise<void> => {
    const userRef = doc(firestore, 'roles_super_admin', uid);
    const updateData = { imageUrl };
    await updateDoc(userRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};
