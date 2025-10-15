
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData, UpdateAdminData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';

type AuthContextType = {
  user: SuperAdminUser | AdminUser | null;
  admins: AdminUser[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createAdmin: (adminData: NewAdminData) => Promise<void>;
  updateAdmin: (adminId: string, adminData: UpdateAdminData) => Promise<void>;
  deactivateAdmin: (adminId: string) => Promise<void>;
  refreshAdmins: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | AdminUser | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const handleAuthChange = async () => {
      if (isFirebaseUserLoading) {
        setIsAuthLoading(true);
        return;
      }

      if (firebaseUser) {
        // User is signed in, start fetching profile but don't block UI with a global loader.
        // The layout guard will handle showing a loader if profile is needed.
        setIsAuthLoading(true); 
        try {
          const userProfile = await authService.fetchUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
             throw new Error("Your user profile could not be found. Please contact support.");
          }

          if (userProfile.role === 'admin' && userProfile.status === 'inactive') {
            await authService.logout();
            setAppUser(null);
            toast({
              variant: 'destructive',
              title: 'Account Deactivated',
              description: 'Your account is inactive. Please contact your super admin.',
            });
            router.replace('/admin-login');
            setIsAuthLoading(false);
            return;
          }
          
          setAppUser(userProfile);
          if (userProfile?.role === 'superadmin' && (pathname.startsWith('/admin') || pathname ==='/')) {
            router.replace('/superadmin/dashboard');
          } else if (userProfile?.role === 'admin' && (pathname.startsWith('/superadmin') || pathname ==='/')) {
            router.replace('/admin/dashboard');
          }
        } catch (error) {
           if (error instanceof FirestorePermissionError) {
             errorEmitter.emit('permission-error', error);
           } else if (error instanceof Error) {
            toast({
              variant: 'destructive',
              title: 'Login Error',
              description: error.message || 'Could not retrieve user profile.',
            });
          }
          await authService.logout();
          setAppUser(null);
        } finally {
            setIsAuthLoading(false);
        }
      } else {
        setAppUser(null);
        setIsAuthLoading(false);
      }
    };
    handleAuthChange();
  }, [firebaseUser, isFirebaseUserLoading, router, pathname, toast]);

  const refreshAdmins = useCallback(async () => {
    if (appUser?.role === 'superadmin' && firestore) {
      // This is handled by the real-time listener below
    }
  }, [appUser, firestore]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (appUser?.role === 'superadmin' && firestore) {
      const adminsCollection = collection(firestore, 'admins');
      
      unsubscribe = onSnapshot(adminsCollection, (snapshot) => {
        const adminList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
        setAdmins(adminList);
      }, (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'admins',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setAdmins([]);
      });
    } else {
        setAdmins([]);
    }
    return () => unsubscribe && unsubscribe();
  }, [appUser, firestore]);

  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    // Non-blocking, the useEffect will handle profile fetching and redirection
    await authService.login(credentials, role);
  };

  const logout = async () => {
    const previousRole = appUser?.role;
    await authService.logout();
    setAppUser(null);
    if (previousRole === 'superadmin') {
      router.push('/superadmin-login');
    } else {
      router.push('/admin-login');
    }
  };

  const createAdmin = async (adminData: NewAdminData) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.createAdmin(adminData, appUser.id);
  };
  
  const updateAdmin = async (adminId: string, adminData: UpdateAdminData) => {
     if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.updateAdmin(adminId, adminData);
  };

  const deactivateAdmin = async (adminId: string) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.deactivateAdmin(adminId);
    toast({
      title: "Admin Deactivated",
      description: "The admin account has been successfully deactivated.",
    });
  };

  const isLoading = isFirebaseUserLoading || isAuthLoading;
  
  const contextValue = { 
    user: appUser, 
    admins, 
    isAuthenticated: !!appUser, 
    isLoading, 
    login, 
    logout, 
    createAdmin, 
    updateAdmin, 
    deactivateAdmin,
    refreshAdmins 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
