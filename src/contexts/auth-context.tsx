
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData, Device } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';

type AuthContextType = {
  user: SuperAdminUser | Organization | null;
  organizations: Organization[];
  departments: Department[]; // All departments for superadmin, or org-specific for admin
  devices: Device[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createOrganization: (orgData: NewOrgData) => Promise<void>;
  createDepartment: (deptData: NewDepartmentData) => Promise<void>;
  updateDepartment: (departmentId: string, departmentData: UpdateDepartmentData) => Promise<void>;
  deactivateDepartment: (departmentId: string) => Promise<void>;
  activateDepartment: (departmentId: string) => Promise<void>;
  createDevice: (deviceData: NewDeviceData) => Promise<void>;
  updateDevice: (deviceId: string, deviceData: UpdateDeviceData) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  updateOrganizationImage: (orgId: string, imageUrl: string) => Promise<void>;
  updateSuperAdminImage: (uid: string, imageUrl: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
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
    let orgsUnsubscribe: Unsubscribe | undefined;
    let departmentsUnsubscribe: Unsubscribe | undefined;
    let devicesUnsubscribe: Unsubscribe | undefined;

    if (firestore && appUser) {
        if (appUser.role === 'superadmin') {
            const orgsQuery = query(collection(firestore, 'organizations'));
            orgsUnsubscribe = onSnapshot(orgsQuery, (snapshot) => {
                const orgsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, role: 'admin' } as Organization));
                setOrganizations(orgsList);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'organizations',
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setOrganizations([]);
            });

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
            setOrganizations(prevOrgs => {
                // To avoid flashing, only update if the new user is different from what might be in the list
                if (!prevOrgs.some(o => o.id === appUser.id)) {
                    return [appUser];
                }
                // Or if the user details changed
                const existing = prevOrgs.find(o => o.id === appUser.id);
                if (JSON.stringify(existing) !== JSON.stringify(appUser)) {
                   return prevOrgs.map(o => o.id === appUser.id ? appUser : o);
                }
                return prevOrgs;
            });
            const deptsQuery = query(collection(firestore, 'departments'), where("organizationId", "==", appUser.id));
            departmentsUnsubscribe = onSnapshot(deptsQuery, (snapshot) => {
                const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
                setDepartments(deptList);
            }, (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: `departments where organizationId == ${appUser.id}`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDepartments([]);
            });
            
            const devicesQuery = query(collection(firestore, 'devices'), where("organizationId", "==", appUser.id));
            devicesUnsubscribe = onSnapshot(devicesQuery, (snapshot) => {
                const deviceList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Device));
                setDevices(deviceList);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `devices where organizationId == ${appUser.id}`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setDevices([]);
            });
        }
    } else {
        setOrganizations([]);
        setDepartments([]);
        setDevices([]);
    }

    return () => {
        if (orgsUnsubscribe) orgsUnsubscribe();
        if (departmentsUnsubscribe) departmentsUnsubscribe();
        if (devicesUnsubscribe) devicesUnsubscribe();
    }
}, [appUser, firestore]);

  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    await authService.login(credentials, role);
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

  const createDevice = async (deviceData: NewDeviceData) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    await authService.createDevice(deviceData);
    toast({ title: "Device Created", description: `${deviceData.name} has been successfully registered.` });
  };

  const updateDevice = async (deviceId: string, deviceData: UpdateDeviceData) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    await authService.updateDevice(deviceId, deviceData);
    toast({ title: "Device Updated", description: `The device details have been updated.` });
  };

  const deleteDevice = async (deviceId: string) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    await authService.deleteDevice(deviceId);
    toast({ title: "Device Deleted", description: `The device has been removed from the system.` });
  };
  
  const updateOrganizationImage = async (orgId: string, imageUrl: string) => {
    // Super admin can update any org, admin can only update their own.
    if (!appUser || (appUser.role === 'admin' && appUser.id !== orgId)) {
      throw new Error("Unauthorized to update this organization's image.");
    }
    await authService.updateOrganizationImage(orgId, imageUrl);

    if (appUser.role === 'admin' && appUser.id === orgId) {
        // Optimistically update the local user state for the admin
        setAppUser(prevUser => {
            if (prevUser && prevUser.role === 'admin') {
                return { ...prevUser, imageUrl };
            }
            return prevUser;
        });
    } else if (appUser.role === 'superadmin') {
        // Optimistically update the organizations list for the superadmin
        setOrganizations(prevOrgs => prevOrgs.map(org => 
            org.id === orgId ? { ...org, imageUrl } : org
        ));
    }
  };
  
  const updateSuperAdminImage = async (uid: string, imageUrl: string) => {
        if (!appUser || appUser.role !== 'superadmin' || appUser.id !== uid) {
            throw new Error("Unauthorized to update this profile image.");
        }
        await authService.updateSuperAdminImage(uid, imageUrl);
        // Optimistically update the local user state
        setAppUser(prevUser => {
            if (prevUser && prevUser.role === 'superadmin') {
                return { ...prevUser, imageUrl };
            }
            return prevUser;
        });
    };


  const isLoading = isFirebaseUserLoading || isAuthLoading;
  
  const contextValue = { 
    user: appUser, 
    organizations,
    departments,
    devices,
    isAuthenticated: !!appUser, 
    isLoading, 
    login, 
    logout, 
    createOrganization,
    createDepartment,
    updateDepartment, 
    deactivateDepartment,
    activateDepartment,
    createDevice,
    updateDevice,
    deleteDevice,
    updateOrganizationImage,
    updateSuperAdminImage
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
