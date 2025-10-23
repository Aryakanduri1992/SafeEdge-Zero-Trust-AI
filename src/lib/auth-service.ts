
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
import { getFirestore, doc, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization } from './types';
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

export const createOrganization = async (orgData: NewOrgData, superAdminId: string): Promise<void> => {
    if (!orgData.password) throw new Error("A password is required to create a new organization.");
    if (!orgData.email) throw new Error("An email is required to create a new organization.");

    // Step 1: Use a temporary, secondary Firebase app to create the user.
    // This prevents the current superadmin from being logged out.
    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    let newOrgUID: string | null = null;

    try {
        // First, check if email is already in use with the *main* auth instance to be sure.
        const signInMethods = await fetchSignInMethodsForEmail(auth, orgData.email);
        if (signInMethods.length > 0) {
            throw new Error(`An account with the email ${orgData.email} already exists.`);
        }

        // Create the user in the temporary auth instance.
        const userCredential = await createUserWithEmailAndPassword(tempAuth, orgData.email, orgData.password);
        newOrgUID = userCredential.user.uid;

        // Step 2: If user creation is successful, create the organization document in Firestore.
        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
            organizationName: orgData.organizationName,
            email: orgData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
        };

        const orgDocRef = doc(firestore, "organizations", newOrgUID);
        await setDoc(orgDocRef, newOrgProfile);

    } catch (error: any) {
         // This will catch auth errors (like email-already-in-use from a race condition)
         // and Firestore errors (from security rules).
        if (newOrgUID) {
             const detailedError = `Creation Failed: An authentication account for ${orgData.email} was created, but saving the organization data to the database was blocked. This is almost certainly due to a security rule violation. Please go to the Firebase Console, delete the user from the 'Authentication' tab, check the security rules, and try again. Original Error: ${error.message}`;
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                 path: `organizations/${newOrgUID}`,
                 operation: 'create',
                 requestResourceData: { org: orgData, superAdminId }
             }));
             throw new Error(detailedError);
        }
        
        // Re-throw other errors (e.g., auth/email-already-in-use)
        throw error;

    } finally {
        // Step 3: Clean up the temporary app regardless of success or failure.
        await signOut(tempAuth).catch(() => {});
        await deleteApp(tempApp);
    }
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


// This function ensures the Super Admin user exists in Auth and Firestore.
const seedSuperAdmin = async () => {
    const superAdminEmail = 'super@authstation.com';
    const superAdminPassword = 'super-password';

    // Use a temporary app to avoid interfering with any logged-in user state
    const tempAppName = `temp-superadmin-check-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        await signInWithEmailAndPassword(tempAuth, superAdminEmail, superAdminPassword);
    } catch (error: any) {
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
                if (seedError.code !== 'auth/email-already-in-use') {
                    console.error("Error seeding Super Admin:", seedError);
                }
             }
        }
    } finally {
        await signOut(tempAuth).catch(() => {});
        await deleteApp(tempApp);
    }
};

// Ensure seeding only runs once on the client
if (typeof window !== 'undefined') {
    if (!(window as any).__superAdminSeeded) {
        seedSuperAdmin();
        (window as any).__superAdminSeeded = true;
    }
}
