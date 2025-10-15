"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '@/lib/auth-service';
import type { AdminUser, SuperAdminUser, LoginCredentials, NewAdminData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type AuthContextType = {
  user: SuperAdminUser | AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, role: 'admin' | 'superadmin') => Promise<void>;
  logout: () => Promise<void>;
  createAdmin: (adminData: NewAdminData) => Promise<AdminUser>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SuperAdminUser | AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const sessionUser = await authService.checkAuth();
        setUser(sessionUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (credentials: LoginCredentials, role: 'admin' | 'superadmin') => {
    const loginFn = role === 'superadmin' ? authService.superAdminLogin : authService.adminLogin;
    const sessionUser = await loginFn(credentials);
    setUser(sessionUser as SuperAdminUser | AdminUser);
    if (sessionUser.role === 'superadmin') {
      router.push('/superadmin/dashboard');
    } else {
      // Placeholder for admin dashboard
      router.push('/');
    }
  };

  const logout = async () => {
    const previousRole = user?.role;
    await authService.logout();
    setUser(null);
    if (previousRole === 'superadmin') {
        router.push('/superadmin-login');
    } else {
        router.push('/admin-login');
    }
  };

  const createAdmin = async (adminData: NewAdminData) => {
    const newAdmin = await authService.createAdmin(adminData);
    return newAdmin;
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, createAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
