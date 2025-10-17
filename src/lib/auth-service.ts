

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
    if (!orgData.departments || orgData.departments.length === 0) {
        throw new Error("At least one department must be specified.");
    }

    // Use a temporary app to create user to not interfere with current session
    const tempAppName = `temp-auth-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    let newUser: FirebaseUser | null = null;
    let newOrgUID = '';

    try {
        // Step 1: Check if email exists in the main auth instance
        const signInMethods = await fetchSignInMethodsForEmail(auth, orgData.email);
        if (signInMethods.length > 0) {
            throw new Error(`An account with the email ${orgData.email} already exists. Please use a different email.`);
        }
        
        // Step 2: Create the user in the temporary auth instance
        const userCredential = await createUserWithEmailAndPassword(tempAuth, orgData.email, orgData.password);
        newUser = userCredential.user;
        newOrgUID = newUser.uid;
        
        // Step 3: Write data to Firestore
        const batch = writeBatch(firestore);

        const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
            organizationName: orgData.organizationName,
            email: orgData.email,
            createdAt: new Date().toISOString(),
            superAdminId: superAdminId,
        };
        const orgDocRef = doc(firestore, "organizations", newOrgUID);
        batch.set(orgDocRef, newOrgProfile);
        
        for (const dept of orgData.departments) {
            const deptDocRef = doc(collection(firestore, 'departments'));
            const newDepartmentProfile: Omit<Department, 'id'> = {
                departmentName: dept.departmentName,
                organizationName: orgData.organizationName,
                email: orgData.email,
                building: dept.building,
                floor: dept.floor,
                location: dept.location,
                createdAt: new Date().toISOString(),
                devices: 10,
                plan: 'Pro',
                superAdminId: superAdminId,
                status: 'active',
                organizationId: newOrgUID,
            };
            batch.set(deptDocRef, newDepartmentProfile);
        }

        await batch.commit();

    } catch (error: any) {
        // If Firestore write fails after user creation, this is a critical state.
        if (newUser) {
            // This situation indicates a security rule failure.
            const detailedError = `Creation Failed: An authentication account for ${orgData.email} was created, but saving the organization data to the database was blocked. This is almost certainly due to a security rule violation. Please go to the Firebase Console, delete the user from the 'Authentication' tab, check the security rules, and try again. Original Error: ${error.message}`;
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `organizations/${newOrgUID}`,
                operation: 'create',
                requestResourceData: { org: orgData, superAdminId }
            }));
             throw new Error(detailedError);
        }
        // Rethrow original error if it's not a post-auth-creation failure.
        throw error;
    } finally {
        // Clean up the temporary app regardless of outcome
        if (tempAuth.currentUser) {
            await signOut(tempAuth);
        }
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

if (typeof window !== 'undefined') {
    if (!(window as any).__superAdminSeeded) {
        seedSuperAdmin();
        (window as any).__superAdminSeeded = true;
    }
}

    