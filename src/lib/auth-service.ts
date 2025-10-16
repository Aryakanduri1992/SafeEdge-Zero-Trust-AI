
"use client";

import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  fetchSignInMethodsForEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, writeBatch } from 'firebase/firestore';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData, UpdateAdminData, Organization } from './types';
import { initializeFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const { auth, firestore } = initializeFirebase();

export const fetchUserProfile = async (uid: string): Promise<SuperAdminUser | Organization | null> => {
    const superAdminRef = doc(firestore, "roles_super_admin", uid);
    
    try {
        const superAdminSnap = await getDoc(superAdminRef);
        if (superAdminSnap.exists()) {
            const superAdminData = superAdminSnap.data();
            return {
                id: uid,
                departmentName: superAdminData.departmentName,
                email: superAdminData.email,
                role: 'superadmin'
            };
        }
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({ path: superAdminRef.path, operation: 'get' });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }

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

    return null;
}


export const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin'): Promise<void> => {
  const { email, password } = credentials;
  if (!password) {
      throw new Error("Password is required for login.");
  }
  await signInWithEmailAndPassword(auth, email, password);
};


export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const createAdmin = async (adminData: NewAdminData, superAdminId: string): Promise<void> => {
    if (!adminData.password) throw new Error("A password is required to create a new organization.");
    if (!adminData.email) throw new Error("An email is required to create a new organization.");
    if (!adminData.departments || adminData.departments.length === 0) {
        throw new Error("At least one department must be specified.");
    }
    
    // Use a temporary, isolated Firebase app instance for the entire operation.
    const tempAppName = `temp-admin-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    let newOrgUID = '';

    try {
        // Step 1: Check if email exists using the primary auth instance.
        const signInMethods = await fetchSignInMethodsForEmail(auth, adminData.email);
        if (signInMethods.length > 0) {
            throw new Error(`An account with the email ${adminData.email} already exists. Please use a different email.`);
        }

        // Step 2: Create the user in the temporary auth instance.
        const userCredential = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
        newOrgUID = userCredential.user.uid;

        // Step 3: Perform all Firestore writes in a single batch.
        const batch = writeBatch(firestore);

        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
            organizationName: adminData.organizationName,
            email: adminData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
        };
        const orgDocRef = doc(firestore, "organizations", newOrgUID);
        batch.set(orgDocRef, newOrgProfile);
        
        for (const dept of adminData.departments) {
            const deptDocRef = doc(collection(firestore, 'admins'));
            const newDepartmentProfile: Omit<AdminUser, 'id'> = {
                departmentName: dept.departmentName,
                organizationName: adminData.organizationName,
                email: adminData.email,
                building: dept.building,
                floor: dept.floor,
                location: dept.location,
                role: 'admin',
                createdAt: new Date().toISOString(),
                devices: 10,
                plan: 'Pro',
                superAdminId: superAdminId,
                status: 'active',
                organizationId: newOrgUID,
            };
            batch.set(deptDocRef, newDepartmentProfile);
        }

        // Step 4: Commit the batch.
        await batch.commit();

    } catch (error: any) {
        if (newOrgUID) {
             // This indicates the auth user was created but the Firestore write failed.
             throw new Error(`Creation Failed: An authentication account for ${adminData.email} was created, but saving the organization data failed. This is likely due to a security rule violation. Please go to the Firebase Console, delete the user from the 'Authentication' tab, and try again after the rules are fixed. Error: ${error.message}`);
        } else {
            // This error happened during pre-checks or auth creation.
             throw error;
        }

    } finally {
        // Step 5: Always clean up the temporary app.
        if (tempAuth.currentUser) {
            await signOut(tempAuth);
        }
        await deleteApp(tempApp);
    }
};



export const updateAdmin = async (adminId: string, adminData: UpdateAdminData): Promise<void> => {
    const adminDocRef = doc(firestore, "admins", adminId);
    await updateDoc(adminDocRef, adminData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'update',
            requestResourceData: adminData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const deactivateAdmin = async (adminId: string): Promise<void> => {
    const adminDocRef = doc(firestore, "admins", adminId);
    const updateData = { status: 'inactive' };
    await updateDoc(adminDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};

export const activateAdmin = async (adminId: string): Promise<void> => {
    const adminDocRef = doc(firestore, "admins", adminId);
    const updateData = { status: 'active' };
    await updateDoc(adminDocRef, updateData).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};


// This function ensures the Super Admin user exists in Auth and Firestore.
const seedSuperAdmin = async () => {
    const superAdminEmail = 'super@authstation.com';
    const superAdminPassword = 'super-password';

    // Use a temporary, separate Firebase app instance to check/create the super admin
    // without affecting the current user's auth state.
    const tempAppName = `temp-superadmin-check-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        // Try to sign in to see if the user exists
        await signInWithEmailAndPassword(tempAuth, superAdminEmail, superAdminPassword);
    } catch (error: any) {
        // If user not found, create them
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
             try {
                const userCredential = await createUserWithEmailAndPassword(tempAuth, superAdminEmail, superAdminPassword);
                 const user = userCredential.user;
                 if(user) {
                    const superAdminProfile = {
                        id: user.uid,
                        email: user.email,
                        departmentName: "Super Admin",
                    };
                    const superAdminRoleRef = doc(firestore, 'roles_super_admin', user.uid);
                    await setDoc(superAdminRoleRef, superAdminProfile);
                 }
             } catch (seedError: any) {
                // If the user already exists (e.g., race condition), we can ignore the error.
                if (seedError.code !== 'auth/email-already-in-use') {
                    console.error("Error seeding Super Admin:", seedError);
                }
             }
        }
    } finally {
        // Always clean up the temporary app instance
        await signOut(tempAuth).catch(() => {}); // Sign out from temp app
        await deleteApp(tempApp);
    }
};

// Run this only once on client-side initialization
if (typeof window !== 'undefined') {
    // A check to prevent this from running multiple times in development HMR
    if (!(window as any).__superAdminSeeded) {
        seedSuperAdmin();
        (window as any).__superAdminSeeded = true;
    }
}
