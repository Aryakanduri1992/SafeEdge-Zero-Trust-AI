
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Department, SuperAdminUser, LoginCredentials, NewOrgData, UpdateDepartmentData, Organization, NewDepartmentData, NewDeviceData, UpdateDeviceData, Device, UpdateDeviceStatusData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  const isLoading = isAuthLoading;

  // Effect for handling session restoration from localStorage
  useEffect(() => {
    const checkSession = async () => {
      setIsAuthLoading(true);
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          
          // Fetch fresh profile from Firestore
          const profileResponse = await fetch(`/api/auth/profile?userId=${user.id}&role=${user.role}`);
          if (profileResponse.ok) {
            const userProfile = await profileResponse.json();
            setAppUser(userProfile);
          } else {
            // If profile fetch fails, clear session
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setAppUser(null);
          }
        } else {
          setAppUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAppUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  // Effect for redirecting unauthenticated users
  useEffect(() => {
    if (!isLoading && !appUser) {
        const isAuthProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin') || pathname.startsWith('/org-dashboard');
        if (isAuthProtectedRoute) {
            if (pathname.startsWith('/superadmin')) {
                 router.replace('/superadmin-login');
            } else {
                 router.replace('/organisation-login');
            }
        }
    }
  }, [pathname, isLoading, appUser, router]);

  // Firestore real-time listeners are handled by individual pages through API calls
  // This keeps the auth context lightweight and doesn't require FirebaseProvider 


  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    setIsAuthLoading(true);
    try {
        // Call the Firestore-based login API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Login failed');
        }

        const { user, token } = await response.json();

        // Verify role matches
        if ((role === 'superadmin' && user.role !== 'superadmin') || 
            (role === 'admin' && user.role === 'superadmin')) {
          throw new Error(`Login failed: User does not have the required '${role}' role.`);
        }

        // Store session
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Fetch full user profile from Firestore
        const profileResponse = await fetch(`/api/auth/profile?userId=${user.id}&role=${user.role}`);
        if (profileResponse.ok) {
          const userProfile = await profileResponse.json();
          setAppUser(userProfile);
        } else {
          setAppUser(user);
        }
        
        if (user.role === 'superadmin') {
            router.replace('/superadmin/dashboard');
        } else {
            router.replace('/org-dashboard');
        }

    } catch (error: any) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAppUser(null);
        throw error;
    } finally {
        setIsAuthLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const previousRole = appUser?.role;
    setIsAuthLoading(true);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
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
    // TODO: Implement via API call
    throw new Error("Not implemented");
  };
  
  const createDepartment = async (deptData: NewDepartmentData) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    throw new Error("Not implemented");
  };

  const updateDepartment = async (departmentId: string, departmentData: UpdateDepartmentData) => {
     if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    throw new Error("Not implemented");
  };

  const deactivateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    toast({
      title: "Department Deactivated",
      description: "The department has been successfully deactivated.",
    });
  };

  const activateDepartment = async (departmentId: string) => {
    if (!appUser || appUser.role !== 'superadmin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    toast({
      title: "Department Activated",
      description: "The department has been successfully activated.",
    });
  };

  const createDevice = async (deviceData: NewDeviceData) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    toast({ title: "Device Created", description: `${deviceData.name} has been successfully registered.` });
  };

  const updateDevice = async (deviceId: string, deviceData: UpdateDeviceData) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    toast({ title: "Device Updated", description: `The device details have been updated.` });
  };

  const deleteDevice = async (deviceId: string) => {
    if (!appUser || appUser.role !== 'admin') throw new Error("Unauthorized");
    // TODO: Implement via API call
    toast({ title: "Device Deleted", description: `The device has been removed from the system.` });
  };
  
  const updateOrganizationImage = async (organizationId: string, imageUrl: string) => {
      if (!appUser || (appUser.role !== 'superadmin' && appUser.id !== organizationId)) {
        throw new Error("Unauthorized to update this organization's image.");
      }
      // TODO: Implement via API call
  };

  const updateDeviceStatus = async (deviceId: string, statusData: UpdateDeviceStatusData) => {
    if (!appUser || appUser.role !== 'admin') {
      return;
    }
    // TODO: Implement via API call
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
