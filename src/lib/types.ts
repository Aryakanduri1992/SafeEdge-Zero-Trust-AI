export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';

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
  plan: Plan;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  createdAt: string;
  devices: number;
  plan: Plan;
}

export interface SuperAdminUser extends BaseUser {
  role: 'superadmin';
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<LoginCredentials> & { name: string };

export type UpdateAdminData = {
  plan: Plan;
  devices: number;
};
