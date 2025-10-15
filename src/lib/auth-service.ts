"use client";

import { initializeFirebase } from '@/firebase';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData, UpdateAdminData, Plan } from './types';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const { auth, firestore } = initializeFirebase();

export const fetchUserProfile = async (uid: string): Promise<SuperAdminUser | AdminUser | null> => {
    // Check if the user is a super admin first
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

    // If not a super admin, check if they are a regular admin
    const adminRef = doc(firestore, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
        return { ...adminSnap.data(), id: uid } as AdminUser;
    }

    // User role not found
    return null;
}


export const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin'): Promise<FirebaseUser> => {
  const { email, password } = credentials;
  if (!password) {
      throw new Error("Password is required for login.");
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // After successful login, verify their role from the database
  const userProfile = await fetchUserProfile(userCredential.user.uid);

  if (!userProfile || userProfile.role !== role) {
    await signOut(auth); // Sign out the user if their role doesn't match
    throw new Error(`User does not have the required '${role}' role.`);
  }

  return userCredential.user;
};


export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const createAdmin = async (adminData: NewAdminData, superAdminId: string): Promise<void> => {
    const adminsRef = collection(firestore, 'admins');
    const q = query(adminsRef, where("email", "==", adminData.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error("An admin with this email already exists.");
    }
    
    // Using a separate auth instance for temporary user creation is a complex pattern.
    // Let's create the user with the primary auth instance and handle the flow.
    // This might require the super-admin to re-authenticate if their session is short,
    // but for this app's flow, it's more direct.
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
        const newAdminUID = userCredential.user.uid;

        const newAdminProfile: Omit<AdminUser, 'id'> = {
            name: adminData.name,
            email: adminData.email,
            role: 'admin',
            createdAt: new Date().toISOString(),
            devices: 1,
            plan: 'Free',
            superAdminId: superAdminId,
        };

        const adminDocRef = doc(firestore, "admins", newAdminUID);
        
        // Manually handle the setDoc to emit a contextual error
        setDoc(adminDocRef, newAdminProfile)
            .catch((error) => {
                const permissionError = new FirestorePermissionError({
                    path: adminDocRef.path,
                    operation: 'create',
                    requestResourceData: newAdminProfile,
                });
                errorEmitter.emit('permission-error', permissionError);
                 // We can also re-throw a more generic error to be caught by the UI form's catch block
                throw new Error("Firestore permission denied. Check security rules.");
            });

        // After creating the user, the auth state will change. 
        // We need to sign out the newly created admin user and let the super-admin's session persist.
        // The context provider should handle the auth state based on the logged-in super admin.
        // A full implementation would require re-authenticating the super-admin, but for now we'll sign out the new user.
        await signOut(auth);

    } catch (error: any) {
        // If the above setDoc fails and re-throws, this will catch it.
        // Also catches createUserWithEmailAndPassword errors.
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account with this email already exists in Firebase Authentication.");
        }
        // Don't re-throw the specific permission error, as it's handled by the emitter
        if (error.message.includes("Firestore permission denied")) {
           // The UI needs some feedback, but the detailed error is in the console.
           throw new Error("Failed to save admin profile due to database permissions.");
        }
        console.error("Error creating admin user:", error);
        throw new Error("Failed to create admin user.");
    }
};

export const updateAdmin = async (adminId: string, adminData: UpdateAdminData): Promise<void> => {
    const adminDocRef = doc(firestore, "admins", adminId);
    // Use non-blocking update
    updateDocumentNonBlocking(adminDocRef, adminData);
};


export const checkAuth = async (): Promise<FirebaseUser | null> => {
    return new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
};

// Seed initial super admin if it doesn't exist
const seedSuperAdmin = async () => {
    const superAdminEmail = 'super@authstation.com';
    const superAdminPassword = 'super-password';

    // This logic is tricky on the client-side. A better approach is a backend setup script or Cloud Function.
    // For this demo, we'll simplify and assume if login fails, we might need to create it.
    try {
        await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
        await signOut(auth); // just checking, so sign out
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
             try {
                const userCredential = await createUserWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
                 const user = userCredential.user;
                 if(user) {
                    const superAdminProfile = {
                        uid: user.uid,
                        email: user.email,
                        name: "Super Admin",
                    };
                    const superAdminRoleRef = doc(firestore, 'roles_super_admin', user.uid);
                    await setDoc(superAdminRoleRef, superAdminProfile);
                    await signOut(auth); // Sign out after seeding
                    console.log("Super Admin seeded successfully.");
                }
             } catch (seedError: any) {
                if (seedError.code !== 'auth/email-already-in-use') {
                    console.error("Error seeding Super Admin:", seedError);
                }
             }
        }
    }
};

// This function will run once when the module is loaded.
seedSuperAdmin();
