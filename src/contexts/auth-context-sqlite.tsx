"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/lib/auth-service-sqlite';
import type { Department, SuperAdminUser, LoginCredentials, Organization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: SuperAdminUser | Organization | null;
  organizations: Organization[];
  departments: Department[];
  devices: any[];
  isAuthenticated: boolean;
  isLoading: boolean;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createOrganization: (orgData: any) => Promise<void>;
  createDepartment: (deptData: any) => Promise<void>;
  updateDepartment: (departmentId: string, departmentData: any) => Promise<void>;
  deactivateDepartment: (departmentId: string) => Promise<void>;
  activateDepartment: (departmentId: string) => Promise<void>;
  createDevice: (deviceData: any) => Promise<void>;
  updateDevice: (deviceId: string, deviceData: any) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  updateOrganizationImage: (organizationId: string, imageUrl: string) => Promise<void>;
  updateDeviceStatus: (deviceId: string, statusData: any) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<SuperAdminUser | Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsAuthLoading(true);
      
      try {
        const session = authService.getCurrentSession();
        if (session) {
          const userProfile = await authService.fetchUserProfile(session.user);
          if (userProfile) {
            setAppUser(userProfile);
            await loadUserData(session.user);
          } else {
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        await authService.logout();
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && !appUser) {
      const isAuthProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
      if (isAuthProtectedRoute) {
        if (pathname.startsWith('/superadmin')) {
          router.replace('/superadmin-login');
        } else {
          router.replace('/organisation-login');
        }
      }
    }
  }, [pathname, isAuthLoading, appUser, router]);

  // Load user-specific data
  const loadUserData = useCallback(async (authUser: authService.AuthUser) => {
    try {
      const userOrgs = await authService.getUserOrganizations(authUser);
      const userDepts = await authService.getUserDepartments(authUser);
      
      setOrganizations(userOrgs);
      setDepartments(userDepts);
      
      // TODO: Load devices from SQLite
      setDevices([]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    setIsAuthLoading(true);
    try {
      const loginResult = await authService.login(credentials);
      
      // Verify role matches expected
      const hasRequiredRole = authService.hasRole(loginResult.user, role);
      if (!hasRequiredRole) {
        throw new Error(`Login failed: User does not have the required '${role}' role.`);
      }

      // Store session
      authService.storeSession(loginResult.user, loginResult.token);
      
      // Get user profile
      const userProfile = await authService.fetchUserProfile(loginResult.user);
      if (!userProfile) {
        throw new Error('Failed to load user profile');
      }

      setAppUser(userProfile);
      await loadUserData(loginResult.user);
      
      // Store user in localStorage for org-dashboard compatibility
      localStorage.setItem('user', JSON.stringify({
        ...userProfile,
        organizationId: userProfile.organizationId || (userProfile as any).id
      }));
      
      // Redirect based on role
      if (userProfile.role === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else if (userProfile.role === 'admin') {
        router.replace('/org-dashboard');
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

  // Create organization function
  const createOrganization = async (orgData: any) => {
    try {
      const response = await fetch('/api/superadmin/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      // Reload organizations list
      if (appUser) {
        const userOrgs = await authService.getUserOrganizations(appUser as any);
        setOrganizations(userOrgs);
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create organization');
    }
  };
  
  const createDepartment = async (deptData: any) => {
    throw new Error('Not implemented in SQLite version');
  };

  const updateDepartment = async (departmentId: string, departmentData: any) => {
    throw new Error('Not implemented in SQLite version');
  };

  const deactivateDepartment = async (departmentId: string) => {
    throw new Error('Not implemented in SQLite version');
  };

  const activateDepartment = async (departmentId: string) => {
    throw new Error('Not implemented in SQLite version');
  };

  const createDevice = async (deviceData: any) => {
    throw new Error('Not implemented in SQLite version');
  };

  const updateDevice = async (deviceId: string, deviceData: any) => {
    throw new Error('Not implemented in SQLite version');
  };

  const deleteDevice = async (deviceId: string) => {
    throw new Error('Not implemented in SQLite version');
  };
  
  const updateOrganizationImage = async (organizationId: string, imageUrl: string) => {
    throw new Error('Not implemented in SQLite version');
  };

  const updateDeviceStatus = async (deviceId: string, statusData: any) => {
    // Silent fail for now
  };

  const contextValue = { 
    user: appUser, 
    organizations,
    departments,
    devices,
    isAuthenticated: !!appUser, 
    isLoading: isAuthLoading, 
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