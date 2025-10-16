
"use client";

import { initializeApp, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
    
    const tempAppName = `temp-admin-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    let newOrgUID = '';

    try {
        const orgsQuery = query(collection(firestore, 'organizations'), where("email", "==", adminData.email));
        const orgsSnapshot = await getDocs(orgsQuery);
        if (!orgsSnapshot.empty) {
            throw new Error(`An organization with the email ${adminData.email} already exists.`);
        }

        const userCredential = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
        newOrgUID = userCredential.user.uid;

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
            const deptDocRef = doc(collection(firestore, 'admins'));
            batch.set(deptDocRef, newDepartmentProfile);
        }

        await batch.commit();

    } catch (error: any) {
        if (newOrgUID) {
            // If user was created in auth but Firestore failed, we should try to clean up
            // This requires admin privileges, which the temp auth client doesn't have.
            // This part of the logic needs to be handled carefully, maybe with a cleanup function.
            console.error(`Cleanup needed: Auth user ${newOrgUID} was created but Firestore writes failed.`);
        }

        if (error.code === 'auth/email-already-in-use') {
             throw new Error(`An account with the email ${adminData.email} is already in use.`);
        }
        
        // This will now catch the batch commit failure and create a contextual error
        const permissionError = new FirestorePermissionError({
            path: 'organizations', // A representative path for the batch
            operation: 'create',
            requestResourceData: adminData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Rethrow so the UI can catch it.

    } finally {
        await signOut(tempAuth).catch(() => {});
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
                    console.log("Super Admin seeded successfully.");
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
    seedSuperAdmin();
}
