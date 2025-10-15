export type UserRole = 'admin' | 'superadmin';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User extends BaseUser {
  password?: string;
  createdAt: string;
  devices: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  createdAt: string;
  devices: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

export interface SuperAdminUser extends BaseUser {
  role: 'superadmin';
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<LoginCredentials> & { name: string };