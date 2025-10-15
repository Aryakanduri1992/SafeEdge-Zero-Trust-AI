"use client";

import { initializeFirebase } from '@/firebase';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithCredential,
  EmailAuthProvider,
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
  
  // Store credentials for potential re-authentication
  if (role === 'superadmin') {
      sessionStorage.setItem('superAdminCreds', JSON.stringify(credentials));
  }


  return userCredential.user;
};


export const logout = async (): Promise<void> => {
  sessionStorage.removeItem('superAdminCreds');
  await signOut(auth);
};

export const createAdmin = async (adminData: NewAdminData, superAdminId: string): Promise<void> => {
    const adminsRef = collection(firestore, 'admins');
    const q = query(adminsRef, where("email", "==", adminData.email));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error("An admin with this email already exists in Firestore.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
        const newAdminUID = userCredential.user.uid;

        // IMPORTANT: The auth state has now changed to the new user.
        // We must re-authenticate the super admin to perform the Firestore write.

        const storedCreds = sessionStorage.getItem('superAdminCreds');
        if (!storedCreds) {
            throw new Error("Super admin credentials not found. Please log out and log back in.");
        }
        const { email: superAdminEmail, password: superAdminPassword } = JSON.parse(storedCreds);

        // Re-authenticate super admin
        await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
        
        // Now, with the super admin authenticated, create the Firestore document.
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
        
        // Use setDocumentNonBlocking which includes our permission error handling
        setDocumentNonBlocking(adminDocRef, newAdminProfile, {});

    } catch (error: any) {
        console.error("Error creating admin user:", error);
        
        // Handle specific Firebase auth errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("This email is already registered in Firebase Authentication.");
        }
        
        // Handle re-thrown contextual permission errors from our non-blocking helper
        if (error instanceof FirestorePermissionError) {
             throw new Error("Failed to save admin profile due to database permissions.");
        }

        // Re-throw other errors to be caught by the form
        throw error;
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
