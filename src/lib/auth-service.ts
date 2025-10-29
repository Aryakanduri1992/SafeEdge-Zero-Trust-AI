
"use client";

import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser,
  UserCredential,
  getIdTokenResult
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, writeBatch, collection, addDoc, deleteDoc } from 'firebase/firestore';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData, Device, UpdateDeviceStatusData } from './types';
import { initializeFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';

const { firestore, auth } = initializeFirebase();

export async function login(credentials: LoginCredentials): Promise<UserCredential> {
    const { email, password } = credentials;
    if (!password) {
        throw new Error("Password is required for login.");
    }
    
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        let friendlyMessage = 'An unexpected error occurred during login.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            friendlyMessage = 'Invalid email or password. Please try again.';
        }
        throw new Error(friendlyMessage);
    }
};

export async function fetchUserProfile(user: FirebaseUser): Promise<SuperAdminUser | Organization | null> {
    const uid = user.uid;
    
    // Attempt to fetch super admin role
    const superAdminRef = doc(firestore, "roles_super_admin", uid);
    try {
        const superAdminSnap = await getDoc(superAdminRef);
        if (superAdminSnap.exists()) {
            const superAdminData = superAdminSnap.data();
            return {
                id: uid,
                role: 'superadmin',
                email: superAdminData?.email,
                departmentName: superAdminData?.departmentName,
            } as SuperAdminUser;
        }
    } catch (error: any) {
        // This is an expected "failure" for non-superadmins.
        // We log it for debugging but don't re-throw or emit a global error.
        if (error.code === 'permission-denied') {
            // This is normal. User is not a super admin. Continue to the next check.
        } else {
            console.warn("Could not check for super admin role due to an unexpected error:", error.message);
        }
    }

    // If not a super admin, check for organization role
    const orgRef = doc(firestore, "organizations", uid);
    try {
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
            return { ...orgSnap.data(), id: uid, role: 'admin' } as Organization;
        }
    } catch (error: any) {
        // A permission error here is a real problem and should be surfaced.
        if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("insufficient permissions"))) {
             const permissionError = new FirestorePermissionError({ path: orgRef.path, operation: 'get' });
             errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Error fetching organization user profile:", error);
        }
        // If we fail to get the org profile, we cannot proceed.
        return null;
    }
    
    // If user is neither a super admin nor an organization user, return null.
    return null;
}

export const logout = async (): Promise<void> => {
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

        const newOrgProfile: Omit<Organization, 'id' | 'role' | 'imageUrl'> = {
            organizationName: orgData.organizationName,
            email: orgData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
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

        await batch.commit().catch(serverError => {
            const permissionError = new FirestorePermissionError({
                 path: `organizations/${newOrgUID} and departments`,
                 operation: 'write',
                 requestResourceData: { organization: newOrgProfile, department: newDepartment }
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

    } catch (error: any) {
        if (error instanceof FirestorePermissionError) throw error;
        
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = `Creation failed: Email already in use. Please choose a different email.`;
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
    const newDevice: Omit<Device, 'id'> = {
        ...deviceData,
        status: 'offline',
        lastSeen: new Date().toISOString(),
    };
    const colRef = collection(firestore, 'devices');
    await addDoc(colRef, newDevice).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: colRef.path,
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

export const updateOrganizationImage = async (organizationId: string, imageUrl: string): Promise<void> => {
    const organizationDocRef = doc(firestore, "organizations", organizationId);
    const updateData = { imageUrl };
    await updateDoc(organizationDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: organizationDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

export const updateDeviceStatus = async (deviceId: string, statusData: UpdateDeviceStatusData): Promise<void> => {
    const deviceRef = doc(firestore, 'devices', deviceId);
    await updateDoc(deviceRef, statusData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: deviceRef.path,
            operation: 'update',
            requestResourceData: statusData,
        });
        // We emit the error but don't re-throw, as this is a background task.
        // The main UI flow shouldn't be blocked if this fails.
        errorEmitter.emit('permission-error', permissionError);
        console.warn(`Could not update device status for ${deviceId}:`, serverError.message);
    });
};

    