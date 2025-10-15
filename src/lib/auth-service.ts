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
    
    const tempAuth = getAuth(initializeFirebase().firebaseApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, adminData.email, adminData.password);
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
            });

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("An account with this email already exists in Firebase Authentication.");
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

    try {
        // We can't easily check if a user exists by email on the client-side without logging them in.
        // A robust solution uses a Cloud Function on user creation to assign roles.
        // For this demo, we'll try to create the user and if it fails because it exists, we assume it's set up.
        await createUserWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
        
        const user = auth.currentUser;
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
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            // This is expected if the super admin already exists.
        } else {
            console.error("Error seeding Super Admin:", error);
        }
    }
};

// This function will run once when the module is loaded.
seedSuperAdmin();
