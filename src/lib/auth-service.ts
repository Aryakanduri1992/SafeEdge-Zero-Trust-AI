
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

    // Store current super admin user to re-authenticate later if needed.
    const currentSuperAdmin = auth.currentUser;
    if (!currentSuperAdmin || currentSuperAdmin.uid !== superAdminId) {
        throw new Error("Super Admin not authenticated. Please log in again.");
    }
    
    // Use a temporary app to create the user, which avoids state conflicts with the current user.
    const tempAppName = `temp-user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    
    let newUserId: string | null = null;

    try {
        // Step 1: Check if email exists using the MAIN auth instance to be safe.
        const signInMethods = await fetchSignInMethodsForEmail(auth, orgData.email);
        if (signInMethods.length > 0) {
            throw new Error(`auth/email-already-in-use`);
        }

        // Step 2: Create the new organization user in the temporary auth instance.
        const userCredential = await createUserWithEmailAndPassword(tempAuth, orgData.email, orgData.password);
        newUserId = userCredential.user.uid;

        // Step 3: Write the organization data to Firestore using the main admin's authenticated session.
        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
            organizationName: orgData.organizationName,
            email: orgData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
        };

        const orgDocRef = doc(firestore, "organizations", newUserId);
        await setDoc(orgDocRef, newOrgProfile);

    } catch (error: any) {
        // This is a critical failure point. If the Firestore write fails, we have an orphan auth user.
        if (error.code && error.code.startsWith('permission-denied')) {
             const detailedError = `Creation Failed: An authentication account for ${orgData.email} was created, but saving the organization data to the database was blocked. This is almost certainly due to a security rule violation. Please go to the Firebase Console, delete the user from the 'Authentication' tab, check the security rules, and try again. Original Error: ${error.message}`;
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                 path: `organizations/${newUserId}`,
                 operation: 'create',
                 requestResourceData: { organizationName: orgData.organizationName, email: orgData.email, superAdminId }
             }));
             throw new Error(detailedError);
        }

        // Handle the specific "email already in use" error cleanly.
        if (error.message === 'auth/email-already-in-use') {
             throw new Error(`An account with the email ${orgData.email} already exists. Please use a different email.`);
        }
        
        // Re-throw any other errors.
        throw error;

    } finally {
        // Step 4: Always clean up the temporary app.
        await signOut(tempAuth).catch(() => {}); // Sign out from temp app
        await deleteApp(tempApp); // Delete temp app instance
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

export const deactivateDepartment = async (departmentId: string): Promise<void> => {
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

export const activateDepartment = async (departmentId: string): Promise<void> => {
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
        // Try to sign in to see if the user exists
        await signInWithEmailAndPassword(tempAuth, superAdminEmail, superAdminPassword);
    } catch (error: any) {
        // If user does not exist, create them
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
                    // Use main firestore instance to write
                    const superAdminRoleRef = doc(firestore, 'roles_super_admin', user.uid);
                    await setDoc(superAdminRoleRef, superAdminProfile);
                 }
             } catch (seedError: any) {
                // Ignore if email is already in use (race condition)
                if (seedError.code !== 'auth/email-already-in-use') {
                    console.error("Error seeding Super Admin:", seedError);
                }
             }
        }
    } finally {
        // Clean up the temporary app
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
