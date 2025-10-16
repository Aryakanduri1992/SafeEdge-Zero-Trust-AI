
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData, UpdateAdminData, Device, Organization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';

type AuthContextType = {
  user: SuperAdminUser | Organization | null;
  admins: AdminUser[];
  departments: AdminUser[]; // For admin role to see their org's departments
  allDevices: Device[]; // Added to hold all devices for superadmin
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createAdmin: (adminData: NewAdminData) => Promise<void>;
  updateAdmin: (adminId: string, adminData: UpdateAdminData) => Promise<void>;
  deactivateAdmin: (adminId: string) => Promise<void>;
  activateAdmin: (adminId: string) => Promise<void>;
  refreshAdmins: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | Organization | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<AdminUser[]>([]);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
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
      
      setIsAuthLoading(true);

      if (firebaseUser) {
        try {
          const userProfile = await authService.fetchUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
             await authService.logout();
             setAppUser(null);
             toast({
                variant: 'destructive',
                title: 'Profile Not Found',
                description: 'Your user profile could not be found. Please log in again.',
             });
             if (!pathname.includes('login')) {
                router.replace('/admin-login');
             }
             setIsAuthLoading(false);
             return;
          }

          setAppUser(userProfile);
          
          const onAdminLoginPage = pathname.includes('admin-login');
          const onSuperAdminLoginPage = pathname.includes('superadmin-login');

          if (userProfile.role === 'superadmin' && (onSuperAdminLoginPage || onAdminLoginPage)) {
            router.replace('/superadmin/dashboard');
          } else if (userProfile.role === 'admin' && (onAdminLoginPage || onSuperAdminLoginPage)) {
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
        const isAuthProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
        if (isAuthProtectedRoute) {
            if (pathname.startsWith('/superadmin')) {
                 router.replace('/superadmin-login');
            } else {
                 router.replace('/admin-login');
            }
        }
      }
    };
    handleAuthChange();
  }, [firebaseUser, isFirebaseUserLoading, router, pathname, toast]);

  const refreshAdmins = useCallback(async () => {
    // This is handled by the real-time listener
  }, []);

  useEffect(() => {
    let adminsUnsubscribe: Unsubscribe | undefined;
    let devicesUnsubscribe: Unsubscribe | undefined;
    let departmentsUnsubscribe: Unsubscribe | undefined;

    if (firestore) {
      if (appUser?.role === 'superadmin') {
        const adminsQuery = query(collection(firestore, 'admins'));
        adminsUnsubscribe = onSnapshot(adminsQuery, (snapshot) => {
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

        const devicesQuery = query(collection(firestore, 'devices'));
        devicesUnsubscribe = onSnapshot(devicesQuery, (snapshot) => {
          const deviceList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Device));
          setAllDevices(deviceList);
        }, (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'devices',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setAllDevices([]);
        });

      } else if (appUser?.role === 'admin') {
          // An 'admin' user is an 'Organization'. Fetch all 'AdminUser' (department) docs for that org.
          const departmentsQuery = query(collection(firestore, 'admins'), where("organizationId", "==", appUser.id));
          departmentsUnsubscribe = onSnapshot(departmentsQuery, (snapshot) => {
              const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AdminUser));
              setDepartments(deptList);
          }, (serverError) => {
              const permissionError = new FirestorePermissionError({
                  path: `admins`,
                  operation: 'list',
              });
              errorEmitter.emit('permission-error', permissionError);
              setDepartments([]);
          });
      }
      else {
          setAdmins([]);
          setAllDevices([]);
          setDepartments([]);
      }
    }
    
    return () => {
        if (adminsUnsubscribe) adminsUnsubscribe();
        if (devicesUnsubscribe) devicesUnsubscribe();
        if (departmentsUnsubscribe) departmentsUnsubscribe();
    }
  }, [appUser, firestore]);

  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    setIsAuthLoading(true);
    try {
        await authService.login(credentials, role);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message || "Invalid credentials. Please try again."
        });
        setIsAuthLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const previousRole = appUser?.role;
    await authService.logout();
    setAppUser(null);
    setAdmins([]);
    setAllDevices([]);
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
      title: "Department Deactivated",
      description: "The department has been successfully deactivated.",
    });
  };

  const activateAdmin = async (adminId: string) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.activateAdmin(adminId);
    toast({
      title: "Department Activated",
      description: "The department has been successfully activated.",
    });
  };

  const isLoading = isFirebaseUserLoading || isAuthLoading;
  
  const contextValue = { 
    user: appUser, 
    admins,
    departments,
    allDevices,
    isAuthenticated: !!appUser, 
    isLoading, 
    login, 
    logout, 
    createAdmin, 
    updateAdmin, 
    deactivateAdmin,
    activateAdmin,
    refreshAdmins 
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isLoading && !appUser ? (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

    