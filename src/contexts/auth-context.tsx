
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData, Device, UpdateDeviceStatusData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useFirestore, FirestorePermissionError, errorEmitter, useRtdb } from '@/firebase';
import { collection, onSnapshot, Unsubscribe, query, where, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
import { decryptData } from '@/lib/crypto-service';

type AuthContextType = {
  user: SuperAdminUser | Organization | null;
  organizations: Organization[];
  departments: Department[]; // All departments for superadmin, or org-specific for admin
  devices: Device[];
  isAuthenticated: boolean;
  isLoading: boolean;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
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
  updateOrganizationImage: (organizationId: string, imageUrl: string) => Promise<void>;
  updateDeviceStatus: (deviceId: string, statusData: UpdateDeviceStatusData) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { user: firebaseUser, isUserLoading: isFirebaseUserLoading } = useFirebase();
  const firestore = useFirestore();
  const rtdb = useRtdb();

  const isLoading = isFirebaseUserLoading || isAuthLoading;

  // Effect for handling Firebase Authentication state changes
  useEffect(() => {
    const handleAuthChange = async () => {
      if (firebaseUser) {
          setIsAuthLoading(true);
          try {
            const userProfile = await authService.fetchUserProfile(firebaseUser);
            if (userProfile) {
              setAppUser(userProfile);
            } else {
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

  // Effect for redirecting unauthenticated users
  useEffect(() => {
    if (!isLoading && !appUser) {
        const isAuthProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
        if (isAuthProtectedRoute) {
            if (pathname.startsWith('/superadmin')) {
                 router.replace('/superadmin-login');
            } else {
                 router.replace('/organisation-login');
            }
        }
    }
  }, [pathname, isLoading, appUser, router]);

  // Effect for fetching Firestore data (Orgs, Depts, Devices)
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
            const orgRef = doc(firestore, 'organizations', appUser.id);
             orgsUnsubscribe = onSnapshot(orgRef, (doc) => {
                if (doc.exists()) {
                    const orgData = { ...doc.data(), id: doc.id, role: 'admin' } as Organization;
                    setAppUser(orgData);
                    setOrganizations([orgData]);
                }
            }, (serverError) => {
                const permissionError = new FirestorePermissionError({ path: orgRef.path, operation: 'get' });
                errorEmitter.emit('permission-error', permissionError);
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
  }, [appUser?.id, appUser?.role, firestore]);

   // Effect for listening to Realtime Database updates for devices
   useEffect(() => {
    if (!rtdb || devices.length === 0) {
      return;
    }

    const listeners: { [path: string]: () => void } = {};

    devices.forEach(device => {
      if (device.dbPath && !listeners[device.dbPath]) {
        const dbRef = ref(rtdb, device.dbPath);
        const listener = onValue(dbRef, (snapshot) => {
          if (snapshot.exists()) {
            const liveData = snapshot.val();
            
            setDevices(prevDevices => {
              return prevDevices.map(d => {
                if (d.dbPath === device.dbPath) {
                  const updatedDevice = { ...d, liveData, status: 'online' as const };
                  if (liveData.encrypted_value) {
                     updatedDevice.value = parseFloat(decryptData(liveData.encrypted_value));
                  }
                  if (liveData.encrypted_temperature) {
                     updatedDevice.temperature = parseFloat(decryptData(liveData.encrypted_temperature));
                  }
                   if (liveData.encrypted_humidity) {
                     updatedDevice.humidity = parseFloat(decryptData(liveData.encrypted_humidity));
                  }
                  if (liveData.timestamp) {
                    updatedDevice.timestamp = liveData.timestamp;
                  }
                  return updatedDevice;
                }
                return d;
              });
            });
          }
        }, (error) => {
          console.error(`RTDB listener error for path ${device.dbPath}:`, error);
        });

        listeners[device.dbPath] = () => off(dbRef, 'value', listener);
      }
    });

    // Cleanup function
    return () => {
      Object.values(listeners).forEach(unsubscribe => unsubscribe());
    };
  }, [devices, rtdb]);

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
        
        if (userProfile.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
        } else if (userProfile.role === 'admin') {
            router.replace('/admin/dashboard');
        }

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
  
  const updateOrganizationImage = async (organizationId: string, imageUrl: string) => {
      if (!appUser || (appUser.role !== 'superadmin' && appUser.id !== organizationId)) {
        throw new Error("Unauthorized to update this organization's image.");
      }
      await authService.updateOrganizationImage(organizationId, imageUrl);
  };

  const updateDeviceStatus = async (deviceId: string, statusData: UpdateDeviceStatusData) => {
    if (!appUser || appUser.role !== 'admin') {
      return;
    }
    await authService.updateDeviceStatus(deviceId, statusData);
  };

  const contextValue = { 
    user: appUser, 
    organizations,
    departments,
    devices,
    isAuthenticated: !!appUser, 
    isLoading, 
    globalSearchTerm,
    setGlobalSearchTerm,
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
    updateDeviceStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
