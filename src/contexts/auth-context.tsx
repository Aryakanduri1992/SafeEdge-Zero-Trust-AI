
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';

type AuthContextType = {
  user: SuperAdminUser | Organization | null;
  departments: Department[]; // All departments for superadmin, or org-specific for admin
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createOrganization: (orgData: NewOrgData) => Promise<void>;
  createDepartment: (deptData: NewDepartmentData) => Promise<void>;
  updateDepartment: (departmentId: string, departmentData: UpdateDepartmentData) => Promise<void>;
  deactivateDepartment: (departmentId: string) => Promise<void>;
  activateDepartment: (departmentId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | Organization | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
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
                router.replace('/organisation-login');
             }
             setIsAuthLoading(false);
             return;
          }

          setAppUser(userProfile);
          
          const onAdminLoginPage = pathname.includes('organisation-login');
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
                 router.replace('/organisation-login');
            }
        }
      }
    };
    handleAuthChange();
  }, [firebaseUser, isFirebaseUserLoading, router, pathname, toast]);

  useEffect(() => {
    let departmentsUnsubscribe: Unsubscribe | undefined;

    if (firestore && appUser) {
        if (appUser.role === 'superadmin') {
            const deptsQuery = query(collection(firestore, 'departments'));
            departmentsUnsubscribe = onSnapshot(deptsQuery, (snapshot) => {
                const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
                setDepartments(deptList);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'departments',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDepartments([]);
            });
        }
        else if (appUser.role === 'admin') {
            const deptsQuery = query(collection(firestore, 'departments'), where("organizationId", "==", appUser.id));
            departmentsUnsubscribe = onSnapshot(deptsQuery, (snapshot) => {
                const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
                setDepartments(deptList);
            }, (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: 'departments',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDepartments([]);
            });
        }
    } else {
        setDepartments([]);
    }

    return () => {
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
    setDepartments([]);
    if (previousRole === 'superadmin') {
      router.push('/superadmin-login');
    } else {
      router.push('/organisation-login');
    }
  };

  const createOrganization = async (orgData: NewOrgData) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.createOrganization(orgData, appUser.id);
  };
  
  const createDepartment = async (deptData: NewDepartmentData) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.createDepartment(deptData, appUser.id);
  };

  const updateDepartment = async (departmentId: string, departmentData: UpdateDepartmentData) => {
     if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.updateDepartment(departmentId, departmentData);
  };

  const deactivateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.deactivateDepartment(departmentId);
    toast({
      title: "Department Deactivated",
      description: "The department has been successfully deactivated.",
    });
  };

  const activateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') {
      throw new Error("Unauthorized");
    }
    await authService.activateDepartment(departmentId);
    toast({
      title: "Department Activated",
      description: "The department has been successfully activated.",
    });
  };

  const isLoading = isFirebaseUserLoading || isAuthLoading;
  
  const contextValue = { 
    user: appUser, 
    departments,
    isAuthenticated: !!appUser, 
    isLoading, 
    login, 
    logout, 
    createOrganization,
    createDepartment,
    updateDepartment, 
    deactivateDepartment,
    activateDepartment,
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
