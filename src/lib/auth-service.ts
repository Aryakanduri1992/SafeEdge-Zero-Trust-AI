
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
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData } from './types';
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
    
    // Primary, robust check: Directly query the super_admin role document.
    // This is not subject to token claim propagation delays.
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
        // This could be a legitimate permission error if rules are strict, but we still want to check for org user.
        console.warn("Could not check for super admin role, proceeding to check for organization role.", error.message);
    }

    // If not a super admin, check for a regular organization admin profile.
    const orgRef = doc(firestore, "organizations", uid);
    try {
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
            return { ...orgSnap.data(), id: uid, role: 'admin' } as Organization;
        }
    } catch (error) {
        console.error("Error fetching organization user profile:", error);
         if (error instanceof Error && error.message.includes("permission-denied")) {
             errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orgRef.path, operation: 'get' }));
        }
        return null;
    }
    
    // If no profile is found in either collection, the user is invalid.
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

        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
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
