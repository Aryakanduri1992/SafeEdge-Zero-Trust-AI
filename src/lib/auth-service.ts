
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
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
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
    const isAddingDepartment = !!adminData.organizationId;
    
    if (isAddingDepartment) {
        // Logic for adding a department to an existing organization
        // NO AUTH CREATION
        const departmentCollectionRef = collection(firestore, 'admins');
        const newDepartmentProfile: Omit<AdminUser, 'id'> = {
            departmentName: adminData.departmentName,
            organizationName: adminData.organizationName,
            email: adminData.email, // The org's email
            building: adminData.building,
            floor: adminData.floor,
            location: adminData.location,
            role: 'admin',
            createdAt: new Date().toISOString(),
            devices: 1, // Default quota for new department
            plan: 'Free', // Default plan for new department
            superAdminId: superAdminId,
            status: 'active',
            organizationId: adminData.organizationId!,
        };
        await addDoc(departmentCollectionRef, newDepartmentProfile).catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: departmentCollectionRef.path,
                operation: 'create',
                requestResourceData: newDepartmentProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

    } else {
        // Logic for creating a new organization AND its first department
        // This is the only path that creates an Auth user.
        if (!adminData.password) {
            throw new Error("A password is required to create a new organization.");
        }
        
        // Use a temporary, secondary Firebase app for creating users
        // to avoid logging in the current superadmin as the new user.
        const tempAppName = `temp-admin-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);

        try {
            const orgsRef = collection(firestore, 'organizations');
            const q = query(orgsRef, where("email", "==", adminData.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error(`An organization with the email ${adminData.email} already exists.`);
            }

            const userCredential = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
            const newOrgUID = userCredential.user.uid;

            // Create the main organization profile
            const newOrgProfile: Omit<Organization, 'id' | 'role'> = {
                organizationName: adminData.organizationName,
                email: adminData.email,
                createdAt: new Date().toISOString(),
                superAdminId: superAdminId,
            };
            const orgDocRef = doc(firestore, "organizations", newOrgUID);
            await setDoc(orgDocRef, newOrgProfile).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: orgDocRef.path,
                    operation: 'create',
                    requestResourceData: newOrgProfile,
                });
                errorEmitter.emit('permission-error', permissionError);
                await userCredential.user.delete().catch(delError => console.error("Failed to delete orphaned auth user", delError));
                throw permissionError;
            });
            
            // Now create the first department for this new organization
            const departmentCollectionRef = collection(firestore, 'admins');
            const newDepartmentProfile: Omit<AdminUser, 'id'> = {
                departmentName: adminData.departmentName,
                organizationName: adminData.organizationName,
                email: adminData.email,
                building: adminData.building,
                floor: adminData.floor,
                location: adminData.location,
                role: 'admin',
                createdAt: new Date().toISOString(),
                devices: 1,
                plan: 'Free',
                superAdminId: superAdminId,
                status: 'active',
                organizationId: newOrgUID,
            };
            await addDoc(departmentCollectionRef, newDepartmentProfile).catch(async (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: departmentCollectionRef.path,
                    operation: 'create',
                    requestResourceData: newDepartmentProfile,
                });
                errorEmitter.emit('permission-error', permissionError);
                 await userCredential.user.delete().catch(delError => console.error("Failed to delete orphaned auth user", delError));
                throw permissionError;
            });
        } catch (error: any) {
            console.error("Error creating org:", error);
            if (error.code === 'auth/email-already-in-use') {
                 throw new Error(`An account with the email ${adminData.email} is already in use.`);
            }
            throw error;
        } finally {
            // Clean up the temporary app instance
            await signOut(tempAuth).catch(() => {});
            await deleteApp(tempApp);
        }
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
