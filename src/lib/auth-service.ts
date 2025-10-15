"use client";

import type { User, AdminUser, SuperAdminUser, LoginCredentials, NewAdminData } from './types';

// Mock user database
let users: User[] = [
  // Pre-created super admin
  {
    id: 'super-001',
    name: 'Super Admin',
    email: 'super@authstation.com',
    password: 'super-password', // In a real app, this would be a hashed password
    role: 'superadmin',
    createdAt: new Date().toISOString(),
    devices: 1,
    plan: 'Enterprise',
  },
];

const getSession = (): SuperAdminUser | AdminUser | null => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('auth-session');
  if (session) {
    return JSON.parse(session);
  }
  return null;
};

const setSession = (user: SuperAdminUser | AdminUser | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('auth-session', JSON.stringify(user));
  } else {
    localStorage.removeItem('auth-session');
  }
};

export const superAdminLogin = async (credentials: LoginCredentials): Promise<SuperAdminUser> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(
        (u) => u.email === credentials.email && u.role === 'superadmin'
      ) as User | undefined;

      if (user && user.password === credentials.password) {
        const sessionUser: SuperAdminUser = { id: user.id, name: user.name, email: user.email, role: 'superadmin' };
        setSession(sessionUser);
        resolve(sessionUser);
      } else {
        reject(new Error('Invalid credentials or not a super admin.'));
      }
    }, 1000);
  });
};

export const adminLogin = async (credentials: LoginCredentials): Promise<AdminUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(
          (u) => u.email === credentials.email && u.role === 'admin'
        ) as User | undefined;
  
        if (user && user.password === credentials.password) {
          const sessionUser: AdminUser = { id: user.id, name: user.name, email: user.email, role: 'admin', createdAt: user.createdAt, devices: user.devices, plan: user.plan };
          setSession(sessionUser);
          resolve(sessionUser);
        } else {
          reject(new Error('Admin account not found or invalid credentials.'));
        }
      }, 1000);
    });
  };

export const logout = async (): Promise<void> => {
  setSession(null);
  return Promise.resolve();
};

export const createAdmin = async (adminData: NewAdminData): Promise<AdminUser> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const currentUser = getSession();
            if(!currentUser || currentUser.role !== 'superadmin') {
                return reject(new Error('Unauthorized: Only super admins can create new admins.'));
            }

            if (users.some(u => u.email === adminData.email)) {
                return reject(new Error('An account with this email already exists.'));
            }

            const newAdmin: User = {
                id: `admin-${Date.now()}`,
                ...adminData,
                role: 'admin',
                createdAt: new Date().toISOString(),
                devices: 1,
                plan: 'Free',
            };
            users.push(newAdmin);
            
            const adminUser: AdminUser = { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email, role: 'admin', createdAt: newAdmin.createdAt, devices: newAdmin.devices, plan: newAdmin.plan };
            console.log('Current users:', users);
            resolve(adminUser);
        }, 1000);
    });
};

export const getAdmins = async (): Promise<AdminUser[]> => {
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          const currentUser = getSession();
          if(!currentUser || currentUser.role !== 'superadmin') {
              return reject(new Error('Unauthorized: Only super admins can view admins.'));
          }
          const admins = users
            .filter(u => u.role === 'admin')
            .map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: 'admin' as const,
                createdAt: u.createdAt,
                devices: u.devices,
                plan: u.plan,
            }));
          resolve(admins);
      }, 500);
  });
};

export const checkAuth = async (): Promise<SuperAdminUser | AdminUser | null> => {
  return getSession();
};