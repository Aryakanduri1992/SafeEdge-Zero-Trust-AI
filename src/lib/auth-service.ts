
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
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData, UpdateAdminData } from './types';
import { initializeFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const { auth, firestore } = initializeFirebase();

export const fetchUserProfile = async (uid: string): Promise<SuperAdminUser | AdminUser | null> => {
    const superAdminRef = doc(firestore, "roles_super_admin", uid);
    const superAdminSnap = await getDoc(superAdminRef);
    if (superAdminSnap.exists()) {
        const superAdminData = superAdminSnap.data();
        return {
            id: uid,
            name: superAdminData.name,
            email: superAdminData.email,
            role: 'superadmin'
        };
    }

    const adminRef = doc(firestore, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
        return { ...adminSnap.data(), id: uid } as AdminUser;
    }

    return null;
}


export const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin'): Promise<FirebaseUser> => {
  const { email, password } = credentials;
  if (!password) {
      throw new Error("Password is required for login.");
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  try {
    const userProfile = await fetchUserProfile(userCredential.user.uid);

    if (!userProfile) {
      throw new Error("User profile not found.");
    }

    if (userProfile.role !== role) {
      throw new Error(`User does not have the required '${role}' role.`);
    }

    if (userProfile.role === 'admin' && userProfile.status === 'inactive') {
      throw new Error('This account has been deactivated.');
    }
    
    return userCredential.user;
  } catch (error) {
    // If any of the profile checks fail, sign the user out and re-throw the specific error.
    await signOut(auth);
    if (error instanceof Error) {
        if (error.message.includes("Missing or insufficient permissions")) {
            throw new Error("Your account is inactive or does not have the required permissions.");
        }
        throw error;
    }
    throw new Error("An unexpected error occurred during login.");
  }
};


export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const createAdmin = async (adminData: NewAdminData, superAdminId: string): Promise<void> => {
    // Create a temporary, secondary Firebase app instance.
    // This allows us to create a new user without affecting the currently signed-in super admin's auth state.
    const tempAppName = `temp-admin-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
        // Check if an admin with this email already exists in Firestore before creating the auth user
        const adminsRef = collection(firestore, 'admins');
        const q = query(adminsRef, where("email", "==", adminData.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error("An admin with this email already exists in the database.");
        }
        
        // 1. Create the new user in the temporary auth instance.
        const userCredential = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
        const newAdminUID = userCredential.user.uid;

        // 2. Create the Firestore document for the new admin.
        const newAdminProfile: Omit<AdminUser, 'id'> = {
            name: adminData.name,
            email: adminData.email,
            organization: adminData.organization,
            role: 'admin',
            createdAt: new Date().toISOString(),
            devices: 1,
            plan: 'Free',
            superAdminId: superAdminId,
            status: 'active',
        };

        const adminDocRef = doc(firestore, "admins", newAdminUID);
        
        await setDoc(adminDocRef, newAdminProfile).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: adminDocRef.path,
                operation: 'create',
                requestResourceData: newAdminProfile,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });

    } catch (error: any) {
        console.error("Error creating admin user:", error);
        
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("This email is already registered in Firebase Authentication.");
        }
        
        throw error;
    } finally {
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
    await updateDoc(adminDocRef, { status: 'inactive' }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: adminDocRef.path,
            operation: 'update',
            requestResourceData: { status: 'inactive' },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
};


export const checkAuth = async (): Promise<FirebaseUser | null> => {
    return new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

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
                        name: "Super Admin",
                    };
                    const superAdminRoleRef = doc(firestore, 'roles_super_admin', user.uid);
                    await setDoc(superAdminRoleRef, superAdminProfile);
                    console.log("Super Admin seeded successfully.");
                }
             } catch (seedError: any) {
                if (seedError.code !== 'auth/email-already-in-use') {
                    console.error("Error seeding Super Admin:", seedError);
                }
             }
        }
    } finally {
        await deleteApp(tempApp);
    }
};

seedSuperAdmin();
