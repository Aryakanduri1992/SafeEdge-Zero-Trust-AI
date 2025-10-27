

"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData, Device } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';

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

  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebase();
  const { firestore } = useFirebase();

  const isLoading = isFirebaseUserLoading || isAuthLoading;

  const handleUserRedirect = useCallback((user: SuperAdminUser | Organization | null) => {
    if (!user) return;
    if (user.role === 'superadmin' && !pathname.startsWith('/superadmin')) {
        router.replace('/superadmin/dashboard');
    } else if (user.role === 'admin' && !pathname.startsWith('/admin')) {
        router.replace('/admin/dashboard');
    }
  }, [router, pathname]);

  // This effect handles session restoration on page refresh
  useEffect(() => {
    const handleAuthChange = async () => {
      if (firebaseUser) {
          setIsAuthLoading(true);
          try {
            const userProfile = await authService.fetchUserProfile(firebaseUser);

            if (userProfile) {
              setAppUser(userProfile);
            } else {
               // This means the user is authenticated with Firebase, but has no corresponding profile doc
               // (e.g., not a superadmin and no organization doc). This is an invalid state.
               console.error("Auth session restoration failed: User profile could not be found or created. Logging out.");
               await authService.logout();
               setAppUser(null);
            }
          } catch (error) {
            console.error("Auth session restoration error:", error);
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

    if (!isFirebaseUserLoading) {
      handleAuthChange();
    }
  }, [firebaseUser, isFirebaseUserLoading]);


  // This effect handles redirecting unauthenticated users and authenticated users to the correct dashboard
  useEffect(() => {
    if (!isLoading) {
        if (appUser) {
            handleUserRedirect(appUser);
        } else {
            const isAuthProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
            if (isAuthProtectedRoute) {
                if (pathname.startsWith('/superadmin')) {
                     router.replace('/superadmin-login');
                } else {
                     router.replace('/organisation-login');
                }
            }
        }
    }
  }, [pathname, isLoading, appUser, handleUserRedirect, router]);

  // This effect subscribes to data based on user role
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
                const permissionError = new FirestorePermissionError({ path: 'organizations', operation: 'list' });
                errorEmitter.emit('permission-error', permissionError);
                setOrganizations([]);
            });

            const deptsQuery = query(collection(firestore, 'departments'));
            departmentsUnsubscribe = onSnapshot(deptsQuery, (snapshot) => {
                const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
                setDepartments(deptList);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({ path: 'departments', operation: 'list' });
                errorEmitter.emit('permission-error', permissionError);
                setDepartments([]);
            });
        }
        else if (appUser.role === 'admin') {
            setOrganizations(prevOrgs => {
                const appUserAsOrg = appUser as Organization;
                if (!prevOrgs.some(o => o.id === appUserAsOrg.id)) return [appUserAsOrg];
                const existing = prevOrgs.find(o => o.id === appUserAsOrg.id);
                if (JSON.stringify(existing) !== JSON.stringify(appUserAsOrg)) {
                   return prevOrgs.map(o => o.id === appUserAsOrg.id ? appUserAsOrg : o);
                }
                return prevOrgs;
            });
            const deptsQuery = query(collection(firestore, 'departments'), where("organizationId", "==", appUser.id));
            departmentsUnsubscribe = onSnapshot(deptsQuery, (snapshot) => {
                const deptList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Department));
                setDepartments(deptList);
            }, (serverError) => {
                 const permissionError = new FirestorePermissionError({ path: `departments where organizationId == ${appUser.id}`, operation: 'list' });
                errorEmitter.emit('permission-error', permissionError);
                setDepartments([]);
            });
            
            const devicesQuery = query(collection(firestore, 'devices'), where("organizationId", "==", appUser.id));
            devicesUnsubscribe = onSnapshot(devicesQuery, (snapshot) => {
                const deviceList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Device));
                setDevices(deviceList);
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({ path: `devices where organizationId == ${appUser.id}`, operation: 'list' });
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
    setIsAuthLoading(true);
    try {
        const userCredential = await authService.login(credentials);
        const userProfile = await authService.fetchUserProfile(userCredential.user);

        if (!userProfile || userProfile.role !== role) {
            await authService.logout();
            throw new Error(`Login failed: User does not have the required '${role}' role or profile not found.`);
        }

        setAppUser(userProfile);
        handleUserRedirect(userProfile);

    } catch (error: any) {
        await authService.logout();
        setAppUser(null);
        throw error;
    } finally {
        setIsAuthLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const previousRole = appUser?.role;
    setIsAuthLoading(true);
    await authService.logout();
    setAppUser(null);
    setDepartments([]);
    setOrganizations([]);
    setDevices([]);
    setIsAuthLoading(false);
    if (previousRole === 'superadmin') {
      router.push('/superadmin-login');
    } else {
      router.push('/organisation-login');
    }
  };

  const createOrganization = async (orgData: NewOrgData) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    await authService.createOrganization(orgData, appUser.id);
  };
  
  const createDepartment = async (deptData: NewDepartmentData) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    await authService.createDepartment(deptData, appUser.id);
  };

  const updateDepartment = async (departmentId: string, departmentData: UpdateDepartmentData) => {
     if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    await authService.updateDepartment(departmentId, departmentData);
  };

  const deactivateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    await authService.deactivateDepartment(departmentId);
    toast({
      title: "Department Deactivated",
      description: "The department has been successfully deactivated.",
    });
  };

  const activateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
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
    if (!appUser || (appUser.role === 'admin' && appUser.id !== orgId) && appUser.role !== 'superadmin') {
      throw new Error("Unauthorized to update this organization's image.");
    }
    await authService.updateOrganizationImage(orgId, imageUrl);

    if (appUser.role === 'admin' && appUser.id === orgId) {
        setAppUser(prevUser => {
            if (prevUser && prevUser.role === 'admin') {
                return { ...prevUser, imageUrl };
            }
            return prevUser;
        });
    } else if (appUser.role === 'superadmin') {
        setOrganizations(prevOrgs => prevOrgs.map(org => 
            org.id === orgId ? { ...org, imageUrl } : org
        ));
    }
  };

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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
